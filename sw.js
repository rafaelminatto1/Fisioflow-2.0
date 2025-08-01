const CACHE_NAME = 'fisioflow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Adicione aqui os assets principais que você quer cachear
  // '/static/css/main.css',
  // '/static/js/bundle.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
