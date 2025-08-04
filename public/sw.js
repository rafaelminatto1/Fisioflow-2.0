// Service Worker completamente desabilitado
console.log('Service Worker disabled - unregistering...');

// Limpar todos os caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Desregistrar o service worker
      return self.registration.unregister();
    })
  );
});

// Não fazer nada nos fetch events
// (removido para evitar overhead)
