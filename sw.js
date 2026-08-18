// SPDX-License-Identifier: Apache-2.0
// Service Worker: App offline verfügbar machen.
// Bei jeder inhaltlichen Änderung CACHE_VERSION erhöhen.

const CACHE_VERSION = 'v18';
const CACHE_NAME = `reitabzeichen-trainer-${CACHE_VERSION}`;

const ASSETS = [
  './',
  'index.html',
  'datenschutz.html',
  'impressum.html',
  'css/styles.css',
  'manifest.webmanifest',
  'icons/icon.svg',
  'js/app.js',
  'js/version.js',
  'js/api.js',
  'js/sync.js',
  'js/core/srs-core.js',
  'js/core/stages.js',
  'js/util.js',
  'js/store.js',
  'js/srs.js',
  'js/types.js',
  'js/data/index.js',
  'js/data/categories.js',
  'js/data/q-pferdekunde.js',
  'js/data/q-gesundheit.js',
  'js/data/q-reiten.js',
  'js/data/q-praxis.js',
  'js/data/q-hilfen.js',
  'js/data/q-gangarten.js',
  'js/data/q-ausbildung.js'
];

// Beim Vorrätiglegen am Browser-Cache vorbei ("reload").
//
// Ohne das holt cache.addAll() die Dateien aus dem HTTP-Cache – und der ist
// nach server/static.js fünf Minuten gültig. Direkt nach einer Auslieferung
// legte der neue Service Worker deshalb die *alten* Dateien unter seinem
// neuen Cache-Namen ab und blieb dauerhaft darauf sitzen. Nachgemessen:
// Cache "…-v17" enthielt v16, während das Netz v17 lieferte.
const frisch = url => new Request(url, { cache: 'reload' });

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(
        ASSETS.map(p => frisch(new URL(p, self.registration.scope).toString()))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // API-Aufrufe gehören nie in den Cache: Eine zwischengespeicherte Antwort auf
  // /api/me würde ohne Netz als gültiger Serverstand gelten – und der gewinnt
  // beim Abgleich gegen den lokalen. Lieber ein ehrlicher Netzfehler, dann
  // bleibt der lokale Stand stehen und die Outbox reicht später nach.
  if (new URL(req.url).pathname.includes('/api/')) return;

  // Navigationen: erst Netz (frische Version), sonst Cache.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match(new URL('index.html', self.registration.scope).toString())))
    );
    return;
  }

  // Assets: erst der eigene Cache, dann Netz.
  //
  // Vorher stand hier "erst Netz" mit der Begründung, so starte die App nach
  // einem Update garantiert mit neuem Code. Das galt aber nicht: `fetch` geht
  // durch den HTTP-Cache, und der liefert nach server/static.js fünf Minuten
  // lang die alte Datei – die dann auch noch im neuen Cache landete.
  //
  // Jetzt gilt: Der Cache trägt die Version im Namen und wird beim Installieren
  // am HTTP-Cache vorbei gefüllt. Was drinsteht, gehört also zwingend zu dieser
  // Fassung. Neue Versionen kommen über den Service-Worker-Ablauf herein
  // (sw.js selbst wird mit no-cache ausgeliefert), nicht über einzelne Dateien.
  // Deshalb muss bei jeder inhaltlichen Änderung CACHE_VERSION hoch – siehe oben.
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
