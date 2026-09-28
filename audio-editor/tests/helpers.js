// Shared helpers: test audio made on the fly (no binary files in the repo) and page shortcuts.
const { expect } = require('@playwright/test');

// A 16-bit WAV of tone "words" separated by silence: bursts = [[start, end], …] in seconds.
function wav({ sr = 44100, secs = 6, channels = 1, bursts = [[0.5, 1.5], [2, 3], [3.6, 4.4], [5, 5.6]], freq = 220 } = {}) {
  const n = Math.round(sr * secs), data = Buffer.alloc(n * channels * 2);
  for (let i = 0; i < n; i++) {
    const t = i / sr, on = bursts.some(([a, b]) => t >= a && t < b);
    const v = on ? 0.5 * Math.sin(2 * Math.PI * freq * t) * Math.sin(Math.PI * Math.min(1, (t % 1) * 4)) : 0;
    for (let c = 0; c < channels; c++) data.writeInt16LE(Math.round(v * 32767), (i * channels + c) * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(channels, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * channels * 2, 28); h.writeUInt16LE(channels * 2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

// Open the editor with no leftovers, and fail the test on any page error.
async function openEditor(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  await page.goto('./');
  await page.evaluate(async () => { localStorage.clear(); try { indexedDB.deleteDatabase('diin-audio-editor-autosave'); } catch (e) {} });
  await page.reload();
  await expect(page.locator('#menuBar > button').first()).toBeVisible();
  return errors;
}
async function loadAudio(page, opts = {}, name = 'test.wav') {
  await page.setInputFiles('#fileIn', { name, mimeType: 'audio/wav', buffer: wav(opts) });
  await expect(page.locator('.tab')).toHaveCount(1 + (opts.extraTabs || 0));
  await page.waitForFunction(() => typeof doc !== 'undefined' && doc && len() > 0);
}
const seconds = page => page.evaluate(() => len() / doc.sr);
async function menu(page, top, item) {
  await page.locator('#menuBar > button', { hasText: new RegExp('^' + top + '$') }).click();
  await page.locator('.menu .mi', { hasText: item }).first().click();
}
// Save a download and return its bytes.
async function download(page, action) {
  const [d] = await Promise.all([page.waitForEvent('download'), action()]);
  const stream = await d.createReadStream(), chunks = [];
  for await (const c of stream) chunks.push(c);
  return { name: d.suggestedFilename(), bytes: Buffer.concat(chunks) };
}

module.exports = { wav, openEditor, loadAudio, seconds, menu, download };
