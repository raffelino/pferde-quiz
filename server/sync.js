// SPDX-License-Identifier: Apache-2.0
// Abgleich zwischen Gerät und Server.
//
// Grundgedanke: Antworten sind Ereignisse mit eigener ID. Der Server speichert
// sie und berechnet den Kartenstand daraus neu – nie umgekehrt. Dadurch ist es
// egal, in welcher Reihenfolge zwei Geräte ihre Ereignisse abliefern, und ein
// doppelt gesendetes Ereignis ändert nichts.

import { transaction } from './db.js';
import { newRound, normalizeRound, rebuildCard, MAX_BOX } from '../js/core/srs-core.js';
import { DEFAULT_STAGE, stageStatus } from '../js/core/stages.js';

export const MAX_EVENTS_PER_REQUEST = 500;
const MAX_ID_LENGTH = 64;

export const DEFAULT_SETTINGS = {
  cats: null, levels: null, stage: DEFAULT_STAGE, stageSeen: null,
  srs: true, hardOnly: false, shuffle: true, session: 'endless', prio: {}
};

const DEFAULT_TOTALS = { right: 0, wrong: 0, total: 0, timeMs: 0 };

const rowToCard = row => ({
  box: row.box,
  right: row.right_count,
  wrong: row.wrong_count,
  streak: row.streak,
  seenAt: row.seen_at
});

/* ------------------------------------------------------- Nutzerzustand */

export function ensureState(db, userId, now = Date.now()) {
  const existing = db.prepare('SELECT * FROM user_state WHERE user_id = ?').get(userId);
  if (existing) return existing;
  db.prepare(`INSERT INTO user_state (user_id, settings, round, totals, seq, revision, updated_at)
              VALUES (?, ?, ?, ?, 0, 0, ?)`)
    .run(userId, JSON.stringify(DEFAULT_SETTINGS), JSON.stringify(newRound()), JSON.stringify(DEFAULT_TOTALS), now);
  return db.prepare('SELECT * FROM user_state WHERE user_id = ?').get(userId);
}

const parseJson = (text, fallback) => {
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' ? value : fallback;
  } catch {
    return fallback;
  }
};

export function readState(db, userId) {
  const row = ensureState(db, userId);
  return {
    settings: { ...DEFAULT_SETTINGS, ...parseJson(row.settings, {}) },
    round: normalizeRound(parseJson(row.round, null)),
    totals: { ...DEFAULT_TOTALS, ...parseJson(row.totals, {}) },
    seq: row.seq,
    revision: row.revision,
    updatedAt: row.updated_at
  };
}

export function readCards(db, userId) {
  const rows = db.prepare('SELECT * FROM cards WHERE user_id = ?').all(userId);
  const cards = {};
  for (const row of rows) cards[row.question_id] = rowToCard(row);
  return cards;
}

/**
 * Einstellungen und Rundenstand speichern.
 * Der Client schickt die Revision, die er gelesen hat. Passt sie nicht mehr,
 * hat inzwischen ein anderes Gerät geschrieben – dann gibt es einen Konflikt
 * statt eines stillen Überschreibens.
 */
export function writeState(db, userId, { settings, round, timeMs, revision }, now = Date.now()) {
  return transaction(db, () => {
    const current = ensureState(db, userId);
    if (Number.isFinite(revision) && revision !== current.revision) {
      return { conflict: true, state: readState(db, userId), cards: undefined };
    }

    const nextSettings = settings === undefined
      ? parseJson(current.settings, DEFAULT_SETTINGS)
      : { ...DEFAULT_SETTINGS, ...settings };
    const nextRound = round === undefined
      ? normalizeRound(parseJson(current.round, null))
      : normalizeRound(round);

    const totals = { ...DEFAULT_TOTALS, ...parseJson(current.totals, {}) };
    if (Number.isFinite(timeMs) && timeMs >= 0) {
      // Lernzeit wächst nur – sonst würde ein altes Gerät sie zurückdrehen.
      totals.timeMs = Math.max(totals.timeMs, Math.round(timeMs));
    }

    db.prepare(`UPDATE user_state
                SET settings = ?, round = ?, totals = ?, revision = revision + 1, updated_at = ?
                WHERE user_id = ?`)
      .run(JSON.stringify(nextSettings), JSON.stringify(nextRound), JSON.stringify(totals), now, userId);

    return { conflict: false, state: readState(db, userId) };
  });
}

/* ------------------------------------------------------------ Antworten */

/**
 * Ereignisse prüfen. Gibt saubere Ereignisse und die Gründe für Ablehnungen
 * zurück – Unbekanntes landet nie in der Datenbank.
 */
export function validateEvents(events, { knownQuestionIds, now = Date.now() } = {}) {
  const problems = [];
  const clean = [];
  if (!Array.isArray(events)) return { clean, problems: ['events muss eine Liste sein'] };
  if (events.length > MAX_EVENTS_PER_REQUEST) {
    return { clean, problems: [`höchstens ${MAX_EVENTS_PER_REQUEST} Ereignisse pro Anfrage`] };
  }

  const seen = new Set();
  for (const [i, event] of events.entries()) {
    const fail = reason => problems.push(`Ereignis ${i}: ${reason}`);
    if (!event || typeof event !== 'object') { fail('kein Objekt'); continue; }

    const { eventId, questionId, correct, ms, answeredAt } = event;
    if (typeof eventId !== 'string' || !eventId || eventId.length > MAX_ID_LENGTH) { fail('eventId fehlt oder ist zu lang'); continue; }
    if (seen.has(eventId)) { fail('eventId doppelt in derselben Anfrage'); continue; }
    if (typeof questionId !== 'string' || !questionId || questionId.length > MAX_ID_LENGTH) { fail('questionId fehlt'); continue; }
    if (knownQuestionIds && !knownQuestionIds.has(questionId)) { fail(`unbekannte Frage "${questionId}"`); continue; }
    if (typeof correct !== 'boolean') { fail('correct muss true oder false sein'); continue; }
    if (!Number.isFinite(answeredAt) || answeredAt <= 0 || answeredAt > now + 86_400_000) { fail('answeredAt unplausibel'); continue; }
    if (ms !== undefined && ms !== null && (!Number.isFinite(ms) || ms < 0 || ms > 3_600_000)) { fail('ms unplausibel'); continue; }

    seen.add(eventId);
    clean.push({
      eventId,
      questionId,
      correct,
      ms: Number.isFinite(ms) ? Math.round(ms) : null,
      answeredAt: Math.round(answeredAt)
    });
  }
  return { clean, problems };
}

/**
 * Kartenstand einer Frage vollständig aus dem Antwortprotokoll neu berechnen.
 * Bewusst kein Fortschreiben: So ist der Stand unabhängig davon, wann welches
 * Gerät seine Ereignisse abliefert.
 */
function rebuildQuestion(db, userId, questionId, now) {
  const rows = db.prepare(
    `SELECT correct, answered_at FROM answers
     WHERE user_id = ? AND question_id = ? ORDER BY answered_at, id`
  ).all(userId, questionId);

  if (!rows.length) {
    db.prepare('DELETE FROM cards WHERE user_id = ? AND question_id = ?').run(userId, questionId);
    return null;
  }

  const card = rebuildCard(rows.map(r => ({ correct: !!r.correct })));
  // "Zuletzt gesehen" ist die laufende Nummer der jüngsten Antwort im
  // Gesamtprotokoll – ebenfalls unabhängig von der Zustellreihenfolge.
  const newest = rows[rows.length - 1].answered_at;
  card.seenAt = db.prepare(
    'SELECT COUNT(*) AS n FROM answers WHERE user_id = ? AND answered_at <= ?'
  ).get(userId, newest).n - 1;

  db.prepare(`INSERT INTO cards (user_id, question_id, box, right_count, wrong_count, streak, seen_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(user_id, question_id) DO UPDATE SET
                box = excluded.box, right_count = excluded.right_count,
                wrong_count = excluded.wrong_count, streak = excluded.streak,
                seen_at = excluded.seen_at, updated_at = excluded.updated_at`)
    .run(userId, questionId, card.box, card.right, card.wrong, card.streak, card.seenAt, now);

  return card;
}

/** Summen aus dem Protokoll ableiten – nicht mitzählen, sondern nachrechnen. */
function recomputeTotals(db, userId, now) {
  const row = db.prepare(
    `SELECT COUNT(*) AS total, SUM(correct) AS right_count FROM answers WHERE user_id = ?`
  ).get(userId);
  const total = row.total || 0;
  const right = row.right_count || 0;

  const state = ensureState(db, userId, now);
  const totals = { ...DEFAULT_TOTALS, ...parseJson(state.totals, {}) };
  totals.total = total;
  totals.right = right;
  totals.wrong = total - right;

  db.prepare('UPDATE user_state SET totals = ?, seq = ?, revision = revision + 1, updated_at = ? WHERE user_id = ?')
    .run(JSON.stringify(totals), total, now, userId);

  return { totals, seq: total };
}

/**
 * Antwort-Ereignisse verbuchen.
 * @returns {{applied: number, duplicates: number, cards: object, totals: object, seq: number, revision: number}}
 */
export function applyAnswers(db, userId, events, now = Date.now()) {
  return transaction(db, () => {
    ensureState(db, userId, now);

    const insert = db.prepare(
      `INSERT OR IGNORE INTO answers (user_id, client_event_id, question_id, correct, ms, answered_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const touched = new Set();
    let applied = 0;
    let duplicates = 0;

    // Nach Antwortzeit sortieren: Der Kartenstand folgt der Lernreihenfolge,
    // nicht der Reihenfolge des Hochladens.
    for (const event of [...events].sort((a, b) => a.answeredAt - b.answeredAt)) {
      const info = insert.run(
        userId, event.eventId, event.questionId,
        event.correct ? 1 : 0, event.ms, event.answeredAt, now
      );
      if (info.changes === 0) { duplicates++; continue; }
      applied++;
      touched.add(event.questionId);
    }

    const cards = {};
    for (const questionId of touched) {
      const card = rebuildQuestion(db, userId, questionId, now);
      if (card) cards[questionId] = card;
    }

    const { totals, seq } = recomputeTotals(db, userId, now);
    const revision = db.prepare('SELECT revision FROM user_state WHERE user_id = ?').get(userId).revision;

    return { applied, duplicates, cards, totals, seq, revision };
  });
}

/**
 * Einmaliger Übertrag eines lokal erlernten Stands beim ersten Anmelden.
 * Nur erlaubt, solange das Konto noch keine einzige Antwort kennt – danach ist
 * der Server die Wahrheit und lokale Stände werden nicht mehr importiert.
 */
export function importBaseline(db, userId, { cards = {}, totals = {} }, knownQuestionIds, now = Date.now()) {
  return transaction(db, () => {
    const bereitsGelernt = db.prepare('SELECT COUNT(*) AS n FROM answers WHERE user_id = ?').get(userId).n;
    const bereitsKarten = db.prepare('SELECT COUNT(*) AS n FROM cards WHERE user_id = ?').get(userId).n;
    if (bereitsGelernt > 0 || bereitsKarten > 0) {
      return { imported: 0, conflict: true, cards: readCards(db, userId), state: readState(db, userId) };
    }

    const insert = db.prepare(`INSERT INTO cards
      (user_id, question_id, box, right_count, wrong_count, streak, seen_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    let imported = 0;
    for (const [questionId, raw] of Object.entries(cards)) {
      if (knownQuestionIds && !knownQuestionIds.has(questionId)) continue;
      const card = normalizeImportedCard(raw);
      if (!card) continue;
      insert.run(userId, questionId, card.box, card.right, card.wrong, card.streak, card.seenAt, now);
      imported++;
    }

    ensureState(db, userId, now);
    const vorhandene = { ...DEFAULT_TOTALS, ...parseJson(
      db.prepare('SELECT totals FROM user_state WHERE user_id = ?').get(userId).totals, {}) };
    const übernommen = {
      right: Math.max(0, Math.round(Number(totals.right) || 0)),
      wrong: Math.max(0, Math.round(Number(totals.wrong) || 0)),
      total: Math.max(0, Math.round(Number(totals.total) || 0)),
      timeMs: Math.max(vorhandene.timeMs, Math.round(Number(totals.timeMs) || 0))
    };
    db.prepare('UPDATE user_state SET totals = ?, revision = revision + 1, updated_at = ? WHERE user_id = ?')
      .run(JSON.stringify(übernommen), now, userId);

    return { imported, conflict: false, cards: readCards(db, userId), state: readState(db, userId) };
  });
}

function normalizeImportedCard(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const zahl = (v, min, max, fallback) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  return {
    box: zahl(raw.box, 1, MAX_BOX, 1),
    right: zahl(raw.right, 0, 100000, 0),
    wrong: zahl(raw.wrong, 0, 100000, 0),
    streak: zahl(raw.streak, 0, 100000, 0),
    seenAt: zahl(raw.seenAt, -1, 10_000_000, -1)
  };
}

/* ------------------------------------------------------------ Auswertung */

export function buildStats(db, userId, questionsById = new Map()) {
  const cards = readCards(db, userId);
  const boxes = [0, 0, 0, 0, 0];
  const byCategory = {};
  let mastered = 0;

  for (const [questionId, card] of Object.entries(cards)) {
    boxes[card.box - 1]++;
    if (card.box >= MAX_BOX) mastered++;
    const cat = questionsById.get(questionId)?.cat || 'unbekannt';
    const entry = byCategory[cat] ||= { seen: 0, mastered: 0, right: 0, wrong: 0 };
    entry.seen++;
    entry.right += card.right;
    entry.wrong += card.wrong;
    if (card.box >= MAX_BOX) entry.mastered++;
  }

  const perDay = db.prepare(
    `SELECT date(answered_at / 1000, 'unixepoch') AS tag,
            COUNT(*) AS gesamt,
            SUM(correct) AS richtig
     FROM answers WHERE user_id = ?
     GROUP BY tag ORDER BY tag DESC LIMIT 60`
  ).all(userId).map(r => ({ tag: r.tag, gesamt: r.gesamt, richtig: r.richtig || 0 }));

  const hardest = db.prepare(
    `SELECT question_id, wrong_count, right_count FROM cards
     WHERE user_id = ? AND wrong_count > 0
     ORDER BY (wrong_count - right_count) DESC, wrong_count DESC LIMIT 10`
  ).all(userId).map(r => ({
    questionId: r.question_id,
    wrong: r.wrong_count,
    right: r.right_count,
    frage: questionsById.get(r.question_id)?.q || null
  }));

  // Die Stufe wird hier genauso gerechnet wie im Browser – gleicher Kern,
  // gleiche Karten, gleiches Ergebnis. Sie wird nirgends gespeichert, damit
  // Server und Gerät nicht auseinanderlaufen können.
  const state = readState(db, userId);
  const questions = [...questionsById.values()];
  const stages = questions.length
    ? stageStatus(questions, id => cards[id] || null, state.settings?.stage || DEFAULT_STAGE)
    : null;

  return {
    ...state,
    cardCount: Object.keys(cards).length,
    mastered, boxes, byCategory, perDay, hardest, stages
  };
}

export function deleteUser(db, userId) {
  return transaction(db, () => {
    // Fremdschlüssel mit ON DELETE CASCADE räumen den Rest ab.
    return db.prepare('DELETE FROM users WHERE id = ?').run(userId).changes > 0;
  });
}
