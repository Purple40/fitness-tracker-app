// Custom Service Worker additions
// next-pwa handles the main service worker generation
// This file adds custom offline handling

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Cache workout data for offline use
const CACHE_NAME = 'fittrack-v1';
const OFFLINE_URLS = [
  '/',
  '/dashboard',
  '/body',
  '/nutrition',
  '/workouts',
  '/progress',
];

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip Supabase API calls (need network)
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Return offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/dashboard');
        }
      });
    })
  );
});
