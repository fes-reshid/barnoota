// Screenshot every element with a data-out attribute to <outdir>/<data-out>.png
// usage: node render_img.js page.html outdir scale [width height]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [html, outdir, scale, w, h] = process.argv.slice(2);
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: +(w || 1000), height: +(h || 1000) }, deviceScaleFactor: +(scale || 2) });
  await pg.goto('file://' + path.resolve(html), { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(300);
  for (const el of await pg.$$('[data-out]')) {
    const name = await el.getAttribute('data-out');
    await el.screenshot({ path: path.join(outdir, name + '.png'), omitBackground: false });
  }
  await b.close();
})();
