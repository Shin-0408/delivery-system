/* 配送・集金管理システム V48 service worker */
var CACHE_NAME = "delivery-system-v48-20260619-1";
var CORE_FILES = ["./", "./index.html", "./manifest.json", "./icon.svg", "./service-worker.js", "./offline.appcache"];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(CORE_FILES.map(function(u){
        return fetch(u, {cache:"reload"}).then(function(r){
          if(r && r.ok){ return cache.put(u, r.clone()); }
        }).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(key){
        if(key !== CACHE_NAME){ return caches.delete(key); }
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("message", function(event){
  if(event.data && event.data.type === "SKIP_WAITING"){ self.skipWaiting(); }
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if(req.method !== "GET") return;

  if(req.mode === "navigate"){
    event.respondWith(
      caches.match("./index.html").then(function(cached){
        var net = fetch(req, {cache:"reload"}).then(function(res){
          if(res && res.ok){
            var copy=res.clone();
            caches.open(CACHE_NAME).then(function(cache){
              cache.put("./index.html", copy.clone());
              cache.put("./", copy.clone()).catch(function(){});
            });
          }
          return res;
        }).catch(function(){ return cached || caches.match("./"); });
        return cached || net;
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
