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
const { pickInRound, queueRetry, clearRetry, recordAnswer, newRound, RETRY_MIN_GAP } = await import('../js/srs.js');

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
  const gaps = [];           // beobachtete Abstände bis zur Wiederholung
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
      gaps.push(gap);
      if (gap < RETRY_MIN_GAP) {
        errors.push(`${question.id} kam schon nach ${gap} Fragen wieder (mindestens ${RETRY_MIN_GAP})`);
      }
    }
    const correct = !HARD.has(question.id);
    recordAnswer(question.id, correct);
    if (correct) clearRetry(round, question.id);
    else queueRetry(round, question.id);
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

  // Dauerhaft falsche Fragen kommen deutlich öfter als richtige (die genau 2×
  // in zwei Runden vorkommen). Eine aus der Vorrunde übernommene Wiederholung
  // belegt dabei den regulären Platz der neuen Runde.
  for (const id of HARD) {
    const count = all.filter(x => x === id).length;
    if (count < 3) errors.push(`${id} wurde immer falsch beantwortet, kam aber nur ${count}× dran`);
  }

  console.log(`Zwei Runden: ${rounds.map(r => r.length).join(' + ')} Fragen gestellt.`);
  console.log(`Dauerhaft falsche Fragen: ${[...HARD].map(id => `${id}×${all.filter(x => x === id).length}`).join(', ')}`);
  console.log(`Abstände bis zur Wiederholung: ${gaps.sort((a, b) => a - b).join(', ')}`);
  if (new Set(gaps).size < 2) errors.push('Die Abstände sind immer gleich – der Zufall fehlt');
}

/* ---- 1b) Richtig beantwortet = in dieser Runde nicht mehr ---------------- */
//
// Drei Verhaltensmuster im selben Durchlauf:
//   IMMER_FALSCH  -> darf mehrfach kommen (1 + bis zu 2 Wiederholungen)
//   ERST_FALSCH   -> beim ersten Mal falsch, in der Wiederholung richtig
//                    -> danach ist Schluss für diese Runde (genau 2×)
//   Rest          -> sofort richtig -> genau 1× pro Runde
{
  const IMMER_FALSCH = new Set(['q5']);
  const ERST_FALSCH = new Set(['q11', 'q29']);
  const round = newRound();
  const rounds = [[]];
  const antworten = {};        // id -> Liste der gegebenen Antworten (true/false)
  let last = null;
  let guard = 0;

  while (rounds.length <= 3) {
    const { question, newPass } = pickInRound(POOL, round, { useSrs: true, lastId: last });
    if (newPass) {
      if (rounds.length === 3) break;
      rounds.push([]);
    }
    const id = question.id;
    const versuch = (antworten[id] || []).length;
    let correct;
    if (IMMER_FALSCH.has(id)) correct = false;
    else if (ERST_FALSCH.has(id)) correct = versuch > 0;   // nur der erste Versuch ist falsch
    else correct = true;

    recordAnswer(id, correct);
    if (correct) clearRetry(round, id);
    else queueRetry(round, id, POOL.length);
    (antworten[id] ||= []).push(correct);
    rounds[rounds.length - 1].push(id);
    last = id;
    if (++guard > 600) { errors.push('Endlosschleife (1b)'); break; }
  }

  // Die eigentliche Regel: Sobald eine Frage in einer Runde richtig beantwortet
  // wurde, darf sie in derselben Runde nicht noch einmal gestellt werden.
  rounds.forEach((order, idx) => {
    const schonRichtig = new Set();
    order.forEach((id, k) => {
      if (schonRichtig.has(id)) {
        errors.push(`${id} kam in Runde ${idx + 1} an Position ${k + 1} erneut, obwohl vorher richtig beantwortet`);
      }
      const versuche = antworten[id] || [];
      // Antworten in Reihenfolge: die k-te Nennung dieser Frage
      const nennung = order.slice(0, k + 1).filter(x => x === id).length - 1;
      const offsetVorherigeRunden = rounds.slice(0, idx).flat().filter(x => x === id).length;
      if (versuche[offsetVorherigeRunden + nennung] === true) schonRichtig.add(id);
    });
  });

  const proRunde = rounds.map((order, i) => {
    const wieder = order.filter((id, k) => order.indexOf(id) !== k).length;
    return `R${i + 1}: ${order.length} Fragen, ${wieder} Wiederholung(en)`;
  });
  console.log(`Richtig = einmal pro Runde – ${proRunde.join(' | ')}`);
  console.log(`  q11 (erst falsch, dann richtig): ${rounds.map(r => r.filter(x => x === 'q11').length).join(', ')} pro Runde`);
  console.log(`  q5 (immer falsch): ${rounds.map(r => r.filter(x => x === 'q5').length).join(', ')} pro Runde`);
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

/* ---------------- 2c) Streuung der Wiederholungsabstände ------------------ */
{
  const { retryDelay, RETRY_SPREAD } = await import('../js/srs.js');
  const first = Array.from({ length: 400 }, () => retryDelay(1, 250));
  const second = Array.from({ length: 400 }, () => retryDelay(2, 250));
  const range = arr => [Math.min(...arr), Math.max(...arr)];
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const [f1, f2] = range(first);
  const [s1, s2] = range(second);
  console.log(`1. Wiederholung: ${f1}–${f2} Fragen (Ø ${avg(first).toFixed(1)})`);
  console.log(`2. Wiederholung: ${s1}–${s2} Fragen (Ø ${avg(second).toFixed(1)})`);
  if (f1 < RETRY_MIN_GAP) errors.push(`Mindestabstand unterschritten: ${f1}`);
  if (f2 - f1 < 3) errors.push('Zu wenig Streuung bei der ersten Wiederholung');
  if (f2 >= RETRY_MIN_GAP + RETRY_SPREAD) errors.push(`Abstand über dem erwarteten Fenster: ${f2}`);
  if (avg(second) <= avg(first) * 1.5) errors.push('Die zweite Wiederholung liegt nicht deutlich später');
}

/* ---------------- 2d) Sehr kleiner Pool (eine Kategorie) ------------------ */
{
  const SMALL = Array.from({ length: 6 }, (_, i) => ({ id: `s${i}`, cat: 'klein' }));
  const round = newRound();
  const seen = [];
  let last = null;
  for (let i = 0; i < 18; i++) {
    const { question } = pickInRound(SMALL, round, { useSrs: true, lastId: last });
    if (!question) { errors.push('Kleiner Pool liefert keine Frage mehr'); break; }
    const ok = i % 4 !== 0;                          // jede vierte Antwort falsch
    recordAnswer(question.id, ok);
    if (ok) clearRetry(round, question.id);
    else queueRetry(round, question.id, SMALL.length);
    seen.push(question.id);
    last = question.id;
  }
  // In jeder Runde muss jede der sechs Fragen einmal gestellt worden sein
  if (round.pass < 2) errors.push('Kleiner Pool: keine zweite Runde erreicht');
  if (new Set(seen).size !== 6) errors.push(`Kleiner Pool: nur ${new Set(seen).size} von 6 Fragen gestellt`);
  if (seen.some((id, i) => i > 0 && id === seen[i - 1])) errors.push('Kleiner Pool: Frage direkt hintereinander');
  console.log(`Kleiner Pool (6 Fragen): ${seen.join(' ')} → Runde ${round.pass}`);
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
