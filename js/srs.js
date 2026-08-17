// SPDX-License-Identifier: Apache-2.0
// Karteikasten-Logik für den Browser.
//
// Die Regeln selbst stehen in js/core/srs-core.js – dieselbe Datei nutzt auch
// der Server. Hier wird nur die Arbeitskopie im localStorage angebunden.

import { getState, getCard, hasCard } from './store.js';
import * as core from './core/srs-core.js';
import * as stages from './core/stages.js';

export const MAX_BOX = core.MAX_BOX;
export const MAX_RETRIES = core.MAX_RETRIES;
export const RETRY_MIN_GAP = core.RETRY_MIN_GAP;
export const RETRY_SPREAD = core.RETRY_SPREAD;

export const retryDelay = core.retryDelay;
export const newRound = core.newRound;
export const normalizeRound = core.normalizeRound;
export const queueRetry = core.queueRetry;
export const clearRetry = core.clearRetry;
export const roundProgress = core.roundProgress;

/** Karte aus dem lokalen Speicher – ohne sie anzulegen. */
const cardOf = id => (hasCard(id) ? getState().cards[id] : null);

export function isMastered(id) {
  return core.isMasteredCard(cardOf(id));
}

export function isHard(id) {
  return core.isHardCard(cardOf(id));
}

/** Gewicht einer Frage für die Zufallsauswahl. */
export function weightOf(id, recentWindow) {
  return core.cardWeight(cardOf(id), { seq: getState().seq, recentWindow });
}

/** Nächste Frage auswählen (ohne Rundenlogik). */
export function pickNext(pool, useSrs, lastId, prio = {}) {
  return core.pickWeighted(pool, cardOf, { useSrs, lastId, prio, seq: getState().seq });
}

/** Nächste Frage innerhalb der laufenden Runde. */
export function pickInRound(pool, round, opts = {}) {
  return core.pickInRound(pool, round, { ...opts, getCard: cardOf, seq: getState().seq });
}

/** Antwort verbuchen und Karte verschieben. */
export function recordAnswer(id, correct) {
  const state = getState();
  const card = getCard(id);
  const { card: next, move } = core.applyAnswer(card, correct, state.seq);

  Object.assign(card, next);
  state.seq++;

  state.totals.total++;
  if (correct) state.totals.right++;
  else state.totals.wrong++;

  return move;
}

/** Fortschrittszahlen für eine Fragenmenge. */
export function poolProgress(pool) {
  return core.poolProgress(pool, cardOf);
}

/** Stand der Ausbildungsstufen – aus denselben Karten gerechnet wie alles andere. */
export function stageStatus(questions, current) {
  return stages.stageStatus(questions, cardOf, current);
}
