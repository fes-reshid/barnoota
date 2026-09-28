// Service worker for the audio editor: works offline after the first visit.
// The version comes from the registration URL (sw.js?v=…), so a new release gets a new cache.
'use strict';
const V = new URL(self.location).searchParams.get('v') || 'dev';
const CACHE = 'audio-editor-' + V, RUNTIME = 'audio-editor-runtime';
const q = f => f + '?v=' + V;
const PRECACHE = ['./', 'index.html', 'help.html', 'manifest.webmanifest', 'lame.min.js',
  q('editor.css'), q('editor.js'), q('editor-audio.js'), q('editor-multitrack.js'), q('editor-tools.js'), q('editor-ui.js'), q('compat.js'), q('save-extras.js'), q('autosave.js'), q('app-install.js'), q('recitation.js'), q('editing-extras.js'), q('sound-tools.js'), q('i18n.js'), q('ui-prefs.js'), q('transcribe-worker.js'), q('encoder-worker.js'),
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon.svg', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('audio-editor-') && k !== CACHE && k !== RUNTIME).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'extra-files' && e.ports[0]) e.ports[0].postMessage(PRECACHE); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Pages: fresh from the network when online, the saved copy when offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  // Our own files and the libraries loaded on demand (speech engine, M4A packager, fonts):
  // saved copy first, otherwise download and keep.
  const ours = url.origin === self.location.origin && url.pathname.startsWith(new URL('./', self.location).pathname);
  const lib = /(^|\.)(cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname);
  if (!ours && !lib) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(ours ? CACHE : RUNTIME).then(c => c.put(req, copy)); }
    return res;
  })));
});
