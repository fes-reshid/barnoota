// Zaad: no offline cache for the web app. This replaces any older worker, deletes what it stored
// (an old copy could keep a broken first load), and removes itself.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try { for (const k of await caches.keys()) await caches.delete(k); } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    try { for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url); } catch (e) {}
  })());
});
