const CACHE_NAME = 'kegelclub-master-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/config.js',
  './js/storage.js',
  './js/ui.js',
  './js/games.js',
  './js/main.js'
];

// 1. Installieren: Dateien in den Cache laden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Aktivieren: Alten Cache aufräumen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Abfangen: Wenn offline, lade aus dem Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});