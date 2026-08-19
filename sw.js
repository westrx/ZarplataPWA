// Версия кеша повышена, т.к. структура файлов изменилась
// (приложение разбито на модули вместо одного index.html).
const CACHE_NAME = 'salary-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/state.js',
  './js/utils.js',
  './js/dropdown.js',
  './js/history-store.js',
  './js/settings-store.js',
  './js/input-panel.js',
  './js/history-actions.js',
  './js/analytics.js',
  './js/calendar.js',
  './js/navigation.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Установка – кешируем файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кешируем файлы');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация – удаляем старые кеши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов – отдаём из кеша, если есть
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        // Если есть в кеше – отдаём, иначе грузим с сервера
        return cached || fetch(event.request);
      })
  );
});
