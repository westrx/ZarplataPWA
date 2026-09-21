// Service Worker: network-first для всего (PWA всегда получает свежий код),
// при офлайне — ответ из кеша. CACHE_NAME менять при каждом релизе.
const CACHE_NAME = 'salary-v4';
const ASSETS = [
  './', 'index.html', 'manifest.json',
  'css/styles.css',
  'js/state.js', 'js/utils.js', 'js/dropdown.js', 'js/confetti.js',
  'js/history-store.js', 'js/settings-store.js', 'js/input-panel.js',
  'js/history-actions.js', 'js/analytics.js', 'js/calendar.js',
  'js/navigation.js', 'js/app.js',
  'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-192.png', 'icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('index.html')))
  );
});
