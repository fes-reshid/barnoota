// Draws the Seeraa Quest app icon and launch screens into seeraa-app/assets/
// (then `npm run assets` turns them into every Android and iOS size).
//
//   node scripts/make-art.mjs            needs Playwright with a Chromium browser
//
// The picture: a lone camel crossing the dunes at sunset under a crescent moon,
// inside a golden arch, on the app's deep green. No person is drawn.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'assets');
fs.mkdirSync(OUT, { recursive: true });

/* the camel from the living maps (seeraa-living-world.js), as a silhouette with a red saddle cloth */
const CAMEL = `<g stroke-linecap="round">
 <path d="M-24-32q-5 4-3 11" stroke="#3b2414" fill="none" stroke-width="2.4"/>
 <g stroke="#3b2414" stroke-width="4.6"><line x1="-15" y1="-27" x2="-17" y2="0"/><line x1="-9" y1="-27" x2="-6" y2="0"/><line x1="12" y1="-27" x2="14" y2="0"/><line x1="18" y1="-27" x2="21" y2="0"/></g>
 <path d="M-25-29 Q-24-45-10-46 Q-3-60 6-47 Q15-45 20-35 L23-31 Q10-24-21-25Z" fill="#3b2414"/>
 <path d="M17-35 Q29-38 30-52 Q31-60 37-59 L42-56 Q44-52 39-52 Q35-51 35-45 Q33-31 22-28Z" fill="#3b2414"/>
 <path d="M-11-45 Q-2-55 9-46 L8-39 Q-1-42-10-39Z" fill="#b8352c"/><path d="M-11-45 Q-2-55 9-46" stroke="#f0c75e" fill="none" stroke-width="1.6"/>
 <path d="M-9-40 l-1 7 M-3-41 l-1 7 M3-41 l0 7" stroke="#f0c75e" stroke-width="1.2"/>
</g>`;

/* the scene inside the arch, drawn in a 500 x 690 box with its top-left at (262,170) */
function scene(id) {
  const stars = [[330, 300, 3], [390, 250, 2.4], [700, 270, 2.6], [668, 225, 1.8], [430, 330, 1.6], [720, 330, 2], [520, 240, 1.8]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * 1.4}" fill="#fff8dc" opacity=".9"/>`).join('');
  return `<defs>
  <linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2f5e"/><stop offset=".45" stop-color="#5b4b86"/><stop offset=".72" stop-color="#e58e5a"/><stop offset="1" stop-color="#f7cf8e"/></linearGradient>
  <radialGradient id="sun${id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff2c2"/><stop offset=".55" stop-color="#ffd37a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient>
  <mask id="moon${id}"><rect width="1024" height="1024" fill="#fff"/><circle cx="636" cy="338" r="58" fill="#000"/></mask>
  <clipPath id="arch${id}"><path d="M262 860 V430 A250 250 0 0 1 762 430 V860 Z"/></clipPath>
 </defs>
 <g clip-path="url(#arch${id})">
  <rect x="250" y="160" width="524" height="720" fill="url(#sky${id})"/>
  ${stars}
  <circle cx="512" cy="700" r="230" fill="url(#sun${id})"/>
  <circle cx="606" cy="356" r="66" fill="#fff1c4" mask="url(#moon${id})"/>
  <path d="M250 720 Q360 650 470 690 T690 668 T780 690 V880 H250Z" fill="#d79b55"/>
  <path d="M250 770 Q330 730 430 752 T640 740 T780 760 V880 H250Z" fill="#b97a3c"/>
  <g transform="translate(478 742) scale(4.3)">${CAMEL}</g>
  <path d="M250 812 Q380 786 520 806 T780 800 V880 H250Z" fill="#8f5a2a"/>
 </g>`;
}
function arch(id) {
  return `<defs><linearGradient id="gold${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbeaa8"/><stop offset=".5" stop-color="#e2b75a"/><stop offset="1" stop-color="#b8862f"/></linearGradient></defs>
 <path d="M262 860 V430 A250 250 0 0 1 762 430 V860" fill="none" stroke="url(#gold${id})" stroke-width="30" stroke-linejoin="round"/>
 <path d="M300 860 V436 A212 212 0 0 1 724 436 V860" fill="none" stroke="#f6e3a1" stroke-opacity=".55" stroke-width="5"/>
 <rect x="232" y="852" width="560" height="34" rx="12" fill="url(#gold${id})"/>
 <path d="M512 150 l14 26 -14 12 -14-12Z" fill="url(#gold${id})"/>`;
}
const green = `<defs><radialGradient id="bg" cx="50%" cy="38%" r="72%"><stop offset="0" stop-color="#23805f"/><stop offset=".62" stop-color="#14583f"/><stop offset="1" stop-color="#0b3528"/></radialGradient></defs><rect width="1024" height="1024" fill="url(#bg)"/>`;
const pattern = `<g opacity=".08" stroke="#f6e3a1" stroke-width="3" fill="none">${[...Array(6)].map((_, i) => `<circle cx="512" cy="512" r="${520 + i * 46}"/>`).join('')}</g>`;
const art = id => `${scene(id)}${arch(id)}`;

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const FILES = {
  /* iOS and old Android: full square, no transparency */
  'icon-only.png': [1024, 1024, svg(1024, 1024, green + pattern + art('a')), false],
  /* Android adaptive icon: the picture inside the 66% safe zone on a transparent layer, over the green */
  'icon-foreground.png': [1024, 1024, svg(1024, 1024, `<g transform="translate(512 528) scale(.72) translate(-512 -518)">${art('f')}</g>`), true],
  'icon-background.png': [1024, 1024, svg(1024, 1024, green + pattern), false],
};
function splash(dark) {
  const bg = dark ? '#0f3f2f' : '#f3e3bf', ink = dark ? '#f8ecc9' : '#14533e', gold = dark ? '#e8c873' : '#a8781f';
  return svg(2732, 2732, `<rect width="2732" height="2732" fill="${bg}"/>
   <g transform="translate(1366 1160) scale(.86) translate(-512 -518)">${art(dark ? 'd' : 'l')}</g>
   <text x="1366" y="1790" text-anchor="middle" font-family="Marcellus" font-size="150" fill="${ink}" letter-spacing="4">Seeraa Quest</text>
   <text x="1366" y="1965" text-anchor="middle" font-family="Amiri" font-weight="700" font-size="128" fill="${gold}" direction="rtl">السِّيرَةُ النَّبَوِيَّة</text>`);
}
FILES['splash.png'] = [2732, 2732, splash(false), false];
FILES['splash-dark.png'] = [2732, 2732, splash(true), false];

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await b.newPage({ deviceScaleFactor: 1 });
for (const [name, [w, h, markup, transparent]] of Object.entries(FILES)) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Marcellus&display=block" rel="stylesheet"><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${markup}</body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, name), omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  console.log('drew', name);
}
await b.close();
