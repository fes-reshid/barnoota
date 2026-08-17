// Explicit, user-confirmed offline caching for du'a audio.
// Downloaded files are stored in the Cache Storage API under a dedicated
// cache name; sw.js intercepts requests to the audio hosts and serves the
// cached copy when present, so playback afterwards needs no network at all.
var AudioCacheAPI = (function () {
  var AUDIO_CACHE_NAME = "hisnul-audio-v1";

  function supported() {
    return typeof caches !== "undefined";
  }

  async function isCached(url) {
    if (!supported()) return false;
    try {
      var cache = await caches.open(AUDIO_CACHE_NAME);
      var match = await cache.match(url);
      return !!match;
    } catch (e) {
      return false;
    }
  }

  async function areAllCached(urls) {
    if (!urls || !urls.length) return false;
    for (var i = 0; i < urls.length; i++) {
      if (!(await isCached(urls[i]))) return false;
    }
    return true;
  }

  async function fetchForCache(url) {
    try {
      var res = await fetch(url, { mode: "cors" });
      if (res && res.ok) return res;
      throw new Error("bad status " + (res && res.status));
    } catch (e) {
      // Server likely doesn't send CORS headers for plain playback (that's
      // fine, <audio> doesn't need them). Fall back to an opaque response:
      // we can't inspect its status, but the service worker can still hand
      // it straight back to a future <audio> request.
      return fetch(url, { mode: "no-cors" });
    }
  }

  async function download(urls, onProgress) {
    if (!supported()) throw new Error("Cache Storage API not supported");
    var cache = await caches.open(AUDIO_CACHE_NAME);
    var failed = [];
    for (var i = 0; i < urls.length; i++) {
      var url = urls[i];
      try {
        var existing = await cache.match(url);
        if (!existing) {
          var res = await fetchForCache(url);
          await cache.put(url, res);
        }
      } catch (e) {
        failed.push(url);
      }
      if (onProgress) onProgress(i + 1, urls.length);
    }
    return { failed: failed, total: urls.length };
  }

  async function remove(urls) {
    if (!supported()) return;
    var cache = await caches.open(AUDIO_CACHE_NAME);
    for (var i = 0; i < urls.length; i++) await cache.delete(urls[i]);
  }

  async function clearAll() {
    if (!supported()) return;
    await caches.delete(AUDIO_CACHE_NAME);
  }

  return {
    supported: supported,
    isCached: isCached,
    areAllCached: areAllCached,
    download: download,
    remove: remove,
    clearAll: clearAll
  };
})();
