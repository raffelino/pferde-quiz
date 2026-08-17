// SPDX-License-Identifier: Apache-2.0
// Persistenz von Lernfortschritt, Statistik und Einstellungen (localStorage).

import { stageForLevels } from './core/stages.js';

const KEY = 'reitabzeichen-trainer.v1';

const DEFAULT_STATE = () => ({
  version: 1,
  settings: {
    cats: null,          // null = alle Kategorien aktiv
    levels: null,        // null = alle Schwierigkeiten aktiv
    stage: 'einsteiger', // Ausbildungsstufe: einsteiger | fortgeschritten | profi
    stageSeen: null,     // hoechste Stufe, deren Aufstieg schon gefeiert wurde
    srs: true,
    hardOnly: false,
    shuffle: true,
    session: 'endless',  // Sitzungslänge: endless | t5 | t10 | t20 | c20
    prio: {}             // Kategorie-Gewichtung: { katId: 2 } = kommt doppelt so oft
  },
  // cards[fragenId] = { box, right, wrong, streak, seenAt }
  cards: {},
  // Laufende Runde: jede Frage einmal, falsche zusätzlich in der Nachholrunde
  round: { pass: 1, asked: [], retry: [], counts: {}, recent: [] },
  // Konto und noch nicht gesendete Antworten (siehe js/sync.js)
  account: {},
  outbox: [],
  totals: { right: 0, wrong: 0, total: 0, timeMs: 0 },
  seq: 0                 // Zähler der beantworteten Fragen (für "zuletzt gesehen")
});

let state = DEFAULT_STATE();
let saveTimer = null;

export function loadState() {
  let migriert = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...DEFAULT_STATE(), ...parsed };
      state.settings = { ...DEFAULT_STATE().settings, ...(parsed.settings || {}) };
      state.totals = { ...DEFAULT_STATE().totals, ...(parsed.totals || {}) };
      state.cards = parsed.cards || {};
      state.settings.prio = parsed.settings?.prio || {};
      state.round = parsed.round || DEFAULT_STATE().round;
      state.account = parsed.account && typeof parsed.account === 'object' ? parsed.account : {};
      state.outbox = Array.isArray(parsed.outbox) ? parsed.outbox : [];

      // Stände von vor dem Stufensystem: Die Stufe aus der bisherigen
      // Schwierigkeitsauswahl ableiten. Sonst würde ein Update den
      // Trainingsumfang stillschweigend auf "Einsteiger" zusammenstreichen.
      if (parsed.settings && parsed.settings.stage === undefined) {
        state.settings.stage = stageForLevels(parsed.settings.levels ?? null);
        migriert = true;
      }
    }
  } catch (err) {
    console.warn('Gespeicherter Fortschritt konnte nicht gelesen werden:', err);
    state = DEFAULT_STATE();
  }
  // Eine Migration wird sofort festgeschrieben: Sonst stünde die abgeleitete
  // Stufe nur im Arbeitsspeicher und würde weder ein zweites Gerät noch den
  // Server je erreichen.
  if (migriert) saveNow();
  return state;
}

export function getState() {
  return state;
}

export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Fortschritt konnte nicht gespeichert werden:', err);
    }
  }, 120);
}

export function saveNow() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Fortschritt konnte nicht gespeichert werden:', err);
  }
}

export function resetProgress() {
  const { settings, account } = state;
  state = DEFAULT_STATE();
  state.settings = settings;
  state.account = account;      // Anmeldung bleibt bestehen
  saveNow();
  return state;
}

/** Karteikarte holen oder anlegen. */
export function getCard(id) {
  let card = state.cards[id];
  if (!card) {
    card = { box: 1, right: 0, wrong: 0, streak: 0, seenAt: -1 };
    state.cards[id] = card;
  }
  return card;
}

export function hasCard(id) {
  return Object.prototype.hasOwnProperty.call(state.cards, id);
}
