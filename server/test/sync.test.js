// SPDX-License-Identifier: Apache-2.0
// Abgleich: Ereignisse verbuchen, Kartenstände ableiten, Zustand speichern.
// Hier steckt die eigentliche Konsistenzzusage des Backends.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase } from '../db.js';
import { upsertUser } from '../auth.js';
import {
  applyAnswers, buildStats, deleteUser, readCards, readState,
  validateEvents, writeState, MAX_EVENTS_PER_REQUEST
} from '../sync.js';
import { QUESTION_IDS, QUESTIONS_BY_ID } from '../questions.js';
import { answerEvent } from './helpers.js';

const [FRAGE_A, FRAGE_B] = [...QUESTION_IDS];

function setup() {
  const db = openDatabase(':memory:');
  const user = upsertUser(db, { sub: 'test-sub' });
  return { db, userId: user.id };
}

describe('Ereignisse prüfen', () => {
  test('nimmt saubere Ereignisse an', () => {
    const { clean, problems } = validateEvents([answerEvent(FRAGE_A, true)], { knownQuestionIds: QUESTION_IDS });
    assert.equal(clean.length, 1);
    assert.deepEqual(problems, []);
  });

  test('lehnt unbekannte Fragen ab', () => {
    const { clean, problems } = validateEvents([answerEvent('gibt-es-nicht', true)], { knownQuestionIds: QUESTION_IDS });
    assert.equal(clean.length, 0);
    assert.match(problems[0], /unbekannte Frage/);
  });

  test('verlangt true oder false, nicht "ja"', () => {
    const kaputt = { ...answerEvent(FRAGE_A, true), correct: 'ja' };
    const { clean, problems } = validateEvents([kaputt], { knownQuestionIds: QUESTION_IDS });
    assert.equal(clean.length, 0);
    assert.match(problems[0], /correct/);
  });

  test('lehnt Zeitstempel weit in der Zukunft ab', () => {
    const kaputt = answerEvent(FRAGE_A, true, { answeredAt: Date.now() + 10 * 86_400_000 });
    const { clean } = validateEvents([kaputt], { knownQuestionIds: QUESTION_IDS });
    assert.equal(clean.length, 0);
  });

  test('lehnt dieselbe eventId zweimal in einer Anfrage ab', () => {
    const event = answerEvent(FRAGE_A, true, { eventId: 'gleich' });
    const { clean, problems } = validateEvents([event, { ...event }], { knownQuestionIds: QUESTION_IDS });
    assert.equal(clean.length, 1);
    assert.match(problems[0], /doppelt/);
  });

  test('begrenzt die Menge pro Anfrage', () => {
    const zuViele = Array.from({ length: MAX_EVENTS_PER_REQUEST + 1 }, () => answerEvent(FRAGE_A, true));
    const { clean, problems } = validateEvents(zuViele, { knownQuestionIds: QUESTION_IDS });
    assert.equal(clean.length, 0);
    assert.match(problems[0], /höchstens/);
  });
});

describe('Antworten verbuchen', () => {
  test('legt eine Karte an und schiebt sie ins nächste Fach', () => {
    const { db, userId } = setup();
    const result = applyAnswers(db, userId, [answerEvent(FRAGE_A, true)]);

    assert.equal(result.applied, 1);
    assert.equal(result.cards[FRAGE_A].box, 2);
    assert.equal(result.cards[FRAGE_A].right, 1);
    assert.equal(result.totals.total, 1);
    assert.equal(result.totals.right, 1);
    db.close();
  });

  test('setzt eine falsche Antwort zurück auf Fach 1', () => {
    const { db, userId } = setup();
    const t = Date.now();
    applyAnswers(db, userId, [
      answerEvent(FRAGE_A, true, { answeredAt: t }),
      answerEvent(FRAGE_A, true, { answeredAt: t + 1000 }),
      answerEvent(FRAGE_A, false, { answeredAt: t + 2000 })
    ]);
    const karten = readCards(db, userId);
    assert.equal(karten[FRAGE_A].box, 1);
    assert.equal(karten[FRAGE_A].streak, 0);
    assert.equal(karten[FRAGE_A].wrong, 1);
    db.close();
  });

  test('verbucht dasselbe Ereignis kein zweites Mal', () => {
    const { db, userId } = setup();
    const event = answerEvent(FRAGE_A, true);

    const erst = applyAnswers(db, userId, [event]);
    const zweit = applyAnswers(db, userId, [event]);          // erneutes Senden nach Netzabbruch
    const dritt = applyAnswers(db, userId, [event, event]);   // sogar doppelt in einer Anfrage

    assert.equal(erst.applied, 1);
    assert.equal(zweit.applied, 0);
    assert.equal(zweit.duplicates, 1);
    assert.equal(dritt.applied, 0);
    assert.equal(readCards(db, userId)[FRAGE_A].box, 2, 'Karte darf nur einmal wandern');
    assert.equal(readState(db, userId).totals.total, 1);
    db.close();
  });

  test('liefert denselben Kartenstand, egal in welcher Reihenfolge zwei Geräte senden', () => {
    const t = Date.now();
    const verlauf = [
      answerEvent(FRAGE_A, true, { answeredAt: t, eventId: 'e1' }),
      answerEvent(FRAGE_A, true, { answeredAt: t + 1000, eventId: 'e2' }),
      answerEvent(FRAGE_A, false, { answeredAt: t + 2000, eventId: 'e3' }),
      answerEvent(FRAGE_A, true, { answeredAt: t + 3000, eventId: 'e4' })
    ];

    // Gerät 1 lädt alles der Reihe nach hoch
    const a = setup();
    applyAnswers(a.db, a.userId, verlauf);
    const erwartet = readCards(a.db, a.userId)[FRAGE_A];
    a.db.close();

    // Gerät 2 war offline und liefert die Ereignisse später und verdreht nach
    const b = setup();
    applyAnswers(b.db, b.userId, [verlauf[3]]);
    applyAnswers(b.db, b.userId, [verlauf[1], verlauf[0]]);
    applyAnswers(b.db, b.userId, [verlauf[2]]);
    const tatsächlich = readCards(b.db, b.userId)[FRAGE_A];
    b.db.close();

    assert.deepEqual(tatsächlich, erwartet,
      'Der Kartenstand muss aus der Lernreihenfolge folgen, nicht aus der Sendereihenfolge');
  });

  test('rechnet die Summen aus dem Protokoll nach', () => {
    const { db, userId } = setup();
    const t = Date.now();
    applyAnswers(db, userId, [
      answerEvent(FRAGE_A, true, { answeredAt: t }),
      answerEvent(FRAGE_B, false, { answeredAt: t + 10 }),
      answerEvent(FRAGE_A, false, { answeredAt: t + 20 })
    ]);
    const { totals, seq } = readState(db, userId);
    assert.deepEqual(
      { right: totals.right, wrong: totals.wrong, total: totals.total },
      { right: 1, wrong: 2, total: 3 }
    );
    assert.equal(seq, 3);
    db.close();
  });

  test('zählt "zuletzt gesehen" über alle Fragen hinweg', () => {
    const { db, userId } = setup();
    const t = Date.now();
    applyAnswers(db, userId, [
      answerEvent(FRAGE_A, true, { answeredAt: t }),
      answerEvent(FRAGE_B, true, { answeredAt: t + 1000 })
    ]);
    const karten = readCards(db, userId);
    assert.ok(karten[FRAGE_B].seenAt > karten[FRAGE_A].seenAt,
      'die später beantwortete Frage muss die höhere Nummer haben');
    db.close();
  });
});

describe('Einstellungen und Rundenstand', () => {
  test('speichert und liest zurück', () => {
    const { db, userId } = setup();
    const vorher = readState(db, userId);
    const { state } = writeState(db, userId, {
      settings: { ...vorher.settings, session: 't10', prio: { hilfen: 3 } },
      round: { pass: 2, asked: [FRAGE_A], retry: [], counts: {}, recent: [FRAGE_A] },
      revision: vorher.revision
    });

    assert.equal(state.settings.session, 't10');
    assert.deepEqual(state.settings.prio, { hilfen: 3 });
    assert.equal(state.round.pass, 2);
    assert.equal(state.revision, vorher.revision + 1);
    db.close();
  });

  test('meldet einen Konflikt statt still zu überschreiben', () => {
    const { db, userId } = setup();
    const gelesen = readState(db, userId).revision;

    // Gerät 1 schreibt
    writeState(db, userId, { settings: { session: 't5' }, revision: gelesen });
    // Gerät 2 schreibt mit der alten Revision
    const zweit = writeState(db, userId, { settings: { session: 'c20' }, revision: gelesen });

    assert.equal(zweit.conflict, true);
    assert.equal(zweit.state.settings.session, 't5', 'der zuerst geschriebene Stand bleibt');
    db.close();
  });

  test('lässt die Lernzeit nur wachsen', () => {
    const { db, userId } = setup();
    writeState(db, userId, { timeMs: 60_000, revision: readState(db, userId).revision });
    writeState(db, userId, { timeMs: 10_000, revision: readState(db, userId).revision });
    assert.equal(readState(db, userId).totals.timeMs, 60_000);
    db.close();
  });

  test('bringt einen kaputten Rundenstand in Ordnung', () => {
    const { db, userId } = setup();
    const { state } = writeState(db, userId, {
      round: { pass: -5, asked: 'kein Array', retry: ['alte-form'], counts: null },
      revision: readState(db, userId).revision
    });
    assert.equal(state.round.pass, 1);
    assert.deepEqual(state.round.asked, []);
    assert.deepEqual(state.round.retry, [{ id: 'alte-form', dueAt: 0 }]);
    db.close();
  });
});

describe('Auswertung und Löschung', () => {
  test('fasst Fächer, Kategorien und Verlauf zusammen', () => {
    const { db, userId } = setup();
    const t = Date.now();
    applyAnswers(db, userId, [
      answerEvent(FRAGE_A, true, { answeredAt: t }),
      answerEvent(FRAGE_B, false, { answeredAt: t + 10 })
    ]);

    const stats = buildStats(db, userId, QUESTIONS_BY_ID);
    assert.equal(stats.cardCount, 2);
    assert.equal(stats.boxes.reduce((a, b) => a + b, 0), 2);
    assert.ok(stats.perDay.length >= 1);
    assert.ok(stats.hardest.some(h => h.questionId === FRAGE_B));
    assert.ok(stats.hardest[0].frage, 'Fragetext soll mitgeliefert werden');
    db.close();
  });

  test('löscht mit dem Konto alle Daten', () => {
    const { db, userId } = setup();
    applyAnswers(db, userId, [answerEvent(FRAGE_A, true)]);
    writeState(db, userId, { settings: { session: 't5' }, revision: readState(db, userId).revision });

    assert.equal(deleteUser(db, userId), true);
    for (const tabelle of ['answers', 'cards', 'user_state', 'sessions']) {
      const übrig = db.prepare(`SELECT COUNT(*) AS n FROM ${tabelle} WHERE user_id = ?`).get(userId).n;
      assert.equal(übrig, 0, `${tabelle} muss leer sein`);
    }
    db.close();
  });

  test('trennt die Daten zweier Nutzerinnen', () => {
    const db = openDatabase(':memory:');
    const anna = upsertUser(db, { sub: 'anna' });
    const bea = upsertUser(db, { sub: 'bea' });

    applyAnswers(db, anna.id, [answerEvent(FRAGE_A, true)]);
    applyAnswers(db, bea.id, [answerEvent(FRAGE_B, false)]);

    assert.deepEqual(Object.keys(readCards(db, anna.id)), [FRAGE_A]);
    assert.deepEqual(Object.keys(readCards(db, bea.id)), [FRAGE_B]);
    assert.equal(readState(db, anna.id).totals.right, 1);
    assert.equal(readState(db, bea.id).totals.right, 0);
    db.close();
  });
});
