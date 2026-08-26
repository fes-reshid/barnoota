const CACHE_NAME = "hisnul-muslim-v12";
const AUDIO_CACHE_NAME = "hisnul-audio-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data.js",
  "./audio.js",
  "./audiocache.js",
  "./prayertimes.js",
  "./reminders.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-256.png",
  "./icons/icon-512.png"
];

// External hosts the app streams du'a audio from — archive.org/everyayah.com,
// the fallback for the handful of tracks not included in the local audio/
// folder (see audio.js; most tracks are same-origin now and don't need any
// of this, same-origin requests are handled by the generic branch below).
// Requests to any of these are served from the audio cache when present;
// otherwise played straight from the network and, in the background, saved
// to the audio cache so the same track plays offline next time — no
// separate "download" step needed.
const AUDIO_HOSTS = ["archive.org", "everyayah.com"];

// Fetches a full (non-Range) copy of an audio URL and stores it in the audio
// cache, if it isn't there already. Used in the background after a live
// play, never blocks playback. Deliberately fetches the plain URL rather
// than reusing the triggering request: <audio> elements often request with
// a "Range" header, and the Cache Storage API refuses to store 206 Partial
// Content responses — fetching the URL fresh always gets the full file.
function cacheAudioFile(cache, url) {
  return cache.match(url).then(function (already) {
    if (already) return;
    return fetch(url, { mode: "cors" }).then(function (res) {
      if (res && res.ok) return res;
      throw new Error("bad status");
    }).catch(function () {
      // No CORS headers from the host — fine for playback, and still
      // cacheable as an opaque response.
      return fetch(url, { mode: "no-cors" });
    }).then(function (res) {
      return cache.put(url, res);
    }).catch(function () {
      // Offline, blocked, or genuinely unavailable — leave it uncached;
      // it'll just try again the next time this track plays.
    });
  });
}

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
          if (cached) return cached;
          event.waitUntil(cacheAudioFile(cache, event.request.url));
          return fetch(event.request);
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

// Reminder notifications (see reminders.js) carry the chapter to jump to in
// notification.data.url. Focus an already-open tab and tell it to navigate
// there via postMessage (keeps it a same-page SPA hash change), or open a
// fresh tab at that URL if nothing is open.
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var hash = (event.notification.data && event.notification.data.url) || "#/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var client = list[i];
        if ("focus" in client) {
          client.postMessage({ type: "navigate", hash: hash });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(new URL("./", self.registration.scope).href + hash);
      }
    })
  );
});
