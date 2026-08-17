// SPDX-License-Identifier: Apache-2.0
// Werkzeuge für die Servertests: echter HTTP-Server auf zufälligem Port,
// temporäre Datenbank, selbst signierte "Google"-Tokens.

import { createServer } from 'node:http';
import { generateKeyPairSync, createSign, randomUUID } from 'node:crypto';

import { openDatabase } from '../db.js';
import { createApp } from '../app.js';
import { createRateLimiter } from '../ratelimit.js';

export const TEST_CLIENT_ID = '1234567890-test.apps.googleusercontent.com';

/** Schlüsselpaar wie Googles Signaturschlüssel, inklusive JWKS-Ausgabe. */
export function createKeyMaterial(kid = 'test-key-1') {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' };
  return { privateKey, publicKey, jwk, kid };
}

const b64url = input => Buffer.from(input).toString('base64url');

/** ID-Token bauen und signieren – wie es Google ausstellen würde. */
export function signIdToken(keys, payload = {}, { header = {}, sign = true } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const fullHeader = { alg: 'RS256', kid: keys.kid, typ: 'JWT', ...header };
  const fullPayload = {
    iss: 'https://accounts.google.com',
    aud: TEST_CLIENT_ID,
    sub: '110000000000000000001',
    email: 'reiterin@example.test',
    email_verified: true,
    name: 'Test Reiterin',
    picture: 'https://example.test/bild.png',
    iat: now,
    exp: now + 3600,
    ...payload
  };

  const data = `${b64url(JSON.stringify(fullHeader))}.${b64url(JSON.stringify(fullPayload))}`;
  if (!sign) return `${data}.${b64url('keine-signatur')}`;
  const signer = createSign('RSA-SHA256');
  signer.update(data);
  signer.end();
  return `${data}.${signer.sign(keys.privateKey).toString('base64url')}`;
}

/**
 * Kompletter Server für einen Test. Rückgabe enthält Adresse, Datenbank,
 * Schlüsselmaterial und einen kleinen Aufruf-Helfer.
 */
export async function startTestServer(options = {}) {
  const keys = options.keys || createKeyMaterial();
  const db = openDatabase(':memory:');
  const app = createApp(db, {
    googleClientId: TEST_CLIENT_ID,
    allowTestLogin: true,
    serveStatic: false,
    getKeys: async () => [keys.jwk],
    // Tests melden sich oft an; die Bremse wird eigens getestet.
    authLimiter: createRateLimiter({ capacity: 1000, refillPerSecond: 100 }),
    apiLimiter: createRateLimiter({ capacity: 5000, refillPerSecond: 500 }),
    ...options.app
  });

  const server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const call = async (method, path, { body, token, headers = {} } = {}) => {
    // GET und HEAD dürfen keinen Body haben
    const sendBody = body !== undefined && method !== 'GET' && method !== 'HEAD';
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(sendBody ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      body: sendBody ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* kein JSON */ }
    return { status: res.status, headers: res.headers, body: json, text };
  };

  return {
    base, db, keys, call,
    signIdToken: (payload, opts) => signIdToken(keys, payload, opts),
    async login(payload = {}) {
      const res = await call('POST', '/api/auth/google', {
        body: { credential: signIdToken(keys, payload) }
      });
      if (res.status !== 200) throw new Error(`Anmeldung fehlgeschlagen: ${res.status} ${res.text}`);
      return res.body;
    },
    async close() {
      await new Promise(resolve => server.close(resolve));
      db.close();
    }
  };
}

/** Antwort-Ereignis wie es die App erzeugt. */
export function answerEvent(questionId, correct, { answeredAt = Date.now(), ms = 4200, eventId } = {}) {
  return { eventId: eventId || randomUUID(), questionId, correct, ms, answeredAt };
}
