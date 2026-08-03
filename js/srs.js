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
 * @param {object} prio  Gewichtung je Kategorie ({ katId: 2 })
 */
export function pickNext(pool, useSrs, lastId, prio = {}) {
  if (!pool.length) return null;
  const candidates = pool.length > 1 ? pool.filter(q => q.id !== lastId) : pool;

  if (!useSrs) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const recentWindow = Math.min(Math.max(3, Math.floor(candidates.length / 3)), 12);
  const weights = candidates.map(q => weightOf(q.id, recentWindow) * (prio[q.cat] || 1));
  const sum = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * sum;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/* ------------------------------------------------------------ Runden */
//
// Eine Runde geht einmal durch den kompletten Fragenpool: Jede Frage kommt
// genau einmal dran, bevor irgendeine ein zweites Mal erscheint. Falsch
// beantwortete Fragen wandern zusätzlich in eine Nachholrunde am Ende.

export const MAX_RETRIES = 2;    // wie oft eine falsche Frage je Runde nachkommt
export const RETRY_GAP = 8;      // so viele Fragen liegen mindestens dazwischen

export function newRound(pass = 1) {
  return { pass, asked: [], retry: [], counts: {} };
}

/** Sorgt dafür, dass ein gespeicherter Rundenstand vollständig ist. */
export function normalizeRound(round) {
  if (!round || typeof round !== 'object') return newRound();
  const retry = (Array.isArray(round.retry) ? round.retry : [])
    .map(entry => (typeof entry === 'string' ? { id: entry, dueAt: 0 } : entry))
    .filter(entry => entry && typeof entry.id === 'string');
  return {
    pass: Number.isInteger(round.pass) && round.pass > 0 ? round.pass : 1,
    asked: Array.isArray(round.asked) ? round.asked.filter(id => typeof id === 'string') : [],
    retry,
    counts: round.counts && typeof round.counts === 'object' ? round.counts : {}
  };
}

/**
 * Nächste Frage innerhalb der laufenden Runde.
 *
 * Reihenfolge:
 *   1. fällige Wiederholung einer falsch beantworteten Frage (mit Abstand)
 *   2. eine Frage, die in dieser Runde noch nicht dran war
 *   3. übrige Wiederholungen
 *   4. sonst beginnt die nächste Runde
 *
 * Eine gleich beim ersten Mal richtig beantwortete Frage taucht damit erst
 * wieder auf, wenn alle anderen Fragen einmal dran waren.
 *
 * @returns {{question: object|null, newPass: boolean, retry: boolean}}
 */
export function pickInRound(pool, round, { useSrs = true, lastId = null, prio = {} } = {}) {
  if (!pool.length) return { question: null, newPass: false, retry: false };

  const byId = new Map(pool.map(q => [q.id, q]));
  const usable = entry => byId.has(entry.id) && !(entry.id === lastId && pool.length > 1);

  // 1. fällige Wiederholung
  const dueIndex = round.retry.findIndex(e => usable(e) && e.dueAt <= round.asked.length);
  if (dueIndex >= 0) {
    const [entry] = round.retry.splice(dueIndex, 1);
    return { question: byId.get(entry.id), newPass: false, retry: true };
  }

  // 2. noch offene Fragen dieser Runde
  const asked = new Set(round.asked);
  const open = pool.filter(q => !asked.has(q.id) && !(q.id === lastId && pool.length > 1));
  if (open.length) {
    const question = pickNext(open, useSrs, lastId, prio) || open[0];
    round.asked.push(question.id);
    return { question, newPass: false, retry: false };
  }

  // 3. neue Runde. Noch offene Wiederholungen wandern mit – sie kämen sonst
  //    direkt hintereinander, weil nichts anderes mehr übrig ist.
  round.pass += 1;
  round.asked = [];
  round.counts = {};
  round.retry = round.retry
    .filter(e => byId.has(e.id))
    .map(e => ({ id: e.id, dueAt: RETRY_GAP }));
  const fresh = pool.filter(q => !(q.id === lastId && pool.length > 1));
  const question = pickNext(fresh, useSrs, lastId, prio) || fresh[0] || pool[0];
  round.asked.push(question.id);
  return { question, newPass: true, retry: false };
}

/** Falsch beantwortete Frage für eine Wiederholung in dieser Runde vormerken. */
export function queueRetry(round, id, gap = RETRY_GAP) {
  const used = round.counts[id] || 0;
  if (used >= MAX_RETRIES || round.retry.some(e => e.id === id)) return false;
  round.counts[id] = used + 1;
  round.retry.push({ id, dueAt: round.asked.length + gap });
  return true;
}

/** Fortschritt innerhalb der laufenden Runde. */
export function roundProgress(pool, round) {
  const ids = new Set(pool.map(q => q.id));
  const seen = round.asked.filter(id => ids.has(id)).length;
  return { pass: round.pass, seen, total: pool.length, retry: round.retry.length };
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
