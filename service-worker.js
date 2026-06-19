/* 配送・集金管理システム V47 service worker */
var CACHE_NAME = "delivery-system-v47-20260619-2";
var CORE_FILES = ["./", "./index.html", "./manifest.json", "./icon.svg", "./service-worker.js"];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE_FILES.map(function(u){ return new Request(u, {cache:"reload"}); }))
        .catch(function(){
          return Promise.all(CORE_FILES.map(function(u){
            return fetch(u, {cache:"reload"}).then(function(r){ if(r && r.ok){ return cache.put(u, r); } }).catch(function(){});
          }));
        });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(key){ if(key !== CACHE_NAME){ return caches.delete(key); } }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if(req.method !== "GET") return;
  if(req.mode === "navigate"){
    event.respondWith(
      fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put("./index.html", copy.clone());
          cache.put("./", copy.clone()).catch(function(){});
        });
        return res;
      }).catch(function(){
        return caches.match("./index.html").then(function(cached){ return cached || caches.match("./"); });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req).then(function(res){
        if(res && res.ok){
          var copy=res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
    })
  );
});
