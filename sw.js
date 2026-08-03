// Service Worker: App offline verfügbar machen.
// Bei jeder inhaltlichen Änderung CACHE_VERSION erhöhen.

const CACHE_VERSION = 'v7';
const CACHE_NAME = `reitabzeichen-trainer-${CACHE_VERSION}`;

const ASSETS = [
  './',
  'index.html',
  'css/styles.css',
  'manifest.webmanifest',
  'icons/icon.svg',
  'js/app.js',
  'js/version.js',
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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS.map(p => new URL(p, self.registration.scope).toString())))
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

  // Assets: erst Netz, dann Cache. Die App ist klein (rund 200 KB), dafür
  // startet sie nach einem Update garantiert mit dem neuen Code. Ohne Netz
  // kommt weiterhin alles aus dem Cache.
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
