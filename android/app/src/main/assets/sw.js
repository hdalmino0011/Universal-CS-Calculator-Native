const CACHE_NAME = 'cs-calc-v9-tracer-sync';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'script.js',
  'codeTracer.js',
  'manifest.json',
  'privacy.html',
  'app-icon.png',
  'icon-192.png',
  'icon-512.png'
];

// Install event - precache all application shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching offline shell assets for native mobile app...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up previous outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache-First with Network fallback and dynamic asset caching (including fonts)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache immediately
          return cachedResponse;
        }

        // Fetch from network if not in cache
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Dynamically cache valid responses (basic, cors, opaque for fonts)
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, responseToCache);
              } catch (e) {
                // Ignore caching errors for unsupported request schemes
              }
            });

            return networkResponse;
          })
          .catch(() => {
            // Offline fallback for HTML navigation
            if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
              return caches.match('index.html');
            }

            return new Response('Offline - Universal CS Calculator is ready offline.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Listen for skipWaiting messages from update prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

