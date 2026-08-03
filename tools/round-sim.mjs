// Simulation der Rundenlogik:
//   * Kommt wirklich jede Frage einmal dran, bevor sich etwas wiederholt?
//   * Bleiben richtig beantwortete Fragen bis zum Rundenende außen vor?
//   * Kommen falsche Fragen mit Abstand nochmal – und öfter als richtige?
//   * Wirkt die Priorisierung einer Kategorie?
//
// Aufruf: node tools/round-sim.mjs

const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k)
};

const { loadState } = await import('../js/store.js');
const { pickInRound, queueRetry, recordAnswer, newRound, RETRY_GAP } = await import('../js/srs.js');

loadState();

const POOL = Array.from({ length: 40 }, (_, i) => ({
  id: `q${i}`,
  cat: i < 10 ? 'wichtig' : 'normal'
}));
const HARD = new Set(['q3', 'q17']);         // diese beiden werden immer falsch beantwortet
const errors = [];

/* -------- 1) Zwei Runden: Abdeckung, keine Wiederholung, Abstand ---------- */
{
  const round = newRound();
  const rounds = [[]];       // gestellte Fragen je Runde
  const all = [];            // alle Fragen in Reihenfolge
  const lastSeen = {};       // id -> Position in "all"
  let last = null;
  let counted = 0;

  while (rounds.length <= 2) {
    const { question, newPass, retry } = pickInRound(POOL, round, { useSrs: true, lastId: last });
    if (newPass) {
      if (rounds.length === 2) break;
      rounds.push([]);
    }
    if (retry && lastSeen[question.id] !== undefined) {
      const gap = all.length - lastSeen[question.id];
      if (gap < RETRY_GAP) {
        errors.push(`${question.id} kam schon nach ${gap} Fragen wieder (mindestens ${RETRY_GAP})`);
      }
    }
    const correct = !HARD.has(question.id);
    recordAnswer(question.id, correct);
    if (!correct) queueRetry(round, question.id);
    rounds[rounds.length - 1].push(question.id);
    lastSeen[question.id] = all.length;
    all.push(question.id);
    last = question.id;
    if (++counted > 500) { errors.push('Endlosschleife in der Rundenlogik'); break; }
  }

  rounds.forEach((order, idx) => {
    const unique = new Set(order);
    if (unique.size !== POOL.length) {
      errors.push(`Runde ${idx + 1} deckte nur ${unique.size} von ${POOL.length} Fragen ab`);
    }
    for (const id of POOL.map(q => q.id)) {
      const count = order.filter(x => x === id).length;
      if (!HARD.has(id) && count !== 1) {
        errors.push(`${id} kam in Runde ${idx + 1} ${count}× vor, obwohl beim ersten Mal richtig`);
      }
    }
  });

  for (const id of HARD) {
    const count = all.filter(x => x === id).length;
    if (count < 4) errors.push(`${id} wurde immer falsch beantwortet, kam aber nur ${count}× dran`);
  }

  console.log(`Zwei Runden: ${rounds.map(r => r.length).join(' + ')} Fragen gestellt.`);
  console.log(`Dauerhaft falsche Fragen: ${[...HARD].map(id => `${id}×${all.filter(x => x === id).length}`).join(', ')}`);
}

/* ---------------- 2) Priorisierung: wichtige Kategorie kommt früher -------- */
{
  const round = newRound();
  const prio = { wichtig: 3 };
  const positions = [];
  let last = null;

  for (let i = 0; i < POOL.length; i++) {
    const { question } = pickInRound(POOL, round, { useSrs: true, lastId: last, prio });
    if (question.cat === 'wichtig') positions.push(i);
    recordAnswer(question.id, true);
    last = question.id;
  }
  const avg = positions.reduce((a, b) => a + b, 0) / positions.length;
  const neutral = (POOL.length - 1) / 2;
  console.log(`Priorisierte Kategorie: durchschnittliche Position ${avg.toFixed(1)} von ${POOL.length} (ohne Priorität wären ~${neutral}).`);
  if (avg >= neutral) errors.push('Priorisierte Kategorie kam nicht früher dran als der Rest');
}

/* ---------------- 3) Rundenwechsel ---------------------------------------- */
{
  const round = newRound();
  let last = null;
  let passes = 1;
  for (let i = 0; i < POOL.length * 2 + 5; i++) {
    const { question, newPass } = pickInRound(POOL, round, { useSrs: true, lastId: last });
    if (newPass) passes++;
    recordAnswer(question.id, true);
    last = question.id;
  }
  if (passes !== round.pass) errors.push(`Rundenzähler ist ${round.pass}, gezählt wurden ${passes}`);
  if (passes < 2) errors.push('Nach dem Durchlauf begann keine neue Runde');
  console.log(`Nach ${POOL.length * 2 + 5} Fragen: Runde ${round.pass}.`);
}

if (errors.length) {
  console.error(`\n${errors.length} Fehler:`);
  errors.forEach(e => console.error('  -', e));
  process.exit(1);
}
console.log('\nRundenlogik arbeitet wie erwartet.');
