// The purpose-reminder gate (consent.js) shown once per browser before the editor can be used.
const { test, expect } = require('@playwright/test');
const { wav } = require('./helpers');

test('blocks the editor until agreed, cannot be closed with Escape, and is remembered', async ({ page }) => {
  // A fresh Playwright context starts with empty storage, so the reminder has not been answered yet.
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('./');

  const gate = page.locator('#consentGate'), agree = page.locator('#consentAgree');
  await expect(gate).toBeVisible();
  await expect(agree).toBeDisabled();

  await page.keyboard.press('Escape'); // must not dismiss the reminder
  await expect(gate).toBeVisible();

  await page.locator('#consentCheck').check();
  await expect(agree).toBeEnabled();
  await agree.click();
  await expect(gate).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('ae-consent-v1'))).toBe('yes');

  // the editor is now usable
  await page.setInputFiles('#fileIn', { name: 'test.wav', mimeType: 'audio/wav', buffer: wav() });
  await expect(page.locator('.tab')).toHaveCount(1);

  // a returning visit doesn't show it again
  await page.reload();
  await expect(page.locator('#consentGate')).toBeHidden();
  expect(errors).toEqual([]);
});

test('"I Do Not Agree" leaves the site', async ({ page }) => {
  await page.route('https://diinislaam.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>ok</h1>' }));
  await page.goto('./');
  await page.locator('#consentDecline').click();
  await page.waitForURL('https://diinislaam.com/**');
});
