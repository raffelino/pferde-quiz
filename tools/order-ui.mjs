// SPDX-License-Identifier: Apache-2.0
// Browser-Test der Auflösung bei Reihenfolge-Fragen.
//
// Geprüft wird die Zusage: Nach einer falschen Antwort muss die eigene
// Reihenfolge weiterhin ablesbar sein. Die selbst vergebene Zahl bleibt stehen
// und wird durchgestrichen, die richtige steht direkt daneben. Sonst sieht die
// Auflösung aus wie die eigene Antwort, und man lernt nichts aus dem Fehler.
//
// Mitgeprüft wird, dass die zusätzliche Zahl das Layout nicht sprengt.
//
// Aufruf: node tools/order-ui.mjs [http://localhost:8080]

import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:8080';
const problems = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
page.on('console', m => {
  if (m.type() === 'error' && !/\/api\//.test(m.location()?.url || '')) {
    problems.push(`console: ${m.text()}`);
  }
});

/** Eine Frage einzeln rendern – ohne sich durch eine ganze Runde zu klicken. */
async function rendere(id) {
  return page.evaluate(async (id) => {
    const { QUESTIONS } = await import('/js/data/index.js');
    const { createAnswerUI } = await import('/js/types.js');
    const q = QUESTIONS.find(x => x.id === id);
    const host = document.querySelector('#answer-area');
    document.querySelector('#screen-start').hidden = true;
    document.querySelector('#screen-quiz').hidden = false;
    document.querySelector('#quiz-question').textContent = q.q;
    host.textContent = '';
    const ui = createAnswerUI(q, {});
    ui.render(host);
    window.__ui = ui;
    // Die richtige Reihenfolge als Beschriftungen – daran wird gemessen.
    return {
      labels: q.items.map(it => (typeof it === 'string' ? it : it.label)),
      bilder: !!q.items[0]?.hooves
    };
  }, id);
}

/** Die Geometrie aller Elemente einsammeln. */
const geometrie = () => page.evaluate(() =>
  [...document.querySelectorAll('#answer-area .order-item')].map(btn => {
    const r = btn.getBoundingClientRect();
    return { x: Math.round(r.x), width: Math.round(r.width) };
  }));

/** Was die Auflösung anzeigt, pro Schaltfläche. */
const auflösung = () => page.evaluate(() =>
  [...document.querySelectorAll('#answer-area .order-item')].map(btn => {
    const marker = btn.querySelector('.marker');
    const fix = btn.querySelector('.order-fix');
    const text = btn.querySelector('.opt-text') || btn.querySelector('.order-caption');
    const btnRect = btn.getBoundingClientRect();
    const markRect = marker.getBoundingClientRect();
    const fixRect = fix ? fix.getBoundingClientRect() : null;
    return {
      eigene: marker.textContent.trim(),
      durchgestrichen: getComputedStyle(marker).textDecorationLine.includes('line-through'),
      korrektur: fix ? fix.textContent.trim() : null,
      beschriftung: (text?.textContent || '').trim(),
      istRichtig: btn.classList.contains('correct'),
      istFalsch: btn.classList.contains('wrong'),
      ariaLabel: btn.getAttribute('aria-label') || '',
      // Für die Layoutprüfung
      rahmen: { l: btnRect.left, r: btnRect.right, o: btnRect.top, u: btnRect.bottom },
      marke: { l: markRect.left, r: markRect.right, o: markRect.top, u: markRect.bottom },
      korrekturRahmen: fixRect ? { l: fixRect.left, r: fixRect.right, o: fixRect.top, u: fixRect.bottom } : null
    };
  }));

const überlappen = (a, b) => a.l < b.r && b.l < a.r && a.o < b.u && b.o < a.u;

async function prüfeFrage(id) {
  const { labels, bilder } = await rendere(id);
  const n = labels.length;
  const art = `${id} (${bilder ? 'Bilder' : 'Text'}, ${n} Elemente)`;

  const tippe = async folge => {
    for (const k of folge) await page.locator('#answer-area .order-item').nth(k).click();
  };

  // Absichtlich falsch antworten. Die Anzeige ist gemischt, deshalb erst in
  // Anzeigereihenfolge tippen und nur tauschen, falls das zufällig stimmte.
  const reihe = [...Array(n).keys()];
  await tippe(reihe);
  if (await page.evaluate(() => window.__ui.evaluate().correct)) {
    await page.getByRole('button', { name: 'Auswahl zurücksetzen' }).click();
    const getauscht = [...reihe];
    [getauscht[0], getauscht[1]] = [getauscht[1], getauscht[0]];
    await tippe(getauscht);
  }
  if (await page.evaluate(() => window.__ui.evaluate().correct)) {
    problems.push(`${art}: Antwort blieb richtig – der Test prüft nichts`);
    return;
  }

  const eigeneVorher = await page.evaluate(() =>
    [...document.querySelectorAll('#answer-area .order-item .marker')].map(m => m.textContent.trim()));
  const geoVorher = await geometrie();

  await page.evaluate(() => window.__ui.reveal(false));
  await page.waitForTimeout(80);

  const zeilen = await auflösung();
  const geoNachher = await geometrie();

  let falsche = 0;
  zeilen.forEach((z, i) => {
    // 1. Die eigene Zahl steht noch da – unverändert.
    if (z.eigene !== eigeneVorher[i]) {
      problems.push(`${art}, Element ${i}: eigene Zahl war "${eigeneVorher[i]}", nach der Auflösung "${z.eigene}"`);
    }

    const richtigePosition = labels.indexOf(z.beschriftung) + 1;
    if (richtigePosition === 0) {
      problems.push(`${art}, Element ${i}: Beschriftung "${z.beschriftung}" gehört zu keinem Element`);
      return;
    }

    if (String(richtigePosition) === z.eigene) {
      // 2. Richtig einsortiert: keine Korrektur, nichts durchgestrichen.
      if (z.korrektur) problems.push(`${art}, Element ${i}: richtig, zeigt aber die Korrektur "${z.korrektur}"`);
      if (z.durchgestrichen) problems.push(`${art}, Element ${i}: richtig, aber durchgestrichen`);
      if (!z.istRichtig) problems.push(`${art}, Element ${i}: richtig, aber nicht als richtig markiert`);
      return;
    }

    // 3. Falsch einsortiert: durchgestrichen und die richtige Zahl daneben.
    falsche++;
    if (!z.durchgestrichen) {
      problems.push(`${art}, Element ${i}: eigene Zahl ${z.eigene} ist nicht durchgestrichen`);
    }
    if (z.korrektur !== `→ ${richtigePosition}`) {
      problems.push(`${art}, Element ${i}: Korrektur ist "${z.korrektur}", erwartet "→ ${richtigePosition}"`);
    }
    if (!z.istFalsch) problems.push(`${art}, Element ${i}: falsch, aber nicht als falsch markiert`);
    // 4. Auch ohne Farbe und Durchstreichung verständlich (Screenreader).
    if (!/von dir auf Position/.test(z.ariaLabel) || !/richtig ist Position/.test(z.ariaLabel)) {
      problems.push(`${art}, Element ${i}: aria-label nennt nicht beide Positionen ("${z.ariaLabel}")`);
    }

    // 5. Layout: Die Korrektur gehört in die Schaltfläche und darf die
    //    eigene Zahl nicht überdecken.
    const k = z.korrekturRahmen;
    if (k) {
      if (k.l < z.rahmen.l - 0.5 || k.r > z.rahmen.r + 0.5) {
        problems.push(`${art}, Element ${i}: Korrektur ragt seitlich aus der Schaltfläche`);
      }
      if (k.o < z.rahmen.o - 0.5 || k.u > z.rahmen.u + 0.5) {
        problems.push(`${art}, Element ${i}: Korrektur ragt oben/unten aus der Schaltfläche`);
      }
      if (überlappen(k, z.marke)) {
        problems.push(`${art}, Element ${i}: Korrektur überdeckt die eigene Zahl`);
      }
    }
  });

  if (falsche === 0) problems.push(`${art}: kein einziges Element war falsch einsortiert`);

  // 6. Layout insgesamt: Die Spalten dürfen sich durch die Auflösung nicht
  //    verschieben, und die Seite darf nicht seitlich scrollen.
  geoNachher.forEach((g, i) => {
    if (Math.abs(g.width - geoVorher[i].width) > 1) {
      problems.push(`${art}, Element ${i}: Breite springt von ${geoVorher[i].width} auf ${g.width}`);
    }
    if (Math.abs(g.x - geoVorher[i].x) > 1) {
      problems.push(`${art}, Element ${i}: Position springt von x=${geoVorher[i].x} auf ${g.x}`);
    }
  });

  const überbreite = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (überbreite > 1) problems.push(`${art}: Seite scrollt seitlich (${überbreite}px zu breit)`);

  console.log(`${art}: ${falsche} von ${n} falsch einsortiert, Auflösung lesbar.`);
}

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  const ids = await page.evaluate(async () => {
    const { QUESTIONS } = await import('/js/data/index.js');
    return QUESTIONS.filter(q => q.type === 'order').map(q => q.id);
  });
  if (ids.length < 5) problems.push(`Nur ${ids.length} Reihenfolge-Fragen gefunden`);

  for (const id of ids) await prüfeFrage(id);

  // Zusätzlich in schmal und breit, damit die Zahl auch dort passt.
  for (const breite of [320, 768]) {
    await page.setViewportSize({ width: breite, height: 800 });
    await prüfeFrage(ids[0]);
    await prüfeFrage(ids.find(id => id !== ids[0]));
  }
} catch (err) {
  problems.push(`Abbruch: ${err.message}`);
} finally {
  await browser.close();
}

if (problems.length) {
  console.error(`\n${problems.length} Problem(e):`);
  problems.forEach(p => console.error(' -', p));
  process.exit(1);
}
console.log('\nReihenfolge-Auflösung: eigene Wahl bleibt sichtbar, Layout hält.');
