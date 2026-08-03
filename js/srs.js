// Karteikasten-Logik (Leitner-System mit gewichteter Zufallsauswahl).
//
// Fach 1 = "sitzt noch nicht" -> wird sehr häufig abgefragt
// Fach 5 = "sitzt"            -> kommt nur noch selten dran
//
// Richtig beantwortet  -> ein Fach weiter
// Falsch beantwortet   -> zurück in Fach 1

import { getState, getCard, hasCard } from './store.js';

export const MAX_BOX = 5;

const BOX_WEIGHT = { 1: 24, 2: 12, 3: 6, 4: 3, 5: 1 };
const NEW_WEIGHT = 14;          // noch nie gesehene Frage
const RECENT_PENALTY = 0.08;    // gerade erst gestellte Frage stark abwerten

export function isMastered(id) {
  return hasCard(id) && getState().cards[id].box >= MAX_BOX;
}

export function isHard(id) {
  if (!hasCard(id)) return false;
  const c = getState().cards[id];
  return c.box < MAX_BOX && (c.wrong > 0 || c.box <= 2);
}

/** Gewicht einer Frage für die Zufallsauswahl. */
export function weightOf(id, recentWindow) {
  const state = getState();
  if (!hasCard(id)) return NEW_WEIGHT;
  const card = state.cards[id];
  let w = BOX_WEIGHT[card.box] ?? 1;
  // Fragen, die man oft falsch hatte, zusätzlich hochziehen.
  w *= 1 + Math.min(card.wrong, 5) * 0.35;
  if (card.seenAt >= 0 && state.seq - card.seenAt < recentWindow) w *= RECENT_PENALTY;
  return Math.max(w, 0.05);
}

/**
 * Nächste Frage auswählen.
 * @param {Array} pool  gefilterte Fragen
 * @param {boolean} useSrs  Karteikasten-Gewichtung nutzen
 * @param {string|null} lastId zuletzt gestellte Frage (nie direkt wiederholen)
 */
export function pickNext(pool, useSrs, lastId) {
  if (!pool.length) return null;
  const candidates = pool.length > 1 ? pool.filter(q => q.id !== lastId) : pool;

  if (!useSrs) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const recentWindow = Math.min(Math.max(3, Math.floor(candidates.length / 3)), 12);
  const weights = candidates.map(q => weightOf(q.id, recentWindow));
  const sum = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * sum;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Antwort verbuchen und Karte verschieben. */
export function recordAnswer(id, correct) {
  const state = getState();
  const card = getCard(id);
  const boxBefore = card.box;

  if (correct) {
    card.right++;
    card.streak++;
    card.box = Math.min(MAX_BOX, card.box + 1);
  } else {
    card.wrong++;
    card.streak = 0;
    card.box = 1;
  }
  card.seenAt = state.seq;
  state.seq++;

  state.totals.total++;
  if (correct) state.totals.right++;
  else state.totals.wrong++;

  return { boxBefore, boxAfter: card.box, mastered: correct && card.box >= MAX_BOX };
}

/** Fortschrittszahlen für eine Fragenmenge. */
export function poolProgress(pool) {
  const state = getState();
  let mastered = 0, seen = 0, hard = 0;
  const boxes = [0, 0, 0, 0, 0];
  for (const q of pool) {
    const card = state.cards[q.id];
    if (!card) continue;
    seen++;
    boxes[card.box - 1]++;
    if (card.box >= MAX_BOX) mastered++;
    else if (card.wrong > 0 || card.box <= 2) hard++;
  }
  return { total: pool.length, seen, mastered, hard, boxes };
}
