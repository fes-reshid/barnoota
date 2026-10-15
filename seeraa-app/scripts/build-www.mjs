// Builds seeraa-app/www from the website, so the app ships the same Seeraa Quest
// the website serves, with every file inside the app package.
//
//   www/index.html            opens seeraa/ straight away
//   www/seeraa/               copy of ../seeraa (lessons, maps, scenes, guide, parent page)
//   www/kids-quest-cloud.js   shared student accounts (Firebase), adjusted for the app
//   www/tuhfatul-afaal/...    the one shared picture Seeraa uses
//
// Run with `npm run build` (or `npm run sync` to also copy into android/ and ios/).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.resolve(APP, '..');
const WWW = path.join(APP, 'www');
const SITE_URL = 'https://diinislaam.com';

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}
function copyFile(rel) {
  const to = path.join(WWW, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(SITE, rel), to);
}
/* Replace text in a copied file and fail loudly if the website changed underneath us. */
function edit(rel, pairs) {
  const file = path.join(WWW, rel);
  let s = fs.readFileSync(file, 'utf8');
  for (const [from, to, count = 1] of pairs) {
    const n = s.split(from).length - 1;
    if (n !== count) throw new Error(`${rel}: expected ${count} × ${JSON.stringify(from)}, found ${n}`);
    s = s.split(from).join(to);
  }
  fs.writeFileSync(file, s);
}

fs.rmSync(WWW, { recursive: true, force: true });
copyDir(path.join(SITE, 'seeraa'), path.join(WWW, 'seeraa'));
copyFile('kids-quest-cloud.js');
copyFile('tuhfatul-afaal/assets/tajweed-vocabulary.webp');

/* Firebase sign-in: inside an iOS app the default getAuth() waits for a web
   sign-in helper that never loads, so the app would hang on the login screen.
   initializeAuth with explicit storage works on iOS, Android and the web. */
edit('kids-quest-cloud.js', [
  ['  onAuthStateChanged, signOut,', '  initializeAuth, indexedDBLocalPersistence, inMemoryPersistence,\n  onAuthStateChanged, signOut,'],
  ['const auth = getAuth(app);', 'const auth = initializeAuth(app, { persistence: indexedDBLocalPersistence });'],
  ['getAuth(secondary)', 'initializeAuth(secondary, { persistence: inMemoryPersistence })', 3],
]);

/* Pages that only exist on the website open there, in the phone's browser. */
edit('seeraa/index.html', [['href="/teacher/', `href="${SITE_URL}/teacher/`]]);

/* Phones with a notch, rounded corners or a home bar: the app draws under them
   (viewport-fit=cover) and app-shell.css keeps the map, menus and lessons inside
   the safe area. The website itself is unchanged. */
fs.writeFileSync(path.join(WWW, 'seeraa/app-shell.css'), `/* Seeraa Quest app only (added by seeraa-app/scripts/build-www.mjs) */
html{background:#f3e3bf}
body{padding-top:env(safe-area-inset-top);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
#mapScreen .map-frame{top:env(safe-area-inset-top)!important;right:env(safe-area-inset-right)!important;bottom:env(safe-area-inset-bottom)!important;left:env(safe-area-inset-left)!important}
.map-drawer{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}
.map-sheet{max-height:calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom))!important}
.badge-pop,.reading-guard,.tm-overlay{padding-top:calc(16px + env(safe-area-inset-top))!important;padding-bottom:calc(16px + env(safe-area-inset-bottom))!important}
`);
fs.copyFileSync(path.join(APP, 'src/app-speech.js'), path.join(WWW, 'seeraa/app-speech.js'));
for (const page of ['seeraa/index.html', 'seeraa/guide/index.html', 'seeraa/parent/index.html']) {
  const file = path.join(WWW, page);
  let s = fs.readFileSync(file, 'utf8');
  const meta = s.match(/<meta name="viewport" content="([^"]*)">/);
  if (!meta) throw new Error(page + ': no viewport meta');
  s = s.replace(meta[0], `<meta name="viewport" content="${meta[1].replace(/\s+$/, '')}, viewport-fit=cover">`);
  if (page === 'seeraa/index.html') {
    s = s.replace('</head>', '<link rel="stylesheet" href="app-shell.css">\n</head>');
    /* speech for Android, before any of the page's own scripts run */
    s = s.replace(/<head>/, '<head>\n<script src="app-speech.js"></script>');
  }
  fs.writeFileSync(file, s);
}

fs.writeFileSync(path.join(WWW, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Seeraa Quest</title>
<style>html,body{margin:0;height:100%;background:#f3e3bf}</style>
<script>location.replace('seeraa/index.html'+location.search+location.hash)</script>
</head>
<body></body>
</html>
`);

let files = 0, bytes = 0;
(function count(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) count(p); else { files++; bytes += fs.statSync(p).size; } } })(WWW);
console.log(`www ready: ${files} files, ${(bytes / 1048576).toFixed(1)} MB`);
