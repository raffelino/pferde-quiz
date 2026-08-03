// Browser-Smoketest: klickt sich durch viele Fragen und prüft auf JS-Fehler.
// Aufruf:  node tools/smoke-test.mjs [http://localhost:8080]

import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:8080';
const ROUNDS = 70;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const problems = [];
page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
page.on('console', msg => {
  if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
});

await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

await page.click('#btn-start');
await page.waitForSelector('#screen-quiz:not([hidden])');

const typesSeen = new Set();

for (let i = 0; i < ROUNDS; i++) {
  await page.waitForSelector('#answer-area');
  const kind = await page.evaluate(() => {
    const area = document.querySelector('#answer-area');
    if (area.querySelector('.order-item')) return 'order';
    if (area.querySelector('select')) return 'match';
    if (area.querySelector('input.text-input')) return 'input';
    if (area.querySelector('.opt.check')) return 'multi';
    if (area.querySelector('.tf-row')) return 'truefalse';
    if (area.querySelector('.opt.radio')) return 'single';
    return 'unknown';
  });
  typesSeen.add(kind);
  if (kind === 'unknown') problems.push(`Runde ${i}: unbekannte Antwortoberfläche`);

  if (kind === 'order') {
    const n = await page.locator('#answer-area .order-item').count();
    for (let k = 0; k < n; k++) await page.locator('#answer-area .order-item').nth(k).click();
  } else if (kind === 'match') {
    const n = await page.locator('#answer-area select').count();
    for (let k = 0; k < n; k++) {
      await page.locator('#answer-area select').nth(k).selectOption({ index: 1 + (k % n) });
    }
  } else if (kind === 'input') {
    await page.fill('#answer-area input.text-input', '38');
  } else {
    await page.locator('#answer-area .opt').first().click();
  }

  const checkDisabled = await page.locator('#btn-check').isDisabled();
  if (checkDisabled) { problems.push(`Runde ${i} (${kind}): "Antwort prüfen" blieb deaktiviert`); break; }

  await page.click('#btn-check');
  await page.waitForSelector('#feedback:not([hidden])', { timeout: 3000 });

  const total = Number(await page.locator('#s-total').textContent());
  if (total !== i + 1) problems.push(`Runde ${i}: Zähler "gesamt" ist ${total}, erwartet ${i + 1}`);

  await page.click('#btn-next');
  await page.waitForSelector('#feedback', { state: 'hidden', timeout: 3000 });
}

// Statistik öffnen
await page.click('#btn-stats');
await page.waitForSelector('#screen-stats:not([hidden])');
const statTotal = Number(await page.locator('#t-total').textContent());
if (statTotal !== ROUNDS) problems.push(`Statistik: gesamt ${statTotal}, erwartet ${ROUNDS}`);

// Persistenz prüfen
await page.reload({ waitUntil: 'networkidle' });
const persisted = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('reitabzeichen-trainer.v1')).totals.total);
if (persisted !== ROUNDS) problems.push(`Nach Reload gespeichert: ${persisted}, erwartet ${ROUNDS}`);

// Zeitmessung muss laufen
const timeText = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('reitabzeichen-trainer.v1')).totals.timeMs);
if (!(timeText > 0)) problems.push('Lernzeit wurde nicht mitgezählt');

await browser.close();

console.log('Angetroffene Antworttypen:', [...typesSeen].join(', '));
if (problems.length) {
  console.error(`\n${problems.length} Problem(e):`);
  problems.forEach(p => console.error('  -', p));
  process.exit(1);
}
console.log('Smoketest bestanden.');
