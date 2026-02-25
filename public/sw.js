const CACHE = 'vt-v3';
const ASSETS = ['/', '/style.css', '/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return; // Don't cache API
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
