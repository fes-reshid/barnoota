// Render the planner HTML to an A5 PDF with headless Chromium.
// usage: node render.js in.html out.pdf
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [inp, out] = process.argv.slice(2, 4);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(inp), { waitUntil: 'load', timeout: 0 });
  await page.evaluate(() => document.fonts.ready);
  // Report any page whose content is taller than the page, so nothing is clipped silently.
  const over = await page.evaluate(() => [...document.querySelectorAll('.page > .in, .rem, .day .bx, .wkb-q, .dbk, .tk3, .dl')]
    .map((e) => [[...document.querySelectorAll('.page')].indexOf(e.closest('.page')) + 1, e.className, e.scrollHeight - e.clientHeight]).filter(x => x[2] > 1));
  if (over.length) console.log('OVERFLOW (page, px): ' + JSON.stringify(over.slice(0, 40)) + (over.length > 40 ? ` … ${over.length} pages` : ''));
  await page.pdf({ path: out, printBackground: true, preferCSSPageSize: true, timeout: 0 });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
