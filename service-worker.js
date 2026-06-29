const CACHE_NAME='dsv208-daily-send-safe';
const ASSETS=['./','index.html','m001.html','m002.html','m003.html','m004.html','complete-card.jpg','icon.png','icon-192.png','icon-512.png','manifest.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.pathname.includes('/daily/')||url.pathname.endsWith('.php')){e.respondWith(fetch(e.request));return;}
  if(e.request.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname==='/'||url.pathname.endsWith('/delivery/')){
    e.respondWith(fetch(e.request).then(r=>{let copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{let copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return res})));
});
