const CACHE_NAME = 'delivery-system-v50-20260619-clean';
const CORE_ASSETS = ['./','./index.html','./manifest.json','./icon-v50.svg','./icon.svg','./offline.appcache','./service-worker.js'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS).catch(() => cache.addAll(['./index.html']))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => {
    const net = fetch(event.request).then(res => {
      try { const copy = res.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); } catch(e) {}
      return res;
    }).catch(() => cached || caches.match('./index.html'));
    return cached || net;
  }));
});
