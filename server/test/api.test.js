// Die API von außen: echte HTTP-Aufrufe gegen einen laufenden Server.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { startTestServer, answerEvent, createKeyMaterial, signIdToken, TEST_CLIENT_ID } from './helpers.js';
import { QUESTION_IDS } from '../questions.js';

const [FRAGE_A, FRAGE_B] = [...QUESTION_IDS];

describe('API', () => {
  let srv;
  before(async () => { srv = await startTestServer(); });
  after(async () => { await srv.close(); });

  test('meldet ihren Zustand', async () => {
    const res = await srv.call('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.ok(res.body.questions > 200, 'Fragenpool sollte geladen sein');
    assert.equal(res.body.googleLogin, true);
  });

  test('nennt dem Frontend die Client-ID', async () => {
    const res = await srv.call('GET', '/api/config');
    assert.equal(res.body.googleClientId, TEST_CLIENT_ID);
  });

  test('tauscht ein Google-Token gegen eine Sitzung', async () => {
    const res = await srv.call('POST', '/api/auth/google', { body: { credential: srv.signIdToken() } });
    assert.equal(res.status, 200);
    assert.ok(res.body.token.length > 20);
    assert.equal(res.body.user.email, 'reiterin@example.test');
    assert.deepEqual(res.body.cards, {});
    assert.equal(res.body.state.round.pass, 1);
  });

  test('weist ein gefälschtes Token ab', async () => {
    const fremd = createKeyMaterial('fremd');
    const res = await srv.call('POST', '/api/auth/google', {
      body: { credential: signIdToken(fremd) }
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'unknown_key');
  });

  test('verlangt eine Anmeldung', async () => {
    for (const [method, pfad] of [['GET', '/api/me'], ['POST', '/api/answers'], ['PUT', '/api/state'], ['GET', '/api/stats']]) {
      const res = await srv.call(method, pfad, { body: {} });
      assert.equal(res.status, 401, `${method} ${pfad} muss 401 liefern`);
    }
  });

  test('weist ein erfundenes Sitzungstoken ab', async () => {
    const res = await srv.call('GET', '/api/me', { token: 'ausgedacht' });
    assert.equal(res.status, 401);
  });

  test('nimmt Antworten an und gibt den neuen Stand zurück', async () => {
    const { token } = await srv.login({ sub: 'lernerin-1' });
    const t = Date.now();
    const res = await srv.call('POST', '/api/answers', {
      token,
      body: {
        events: [
          answerEvent(FRAGE_A, true, { answeredAt: t }),
          answerEvent(FRAGE_B, false, { answeredAt: t + 100 })
        ]
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.applied, 2);
    assert.equal(res.body.cards[FRAGE_A].box, 2);
    assert.equal(res.body.cards[FRAGE_B].box, 1);
    assert.equal(res.body.totals.total, 2);

    const me = await srv.call('GET', '/api/me', { token });
    assert.equal(Object.keys(me.body.cards).length, 2);
  });

  test('meldet abgelehnte Ereignisse, verbucht aber die gültigen', async () => {
    const { token } = await srv.login({ sub: 'lernerin-2' });
    const res = await srv.call('POST', '/api/answers', {
      token,
      body: { events: [answerEvent(FRAGE_A, true), answerEvent('erfunden', true)] }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.applied, 1);
    assert.equal(res.body.rejected.length, 1);
    assert.match(res.body.rejected[0], /unbekannte Frage/);
  });

  test('lehnt eine Anfrage ganz ab, wenn nichts Gültiges dabei ist', async () => {
    const { token } = await srv.login({ sub: 'lernerin-3' });
    const res = await srv.call('POST', '/api/answers', { token, body: { events: [{ quatsch: true }] } });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'invalid_events');
  });

  test('übernimmt beim ersten Anmelden den lokal erlernten Stand', async () => {
    const { token } = await srv.login({ sub: 'umsteigerin' });
    const res = await srv.call('POST', '/api/import', {
      token,
      body: {
        cards: {
          [FRAGE_A]: { box: 4, right: 3, wrong: 1, streak: 2, seenAt: 12 },
          'gibt-es-nicht': { box: 5, right: 9, wrong: 0, streak: 9, seenAt: 1 }
        },
        totals: { right: 3, wrong: 1, total: 4, timeMs: 120000 }
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.imported, 1, 'unbekannte Fragen werden übersprungen');
    assert.equal(res.body.cards[FRAGE_A].box, 4);
    assert.equal(res.body.state.totals.timeMs, 120000);
  });

  test('übernimmt keinen zweiten Stand, wenn schon gelernt wurde', async () => {
    const { token } = await srv.login({ sub: 'schon-dabei' });
    await srv.call('POST', '/api/answers', { token, body: { events: [answerEvent(FRAGE_A, true)] } });

    const res = await srv.call('POST', '/api/import', {
      token, body: { cards: { [FRAGE_B]: { box: 5, right: 9, wrong: 0, streak: 9, seenAt: 1 } } }
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'already_started');
    assert.equal(Object.keys(res.body.cards).length, 1, 'der bestehende Stand bleibt unangetastet');
  });

  test('speichert Einstellungen und erkennt Konflikte', async () => {
    const { token, state } = await srv.login({ sub: 'lernerin-4' });

    const erst = await srv.call('PUT', '/api/state', {
      token, body: { settings: { session: 't20' }, revision: state.revision }
    });
    assert.equal(erst.status, 200);
    assert.equal(erst.body.state.settings.session, 't20');

    const zweit = await srv.call('PUT', '/api/state', {
      token, body: { settings: { session: 'c20' }, revision: state.revision }
    });
    assert.equal(zweit.status, 409);
    assert.equal(zweit.body.error.code, 'revision_conflict');
    assert.equal(zweit.body.state.settings.session, 't20');
  });

  test('liefert eine Auswertung', async () => {
    const { token } = await srv.login({ sub: 'lernerin-5' });
    await srv.call('POST', '/api/answers', { token, body: { events: [answerEvent(FRAGE_A, false)] } });

    const res = await srv.call('GET', '/api/stats', { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.cardCount, 1);
    assert.equal(res.body.boxes[0], 1);
    assert.ok(res.body.byCategory);
  });

  test('trennt zwei Konten sauber', async () => {
    const anna = await srv.login({ sub: 'anna', email: 'anna@example.test' });
    const bea = await srv.login({ sub: 'bea', email: 'bea@example.test' });

    await srv.call('POST', '/api/answers', { token: anna.token, body: { events: [answerEvent(FRAGE_A, true)] } });

    const beaSicht = await srv.call('GET', '/api/me', { token: bea.token });
    assert.deepEqual(beaSicht.body.cards, {}, 'Bea darf Annas Karten nicht sehen');
    assert.notEqual(anna.user.id, bea.user.id);
  });

  test('meldet ab und macht das Token ungültig', async () => {
    const { token } = await srv.login({ sub: 'lernerin-6' });
    const abmelden = await srv.call('POST', '/api/auth/logout', { token });
    assert.equal(abmelden.status, 204);

    const danach = await srv.call('GET', '/api/me', { token });
    assert.equal(danach.status, 401);
  });

  test('löscht ein Konto mitsamt Daten', async () => {
    const { token, user } = await srv.login({ sub: 'lernerin-7' });
    await srv.call('POST', '/api/answers', { token, body: { events: [answerEvent(FRAGE_A, true)] } });

    const res = await srv.call('DELETE', '/api/me', { token });
    assert.equal(res.status, 204);
    assert.equal((await srv.call('GET', '/api/me', { token })).status, 401);
    assert.equal(srv.db.prepare('SELECT COUNT(*) AS n FROM answers WHERE user_id = ?').get(user.id).n, 0);
  });

  test('antwortet auf Unbekanntes mit 404 und auf falsche Methoden mit 405', async () => {
    assert.equal((await srv.call('GET', '/api/gibtsnicht')).status, 404);
    assert.equal((await srv.call('DELETE', '/api/health')).status, 405);
  });

  test('lehnt kaputtes JSON ab', async () => {
    const res = await fetch(`${srv.base}/api/auth/google`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{kaputt'
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, 'invalid_json');
  });

  test('lehnt übergroße Anfragen ab', async () => {
    const { token } = await srv.login({ sub: 'lernerin-8' });
    const res = await fetch(`${srv.base}/api/answers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ events: [], füllung: 'x'.repeat(1_100_000) })
    }).catch(err => ({ status: 0, err }));
    assert.ok(res.status === 413 || res.status === 0, `erwartet 413, bekam ${res.status}`);
  });
});

describe('Absicherung', () => {
  test('bremst zu viele Anmeldeversuche aus', async () => {
    const { createRateLimiter } = await import('../ratelimit.js');
    const srv = await startTestServer({
      app: { authLimiter: createRateLimiter({ capacity: 10, refillPerSecond: 0.1 }) }
    });
    let gebremst = false;
    for (let i = 0; i < 15; i++) {
      const res = await srv.call('POST', '/api/auth/google', { body: { credential: 'unsinn' } });
      if (res.status === 429) { gebremst = true; break; }
    }
    assert.equal(gebremst, true, 'nach mehreren Fehlversuchen muss die API bremsen');
    await srv.close();
  });

  test('schaltet die Test-Anmeldung ab, wenn sie nicht erlaubt ist', async () => {
    const srv = await startTestServer({ app: { allowTestLogin: false } });
    const res = await srv.call('POST', '/api/auth/test', { body: { sub: 'schummel' } });
    assert.equal(res.status, 404);
    await srv.close();
  });

  test('antwortet ohne konfigurierte Ursprünge nicht mit CORS-Freigabe', async () => {
    const srv = await startTestServer();
    const res = await srv.call('GET', '/api/health', { headers: { origin: 'https://boese.example' } });
    assert.equal(res.headers.get('access-control-allow-origin'), null);
    await srv.close();
  });

  test('gibt konfigurierte Ursprünge frei', async () => {
    const srv = await startTestServer({ app: { allowedOrigins: ['https://name.github.io'] } });
    const res = await srv.call('GET', '/api/health', { headers: { origin: 'https://name.github.io' } });
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://name.github.io');
    await srv.close();
  });
});
