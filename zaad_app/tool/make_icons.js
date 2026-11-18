// Draws the Zaad app icon and launch image to assets/icon/*.png.
//   node tool/make_icons.js      (needs Playwright; then: dart run flutter_launcher_icons && dart run flutter_native_splash:create)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const GOLD = '#e7c873';
const crescent = (cx, cy, s) => `
  <mask id="m"><rect x="-1000" y="-1000" width="3000" height="3000" fill="white"/>
    <circle cx="${cx + 0.28 * s}" cy="${cy - 0.12 * s}" r="${0.84 * s}" fill="black"/></mask>
  <circle cx="${cx}" cy="${cy}" r="${s}" fill="${GOLD}" mask="url(#m)"/>
  <path transform="translate(${cx + 0.78 * s} ${cy - 0.62 * s}) scale(${s / 190})" fill="${GOLD}"
    d="M0 -34 L9 -13 L31 -24 L20 -2 L40 8 L18 13 L20 36 L0 21 L-20 36 L-18 13 L-40 8 L-20 -2 L-31 -24 L-9 -13 Z"/>`;

const svgs = {
  'icon.png': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs><radialGradient id="g" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#17695e"/><stop offset="1" stop-color="#072a26"/></radialGradient></defs>
    <rect width="1024" height="1024" fill="url(#g)"/>
    <path d="M232 880 V470 A280 280 0 0 1 792 470 V880 Z" fill="rgba(4,28,25,.55)" stroke="${GOLD}" stroke-width="12"/>
    <path d="M262 850 V474 A250 250 0 0 1 762 474 V850 Z" fill="none" stroke="${GOLD}" stroke-opacity=".55" stroke-width="4"/>
    ${crescent(500, 440, 150)}
    <text x="512" y="735" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="150" letter-spacing="26" fill="${GOLD}">ZAAD</text>
    <text x="512" y="832" text-anchor="middle" font-family="Scheherazade" font-size="72" fill="${GOLD}" opacity=".9">زَادُ اليَوْم</text>
  </svg>`,
  // adaptive icon: only the middle two thirds is always visible, so the drawing stays inside it
  'icon_foreground.png': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${crescent(500, 470, 190)}
    <text x="512" y="790" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="120" letter-spacing="22" fill="${GOLD}">ZAAD</text>
  </svg>`,
  'splash.png': `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 1024 1024">
    ${crescent(500, 440, 230)}
    <text x="512" y="800" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="190" letter-spacing="34" fill="${GOLD}">ZAAD</text>
  </svg>`,
};

(async () => {
  const out = path.resolve(__dirname, '..', 'assets', 'icon');
  fs.mkdirSync(out, { recursive: true });
  const fonts = path.resolve(__dirname, '..', 'assets', 'fonts');
  const browser = await chromium.launch();
  for (const [name, svg] of Object.entries(svgs)) {
    const size = name === 'splash.png' ? 768 : 1024;
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    // a real file, so the browser may load the font files next to it
    const html = path.join(out, '.draw.html');
    fs.writeFileSync(html, `<style>
      @font-face{font-family:Cinzel;font-weight:700;src:url(file://${fonts}/Cinzel.ttf)}
      @font-face{font-family:Scheherazade;src:url(file://${fonts}/ScheherazadeNew-Regular.ttf)}
      html,body{margin:0;background:transparent}</style>${svg}`);
    await page.goto('file://' + html);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, name), omitBackground: name !== 'icon.png' });
    await page.close();
    fs.rmSync(html, { force: true });
  }
  await browser.close();
  console.log('icons written to', out);
})();
