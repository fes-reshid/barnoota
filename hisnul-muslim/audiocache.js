// Audio is cached automatically by the service worker as each track is
// played (see sw.js) — nothing here downloads. This just exposes a way to
// clear that cache, for the "clear downloaded audio" button in Settings.
var AudioCacheAPI = (function () {
  var AUDIO_CACHE_NAME = "hisnul-audio-v1";

  function supported() {
    return typeof caches !== "undefined";
  }

  async function clearAll() {
    if (!supported()) return;
    await caches.delete(AUDIO_CACHE_NAME);
  }

  return {
    supported: supported,
    clearAll: clearAll
  };
})();
