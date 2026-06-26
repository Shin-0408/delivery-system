const CACHE_NAME = "delivery-system-v84-tenko";
const FILES = [
  './',
  './index.html',
  './m001.html',
  './m002.html',
  './m003.html',
  './m004.html',
  './manifest.json',
  './icon.png',
  './icon-192.png',
  './icon-512.png',
  './complete-card.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES).catch(() => {})));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(res => res || caches.match('./index.html'))
    )
  );
});
