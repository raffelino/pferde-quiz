// SPDX-License-Identifier: Apache-2.0
// Reitabzeichen Trainer – Hauptsteuerung

import { QUESTIONS } from './data/index.js';
import { CATEGORIES, LEVELS, CAT_BY_ID, LEVEL_BY_ID } from './data/categories.js';
import { $, el, formatTime } from './util.js';
import { loadState, save, saveNow, resetProgress } from './store.js';
import {
  recordAnswer, poolProgress, isHard, isMastered, MAX_BOX, stageStatus,
  pickInRound, queueRetry, clearRetry, roundProgress, newRound, normalizeRound,
  practiceSet
} from './srs.js';
import { STAGES, STAGE_BY_ID, normalizeStage, stageLevels } from './core/stages.js';
import { createAnswerUI, TYPE_HINTS } from './types.js';
import { APP_VERSION } from './version.js';
import * as sync from './sync.js';

let state = loadState();
state.round = normalizeRound(state.round);

/* ------------------------------------------------------------ Sitzung */

/** Auswahl auf dem Startbildschirm: Endlos, Zeitlimit oder feste Fragenzahl. */
const SESSION_MODES = [
  { id: 'endless', label: 'Ohne Limit', hint: 'bis du beendest' },
  { id: 't5',  kind: 'time',  value: 5,  label: '5 Minuten',  hint: 'Speed-Runde' },
  { id: 't10', kind: 'time',  value: 10, label: '10 Minuten', hint: 'kurze Einheit' },
  { id: 't20', kind: 'time',  value: 20, label: '20 Minuten', hint: 'volle Einheit' },
  { id: 'c20', kind: 'count', value: 20, label: '20 Fragen',  hint: 'fester Umfang' }
];
const SESSION_BY_ID = Object.fromEntries(SESSION_MODES.map(m => [m.id, m]));

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
  lastId: null,
  mode: SESSION_MODES[0],
  wrongIds: [],
  learnedIds: []
};

/* --------------------------------------------------------- Bildschirme */

const screens = {
  start: $('#screen-start'),
  quiz: $('#screen-quiz'),
  result: $('#screen-result'),
  stats: $('#screen-stats')
};
let activeScreen = 'start';
let statsCameFrom = 'start';
let updatePending = false;   // neue Programmversion wartet auf einen Neustart

function showScreen(name) {
  if (name === 'start' && updatePending) { window.location.reload(); return; }
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
  paintClock();
  if (session.mode.kind === 'time' && remainingMs() <= 0) endSession('time');
}

/** Verbleibende Zeit in ms (nur bei Zeitlimit sinnvoll). */
function remainingMs() {
  return Math.max(0, session.mode.value * 60000 - session.ms);
}

function paintClock() {
  const limited = session.mode.kind === 'time';
  $('#s-time').textContent = formatTime(limited ? remainingMs() : session.ms);
  $('#s-time-lbl').textContent = limited ? 'übrig' : 'Zeit';
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
  // Ohne eigene Auswahl gibt die Stufe den Umfang vor – sonst wäre "Einsteiger"
  // nur eine Beschriftung und man bekäme trotzdem alle Profi-Fragen.
  return set === null ? stageLevels(currentStage()) : set;
}

function basePool() {
  const cats = new Set(activeCats());
  const levels = new Set(activeLevels());
  return QUESTIONS.filter(q => cats.has(q.cat) && levels.has(q.level));
}

/**
 * Gewünschter Umfang einer Sitzung. Bei Zeit- und Endlos-Modi gibt es keine
 * feste Zahl – dann gilt eine Untergrenze, damit der Übungssatz auch dort
 * nicht auf eine Handvoll Fragen zusammenfällt.
 */
const MIN_UEBUNGSSATZ = 20;

function wunschUmfang() {
  const mode = SESSION_BY_ID[state.settings.session] || SESSION_MODES[0];
  return mode.kind === 'count' ? mode.value : MIN_UEBUNGSSATZ;
}

/** Übungssatz der aktuellen Auswahl – mit „Nur schwierige“ bereits angewandt. */
function uebungssatz() {
  const base = basePool();
  if (!state.settings.hardOnly) return { set: base, hard: base.length, filled: 0 };
  return practiceSet(base, wunschUmfang());
}

function buildPool() {
  const base = basePool();
  if (!state.settings.hardOnly) return base;

  const { set, hard, filled } = practiceSet(base, wunschUmfang());
  if (!hard) toast('Noch keine schwierigen Fragen – es wird mit neuen geübt.');
  else if (filled) toast(`Nur ${hard} schwierige Fragen – mit ${filled} weiteren aufgefüllt.`);
  return set;
}

/* ---------------------------------------------------- Ausbildungsstufe */

function currentStage() {
  return normalizeStage(state.settings.stage);
}

/** Stimmt die Schwierigkeitsauswahl noch mit der Stufe überein? */
function levelsMatchStage(id) {
  const soll = stageLevels(id);
  const ist = activeLevels();
  return soll.length === ist.length && soll.every(l => ist.includes(l));
}

/**
 * Stufe wechseln. Die Stufe bestimmt, welche Schwierigkeiten abgefragt werden –
 * sonst hätte man zwei Regler für dieselbe Sache, die sich widersprechen können.
 */
function setStage(id) {
  const next = normalizeStage(id);
  state.settings.stage = next;
  state.settings.levels = stageLevels(next);
  // Der Wechsel gilt als Kenntnisnahme: Der Aufstiegs-Hinweis der alten Stufe
  // hat seine Arbeit getan.
  state.settings.stageSeen = null;
  save();
  renderStart();
}

/**
 * Aufstieg prüfen. Der Stand kommt immer frisch aus den Karten; gemerkt wird
 * nur, ob der Hinweis schon gezeigt wurde. Fällt eine Stufe wieder unter die
 * Schwelle (etwa nach dem Zurücksetzen), wird auch das wieder freigegeben.
 */
function checkPromotion({ announce = false } = {}) {
  const status = stageStatus(QUESTIONS, currentStage());
  const seen = state.settings.stageSeen;

  if (seen && !status.byId[seen]?.done) {
    state.settings.stageSeen = null;
    save();
  }

  const frisch = status.promote && state.settings.stageSeen !== status.current;
  if (frisch && announce) {
    const naechste = STAGE_BY_ID[status.next];
    toast(`🎉 ${STAGE_BY_ID[status.current].name} sitzt! Weiter mit ${naechste.name}?`);
  }
  return status;
}

function renderStages() {
  const status = checkPromotion();
  const aktuell = status.current;

  const list = $('#stage-list');
  list.textContent = '';
  for (const stage of STAGES) {
    const prog = status.byId[stage.id];
    const aktiv = stage.id === aktuell;

    const btn = el('button', {
      type: 'button',
      class: `stage-item${aktiv ? ' on' : ''}${prog.done ? ' done' : ''}`,
      'aria-pressed': aktiv ? 'true' : 'false',
      onclick: () => setStage(stage.id)
    }, [
      el('span', { class: 'stage-head' }, [
        el('strong', { text: stage.name }),
        el('span', { class: 'stage-hint', text: stage.hint }),
        el('span', {
          class: 'stage-state',
          text: prog.done ? '✓ geschafft' : `${prog.pct} %`
        })
      ]),
      el('small', { class: 'stage-blurb', text: stage.blurb }),
      el('span', { class: 'stage-bar' }, [el('i', { style: `width:${prog.pct}%` })]),
      el('small', {
        class: 'stage-count',
        text: prog.done
          ? `${prog.mastered} von ${prog.total} Fragen sitzen`
          : `${prog.mastered} von ${prog.total} sitzen · noch ${prog.missing} bis zum Aufstieg`
      })
    ]);
    list.appendChild(el('li', {}, [btn]));
  }

  // Höchste geschaffte Stufe als Abzeichen
  const badge = $('#stage-badge');
  badge.hidden = !status.reached;
  if (status.reached) badge.textContent = `🏅 ${STAGE_BY_ID[status.reached].name}`;

  // Ehrlich bleiben, wenn die Schwierigkeitsfilter von der Stufe abweichen
  const note = $('#stage-note');
  const abweichend = !levelsMatchStage(aktuell);
  note.hidden = !abweichend;
  if (abweichend) {
    note.textContent = 'Unter „Schwierigkeit" ist gerade eine eigene Auswahl aktiv – '
      + 'trainiert wird diese, nicht der Umfang der Stufe.';
  }

  renderPromo(status);
}

function renderPromo(status) {
  const card = $('#promo-card');
  card.textContent = '';

  const offen = status.promote && state.settings.stageSeen !== status.current;
  const fertig = status.completed && state.settings.stageSeen !== 'fertig';
  card.hidden = !offen && !fertig;
  if (card.hidden) return;

  if (fertig) {
    card.appendChild(el('h2', { text: '🏆 Alle Stufen geschafft' }));
    card.appendChild(el('p', {
      class: 'muted',
      text: `${status.byId.profi.mastered} von ${status.byId.profi.total} Fragen sitzen. `
        + 'Bleib dran, damit es so bleibt – am besten mit „Nur schwierige Fragen".'
    }));
    card.appendChild(el('div', { class: 'promo-actions' }, [
      el('button', {
        type: 'button', class: 'btn', text: 'Alles klar',
        onclick: () => { state.settings.stageSeen = 'fertig'; save(); renderStart(); }
      })
    ]));
    return;
  }

  const jetzt = STAGE_BY_ID[status.current];
  const naechste = STAGE_BY_ID[status.next];
  const prog = status.byId[status.current];
  const dazu = status.byId[status.next].total - prog.total;

  card.appendChild(el('h2', { text: `🎉 ${jetzt.name} sitzt!` }));
  card.appendChild(el('p', {
    class: 'muted',
    text: `${prog.mastered} von ${prog.total} Fragen liegen im letzten Fach. `
      + `Zeit für ${naechste.name} – das sind ${dazu} neue Fragen: ${naechste.blurb}`
  }));
  card.appendChild(el('div', { class: 'promo-actions' }, [
    el('button', {
      type: 'button', class: 'btn primary', text: `Auf ${naechste.name} wechseln`,
      onclick: () => { setStage(status.next); toast(`Neue Stufe: ${naechste.name}`); }
    }),
    el('button', {
      type: 'button', class: 'btn', text: 'Später',
      onclick: () => {
        state.settings.stageSeen = status.current;
        save();
        renderStart();
      }
    })
  ]));
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

    // Priorität: 1x -> 2x -> 3x -> 1x
    const prio = state.settings.prio?.[cat.id] || 1;
    const prioBtn = el('button', {
      type: 'button',
      class: `prio-btn${prio > 1 ? ' on' : ''}`,
      text: `${prio}×`,
      title: `Gewichtung von ${cat.name}`,
      'aria-label': `Gewichtung von ${cat.name}: ${prio}-fach, zum Ändern antippen`,
      onclick: () => {
        const next = prio >= 3 ? 1 : prio + 1;
        state.settings.prio = { ...(state.settings.prio || {}) };
        if (next === 1) delete state.settings.prio[cat.id];
        else state.settings.prio[cat.id] = next;
        save();
        renderStart();
      }
    });

    list.appendChild(el('li', { class: 'cat-item' }, [row, prioBtn]));
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

  // Sitzungslänge
  const sessionList = $('#session-list');
  sessionList.textContent = '';
  for (const mode of SESSION_MODES) {
    const active = state.settings.session === mode.id;
    const btn = el('button', {
      type: 'button',
      class: `session-pill${active ? ' on' : ''}`,
      'aria-pressed': active ? 'true' : 'false',
      onclick: () => { state.settings.session = mode.id; save(); renderStart(); }
    }, [
      el('strong', { text: mode.label }),
      el('small', { text: mode.hint })
    ]);
    sessionList.appendChild(el('li', {}, [btn]));
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

  $('#app-version').textContent = `Version ${APP_VERSION}`;
  renderStages();
  renderAccount();
  updatePoolInfo();
}

/* ---------------------------------------------------------------- Konto */

function renderAccount() {
  const card = $('#account-card');
  const info = sync.status();

  // Ohne Backend bleibt die App rein lokal – dann keine Karte. Ist der Server
  // dagegen bloß nicht erreichbar, wird das gesagt: Eine stumm verschwundene
  // Anmeldung sieht für den Nutzer aus wie eine App, die gar keine hat.
  const unreachable = info.probeState === 'failed' && !info.loggedIn;
  if (!info.configured
      || (!unreachable && !info.googleClientId && !info.testLogin && !info.loggedIn)) {
    card.hidden = true;
    return;
  }
  card.hidden = false;

  const badge = $('#sync-badge');
  if (unreachable) {
    badge.textContent = 'Server nicht erreichbar';
    badge.className = 'sync-badge bad';
  } else if (!info.loggedIn) {
    badge.textContent = 'nur auf diesem Gerät';
    badge.className = 'sync-badge';
  } else if (info.lastError) {
    badge.textContent = 'Abgleich klemmt';
    badge.className = 'sync-badge bad';
  } else if (info.pending) {
    badge.textContent = `${info.pending} offen`;
    badge.className = 'sync-badge pending';
  } else {
    badge.textContent = 'gesichert';
    badge.className = 'sync-badge ok';
  }

  const body = $('#account-body');
  body.textContent = '';

  if (unreachable) {
    body.appendChild(el('p', {
      class: 'muted small',
      text: 'Der Server antwortet gerade nicht, die Anmeldung ist deshalb nicht '
          + 'verfügbar. Gelernt wird weiter – dein Stand bleibt auf diesem Gerät '
          + 'und wird später abgeglichen.'
    }));
    body.appendChild(el('button', {
      class: 'btn', text: 'Erneut versuchen',
      onclick: async () => { await sync.probeServer(); renderStart(); }
    }));
    return;
  }

  if (!info.loggedIn) {
    body.appendChild(el('p', {
      class: 'muted small',
      text: 'Ohne Anmeldung bleibt dein Lernstand nur auf diesem Gerät. Mit Google-Konto '
          + 'wird er gesichert und du kannst auf mehreren Geräten weiterlernen.'
    }));
    const slot = el('div', { class: 'google-slot', id: 'google-slot' });
    body.appendChild(slot);

    sync.mountGoogleButton(slot, {
      onDone: err => {
        if (err) toast(`Anmeldung fehlgeschlagen: ${err.message}`);
        renderStart();
      }
    }).then(ok => {
      if (!ok && info.testLogin) {
        slot.appendChild(el('button', {
          class: 'btn', text: 'Test-Anmeldung (nur lokal)',
          onclick: async () => {
            try {
              await sync.loginForTest();
              renderStart();
            } catch (err) { toast(err.message); }
          }
        }));
      } else if (!ok && !info.testLogin) {
        slot.appendChild(el('p', { class: 'muted small', text: 'Anmeldung derzeit nicht verfügbar.' }));
      }
    });
    return;
  }

  const user = info.user || {};
  body.appendChild(el('div', { class: 'account-row' }, [
    el('span', { class: 'account-avatar' }, [
      user.picture
        ? el('img', { src: user.picture, alt: '', referrerpolicy: 'no-referrer' })
        : el('span', { text: '🐴' })
    ]),
    el('span', { class: 'account-main' }, [
      el('div', { class: 'account-name', text: user.name || 'Angemeldet' }),
      el('div', { class: 'account-mail', text: user.email || '' })
    ])
  ]));

  const zeit = info.lastSyncAt
    ? new Date(info.lastSyncAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    : null;
  body.appendChild(el('p', {
    class: 'muted small',
    text: info.lastError
      ? `Letzter Abgleich fehlgeschlagen: ${info.lastError}`
      : zeit ? `Zuletzt gesichert um ${zeit} Uhr.` : 'Noch nicht abgeglichen.'
  }));

  body.appendChild(el('div', { class: 'account-actions' }, [
    el('button', {
      class: 'chip', text: 'Jetzt abgleichen',
      onclick: async () => { await sync.syncNow(); renderStart(); toast('Abgleich erledigt.'); }
    }),
    el('button', {
      class: 'chip', text: 'Abmelden',
      onclick: async () => { await sync.logout(); renderStart(); toast('Abgemeldet.'); }
    }),
    el('button', {
      class: 'chip', text: 'Konto löschen',
      onclick: async () => {
        if (!confirm('Konto und alle gespeicherten Daten auf dem Server löschen?')) return;
        try {
          await sync.deleteAccount();
          toast('Konto gelöscht.');
        } catch (err) {
          toast(`Löschen fehlgeschlagen: ${err.message}`);
        }
        renderStart();
      }
    })
  ]));
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

  if (state.settings.hardOnly) {
    // Zeigen, was der Filter wirklich übrig lässt – sonst verspricht die Zeile
    // 73 Fragen und die Sitzung stellt drei.
    const { set, hard, filled } = uebungssatz();
    info.textContent = filled
      ? `${set.length} Fragen im Übungssatz · ${hard} schwierige, ${filled} aufgefüllt`
      : `${set.length} schwierige Fragen · von ${base.length} ausgewählten`;
  } else {
    info.textContent = `${base.length} Fragen ausgewählt · ${prog.mastered} sitzen · ${prog.hard} zu wiederholen`;
  }

  const rp = roundProgress(base, state.round);
  const rest = Math.max(0, rp.total - rp.seen);
  $('#round-info').textContent = rest
    ? `Runde ${rp.pass}: ${rp.seen} von ${rp.total} Fragen gesehen – ${rest} noch offen.`
    : `Runde ${rp.pass} ist komplett – die nächste Runde startet automatisch.`;
}

/* ---------------------------------------------------------------- Quiz */

function startQuiz() {
  session.pool = buildPool();
  if (!session.pool.length) { toast('Keine Fragen im Auswahlbereich.'); return; }
  session.mode = SESSION_BY_ID[state.settings.session] || SESSION_MODES[0];
  session.right = session.wrong = session.total = 0;
  session.ms = 0;
  session.lastId = null;
  session.wrongIds = [];
  session.learnedIds = [];
  updateStatbar();
  showScreen('quiz');
  nextQuestion();
}

/** Sitzung abschließen und Auswertung zeigen. */
function endSession(reason) {
  stopTimer();
  saveNow();
  renderResult(reason);
  showScreen('result');
}

function nextQuestion() {
  // Bei "Nur schwierige" neu hinzugekommene Fragen aufnehmen – aber nur
  // ergänzen, nie ersetzen.
  //
  // Vorher wurde der Pool durch die schwierige Menge ersetzt. Da eine Frage
  // ab der ersten Antwort schwierig ist (Fach 1 oder 2), schrumpfte er nach
  // der ersten Frage auf genau diese eine zusammen und wuchs nie wieder: Wer
  // ohne Vorgeschichte startete, bekam 20-mal dieselbe Frage – direkt nach
  // der Meldung, es würden alle abgefragt.
  if (state.settings.hardOnly) {
    const drin = new Set(session.pool.map(q => q.id));
    const dazu = basePool().filter(q => isHard(q.id) && !drin.has(q.id));
    if (dazu.length) session.pool = session.pool.concat(dazu);
  }

  const pick = pickInRound(session.pool, state.round, {
    useSrs: state.settings.srs,
    lastId: session.lastId,
    prio: state.settings.prio || {}
  });
  const q = pick.question;
  if (!q) { toast('Keine Fragen verfügbar.'); showScreen('start'); return; }
  if (pick.newPass) toast(`Alle Fragen einmal durch – Runde ${state.round.pass} beginnt!`);
  save();

  session.current = q;
  session.answered = false;
  session.isRetry = pick.retry;
  session.questionShownAt = Date.now();

  const cat = CAT_BY_ID[q.cat];
  const lvl = LEVEL_BY_ID[q.level];
  const card = state.cards[q.id];

  $('#q-cat').textContent = `${cat.emoji} ${cat.name}`;
  $('#q-level').textContent = lvl ? lvl.name : '';
  $('#q-box').textContent = card ? `Fach ${card.box}/${MAX_BOX}` : 'neu';
  const rp = roundProgress(session.pool, state.round);
  $('#q-round').textContent = pick.retry
    ? `Nachholrunde ${state.round.pass}`
    : `Runde ${rp.pass} · ${rp.seen}/${rp.total}`;
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
  if (!correct && !session.wrongIds.includes(q.id)) session.wrongIds.push(q.id);
  if (correct) clearRetry(state.round, q.id);
  else queueRetry(state.round, q.id, session.pool.length);
  sync.queueAnswer({
    questionId: q.id,
    correct,
    ms: session.questionShownAt ? Date.now() - session.questionShownAt : null
  });
  if (move.mastered && !session.learnedIds.includes(q.id)) session.learnedIds.push(q.id);
  // Ein Aufstieg kann nur entstehen, wenn gerade eine Frage ins letzte Fach
  // gerutscht ist – sonst muss auch nichts nachgerechnet werden.
  if (move.mastered) checkPromotion({ announce: true });

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
  paintClock();
  $('#s-right').textContent = session.right;
  $('#s-wrong').textContent = session.wrong;
  const counted = session.mode.kind === 'count';
  $('#s-total').textContent = counted ? `${session.total}/${session.mode.value}` : session.total;
  $('#s-total-lbl').textContent = counted ? 'Fragen' : 'gesamt';
}

function updateQuota() {
  const prog = poolProgress(session.pool.length ? session.pool : basePool());
  const pct = prog.total ? (prog.mastered / prog.total) * 100 : 0;
  const bar = $('#quota-fill');
  bar.style.width = `${pct}%`;
  bar.parentElement.title = `${prog.mastered} von ${prog.total} Fragen sitzen`;
}

/* ------------------------------------------------------- Auswertung */

const RESULT_TITLES = {
  time: 'Zeit ist um! ⏱',
  count: 'Runde geschafft! 🏁',
  manual: 'Sitzung beendet'
};

function renderResult(reason) {
  const quote = session.total ? Math.round((session.right / session.total) * 100) : 0;
  $('#res-title').textContent = RESULT_TITLES[reason] || RESULT_TITLES.manual;

  let sub;
  if (!session.total) {
    sub = 'Diesmal war keine Frage dabei – probier es gleich nochmal.';
  } else if (quote >= 90) {
    sub = 'Stark! Das sitzt schon richtig gut.';
  } else if (quote >= 70) {
    sub = 'Guter Lauf – die Wackelkandidaten kommen bald wieder dran.';
  } else if (quote >= 40) {
    sub = 'Solide Grundlage. Wiederholen lohnt sich.';
  } else {
    sub = 'Kein Problem – falsche Fragen kommen jetzt besonders oft.';
  }
  // Tempo nur anzeigen, wenn die Sitzung lang genug für eine sinnvolle Zahl war
  if (session.total && session.ms > 20000) {
    const perMin = session.total / (session.ms / 60000);
    sub += ` (${perMin.toFixed(1).replace('.', ',')} Fragen pro Minute)`;
  }
  $('#res-sub').textContent = sub;

  $('#r-right').textContent = session.right;
  $('#r-wrong').textContent = session.wrong;
  $('#r-total').textContent = session.total;
  $('#r-quote').textContent = session.total ? `${quote}%` : '–';
  $('#r-time').textContent = formatTime(session.ms);
  $('#r-learned').textContent = session.learnedIds.length;

  fillResultList('#res-learned-card', '#res-learned-list', session.learnedIds, '🎉');
  fillResultList('#res-wrong-card', '#res-wrong-list', session.wrongIds, '✗');
  renderStageResult();
}

/** Stand der Stufe in der Auswertung – dort schaut man ohnehin hin. */
function renderStageResult() {
  const status = stageStatus(QUESTIONS, currentStage());
  const prog = status.byId[status.current];
  const card = $('#res-stage-card');
  card.textContent = '';
  card.hidden = false;

  if (status.completed) {
    card.appendChild(el('h2', { text: '🏆 Alle Stufen geschafft' }));
    card.appendChild(el('p', { class: 'muted', text: 'Der komplette Fragenpool sitzt. Respekt.' }));
    return;
  }

  if (status.promote) {
    const naechste = STAGE_BY_ID[status.next];
    card.appendChild(el('h2', { text: `🎉 ${STAGE_BY_ID[status.current].name} geschafft` }));
    card.appendChild(el('p', {
      class: 'muted',
      text: `${prog.mastered} von ${prog.total} Fragen sitzen. Empfohlen: weiter mit ${naechste.name} (${naechste.hint}).`
    }));
    card.appendChild(el('div', { class: 'promo-actions' }, [
      el('button', {
        type: 'button', class: 'btn primary', text: `Auf ${naechste.name} wechseln`,
        onclick: () => { setStage(status.next); showScreen('start'); toast(`Neue Stufe: ${naechste.name}`); }
      })
    ]));
    return;
  }

  card.appendChild(el('h2', { text: `Stufe ${STAGE_BY_ID[status.current].name}` }));
  card.appendChild(el('p', {
    class: 'muted',
    text: `${prog.mastered} von ${prog.total} Fragen sitzen – noch ${prog.missing} bis zum Aufstieg.`
  }));
  card.appendChild(el('span', { class: 'stage-bar' }, [el('i', { style: `width:${prog.pct}%` })]));
}

function fillResultList(cardSel, listSel, ids, mark) {
  const card = $(cardSel);
  const list = $(listSel);
  list.textContent = '';
  card.hidden = ids.length === 0;
  for (const id of ids.slice(0, 12)) {
    const q = QUESTIONS.find(item => item.id === id);
    if (!q) continue;
    list.appendChild(el('li', {}, [
      el('span', { class: 'h-score', text: mark }),
      el('span', { text: q.q })
    ]));
  }
  if (ids.length > 12) {
    list.appendChild(el('li', { class: 'muted small', text: `… und ${ids.length - 12} weitere` }));
  }
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
$('#btn-next').addEventListener('click', () => {
  if (session.mode.kind === 'count' && session.total >= session.mode.value) endSession('count');
  else nextQuestion();
});
$('#btn-skip').addEventListener('click', () => {
  session.lastId = session.current?.id ?? null;
  nextQuestion();
});
$('#btn-home').addEventListener('click', () => {
  if (activeScreen === 'quiz') { endSession('manual'); return; }
  showScreen(activeScreen === 'stats' ? statsCameFrom : 'start');
});
$('#btn-res-home').addEventListener('click', () => showScreen('start'));
$('#btn-round-reset').addEventListener('click', () => {
  state.round = newRound(1);
  save();
  renderStart();
  toast('Runde zurückgesetzt – alle Fragen kommen wieder dran.');
});
$('#btn-res-again').addEventListener('click', startQuiz);
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

// In der Einzeldatei-Version (tools/build-single-file.mjs) gibt es keine sw.js.
const isSingleFile = !!document.querySelector('meta[name="build"][content="single-file"]');

// Konto und Abgleich: Anzeige aktualisieren, sobald sich am Status etwas tut.
sync.onSyncChange(() => {
  if (activeScreen === 'start') renderAccount();
});
sync.startAutoSync();

if ('serviceWorker' in navigator && !isSingleFile) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('../sw.js', import.meta.url))
      .catch(err => console.warn('Service Worker nicht registriert:', err));
  });

  // Übernimmt eine neue Version, wird einmal neu geladen – sonst liefe die
  // App bis zum nächsten Kaltstart mit dem alten Code weiter.
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    if (activeScreen === 'start') {
      window.location.reload();
    } else {
      updatePending = true;
      toast('Neue Version geladen – wird beim nächsten Start aktiv.');
    }
  });
}
