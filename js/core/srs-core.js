// SPDX-License-Identifier: Apache-2.0
// Lernlogik ohne Umgebung: keine Zugriffe auf localStorage, Datenbank oder DOM.
//
// Dieses Modul wird von zwei Seiten genutzt:
//   * im Browser über js/srs.js (Arbeitskopie im localStorage)
//   * im Server über server/srs.js (Kartenstände aus SQLite)
//
// Damit können Client und Server nicht auseinanderlaufen: Wer eine Regel
// ändert, ändert sie für beide.
//
// Fach 1 = "sitzt noch nicht" -> wird sehr häufig abgefragt
// Fach 5 = "sitzt"            -> kommt nur noch selten dran

export const MAX_BOX = 5;

const BOX_WEIGHT = { 1: 24, 2: 12, 3: 6, 4: 3, 5: 1 };
const NEW_WEIGHT = 14;          // noch nie gesehene Frage
const RECENT_PENALTY = 0.08;    // gerade erst gestellte Frage stark abwerten

/** Frisch angelegte Karteikarte. */
export function newCard() {
  return { box: 1, right: 0, wrong: 0, streak: 0, seenAt: -1 };
}

/** Karte auf einen bekannten, vollständigen Stand bringen. */
export function normalizeCard(card) {
  const base = newCard();
  if (!card || typeof card !== 'object') return base;
  const num = (v, fallback) => (Number.isFinite(v) ? v : fallback);
  return {
    box: Math.min(MAX_BOX, Math.max(1, Math.round(num(card.box, 1)))),
    right: Math.max(0, Math.round(num(card.right, 0))),
    wrong: Math.max(0, Math.round(num(card.wrong, 0))),
    streak: Math.max(0, Math.round(num(card.streak, 0))),
    seenAt: Math.round(num(card.seenAt, -1))
  };
}

export function isMasteredCard(card) {
  return !!card && card.box >= MAX_BOX;
}

export function isHardCard(card) {
  if (!card) return false;
  return card.box < MAX_BOX && (card.wrong > 0 || card.box <= 2);
}

/**
 * Eine Antwort auf eine Karte anwenden. Gibt eine **neue** Karte zurück,
 * das Original bleibt unverändert.
 * @param {object|null} card  bisheriger Stand (null = neue Frage)
 * @param {boolean} correct
 * @param {number} seq  laufende Nummer der Antwort (für "zuletzt gesehen")
 */
export function applyAnswer(card, correct, seq) {
  const before = card ? normalizeCard(card) : newCard();
  const next = { ...before };

  if (correct) {
    next.right += 1;
    next.streak += 1;
    next.box = Math.min(MAX_BOX, next.box + 1);
  } else {
    next.wrong += 1;
    next.streak = 0;
    next.box = 1;
  }
  next.seenAt = seq;

  return {
    card: next,
    move: {
      boxBefore: before.box,
      boxAfter: next.box,
      mastered: correct && next.box >= MAX_BOX && before.box < MAX_BOX
    }
  };
}

/**
 * Kartenstand aus der vollständigen Antwortfolge neu berechnen.
 * Wird gebraucht, wenn ein Ereignis nachträglich eintrifft (zweites Gerät):
 * so hängt das Ergebnis nicht von der Zustellreihenfolge ab.
 * @param {Array<{correct: boolean, seq?: number}>} answers  nach Zeit sortiert
 */
export function rebuildCard(answers) {
  let card = newCard();
  answers.forEach((a, i) => {
    card = applyAnswer(card, !!a.correct, Number.isFinite(a.seq) ? a.seq : i).card;
  });
  return card;
}

/**
 * Gewicht einer Frage für die Zufallsauswahl.
 * @param {object|null} card
 * @param {{seq: number, recentWindow: number}} ctx
 */
export function cardWeight(card, { seq = 0, recentWindow = 0 } = {}) {
  if (!card) return NEW_WEIGHT;
  let w = BOX_WEIGHT[card.box] ?? 1;
  // Fragen, die man oft falsch hatte, zusätzlich hochziehen.
  w *= 1 + Math.min(card.wrong, 5) * 0.35;
  if (card.seenAt >= 0 && seq - card.seenAt < recentWindow) w *= RECENT_PENALTY;
  return Math.max(w, 0.05);
}

/**
 * Nächste Frage gewichtet ziehen.
 * @param {Array} pool  Fragen (Objekte mit id und cat)
 * @param {(id: string) => object|null} getCard
 * @param {object} opts
 */
export function pickWeighted(pool, getCard, {
  useSrs = true, lastId = null, prio = {}, seq = 0, random = Math.random
} = {}) {
  if (!pool.length) return null;
  const candidates = pool.length > 1 ? pool.filter(q => q.id !== lastId) : pool;
  if (!candidates.length) return null;

  if (!useSrs) return candidates[Math.floor(random() * candidates.length)];

  const recentWindow = Math.min(Math.max(3, Math.floor(candidates.length / 3)), 12);
  const weights = candidates.map(q =>
    cardWeight(getCard(q.id), { seq, recentWindow }) * (prio[q.cat] || 1));
  const sum = weights.reduce((a, b) => a + b, 0);
  let roll = random() * sum;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/* ------------------------------------------------------------ Runden */
//
// Eine Runde geht einmal durch den kompletten Fragenpool: Jede Frage kommt
// genau einmal dran, bevor irgendeine ein zweites Mal erscheint. Sobald eine
// Frage richtig beantwortet ist, taucht sie in dieser Runde nicht mehr auf.

export const MAX_RETRIES = 2;      // wie oft eine falsche Frage je Runde nachkommt
export const RETRY_MIN_GAP = 8;    // so viele Fragen liegen mindestens dazwischen
export const RETRY_SPREAD = 10;    // zufällige Streuung obendrauf

/**
 * Abstand bis zur Wiederholung – zufällig, damit die Wiederholung nicht
 * vorhersehbar wird, und beim zweiten Anlauf deutlich später.
 */
export function retryDelay(attempt = 1, poolSize = Infinity, random = Math.random) {
  const min = RETRY_MIN_GAP * attempt;
  const delay = min + Math.floor(random() * RETRY_SPREAD * attempt);
  const maxUseful = Math.max(2, poolSize - 2);
  return Math.min(delay, maxUseful);
}

export function newRound(pass = 1) {
  return { pass, asked: [], retry: [], counts: {}, recent: [] };
}

/** Sorgt dafür, dass ein gespeicherter Rundenstand vollständig ist. */
export function normalizeRound(round) {
  if (!round || typeof round !== 'object') return newRound();
  const retry = (Array.isArray(round.retry) ? round.retry : [])
    .map(entry => (typeof entry === 'string' ? { id: entry, dueAt: 0 } : entry))
    .filter(entry => entry && typeof entry.id === 'string')
    .map(entry => ({ id: entry.id, dueAt: Number.isFinite(entry.dueAt) ? entry.dueAt : 0 }));
  const counts = {};
  if (round.counts && typeof round.counts === 'object') {
    for (const [id, n] of Object.entries(round.counts)) {
      if (Number.isFinite(n)) counts[id] = Math.max(0, Math.round(n));
    }
  }
  return {
    pass: Number.isInteger(round.pass) && round.pass > 0 ? round.pass : 1,
    asked: Array.isArray(round.asked) ? round.asked.filter(id => typeof id === 'string') : [],
    retry,
    counts,
    recent: Array.isArray(round.recent) ? round.recent.filter(id => typeof id === 'string') : []
  };
}

/**
 * Nächste Frage innerhalb der laufenden Runde.
 *
 * Reihenfolge:
 *   1. fällige Wiederholung einer falsch beantworteten Frage (mit Abstand)
 *   2. eine Frage, die in dieser Runde noch nicht dran war
 *   3. sonst beginnt die nächste Runde
 *
 * @returns {{question: object|null, newPass: boolean, retry: boolean}}
 */
export function pickInRound(pool, round, {
  useSrs = true, lastId = null, prio = {}, getCard = () => null, seq = 0, random = Math.random
} = {}, _newPass = false) {
  if (!pool.length) return { question: null, newPass: false, retry: false };

  const byId = new Map(pool.map(q => [q.id, q]));
  // Zuletzt gestellte Fragen sind gesperrt – auch über den Rundenwechsel hinweg.
  // Bei sehr kleinen Pools greift nur die Sperre für die direkt vorige Frage,
  // sonst käme die Runde nicht mehr durch.
  const recent = new Set((round.recent || []).slice(-RETRY_MIN_GAP));
  const useRecent = pool.length > RETRY_MIN_GAP + 1;
  // Inhaltlich verwandte Fragen ("twin") sollen nicht direkt nacheinander
  // kommen – sonst wirkt es wie dieselbe Frage in neuer Verpackung.
  const recentTwins = new Set([...recent].map(id => byId.get(id)?.twin).filter(Boolean));
  const free = id => {
    const q = byId.get(id);
    if (!q) return false;
    if (id === lastId && pool.length > 1) return false;
    if (!useRecent) return true;
    if (recent.has(id)) return false;
    return !(q.twin && recentTwins.has(q.twin));
  };

  const serve = (question, opts) => {
    round.recent = [...(round.recent || []), question.id].slice(-RETRY_MIN_GAP * 2);
    return { question, newPass: _newPass, retry: false, ...opts };
  };

  // 1. fällige Wiederholung. Stammt sie aus der Vorrunde, gilt die Frage
  //    damit auch für diese Runde als gestellt – sonst käme sie später
  //    nochmal als reguläre Frage.
  const dueIndex = round.retry.findIndex(e => free(e.id) && e.dueAt <= round.asked.length);
  if (dueIndex >= 0) {
    const [entry] = round.retry.splice(dueIndex, 1);
    if (!round.asked.includes(entry.id)) round.asked.push(entry.id);
    return serve(byId.get(entry.id), { retry: true });
  }

  // 2. noch offene Fragen dieser Runde
  const asked = new Set(round.asked);
  let open = pool.filter(q => !asked.has(q.id));
  if (open.length) {
    const preferred = open.filter(q => free(q.id));
    if (preferred.length) open = preferred;
    const question = pickWeighted(open, getCard, { useSrs, lastId, prio, seq, random }) || open[0];
    round.asked.push(question.id);
    return serve(question);
  }

  // 3. neue Runde. Noch offene Wiederholungen wandern mit – sie kämen sonst
  //    direkt hintereinander, weil nichts anderes mehr übrig ist.
  if (_newPass) return serve(pool[0], {});          // Sicherheitsnetz
  round.pass += 1;
  round.asked = [];
  round.counts = {};
  round.retry = round.retry
    .filter(e => byId.has(e.id))
    .map(e => ({ id: e.id, dueAt: retryDelay(1, pool.length, random) }));
  return pickInRound(pool, round, { useSrs, lastId, prio, getCard, seq, random }, true);
}

/** Falsch beantwortete Frage für eine Wiederholung in dieser Runde vormerken. */
export function queueRetry(round, id, poolSize = Infinity, random = Math.random) {
  const used = round.counts[id] || 0;
  if (used >= MAX_RETRIES || round.retry.some(e => e.id === id)) return false;
  const attempt = used + 1;
  round.counts[id] = attempt;
  round.retry.push({ id, dueAt: round.asked.length + retryDelay(attempt, poolSize, random) });
  return true;
}

/**
 * Vorgemerkte Wiederholung streichen – wird nach einer richtigen Antwort
 * aufgerufen. Ohne das käme eine Frage, die aus der Vorrunde noch eine
 * Wiederholung offen hat, trotz richtiger Antwort ein zweites Mal.
 */
export function clearRetry(round, id) {
  const before = round.retry.length;
  round.retry = round.retry.filter(e => e.id !== id);
  return round.retry.length !== before;
}

/** Fortschritt innerhalb der laufenden Runde. */
export function roundProgress(pool, round) {
  const ids = new Set(pool.map(q => q.id));
  const seen = round.asked.filter(id => ids.has(id)).length;
  return { pass: round.pass, seen, total: pool.length, retry: round.retry.length };
}

/**
 * Übungssatz für den Modus „Nur schwierige Fragen“.
 *
 * Schwierig ist nur, was schon einmal beantwortet wurde – eine nie gesehene
 * Frage hat keine Karte und fällt durch `isHardCard`. Wer wenig geübt hat, hat
 * deshalb kaum schwierige Fragen, und ein 20er-Block müsste dieselben drei
 * Fragen sieben Mal stellen, um voll zu werden.
 *
 * Darum wird auf `wanted` aufgefüllt, und zwar mit Fragen, die noch nicht
 * sitzen – bevorzugt also neue statt bereits beherrschter. Sitzt am Ende
 * wirklich alles, kommt die ganze Menge zurück: lieber Wiederholung als eine
 * leere Sitzung.
 *
 * @param {Array<{id: string}>} pool   Fragen der aktuellen Auswahl
 * @param {(id: string) => object|null} getCard
 * @param {number} wanted              gewünschter Umfang
 * @returns {{set: Array, hard: number, filled: number}}
 */
export function practiceSet(pool, getCard, wanted) {
  const hard = pool.filter(q => isHardCard(getCard(q.id)));
  if (hard.length >= wanted) return { set: hard, hard: hard.length, filled: 0 };

  const offen = pool.filter(q => {
    const card = getCard(q.id);
    return !isHardCard(card) && !isMasteredCard(card);
  });

  let set = hard.concat(offen.slice(0, wanted - hard.length));
  if (!set.length) set = pool.slice();
  return { set, hard: hard.length, filled: set.length - hard.length };
}

/** Fortschrittszahlen für eine Fragenmenge. */
export function poolProgress(pool, getCard) {
  let mastered = 0, seen = 0, hard = 0;
  const boxes = [0, 0, 0, 0, 0];
  for (const q of pool) {
    const card = getCard(q.id);
    if (!card) continue;
    seen++;
    boxes[card.box - 1]++;
    if (isMasteredCard(card)) mastered++;
    else if (isHardCard(card)) hard++;
  }
  return { total: pool.length, seen, mastered, hard, boxes };
}
