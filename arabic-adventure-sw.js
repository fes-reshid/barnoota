/* Scoped app-shell cache for Arabic Adventure only — does not touch any
   other page on the site. Progress itself lives in localStorage / the
   child's cloud account, not here; this just lets the shell and
   curriculum data load without a network connection. */
const CACHE_NAME = 'arabic-adventure-v3';
const SHELL_FILES = [
  '/arabic-adventure.html',
  '/data/arabic-adventure-world1.js',
  '/data/arabic-adventure-audio-manifest.js',
  '/arabic-adventure-manifest.json',
  '/images/arabic-adventure-icon-192.png',
  '/images/arabic-adventure-icon-512.png'
];
const AUDIO_PREFIX = '/audio/arabic-adventure/';

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

/* Network-first: always try to load the latest shell/data when online,
   so a shipped update shows up on the very next visit instead of
   waiting on a background revalidation. The cache is purely the
   offline fallback, used only once the network fetch actually fails. */
self.addEventListener('fetch', function(event){
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;

  /* Voice clips are named after a hash of their text, so the same
     filename always means the same audio — safe, and worth it, to
     cache-first forever rather than re-fetch every play. */
  if(url.pathname.indexOf(AUDIO_PREFIX) === 0){
    event.respondWith(
      caches.match(event.request).then(function(cached){
        if(cached) return cached;
        return fetch(event.request).then(function(resp){
          if(resp && resp.ok){
            caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, resp.clone()); });
          }
          return resp;
        });
      })
    );
    return;
  }

  if(SHELL_FILES.indexOf(url.pathname) === -1 && event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).then(function(resp){
      if(resp && resp.ok){
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, resp.clone()); });
      }
      return resp;
    }).catch(function(){
      return caches.match(event.request);
    })
  );
});
