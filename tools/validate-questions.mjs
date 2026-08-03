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
    case 'order': {
      if (!Array.isArray(q.items) || q.items.length < 3) { fail(q, 'braucht mindestens 3 Elemente'); break; }
      const labels = q.items.map(i => (typeof i === 'string' ? i : i?.label));
      if (labels.some(l => typeof l !== 'string' || !l)) fail(q, 'jedes Element braucht einen Text bzw. label');
      if (new Set(labels).size !== labels.length) fail(q, 'doppelte Elemente in der Reihenfolge');
      // Diagramm-Elemente: gleiche Hufkombination waere nicht unterscheidbar
      const shapes = q.items.filter(i => typeof i === 'object' && Array.isArray(i.hooves))
        .map(i => [...i.hooves].sort().join('+'));
      if (shapes.length && shapes.length !== q.items.length) fail(q, 'entweder alle oder kein Element mit Diagramm');
      if (new Set(shapes).size !== shapes.length) fail(q, 'zwei Diagramme sind identisch – die Reihenfolge waere nicht eindeutig');
      const legal = new Set(['VL', 'VR', 'HL', 'HR']);
      for (const i of q.items) {
        if (typeof i === 'object' && Array.isArray(i.hooves) && i.hooves.some(h => !legal.has(h))) {
          fail(q, `unbekanntes Huf-Kuerzel in ${JSON.stringify(i.hooves)}`);
        }
      }
      break;
    }
    case 'pyramid': {
      if (!Array.isArray(q.levels) || q.levels.length < 3) { fail(q, 'braucht mindestens 3 Stufen'); break; }
      if (new Set(q.levels).size !== q.levels.length) fail(q, 'doppelte Stufen');
      const n = q.levels.length;
      for (const g of q.given || []) {
        if (!Number.isInteger(g) || g < 0 || g >= n) fail(q, `vorgegebene Stufe ${g} liegt ausserhalb`);
      }
      if ((q.given || []).length >= n) fail(q, 'es muss mindestens eine Stufe zu fuellen bleiben');
      for (const grp of q.groups || []) {
        if (!Number.isInteger(grp.from) || !Number.isInteger(grp.to) || grp.from > grp.to
          || grp.from < 0 || grp.to >= n) fail(q, 'Gruppenbereich ungueltig');
        if (!grp.label) fail(q, 'Gruppe ohne Beschriftung');
      }
      break;
    }
    case 'match':
      if (!Array.isArray(q.pairs) || q.pairs.length < 2) fail(q, 'braucht mindestens 2 Paare');
      else {
        if (q.pairs.some(p => !Array.isArray(p) || p.length !== 2)) fail(q, 'Paare müssen [links, rechts] sein');
        const rights = q.pairs.map(p => p[1]);
        if (new Set(rights).size < 2) fail(q, 'braucht mindestens zwei verschiedene Antworten');
        const lefts = q.pairs.map(p => p[0]);
        if (new Set(lefts).size !== lefts.length) fail(q, 'linke Spalte enthält Dubletten');
      }
      break;
    default:
      fail(q, `unbekannter Fragetyp "${q.type}"`);
  }
}

// Verwandte Fragen ("twin") müssen mindestens zu zweit sein
const twins = {};
for (const q of QUESTIONS) if (q.twin) (twins[q.twin] ||= []).push(q.id);
for (const [name, ids] of Object.entries(twins)) {
  if (ids.length < 2) errors.push(`twin "${name}" hat nur eine Frage (${ids[0]}) – Tippfehler?`);
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
console.log('Verwandte Fragengruppen:', Object.fromEntries(Object.entries(twins).map(([k, v]) => [k, v.length])));

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
