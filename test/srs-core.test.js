// SPDX-License-Identifier: Apache-2.0
// Regressionstests der Lernlogik, die Browser und Server gemeinsam nutzen.
// Die ausführlichen Simulationen stehen in tools/, hier sind die Zusagen
// festgehalten, die nie wieder kaputtgehen dürfen.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_BOX, RETRY_MIN_GAP, applyAnswer, cardWeight, clearRetry, newCard, newRound,
  normalizeCard, normalizeRound, pickInRound, queueRetry, rebuildCard, retryDelay
} from '../js/core/srs-core.js';

const pool = (n, cat = 'a') => Array.from({ length: n }, (_, i) => ({ id: `q${i}`, cat }));

/**
 * Fester Zufall für Regressionstests. Ein Test, der mal durchgeht und mal
 * nicht, ist keine Zusage – deshalb bekommen die Rundenprüfungen eine
 * reproduzierbare Folge statt Math.random.
 */
const seeded = seed => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

describe('Karteikarte', () => {
  test('richtig beantwortet schiebt ein Fach weiter, falsch zurück auf 1', () => {
    let card = newCard();
    card = applyAnswer(card, true, 0).card;
    card = applyAnswer(card, true, 1).card;
    assert.equal(card.box, 3);
    assert.equal(card.streak, 2);

    card = applyAnswer(card, false, 2).card;
    assert.equal(card.box, 1);
    assert.equal(card.streak, 0);
    assert.equal(card.wrong, 1);
  });

  test('kommt nie über Fach 5 hinaus', () => {
    let card = newCard();
    for (let i = 0; i < 20; i++) card = applyAnswer(card, true, i).card;
    assert.equal(card.box, MAX_BOX);
  });

  test('meldet den Sprung nach Fach 5 genau einmal', () => {
    let card = newCard();
    const meldungen = [];
    for (let i = 0; i < 8; i++) {
      const { card: next, move } = applyAnswer(card, true, i);
      card = next;
      if (move.mastered) meldungen.push(i);
    }
    assert.equal(meldungen.length, 1, '"gelernt" darf nur beim Erreichen von Fach 5 kommen');
  });

  test('verändert die übergebene Karte nicht', () => {
    const card = newCard();
    applyAnswer(card, true, 0);
    assert.deepEqual(card, newCard());
  });

  test('rechnet denselben Stand aus derselben Antwortfolge', () => {
    const folge = [true, true, false, true, true];
    const a = rebuildCard(folge.map(correct => ({ correct })));
    let b = newCard();
    folge.forEach((correct, i) => { b = applyAnswer(b, correct, i).card; });
    assert.deepEqual({ ...a, seenAt: 0 }, { ...b, seenAt: 0 });
  });

  test('repariert unsinnige Werte', () => {
    const kaputt = normalizeCard({ box: 99, right: -3, wrong: 'viele', streak: null, seenAt: undefined });
    assert.equal(kaputt.box, MAX_BOX);
    assert.equal(kaputt.right, 0);
    assert.equal(kaputt.wrong, 0);
    assert.equal(kaputt.seenAt, -1);
  });
});

describe('Gewichtung', () => {
  test('neue Fragen kommen häufiger als beherrschte', () => {
    const neu = cardWeight(null, { seq: 100, recentWindow: 5 });
    const sitzt = cardWeight({ box: 5, right: 5, wrong: 0, streak: 5, seenAt: 0 }, { seq: 100, recentWindow: 5 });
    assert.ok(neu > sitzt * 5, `neu=${neu}, sitzt=${sitzt}`);
  });

  test('oft falsche Fragen wiegen schwerer als selten falsche', () => {
    const base = { box: 1, right: 0, streak: 0, seenAt: -1 };
    const selten = cardWeight({ ...base, wrong: 1 }, { seq: 100, recentWindow: 5 });
    const oft = cardWeight({ ...base, wrong: 5 }, { seq: 100, recentWindow: 5 });
    assert.ok(oft > selten);
  });

  test('gerade gestellte Fragen werden stark abgewertet', () => {
    const card = { box: 1, right: 0, wrong: 0, streak: 0, seenAt: 99 };
    const gerade = cardWeight(card, { seq: 100, recentWindow: 10 });
    const länger = cardWeight({ ...card, seenAt: 50 }, { seq: 100, recentWindow: 10 });
    assert.ok(gerade < länger / 5);
  });
});

describe('Runde', () => {
  test('stellt jede Frage genau einmal, bevor eine wiederkommt', () => {
    const p = pool(30);
    const round = newRound();
    const gesehen = [];
    let last = null;

    for (let i = 0; i < p.length; i++) {
      const { question } = pickInRound(p, round, { lastId: last });
      gesehen.push(question.id);
      last = question.id;
    }
    assert.equal(new Set(gesehen).size, p.length);
  });

  test('eine richtig beantwortete Frage kommt in derselben Runde nicht wieder', () => {
    const p = pool(25);
    const round = newRound();
    const richtigBeantwortet = new Set();
    let last = null;
    let verstöße = 0;

    for (let i = 0; i < 200; i++) {
      const { question, newPass } = pickInRound(p, round, { lastId: last });
      if (newPass) richtigBeantwortet.clear();
      if (richtigBeantwortet.has(question.id)) verstöße++;

      const correct = i % 5 !== 0;           // jede fünfte Antwort ist falsch
      if (correct) { clearRetry(round, question.id); richtigBeantwortet.add(question.id); }
      else queueRetry(round, question.id, p.length);
      last = question.id;
    }
    assert.equal(verstöße, 0);
  });

  test('wiederholt falsche Fragen frühestens nach dem Mindestabstand', () => {
    const p = pool(30);
    const round = newRound();
    const zuletzt = {};
    let last = null;
    let zuFrüh = 0;

    for (let i = 0; i < 120; i++) {
      const { question, retry } = pickInRound(p, round, { lastId: last });
      if (retry && zuletzt[question.id] !== undefined && i - zuletzt[question.id] < RETRY_MIN_GAP) zuFrüh++;
      const correct = question.id !== 'q7';   // q7 wird immer falsch beantwortet
      if (correct) clearRetry(round, question.id);
      else queueRetry(round, question.id, p.length);
      zuletzt[question.id] = i;
      last = question.id;
    }
    assert.equal(zuFrüh, 0);
  });

  test('streut den Abstand und legt beim zweiten Anlauf nach', () => {
    const r1 = seeded(11), r2 = seeded(22);
    const erste = Array.from({ length: 200 }, () => retryDelay(1, 250, r1));
    const zweite = Array.from({ length: 200 }, () => retryDelay(2, 250, r2));
    assert.ok(new Set(erste).size > 3, 'der Abstand darf nicht immer gleich sein');
    assert.ok(Math.min(...erste) >= RETRY_MIN_GAP);
    const mittel = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    assert.ok(mittel(zweite) > mittel(erste) * 1.5);
  });

  test('lässt eine priorisierte Kategorie früher drankommen', () => {
    const positionen = [];
    for (let seed = 1; seed <= 20; seed++) {
      const random = seeded(seed);
      const p = [...pool(10, 'wichtig'), ...pool(30, 'normal').map(q => ({ ...q, id: `n${q.id}` }))];
      const round = newRound();
      let last = null;

      for (let i = 0; i < p.length; i++) {
        const { question } = pickInRound(p, round, { lastId: last, prio: { wichtig: 3 }, random });
        if (question.cat === 'wichtig') positionen.push(i);
        last = question.id;
      }
    }
    const mittel = positionen.reduce((a, b) => a + b, 0) / positionen.length;
    assert.ok(mittel < 39 / 2, `Durchschnittsposition ${mittel} sollte vorne liegen`);
  });

  test('hält verwandte Fragen auseinander – außer am Rundenende', () => {
    // Der Abstand lässt sich nicht immer einhalten: Ist die verwandte Frage die
    // letzte offene der Runde, muss sie trotzdem drankommen, sonst wäre die
    // Runde nicht zu Ende zu spielen. Genau diese eine Ausnahme prüfen wir mit –
    // über viele feste Zufallsfolgen, damit der Test nicht mal so und mal so
    // ausgeht.
    let ausnahmen = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const random = seeded(seed);
      const p = [
        { id: 'a1', cat: 'x', twin: 'gruppe' },
        { id: 'a2', cat: 'x', twin: 'gruppe' },
        ...pool(20, 'x').map(q => ({ ...q, id: `f${q.id}` }))
      ];
      const round = newRound();
      const reihe = [];
      let last = null;

      for (let i = 0; i < p.length; i++) {
        const { question } = pickInRound(p, round, { lastId: last, random });
        reihe.push(question.id);
        last = question.id;
      }

      const erst = Math.min(reihe.indexOf('a1'), reihe.indexOf('a2'));
      const zweit = Math.max(reihe.indexOf('a1'), reihe.indexOf('a2'));
      const abstand = zweit - erst;
      if (abstand >= RETRY_MIN_GAP) continue;
      ausnahmen++;
      assert.equal(zweit, p.length - 1,
        `Zufallsfolge ${seed}: Abstand ${abstand} an Position ${zweit} – zu eng, obwohl noch andere Fragen offen waren`);
    }
    // Die Ausnahme ist der Sonderfall, nicht die Regel.
    assert.ok(ausnahmen < 150, `In ${ausnahmen} von 300 Läufen landeten die verwandten Fragen am Rundenende`);
  });

  test('beginnt nach dem Durchlauf eine neue Runde', () => {
    const p = pool(12);
    const round = newRound();
    let last = null;
    let wechsel = 0;

    for (let i = 0; i < p.length * 2 + 2; i++) {
      const { question, newPass } = pickInRound(p, round, { lastId: last });
      if (newPass) wechsel++;
      last = question.id;
    }
    assert.ok(wechsel >= 1);
    assert.equal(round.pass, wechsel + 1);
  });

  test('kommt auch mit einem winzigen Pool zurecht', () => {
    const p = pool(3);
    const round = newRound();
    let last = null;
    for (let i = 0; i < 30; i++) {
      const { question } = pickInRound(p, round, { lastId: last });
      assert.ok(question, 'es muss immer eine Frage kommen');
      assert.notEqual(question.id, last, 'nie zweimal dieselbe hintereinander');
      last = question.id;
    }
  });

  test('repariert einen kaputten Rundenstand', () => {
    const round = normalizeRound({ pass: 0, asked: null, retry: [{ id: 'x' }, 'alt', 42], counts: 'nein' });
    assert.equal(round.pass, 1);
    assert.deepEqual(round.asked, []);
    assert.deepEqual(round.retry, [{ id: 'x', dueAt: 0 }, { id: 'alt', dueAt: 0 }]);
    assert.deepEqual(round.counts, {});
  });
});
