// Renders assets/logo.svg into the sidebar logo (logo_data.py) and the app icon (assets/icon.ico).
// Run from noor-cleaner/:  node tools/build_assets.js   (needs Playwright; Python + Pillow for the .ico)
const { chromium } = require('playwright');
const fs = require('fs');
const { execFileSync } = require('child_process');

(async () => {
  const svg = fs.readFileSync('assets/logo.svg', 'utf8');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const render = async (height) => {
    const width = Math.round(height * 200 / 240);
    await page.setViewportSize({ width, height });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${width}" height="${height}" `)}</body></html>`);
    return page.screenshot({ omitBackground: true });
  };
  const sizes = {};
  for (const h of [26, 39, 52]) sizes[h] = (await render(h)).toString('base64');
  fs.writeFileSync('logo_data.py',
    '"""Sidebar logo (generated from assets/logo.svg by tools/build_assets.js - do not edit)."""\n\n' +
    'LOGO_PNG = {\n' + Object.entries(sizes).map(([h, b]) => `    ${h}: "${b}",`).join('\n') + '\n}\n');
  fs.writeFileSync('assets/icon-256.png', await render(256));
  await browser.close();
  execFileSync('python3', ['-c',
    "from PIL import Image; im = Image.open('assets/icon-256.png'); bg = Image.new('RGBA', (256, 256)); " +
    "bg.paste(im, ((256 - im.width) // 2, 0)); " +
    "bg.save('assets/icon.ico', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])"]);
  fs.unlinkSync('assets/icon-256.png');
})();
