// Render an HTML file to PDF with headless Chromium.
// usage: node render.js in.html out.pdf [--footer "Book title"]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [inp, out] = process.argv.slice(2, 4);
  const fi = process.argv.indexOf('--footer');
  const footer = fi > 0 ? process.argv[fi + 1] : null;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(inp), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const opts = { path: out, format: 'A4', printBackground: true, preferCSSPageSize: true };
  if (footer) {
    opts.displayHeaderFooter = true;
    opts.headerTemplate = '<span></span>';
    opts.footerTemplate = `<div style="width:100%;font-family:Georgia,serif;font-size:8px;color:#7a6a4a;padding:0 16mm;display:flex;justify-content:space-between;align-items:center">
      <span style="letter-spacing:.12em;text-transform:uppercase">${footer}</span>
      <span style="font-size:9px;color:#0f4c45;font-weight:bold"><span class="pageNumber"></span></span></div>`;
  }
  await page.pdf(opts);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
