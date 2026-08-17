// SPDX-License-Identifier: Apache-2.0
// Der Server kennt den Fragenpool – aus derselben Quelle wie die App.
//
// Damit landen nur echte Fragen-IDs in der Datenbank, und die Auswertung kann
// Kategorien und Fragetexte benennen, ohne sie zu doppeln.

import { QUESTIONS } from '../js/data/index.js';
import { CATEGORIES, LEVELS } from '../js/data/categories.js';

export const QUESTION_IDS = new Set(QUESTIONS.map(q => q.id));

export const QUESTIONS_BY_ID = new Map(
  QUESTIONS.map(q => [q.id, { id: q.id, cat: q.cat, level: q.level, type: q.type, q: q.q, twin: q.twin }])
);

export function questionSummary() {
  const byCategory = {};
  for (const q of QUESTIONS) byCategory[q.cat] = (byCategory[q.cat] || 0) + 1;
  return {
    count: QUESTIONS.length,
    categories: CATEGORIES.map(c => ({ ...c, count: byCategory[c.id] || 0 })),
    levels: LEVELS
  };
}
