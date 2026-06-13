const CACHE_NAME = 'neon-run-v4.0';
const urlsToCache = [
  '/',
  '/endless-runner.html',
  '/manifest.json'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache first, fallback to network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
      .catch(() => {
        // Return a custom offline page if needed
        return new Response('Offline - cached version not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Background sync for future use
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(
      // Future: sync scores to server
      Promise.resolve()
    );
  }
});

// Push notifications for future use
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'NEON RUN - New challenge awaits!',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230f0c1a" rx="45"/><circle cx="96" cy="96" r="80" fill="%237c3aed"/><text x="96" y="120" font-size="80" fill="%23fff" text-anchor="middle" font-family="monospace" font-weight="900">∞</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><circle cx="96" cy="96" r="96" fill="%237c3aed"/></svg>',
    tag: 'neon-run-notification',
    requireInteraction: false
  };
  event.waitUntil(
    self.registration.showNotification('NEON RUN', options)
  );
});
