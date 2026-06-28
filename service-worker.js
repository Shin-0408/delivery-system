const CACHE_NAME = 'delivery-system-v126-cache';
const ASSETS = ['./','./index.html?v=125','./m001.html?v=125','./m002.html?v=125','./m003.html?v=125','./m004.html?v=125','./manifest.json?v=125','./icon.png?v=125','./icon-192.png?v=125','./icon-512.png?v=125','./complete-card.jpg?v=125'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(()=>{})); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request, {cache:'no-store'}).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html?v=125')))); });
