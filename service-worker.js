var CACHE_NAME = 'delivery-system-v142';
var ASSETS = ['./','./index.html?v=140','./m001.html?v=140','./m002.html?v=140','./m003.html?v=140','./m004.html?v=140','./manifest.json?v=140','./icon.png?v=140','./icon-192.png?v=140','./icon-512.png?v=140','./complete-card.jpg?v=140'];
self.addEventListener('install', function(e){ self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(function(c){ return c.addAll(ASSETS); }).catch(function(){})); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){ e.respondWith(fetch(e.request, {cache:'no-store'}).catch(function(){ return caches.match(e.request).then(function(r){ return r || caches.match('./index.html?v=140'); }); })); });
