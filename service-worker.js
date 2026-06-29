self.addEventListener('install',e=>e.waitUntil(caches.open('dsv200').then(c=>c.addAll(['./','index.html','m001.html','m002.html','m003.html','m004.html','complete-card.jpg']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
