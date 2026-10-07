// The audio editor moved to https://nooreditor.web.app/audio-editor/. This replaces the old offline copy:
// it deletes the editor's own saved files (not other Diin Islaam apps'), removes itself, and
// reloads open tabs so they reach the redirect.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k.indexOf('audio-editor-') === 0; }).map(function (k) { return caches.delete(k); }));
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: 'window' });
    tabs.forEach(function (t) { t.navigate(t.url); });
  })());
});
