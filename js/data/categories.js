// Kategorien und Schwierigkeitsstufen des Fragenpools.

export const CATEGORIES = [
  { id: 'anatomie',   name: 'Anatomie & Körperbau',        emoji: '🦴' },
  { id: 'rassen',     name: 'Rassen, Farben & Abzeichen',  emoji: '🎨' },
  { id: 'haltung',    name: 'Haltung & Stallmanagement',   emoji: '🏠' },
  { id: 'fuetterung', name: 'Fütterung',                   emoji: '🌾' },
  { id: 'gesundheit', name: 'Gesundheit & Erste Hilfe',    emoji: '🩺' },
  { id: 'hufe',       name: 'Hufe & Beschlag',             emoji: '🧲' },
  { id: 'verhalten',  name: 'Verhalten & Umgang',          emoji: '🧠' },
  { id: 'ausruestung',name: 'Ausrüstung & Sattelkunde',    emoji: '🪢' },
  { id: 'reitlehre',  name: 'Reitlehre & Hilfen',          emoji: '🏇' },
  { id: 'bahn',       name: 'Bahnregeln & Hufschlagfiguren', emoji: '📐' },
  { id: 'longieren',  name: 'Longieren & Bodenarbeit',     emoji: '🔄' },
  { id: 'sicherheit', name: 'Sicherheit, Ausreiten & Recht', emoji: '🦺' },
  { id: 'turnier',    name: 'Turnier & Wettkampf',         emoji: '🏆' },
  { id: 'zucht',      name: 'Zucht & Aufzucht',            emoji: '🐣' }
];

export const LEVELS = [
  { id: 'basis',  name: 'Basis',  hint: 'Basispass / RA 10–6' },
  { id: 'aufbau', name: 'Aufbau', hint: 'RA 5 & 4' },
  { id: 'profi',  name: 'Profi',  hint: 'RA 3–1' }
];

export const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
export const LEVEL_BY_ID = Object.fromEntries(LEVELS.map(l => [l.id, l]));
