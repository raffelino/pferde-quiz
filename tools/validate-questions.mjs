// Prüft den Fragenpool auf Struktur- und Konsistenzfehler.
// Aufruf:  node tools/validate-questions.mjs

import { QUESTIONS } from '../js/data/index.js';
import { CATEGORIES, LEVELS } from '../js/data/categories.js';

const catIds = new Set(CATEGORIES.map(c => c.id));
const levelIds = new Set(LEVELS.map(l => l.id));
const errors = [];
const warnings = [];
const ids = new Set();

const fail = (q, msg) => errors.push(`${q.id ?? '???'} (${q.cat ?? '?'}): ${msg}`);
const warn = (q, msg) => warnings.push(`${q.id ?? '???'}: ${msg}`);

for (const q of QUESTIONS) {
  if (!q.id) { errors.push('Frage ohne ID'); continue; }
  if (ids.has(q.id)) fail(q, 'doppelte ID');
  ids.add(q.id);

  if (!catIds.has(q.cat)) fail(q, `unbekannte Kategorie "${q.cat}"`);
  if (!levelIds.has(q.level)) fail(q, `unbekannte Stufe "${q.level}"`);
  if (!q.q || q.q.length < 10) fail(q, 'Fragetext fehlt oder ist zu kurz');
  if (!q.explain) warn(q, 'keine Erklärung hinterlegt');

  switch (q.type) {
    case 'single':
      if (!Array.isArray(q.options) || q.options.length < 2) fail(q, 'braucht mindestens 2 Optionen');
      else if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.options.length) fail(q, `Antwortindex ${q.a} ungültig`);
      break;
    case 'multi':
      if (!Array.isArray(q.options) || q.options.length < 3) fail(q, 'braucht mindestens 3 Optionen');
      else if (!Array.isArray(q.a) || q.a.length === 0) fail(q, 'braucht mindestens eine richtige Antwort');
      else {
        if (q.a.some(i => !Number.isInteger(i) || i < 0 || i >= q.options.length)) fail(q, 'Antwortindex außerhalb der Optionen');
        if (new Set(q.a).size !== q.a.length) fail(q, 'doppelter Antwortindex');
        if (q.a.length === q.options.length) warn(q, 'alle Optionen sind richtig');
      }
      break;
    case 'truefalse':
      if (typeof q.a !== 'boolean') fail(q, 'Antwort muss true/false sein');
      break;
    case 'text':
      if (!Array.isArray(q.a) || !q.a.length || q.a.some(s => typeof s !== 'string')) fail(q, 'braucht eine Liste akzeptierter Antworten');
      break;
    case 'number':
      if (typeof q.a !== 'number') fail(q, 'Antwort muss eine Zahl sein');
      if (q.tol !== undefined && (typeof q.tol !== 'number' || q.tol < 0)) fail(q, 'Toleranz ungültig');
      break;
    case 'order':
      if (!Array.isArray(q.items) || q.items.length < 3) fail(q, 'braucht mindestens 3 Elemente');
      else if (new Set(q.items).size !== q.items.length) fail(q, 'doppelte Elemente in der Reihenfolge');
      break;
    case 'match':
      if (!Array.isArray(q.pairs) || q.pairs.length < 2) fail(q, 'braucht mindestens 2 Paare');
      else {
        if (q.pairs.some(p => !Array.isArray(p) || p.length !== 2)) fail(q, 'Paare müssen [links, rechts] sein');
        const rights = q.pairs.map(p => p[1]);
        if (new Set(rights).size !== rights.length) fail(q, 'rechte Spalte enthält Dubletten (Zuordnung wäre mehrdeutig)');
        const lefts = q.pairs.map(p => p[0]);
        if (new Set(lefts).size !== lefts.length) fail(q, 'linke Spalte enthält Dubletten');
      }
      break;
    default:
      fail(q, `unbekannter Fragetyp "${q.type}"`);
  }
}

// Verteilung ausgeben
const byCat = {};
const byType = {};
const byLevel = {};
for (const q of QUESTIONS) {
  byCat[q.cat] = (byCat[q.cat] || 0) + 1;
  byType[q.type] = (byType[q.type] || 0) + 1;
  byLevel[q.level] = (byLevel[q.level] || 0) + 1;
}

console.log(`Fragen gesamt: ${QUESTIONS.length}`);
console.log('Nach Kategorie:', byCat);
console.log('Nach Typ:', byType);
console.log('Nach Stufe:', byLevel);

for (const c of CATEGORIES) {
  if (!byCat[c.id]) errors.push(`Kategorie "${c.id}" hat keine Fragen`);
}

if (warnings.length) {
  console.log(`\n${warnings.length} Hinweis(e):`);
  warnings.forEach(w => console.log('  -', w));
}

if (errors.length) {
  console.error(`\n${errors.length} Fehler:`);
  errors.forEach(e => console.error('  -', e));
  process.exit(1);
}
console.log('\nAlles in Ordnung.');
