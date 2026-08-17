// SPDX-License-Identifier: Apache-2.0
// Browser-Test des Stufensystems.
//
// Geprüft wird die Zusage, um die es geht:
//   Stufe wählen  -> nur deren Fragen werden trainiert
//   Stufe sitzt   -> Aufstieg wird gemeldet und die nächste empfohlen
//   Wechsel       -> die neue Stufe ist eingestellt und der Hinweis verschwindet
//
// Aufruf: node tools/stage-ui.mjs [http://localhost:8080]

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

const KEY = 'reitabzeichen-trainer.v1';

/**
 * Karteikasten setzen – wir wollen die Stufenlogik prüfen, nicht 300 Klicks.
 *
 * Wichtig: nicht einfach in den localStorage schreiben und neu laden. Die App
 * sichert beim Verlassen der Seite ihren eigenen Stand ("pagehide") und würde
 * die untergeschobenen Karten damit sofort wieder überschreiben. Deshalb läuft
 * das Einspielen als Init-Skript, also erst im frisch geladenen Dokument.
 */
const karten = {};
async function lerneStufe(level, anteil) {
  const ids = await page.evaluate(async ({ level, anteil }) => {
    const { QUESTIONS } = await import('/js/data/index.js');
    const pool = QUESTIONS.filter(q => q.level === level);
    return pool.slice(0, Math.ceil(pool.length * anteil)).map(q => q.id);
  }, { level, anteil });

  ids.forEach((id, i) => { karten[id] = { box: 5, right: 4, wrong: 0, streak: 4, seenAt: i }; });
  await setzeKarten(karten);
}

async function setzeKarten(cards) {
  // Zuletzt registriertes Init-Skript läuft zuletzt und gewinnt damit.
  await page.addInitScript(({ key, cards }) => {
    const state = JSON.parse(localStorage.getItem(key) || '{}');
    state.cards = cards;
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: KEY, cards });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#stage-list .stage-item');
}

const stufenStand = () => page.evaluate(() =>
  [...document.querySelectorAll('#stage-list .stage-item')].map(b => ({
    name: b.querySelector('strong').textContent,
    aktiv: b.classList.contains('on'),
    geschafft: b.classList.contains('done'),
    stand: b.querySelector('.stage-state').textContent,
    zeile: b.querySelector('.stage-count').textContent
  })));

const gespeicherteStufe = () => page.evaluate(k =>
  JSON.parse(localStorage.getItem(k)).settings.stage, KEY);

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  /* --- Ausgangslage ---------------------------------------------------- */
  await page.waitForSelector('#stage-list .stage-item');
  let stufen = await stufenStand();
  if (stufen.length !== 3) problems.push(`Es sollten 3 Stufen sein, sind ${stufen.length}`);
  if (!stufen[0].aktiv) problems.push('Am Anfang muss Einsteiger aktiv sein');
  if (stufen.some(s => s.geschafft)) problems.push('Ohne Fortschritt darf nichts geschafft sein');
  if (!(await page.locator('#promo-card').isHidden())) problems.push('Ohne Aufstieg darf kein Hinweis stehen');
  console.log('Start:', stufen.map(s => `${s.name} ${s.stand}`).join(' · '));

  /* --- Stufe bestimmt den Trainingsumfang ------------------------------ */
  const infoEinsteiger = await page.locator('#pool-info').textContent();
  await page.locator('#stage-list .stage-item').nth(2).click();       // Profi
  await page.waitForTimeout(120);
  const infoProfi = await page.locator('#pool-info').textContent();
  const zahl = t => Number((t.match(/\d+/) || [0])[0]);
  if (!(zahl(infoProfi) > zahl(infoEinsteiger))) {
    problems.push(`Profi muss mehr Fragen umfassen (${infoEinsteiger} -> ${infoProfi})`);
  }
  if (await gespeicherteStufe() !== 'profi') problems.push('Die Stufe wurde nicht gespeichert');

  await page.locator('#stage-list .stage-item').nth(0).click();       // zurück zu Einsteiger
  await page.waitForTimeout(120);
  console.log(`Umfang: Einsteiger ${zahl(infoEinsteiger)} Fragen, Profi ${zahl(infoProfi)} Fragen.`);

  /* --- Fast geschafft: noch kein Aufstieg ------------------------------ */
  await lerneStufe('basis', 0.7);
  stufen = await stufenStand();
  if (stufen[0].geschafft) problems.push('70 % dürfen noch nicht zum Aufstieg reichen');
  if (!(await page.locator('#promo-card').isHidden())) {
    problems.push('Bei 70 % darf noch kein Aufstiegs-Hinweis stehen');
  }
  console.log('Bei 70 %:', stufen[0].zeile);

  /* --- Schwelle überschritten: Aufstieg -------------------------------- */
  await lerneStufe('basis', 1);
  stufen = await stufenStand();
  if (!stufen[0].geschafft) problems.push('Mit allen Basis-Fragen muss Einsteiger geschafft sein');

  const promo = page.locator('#promo-card');
  if (await promo.isHidden()) problems.push('Nach dem Aufstieg fehlt der Hinweis');
  const promoText = await promo.textContent();
  if (!/Fortgeschritten/.test(promoText)) {
    problems.push(`Der Hinweis empfiehlt nicht die nächste Stufe: ${promoText}`);
  }
  const badge = await page.locator('#stage-badge').textContent();
  if (!/Einsteiger/.test(badge)) problems.push(`Abzeichen zeigt "${badge}"`);
  console.log('Aufstieg:', promoText.replace(/\s+/g, ' ').slice(0, 120));

  /* --- Wechsel übernehmen ---------------------------------------------- */
  await page.getByRole('button', { name: /Auf Fortgeschritten wechseln/ }).click();
  await page.waitForTimeout(200);
  if (await gespeicherteStufe() !== 'fortgeschritten') {
    problems.push('Der Wechsel hat die Stufe nicht umgestellt');
  }
  stufen = await stufenStand();
  if (!stufen[1].aktiv) problems.push('Nach dem Wechsel muss Fortgeschritten aktiv sein');
  if (!(await promo.isHidden())) problems.push('Nach dem Wechsel muss der Hinweis verschwinden');

  const levelHaken = await page.evaluate(() =>
    [...document.querySelectorAll('#level-list input')].map(i => i.checked));
  if (!(levelHaken[0] && levelHaken[1] && !levelHaken[2])) {
    problems.push(`Die Stufe hat die Schwierigkeiten nicht gesetzt: ${JSON.stringify(levelHaken)}`);
  }
  console.log('Nach dem Wechsel:', stufen.map(s => `${s.name} ${s.stand}`).join(' · '));

  /* --- "Später" schweigt, bis sich etwas ändert ------------------------ */
  await lerneStufe('aufbau', 1);
  if (await promo.isHidden()) problems.push('Fortgeschritten geschafft, aber kein Hinweis');
  await page.getByRole('button', { name: /^Später$/ }).click();
  await page.waitForTimeout(200);
  if (!(await promo.isHidden())) problems.push('"Später" muss den Hinweis wegnehmen');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#stage-list .stage-item');
  if (!(await promo.isHidden())) problems.push('Nach "Später" darf der Hinweis nicht wiederkommen');

  /* --- Zurücksetzen gibt den Hinweis wieder frei ------------------------ */
  await setzeKarten({});
  stufen = await stufenStand();
  if (stufen.some(s => s.geschafft)) problems.push('Ohne Karten darf nichts mehr geschafft sein');
  const stufeNachReset = await gespeicherteStufe();
  if (stufeNachReset !== 'fortgeschritten') {
    problems.push(`Die gewählte Stufe soll bleiben, ist aber "${stufeNachReset}"`);
  }

  /* --- Alte Stände: der Umfang darf sich nicht heimlich ändern ---------- */
  // Vor dem Stufensystem hiess "levels: null" schlicht "alle Fragen". Wer so
  // einen Stand hat, muss nach dem Update weiter alle bekommen.
  for (const [levels, erwarteteStufe, erwarteteAnzahl] of [
    [null, 'profi', 249],
    [['basis'], 'einsteiger', 73],
    [['aufbau'], 'fortgeschritten', null]
  ]) {
    const alt = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await alt.addInitScript(({ key, levels }) => {
      // Ein Stand, wie ihn die Vorgängerversion hinterlassen hat: mit
      // Schwierigkeitsauswahl, aber ohne jede Kenntnis von Stufen.
      localStorage.setItem(key, JSON.stringify({
        version: 1,
        settings: { cats: null, levels, srs: true, hardOnly: false, shuffle: true, session: 'endless', prio: {} },
        cards: {}, round: { pass: 1, asked: [], retry: [], counts: {}, recent: [] },
        totals: { right: 0, wrong: 0, total: 0, timeMs: 0 }, seq: 0
      }));
    }, { key: KEY, levels });

    const altSeite = await alt.newPage();
    await altSeite.goto(base, { waitUntil: 'networkidle' });
    await altSeite.waitForSelector('#stage-list .stage-item');

    const stufe = await altSeite.evaluate(k => JSON.parse(localStorage.getItem(k)).settings.stage, KEY);
    const info = await altSeite.locator('#pool-info').textContent();
    const anzahl = Number((info.match(/\d+/) || [0])[0]);
    const beschriftung = levels === null ? 'alle' : levels.join('+');

    if (stufe !== erwarteteStufe) {
      problems.push(`Alter Stand (${beschriftung}) wurde zu Stufe "${stufe}", erwartet "${erwarteteStufe}"`);
    }
    if (erwarteteAnzahl !== null && anzahl !== erwarteteAnzahl) {
      problems.push(`Alter Stand (${beschriftung}) trainiert ${anzahl} Fragen, erwartet ${erwarteteAnzahl}`);
    }
    console.log(`Alter Stand (${beschriftung}) → Stufe ${stufe}, ${anzahl} Fragen.`);
    await alt.close();
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
console.log('\nStufensystem: Auswahl, Aufstieg und Empfehlung funktionieren.');
