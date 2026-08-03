// Antwort-Oberflächen je Fragetyp.
//
// Jeder Typ liefert ein Objekt mit:
//   render(container)   – Bedienelemente aufbauen
//   hasAnswer()         – ist etwas ausgewählt/eingegeben?
//   evaluate()          – { correct, solution }
//   reveal(correct)     – Lösung farblich anzeigen und sperren

import { el, shuffled, sameSet, fuzzyEqual, parseNumberDE, formatNumberDE } from './util.js';

const LETTERS = 'ABCDEFGH';

export const TYPE_HINTS = {
  single: 'Eine Antwort auswählen.',
  multi: 'Mehrfachauswahl – alle richtigen Antworten antippen.',
  truefalse: 'Ist die Aussage richtig oder falsch?',
  text: 'Antwort eintippen (Tippfehler werden verziehen).',
  number: 'Zahl eingeben.',
  order: 'In der richtigen Reihenfolge antippen.',
  match: 'Jeder Zeile die passende Antwort zuordnen.',
  pyramid: 'Stufen antippen – sie werden von unten nach oben eingesetzt.'
};

export function createAnswerUI(q, opts = {}) {
  const factory = {
    single: singleUI,
    multi: multiUI,
    truefalse: trueFalseUI,
    text: textUI,
    number: numberUI,
    order: orderUI,
    match: matchUI,
    pyramid: pyramidUI
  }[q.type];
  if (!factory) throw new Error(`Unbekannter Fragetyp: ${q.type}`);
  return factory(q, opts);
}

/* ------------------------------------------------- Fußfolge-Diagramm */

// Blick von oben auf das Pferd, Kopf oben.
const HOOF_POS = { VL: [17, 22], VR: [43, 22], HL: [17, 60], HR: [43, 60] };

function hoofDiagram(hooves) {
  const grounded = new Set(hooves || []);
  const feet = Object.entries(HOOF_POS)
    .map(([key, [x, y]]) =>
      `<circle cx="${x}" cy="${y}" r="7.5" class="hoof${grounded.has(key) ? ' on' : ''}"/>`)
    .join('');
  const svg = `<svg viewBox="0 0 60 82" class="hoof-svg" role="img" aria-hidden="true">
      <path d="M30 3 L37 15 L23 15 Z" class="hd-nose"/>
      <rect x="22" y="14" width="16" height="54" rx="8" class="hd-body"/>
      ${feet}
    </svg>`;
  const wrap = el('span', { class: 'hoof-wrap' });
  wrap.innerHTML = svg;
  return wrap;
}

/** Text eines order-Elements (Elemente können Strings oder Objekte sein). */
function itemLabel(item) {
  return typeof item === 'string' ? item : item.label;
}

function hasDiagrams(q) {
  return Array.isArray(q.items) && q.items.some(i => typeof i === 'object' && Array.isArray(i.hooves));
}

/* ---------------------------------------------------------- Auswahl */

function optionButton(label, marker, extraClass, onClick) {
  return el('button', {
    type: 'button',
    class: `opt ${extraClass}`,
    'aria-pressed': 'false',
    onclick: onClick
  }, [
    el('span', { class: 'marker', text: marker }),
    el('span', { class: 'opt-text', text: label })
  ]);
}

function singleUI(q, { shuffle = true, onChange, onSubmit } = {}) {
  let selected = null;
  const order = shuffle ? shuffled(q.options.map((_, i) => i)) : q.options.map((_, i) => i);
  const buttons = [];

  return {
    render(container) {
      order.forEach((orig, pos) => {
        const btn = optionButton(q.options[orig], LETTERS[pos], 'radio', () => {
          selected = orig;
          buttons.forEach(b => {
            const on = b.dataset.orig === String(orig);
            b.classList.toggle('selected', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          onChange?.();
        });
        btn.dataset.orig = String(orig);
        btn.addEventListener('dblclick', () => onSubmit?.());
        buttons.push(btn);
        container.appendChild(btn);
      });
    },
    selectByIndex(pos) {
      buttons[pos]?.click();
    },
    hasAnswer: () => selected !== null,
    evaluate: () => ({ correct: selected === q.a, solution: q.options[q.a] }),
    reveal() {
      buttons.forEach(b => {
        const orig = Number(b.dataset.orig);
        b.disabled = true;
        b.classList.remove('selected');
        if (orig === q.a) b.classList.add('correct');
        else if (orig === selected) b.classList.add('wrong');
      });
    }
  };
}

function multiUI(q, { shuffle = true, onChange } = {}) {
  const selected = new Set();
  const order = shuffle ? shuffled(q.options.map((_, i) => i)) : q.options.map((_, i) => i);
  const buttons = [];

  return {
    render(container) {
      order.forEach(orig => {
        const btn = optionButton(q.options[orig], '✓', 'check', () => {
          if (selected.has(orig)) selected.delete(orig); else selected.add(orig);
          const on = selected.has(orig);
          btn.classList.toggle('selected', on);
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          onChange?.();
        });
        btn.dataset.orig = String(orig);
        buttons.push(btn);
        container.appendChild(btn);
      });
    },
    selectByIndex(pos) {
      buttons[pos]?.click();
    },
    hasAnswer: () => selected.size > 0,
    evaluate: () => ({
      correct: sameSet([...selected], q.a),
      solution: q.a.map(i => q.options[i]).join(' · ')
    }),
    reveal() {
      buttons.forEach(b => {
        const orig = Number(b.dataset.orig);
        b.disabled = true;
        b.classList.remove('selected');
        const isCorrect = q.a.includes(orig);
        const wasPicked = selected.has(orig);
        if (isCorrect && wasPicked) b.classList.add('correct');
        else if (isCorrect) b.classList.add('correct', 'missed');
        else if (wasPicked) b.classList.add('wrong');
      });
    }
  };
}

function trueFalseUI(q, { onChange } = {}) {
  let selected = null;
  const buttons = [];

  return {
    render(container) {
      const row = el('div', { class: 'tf-row' });
      [['Richtig', true], ['Falsch', false]].forEach(([label, value]) => {
        const btn = optionButton(label, value ? '✓' : '✗', 'radio', () => {
          selected = value;
          buttons.forEach(b => {
            const on = b.dataset.value === String(value);
            b.classList.toggle('selected', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          onChange?.();
        });
        btn.dataset.value = String(value);
        buttons.push(btn);
        row.appendChild(btn);
      });
      container.appendChild(row);
    },
    selectByIndex(pos) {
      buttons[pos]?.click();
    },
    hasAnswer: () => selected !== null,
    evaluate: () => ({
      correct: selected === q.a,
      solution: q.a ? 'Die Aussage ist richtig.' : 'Die Aussage ist falsch.'
    }),
    reveal() {
      buttons.forEach(b => {
        const value = b.dataset.value === 'true';
        b.disabled = true;
        b.classList.remove('selected');
        if (value === q.a) b.classList.add('correct');
        else if (value === selected) b.classList.add('wrong');
      });
    }
  };
}

/* ------------------------------------------------------- Eingaben */

function textUI(q, { onChange, onSubmit } = {}) {
  const input = el('input', {
    class: 'text-input',
    type: 'text',
    autocomplete: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'go',
    placeholder: 'Antwort eingeben …',
    'aria-label': 'Antwort'
  });

  return {
    render(container) {
      input.addEventListener('input', () => onChange?.());
      input.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); onSubmit?.(); }
      });
      container.appendChild(input);
    },
    focus: () => input.focus(),
    hasAnswer: () => input.value.trim().length > 0,
    evaluate: () => ({
      correct: q.a.some(target => fuzzyEqual(input.value, target)),
      solution: q.a[0]
    }),
    reveal(correct) {
      input.disabled = true;
      input.classList.add(correct ? 'correct' : 'wrong');
    }
  };
}

function numberUI(q, { onChange, onSubmit } = {}) {
  const input = el('input', {
    class: 'text-input',
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    enterkeyhint: 'go',
    placeholder: 'Zahl eingeben …',
    'aria-label': 'Zahl eingeben'
  });

  return {
    render(container) {
      input.addEventListener('input', () => onChange?.());
      input.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); onSubmit?.(); }
      });
      const row = el('div', { class: 'unit-row' }, [input]);
      if (q.unit) row.appendChild(el('span', { class: 'unit', text: q.unit }));
      container.appendChild(row);
    },
    focus: () => input.focus(),
    hasAnswer: () => parseNumberDE(input.value) !== null,
    evaluate() {
      const value = parseNumberDE(input.value);
      const tol = q.tol ?? 0;
      const correct = value !== null && Math.abs(value - q.a) <= tol + 1e-9;
      let solution = formatNumberDE(q.a) + (q.unit ? ` ${q.unit}` : '');
      if (tol > 0) solution += ` (akzeptiert: ${formatNumberDE(q.a - tol)}–${formatNumberDE(q.a + tol)})`;
      return { correct, solution };
    },
    reveal(correct) {
      input.disabled = true;
      input.classList.add(correct ? 'correct' : 'wrong');
    }
  };
}

/* ---------------------------------------------------- Reihenfolge */

function orderUI(q, { onChange } = {}) {
  // Anzeige immer mischen – sonst wäre die Reihenfolge geschenkt.
  const order = shuffled(q.items.map((_, i) => i));
  const picks = [];           // Original-Indizes in gewählter Reihenfolge
  const buttons = new Map();  // origIndex -> button
  const withDiagrams = hasDiagrams(q);
  let resetBtn = null;

  function repaint() {
    buttons.forEach((btn, orig) => {
      const pos = picks.indexOf(orig);
      btn.classList.toggle('picked', pos >= 0);
      btn.querySelector('.marker').textContent = pos >= 0 ? String(pos + 1) : '';
      btn.setAttribute('aria-pressed', pos >= 0 ? 'true' : 'false');
    });
    if (resetBtn) resetBtn.disabled = picks.length === 0;
    onChange?.();
  }

  function buildButton(orig) {
    const item = q.items[orig];
    const toggle = () => {
      const at = picks.indexOf(orig);
      if (at >= 0) picks.splice(at, 1); else picks.push(orig);
      repaint();
    };

    if (!withDiagrams) return optionButton(itemLabel(item), '', 'order-item', toggle);

    // Bild-Variante: nur das Diagramm, der Text erscheint erst bei der Auflösung.
    const btn = el('button', {
      type: 'button',
      class: 'opt order-item order-card',
      'aria-pressed': 'false',
      'aria-label': `Phase ${orig + 1}`,
      onclick: toggle
    }, [
      el('span', { class: 'marker', text: '' }),
      hoofDiagram(item.hooves),
      el('span', { class: 'order-caption' })
    ]);
    return btn;
  }

  return {
    render(container) {
      if (q.legend) container.appendChild(el('p', { class: 'order-hint', text: q.legend }));
      const grid = withDiagrams ? el('div', { class: 'order-grid' }) : container;
      order.forEach(orig => {
        const btn = buildButton(orig);
        buttons.set(orig, btn);
        grid.appendChild(btn);
      });
      if (withDiagrams) container.appendChild(grid);
      resetBtn = el('button', {
        type: 'button', class: 'chip', text: 'Auswahl zurücksetzen', disabled: true,
        onclick: () => { picks.length = 0; repaint(); }
      });
      container.appendChild(el('div', { class: 'chip-row' }, [resetBtn]));
    },
    hasAnswer: () => picks.length === q.items.length,
    evaluate: () => ({
      correct: picks.every((orig, i) => orig === i) && picks.length === q.items.length,
      solution: q.items.map((t, i) => `${i + 1}. ${itemLabel(t)}`).join('  →  ')
    }),
    reveal() {
      buttons.forEach((btn, orig) => {
        btn.disabled = true;
        btn.classList.remove('picked');
        const chosenPos = picks.indexOf(orig);
        btn.querySelector('.marker').textContent = String(orig + 1);
        const caption = btn.querySelector('.order-caption');
        if (caption) caption.textContent = itemLabel(q.items[orig]);
        if (chosenPos === orig) btn.classList.add('correct');
        else btn.classList.add('wrong');
      });
      if (resetBtn) resetBtn.disabled = true;
    }
  };
}

/* -------------------------------------------------------- Pyramide */

function pyramidUI(q, { onChange } = {}) {
  const n = q.levels.length;
  const given = new Set(q.given || []);
  const slots = new Array(n).fill(null);        // Position (0 = unten) -> Stufen-Index
  given.forEach(i => { slots[i] = i; });

  const openLevels = q.levels.map((_, i) => i).filter(i => !given.has(i));
  const chipOrder = shuffled(openLevels);
  const rows = new Map();   // Position -> Zeilen-Element
  const fixes = new Map();  // Position -> Hinweis auf die richtige Stufe
  const chips = new Map();  // Stufen-Index -> Chip-Element
  let locked = false;

  const freeSlot = () => slots.findIndex((v, i) => v === null && !given.has(i));

  function repaint() {
    rows.forEach((row, pos) => {
      const value = slots[pos];
      const text = row.querySelector('.pyr-text');
      text.textContent = value === null ? '' : q.levels[value];
      row.classList.toggle('filled', value !== null);
      row.classList.toggle('given', given.has(pos));
    });
    chips.forEach((chip, level) => {
      const used = slots.includes(level);
      chip.classList.toggle('used', used);
      chip.disabled = used || locked;
    });
    onChange?.();
  }

  return {
    render(container) {
      const wrap = el('div', { class: 'pyr-wrap' });
      if (q.caption) wrap.appendChild(el('p', { class: 'pyr-caption', text: q.caption }));

      const main = el('div', { class: `pyr-main${q.groups ? ' has-groups' : ''}` });

      // Gruppenklammern links (Angaben von unten gezählt -> Grid-Zeilen von oben)
      for (const g of q.groups || []) {
        const startRow = n - g.to;               // 1-basiert von oben
        const span = g.to - g.from + 1;
        main.appendChild(el('div', {
          class: 'pyr-group',
          style: `grid-row: ${startRow} / span ${span}; grid-column: 1;`,
          text: g.label
        }));
      }

      // Zeilen von oben nach unten; unten am breitesten
      const step = 46 / Math.max(1, n - 1);
      for (let fromTop = 0; fromTop < n; fromTop++) {
        const pos = n - 1 - fromTop;             // Position von unten gezählt
        const width = 100 - pos * step;   // pos 0 = unterste, breiteste Stufe
        const row = el('button', {
          type: 'button',
          class: 'pyr-row',
          style: `width:${width}%`,
          'aria-label': `Stufe ${pos + 1}`,
          onclick: () => {
            if (locked || given.has(pos) || slots[pos] === null) return;
            slots[pos] = null;
            repaint();
          }
        }, [
          el('span', { class: 'pyr-num', text: String(pos + 1) }),
          el('span', { class: 'pyr-text' })
        ]);
        const fix = el('span', { class: 'pyr-fix' });
        rows.set(pos, row);
        fixes.set(pos, fix);
        main.appendChild(el('div', {
          class: 'pyr-cell',
          style: q.groups ? 'grid-column: 2;' : ''
        }, [row, fix]));
      }
      wrap.appendChild(main);

      if (q.side) {
        wrap.classList.add('with-side');
        wrap.appendChild(el('div', { class: 'pyr-side' }, [
          el('span', { class: 'pyr-side-text', text: q.side })
        ]));
      }
      container.appendChild(wrap);

      const chipBox = el('div', { class: 'pyr-chips' });
      chipOrder.forEach(level => {
        const chip = el('button', {
          type: 'button', class: 'pyr-chip', text: q.levels[level],
          onclick: () => {
            if (locked) return;
            const slot = freeSlot();
            if (slot < 0) return;
            slots[slot] = level;
            repaint();
          }
        });
        chips.set(level, chip);
        chipBox.appendChild(chip);
      });
      container.appendChild(chipBox);
      repaint();
    },
    hasAnswer: () => slots.every(v => v !== null),
    evaluate: () => ({
      correct: slots.every((v, i) => v === i),
      solution: q.levels.map((l, i) => `${i + 1}. ${l}`).join('  →  ')
    }),
    reveal() {
      locked = true;
      rows.forEach((row, pos) => {
        row.disabled = true;
        if (given.has(pos)) return;
        const ok = slots[pos] === pos;
        row.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) fixes.get(pos).textContent = `richtig: ${q.levels[pos]}`;
      });
      chips.forEach(chip => { chip.disabled = true; });
    }
  };
}

/* ------------------------------------------------------ Zuordnung */

function matchUI(q, { onChange } = {}) {
  // Mehrfach vorkommende Antworten nur einmal zur Auswahl stellen
  // (dann ist es eine Zuordnung in Gruppen).
  const rights = shuffled([...new Set(q.pairs.map(p => p[1]))]);
  const rows = [];

  return {
    render(container) {
      const grid = el('div', { class: 'match-grid' });
      q.pairs.forEach(([left], i) => {
        const select = el('select', { 'aria-label': `Zuordnung für ${left}` });
        select.appendChild(el('option', { value: '', text: 'bitte wählen …' }));
        rights.forEach(r => select.appendChild(el('option', { value: r, text: r })));
        select.addEventListener('change', () => onChange?.());
        const row = el('div', { class: 'match-pair' }, [
          el('span', { class: 'm-left', text: left }),
          select
        ]);
        rows.push({ row, select, index: i });
        grid.appendChild(row);
      });
      container.appendChild(grid);
    },
    hasAnswer: () => rows.every(r => r.select.value !== ''),
    evaluate: () => ({
      correct: rows.every(r => r.select.value === q.pairs[r.index][1]),
      solution: q.pairs.map(([l, r]) => `${l} → ${r}`).join(' · ')
    }),
    reveal() {
      rows.forEach(r => {
        const expected = q.pairs[r.index][1];
        const ok = r.select.value === expected;
        r.select.disabled = true;
        r.row.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) r.row.appendChild(el('span', { class: 'm-fix', text: `richtig: ${expected}` }));
      });
    }
  };
}
