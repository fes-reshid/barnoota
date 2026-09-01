const CACHE_NAME = "hisnul-muslim-v68";
const AUDIO_CACHE_NAME = "hisnul-audio-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./privacy.html",
  "./style.css",
  "./app.js",
  "./data.js",
  "./audio.js",
  "./prayertimes.js",
  "./reminders.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-256.png",
  "./icons/icon-512.png"
];

// External hosts the app streams du'a audio from — archive.org/everyayah.com,
// the fallback for the handful of tracks not included in the local audio/
// folder (see audio.js). Requests to any of these, and to the local audio/
// folder itself, are served from the audio cache when present; otherwise
// played straight from the network and, in the background, saved to the
// audio cache so the same track plays offline next time.
const AUDIO_HOSTS = ["archive.org", "everyayah.com"];

// Self-hosted tracks run n1.mp3..n<MAX_LOCAL_TRACK>.mp3, skipping whichever
// numbers are still streamed from archive.org instead (upload gaps — see
// audio.js's MISSING_FROM_RELEASE, which this is kept in sync with by hand:
// duplicated rather than imported so the service worker doesn't have to
// load all of data.js's chapter text just to reach a couple of small
// constants inside audio.js). Bump MAX_LOCAL_TRACK if more tracks are
// added; if the archive.org gap ever closes, empty out MISSING_FROM_RELEASE
// here to match audio.js.
const MAX_LOCAL_TRACK = 280;
const MISSING_FROM_RELEASE = [95, 105, 106, 110, 134, 139, 179, 193, 213, 214, 217, 219, 229, 247, 248, 249];
const MISSING_FROM_RELEASE_SET = {};
MISSING_FROM_RELEASE.forEach(function (n) { MISSING_FROM_RELEASE_SET[n] = true; });

// Filenames from audio.js's LOCAL_OVERRIDES (one-off re-recordings that
// replace a specific du'a's usual track) — duplicated here for the same
// reason as MISSING_FROM_RELEASE above.
const LOCAL_OVERRIDE_FILES = [
  "Ch16d3.mp3", "Ch16d6.mp3",
  "Ch24d3.mp3", "Ch24d5.mp3", "Ch24d6.mp3", "Ch24d8.mp3", "Ch24d9.mp3", "Ch24d10.mp3",
  "Ch28d4.mp3", "Ch28d5.mp3", "Ch28d7.mp3", "Ch28d8.mp3", "Ch28d16.mp3", "Ch28d17.mp3"
];

// Every audio file the app ships with — self-hosted plus the handful still
// on archive.org — so the whole library can be downloaded up front (see
// precacheAllAudio below) instead of only after each track is played once.
const AUDIO_MANIFEST = (function () {
  var list = [];
  for (var n = 1; n <= MAX_LOCAL_TRACK; n++) {
    list.push(MISSING_FROM_RELEASE_SET[n]
      ? "https://archive.org/download/peacefulmankind_Hisnul_Muslim/n" + n + ".mp3"
      : "audio/n" + n + ".mp3");
  }
  // The Aal-'Imraan 190-200 combined du'a's per-ayah audio (see audio.js's
  // ALIMRAN_AYAH_URLS) — outside the n<N>.mp3 sequence entirely.
  for (var a = 190; a <= 200; a++) list.push("audio/ayah-" + a + ".mp3");
  // One-off re-recordings outside the nXX numbering (see audio.js's
  // LOCAL_OVERRIDES, kept in sync with this by hand for the same reason as
  // MISSING_FROM_RELEASE above).
  LOCAL_OVERRIDE_FILES.forEach(function (f) { list.push("audio/" + f); });
  return list;
})();

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

// Downloads every track in AUDIO_MANIFEST into the audio cache, one at a
// time rather than all at once — this is ~290 files, and firing them off
// together would open that many simultaneous connections on a phone.
// cacheAudioFile already resolves (never rejects) even when a given track
// fails, so one slow or blocked file never stops the rest from finishing.
function precacheAllAudio() {
  return caches.open(AUDIO_CACHE_NAME).then(function (cache) {
    return AUDIO_MANIFEST.reduce(function (chain, url) {
      return chain.then(function () { return cacheAudioFile(cache, url); });
    }, Promise.resolve());
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
    }).then(function () {
      return self.clients.claim();
    }).then(function () {
      // Best-effort and never awaited by anything else — a failure here
      // must never be mistaken for the service worker itself failing to
      // activate, so it's swallowed rather than left to reject this chain.
      return precacheAllAudio().catch(function () {});
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);

  // Self-hosted tracks (same-origin, under /audio/) get the same persistent
  // audio-cache treatment as the archive.org/everyayah ones below, rather
  // than falling into the generic same-origin branch further down — that
  // branch caches into the versioned CACHE_NAME, which gets wiped on every
  // app update, so downloaded audio would otherwise disappear and need
  // re-downloading each time the app updates.
  var isLocalAudio = url.origin === location.origin && /\/audio\//.test(url.pathname);

  if (isLocalAudio || AUDIO_HOSTS.indexOf(url.hostname.replace(/^www\./, "")) !== -1) {
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
