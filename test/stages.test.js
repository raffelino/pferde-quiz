// SPDX-License-Identifier: Apache-2.0
// Regressionstests des Stufensystems.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_STAGE, PROMOTION_RATIO, STAGES, nextStage, normalizeStage,
  stageForLevels, stageLevels, stagePool, stageProgress, stageStatus
} from '../js/core/stages.js';
import { QUESTIONS } from '../js/data/index.js';

/** Fragenpool zum Rechnen: n Fragen je Schwierigkeitsstufe. */
const pool = (basis, aufbau, profi) => [
  ...Array.from({ length: basis }, (_, i) => ({ id: `b${i}`, level: 'basis', cat: 'x' })),
  ...Array.from({ length: aufbau }, (_, i) => ({ id: `a${i}`, level: 'aufbau', cat: 'x' })),
  ...Array.from({ length: profi }, (_, i) => ({ id: `p${i}`, level: 'profi', cat: 'x' }))
];

const gelernt = { box: 5, right: 4, wrong: 0, streak: 4, seenAt: 1 };
const angefangen = { box: 2, right: 1, wrong: 0, streak: 1, seenAt: 1 };

/** Karten-Nachschlag, bei dem die genannten Fragen sitzen. */
const karten = (ids, card = gelernt) => {
  const set = new Set(ids);
  return id => (set.has(id) ? card : null);
};

describe('Stufen', () => {
  test('bauen aufeinander auf', () => {
    assert.deepEqual(stageLevels('einsteiger'), ['basis']);
    assert.deepEqual(stageLevels('fortgeschritten'), ['basis', 'aufbau']);
    assert.deepEqual(stageLevels('profi'), ['basis', 'aufbau', 'profi']);
  });

  test('fangen unbekannte Angaben ab', () => {
    assert.equal(normalizeStage(undefined), DEFAULT_STAGE);
    assert.equal(normalizeStage('reitmeister'), DEFAULT_STAGE);
    assert.equal(normalizeStage(null), DEFAULT_STAGE);
    assert.deepEqual(stageLevels('quatsch'), stageLevels(DEFAULT_STAGE));
  });

  test('kennen ihre Reihenfolge', () => {
    assert.equal(nextStage('einsteiger'), 'fortgeschritten');
    assert.equal(nextStage('fortgeschritten'), 'profi');
    assert.equal(nextStage('profi'), null, 'ueber Profi kommt nichts mehr');
  });

  test('nehmen nur die Fragen ihrer Schwierigkeit', () => {
    const p = pool(10, 20, 30);
    assert.equal(stagePool(p, 'einsteiger').length, 10);
    assert.equal(stagePool(p, 'fortgeschritten').length, 30);
    assert.equal(stagePool(p, 'profi').length, 60);
  });
});

describe('Stufe aus einer alten Schwierigkeitsauswahl', () => {
  // Diese Umrechnung entscheidet, was bestehende Nutzer nach dem Update
  // trainieren. Geht sie daneben, schrumpft ihr Fragenpool stillschweigend.
  test('"alle Schwierigkeiten" wird zur hoechsten Stufe', () => {
    assert.equal(stageForLevels(null), 'profi');
    assert.equal(stageForLevels(undefined), 'profi');
    assert.equal(stageForLevels([]), 'profi');
    assert.equal(stageForLevels(['basis', 'aufbau', 'profi']), 'profi');
  });

  test('erkennt genaue Entsprechungen', () => {
    assert.equal(stageForLevels(['basis']), 'einsteiger');
    assert.equal(stageForLevels(['aufbau', 'basis']), 'fortgeschritten', 'Reihenfolge egal');
  });

  test('nimmt bei eigener Auswahl die kleinste Stufe, die alles enthaelt', () => {
    assert.equal(stageForLevels(['aufbau']), 'fortgeschritten');
    assert.equal(stageForLevels(['profi']), 'profi');
    assert.equal(stageForLevels(['basis', 'profi']), 'profi');
  });

  test('verkleinert den Trainingsumfang niemals', () => {
    // Fuer jede denkbare alte Auswahl muss die abgeleitete Stufe alles abdecken.
    const alle = ['basis', 'aufbau', 'profi'];
    const kombinationen = [];
    for (let maske = 1; maske < 8; maske++) {
      kombinationen.push(alle.filter((_, i) => maske & (1 << i)));
    }
    for (const auswahl of kombinationen) {
      const abgeleitet = stageLevels(stageForLevels(auswahl));
      for (const level of auswahl) {
        assert.ok(abgeleitet.includes(level),
          `Auswahl ${auswahl.join('+')} verliert "${level}" (Stufe deckt ${abgeleitet.join('+')})`);
      }
    }
  });
});

describe('Stufenfortschritt', () => {
  test('zaehlt nur Fragen, die wirklich sitzen', () => {
    const p = pool(10, 0, 0);
    // 5 sitzen, 3 sind angefangen, 2 unbekannt
    const cardOf = id => {
      if (['b0', 'b1', 'b2', 'b3', 'b4'].includes(id)) return gelernt;
      if (['b5', 'b6', 'b7'].includes(id)) return angefangen;
      return null;
    };
    const prog = stageProgress(p, cardOf, 'einsteiger');
    assert.equal(prog.total, 10);
    assert.equal(prog.mastered, 5);
    assert.equal(prog.seen, 8, 'angefangene Fragen gelten als gesehen');
    assert.equal(prog.pct, 50);
    assert.equal(prog.done, false);
  });

  test('rundet die noetige Anzahl auf', () => {
    // 73 Fragen * 0,8 = 58,4 -> 59 muessen sitzen
    const p = pool(73, 0, 0);
    const prog = stageProgress(p, () => null, 'einsteiger');
    assert.equal(prog.needed, 59);
    assert.equal(Math.ceil(73 * PROMOTION_RATIO), 59);
  });

  test('meldet genau an der Schwelle geschafft', () => {
    const p = pool(10, 0, 0);
    const acht = ['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'];
    assert.equal(stageProgress(p, karten(acht.slice(0, 7)), 'einsteiger').done, false, '7 von 10 reichen nicht');
    assert.equal(stageProgress(p, karten(acht), 'einsteiger').done, true, '8 von 10 reichen');
  });

  test('haelt eine leere Stufe nicht faelschlich fuer geschafft', () => {
    const prog = stageProgress([], () => null, 'einsteiger');
    assert.equal(prog.total, 0);
    assert.equal(prog.done, false, 'ohne Fragen ist nichts geschafft');
    assert.equal(prog.pct, 0);
  });

  test('braucht fuer die hoehere Stufe auch die Grundlagen', () => {
    const p = pool(10, 10, 0);
    // Alle Aufbau-Fragen sitzen, keine einzige Basis-Frage
    const nurAufbau = karten(Array.from({ length: 10 }, (_, i) => `a${i}`));
    const prog = stageProgress(p, nurAufbau, 'fortgeschritten');
    assert.equal(prog.mastered, 10);
    assert.equal(prog.total, 20);
    assert.equal(prog.done, false, 'Fortgeschritten schliesst die Basis mit ein');
  });
});

describe('Stufenempfehlung', () => {
  const p = pool(10, 10, 10);
  const alle = n => Array.from({ length: n }, (_, i) => i);

  test('empfiehlt am Anfang nichts Neues', () => {
    const s = stageStatus(p, () => null, 'einsteiger');
    assert.equal(s.current, 'einsteiger');
    assert.equal(s.reached, null);
    assert.equal(s.promote, false);
    assert.equal(s.recommended, 'einsteiger', 'ohne Fortschritt bleibt es bei der aktuellen Stufe');
    assert.equal(s.completed, false);
  });

  test('empfiehlt die naechste Stufe, sobald die aktuelle sitzt', () => {
    const cardOf = karten(alle(8).map(i => `b${i}`));
    const s = stageStatus(p, cardOf, 'einsteiger');
    assert.equal(s.byId.einsteiger.done, true);
    assert.equal(s.reached, 'einsteiger');
    assert.equal(s.promote, true);
    assert.equal(s.next, 'fortgeschritten');
    assert.equal(s.recommended, 'fortgeschritten');
  });

  test('empfiehlt ueber Profi hinaus nichts mehr', () => {
    const cardOf = karten([
      ...alle(10).map(i => `b${i}`), ...alle(10).map(i => `a${i}`), ...alle(10).map(i => `p${i}`)
    ]);
    const s = stageStatus(p, cardOf, 'profi');
    assert.equal(s.completed, true);
    assert.equal(s.next, null);
    assert.equal(s.promote, false, 'ohne naechste Stufe gibt es keine Empfehlung');
    assert.equal(s.recommended, 'profi');
  });

  test('laesst niemanden zurueckfallen, wenn eine niedrigere Stufe gewaehlt wird', () => {
    // Fortgeschritten sitzt komplett, eingestellt ist trotzdem Einsteiger.
    const cardOf = karten([...alle(10).map(i => `b${i}`), ...alle(10).map(i => `a${i}`)]);
    const s = stageStatus(p, cardOf, 'einsteiger');
    assert.equal(s.reached, 'fortgeschritten', 'die hoechste geschaffte Stufe zaehlt');
    assert.equal(s.current, 'einsteiger');
    assert.equal(s.promote, true);
  });

  test('rechnet denselben Stand aus denselben Karten', () => {
    const cardOf = karten(alle(9).map(i => `b${i}`));
    assert.deepEqual(stageStatus(p, cardOf, 'einsteiger'), stageStatus(p, cardOf, 'einsteiger'));
  });
});

describe('Stufen gegen den echten Fragenpool', () => {
  test('jede Stufe hat Fragen, und Profi umfasst alle', () => {
    for (const stage of STAGES) {
      assert.ok(stagePool(QUESTIONS, stage.id).length > 0, `${stage.id} hat keine Fragen`);
    }
    assert.equal(stagePool(QUESTIONS, 'profi').length, QUESTIONS.length,
      'Profi muss den gesamten Pool abdecken – sonst gibt es Fragen, die niemand je sieht');
  });

  test('die Stufen wachsen echt an', () => {
    const [e, f, pr] = STAGES.map(s => stagePool(QUESTIONS, s.id).length);
    assert.ok(e < f && f < pr, `Groessen: ${e}, ${f}, ${pr}`);
  });

  test('mit vollstaendig gelerntem Kasten ist alles geschafft', () => {
    const s = stageStatus(QUESTIONS, () => gelernt, 'einsteiger');
    assert.equal(s.completed, true);
    assert.equal(s.reached, 'profi');
  });
});
