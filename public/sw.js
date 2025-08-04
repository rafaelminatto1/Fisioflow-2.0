// Service Worker temporariamente desabilitado para debugging
console.log('Service Worker loaded but disabled for debugging');

// Limpar cache existente
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Não interceptar requests - deixar passar direto
self.addEventListener('fetch', event => {
  // Não fazer nada - deixar o browser lidar com as requests normalmente
});
