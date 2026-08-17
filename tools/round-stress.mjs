// SPDX-License-Identifier: Apache-2.0
// Stresstest der Rundenregel am echten Fragenpool:
// "Sobald eine Frage in einer Runde richtig beantwortet wurde, darf sie in
//  derselben Runde nicht noch einmal kommen."
//
// Dabei wird nachgestellt, was Nutzerinnen tatsächlich tun: Kategorien
// umschalten, Stufen filtern, "nur schwierige Fragen" ein- und ausschalten.
//
// Aufruf: node tools/round-stress.mjs [durchläufe]

const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k)
};

const { loadState } = await import('../js/store.js');
const { pickInRound, queueRetry, clearRetry, recordAnswer, newRound, isHard } =
  await import('../js/srs.js');
const { QUESTIONS } = await import('../js/data/index.js');
const { CATEGORIES, LEVELS } = await import('../js/data/categories.js');

loadState();

const LAEUFE = Number(process.argv[2] || 5);
const FRAGEN_JE_LAUF = 1500;
const errors = [];
let geprüfteRunden = 0;
let verletzungen = 0;

const zufall = arr => arr[Math.floor(Math.random() * arr.length)];

for (let lauf = 0; lauf < LAEUFE; lauf++) {
  mem.clear();
  loadState();
  const round = newRound();
  let cats = new Set(CATEGORIES.map(c => c.id));
  let levels = new Set(LEVELS.map(l => l.id));
  let hardOnly = false;
  let last = null;

  // je Runde: welche Fragen wurden in dieser Runde bereits richtig beantwortet
  let richtigInRunde = new Set();

  const poolBauen = () => {
    let pool = QUESTIONS.filter(q => cats.has(q.cat) && levels.has(q.level));
    if (hardOnly) {
      const hart = pool.filter(q => isHard(q.id));
      if (hart.length) pool = hart;
    }
    return pool;
  };

  for (let i = 0; i < FRAGEN_JE_LAUF; i++) {
    // ab und zu die Auswahl ändern – wie beim Herumtippen auf dem Startbildschirm
    if (i % 47 === 0 && i > 0) {
      cats = new Set(CATEGORIES.filter(() => Math.random() > 0.35).map(c => c.id));
      if (!cats.size) cats.add(zufall(CATEGORIES).id);
    }
    if (i % 113 === 0 && i > 0) {
      levels = new Set(LEVELS.filter(() => Math.random() > 0.3).map(l => l.id));
      if (!levels.size) levels.add(zufall(LEVELS).id);
    }
    if (i % 201 === 0 && i > 0) hardOnly = !hardOnly;

    const pool = poolBauen();
    if (!pool.length) continue;

    const { question, newPass } = pickInRound(pool, round, { useSrs: true, lastId: last });
    if (!question) { errors.push(`Lauf ${lauf}: keine Frage mehr geliefert`); break; }
    if (newPass) { richtigInRunde = new Set(); geprüfteRunden++; }

    if (richtigInRunde.has(question.id)) {
      verletzungen++;
      if (errors.length < 10) {
        errors.push(`Lauf ${lauf}, Frage ${i}: ${question.id} kam erneut, obwohl in dieser Runde bereits richtig`);
      }
    }

    const correct = Math.random() > 0.4;
    recordAnswer(question.id, correct);
    if (correct) {
      clearRetry(round, question.id);
      richtigInRunde.add(question.id);
    } else {
      queueRetry(round, question.id, pool.length);
    }
    last = question.id;
  }
}

console.log(`${LAEUFE} Läufe à ${FRAGEN_JE_LAUF} Fragen, ${geprüfteRunden} Rundenwechsel.`);
console.log(`Verstöße gegen die Regel: ${verletzungen}`);

if (errors.length) {
  console.error(`\n${errors.length} Fehler (gekürzt):`);
  errors.forEach(e => console.error('  -', e));
  process.exit(1);
}
console.log('\nAuch bei wechselnden Kategorien, Stufen und Filtern hält die Regel.');
