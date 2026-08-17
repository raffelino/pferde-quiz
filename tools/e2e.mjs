// SPDX-License-Identifier: Apache-2.0
// Ende-zu-Ende: echter Server, echte Datenbank, echter Browser.
//
// Geprüft wird die Zusage, um die es beim Backend geht:
//   angemeldet lernen -> neu laden -> Fortschritt ist da
//   zweites Gerät     -> derselbe Fortschritt
//   ohne Netz         -> lernen geht weiter, Antworten kommen später an
//
// Aufruf: npm run test:e2e     (benötigt playwright)

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT || 8899);
const BASE = `http://127.0.0.1:${PORT}`;

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('playwright ist nicht installiert – E2E übersprungen (npm i -D playwright).');
  process.exit(0);
}

const dataDir = mkdtempSync(join(tmpdir(), 'trainer-e2e-'));
const problems = [];
const server = spawn(process.execPath, ['--experimental-sqlite', 'server/index.js'], {
  cwd: ROOT,
  env: {
    ...process.env,
    PORT: String(PORT),
    DB_PATH: join(dataDir, 'test.db'),
    ALLOW_TEST_LOGIN: '1',
    NODE_ENV: 'test',
    SERVE_STATIC: '1'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
server.stderr.on('data', d => {
  const text = String(d);
  if (!text.includes('ExperimentalWarning')) process.stderr.write(`[server] ${text}`);
});

async function warteAufServer(versuche = 40) {
  for (let i = 0; i < versuche; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return await res.json();
    } catch { /* noch nicht bereit */ }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('Server ist nicht gestartet');
}

/** Eine Frage beantworten – egal welcher Typ gerade dran ist. */
async function beantworte(page) {
  await page.waitForSelector('#answer-area');
  const art = await page.evaluate(() => {
    const a = document.querySelector('#answer-area');
    if (a.querySelector('.pyr-chip')) return 'pyramide';
    if (a.querySelector('.order-item')) return 'reihenfolge';
    if (a.querySelector('select')) return 'zuordnung';
    const inp = a.querySelector('input.text-input');
    if (inp) return inp.getAttribute('inputmode') === 'decimal' ? 'zahl' : 'text';
    return 'auswahl';
  });

  if (art === 'pyramide') {
    const n = await page.locator('#answer-area .pyr-chip').count();
    for (let k = 0; k < n; k++) await page.locator('#answer-area .pyr-chip:not(.used)').first().click();
  } else if (art === 'reihenfolge') {
    const n = await page.locator('#answer-area .order-item').count();
    for (let k = 0; k < n; k++) await page.locator('#answer-area .order-item').nth(k).click();
  } else if (art === 'zuordnung') {
    const n = await page.locator('#answer-area select').count();
    for (let k = 0; k < n; k++) await page.locator('#answer-area select').nth(k).selectOption({ index: 1 });
  } else if (art === 'zahl' || art === 'text') {
    await page.fill('#answer-area input.text-input', art === 'zahl' ? '8' : 'Takt');
  } else {
    await page.locator('#answer-area .opt').first().click();
  }

  await page.click('#btn-check');
  await page.waitForSelector('#feedback:not([hidden])');
  await page.click('#btn-next');
  await page.waitForTimeout(50);
}

async function meldeAnUndLerne(page, { fragen = 5 } = {}) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('#account-card:not([hidden])', { timeout: 10_000 });
  await page.getByRole('button', { name: /Test-Anmeldung/ }).click();
  await page.waitForSelector('.sync-badge.ok, .sync-badge.pending', { timeout: 10_000 });

  await page.click('#btn-start');
  await page.waitForSelector('#screen-quiz:not([hidden])');
  for (let i = 0; i < fragen; i++) await beantworte(page);
  await page.click('#btn-home');                       // Sitzung beenden
  await page.waitForSelector('#screen-result:not([hidden])');
  await page.click('#btn-res-home');
}

/** Warten, bis nichts mehr in der Outbox liegt. */
async function warteAufAbgleich(page) {
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('reitabzeichen-trainer.v1');
    if (!raw) return false;
    const s = JSON.parse(raw);
    return (s.outbox || []).length === 0 && s.account?.lastSyncAt > 0;
  }, null, { timeout: 15_000 }).catch(() => problems.push('Outbox wurde nicht geleert'));
}

const gelernteKarten = page => page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('reitabzeichen-trainer.v1') || '{}');
  return Object.keys(s.cards || {}).length;
});

let browser;
try {
  const health = await warteAufServer();
  console.log(`Server läuft: Version ${health.version}, ${health.questions} Fragen.`);

  browser = await chromium.launch();

  /* --- Gerät 1: anmelden und lernen ------------------------------------ */
  const gerät1 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const seite1 = await gerät1.newPage();
  const fehler1 = [];
  seite1.on('pageerror', e => fehler1.push(e.message));

  await meldeAnUndLerne(seite1, { fragen: 6 });
  await seite1.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await warteAufAbgleich(seite1);

  const nachLernen = await gelernteKarten(seite1);
  console.log(`Gerät 1: ${nachLernen} Karten gelernt.`);
  if (nachLernen < 5) problems.push(`Gerät 1 hat nur ${nachLernen} Karten`);
  if (fehler1.length) problems.push(`JS-Fehler auf Gerät 1: ${fehler1.join(', ')}`);

  /* --- Neu laden: Fortschritt muss bleiben ----------------------------- */
  await seite1.reload({ waitUntil: 'networkidle' });
  await seite1.waitForSelector('#account-card:not([hidden])');
  const nachReload = await gelernteKarten(seite1);
  if (nachReload < nachLernen) problems.push(`Nach dem Neuladen nur noch ${nachReload} statt ${nachLernen} Karten`);

  /* --- Gerät 2: frischer Browser, gleiches Konto ----------------------- */
  const gerät2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const seite2 = await gerät2.newPage();
  await seite2.goto(BASE, { waitUntil: 'networkidle' });
  await seite2.waitForSelector('#account-card:not([hidden])');
  await seite2.getByRole('button', { name: /Test-Anmeldung/ }).click();
  await seite2.waitForTimeout(1500);

  const aufGerät2 = await gelernteKarten(seite2);
  console.log(`Gerät 2 sieht ${aufGerät2} Karten.`);
  if (aufGerät2 < nachLernen) {
    problems.push(`Gerät 2 sieht nur ${aufGerät2} von ${nachLernen} Karten – Abgleich unvollständig`);
  }

  /* --- Ohne Netz weiterlernen, danach nachreichen ---------------------- */
  // Der Server ist von hier aus weiter erreichbar – nur der Browser kommt
  // nicht mehr durch. So lässt sich prüfen, dass wirklich nichts ankommt.
  const tokenGerät2 = await seite2.evaluate(() =>
    JSON.parse(localStorage.getItem('reitabzeichen-trainer.v1')).account.token);
  const serverAntworten = async () => {
    const res = await fetch(`${BASE}/api/stats`, { headers: { authorization: `Bearer ${tokenGerät2}` } });
    return (await res.json()).totals.total;
  };
  const vorOffline = await serverAntworten();

  await gerät2.setOffline(true);
  await seite2.route('**/api/**', route => route.abort('internetdisconnected'));

  await seite2.click('#btn-start');
  await seite2.waitForSelector('#screen-quiz:not([hidden])');
  for (let i = 0; i < 3; i++) await beantworte(seite2);
  await seite2.waitForTimeout(5000);        // Abgleichversuch läuft ins Leere

  const offen = await seite2.evaluate(() =>
    JSON.parse(localStorage.getItem('reitabzeichen-trainer.v1')).outbox.length);
  const währendOffline = await serverAntworten();
  console.log(`Offline beantwortet: ${offen} warten, Server steht weiter bei ${währendOffline}.`);
  if (offen !== 3) problems.push(`Offline sollten 3 Antworten warten, es sind ${offen}`);
  if (währendOffline !== vorOffline) {
    problems.push(`Server hat trotz Offline etwas angenommen (${vorOffline} -> ${währendOffline})`);
  }

  // Der Service Worker darf API-Antworten niemals zwischenspeichern: Eine
  // zwischengespeicherte Antwort auf /api/me würde ohne Netz als gültiger
  // Serverstand durchgehen – und der gewinnt beim Abgleich gegen den lokalen.
  const zwischengespeicherteApi = await seite2.evaluate(async () => {
    const namen = await caches.keys();
    const treffer = [];
    for (const name of namen) {
      const cache = await caches.open(name);
      for (const req of await cache.keys()) {
        if (new URL(req.url).pathname.includes('/api/')) treffer.push(req.url);
      }
    }
    return treffer;
  });
  if (zwischengespeicherteApi.length) {
    problems.push(`Service Worker hat API-Antworten gecacht: ${zwischengespeicherteApi.join(', ')}`);
  }

  await seite2.unroute('**/api/**');
  await gerät2.setOffline(false);
  await seite2.click('#btn-home');
  await seite2.waitForSelector('#screen-result:not([hidden])');
  await seite2.click('#btn-res-home');
  await warteAufAbgleich(seite2);

  /* --- Gerät 1 holt sich den neuen Stand ------------------------------- */
  await seite1.reload({ waitUntil: 'networkidle' });
  await seite1.waitForTimeout(2000);
  const amEnde = await gelernteKarten(seite1);
  console.log(`Gerät 1 nach dem Abgleich: ${amEnde} Karten.`);
  if (amEnde <= nachLernen) {
    problems.push(`Gerät 1 hat die Antworten von Gerät 2 nicht übernommen (${amEnde} Karten)`);
  }

  /* --- Serverseite gegenprüfen ----------------------------------------- */
  const token = await seite1.evaluate(() =>
    JSON.parse(localStorage.getItem('reitabzeichen-trainer.v1')).account.token);
  const stats = await (await fetch(`${BASE}/api/stats`, {
    headers: { authorization: `Bearer ${token}` }
  })).json();
  console.log(`Server: ${stats.cardCount} Karten, ${stats.totals.total} Antworten.`);
  if (stats.cardCount !== amEnde) {
    problems.push(`Server kennt ${stats.cardCount} Karten, der Browser ${amEnde}`);
  }
} catch (err) {
  problems.push(`Abbruch: ${err.message}`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await new Promise(r => setTimeout(r, 300));
  rmSync(dataDir, { recursive: true, force: true });
}

if (problems.length) {
  console.error(`\n${problems.length} Problem(e):`);
  problems.forEach(p => console.error(' -', p));
  process.exit(1);
}
console.log('\nEnde-zu-Ende: Anmeldung, Abgleich und zweites Gerät funktionieren.');
