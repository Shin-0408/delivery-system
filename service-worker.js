const CACHE_NAME = 'delivery-system-v59-20260620-reset';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './icon.png', './icon-192.png', './offline.appcache'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS).catch(() => cache.addAll(['./index.html']))));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const req = event.request;
  const isHtml = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHtml) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req))
  );
});
