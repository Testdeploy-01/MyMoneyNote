const CACHE_NAME = 'money-notes-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/summary.html',
  '/summary-all.html',
  '/styles.css',
  '/js/config.js',
  '/js/utils.js',
  '/js/error-handler.js',
  '/js/offline.js',
  '/js/ui.js',
  '/js/storage.js',
  '/js/supabase.js',
  '/js/ocr.js',
  '/js/charts.js',
  '/js/app.js',
  '/js/summary-page.js',
  '/js/summary-all-page.js',
  '/js/budget.js'
];

// Install - cache assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (e) => {
  // Skip non-GET and external requests
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(e.request);
      })
  );
});
