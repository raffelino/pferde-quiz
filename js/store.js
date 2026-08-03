// Persistenz von Lernfortschritt, Statistik und Einstellungen (localStorage).

const KEY = 'reitabzeichen-trainer.v1';

const DEFAULT_STATE = () => ({
  version: 1,
  settings: {
    cats: null,          // null = alle Kategorien aktiv
    levels: null,        // null = alle Stufen aktiv
    srs: true,
    hardOnly: false,
    shuffle: true,
    session: 'endless'   // Sitzungslänge: endless | t5 | t10 | t20 | c20
  },
  // cards[fragenId] = { box, right, wrong, streak, seenAt }
  cards: {},
  totals: { right: 0, wrong: 0, total: 0, timeMs: 0 },
  seq: 0                 // Zähler der beantworteten Fragen (für "zuletzt gesehen")
});

let state = DEFAULT_STATE();
let saveTimer = null;

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...DEFAULT_STATE(), ...parsed };
      state.settings = { ...DEFAULT_STATE().settings, ...(parsed.settings || {}) };
      state.totals = { ...DEFAULT_STATE().totals, ...(parsed.totals || {}) };
      state.cards = parsed.cards || {};
    }
  } catch (err) {
    console.warn('Gespeicherter Fortschritt konnte nicht gelesen werden:', err);
    state = DEFAULT_STATE();
  }
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
  const settings = state.settings;
  state = DEFAULT_STATE();
  state.settings = settings;
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
