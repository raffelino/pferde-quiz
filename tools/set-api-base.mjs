// SPDX-License-Identifier: Apache-2.0
// Trägt die Adresse des Backends in index.html ein.
//
// Gebraucht wird das, wenn die App auf GitHub Pages liegt, die API aber
// woanders: Pages kann keinen Node-Prozess betreiben, und ohne Adresse würde
// die App dort im reinen Lokalmodus laufen – ohne Anmeldung.
//
//   node tools/set-api-base.mjs https://api.example.com
//   node tools/set-api-base.mjs auto        (gleiche Herkunft wie die Seite)
//
// Aufgerufen wird es im Pages-Workflow, wenn die Repository-Variable
// API_BASE_URL gesetzt ist.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wert = (process.argv[2] || '').trim();

if (!wert) {
  console.error('Aufruf: node tools/set-api-base.mjs <https://api… | auto>');
  process.exit(1);
}
if (wert !== 'auto') {
  let url;
  try {
    url = new URL(wert);
  } catch {
    console.error(`Keine gültige Adresse: ${wert}`);
    process.exit(1);
  }
  if (url.protocol !== 'https:') {
    // Über http würde der Anmeldetoken im Klartext wandern.
    console.error(`Die API-Adresse muss https sein: ${wert}`);
    process.exit(1);
  }
}

const datei = resolve(root, 'index.html');
const html = readFileSync(datei, 'utf8');
const muster = /<meta name="api-base" content="[^"]*">/;

if (!muster.test(html)) {
  console.error('In index.html fehlt das Meta-Feld api-base.');
  process.exit(1);
}

const sauber = wert.replace(/\/$/, '');
writeFileSync(datei, html.replace(muster, `<meta name="api-base" content="${sauber}">`));
console.log(`api-base = ${sauber}`);
