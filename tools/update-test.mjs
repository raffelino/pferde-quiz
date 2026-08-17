// SPDX-License-Identifier: Apache-2.0
// Prüft, ob ein Deploy auf einem Gerät ankommt, auf dem die App schon läuft:
// installieren -> Dateien auf dem "Server" austauschen -> neu laden -> neue Version?
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

// Aufruf: node tools/update-test.mjs <ausgeliefertes-verzeichnis> [url]
// Das Verzeichnis muss eine Kopie der App sein, die der Test verändern darf.
const dir = process.argv[2];
const base = process.argv[3] || 'http://localhost:8091/pferde-quiz/';
const problems = [];

const setVersion = v => {
  writeFileSync(`${dir}/js/version.js`,
    readFileSync(`${dir}/js/version.js`, 'utf8').replace(/APP_VERSION = '[^']+'/, `APP_VERSION = '${v}'`));
  writeFileSync(`${dir}/sw.js`,
    readFileSync(`${dir}/sw.js`, 'utf8').replace(/CACHE_VERSION = '[^']+'/, `CACHE_VERSION = '${v}'`));
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.on('pageerror', e => problems.push('pageerror: ' + e.message));

// 1. Erstinstallation
setVersion('test-alt');
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 10000 })
  .catch(() => problems.push('Service Worker hat die Seite nicht übernommen'));
const first = (await page.locator('#app-version').textContent()).trim();
console.log('Nach Installation:', first);
if (!first.includes('test-alt')) problems.push(`Version nach Installation: "${first}"`);

// 2. Neuer Stand auf dem Server
setVersion('test-neu');

// 3. App wieder öffnen (wie beim erneuten Start vom Homescreen)
await page.goto(base, { waitUntil: 'networkidle' });
for (let i = 0; i < 12; i++) {
  const t = await page.locator('#app-version').textContent().catch(() => '');
  console.log(`  t+${i * 400}ms: "${(t || '').trim()}"`);
  if ((t || '').includes('test-neu')) break;
  await page.waitForTimeout(400);
}
const second = (await page.locator('#app-version').textContent().catch(() => '') || '').trim();
console.log('Nach erneutem Öffnen:', second);
if (!second.includes('test-neu')) {
  problems.push(`Nach dem Update läuft weiterhin "${second}" – das Update kommt nicht an`);
}

// 4. Offline muss weiter funktionieren
await context.setOffline(true);
await page.goto(base, { waitUntil: 'domcontentloaded' }).catch(() => {});
const offlineOk = await page.locator('#btn-start').isVisible().catch(() => false);
console.log('Offline nutzbar:', offlineOk);
if (!offlineOk) problems.push('Offline-Start funktioniert nicht mehr');
await context.setOffline(false);

await browser.close();
setVersion(process.env.APP_VERSION || 'v7');

if (problems.length) {
  console.error(`\n${problems.length} Problem(e):`);
  problems.forEach(p => console.error(' -', p));
  process.exit(1);
}
console.log('\nUpdate erreicht ein installiertes Gerät.');
