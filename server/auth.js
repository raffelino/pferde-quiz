// Anmeldung: Google-ID-Token prüfen und Sitzungen verwalten.
//
// Der Server vertraut dem Client nichts an: Das ID-Token wird vollständig
// geprüft (Signatur gegen Googles öffentliche Schlüssel, Aussteller, Empfänger,
// Gültigkeitszeitraum), erst danach entsteht eine Sitzung.

import { createHash, createPublicKey, randomBytes, verify as verifySignature } from 'node:crypto';

export const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
export const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const CLOCK_SKEW_MS = 60_000;          // Toleranz für ungenaue Uhren
const SESSION_TOKEN_BYTES = 32;

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

const b64urlToBuffer = str => Buffer.from(String(str).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const decodeJson = part => JSON.parse(b64urlToBuffer(part).toString('utf8'));

/**
 * Holt Googles öffentliche Schlüssel und merkt sie sich, solange Google es
 * erlaubt (Cache-Control: max-age).
 */
export function createGoogleJwksProvider({ url = GOOGLE_JWKS_URL, fetchImpl = fetch } = {}) {
  let cache = { keys: [], expiresAt: 0 };
  return async function getKeys(force = false) {
    const now = Date.now();
    if (!force && cache.expiresAt > now && cache.keys.length) return cache.keys;

    const res = await fetchImpl(url);
    if (!res.ok) throw new AuthError('jwks_unavailable', `Schlüssel nicht abrufbar (HTTP ${res.status})`);
    const body = await res.json();
    const maxAge = /max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1];
    cache = {
      keys: Array.isArray(body.keys) ? body.keys : [],
      expiresAt: now + (maxAge ? Number(maxAge) * 1000 : 3600_000)
    };
    return cache.keys;
  };
}

/**
 * Google-ID-Token prüfen.
 * @param {string} token
 * @param {{clientId: string, getKeys: Function, now?: number}} opts
 * @returns {Promise<object>} geprüfte Nutzdaten
 */
export async function verifyGoogleIdToken(token, { clientId, getKeys, now = Date.now() }) {
  if (!clientId) throw new AuthError('not_configured', 'GOOGLE_CLIENT_ID ist nicht gesetzt');
  if (typeof token !== 'string' || token.length > 8192) {
    throw new AuthError('invalid_token', 'Kein gültiges Token');
  }

  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError('invalid_token', 'Token hat nicht drei Teile');

  let header, payload;
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    throw new AuthError('invalid_token', 'Token lässt sich nicht lesen');
  }

  if (header.alg !== 'RS256') throw new AuthError('invalid_alg', `Signaturverfahren ${header.alg} wird nicht akzeptiert`);

  // Signatur prüfen – erst danach zählt irgendetwas aus dem Token.
  const signed = Buffer.from(`${parts[0]}.${parts[1]}`, 'utf8');
  const signature = b64urlToBuffer(parts[2]);

  let keys = await getKeys();
  let jwk = keys.find(k => k.kid === header.kid);
  if (!jwk) {                     // Schlüsselwechsel bei Google -> einmal neu laden
    keys = await getKeys(true);
    jwk = keys.find(k => k.kid === header.kid);
  }
  if (!jwk) throw new AuthError('unknown_key', 'Signaturschlüssel unbekannt');

  let ok = false;
  try {
    ok = verifySignature('RSA-SHA256', signed, createPublicKey({ key: jwk, format: 'jwk' }), signature);
  } catch {
    ok = false;
  }
  if (!ok) throw new AuthError('bad_signature', 'Signatur stimmt nicht');

  if (!GOOGLE_ISSUERS.has(payload.iss)) throw new AuthError('bad_issuer', 'Falscher Aussteller');
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(clientId)) throw new AuthError('bad_audience', 'Token gehört zu einer anderen Anwendung');
  if (!payload.sub) throw new AuthError('no_subject', 'Token ohne Nutzerkennung');

  const exp = Number(payload.exp) * 1000;
  const iat = Number(payload.iat) * 1000;
  const nbf = payload.nbf ? Number(payload.nbf) * 1000 : null;
  if (!Number.isFinite(exp) || exp + CLOCK_SKEW_MS < now) throw new AuthError('expired', 'Token ist abgelaufen');
  if (Number.isFinite(iat) && iat - CLOCK_SKEW_MS > now) throw new AuthError('not_yet_valid', 'Token liegt in der Zukunft');
  if (nbf !== null && nbf - CLOCK_SKEW_MS > now) throw new AuthError('not_yet_valid', 'Token noch nicht gültig');

  return payload;
}

/* ------------------------------------------------------------ Nutzer */

export function upsertUser(db, profile, now = Date.now()) {
  const existing = db.prepare('SELECT * FROM users WHERE google_sub = ?').get(profile.sub);
  if (existing) {
    db.prepare('UPDATE users SET email = ?, name = ?, picture = ?, last_seen_at = ? WHERE id = ?')
      .run(profile.email ?? null, profile.name ?? null, profile.picture ?? null, now, existing.id);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
  }
  const info = db.prepare(`INSERT INTO users (google_sub, email, name, picture, created_at, last_seen_at)
                           VALUES (?, ?, ?, ?, ?, ?)`)
    .run(profile.sub, profile.email ?? null, profile.name ?? null, profile.picture ?? null, now, now);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
}

/* --------------------------------------------------------- Sitzungen */

export const hashToken = token => createHash('sha256').update(token).digest('hex');

export function createSession(db, userId, { userAgent = null, days = 90, now = Date.now() } = {}) {
  const token = randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
  const expiresAt = now + days * 86_400_000;
  db.prepare(`INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_used_at, user_agent)
              VALUES (?, ?, ?, ?, ?, ?)`)
    .run(hashToken(token), userId, now, expiresAt, now, userAgent ? String(userAgent).slice(0, 200) : null);
  return { token, expiresAt };
}

/**
 * Sitzung auflösen. Abgelaufene Sitzungen werden gelöscht, gültige verlängert
 * (gleitendes Fenster), damit aktive Nutzerinnen nicht plötzlich rausfliegen.
 */
export function resolveSession(db, token, { days = 90, now = Date.now(), renewAfterMs = 86_400_000 } = {}) {
  if (!token) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(hashToken(token));
  if (!row) return null;
  if (row.expires_at <= now) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash);
    return null;
  }
  if (now - row.last_used_at > renewAfterMs) {
    db.prepare('UPDATE sessions SET last_used_at = ?, expires_at = ? WHERE token_hash = ?')
      .run(now, now + days * 86_400_000, row.token_hash);
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
  if (!user) return null;
  return { user, session: row };
}

export function deleteSession(db, token) {
  if (!token) return false;
  return db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token)).changes > 0;
}

export function deleteExpiredSessions(db, now = Date.now()) {
  return db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now).changes;
}

export function bearerToken(req) {
  const header = req.headers?.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}
