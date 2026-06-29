const CACHE_NAME = 'delivery-system-v135-cache';
const ASSETS = ['./','./index.html?v=136','./m001.html?v=136','./m002.html?v=136','./m003.html?v=136','./m004.html?v=136','./manifest.json?v=136','./icon.png?v=136','./icon-192.png?v=136','./icon-512.png?v=136','./complete-card.jpg?v=136'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(()=>{})); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request, {cache:'no-store'}).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html?v=136')))); });
