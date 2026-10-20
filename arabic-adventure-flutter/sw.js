const CACHE='arabic-adventure-v18';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./animal-sprite-atlas.webp'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(x=>{let copy=x.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return x}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));return}e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{let copy=x.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return x}))) });
