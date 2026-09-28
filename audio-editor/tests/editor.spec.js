// Main browser tests for the audio editor — run in Chromium, Firefox and WebKit (Safari's engine).
const { test, expect } = require('@playwright/test');
const { wav, openEditor, loadAudio, seconds, menu, download } = require('./helpers');

let errors;
test.beforeEach(async ({ page }) => { errors = await openEditor(page); });
test.afterEach(async () => { expect(errors, 'no page errors').toEqual([]); });

test('starts with the menu bar and the start screen', async ({ page }) => {
  await expect(page.locator('#menuBar > button')).toHaveText(['File', 'Edit', 'Effects', 'Control', 'Tools', 'Bookmark', 'View', 'Voice', 'Help']);
  await expect(page.locator('#empty')).toBeVisible();
  await page.locator('#menuBar > button', { hasText: /^Effects$/ }).click();
  await expect(page.locator('.menu .mi').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.menu')).toHaveCount(0);
});

test('opens a WAV, deletes a selection and undoes it', async ({ page }) => {
  await loadAudio(page);
  expect(await seconds(page)).toBeCloseTo(6, 2);
  await page.evaluate(() => { selA = doc.sr * 1; selB = doc.sr * 2; refresh(); });
  await page.click('#delBtn');
  expect(await seconds(page)).toBeCloseTo(5, 2);
  await page.keyboard.press('Control+z');
  expect(await seconds(page)).toBeCloseTo(6, 2);
});

test('effects change the audio: normalise and fade in', async ({ page }) => {
  await loadAudio(page);
  const peak = () => page.evaluate(() => { let m = 0; for (const c of doc.ch) for (const v of c) m = Math.max(m, Math.abs(v)); return m; });
  expect(await peak()).toBeLessThan(0.55);
  await page.click('#normBtn');
  expect(await peak()).toBeGreaterThan(0.85);
  await page.evaluate(() => { selA = 0; selB = doc.sr * 1.2; refresh(); });
  await page.click('#fadeInBtn');
  const early = await page.evaluate(() => { let m = 0; for (let i = Math.round(doc.sr * 0.5); i < doc.sr * 0.55; i++) m = Math.max(m, Math.abs(doc.ch[0][i])); return m; });
  expect(early).toBeLessThan(0.4); // near the start of the fade the tone is much quieter
});

test('auto-split finds the pauses and saves every part', async ({ page }) => {
  await loadAudio(page);
  await page.click('#autoSplitBtn');
  await expect.poll(() => page.evaluate(() => doc.markers.length)).toBe(3);
  const zip = await download(page, () => page.click('#zipBtn'));
  expect(zip.name).toMatch(/\.zip$/);
  expect(zip.bytes.subarray(0, 2).toString()).toBe('PK');
});

test('saves WAV, MP3 and FLAC, and a saved WAV opens again at the same length', async ({ page }) => {
  await loadAudio(page);
  const save = async fmt => { await page.selectOption('#fmtSel', fmt); return download(page, () => page.click('#exportBtn')); };
  const w = await save('wav');
  expect(w.bytes.subarray(0, 4).toString()).toBe('RIFF');
  const m = await save('mp3');
  expect(m.name).toMatch(/\.mp3$/);
  expect(m.bytes.subarray(0, 3).toString() === 'ID3' || (m.bytes[0] === 0xff && (m.bytes[1] & 0xe0) === 0xe0)).toBeTruthy();
  const f = await save('flac');
  expect(f.bytes.subarray(0, 4).toString()).toBe('fLaC');
  await page.setInputFiles('#fileIn', { name: 'again.wav', mimeType: 'audio/wav', buffer: w.bytes });
  await expect(page.locator('.tab')).toHaveCount(2);
  expect(await seconds(page)).toBeCloseTo(6, 2);
});

test('timestamps export and import give the same parts', async ({ page }) => {
  await loadAudio(page);
  await page.click('#autoSplitBtn');
  const same = await page.evaluate(() => {
    const before = doc.markers.map(m => Math.round(m / doc.sr * 100));
    return ['srt', 'csv', 'json', 'lrc', 'txt'].map(k => {
      const parts = parseTimestamps(timestampsText(k));
      return JSON.stringify(parts.slice(1).map(p => Math.round(p.start * 100))) === JSON.stringify(before);
    });
  });
  expect(same).toEqual([true, true, true, true, true]);
});

test('multitrack: clip volume and fades, then mix down to a new tab', async ({ page }) => {
  await loadAudio(page);
  await page.evaluate(() => openMultitrack());
  await expect(page.locator('#mt')).toHaveClass(/open/);
  await page.click('#mtAddTrack');
  await page.evaluate(() => { mt.playhead = 2; });
  await page.selectOption('#mtAddTab', '0');
  await expect.poll(() => page.evaluate(() => mt.clips.length)).toBe(2);
  await page.evaluate(() => { mtPick(mt.clips[0].id, false); mtRender(); });
  await page.click('#mtClipBtn');
  await page.fill('#pf_db', '-6'); await page.fill('#pf_fi', '1'); await page.click('#paramOk');
  expect(await page.evaluate(() => [+mt.clips[0].gain.toFixed(2), mt.clips[0].fadeIn])).toEqual([0.5, 1]);
  await page.click('#mtMix');
  await expect(page.locator('.tab')).toHaveCount(2);
  expect(await seconds(page)).toBeCloseTo(8, 1); // second copy starts at 2 s
});

test('autosave brings the work back after the page is reloaded', async ({ page }) => {
  await loadAudio(page);
  await page.evaluate(() => { selA = 0; selB = doc.sr; refresh(); });
  await page.click('#delBtn');
  await page.evaluate(() => asSave(true));
  await page.reload();
  await page.click('#restoreYes');
  await expect(page.locator('.tab')).toHaveCount(1);
  expect(await seconds(page)).toBeCloseTo(5, 2);
});

test('Arabic interface is right-to-left and dark mode switches colours', async ({ page }) => {
  await loadAudio(page);
  await page.selectOption('#langSel', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#menuBar > button').first()).toHaveText('ملف');
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.wave-wrap')).direction)).toBe('ltr');
  await page.selectOption('#langSel', 'en');
  await expect(page.locator('#menuBar > button').first()).toHaveText('File');
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await bg();
  await page.evaluate(() => setTheme('dark'));
  expect(await bg()).not.toBe(light);
});

test('spectrogram view draws the audio', async ({ page }) => {
  await loadAudio(page);
  await page.click('#specBtn');
  const bright = await page.evaluate(() => {
    const c = document.getElementById('wave'), g = c.getContext('2d'), d = g.getImageData(Math.round(c.width * 0.2), 0, 1, c.height).data;
    let m = 0; for (let i = 0; i < d.length; i += 4) m = Math.max(m, d[i] + d[i + 1] + d[i + 2]); return m;
  });
  expect(bright).toBeGreaterThan(400); // the tone shows up as a bright line
});

test('effect chain: a saved chain applies in one step', async ({ page }) => {
  await loadAudio(page);
  await page.click('#chainBtn');
  await page.selectOption('#chPick', 'Slow down for memorising');
  await page.click('#chApply');
  await expect.poll(() => page.evaluate(() => doc.label), { timeout: 30_000 }).toContain('Effect chain');
  expect(await seconds(page)).toBeCloseTo(7.5, 1); // 80% tempo
});

test('custom keyboard shortcut runs its command', async ({ page }) => {
  await loadAudio(page);
  await page.evaluate(() => { customKeys = { 'Effects › Normalize': 'K' }; });
  await page.locator('#wave').click({ position: { x: 5, y: 120 } });
  await page.keyboard.press('k');
  await expect.poll(() => page.evaluate(() => doc.label)).toMatch(/Normalis/);
});

test('recording from the microphone inserts audio', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit has no fake microphone in automated tests');
  await loadAudio(page);
  await page.evaluate(() => { cursor = doc.sr; selA = selB = null; refresh(); });
  await page.click('#recBtn');
  await expect.poll(() => page.evaluate(() => !!rec)).toBe(true);
  await page.waitForTimeout(1500);
  await page.click('#recBtn');
  await expect.poll(() => seconds(page), { timeout: 15_000 }).toBeGreaterThan(6.8);
});

test('transcript: deleting words cuts the audio (stand-in speech model)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'intercepting the worker’s model download is only reliable in Chromium');
  await page.route('**/transformers.min.js', r => r.fulfill({ contentType: 'text/javascript', body: `
    export async function pipeline(task, model, opts) {
      opts.progress_callback({ status: 'ready' });
      return async () => ({ text: '', chunks: [
        { text: ' one', timestamp: [0.5, 1.5] }, { text: ' um', timestamp: [2, 3] }, { text: ' three', timestamp: [3.6, 4.4] }, { text: ' four.', timestamp: [5, 5.6] } ] });
    }` }));
  await loadAudio(page);
  await page.evaluate(() => openTranscript());
  await page.click('#trGo');
  await expect(page.locator('#trStatus')).toHaveText('4 words');
  await page.click('#trFill'); // removes "um" and most of the pause after it
  expect(await seconds(page)).toBeCloseTo(6 - 1.48, 1);
  await expect(page.locator('#trText')).toHaveText(/one three four\./);
});
