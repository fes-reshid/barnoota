// Phone checks (iPhone 13 profile, WebKit): layout fits, touch handles are bigger, long-press menu, pinch zoom.
const { test, expect } = require('@playwright/test');
const { openEditor, loadAudio } = require('./helpers');

let errors;
test.beforeEach(async ({ page }) => { errors = await openEditor(page); });
test.afterEach(async () => { expect(errors, 'no page errors').toEqual([]); });

test('fits the phone screen and uses touch-sized targets', async ({ page }) => {
  await loadAudio(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(await page.evaluate(() => TOUCH)).toBe(true);
  const h = await page.locator('#playBtn').boundingBox();
  expect(h.height).toBeGreaterThanOrEqual(38);
});

test('press-and-hold on the waveform opens the quick menu', async ({ page }) => {
  await loadAudio(page);
  const box = await page.locator('#wave').boundingBox();
  await page.evaluate(({ x, y }) => {
    const c = document.getElementById('wave');
    c.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: true }));
  }, { x: box.x + 100, y: box.y + 100 });
  await expect(page.locator('.menu .mi', { hasText: 'Add Marker Here' })).toBeVisible({ timeout: 3000 });
});

test('two-finger pinch zooms in and keeps the selection', async ({ page }) => {
  await loadAudio(page);
  const r = await page.evaluate(() => {
    const c = document.getElementById('wave'), b = c.getBoundingClientRect(), y = b.top + 100, cx = b.left + b.width / 2;
    const ev = (type, id, x) => c.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, cancelable: true, isPrimary: id === 1 }));
    zoomFit(); const spp0 = spp;
    ev('pointerdown', 1, cx - 30); ev('pointerdown', 2, cx + 30);
    for (let i = 1; i <= 6; i++) { ev('pointermove', 1, cx - 30 - i * 10); ev('pointermove', 2, cx + 30 + i * 10); }
    ev('pointerup', 1, cx - 90); ev('pointerup', 2, cx + 90);
    return { zoom: spp0 / spp, sel: selA === null || selA === selB };
  });
  expect(r.zoom).toBeGreaterThan(2);
  expect(r.sel).toBe(true);
});
