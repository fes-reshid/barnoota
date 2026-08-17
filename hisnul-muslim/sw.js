const CACHE_NAME = "hisnul-muslim-v3";
const AUDIO_CACHE_NAME = "hisnul-audio-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data.js",
  "./audio.js",
  "./audiocache.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-256.png",
  "./icons/icon-512.png"
];

// Hosts the app streams du'a audio from. Requests to these are served from
// the audio cache when present (populated only by an explicit, user-confirmed
// download — see audiocache.js), otherwise passed straight to the network.
const AUDIO_HOSTS = ["archive.org", "everyayah.com"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME && k !== AUDIO_CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);

  if (AUDIO_HOSTS.indexOf(url.hostname.replace(/^www\./, "")) !== -1) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(function (cache) {
        return cache.match(event.request).then(function (cached) {
          return cached || fetch(event.request);
        });
      })
    );
    return;
  }

  // Never intercept other cross-origin requests (prayer-times API, Google Fonts)
  // — let the browser handle those directly.
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
        }
        return response;
      }).catch(function () {
        if (event.request.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
