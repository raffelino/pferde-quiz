// SPDX-License-Identifier: Apache-2.0
// Ausbildungsstufen: Einsteiger -> Fortgeschritten -> Profi.
//
// Die Stufe ist kein zusaetzlicher Fortschritt, der irgendwo mitgezaehlt wird,
// sondern eine Auswertung des Karteikastens: Eine Stufe gilt als geschafft,
// wenn genug ihrer Fragen im letzten Fach liegen. Damit laesst sie sich
// jederzeit aus den Karten neu berechnen – auf dem Geraet wie auf dem Server –
// und kann nicht auseinanderlaufen.
//
// Rein und ohne Speicher: keine DOM-, localStorage- oder DB-Zugriffe.

import { isMasteredCard } from './srs-core.js';

/** Anteil der Fragen einer Stufe, der sitzen muss, um aufzusteigen. */
export const PROMOTION_RATIO = 0.8;

/**
 * Die Stufen bauen aufeinander auf: Wer fortgeschritten uebt, wiederholt die
 * Basis mit. Sonst waere "Profi" eine Insel, auf der die Grundlagen verstauben.
 */
export const STAGES = [
  {
    id: 'einsteiger',
    name: 'Einsteiger',
    levels: ['basis'],
    hint: 'Basispass · RA 10–6',
    blurb: 'Grundlagen: Pferdekunde, Umgang, Haltung, Sicherheit.'
  },
  {
    id: 'fortgeschritten',
    name: 'Fortgeschritten',
    levels: ['basis', 'aufbau'],
    hint: 'RA 5 & 4',
    blurb: 'Reitlehre, Hilfengebung, Gangarten und Bahnregeln kommen dazu.'
  },
  {
    id: 'profi',
    name: 'Profi',
    levels: ['basis', 'aufbau', 'profi'],
    hint: 'RA 3–1',
    blurb: 'Der gesamte Stoff, inklusive Ausbildungsskala und Turnierwissen.'
  }
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map(s => [s.id, s]));
export const DEFAULT_STAGE = STAGES[0].id;

/** Unbekanntes oder fehlendes in eine gueltige Stufe uebersetzen. */
export function normalizeStage(id) {
  return STAGE_BY_ID[id] ? id : DEFAULT_STAGE;
}

/** Die Schwierigkeitsstufen, die zu einer Ausbildungsstufe gehoeren. */
export function stageLevels(id) {
  return [...STAGE_BY_ID[normalizeStage(id)].levels];
}

/** Die Fragen einer Stufe. */
export function stagePool(questions, id) {
  const levels = new Set(stageLevels(id));
  return questions.filter(q => levels.has(q.level));
}

/**
 * Zu einer Schwierigkeitsauswahl die passende Stufe finden.
 *
 * Gebraucht fuer aeltere Staende, die noch keine Stufe kennen: Aus ihrer
 * bisherigen Auswahl wird die Stufe abgeleitet, damit sich der Trainingsumfang
 * durch ein Update nicht heimlich aendert. "Keine Angabe" hiess bisher "alle
 * Schwierigkeiten" – das entspricht der hoechsten Stufe.
 */
export function stageForLevels(levels) {
  const hoechste = STAGES[STAGES.length - 1].id;
  if (!Array.isArray(levels) || levels.length === 0) return hoechste;

  const ist = new Set(levels);
  const genau = STAGES.find(s => s.levels.length === ist.size && s.levels.every(l => ist.has(l)));
  if (genau) return genau.id;

  // Keine exakte Entsprechung: die kleinste Stufe, die alles Gewaehlte enthaelt.
  const deckt = STAGES.find(s => [...ist].every(l => s.levels.includes(l)));
  return deckt ? deckt.id : hoechste;
}

/** Die naechsthoehere Stufe – oder null, wenn es keine mehr gibt. */
export function nextStage(id) {
  const i = STAGES.findIndex(s => s.id === normalizeStage(id));
  return i >= 0 && i + 1 < STAGES.length ? STAGES[i + 1].id : null;
}

/**
 * Fortschritt einer Stufe.
 * @param {Array} questions  gesamter Fragenpool
 * @param {(id: string) => object|null} cardOf  Karte zu einer Frage
 * @param {string} id  Stufe
 */
export function stageProgress(questions, cardOf, id) {
  const stage = STAGE_BY_ID[normalizeStage(id)];
  const pool = stagePool(questions, stage.id);
  let mastered = 0;
  let seen = 0;
  for (const q of pool) {
    const card = cardOf(q.id);
    if (!card) continue;
    if (card.right > 0 || card.wrong > 0) seen++;
    if (isMasteredCard(card)) mastered++;
  }

  // Aufrunden: Bei 73 Fragen sollen 59 reichen (80,8 %), nicht 58 (79,5 %).
  const needed = Math.ceil(pool.length * PROMOTION_RATIO);
  return {
    id: stage.id,
    name: stage.name,
    total: pool.length,
    seen,
    mastered,
    needed,
    missing: Math.max(0, needed - mastered),
    pct: pool.length ? Math.round((mastered / pool.length) * 100) : 0,
    done: pool.length > 0 && mastered >= needed
  };
}

/**
 * Gesamtbild: Wo steht der Mensch, was ist geschafft, was empfiehlt sich?
 *
 * `reached` ist die hoechste geschaffte Stufe (unabhaengig von der gewaehlten) –
 * so faellt niemand zurueck, nur weil er eine niedrigere Stufe eingestellt hat.
 * `recommended` ist die Stufe, die als naechstes dran waere.
 */
export function stageStatus(questions, cardOf, current = DEFAULT_STAGE) {
  const currentId = normalizeStage(current);
  const progress = STAGES.map(s => stageProgress(questions, cardOf, s.id));
  const byId = Object.fromEntries(progress.map(p => [p.id, p]));

  const geschafft = progress.filter(p => p.done);
  const reached = geschafft.length ? geschafft[geschafft.length - 1].id : null;

  const weiter = nextStage(currentId);
  const promote = byId[currentId].done && weiter !== null;

  return {
    current: currentId,
    progress,
    byId,
    reached,
    next: weiter,
    // Aufstieg empfohlen: aktuelle Stufe sitzt und es geht noch hoeher.
    promote,
    recommended: promote ? weiter : currentId,
    // Alles geschafft – dann gibt es nichts mehr zu empfehlen.
    completed: byId[STAGES[STAGES.length - 1].id].done
  };
}
