// SPDX-License-Identifier: Apache-2.0
// Anmeldung: Prüfung der Google-Tokens und Verwaltung der Sitzungen.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  AuthError, createSession, deleteExpiredSessions, deleteSession, hashToken,
  resolveSession, upsertUser, verifyGoogleIdToken
} from '../auth.js';
import { openDatabase } from '../db.js';
import { createKeyMaterial, signIdToken, TEST_CLIENT_ID } from './helpers.js';

const keys = createKeyMaterial();
const getKeys = async () => [keys.jwk];

describe('Google-ID-Token prüfen', () => {
  test('nimmt ein korrektes Token an', async () => {
    const payload = await verifyGoogleIdToken(signIdToken(keys), { clientId: TEST_CLIENT_ID, getKeys });
    assert.equal(payload.sub, '110000000000000000001');
    assert.equal(payload.email, 'reiterin@example.test');
  });

  test('lehnt ein Token für eine andere Anwendung ab', async () => {
    await assert.rejects(
      () => verifyGoogleIdToken(signIdToken(keys, { aud: 'fremde-app.apps.googleusercontent.com' }),
        { clientId: TEST_CLIENT_ID, getKeys }),
      err => err instanceof AuthError && err.code === 'bad_audience'
    );
  });

  test('lehnt einen fremden Aussteller ab', async () => {
    await assert.rejects(
      () => verifyGoogleIdToken(signIdToken(keys, { iss: 'https://boese.example' }),
        { clientId: TEST_CLIENT_ID, getKeys }),
      err => err.code === 'bad_issuer'
    );
  });

  test('lehnt ein abgelaufenes Token ab', async () => {
    const past = Math.floor(Date.now() / 1000) - 7200;
    await assert.rejects(
      () => verifyGoogleIdToken(signIdToken(keys, { iat: past, exp: past + 3600 }),
        { clientId: TEST_CLIENT_ID, getKeys }),
      err => err.code === 'expired'
    );
  });

  test('lehnt ein Token aus der Zukunft ab', async () => {
    const future = Math.floor(Date.now() / 1000) + 7200;
    await assert.rejects(
      () => verifyGoogleIdToken(signIdToken(keys, { iat: future, exp: future + 3600 }),
        { clientId: TEST_CLIENT_ID, getKeys }),
      err => err.code === 'not_yet_valid'
    );
  });

  test('lehnt eine gefälschte Signatur ab', async () => {
    await assert.rejects(
      () => verifyGoogleIdToken(signIdToken(keys, {}, { sign: false }), { clientId: TEST_CLIENT_ID, getKeys }),
      err => err.code === 'bad_signature'
    );
  });

  test('lehnt ein Token ab, dessen Nutzdaten nachträglich geändert wurden', async () => {
    const token = signIdToken(keys);
    const [header, , signature] = token.split('.');
    const gefälscht = Buffer.from(JSON.stringify({
      iss: 'https://accounts.google.com', aud: TEST_CLIENT_ID, sub: 'fremde-kennung',
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    await assert.rejects(
      () => verifyGoogleIdToken(`${header}.${gefälscht}.${signature}`, { clientId: TEST_CLIENT_ID, getKeys }),
      err => err.code === 'bad_signature'
    );
  });

  test('lehnt "alg: none" ab', async () => {
    await assert.rejects(
      () => verifyGoogleIdToken(signIdToken(keys, {}, { header: { alg: 'none' }, sign: false }),
        { clientId: TEST_CLIENT_ID, getKeys }),
      err => err.code === 'invalid_alg'
    );
  });

  test('lehnt ein Token mit unbekanntem Schlüssel ab', async () => {
    const fremd = createKeyMaterial('anderer-schluessel');
    await assert.rejects(
      () => verifyGoogleIdToken(signIdToken(fremd), { clientId: TEST_CLIENT_ID, getKeys }),
      err => err.code === 'unknown_key'
    );
  });

  test('meldet fehlende Konfiguration statt stillschweigend anzunehmen', async () => {
    await assert.rejects(
      () => verifyGoogleIdToken(signIdToken(keys), { clientId: '', getKeys }),
      err => err.code === 'not_configured'
    );
  });

  test('lädt bei unbekanntem Schlüssel die Schlüsselliste einmal neu', async () => {
    let aufrufe = 0;
    const spät = async (force) => {
      aufrufe++;
      return force ? [keys.jwk] : [];
    };
    const payload = await verifyGoogleIdToken(signIdToken(keys), { clientId: TEST_CLIENT_ID, getKeys: spät });
    assert.equal(payload.sub, '110000000000000000001');
    assert.equal(aufrufe, 2, 'Schlüsselliste sollte genau einmal nachgeladen werden');
  });
});

describe('Nutzer und Sitzungen', () => {
  test('legt Nutzer an und erkennt sie über google_sub wieder', () => {
    const db = openDatabase(':memory:');
    const erst = upsertUser(db, { sub: 'abc', email: 'alt@example.test', name: 'Alt' });
    const zweit = upsertUser(db, { sub: 'abc', email: 'neu@example.test', name: 'Neu' });

    assert.equal(erst.id, zweit.id, 'gleiche google_sub muss denselben Nutzer treffen');
    assert.equal(zweit.email, 'neu@example.test', 'geänderte E-Mail wird übernommen');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1);
    db.close();
  });

  test('speichert Sitzungstoken nur als Hash', () => {
    const db = openDatabase(':memory:');
    const user = upsertUser(db, { sub: 'abc' });
    const { token } = createSession(db, user.id);

    const zeilen = db.prepare('SELECT token_hash FROM sessions').all();
    assert.equal(zeilen.length, 1);
    assert.notEqual(zeilen[0].token_hash, token, 'Token darf nicht im Klartext liegen');
    assert.equal(zeilen[0].token_hash, hashToken(token));
    db.close();
  });

  test('löst gültige Sitzungen auf und weist unbekannte ab', () => {
    const db = openDatabase(':memory:');
    const user = upsertUser(db, { sub: 'abc' });
    const { token } = createSession(db, user.id);

    assert.equal(resolveSession(db, token).user.id, user.id);
    assert.equal(resolveSession(db, 'ausgedacht'), null);
    assert.equal(resolveSession(db, null), null);
    db.close();
  });

  test('entfernt abgelaufene Sitzungen beim Zugriff', () => {
    const db = openDatabase(':memory:');
    const user = upsertUser(db, { sub: 'abc' });
    const gestern = Date.now() - 86_400_000;
    const { token } = createSession(db, user.id, { days: 0.5, now: gestern });

    assert.equal(resolveSession(db, token), null, 'abgelaufene Sitzung gilt nicht mehr');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0, 'und wird gelöscht');
    db.close();
  });

  test('verlängert aktiv genutzte Sitzungen', () => {
    const db = openDatabase(':memory:');
    const user = upsertUser(db, { sub: 'abc' });
    const vorgestern = Date.now() - 2 * 86_400_000;
    const { token } = createSession(db, user.id, { days: 90, now: vorgestern });
    const vorher = db.prepare('SELECT expires_at FROM sessions').get().expires_at;

    resolveSession(db, token, { days: 90, now: Date.now() });
    const nachher = db.prepare('SELECT expires_at FROM sessions').get().expires_at;
    assert.ok(nachher > vorher, 'Ablauf sollte nach hinten wandern');
    db.close();
  });

  test('Abmelden macht das Token sofort ungültig', () => {
    const db = openDatabase(':memory:');
    const user = upsertUser(db, { sub: 'abc' });
    const { token } = createSession(db, user.id);

    assert.equal(deleteSession(db, token), true);
    assert.equal(resolveSession(db, token), null);
    db.close();
  });

  test('räumt abgelaufene Sitzungen im Stapel auf', () => {
    const db = openDatabase(':memory:');
    const user = upsertUser(db, { sub: 'abc' });
    createSession(db, user.id, { days: 1, now: Date.now() - 5 * 86_400_000 });
    createSession(db, user.id, { days: 90 });

    assert.equal(deleteExpiredSessions(db), 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 1);
    db.close();
  });

  test('Löschen eines Nutzers räumt seine Sitzungen mit ab', () => {
    const db = openDatabase(':memory:');
    const user = upsertUser(db, { sub: 'abc' });
    createSession(db, user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
    db.close();
  });
});
