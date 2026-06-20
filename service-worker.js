const CACHE_NAME = 'delivery-system-v64-20260620-01';
const ASSETS = ['./','./index.html?v=63','./index.html','./manifest.json','./icon.png','./icon-192.png','./offline.appcache'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => null))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    event.respondWith(fetch(req, {cache:'no-store'}).then(res => { const copy=res.clone(); caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => { const copy=res.clone(); caches.open(CACHE_NAME).then(cache => cache.put(req, copy)); return res; })));
});
