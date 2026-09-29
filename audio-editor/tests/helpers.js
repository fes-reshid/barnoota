// Shared helpers: test audio made on the fly (no binary files in the repo) and page shortcuts.
const { expect } = require('@playwright/test');

// A 16-bit WAV of tone "words" separated by silence: bursts = [[start, end], …] in seconds.
// Note: the envelope below is only actually audible during the first quarter of each absolute
// second (see its shape), so bursts need to be long/positioned enough to contain one of those
// windows — don't shorten or reposition them without re-checking auto-split still finds 3 parts.
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
  // Clear all storage, but keep the "I agree" purpose reminder and the phone notice both answered
  // — each has its own dedicated test (consent.spec.js, app-info.spec.js); every other test should
  // land straight on the editor, on any device profile.
  await page.evaluate(async () => {
    localStorage.clear(); localStorage.setItem('ae-consent-v1', 'yes'); localStorage.setItem('ae-mobile-notice-v1', 'yes');
    try { indexedDB.deleteDatabase('diin-audio-editor-autosave'); } catch (e) {}
  });
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

// A synthetic clip with a steady, mechanical 120 BPM click track (plus a held chord, just so it
// sounds musical rather than like a metronome) — for testing halal-guard.js's beat check.
function musicWav({ sr = 44100, secs = 8 } = {}) {
  const n = Math.round(sr * secs), data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let v = 0.15 * (Math.sin(2 * Math.PI * 261.63 * t) + Math.sin(2 * Math.PI * 329.63 * t) + Math.sin(2 * Math.PI * 392 * t));
    const bt = t % 0.5; if (bt < 0.05) v += 0.6 * Math.exp(-bt * 60) * Math.sin(2 * Math.PI * 90 * t);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

module.exports = { wav, musicWav, openEditor, loadAudio, seconds, menu, download };
