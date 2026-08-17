// SPDX-License-Identifier: Apache-2.0
// Start des Servers. Konfiguration ausschließlich über Umgebungsvariablen –
// im Repository stehen keine Zugangsdaten.
//
//   PORT                 Standard 8787
//   DB_PATH              Standard ./data/trainer.db
//   GOOGLE_CLIENT_ID     OAuth-Client-ID aus der Google Cloud Console
//   ALLOWED_ORIGINS      Kommaliste, nur nötig wenn das Frontend woanders liegt
//   SERVE_STATIC         0 = keine statischen Dateien ausliefern
//   ALLOW_TEST_LOGIN     1 = Test-Anmeldung erlauben (niemals in Produktion)
//   SESSION_DAYS         Standard 90
//   TRUST_PROXY          1 = X-Forwarded-For auswerten (hinter Reverse Proxy)

import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { openDatabase } from './db.js';
import { createApp } from './app.js';
import { deleteExpiredSessions } from './auth.js';
import { APP_VERSION } from '../js/version.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const env = process.env;
const production = env.NODE_ENV === 'production';
const port = Number(env.PORT || 8787);
const dbPath = env.DB_PATH || resolve(HERE, '../data/trainer.db');
const allowTestLogin = env.ALLOW_TEST_LOGIN === '1' && !production;

if (env.ALLOW_TEST_LOGIN === '1' && production) {
  console.warn('ALLOW_TEST_LOGIN wird in der Produktion ignoriert.');
}
if (!env.GOOGLE_CLIENT_ID) {
  console.warn('GOOGLE_CLIENT_ID fehlt – die Anmeldung per Google ist deaktiviert.');
}

const db = openDatabase(dbPath);
const app = createApp(db, {
  googleClientId: env.GOOGLE_CLIENT_ID || '',
  allowedOrigins: (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  sessionDays: Number(env.SESSION_DAYS || 90),
  allowTestLogin,
  serveStatic: env.SERVE_STATIC !== '0',
  staticRoot: resolve(HERE, '..'),
  trustProxy: env.TRUST_PROXY === '1'
});

const server = createServer(app);
server.listen(port, () => {
  console.log(`Reitabzeichen-Trainer ${APP_VERSION} läuft auf Port ${port}`);
  console.log(`Datenbank: ${dbPath}`);
});

// Abgelaufene Sitzungen stündlich aufräumen.
const cleanup = setInterval(() => {
  try {
    const removed = deleteExpiredSessions(db);
    if (removed) console.log(`${removed} abgelaufene Sitzung(en) entfernt`);
  } catch (err) {
    console.error('Aufräumen fehlgeschlagen:', err.message);
  }
}, 3_600_000);
cleanup.unref();

const shutdown = signal => {
  console.log(`${signal} empfangen – Server wird beendet`);
  server.close(() => {
    try { db.close(); } catch { /* schon zu */ }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
