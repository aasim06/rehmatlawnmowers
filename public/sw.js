// Rehmat Lawn Mowers - Offline PWA & Instant Cache Service Worker
const CACHE_NAME = 'rehmat-erp-cache-v2';

// Essential static shell assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/version.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-caching partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Never cache Firebase, Google APIs, Auth, or dynamic Firestore requests
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('gstatic.com') ||
    url.pathname.includes('/api/') ||
    req.method !== 'GET'
  ) {
    return;
  }

  // 2. Always fetch version.json with fresh network (bypass cache) so update check is 100% accurate
  if (url.pathname.endsWith('version.json')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // 3. HTML Navigation requests: Cache-First for instant 0.1s startup!
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        if (cached) {
          // Revalidate in background silently
          fetch(req).then((freshResponse) => {
            if (freshResponse && freshResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', freshResponse));
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(req).then((freshResponse) => {
          if (freshResponse && freshResponse.status === 200) {
            const clone = freshResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          }
          return freshResponse;
        });
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 4. Static Assets (JS, CSS, Images, Fonts): Cache-First with Network Fallback
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      });
    })
  );
});

// Allow client app to trigger instant update on button click
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
