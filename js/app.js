// Reitabzeichen Trainer – Hauptsteuerung

import { QUESTIONS } from './data/index.js';
import { CATEGORIES, LEVELS, CAT_BY_ID, LEVEL_BY_ID } from './data/categories.js';
import { $, el, formatTime } from './util.js';
import { loadState, save, saveNow, resetProgress } from './store.js';
import { pickNext, recordAnswer, poolProgress, isHard, isMastered, MAX_BOX } from './srs.js';
import { createAnswerUI, TYPE_HINTS } from './types.js';

let state = loadState();

/* ------------------------------------------------------------ Sitzung */

const session = {
  right: 0,
  wrong: 0,
  total: 0,
  ms: 0,
  running: false,
  startedAt: 0,
  ticker: null,
  pool: [],
  current: null,
  ui: null,
  answered: false,
  lastId: null
};

/* --------------------------------------------------------- Bildschirme */

const screens = {
  start: $('#screen-start'),
  quiz: $('#screen-quiz'),
  stats: $('#screen-stats')
};
let activeScreen = 'start';
let statsCameFrom = 'start';

function showScreen(name) {
  activeScreen = name;
  for (const [key, node] of Object.entries(screens)) node.hidden = key !== name;
  $('#btn-home').hidden = name === 'start';
  $('#btn-stats').hidden = name === 'stats';
  if (name === 'quiz') startTimer(); else stopTimer();
  if (name === 'start') renderStart();
  if (name === 'stats') renderStats();
  window.scrollTo({ top: 0 });
}

/* -------------------------------------------------------------- Timer */

function startTimer() {
  if (session.running) return;
  session.running = true;
  session.startedAt = Date.now();
  session.ticker = setInterval(tickTimer, 1000);
  tickTimer();
}

function stopTimer() {
  if (!session.running) return;
  flushTimer();
  session.running = false;
  clearInterval(session.ticker);
  session.ticker = null;
  save();
}

function flushTimer() {
  if (!session.running) return;
  const now = Date.now();
  const delta = now - session.startedAt;
  session.startedAt = now;
  session.ms += delta;
  state.totals.timeMs += delta;
}

function tickTimer() {
  flushTimer();
  $('#s-time').textContent = formatTime(session.ms);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { stopTimer(); saveNow(); }
  else if (activeScreen === 'quiz') startTimer();
});
window.addEventListener('pagehide', () => { stopTimer(); saveNow(); });

/* -------------------------------------------------- Einstellungen/Pool */

function activeCats() {
  const set = state.settings.cats;
  return set === null ? CATEGORIES.map(c => c.id) : set;
}

function activeLevels() {
  const set = state.settings.levels;
  return set === null ? LEVELS.map(l => l.id) : set;
}

function basePool() {
  const cats = new Set(activeCats());
  const levels = new Set(activeLevels());
  return QUESTIONS.filter(q => cats.has(q.cat) && levels.has(q.level));
}

function buildPool() {
  let pool = basePool();
  if (state.settings.hardOnly) {
    const hard = pool.filter(q => isHard(q.id));
    if (hard.length >= 1) pool = hard;
    else toast('Noch keine schwierigen Fragen – es werden alle abgefragt.');
  }
  return pool;
}

/* ------------------------------------------------------- Startbildschirm */

function renderStart() {
  const cats = new Set(activeCats());
  const levels = new Set(activeLevels());

  // Kategorien
  const list = $('#cat-list');
  list.textContent = '';
  for (const cat of CATEGORIES) {
    const qs = QUESTIONS.filter(q => q.cat === cat.id && levels.has(q.level));
    const prog = poolProgress(qs);
    const pct = qs.length ? Math.round((prog.mastered / qs.length) * 100) : 0;

    const input = el('input', { type: 'checkbox' });
    input.checked = cats.has(cat.id);
    input.addEventListener('change', () => {
      const next = new Set(activeCats());
      if (input.checked) next.add(cat.id); else next.delete(cat.id);
      state.settings.cats = [...next];
      save();
      updatePoolInfo();
    });

    const row = el('label', { class: 'cat-row' }, [
      input,
      el('span', { class: 'tick', text: '✓' }),
      el('span', { class: 'cat-main' }, [
        el('span', { class: 'cat-top' }, [
          el('span', { class: 'cat-emoji', text: cat.emoji, 'aria-hidden': 'true' }),
          el('span', { class: 'cat-name', text: cat.name }),
          el('span', { class: 'cat-count', text: `${prog.mastered}/${qs.length}` })
        ]),
        el('span', { class: 'cat-bar' }, [el('i', { style: `width:${pct}%` })])
      ])
    ]);
    list.appendChild(el('li', {}, [row]));
  }

  // Stufen
  const levelList = $('#level-list');
  levelList.textContent = '';
  for (const lvl of LEVELS) {
    const count = QUESTIONS.filter(q => q.level === lvl.id).length;
    const input = el('input', { type: 'checkbox' });
    input.checked = levels.has(lvl.id);
    const pill = el('label', { class: `level-pill${input.checked ? ' on' : ''}` }, [
      input,
      el('span', {}, [
        el('span', { text: lvl.name }), el('br'),
        el('small', { text: `${lvl.hint} · ${count}` })
      ])
    ]);
    input.addEventListener('change', () => {
      const next = new Set(activeLevels());
      if (input.checked) next.add(lvl.id); else next.delete(lvl.id);
      if (next.size === 0) { input.checked = true; next.add(lvl.id); toast('Mindestens eine Stufe muss aktiv bleiben.'); }
      state.settings.levels = [...next];
      save();
      renderStart();
    });
    levelList.appendChild(el('li', {}, [pill]));
  }

  // Optionen
  $('#opt-srs').checked = state.settings.srs;
  $('#opt-hard').checked = state.settings.hardOnly;
  $('#opt-shuffle').checked = state.settings.shuffle;

  // Gesamtfortschritt
  const all = poolProgress(QUESTIONS);
  const quote = state.totals.total
    ? Math.round((state.totals.right / state.totals.total) * 100) : 0;
  const summary = $('#global-progress');
  summary.textContent = '';
  [
    `✅ ${all.mastered}/${QUESTIONS.length} gelernt`,
    `🎯 ${quote}% Trefferquote`,
    `⏱ ${formatTime(state.totals.timeMs)} geübt`
  ].forEach(t => summary.appendChild(el('span', { class: 'pill', text: t })));

  updatePoolInfo();
}

function updatePoolInfo() {
  const base = basePool();
  const prog = poolProgress(base);
  const info = $('#pool-info');
  if (!base.length) {
    info.textContent = 'Keine Fragen ausgewählt – bitte mindestens eine Kategorie aktivieren.';
    $('#btn-start').disabled = true;
    return;
  }
  $('#btn-start').disabled = false;
  info.textContent = `${base.length} Fragen ausgewählt · ${prog.mastered} sitzen · ${prog.hard} zu wiederholen`;
}

/* ---------------------------------------------------------------- Quiz */

function startQuiz() {
  session.pool = buildPool();
  if (!session.pool.length) { toast('Keine Fragen im Auswahlbereich.'); return; }
  session.right = session.wrong = session.total = 0;
  session.ms = 0;
  session.lastId = null;
  updateStatbar();
  showScreen('quiz');
  nextQuestion();
}

function nextQuestion() {
  // Pool bei aktivem "Nur schwierige"-Modus laufend aktualisieren.
  if (state.settings.hardOnly) {
    const refreshed = basePool().filter(q => isHard(q.id));
    if (refreshed.length) session.pool = refreshed;
  }

  const q = pickNext(session.pool, state.settings.srs, session.lastId);
  if (!q) { toast('Keine Fragen verfügbar.'); showScreen('start'); return; }

  session.current = q;
  session.answered = false;

  const cat = CAT_BY_ID[q.cat];
  const lvl = LEVEL_BY_ID[q.level];
  const card = state.cards[q.id];

  $('#q-cat').textContent = `${cat.emoji} ${cat.name}`;
  $('#q-level').textContent = lvl ? lvl.name : '';
  $('#q-box').textContent = card ? `Fach ${card.box}/${MAX_BOX}` : 'neu';
  $('#quiz-question').textContent = q.q;
  $('#q-hint').textContent = TYPE_HINTS[q.type] || '';

  const area = $('#answer-area');
  area.textContent = '';
  session.ui = createAnswerUI(q, {
    shuffle: state.settings.shuffle,
    onChange: () => { $('#btn-check').disabled = !session.ui.hasAnswer(); },
    onSubmit: () => { if (session.ui.hasAnswer()) checkAnswer(); }
  });
  session.ui.render(area);

  $('#feedback').hidden = true;
  $('#btn-check').hidden = false;
  $('#btn-check').disabled = true;
  $('#btn-next').hidden = true;
  $('#btn-skip').hidden = false;
  updateQuota();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkAnswer() {
  if (session.answered || !session.ui) return;
  const q = session.current;
  const { correct, solution } = session.ui.evaluate();
  session.answered = true;
  session.lastId = q.id;

  const move = recordAnswer(q.id, correct);
  session.total++;
  if (correct) session.right++; else session.wrong++;

  session.ui.reveal(correct);

  const fb = $('#feedback');
  fb.hidden = false;
  fb.classList.toggle('good', correct);
  fb.classList.toggle('bad', !correct);
  $('#fb-title').textContent = correct
    ? (move.mastered ? 'Richtig – die Frage sitzt! 🎉' : 'Richtig!')
    : 'Leider falsch';
  $('#fb-solution').textContent = correct ? '' : `Richtige Antwort: ${solution}`;
  $('#fb-solution').hidden = correct;
  $('#fb-explain').textContent = q.explain
    ? q.explain + `  ·  Karteikasten: Fach ${move.boxBefore} → Fach ${move.boxAfter}`
    : `Karteikasten: Fach ${move.boxBefore} → Fach ${move.boxAfter}`;

  $('#q-box').textContent = `Fach ${move.boxAfter}/${MAX_BOX}`;
  $('#btn-check').hidden = true;
  $('#btn-skip').hidden = true;
  $('#btn-next').hidden = false;
  $('#btn-next').focus({ preventScroll: true });

  updateStatbar();
  updateQuota();
  save();
}

function updateStatbar() {
  flushTimer();
  $('#s-time').textContent = formatTime(session.ms);
  $('#s-right').textContent = session.right;
  $('#s-wrong').textContent = session.wrong;
  $('#s-total').textContent = session.total;
}

function updateQuota() {
  const prog = poolProgress(session.pool.length ? session.pool : basePool());
  const pct = prog.total ? (prog.mastered / prog.total) * 100 : 0;
  const bar = $('#quota-fill');
  bar.style.width = `${pct}%`;
  bar.parentElement.title = `${prog.mastered} von ${prog.total} Fragen sitzen`;
}

/* ----------------------------------------------------------- Statistik */

function renderStats() {
  const t = state.totals;
  $('#t-right').textContent = t.right;
  $('#t-wrong').textContent = t.wrong;
  $('#t-total').textContent = t.total;
  $('#t-quote').textContent = t.total ? `${Math.round((t.right / t.total) * 100)}%` : '–';
  $('#t-time').textContent = formatTime(t.timeMs);

  const all = poolProgress(QUESTIONS);
  $('#t-mastered').textContent = `${all.mastered}/${QUESTIONS.length}`;

  // Kategorien
  const list = $('#statcat-list');
  list.textContent = '';
  for (const cat of CATEGORIES) {
    const qs = QUESTIONS.filter(q => q.cat === cat.id);
    const prog = poolProgress(qs);
    const pct = qs.length ? Math.round((prog.mastered / qs.length) * 100) : 0;
    list.appendChild(el('li', { class: 'statcat-row' }, [
      el('div', { class: 'statcat-top' }, [
        el('b', { text: `${cat.emoji} ${cat.name}` }),
        el('span', { text: `${prog.mastered}/${qs.length} · ${pct}%` })
      ]),
      el('div', { class: 'statcat-bar' }, [el('i', { style: `width:${pct}%` })])
    ]));
  }

  // Karteikasten
  const chart = $('#box-chart');
  chart.textContent = '';
  const maxBoxCount = Math.max(1, ...all.boxes);
  all.boxes.forEach((count, i) => {
    const h = Math.round((count / maxBoxCount) * 90);
    chart.appendChild(el('div', { class: 'box-col' }, [
      el('span', { class: 'b-n', text: String(count) }),
      el('i', { style: `height:${h}px` }),
      el('span', { class: 'b-l', text: `Fach ${i + 1}` })
    ]));
  });

  // Hartnäckige Fragen
  const hardList = $('#hard-list');
  hardList.textContent = '';
  const hard = QUESTIONS
    .map(q => ({ q, card: state.cards[q.id] }))
    .filter(x => x.card && x.card.wrong > 0 && !isMastered(x.q.id))
    .sort((a, b) => (b.card.wrong - b.card.right) - (a.card.wrong - a.card.right) || b.card.wrong - a.card.wrong)
    .slice(0, 8);

  if (!hard.length) {
    hardList.appendChild(el('li', { class: 'muted', text: 'Noch nichts hängen geblieben – weiter so!' }));
  } else {
    for (const { q, card } of hard) {
      hardList.appendChild(el('li', {}, [
        el('span', { class: 'h-score', text: `${card.wrong}×✗` }),
        el('span', { text: q.q })
      ]));
    }
  }
}

/* --------------------------------------------------------------- Toast */

let toastTimer = null;
function toast(msg) {
  const node = $('#toast');
  node.textContent = msg;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, 2600);
}

/* ------------------------------------------------------------- Events */

$('#btn-start').addEventListener('click', startQuiz);
$('#btn-check').addEventListener('click', checkAnswer);
$('#btn-next').addEventListener('click', nextQuestion);
$('#btn-skip').addEventListener('click', () => {
  session.lastId = session.current?.id ?? null;
  nextQuestion();
});
$('#btn-home').addEventListener('click', () => {
  showScreen(activeScreen === 'stats' ? statsCameFrom : 'start');
});
$('#btn-stats').addEventListener('click', () => {
  statsCameFrom = activeScreen;
  showScreen('stats');
});
$('#cat-all').addEventListener('click', () => {
  state.settings.cats = CATEGORIES.map(c => c.id);
  save(); renderStart();
});
$('#cat-none').addEventListener('click', () => {
  state.settings.cats = [];
  save(); renderStart();
});
$('#opt-srs').addEventListener('change', ev => { state.settings.srs = ev.target.checked; save(); });
$('#opt-hard').addEventListener('change', ev => {
  state.settings.hardOnly = ev.target.checked; save(); updatePoolInfo();
});
$('#opt-shuffle').addEventListener('change', ev => { state.settings.shuffle = ev.target.checked; save(); });
$('#btn-reset').addEventListener('click', () => {
  if (!confirm('Wirklich den gesamten Lernfortschritt auf diesem Gerät löschen?')) return;
  state = resetProgress();
  session.right = session.wrong = session.total = 0;
  session.ms = 0;
  toast('Fortschritt gelöscht.');
  renderStats();
});

document.addEventListener('keydown', ev => {
  if (activeScreen !== 'quiz') return;
  const tag = document.activeElement?.tagName;
  const typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

  if (ev.key === 'Enter' && !typing) {
    ev.preventDefault();
    if (session.answered) nextQuestion();
    else if (session.ui?.hasAnswer()) checkAnswer();
    return;
  }
  if (!typing && !session.answered && /^[1-9]$/.test(ev.key) && session.ui?.selectByIndex) {
    session.ui.selectByIndex(Number(ev.key) - 1);
  }
});

/* ------------------------------------------------------- Initialisierung */

showScreen('start');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('../sw.js', import.meta.url))
      .catch(err => console.warn('Service Worker nicht registriert:', err));
  });
}
