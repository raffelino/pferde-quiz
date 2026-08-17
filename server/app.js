// Zusammenbau der API. createApp() liefert einen Request-Handler – dadurch
// lässt sich alles testen, ohne einen echten Port zu belegen.

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  applyCors, clientIp, createRouter, HttpError, readJsonBody, sendError, sendJson
} from './http.js';
import { createRateLimiter } from './ratelimit.js';
import { createStaticHandler } from './static.js';
import { QUESTION_IDS, QUESTIONS_BY_ID, questionSummary } from './questions.js';
import {
  AuthError, bearerToken, createGoogleJwksProvider, createSession, deleteExpiredSessions,
  deleteSession, resolveSession, upsertUser, verifyGoogleIdToken
} from './auth.js';
import {
  applyAnswers, buildStats, deleteUser, importBaseline, readCards, readState, validateEvents, writeState
} from './sync.js';
import { APP_VERSION } from '../js/version.js';

const HERE = dirname(fileURLToPath(import.meta.url));

export function createApp(db, options = {}) {
  const config = {
    googleClientId: options.googleClientId || '',
    allowedOrigins: options.allowedOrigins || [],
    sessionDays: options.sessionDays ?? 90,
    allowTestLogin: !!options.allowTestLogin,
    serveStatic: options.serveStatic !== false,
    staticRoot: options.staticRoot || resolve(HERE, '..'),
    trustProxy: !!options.trustProxy,
    now: options.now || (() => Date.now())
  };

  const getKeys = options.getKeys || createGoogleJwksProvider();
  const serveStatic = config.serveStatic ? createStaticHandler(config.staticRoot) : null;

  // Anmeldeversuche deutlich strenger begrenzen als normale Aufrufe.
  const authLimiter = options.authLimiter || createRateLimiter({ capacity: 10, refillPerSecond: 0.1 });
  const apiLimiter = options.apiLimiter || createRateLimiter({ capacity: 120, refillPerSecond: 2 });

  const router = createRouter();

  const requireUser = (req) => {
    const found = resolveSession(db, bearerToken(req), { days: config.sessionDays, now: config.now() });
    if (!found) throw new HttpError(401, 'unauthorized', 'Bitte anmelden');
    return found.user;
  };

  const publicUser = user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    createdAt: user.created_at
  });

  /* ------------------------------------------------------------ Routen */

  router.add('GET', '/api/health', async (req, res) => {
    const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
    sendJson(res, 200, {
      ok: true,
      version: APP_VERSION,
      questions: questionSummary().count,
      users,
      googleLogin: !!config.googleClientId,
      testLogin: config.allowTestLogin
    });
  });

  router.add('GET', '/api/config', async (req, res) => {
    sendJson(res, 200, {
      googleClientId: config.googleClientId || null,
      testLogin: config.allowTestLogin,
      version: APP_VERSION
    });
  });

  router.add('POST', '/api/auth/google', async (req, res) => {
    const ip = clientIp(req, config);
    const gate = authLimiter.take(`auth:${ip}`);
    if (!gate.allowed) {
      return sendError(res, 429, 'rate_limited', `Zu viele Anmeldeversuche, bitte in ${gate.retryAfter}s erneut`);
    }

    const body = await readJsonBody(req);
    const credential = body.credential || body.idToken;
    let payload;
    try {
      payload = await verifyGoogleIdToken(credential, {
        clientId: config.googleClientId, getKeys, now: config.now()
      });
    } catch (err) {
      if (err instanceof AuthError) {
        const status = err.code === 'not_configured' ? 503 : 401;
        return sendError(res, status, err.code, err.message);
      }
      throw err;
    }

    const now = config.now();
    const user = upsertUser(db, {
      sub: payload.sub,
      email: payload.email_verified ? payload.email : null,
      name: payload.name,
      picture: payload.picture
    }, now);
    const session = createSession(db, user.id, {
      userAgent: req.headers['user-agent'], days: config.sessionDays, now
    });
    deleteExpiredSessions(db, now);

    sendJson(res, 200, {
      token: session.token,
      expiresAt: session.expiresAt,
      user: publicUser(user),
      state: readState(db, user.id),
      cards: readCards(db, user.id)
    });
  });

  // Nur für Tests und lokale Entwicklung – in der Produktion abgeschaltet.
  router.add('POST', '/api/auth/test', async (req, res) => {
    if (!config.allowTestLogin) return sendError(res, 404, 'not_found', 'Unbekannter Endpunkt');
    const body = await readJsonBody(req);
    const sub = typeof body.sub === 'string' && body.sub ? body.sub : 'test-user';
    const now = config.now();
    const user = upsertUser(db, {
      sub, email: body.email ?? `${sub}@example.test`, name: body.name ?? 'Testnutzerin', picture: null
    }, now);
    const session = createSession(db, user.id, { days: config.sessionDays, now });
    sendJson(res, 200, {
      token: session.token,
      expiresAt: session.expiresAt,
      user: publicUser(user),
      state: readState(db, user.id),
      cards: readCards(db, user.id)
    });
  });

  router.add('POST', '/api/auth/logout', async (req, res) => {
    deleteSession(db, bearerToken(req));
    res.writeHead(204).end();
  });

  router.add('GET', '/api/me', async (req, res) => {
    const user = requireUser(req);
    sendJson(res, 200, {
      user: publicUser(user),
      state: readState(db, user.id),
      cards: readCards(db, user.id)
    });
  });

  router.add('DELETE', '/api/me', async (req, res) => {
    const user = requireUser(req);
    deleteUser(db, user.id);
    res.writeHead(204).end();
  });

  router.add('POST', '/api/answers', async (req, res) => {
    const user = requireUser(req);
    const body = await readJsonBody(req);
    const { clean, problems } = validateEvents(body.events, {
      knownQuestionIds: QUESTION_IDS, now: config.now()
    });
    if (!clean.length && problems.length) {
      return sendError(res, 400, 'invalid_events', problems.slice(0, 5).join('; '));
    }

    const result = applyAnswers(db, user.id, clean, config.now());
    sendJson(res, 200, { ...result, rejected: problems });
  });

  // Einmaliger Übertrag des lokal erlernten Stands beim ersten Anmelden.
  router.add('POST', '/api/import', async (req, res) => {
    const user = requireUser(req);
    const body = await readJsonBody(req);
    const result = importBaseline(db, user.id, {
      cards: body.cards || {}, totals: body.totals || {}
    }, QUESTION_IDS, config.now());

    if (result.conflict) {
      return sendJson(res, 409, {
        error: { code: 'already_started', message: 'Für dieses Konto gibt es bereits Lernfortschritt' },
        cards: result.cards, state: result.state
      });
    }
    sendJson(res, 200, result);
  });

  router.add('PUT', '/api/state', async (req, res) => {
    const user = requireUser(req);
    const body = await readJsonBody(req);
    const result = writeState(db, user.id, {
      settings: body.settings,
      round: body.round,
      timeMs: body.timeMs,
      revision: Number.isFinite(body.revision) ? body.revision : undefined
    }, config.now());

    if (result.conflict) {
      return sendJson(res, 409, {
        error: { code: 'revision_conflict', message: 'Ein anderes Gerät war schneller' },
        state: result.state
      });
    }
    sendJson(res, 200, { state: result.state });
  });

  router.add('GET', '/api/stats', async (req, res) => {
    const user = requireUser(req);
    sendJson(res, 200, buildStats(db, user.id, QUESTIONS_BY_ID));
  });

  /* ---------------------------------------------------------- Verteiler */

  return async function handler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    applyCors(req, res, config.allowedOrigins);
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }

    try {
      if (pathname.startsWith('/api/')) {
        const ip = clientIp(req, config);
        const gate = apiLimiter.take(`api:${ip}`);
        if (!gate.allowed) {
          return sendError(res, 429, 'rate_limited', `Zu viele Anfragen, bitte in ${gate.retryAfter}s erneut`);
        }

        const route = router.find(req.method, pathname);
        if (!route) {
          const status = router.has(pathname) ? 405 : 404;
          return sendError(res, status, status === 405 ? 'method_not_allowed' : 'not_found', 'Unbekannter Endpunkt');
        }
        await route(req, res);
        return;
      }

      if (serveStatic && serveStatic(req, res, pathname)) return;
      sendError(res, 404, 'not_found', 'Nicht gefunden');
    } catch (err) {
      if (err instanceof HttpError) return sendError(res, err.status, err.code, err.message);
      console.error('Serverfehler:', err);
      if (!res.headersSent) sendError(res, 500, 'internal_error', 'Interner Fehler');
      else res.end();
    }
  };
}
