// The About dialog (Help ▸ About) and the one-time "this works best on a computer" phone notice.
const { test, expect, devices } = require('@playwright/test');
const { openEditor, loadAudio } = require('./helpers');

test('About shows the version and contact address, from the menu', async ({ page }) => {
  const errors = await openEditor(page);
  await loadAudio(page);
  await page.locator('#menuBar > button', { hasText: /^Help$/ }).click();
  await page.locator('.menu .mi', { hasText: 'About' }).click();
  const dlg = page.locator('#aboutDlg[open]');
  await expect(dlg).toBeVisible();
  await expect(dlg).toContainText('Feysel Reshid');
  await expect(dlg).toContainText('fesbackups@gmail.com');
  const version = await page.locator('#aboutVersion').textContent();
  expect(version.trim()).not.toBe(''); expect(version.trim()).not.toBe('—');
  await page.click('#aboutClose');
  await expect(page.locator('#aboutDlg[open]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a phone-sized screen gets a one-time notice recommending a computer, then can continue', async ({ browser }) => {
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  await page.goto('./');
  await page.evaluate(() => localStorage.setItem('ae-consent-v1', 'yes')); // skip the unrelated reminder
  await page.reload();

  const notice = page.locator('#mobileNotice[open]');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('computer');
  await page.click('#mobileNoticeOk');
  await expect(page.locator('#mobileNotice[open]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('ae-mobile-notice-v1'))).toBe('yes');

  // the editor still works after continuing on the phone
  await loadAudio(page);

  // it isn't shown again on a later visit
  await page.reload();
  await expect(page.locator('#mobileNotice[open]')).toHaveCount(0);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('a desktop-sized screen never gets the phone notice', async ({ page }) => {
  const errors = await openEditor(page); // desktop viewport by default
  await page.evaluate(() => localStorage.removeItem('ae-mobile-notice-v1'));
  await page.reload();
  await expect(page.locator('#mobileNotice[open]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
