/* Scoped app-shell cache for Arabic Adventure only — does not touch any
   other page on the site. Progress itself lives in localStorage / the
   child's cloud account, not here; this just lets the shell and
   curriculum data load without a network connection. */
const CACHE_NAME = 'arabic-adventure-v1';
const SHELL_FILES = [
  '/arabic-adventure.html',
  '/data/arabic-adventure-world1.js',
  '/arabic-adventure-manifest.json',
  '/images/arabic-adventure-icon-192.png',
  '/images/arabic-adventure-icon-512.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(SHELL_FILES); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;
  if(SHELL_FILES.indexOf(url.pathname) === -1 && event.request.mode !== 'navigate') return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      const fetchPromise = fetch(event.request).then(function(resp){
        if(resp && resp.ok){
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, resp.clone()); });
        }
        return resp;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
