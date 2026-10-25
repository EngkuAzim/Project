// ==========================================
// SERVICE WORKER - Kembara Bahasa Sekolah Bestari (PWA)
// Caches core 3D assets, scripts, stylesheets, and CDN libraries for offline / fast school WiFi access.
// ==========================================

const CACHE_NAME = 'kembara-jawi-pwa-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css?v=4.4.2',
  './game.js?v=4.4.2',
  './ui.js',
  './state.js',
  './db.js',
  './rooms/helpers.js',
  './rooms/lobby.js',
  './rooms/room1.js',
  './rooms/room2.js',
  './rooms/room3.js',
  './rooms/room4.js',
  './manifest.json',
  './rumi-jawi.tsv',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg'
];

// 1. Install Event: Pre-cache essential game files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching core game shell');
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some assets could not be pre-cached:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Cache-First strategy with Network fallback and dynamic caching
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Pass through Firebase Firestore / Auth API calls directly (Network-Only)
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebaseapp.com') ||
      url.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  // Handle standard app and CDN asset caching
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately, but fetch and update in background if online
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
        }).catch(() => {
          // Offline, cached version already returned
        });
        return cachedResponse;
      }

      // If not in cache, fetch from network and store in runtime cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Avoid caching non-HTTP schemes
          if (url.startsWith('http')) {
            cache.put(event.request, responseClone);
          }
        });

        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
