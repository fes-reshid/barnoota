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

test('"I Do Not Agree" cancels — it blocks the tool rather than sending them elsewhere, and can be undone', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  // A second history entry means the best-effort window.close() in consent.js is a no-op in every
  // browser (per spec it only succeeds for a script-opened window, or one with a single history
  // entry) — same as for anyone who arrived via a link rather than typing the address fresh. This
  // makes the fallback "cancelled" screen below the deterministic path to test everywhere.
  await page.goto('./');
  await page.goto('./?revisit=1');

  await page.locator('#consentDecline').click();
  await expect(page.locator('#consentView')).toBeHidden();
  await expect(page.locator('#consentCancelled')).toBeVisible();
  await expect(page.locator('#consentGate')).toBeVisible(); // still open and blocking — no navigation away
  expect(page.url()).toContain('/audio-editor/');
  expect(await page.evaluate(() => localStorage.getItem('ae-consent-v1'))).toBeNull();

  // changing their mind goes back to the reminder, unanswered
  await page.locator('#consentReconsider').click();
  await expect(page.locator('#consentView')).toBeVisible();
  await expect(page.locator('#consentAgree')).toBeDisabled();
  expect(errors).toEqual([]);
});
