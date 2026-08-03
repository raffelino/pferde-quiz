// Simulation des Karteikasten-Systems: kommen falsch beantwortete Fragen
// tatsächlich häufiger dran?  Aufruf:  node tools/srs-sim.mjs

const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k)
};

const { loadState } = await import('../js/store.js');
const { pickNext, recordAnswer, poolProgress } = await import('../js/srs.js');

loadState();

const POOL = Array.from({ length: 20 }, (_, i) => ({ id: `q${i}` }));
const ALWAYS_WRONG = new Set(['q0', 'q1']);   // diese beiden „kann" der Lernende nicht
const ROUNDS = 600;

const seen = Object.fromEntries(POOL.map(q => [q.id, 0]));
let last = null;

for (let i = 0; i < ROUNDS; i++) {
  const q = pickNext(POOL, true, last);
  seen[q.id]++;
  recordAnswer(q.id, !ALWAYS_WRONG.has(q.id));
  last = q.id;
}

const hardAvg = [...ALWAYS_WRONG].reduce((s, id) => s + seen[id], 0) / ALWAYS_WRONG.size;
const easyIds = POOL.map(q => q.id).filter(id => !ALWAYS_WRONG.has(id));
const easyAvg = easyIds.reduce((s, id) => s + seen[id], 0) / easyIds.length;
const prog = poolProgress(POOL);

console.log(`Runden: ${ROUNDS}`);
console.log(`Ø Abfragen einer dauerhaft falschen Frage: ${hardAvg.toFixed(1)}`);
console.log(`Ø Abfragen einer beherrschten Frage:       ${easyAvg.toFixed(1)}`);
console.log(`Faktor: ${(hardAvg / easyAvg).toFixed(1)}×`);
console.log(`Gelernt (Fach 5): ${prog.mastered}/${prog.total}, Fächerverteilung:`, prog.boxes);

if (hardAvg <= easyAvg * 2) {
  console.error('\nFehler: schwierige Fragen kommen nicht deutlich häufiger dran.');
  process.exit(1);
}
if (prog.mastered !== easyIds.length) {
  console.error('\nFehler: beherrschte Fragen sollten alle in Fach 5 stehen.');
  process.exit(1);
}
console.log('\nKarteikasten arbeitet wie erwartet.');
