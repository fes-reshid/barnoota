// The steady-beat "does this sound like music?" check that runs before saving/exporting
// (halal-guard.js): ordinary audio passes silently, flagged audio needs a typed confirmation to
// override, and repeated overrides block the tool on that device.
const { test, expect } = require('@playwright/test');
const { openEditor, loadAudio, musicWav, download } = require('./helpers');

let errors;
test.beforeEach(async ({ page }) => { errors = await openEditor(page); });
test.afterEach(async () => { expect(errors, 'no page errors').toEqual([]); });

test('ordinary audio saves with no warning', async ({ page }) => {
  await loadAudio(page);
  await page.selectOption('#fmtSel', 'wav');
  const w = await download(page, () => page.click('#exportBtn'));
  expect(w.bytes.subarray(0, 4).toString()).toBe('RIFF');
  expect(await page.locator('#hgWarnGate[open]').count()).toBe(0);
});

test('a steady-beat clip is flagged; cancelling stops the save; typed confirmation lets it through', async ({ page }) => {
  await page.setInputFiles('#fileIn', { name: 'music.wav', mimeType: 'audio/wav', buffer: musicWav() });
  await expect(page.locator('.tab')).toHaveCount(1);
  await page.selectOption('#fmtSel', 'wav');

  // Cancel: no download, no strike recorded.
  await page.click('#exportBtn');
  await expect(page.locator('#hgWarnGate[open]')).toBeVisible();
  await expect(page.locator('#hgWarnContinue')).toBeDisabled();
  await page.click('#hgWarnCancel');
  await expect(page.locator('#hgWarnGate[open]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('ae-hg-strikes'))).toBeNull();

  // Wrong text keeps Continue disabled; the exact phrase (case-insensitive) enables it.
  await page.click('#exportBtn');
  await expect(page.locator('#hgWarnGate[open]')).toBeVisible();
  await page.fill('#hgWarnConfirm', 'not quite right');
  await expect(page.locator('#hgWarnContinue')).toBeDisabled();
  await page.fill('#hgWarnConfirm', 'this is not music');
  await expect(page.locator('#hgWarnContinue')).toBeEnabled();

  const w = await download(page, () => page.click('#hgWarnContinue'));
  expect(w.bytes.subarray(0, 4).toString()).toBe('RIFF');
  expect(await page.evaluate(() => localStorage.getItem('ae-hg-strikes'))).toBe('1');
  expect(await page.evaluate(() => localStorage.getItem('ae-hg-blocked'))).toBeNull();
});

test('three overrides self-blocks the tool on this device, even on a fresh page load', async ({ page }) => {
  await page.setInputFiles('#fileIn', { name: 'music.wav', mimeType: 'audio/wav', buffer: musicWav() });
  await expect(page.locator('.tab')).toHaveCount(1);

  const override = () => page.locator('#hgWarnContinue').click();
  const confirmAndOverride = async () => {
    await page.click('#exportBtn');
    await expect(page.locator('#hgWarnGate[open]')).toBeVisible();
    await page.fill('#hgWarnConfirm', 'this is not music');
    await override();
  };

  await Promise.all([page.waitForEvent('download'), confirmAndOverride()]); // strike 1 — still allowed
  await Promise.all([page.waitForEvent('download'), confirmAndOverride()]); // strike 2 — still allowed

  // Strike 3: the warning said this would also block the save, not just warn.
  await page.click('#exportBtn');
  await expect(page.locator('#hgWarnGate[open]')).toBeVisible();
  await page.fill('#hgWarnConfirm', 'this is not music');
  await override();
  await expect(page.locator('#hgWarnGate[open]')).toHaveCount(0);
  await expect(page.locator('#toolBlockedGate[open]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ae-hg-strikes'))).toBe('3');
  expect(await page.evaluate(() => localStorage.getItem('ae-hg-blocked'))).toBe('yes');

  // A fresh load of the page goes straight to the block screen — not the ordinary reminder, not the editor.
  await page.reload();
  await expect(page.locator('#toolBlockedGate[open]')).toBeVisible();
  await expect(page.locator('#consentGate[open]')).toHaveCount(0);
  await page.keyboard.press('Escape'); // must not be dismissible
  await expect(page.locator('#toolBlockedGate[open]')).toBeVisible();
});
