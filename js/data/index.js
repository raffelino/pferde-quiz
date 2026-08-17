// SPDX-License-Identifier: Apache-2.0
import pferdekunde from './q-pferdekunde.js';
import gesundheit from './q-gesundheit.js';
import reiten from './q-reiten.js';
import praxis from './q-praxis.js';
import hilfen from './q-hilfen.js';
import gangarten from './q-gangarten.js';
import ausbildung from './q-ausbildung.js';

/** Gesamter Fragenpool. */
export const QUESTIONS = [
  ...pferdekunde, ...gesundheit, ...reiten, ...praxis,
  ...hilfen, ...gangarten, ...ausbildung
];

// Doppelte IDs würden den Lernfortschritt vermischen -> in der Konsole melden.
const seen = new Set();
for (const q of QUESTIONS) {
  if (seen.has(q.id)) console.warn('Doppelte Frage-ID:', q.id);
  seen.add(q.id);
}

export const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
