// Audio editor — saving and encoding, the settings dialog, effects (EQ, noise reduction, time-stretch), tools, join, batch, history, recent files, analysis.
// Part of the main program: editor.js and its editor-*.js parts load in order as classic scripts and share top-level names.
'use strict';

/* ---------- Export ---------- */
function encodeWav(ch, sr) {
  const n = ch[0].length, nc = ch.length, bytes = n * nc * 2;
  const buf = new ArrayBuffer(44 + bytes), v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + bytes, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nc, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * nc * 2, true); v.setUint16(32, nc * 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, bytes, true);
  let o = 44;
  for (let i = 0; i < n; i++) for (let k = 0; k < nc; k++) {
    const s = clamp(ch[k][i], -1, 1);
    v.setInt16(o, Math.round(s < 0 ? s * 0x8000 : s * 0x7fff), true); o += 2;
  }
  return new Uint8Array(buf);
}
function downloadBlob(bytes, name, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type: type || 'audio/wav' }));
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Minimal "stored" (uncompressed) ZIP writer — WAV barely compresses anyway.
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(d) { let c = 0xffffffff; for (let i = 0; i < d.length; i++) c = CRC_TABLE[(c ^ d[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function makeZip(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true); h.setUint32(14, crc, true);
    h.setUint32(18, size, true); h.setUint32(22, size, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, f.data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true); c.setUint16(12, dosTime, true); c.setUint16(14, dosDate, true); c.setUint32(16, crc, true);
    c.setUint32(20, size, true); c.setUint32(24, size, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + size;
  }
  const cdSize = central.reduce((s, p) => s + p.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
}
/* ---------- MP3 ---------- */
// lamejs (LGPL-3.0, unmodified) is loaded on first use from lame.min.js next to this page.
let lamePromise = null;
function loadLame() {
  if (window.lamejs) return Promise.resolve();
  return lamePromise || (lamePromise = new Promise((resolve, reject) => {
    const sc = document.createElement('script');
    sc.src = 'lame.min.js';
    sc.onload = () => resolve();
    sc.onerror = () => { lamePromise = null; reject(new Error('Could not load the MP3 encoder.')); };
    document.head.appendChild(sc);
  }));
}
const MP3_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];
async function resample(ch, from, to) {
  const n = Math.max(1, Math.round(ch[0].length * to / from));
  const off = new OfflineAudioContext(ch.length, n, to);
  const buf = off.createBuffer(ch.length, ch[0].length, from);
  ch.forEach((c, i) => buf.copyToChannel(c, i));
  const src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start();
  const out = await off.startRendering();
  return Array.from({ length: ch.length }, (_, i) => out.getChannelData(i));
}
async function encodeMp3(ch, sr, onProgress) {
  await loadLame();
  if (ch.length > 2) ch = fitChannels(ch, 1);
  if (!MP3_RATES.includes(sr)) { ch = await resample(ch, sr, sr > 48000 ? 48000 : 44100); sr = sr > 48000 ? 48000 : 44100; }
  const kbps = parseInt($('kbpsSel').value, 10) || 192;
  const enc = new lamejs.Mp3Encoder(ch.length, sr, kbps);
  const n = ch[0].length, BLOCK = 1152 * 32, out = [];
  const toInt16 = (c, a, b) => {
    const r = new Int16Array(b - a);
    for (let i = a; i < b; i++) { const v = clamp(c[i], -1, 1); r[i - a] = v < 0 ? v * 0x8000 : v * 0x7fff; }
    return r;
  };
  let lastYield = performance.now();
  for (let a = 0; a < n; a += BLOCK) {
    const b = Math.min(n, a + BLOCK);
    const l = toInt16(ch[0], a, b), r = ch.length > 1 ? toInt16(ch[1], a, b) : undefined;
    const data = r ? enc.encodeBuffer(l, r) : enc.encodeBuffer(l);
    if (data.length) out.push(new Uint8Array(data));
    if (performance.now() - lastYield > 60) {
      if (onProgress) onProgress(b / n);
      await new Promise(res => setTimeout(res, 0));
      lastYield = performance.now();
    }
  }
  const tail = enc.flush();
  if (tail.length) out.push(new Uint8Array(tail));
  const total = out.reduce((s, x) => s + x.length, 0), bytes = new Uint8Array(total);
  let o = 0; for (const x of out) { bytes.set(x, o); o += x.length; }
  return bytes;
}

/* ---------- Saving ---------- */
// Save formats. Feature files (save-extras.js) add more and can replace an encoder.
// lossy: uses the Quality (kbps) setting in the Save panel.
const FORMATS = {
  mp3: { label: 'MP3', ext: '.mp3', mime: 'audio/mpeg', lossy: true, encode: (ch, sr, onProgress) => encodeMp3(ch, sr, onProgress) },
  wav: { label: 'WAV (lossless)', ext: '.wav', mime: 'audio/wav', encode: async (ch, sr) => encodeWav(ch, sr) },
};
const saveFormat = () => FORMATS[$('fmtSel').value] ? $('fmtSel').value : 'mp3';
const fmtInfo = () => FORMATS[saveFormat()];
const fmtShort = k => FORMATS[k].label.replace(/\s*\(.*\)$/, '');
const formatOptions = () => Object.entries(FORMATS).map(([k, f]) => [k, f.label]);
const ext = () => fmtInfo().ext;
const mime = () => fmtInfo().mime;
function encode(ch, sr, onProgress) {
  // (format and bitrate come from the Save panel)
  return fmtInfo().encode(ch, sr, onProgress);
}
function busyText(t) { $('busy').textContent = t; }
// Run an export with the busy overlay; returns nothing, reports errors as a toast.
async function withBusy(label, fn) {
  busyText(label); busy(true);
  await new Promise(res => setTimeout(res, 30));
  try { await fn(); }
  catch (e) { console.error(e); toast(e.message || 'Saving failed.'); }
  finally { busy(false); busyText('Working…'); }
}
function exportPart(a, b, name) {
  return withBusy('Encoding…', async () => {
    downloadBlob(await encode(sliceCh(doc.ch, a, b), doc.sr, p => busyText(`Encoding… ${Math.round(p * 100)}%`)), name + ext(), mime());
  });
}
function exportZip() {
  const segs = segments();
  if (segs.length < 2) return;
  return withBusy('Encoding…', async () => {
    const files = [];
    for (let i = 0; i < segs.length; i++) {
      const [a, b] = segs[i];
      busyText(`Encoding part ${i + 1} of ${segs.length}…`);
      files.push({ name: partName(i + 1, segs.length) + ext(), data: await encode(sliceCh(doc.ch, a, b), doc.sr) });
    }
    const url = URL.createObjectURL(makeZip(files));
    const link = document.createElement('a'); link.href = url; link.download = baseName() + '-parts.zip';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast(`Saved ${segs.length} parts`);
  });
}
function exportAll() {
  if (!len()) { toast('Nothing to save yet — this file is empty.'); return; }
  return withBusy('Encoding…', async () => {
    downloadBlob(await encode(doc.ch, doc.sr, p => busyText(`Encoding… ${Math.round(p * 100)}%`)), baseName() + ext(), mime());
    dirty = false;
  });
}
function exportSel() {
  if (!hasSel()) return;
  exportPart(selA, selB, baseName() + '-selection');
}
function syncFormat() {
  $('kbpsWrap').style.display = fmtInfo().lossy ? '' : 'none';
  $('exportBtn').textContent = 'Download ' + fmtShort(saveFormat());
}
$('fmtSel').addEventListener('change', syncFormat);
syncFormat();

/* ---------- Level meter ---------- */
function connectMeters(ctx, src, n) {
  const split = ctx.createChannelSplitter(n);
  src.connect(split);
  return Array.from({ length: n }, (_, i) => {
    const an = ctx.createAnalyser(); an.fftSize = 1024;
    split.connect(an, i);
    return { an, buf: new Float32Array(an.fftSize), hold: 0 };
  });
}
function drawMeter(meters) {
  const c = $('meter'), m = c.getContext('2d'), W = c.width, H = c.height;
  m.fillStyle = '#fff'; m.fillRect(0, 0, W, H);
  // Scale: -60 dB .. 0 dB
  const x = db => clamp((db + 60) / 60, 0, 1) * W;
  m.fillStyle = 'rgba(169,124,37,.35)';
  for (let d = -48; d < 0; d += 12) m.fillRect(Math.round(x(d)), 0, 1, H);
  if (!meters) return;
  const lane = H / meters.length;
  meters.forEach((mt, i) => {
    mt.an.getFloatTimeDomainData(mt.buf);
    let pk = 0; for (const v of mt.buf) pk = Math.max(pk, Math.abs(v));
    const db = pk > 0 ? 20 * Math.log10(pk) : -120;
    mt.hold = Math.max(db, mt.hold - 0.6);
    const w = x(db);
    m.fillStyle = db > -1 ? '#a3402e' : db > -9 ? '#a97c25' : '#2e6b58';
    m.fillRect(0, i * lane + 1, w, lane - 2);
    m.fillStyle = '#1c2b46'; m.fillRect(Math.max(0, x(mt.hold) - 1), i * lane + 1, 2, lane - 2);
  });
}
function seekBy(sec) {
  if (!doc || !len()) return;
  const wasPlaying = !!player, pos = player ? playPos() : cursor;
  cursor = clamp(Math.round(pos + sec * doc.sr), 0, len());
  if (wasPlaying) { stopPlay(); if (hasSel() && (cursor < selA || cursor >= selB)) selA = selB = null; play(); }
  else refresh();
}

/* ---------- Parameter dialog ---------- */
// fields: { id, label, type: 'number' | 'select' | 'check', value, min, max, step, unit, options: [[value, label]] }
let paramState = null;
function askParams(title, desc, fields, { ok = 'Apply', preview = null } = {}) {
  return new Promise(resolve => {
    $('paramTitle').textContent = title;
    $('paramDesc').textContent = desc || '';
    const box = $('paramFields'); box.innerHTML = '';
    for (const f of fields) {
      const wrap = document.createElement('div'); wrap.className = 'field';
      const id = 'pf_' + f.id;
      if (f.type === 'check') {
        const lab = document.createElement('label'); lab.className = 'check';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = id; cb.checked = !!f.value;
        lab.append(cb, ' ' + f.label); wrap.appendChild(lab);
      } else {
        const lab = document.createElement('label'); lab.htmlFor = id; lab.textContent = f.label; wrap.appendChild(lab);
        const row = document.createElement('div'); row.className = 'field-row';
        let input;
        if (f.type === 'select') {
          input = document.createElement('select');
          f.options.forEach(([v, l]) => input.add(new Option(l, v)));
          input.value = String(f.value);
        } else if (f.type === 'text') {
          input = document.createElement('input'); input.type = 'text'; input.className = 'num';
          input.style.width = '100%'; input.value = f.value; input.spellcheck = false;
        } else {
          input = document.createElement('input'); input.type = 'number'; input.className = 'num';
          input.value = f.value;
          for (const a of ['min', 'max', 'step']) if (f[a] !== undefined) input[a] = f[a];
        }
        input.id = id; row.appendChild(input);
        if (f.unit) { const u = document.createElement('span'); u.textContent = f.unit; row.appendChild(u); }
        wrap.appendChild(row);
      }
      box.appendChild(wrap);
    }
    $('paramOk').textContent = ok;
    $('paramPreview').hidden = !preview;
    paramState = { fields, resolve, preview };
    $('paramDlg').showModal();
    const first = box.querySelector('input,select'); if (first) first.focus();
  });
}
function paramValues() {
  return Object.fromEntries(paramState.fields.map(f => {
    const el = $('pf_' + f.id);
    if (f.type === 'check') return [f.id, el.checked];
    if (f.type === 'select' || f.type === 'text') return [f.id, el.value];
    let v = parseFloat(el.value);
    if (!isFinite(v)) v = f.value;
    if (f.min !== undefined) v = Math.max(f.min, v);
    if (f.max !== undefined) v = Math.min(f.max, v);
    return [f.id, v];
  }));
}
function finishParams(ok) {
  if (!paramState) return;
  const st = paramState, vals = ok ? paramValues() : null;
  paramState = null;
  stopPreview();
  $('paramDlg').close();
  st.resolve(vals);
}
on('paramOk', () => finishParams(true));
on('paramCancel', () => finishParams(false));
$('paramDlg').addEventListener('close', () => finishParams(false));
$('paramDlg').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); finishParams(true); } });

// Preview: render up to 8 s of the target range with the current settings and play it.
let previewSrc = null;
function stopPreview() { if (previewSrc) { try { previewSrc.stop(); } catch (e) {} previewSrc = null; } }
on('paramPreview', async () => {
  if (!paramState || !paramState.preview) return;
  stopPreview(); stopPlay();
  const [a, b0] = range(), b = Math.min(b0, a + doc.sr * 8);
  try {
    const out = await paramState.preview(sliceCh(doc.ch, a, b), doc.sr, paramValues());
    const ctx = audio(); ctx.resume();
    const buf = ctx.createBuffer(out.length, Math.max(1, out[0].length), doc.sr);
    out.forEach((c, i) => buf.copyToChannel(c, i));
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start();
    previewSrc = src;
  } catch (e) { console.error(e); toast('Preview failed.'); }
});

/* ---------- Offline rendering (Web Audio effects) ---------- */
async function renderOffline(ch, sr, build) {
  const n = Math.max(1, ch[0].length);
  const off = new OfflineAudioContext(ch.length, n, sr);
  const buf = off.createBuffer(ch.length, n, sr);
  ch.forEach((c, i) => buf.copyToChannel(c, i));
  const src = off.createBufferSource(); src.buffer = buf;
  build(off, src).connect(off.destination);
  src.start();
  const r = await off.startRendering();
  return Array.from({ length: ch.length }, (_, i) => r.getChannelData(i).slice(0, ch[0].length));
}
// Replace [a, b) with audio of any length (markers inside the range are dropped).
function opReplace(a, b, ins) {
  const base = doc;
  doc = opDelete(a, b);
  const next = opInsert(a, ins);
  doc = base;
  return next;
}
// Ask for settings, then run process(ch, sr, values) -> channels over the selection (or whole file).
async function processFx(name, desc, fields, process, { sameLength = true } = {}) {
  if (!doc || !len()) return;
  stopPlay();
  const vals = await askParams(name, desc, fields, { preview: process });
  if (!vals) return;
  const [a, b] = range();
  busy(true);
  try {
    const out = await process(sliceCh(doc.ch, a, b), doc.sr, vals);
    if (sameLength) {
      const ch = doc.ch.map((c, k) => { const o = c.slice(); o.set(out[k].subarray(0, b - a), a); return o; });
      commit(makeDoc(doc.sr, ch, doc.markers.slice()), name);
    } else {
      commit(opReplace(a, b, out), name);
      if (hasSel()) { selB = selA + out[0].length; }
      clampView(); refresh();
    }
  } catch (e) { console.error(e); toast(name + ' failed.'); }
  finally { busy(false); }
}
const biquad = (ctx, type, freq, gain = 0, Q = 0.707) => {
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.gain.value = gain; f.Q.value = Q; return f;
};
const chain = (src, ...nodes) => { nodes.reduce((a, n) => (a.connect(n), n), src); return nodes[nodes.length - 1]; };

/* ---------- Graphic equaliser (10 bands, like WavePad) ---------- */
const EQ_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const EQ_Q = 1.41, EQ_MAX = 24; // one-octave bands, ±24 dB
const EQ_PRESETS = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Voice clarity': [-6, -4, -2, 0, 0, 2, 4, 4, 2, 0],
  'Warm voice': [0, 2, 3, 2, 0, -1, 0, 1, 0, -2],
  'Remove rumble / hum': [-18, -12, -6, -2, 0, 0, 0, 0, 0, 0],
  'Reduce hiss': [0, 0, 0, 0, 0, 0, 0, -3, -8, -12],
  'Soften harsh “s”': [0, 0, 0, 0, 0, 0, 0, -2, -6, -3],
  'Bass boost': [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  'Treble boost': [0, 0, 0, 0, 0, 0, 2, 4, 5, 6],
  'Loudness (smile)': [5, 4, 2, 0, -1, -1, 0, 2, 4, 5],
  'Telephone': [-24, -24, -18, -6, 0, 3, 3, -6, -24, -24],
};
let eqGains = EQ_FREQS.map(() => 0), eqRange = null, eqSpectrum = null, eqLive = null, eqDragBand = -1;
const eqFmtF = f => f >= 1000 ? (f / 1000) + 'k' : String(f);
function eqFilters(ctx, gains) {
  return EQ_FREQS.map((f, i) => biquad(ctx, 'peaking', f, gains[i], EQ_Q));
}
// Average spectrum of (up to 150 frames of) the range, in dB, on the FFT bins.
function eqMeasureSpectrum(a, b) {
  const n = b - a, frames = Math.min(150, Math.max(1, Math.floor(n / NR_N)));
  const pow = new Float64Array(NR_N / 2 + 1), re = new Float64Array(NR_N), im = new Float64Array(NR_N);
  for (let f = 0; f < frames; f++) {
    const st = a + Math.floor((n - NR_N) * (frames > 1 ? f / (frames - 1) : 0));
    for (let i = 0; i < NR_N; i++) { let v = 0; for (const c of doc.ch) v += c[st + i] || 0; re[i] = v / doc.ch.length * nrWindow[i]; im[i] = 0; }
    fft(re, im, false);
    for (let k = 0; k < pow.length; k++) pow[k] += re[k] * re[k] + im[k] * im[k];
  }
  return Array.from(pow, v => 10 * Math.log10(v / frames + 1e-12));
}
// Graph geometry: log frequency 20 Hz – 20 kHz across, dB from -EQ_MAX to +EQ_MAX up.
const eqX = (f, W) => Math.log(f / 20) / Math.log(1000) * W;
const eqY = (db, H) => H / 2 - db / EQ_MAX * (H / 2 - 12);
function eqDraw() {
  const cv = $('eqGraph'), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g2 = cv.getContext('2d');
  g2.setTransform(dpr, 0, 0, dpr, 0, 0);
  g2.fillStyle = css('--wave-bg'); g2.fillRect(0, 0, W, H);
  g2.font = '10px ' + css('--ui'); g2.textBaseline = 'top';
  // Grid
  for (const f of [50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
    const x = eqX(f, W); g2.fillStyle = 'rgba(169,124,37,.18)'; g2.fillRect(Math.round(x), 0, 1, H);
    g2.fillStyle = css('--muted'); g2.fillText(eqFmtF(f), x + 2, H - 12);
  }
  for (const db of [-18, -12, -6, 0, 6, 12, 18]) {
    const y = eqY(db, H); g2.fillStyle = db ? 'rgba(169,124,37,.18)' : 'rgba(169,124,37,.55)'; g2.fillRect(0, Math.round(y), W, 1);
    g2.fillStyle = css('--muted'); g2.fillText((db > 0 ? '+' : '') + db, 3, y + 1);
  }
  // The audio's spectrum (relative), as a soft fill
  if (eqSpectrum && doc) {
    const sp = eqSpectrum, max = Math.max(...sp.slice(2)), binHz = doc.sr / NR_N;
    g2.beginPath(); g2.moveTo(0, H);
    for (let x = 0; x <= W; x += 2) {
      const f = 20 * Math.pow(1000, x / W), k = Math.min(sp.length - 1, Math.max(1, Math.round(f / binHz)));
      const rel = clamp((sp[k] - max + 70) / 70, 0, 1); // 70 dB range
      g2.lineTo(x, H - rel * (H - 16));
    }
    g2.lineTo(W, H); g2.closePath(); g2.fillStyle = 'rgba(46,107,88,.16)'; g2.fill();
  }
  // Response curve from the real filters
  const ctx = audio(), fl = eqFilters(ctx, eqGains), N = 240;
  const freqs = new Float32Array(N), mag = new Float32Array(N), ph = new Float32Array(N), tot = new Float32Array(N).fill(1);
  for (let i = 0; i < N; i++) freqs[i] = 20 * Math.pow(1000, i / (N - 1));
  for (const f of fl) { f.getFrequencyResponse(freqs, mag, ph); for (let i = 0; i < N; i++) tot[i] *= mag[i]; }
  g2.beginPath();
  for (let i = 0; i < N; i++) { const x = i / (N - 1) * W, y = eqY(clamp(20 * Math.log10(tot[i]), -EQ_MAX * 1.2, EQ_MAX * 1.2), H); i ? g2.lineTo(x, y) : g2.moveTo(x, y); }
  g2.strokeStyle = ENV_COL; g2.lineWidth = 2.5; g2.stroke();
  // Band dots
  EQ_FREQS.forEach((f, i) => {
    const x = eqX(f, W), y = eqY(eqGains[i], H);
    g2.beginPath(); g2.arc(x, y, i === eqDragBand ? 7 : 5.5, 0, Math.PI * 2);
    g2.fillStyle = i === eqDragBand ? ENV_COL : '#fff'; g2.fill(); g2.strokeStyle = ENV_COL; g2.lineWidth = 2; g2.stroke();
  });
}
function eqSetGain(i, db, fromSlider) {
  eqGains[i] = clamp(Math.round(db * 2) / 2, -EQ_MAX, EQ_MAX);
  const band = $('eqBands').children[i];
  if (!fromSlider) band.querySelector('input').value = eqGains[i];
  band.querySelector('output').value = (eqGains[i] > 0 ? '+' : '') + eqGains[i];
  if (eqLive) eqLive.filters[i].gain.setTargetAtTime(eqGains[i], audio().currentTime, 0.02);
  const match = Object.keys(EQ_PRESETS).find(k => EQ_PRESETS[k].every((v, j) => v === eqGains[j]));
  $('eqPreset').value = match || '';
  eqDraw();
}
function eqBuild() {
  const box = $('eqBands'); box.innerHTML = '';
  EQ_FREQS.forEach((f, i) => {
    const d = document.createElement('div'); d.className = 'eq-band';
    const out = document.createElement('output');
    const r = document.createElement('input'); r.type = 'range'; r.min = -EQ_MAX; r.max = EQ_MAX; r.step = 0.5; r.value = eqGains[i];
    r.setAttribute('aria-label', eqFmtF(f) + ' Hz');
    r.addEventListener('input', () => eqSetGain(i, parseFloat(r.value), true));
    r.addEventListener('dblclick', () => eqSetGain(i, 0));
    const lab = document.createElement('span'); lab.textContent = eqFmtF(f);
    d.append(out, r, lab); box.appendChild(d);
  });
  const sel = $('eqPreset'); sel.innerHTML = '';
  sel.add(new Option('Custom', ''));
  Object.keys(EQ_PRESETS).forEach(k => sel.add(new Option(k, k)));
  EQ_FREQS.forEach((_, i) => eqSetGain(i, eqGains[i]));
}
function fxEqualiser() {
  if (!doc || !len()) return;
  stopPlay();
  const [a, b] = range();
  eqRange = [a, b];
  $('eqScope').textContent = hasSel() ? '(selection)' : '(whole file)';
  eqSpectrum = b - a >= NR_N ? eqMeasureSpectrum(a, b) : null;
  eqBuild();
  $('eqDlg').showModal();
  eqDraw();
}
function eqStopLive() {
  if (!eqLive) return;
  try { eqLive.src.stop(); } catch (e) {}
  eqLive = null; $('eqPlay').textContent = '▶ Preview';
}
// Live preview: loop the range through real filters; slider moves change them instantly.
function eqToggleLive() {
  if (eqLive) { eqStopLive(); return; }
  const ctx = audio(); ctx.resume();
  const [a, b] = eqRange, src = ctx.createBufferSource();
  src.buffer = getPlayBuf(); src.loop = true; src.loopStart = a / doc.sr; src.loopEnd = b / doc.sr;
  const filters = eqFilters(ctx, eqGains);
  chain(src, ...filters).connect(ctx.destination);
  src.start(0, a / doc.sr);
  eqLive = { src, filters };
  $('eqPlay').textContent = '■ Stop preview';
}
async function eqApply() {
  eqStopLive();
  $('eqDlg').close();
  if (eqGains.every(v => v === 0)) { toast('The equaliser is flat — nothing changed.'); return; }
  const [a, b] = eqRange, gains = eqGains.slice();
  busy(true);
  try {
    const out = await renderOffline(sliceCh(doc.ch, a, b), doc.sr, (ctx, src) => chain(src, ...eqFilters(ctx, gains)));
    const ch = doc.ch.map((c, k) => { const o = c.slice(); o.set(out[k].subarray(0, b - a), a); return o; });
    const name = $('eqPreset').value;
    commit(makeDoc(doc.sr, ch, doc.markers.slice()), 'Equaliser' + (name ? ` (${name})` : ''));
  } catch (e) { console.error(e); toast('Equaliser failed.'); }
  finally { busy(false); }
}
// Dragging a dot on the graph moves the nearest band.
(() => {
  const cv = $('eqGraph');
  const band = e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left; let best = 0, bd = Infinity; EQ_FREQS.forEach((f, i) => { const d = Math.abs(eqX(f, r.width) - x); if (d < bd) { bd = d; best = i; } }); return best; };
  const dbAt = e => { const r = cv.getBoundingClientRect(), H = r.height; return (H / 2 - (e.clientY - r.top)) / (H / 2 - 12) * EQ_MAX; };
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); eqDragBand = band(e); eqSetGain(eqDragBand, dbAt(e)); });
  cv.addEventListener('pointermove', e => { if (eqDragBand >= 0) eqSetGain(eqDragBand, dbAt(e)); });
  const end = () => { eqDragBand = -1; eqDraw(); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('dblclick', e => eqSetGain(band(e), 0));
})();
$('eqPreset').addEventListener('change', e => { const p = EQ_PRESETS[e.target.value]; if (p) p.forEach((v, i) => eqSetGain(i, v)); });
on('eqPlay', eqToggleLive);
on('eqFlat', () => EQ_FREQS.forEach((_, i) => eqSetGain(i, 0)));
on('eqCancel', () => $('eqDlg').close());
on('eqApply', eqApply);
$('eqDlg').addEventListener('close', eqStopLive);

function fxEcho() {
  processFx('Echo', 'Repeats the sound after a short delay, each repeat quieter than the last.', [
    { id: 'delay', label: 'Delay between echoes', value: 300, min: 20, max: 2000, step: 10, unit: 'ms' },
    { id: 'decay', label: 'Each echo’s loudness', value: 40, min: 5, max: 90, step: 5, unit: '% of the previous' },
  ], (ch, sr, v) => renderOffline(ch, sr, (ctx, src) => {
    const out = ctx.createGain(), d = ctx.createDelay(5), fb = ctx.createGain();
    d.delayTime.value = v.delay / 1000; fb.gain.value = v.decay / 100;
    src.connect(out); src.connect(d); d.connect(fb); fb.connect(d); fb.connect(out);
    return out;
  }));
}
function fxReverb() {
  processFx('Reverb', 'Adds the sound of a room or hall.', [
    { id: 'size', label: 'Room size (reverb length)', value: 1.8, min: 0.2, max: 8, step: 0.1, unit: 's' },
    { id: 'mix', label: 'Amount', value: 25, min: 0, max: 100, step: 5, unit: '%' },
  ], (ch, sr, v) => renderOffline(ch, sr, (ctx, src) => {
    const n = Math.round(v.size * sr), nc = Math.min(2, ch.length);
    const ir = ctx.createBuffer(nc, n, sr);
    for (let k = 0; k < nc; k++) { const d = ir.getChannelData(k); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    const dry = ctx.createGain(), wet = ctx.createGain(), out = ctx.createGain();
    dry.gain.value = 1 - v.mix / 200; wet.gain.value = v.mix / 100;
    src.connect(dry); dry.connect(out); src.connect(conv); conv.connect(wet); wet.connect(out);
    return out;
  }));
}
function fxCompressor() {
  processFx('Compressor', 'Makes loud parts quieter so the whole recording sounds more even, then raises it back up.', [
    { id: 'thr', label: 'Start compressing above', value: -24, min: -60, max: 0, step: 1, unit: 'dB' },
    { id: 'ratio', label: 'Strength (ratio)', value: 4, min: 1, max: 20, step: 0.5, unit: ': 1' },
    { id: 'makeup', label: 'Make-up gain', value: 6, min: 0, max: 24, step: 1, unit: 'dB' },
  ], (ch, sr, v) => renderOffline(ch, sr, (ctx, src) => {
    const c = ctx.createDynamicsCompressor();
    c.threshold.value = v.thr; c.ratio.value = v.ratio; c.knee.value = 8; c.attack.value = 0.005; c.release.value = 0.2;
    const g = ctx.createGain(); g.gain.value = Math.pow(10, v.makeup / 20);
    return chain(src, c, g);
  }));
}
function fxHighpass() {
  processFx('Remove rumble', 'Cuts everything below the chosen pitch — removes hum, traffic rumble and wind. 80–120 Hz suits speech.', [
    { id: 'f', label: 'Cut below', value: 90, min: 20, max: 1000, step: 10, unit: 'Hz' },
  ], (ch, sr, v) => renderOffline(ch, sr, (ctx, src) => chain(src, biquad(ctx, 'highpass', v.f), biquad(ctx, 'highpass', v.f))));
}
function fxLowpass() {
  processFx('Remove hiss', 'Cuts everything above the chosen pitch — softens hiss and harsh highs. 6000–8000 Hz keeps speech clear.', [
    { id: 'f', label: 'Cut above', value: 7000, min: 500, max: 20000, step: 100, unit: 'Hz' },
  ], (ch, sr, v) => renderOffline(ch, sr, (ctx, src) => chain(src, biquad(ctx, 'lowpass', v.f), biquad(ctx, 'lowpass', v.f))));
}
function gateCh(ch, sr, thr, holdMs = 60) {
  const { win, db } = loudness(ch, sr);
  const hold = Math.ceil(holdMs / 10), open = new Uint8Array(db.length);
  for (let w = 0; w < db.length; w++) if (db[w] >= thr) for (let j = Math.max(0, w - hold); j <= Math.min(db.length - 1, w + hold); j++) open[j] = 1;
  const atk = 1 - Math.exp(-1 / (0.004 * sr)), rel = 1 - Math.exp(-1 / (0.06 * sr));
  const out = ch.map(c => new Float32Array(c.length));
  let g = open[0] ? 1 : 0;
  for (let i = 0; i < ch[0].length; i++) {
    const t = open[Math.floor(i / win)] ? 1 : 0;
    g += (t - g) * (t > g ? atk : rel);
    for (let k = 0; k < ch.length; k++) out[k][i] = ch[k][i] * g;
  }
  return out;
}
/* ---------- Noise reduction (spectral subtraction) ---------- */
// Radix-2 FFT, in place. inv = true for the inverse (unscaled).
const fftCache = {};
function fftTables(n) {
  if (fftCache[n]) return fftCache[n];
  const rev = new Uint32Array(n), bits = Math.log2(n);
  for (let i = 0; i < n; i++) { let r = 0; for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b); rev[i] = r; }
  const cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = Math.sin(2 * Math.PI * i / n); }
  return (fftCache[n] = { rev, cos, sin });
}
function fft(re, im, inv) {
  const n = re.length, { rev, cos, sin } = fftTables(n);
  for (let i = 0; i < n; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1, step = n / size;
    for (let i = 0; i < n; i += size) {
      for (let j = 0, k = 0; j < half; j++, k += step) {
        const wr = cos[k], wi = inv ? sin[k] : -sin[k];
        const a = i + j, b = a + half;
        const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
      }
    }
  }
}
const NR_N = 2048, NR_HOP = 512;
const nrWindow = (() => { const w = new Float64Array(NR_N); for (let i = 0; i < NR_N; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / NR_N); return w; })();
// Magnitude spectrum of each frame of one channel: calls fn(frameIndex, re, im).
function eachFrame(c, fn) {
  const re = new Float64Array(NR_N), im = new Float64Array(NR_N);
  const frames = Math.max(1, Math.ceil((c.length + NR_N) / NR_HOP));
  for (let f = 0; f < frames; f++) {
    const start = f * NR_HOP - NR_N; // first frame starts before the audio so every sample is covered
    for (let i = 0; i < NR_N; i++) { const j = start + i; re[i] = j >= 0 && j < c.length ? c[j] * nrWindow[i] : 0; im[i] = 0; }
    fft(re, im, false);
    fn(f, re, im, start);
  }
}
// Average noise spectrum per channel. frames: 'all' or pick the quietest 15% (automatic).
function noiseProfile(ch, quietestOnly) {
  return ch.map(c => {
    const mags = [], energies = [];
    eachFrame(c, (f, re, im, start) => {
      if (start < 0 || start + NR_N > c.length) return; // only whole frames
      const m = new Float32Array(NR_N / 2 + 1); let e = 0;
      for (let k = 0; k <= NR_N / 2; k++) { m[k] = Math.hypot(re[k], im[k]); e += m[k] * m[k]; }
      mags.push(m); energies.push(e);
    });
    let use = mags;
    if (quietestOnly && mags.length > 4) {
      const order = energies.map((e, i) => [e, i]).sort((a, b) => a[0] - b[0]);
      use = order.slice(0, Math.max(2, Math.round(order.length * 0.15))).map(([, i]) => mags[i]);
    }
    const avg = new Float32Array(NR_N / 2 + 1);
    if (!use.length) return avg;
    for (const m of use) for (let k = 0; k < avg.length; k++) avg[k] += m[k] / use.length;
    return avg;
  });
}
let grabbedNoise = null; // { sr, prof: [Float32Array per channel], secs }
async function reduceNoise(ch, sr, v) {
  let prof;
  if (v.src === 'sample' && grabbedNoise && grabbedNoise.sr === sr) prof = grabbedNoise.prof;
  else prof = noiseProfile(ch, true);
  const floor = Math.pow(10, -v.amount / 20), over = v.sens;
  const nb = NR_N / 2 + 1, out = [];
  let lastYield = performance.now();
  for (let c = 0; c < ch.length; c++) {
    const x = ch[c], noise = prof[Math.min(c, prof.length - 1)];
    const y = new Float64Array(x.length + 2 * NR_N);
    const prevG = new Float64Array(nb).fill(1), g = new Float64Array(nb), gs = new Float64Array(nb);
    const re = new Float64Array(NR_N), im = new Float64Array(NR_N);
    const frames = Math.max(1, Math.ceil((x.length + NR_N) / NR_HOP));
    for (let f = 0; f < frames; f++) {
      const start = f * NR_HOP - NR_N;
      for (let i = 0; i < NR_N; i++) { const j = start + i; re[i] = j >= 0 && j < x.length ? x[j] * nrWindow[i] : 0; im[i] = 0; }
      fft(re, im, false);
      for (let k = 0; k < nb; k++) {
        const mag = Math.hypot(re[k], im[k]) + 1e-12;
        g[k] = Math.max(floor, 1 - over * noise[k] / mag);
      }
      // Smooth across neighbouring frequencies and over time to avoid "musical noise" chirps.
      for (let k = 0; k < nb; k++) {
        const a = g[Math.max(0, k - 1)], b = g[k], d = g[Math.min(nb - 1, k + 1)];
        let v2 = (a + 2 * b + d) / 4;
        v2 = v2 < prevG[k] ? prevG[k] * 0.5 + v2 * 0.5 : v2; // fall gently, rise at once (keeps word onsets)
        gs[k] = v2; prevG[k] = v2;
      }
      for (let k = 0; k < nb; k++) {
        re[k] *= gs[k]; im[k] *= gs[k];
        if (k > 0 && k < NR_N / 2) { re[NR_N - k] *= gs[k]; im[NR_N - k] *= gs[k]; }
      }
      fft(re, im, true);
      // Hann analysis + Hann synthesis at 75% overlap sums to 1.5.
      for (let i = 0; i < NR_N; i++) y[start + NR_N + i] += re[i] / NR_N * nrWindow[i] / 1.5;
      if (performance.now() - lastYield > 80) { await new Promise(r => setTimeout(r, 0)); lastYield = performance.now(); }
    }
    out.push(Float32Array.from(y.subarray(NR_N, NR_N + x.length)));
  }
  return out;
}
function grabNoise() {
  if (!doc || !hasSel()) { toast('First select a part that has only background noise (no voice).'); return; }
  const secs = (selB - selA) / doc.sr;
  if (secs < 0.1) { toast('Select at least 0.1 s of noise — half a second or more works best.'); return; }
  grabbedNoise = { sr: doc.sr, prof: noiseProfile(sliceCh(doc.ch, selA, selB), false), secs };
  toast(`Noise sample taken (${secs.toFixed(2)} s). Now clear the selection and press Noise reduction…`);
}
function fxNoise() {
  const have = grabbedNoise && doc && grabbedNoise.sr === doc.sr;
  processFx('Noise reduction', 'Removes steady background noise — hiss, hum, fans, air-conditioning — while keeping the voice. Preview first: too much reduction can make the voice sound watery.', [
    { id: 'src', label: 'Noise sample', type: 'select', value: have ? 'sample' : 'auto', options: [
      ...(have ? [['sample', `Grabbed sample (${grabbedNoise.secs.toFixed(2)} s)`]] : []),
      ['auto', 'Automatic — learn from the quietest parts'] ] },
    { id: 'amount', label: 'Reduce noise by', value: 18, min: 3, max: 40, step: 1, unit: 'dB (higher = stronger)' },
    { id: 'sens', label: 'Sensitivity', value: 1.5, min: 0.5, max: 4, step: 0.1, unit: '(higher removes more, may touch the voice)' },
  ], reduceNoise);
}
function fxGate() {
  processFx('Noise gate', 'Silences the quiet background noise between words and phrases. Anything quieter than the threshold is muted.', [
    { id: 'thr', label: 'Mute anything quieter than', value: -45, min: -90, max: -5, step: 1, unit: 'dB' },
    { id: 'hold', label: 'Keep open after speech for', value: 80, min: 10, max: 1000, step: 10, unit: 'ms' },
  ], async (ch, sr, v) => gateCh(ch, sr, v.thr, v.hold));
}
/* ---------- Time-stretch (WSOLA) and pitch shift ---------- */
// Waveform-similarity overlap-add: rebuilds the sound from 40 ms grains taken at a new
// rate, nudging each grain (±10 ms) to where it lines up best with the previous one, so
// the duration changes but the pitch doesn't.
async function timeStretch(ch, sr, tempo) {
  const L = ch[0].length;
  const N = Math.max(64, Math.round(sr * 0.04) & ~1), Hs = N / 2, Ha = Hs * tempo, D = Math.round(sr * 0.01);
  const outLen = Math.max(1, Math.round(L / tempo));
  const padLen = L + N + 2 * D + Hs + 8;
  const pad = c => { const o = new Float32Array(padLen); o.set(c); return o; };
  const xs = ch.map(pad);
  const mono = ch.length === 1 ? xs[0] : (() => { const m = new Float32Array(padLen); for (const c of xs) for (let i = 0; i < L; i++) m[i] += c[i] / xs.length; return m; })();
  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  const out = ch.map(() => new Float32Array(outLen + N)), wsum = new Float32Array(outLen + N);
  const corr = (c, t, step) => { let s = 0; for (let i = 0; i < N; i += step) s += mono[c + i] * mono[t + i]; return s; };
  const frames = Math.ceil(outLen / Hs) + 1;
  let prev = 0, lastYield = performance.now();
  for (let k = 0; k < frames; k++) {
    let pos = 0;
    if (k > 0) {
      const ideal = Math.round(k * Ha), tpl = prev + Hs;
      const lo = Math.max(0, ideal - D), hi = Math.min(L + D, ideal + D);
      let best = -Infinity;
      pos = Math.min(hi, Math.max(lo, ideal));
      for (let c = lo; c <= hi; c += 4) { const v = corr(c, tpl, 4); if (v > best) { best = v; pos = c; } }
      best = -Infinity;
      const c0 = pos;
      for (let c = Math.max(lo, c0 - 3); c <= Math.min(hi, c0 + 3); c++) { const v = corr(c, tpl, 2); if (v > best) { best = v; pos = c; } }
    }
    const o = k * Hs;
    if (o >= outLen) break;
    for (let j = 0; j < xs.length; j++) { const x = xs[j], y = out[j]; for (let i = 0; i < N; i++) y[o + i] += x[pos + i] * win[i]; }
    for (let i = 0; i < N; i++) wsum[o + i] += win[i];
    prev = pos;
    if (performance.now() - lastYield > 80) { await new Promise(r => setTimeout(r, 0)); lastYield = performance.now(); }
  }
  return out.map(y => { const r = new Float32Array(outLen); for (let i = 0; i < outLen; i++) r[i] = wsum[i] > 1e-4 ? y[i] / wsum[i] : y[i]; return r; });
}
function fitLength(ch, L) {
  return ch.map(c => { if (c.length === L) return c; const o = new Float32Array(L); o.set(c.subarray(0, L)); return o; });
}
// Stretch the audio longer by the pitch ratio, then play it back faster by the same ratio:
// the length returns to the original while the pitch moves.
async function pitchShift(ch, sr, semitones) {
  if (!semitones) return ch;
  const r = Math.pow(2, semitones / 12);
  const stretched = await timeStretch(ch, sr, 1 / r);
  return fitLength(await resample(stretched, sr * r, sr), ch[0].length);
}
function fxPitch() {
  processFx('Pitch', 'Makes the voice higher or lower without changing the speed. 12 semitones = one octave; small changes (±1–3) sound most natural.', [
    { id: 'semi', label: 'Change pitch by', value: 2, min: -12, max: 12, step: 0.5, unit: 'semitones (− lower, + higher)' },
  ], (ch, sr, v) => pitchShift(ch, sr, v.semi));
}
function fxTempo() {
  processFx('Tempo', 'Makes it faster or slower without changing the pitch of the voice — e.g. 80% to slow a recitation down for learning.', [
    { id: 'pct', label: 'New tempo', value: 80, min: 25, max: 400, step: 5, unit: '% of original' },
  ], (ch, sr, v) => v.pct === 100 ? ch : timeStretch(ch, sr, v.pct / 100), { sameLength: false });
}
function fxSpeed() {
  processFx('Speed', 'Plays faster or slower. Like a tape, the pitch changes too (faster = higher).', [
    { id: 'pct', label: 'New speed', value: 110, min: 25, max: 400, step: 5, unit: '% of original' },
  ], (ch, sr, v) => resample(ch, sr * v.pct / 100, sr), { sameLength: false });
}
async function fxSampleRate() {
  if (!doc || !len()) return;
  stopPlay();
  const v = await askParams('Sample rate', `Currently ${doc.sr} Hz. Lower rates make smaller files; 44 100 Hz is CD quality, 16 000–22 050 Hz is fine for speech.`, [
    { id: 'sr', label: 'New sample rate', type: 'select', value: doc.sr, options: [8000, 11025, 16000, 22050, 24000, 32000, 44100, 48000, 96000].map(r => [r, r + ' Hz']) },
  ]);
  if (!v || +v.sr === doc.sr) return;
  const to = +v.sr, k = to / doc.sr;
  busy(true);
  try {
    const ch = await resample(doc.ch, doc.sr, to);
    const markers = doc.markers.map(m => Math.round(m * k)).filter(m => m > 0 && m < ch[0].length);
    cursor = Math.round(cursor * k); selA = selB = null;
    commit(makeDoc(to, ch, markers), `Sample rate ${to} Hz`);
    zoomFit();
  } finally { busy(false); }
}
function makeStereo() {
  if (!doc || doc.ch.length !== 1) return;
  stopPlay();
  commit(makeDoc(doc.sr, [doc.ch[0], doc.ch[0]], doc.markers.slice()), 'Made stereo');
}
function swapChannels() {
  if (!doc || doc.ch.length !== 2) return;
  stopPlay();
  commit(makeDoc(doc.sr, [doc.ch[1], doc.ch[0]], doc.markers.slice()), 'Swapped channels');
}

/* ---------- Tools ---------- */
function insertAt(ins, label) {
  const at = hasSel() ? selA : cursor;
  const next = hasSel() ? opReplace(selA, selB, ins) : opInsert(at, ins);
  commit(next, label);
  selA = at; selB = at + ins[0].length; cursor = at; refresh();
}
$('insFileIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f || !doc) return;
  stopPlay(); busy(true);
  try {
    const src = await decodeFile(f);
    adoptFormat(src.sr, src.ch.length);
    const ins = src.sr === doc.sr ? src.ch : await resample(src.ch, src.sr, doc.sr);
    insertAt(ins, `Inserted “${src.name}”`);
  } catch (err) { console.error(err); toast(`Could not read “${f.name}”.`); }
  finally { busy(false); }
});
async function generate() {
  if (!doc) return;
  stopPlay();
  const v = await askParams('Generate', 'Inserts a tone, noise or silence at the cursor (replacing the selection, if any).', [
    { id: 'kind', label: 'Sound', type: 'select', value: 'sine', options: [['sine', 'Tone (sine — smooth)'], ['square', 'Tone (square — buzzy)'], ['noise', 'White noise'], ['silence', 'Silence']] },
    { id: 'freq', label: 'Pitch (tones only)', value: 440, min: 20, max: 20000, step: 1, unit: 'Hz' },
    { id: 'dur', label: 'Length', value: 1, min: 0.01, max: 600, step: 0.1, unit: 's' },
    { id: 'vol', label: 'Volume', value: 30, min: 0, max: 100, step: 5, unit: '%' },
  ], { ok: 'Insert' });
  if (!v) return;
  const n = Math.round(v.dur * doc.sr), a = v.vol / 100, c = new Float32Array(n), w = 2 * Math.PI * v.freq / doc.sr;
  const fade = Math.min(n / 2, Math.round(doc.sr * 0.005));
  for (let i = 0; i < n; i++) {
    let x = v.kind === 'sine' ? Math.sin(w * i) : v.kind === 'square' ? (Math.sin(w * i) >= 0 ? 1 : -1) : v.kind === 'noise' ? Math.random() * 2 - 1 : 0;
    const env = Math.min(1, i / fade, (n - 1 - i) / fade); // tiny fades avoid clicks
    c[i] = x * a * (fade ? env : 1);
  }
  insertAt(doc.ch.map(() => c), { sine: 'Generated tone', square: 'Generated tone', noise: 'Generated noise', silence: 'Generated silence' }[v.kind]);
}
async function repeatLoop() {
  if (!hasSel()) return;
  stopPlay();
  const v = await askParams('Repeat loop', 'Repeats the selection straight after itself — handy for memorising a line.', [
    { id: 'times', label: 'Play it this many times in total', value: 3, min: 2, max: 100, step: 1 },
    { id: 'gap', label: 'Pause between repeats', value: 0, min: 0, max: 30, step: 0.25, unit: 's' },
  ], { ok: 'Repeat' });
  if (!v) return;
  const seg = sliceCh(doc.ch, selA, selB), gap = Math.round(v.gap * doc.sr), n = seg[0].length;
  const total = (n + gap) * (v.times - 1);
  const ins = seg.map(c => { const o = new Float32Array(total); for (let r = 0; r < v.times - 1; r++) o.set(c, gap + r * (n + gap)); return o; });
  const a = selA, at = selB;
  commit(opInsert(at, ins), `Repeated ×${v.times}`);
  selA = a; selB = at + total; cursor = a; refresh();
}
async function redact() {
  if (!hasSel()) return;
  stopPlay();
  const v = await askParams('Redact', 'Covers the selected words so they can’t be heard.', [
    { id: 'kind', label: 'Replace with', type: 'select', value: 'beep', options: [['beep', 'Beep'], ['silence', 'Silence']] },
    { id: 'vol', label: 'Beep volume', value: 25, min: 1, max: 100, step: 1, unit: '%' },
  ], { ok: 'Redact' });
  if (!v) return;
  const w = 2 * Math.PI * 1000 / doc.sr, amp = v.vol / 100, a0 = selA;
  effect('Redacted', (c, a, b) => { for (let i = a; i < b; i++) c[i] = v.kind === 'beep' ? amp * Math.sin(w * (i - a0)) : 0; });
}
function splitIntoTabs() {
  if (!doc || !len()) return;
  const parts = doc.markers.length ? segments() : [[0, cursor], [cursor, len()]];
  if (parts.length < 2 || parts.some(([a, b]) => b <= a)) { toast('Place the cursor inside the audio, or add markers, to split.'); return; }
  const base = $('fileName').value.trim() || 'audio', src = doc;
  const names = parts.map((_, i) => doc.markers.length ? partName(i + 1, parts.length) : `${base}-${String(i + 1).padStart(2, '0')}`);
  parts.forEach(([a, b], i) => newDocument(makeDoc(src.sr, sliceCh(src.ch, a, b)), names[i], false));
  toast(`Split into ${parts.length} new tabs`);
}
/* ---------- Join audio ---------- */
let joinItems = []; // { name, sr, ch, on }
function openJoin(pickFiles) {
  stashTab();
  joinItems = tabs.filter(t => t.doc && t.doc.ch[0].length).map(t => ({ name: t.name || 'untitled', sr: t.doc.sr, ch: t.doc.ch, on: true }));
  renderJoin();
  $('joinDlg').showModal();
  if (pickFiles || !joinItems.length) $('joinFileIn').click();
}
function renderJoin() {
  const ul = $('joinList'); ul.innerHTML = '';
  if (!joinItems.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Press “Add files…” to choose the audio to join.'; ul.appendChild(li); }
  joinItems.forEach((it, i) => {
    const li = document.createElement('li');
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = it.on; cb.setAttribute('aria-label', 'Include ' + it.name);
    cb.onchange = () => { it.on = cb.checked; renderJoin(); };
    const nm = document.createElement('span'); nm.className = 'grow'; nm.textContent = (i + 1) + '. ' + it.name; nm.title = it.name;
    const sub = document.createElement('span'); sub.className = 'sub'; sub.textContent = fmt(it.ch[0].length / it.sr).replace(/\.\d+$/, '');
    const mk = (t, title, fn, dis) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = t; b.title = title; b.disabled = !!dis; b.onclick = fn; return b; };
    const move = d => { const j = i + d; [joinItems[i], joinItems[j]] = [joinItems[j], joinItems[i]]; renderJoin(); };
    li.append(cb, nm, sub,
      mk('↑', 'Move up', () => move(-1), i === 0),
      mk('↓', 'Move down', () => move(1), i === joinItems.length - 1),
      mk('✕', 'Remove from the list', () => { joinItems.splice(i, 1); renderJoin(); }));
    ul.appendChild(li);
  });
  const on = joinItems.filter(it => it.on);
  $('joinGo').disabled = on.length < 2;
  $('joinTotal').textContent = on.length ? `${on.length} selected · about ${fmt(on.reduce((t, it) => t + it.ch[0].length / it.sr, 0)).replace(/\.\d+$/, '')}` : '';
}
$('joinFileIn').addEventListener('change', async e => {
  const files = [...e.target.files]; e.target.value = '';
  if (!files.length) return;
  $('joinAdd').disabled = true; $('joinAdd').textContent = 'Reading…';
  for (const f of files) {
    try { const d = await decodeFile(f); joinItems.push({ ...d, on: true }); }
    catch (err) { console.error(err); toast(`Could not read “${f.name}”.`); }
  }
  $('joinAdd').disabled = false; $('joinAdd').textContent = '＋ Add files…';
  renderJoin();
});
async function runJoin() {
  const pick = joinItems.filter(it => it.on);
  if (pick.length < 2) return;
  const gapS = Math.max(0, parseFloat($('joinGap').value) || 0), xfMs = Math.max(0, parseFloat($('joinXf').value) || 0);
  const wantMarks = $('joinMarks').checked;
  $('joinDlg').close();
  busy(true);
  try {
    const sr = pick[0].sr, nch = Math.max(...pick.map(it => it.ch.length));
    const pieces = [];
    for (const it of pick) pieces.push(fitChannels(it.sr === sr ? it.ch : await resample(it.ch, it.sr, sr), nch));
    const gap = Math.round(gapS * sr);
    // Crossfade only when there's no pause, and never longer than half the shortest piece.
    const xf = gap ? 0 : Math.min(Math.round(xfMs / 1000 * sr), ...pieces.map(p => p[0].length >> 1));
    const total = pieces.reduce((t, p) => t + p[0].length, 0) + (gap - xf) * (pieces.length - 1);
    const ch = Array.from({ length: nch }, () => new Float32Array(total)), markers = [];
    let o = 0;
    pieces.forEach((p, i) => {
      const start = i ? o + gap - xf : 0;
      if (i && wantMarks) markers.push(start + (xf >> 1));
      p.forEach((c, k) => {
        const y = ch[k];
        for (let j = 0; j < xf && i; j++) { const t = j / xf; y[start + j] = y[start + j] * (1 - t) + c[j] * t; }
        y.set(i ? c.subarray(xf) : c, i ? start + xf : 0);
      });
      o = start + p[0].length;
    });
    newDocument(makeDoc(sr, ch, markers), 'Joined', false);
    dirty = true; refresh();
    toast(`Joined ${pick.length} files — ${fmt(total / sr)}`);
  } catch (e) { console.error(e); toast('Joining failed.'); }
  finally { busy(false); }
}
on('joinAdd', () => $('joinFileIn').click());
on('joinCancel', () => $('joinDlg').close());
on('joinGo', runJoin);

/* ---------- Batch convert ---------- */
function normaliseCh(ch) {
  let p = 0; for (const c of ch) for (const v of c) p = Math.max(p, Math.abs(v));
  if (!p) return ch;
  const k = Math.pow(10, -1 / 20) / p;
  return ch.map(c => c.map(v => v * k));
}
function trimSilenceCh(ch, sr, thr) {
  const { win, db } = loudness(ch, sr);
  let f = 0, l = db.length - 1;
  while (f < db.length && db[f] < thr) f++;
  while (l >= 0 && db[l] < thr) l--;
  if (f > l) return ch;
  const pad = Math.round(sr * 0.05);
  return sliceCh(ch, Math.max(0, f * win - pad), Math.min(ch[0].length, (l + 1) * win + pad));
}
function fadeCh(ch, sr, inMs, outMs) {
  const ni = Math.min(ch[0].length, Math.round(sr * inMs / 1000)), no = Math.min(ch[0].length, Math.round(sr * outMs / 1000));
  return ch.map(c => {
    const o = c.slice(), L = o.length;
    for (let i = 0; i < ni; i++) o[i] *= (i / ni) ** 2;
    for (let i = 0; i < no; i++) o[L - 1 - i] *= (i / no) ** 2;
    return o;
  });
}
on('batchBtn', () => $('batchFileIn').click());
$('batchFileIn').addEventListener('change', async e => {
  const files = [...e.target.files]; e.target.value = '';
  if (!files.length) return;
  const v = await askParams(`Batch convert ${files.length} file${files.length > 1 ? 's' : ''}`, 'Each file is processed the same way and all are saved together in one zip. Your open tabs are not changed.', [
    { id: 'fmt', label: 'Save as (lossy formats use the ' + $('kbpsSel').value + ' kbps quality set in the Save panel)', type: 'select', value: saveFormat(), options: formatOptions() },
    { id: 'trim', type: 'check', label: 'Trim silent start and end (uses the silence threshold)', value: false },
    { id: 'norm', type: 'check', label: 'Normalise loudness (peak −1 dB)', value: true },
    { id: 'mono', type: 'check', label: 'Convert to mono', value: false },
    { id: 'fin', label: 'Fade in', value: 0, min: 0, max: 10000, step: 50, unit: 'ms' },
    { id: 'fout', label: 'Fade out', value: 0, min: 0, max: 10000, step: 50, unit: 'ms' },
  ], { ok: 'Convert' });
  if (!v) return;
  $('fmtSel').value = v.fmt; syncFormat();
  const thr = parseFloat($('thrIn').value);
  await withBusy('Converting…', async () => {
    const out = [], failed = [];
    for (let i = 0; i < files.length; i++) {
      busyText(`Converting ${i + 1} of ${files.length}…`);
      try {
        const src = await decodeFile(files[i]);
        let ch = src.ch;
        if (v.mono) ch = fitChannels(ch, 1);
        if (v.trim) ch = trimSilenceCh(ch, src.sr, thr);
        if (v.norm) ch = normaliseCh(ch);
        if (v.fin || v.fout) ch = fadeCh(ch, src.sr, v.fin, v.fout);
        out.push({ name: src.name + ext(), data: await encode(ch, src.sr) });
      } catch (err) { console.error(err); failed.push(files[i].name); }
    }
    if (out.length) {
      const url = URL.createObjectURL(makeZip(out));
      const link = document.createElement('a'); link.href = url; link.download = 'converted.zip';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    toast(`Converted ${out.length} file${out.length === 1 ? '' : 's'}` + (failed.length ? ` — couldn’t read: ${failed.join(', ')}` : ''));
  });
});

/* ---------- History ---------- */
function renderHistory() {
  const ul = $('histList'); ul.innerHTML = '';
  const items = [...undoStack.map((d, i) => ({ d, i, cls: '' })), { d: doc, i: undoStack.length, cls: 'cur' },
    ...redoStack.slice().reverse().map((d, j) => ({ d, i: undoStack.length + 1 + j, cls: 'future' }))];
  items.forEach(({ d, i, cls }) => {
    const li = document.createElement('li'); li.className = cls;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'link grow';
    b.textContent = (i + 1) + '. ' + (d.label || 'Edit');
    b.title = cls === 'cur' ? 'Current state' : 'Go back to this point';
    b.onclick = () => jumpHistory(i);
    li.appendChild(b); ul.appendChild(li);
  });
  // Keep the current step visible by scrolling the list itself, never the page.
  const cur = ul.querySelector('.cur');
  if (cur) ul.scrollTop = Math.max(0, cur.offsetTop - ul.clientHeight + cur.offsetHeight);
}
function jumpHistory(idx) {
  if (idx === undoStack.length) return;
  stopPlay();
  const from = doc;
  let d = doc;
  while (undoStack.length > idx) { redoStack.push(d); d = undoStack.pop(); }
  while (undoStack.length < idx && redoStack.length) { undoStack.push(d); d = redoStack.pop(); }
  doc = from; setDoc(d); dirty = true;
}

/* ---------- Recent files (IndexedDB, this browser only) ---------- */
const RECENT_MAX = 8, RECENT_MAX_BYTES = 25e6;
let dbPromise = null;
function idb() {
  return dbPromise || (dbPromise = new Promise((res, rej) => {
    const r = indexedDB.open('diin-audio-editor', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('recent', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}
const idbReq = req => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
async function recentAll() {
  try { const db = await idb(); return (await idbReq(db.transaction('recent').objectStore('recent').getAll())).sort((a, b) => b.date - a.date); }
  catch (e) { return []; }
}
async function recentAdd(file) {
  if (!file || file.size > RECENT_MAX_BYTES) return;
  try {
    const db = await idb(), id = file.name + '|' + file.size;
    await idbReq(db.transaction('recent', 'readwrite').objectStore('recent').put({ id, name: file.name, size: file.size, type: file.type, date: Date.now(), blob: file }));
    const all = await recentAll();
    for (const old of all.slice(RECENT_MAX)) await idbReq(db.transaction('recent', 'readwrite').objectStore('recent').delete(old.id));
  } catch (e) { /* storage unavailable (private mode) — recent list is optional */ }
  renderRecent();
}
async function recentDelete(id) {
  try { const db = await idb(); await idbReq(db.transaction('recent', 'readwrite').objectStore('recent').delete(id)); } catch (e) {}
  renderRecent();
}
async function renderRecent() {
  const all = await recentAll();
  $('emptyRecent').hidden = !all.length;
  for (const id of ['recentList', 'recentList0']) {
    const ul = $(id); ul.innerHTML = '';
    if (!all.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Files you open will appear here.'; ul.appendChild(li); continue; }
    all.forEach(r => {
      const li = document.createElement('li');
      const b = document.createElement('button'); b.type = 'button'; b.className = 'link grow'; b.textContent = r.name; b.title = 'Open ' + r.name;
      b.onclick = () => loadFile(new File([r.blob], r.name, { type: r.type }), { remember: false });
      const sub = document.createElement('span'); sub.className = 'sub';
      sub.textContent = (r.size / 1048576).toFixed(1) + ' MB · ' + new Date(r.date).toLocaleDateString();
      const x = document.createElement('button'); x.type = 'button'; x.className = 'btn'; x.textContent = '✕'; x.title = 'Remove from recent files';
      x.onclick = () => recentDelete(r.id);
      li.append(b, sub, x); ul.appendChild(li);
    });
  }
}
renderRecent();

/* ---------- More edit & effect commands (used by the menus) ---------- */
function amplifyDlg() {
  if (!doc || !len()) return;
  askParams('Amplify', 'Makes the selection (or the whole file) louder or quieter.', [
    { id: 'db', label: 'Change volume by', value: parseFloat($('gainIn').value) || 3, min: -60, max: 40, step: 0.5, unit: 'dB (− quieter, + louder)' },
  ]).then(v => { if (v) { $('gainIn').value = v.db; amplify(); } });
}
function invert() { effect('Inverted', (c, a, b) => { for (let i = a; i < b; i++) c[i] = -c[i]; }); }
function fadeInOut() {
  if (!hasSel()) { toast('Select the part to fade in and out.'); return; }
  effect('Faded in & out', (c, a, b) => {
    const n = b - a, h = Math.floor(n / 2);
    for (let i = 0; i < n; i++) c[a + i] *= i < h ? fadeGain(i / h) : fadeGain((n - i) / (n - h));
  });
}
function muteChannel(k) {
  if (!doc || doc.ch.length < 2) return;
  stopPlay();
  const [a, b] = range();
  const ch = doc.ch.map((c, i) => { if (i !== k) return c; const o = c.slice(); o.fill(0, a, b); return o; });
  commit(makeDoc(doc.sr, ch, doc.markers.slice()), `Muted ${k ? 'right' : 'left'} channel`);
}
async function stereoPan() {
  if (!doc || !len()) return;
  stopPlay();
  const v = await askParams('Stereo pan', 'Moves the sound towards the left or right speaker. A mono file is made stereo first.', [
    { id: 'pan', label: 'Position', value: 0, min: -100, max: 100, step: 5, unit: '−100 = left, 0 = centre, +100 = right' },
  ]);
  if (!v || !v.pan) return;
  const [a, b] = range(), p = v.pan / 100, gl = p > 0 ? 1 - p : 1, gr = p < 0 ? 1 + p : 1;
  const base = doc.ch.length === 1 ? [doc.ch[0], doc.ch[0]] : doc.ch;
  const ch = base.map((c, i) => { if (i > 1) return c; const o = c.slice(), g = i ? gr : gl; for (let j = a; j < b; j++) o[j] *= g; return o; });
  commit(makeDoc(doc.sr, ch, doc.markers.slice()), `Panned ${v.pan > 0 ? 'right' : 'left'} ${Math.abs(v.pan)}%`);
}
function selectPart(which) {
  if (!doc || !len()) return;
  const L = len();
  if (which === 'all') { selA = 0; selB = L; }
  else if (which === 'none') { selA = selB = null; }
  else if (which === 'start') { if (cursor > 0) { selA = 0; selB = cursor; } }
  else if (which === 'end') { if (cursor < L) { selA = cursor; selB = L; } }
  else if (which === 'part') { const seg = segments().find(([a, b]) => cursor >= a && cursor < b) || [0, L]; [selA, selB] = seg; }
  refresh();
}
async function jumpTo() {
  if (!doc || !len()) return;
  const v = await askParams('Jump to location', 'Moves the cursor to a time.', [
    { id: 't', label: 'Time', value: +(cursor / doc.sr).toFixed(3), min: 0, max: len() / doc.sr, step: 0.001, unit: 'seconds' },
  ], { ok: 'Go' });
  if (!v) return;
  stopPlay();
  cursor = clamp(Math.round(v.t * doc.sr), 0, len()); selA = selB = null;
  const w = canvas.clientWidth * spp;
  if (cursor < viewStart || cursor > viewStart + w) { viewStart = cursor - w / 2; clampView(); }
  refresh();
}
function gotoMarker(dir) {
  if (!doc || !doc.markers.length) return;
  const pos = player ? playPos() : cursor;
  const m = dir > 0 ? doc.markers.find(x => x > pos + 1) : [...doc.markers].reverse().find(x => x < pos - 1);
  if (m === undefined) return;
  if (player) stopPlay();
  cursor = m; selA = selB = null;
  const w = canvas.clientWidth * spp;
  if (cursor < viewStart || cursor > viewStart + w) { viewStart = cursor - w / 2; clampView(); }
  refresh();
}
function findPeak() {
  if (!doc || !len()) return;
  const [a, b] = range();
  let best = 0, at = a;
  for (const c of doc.ch) for (let i = a; i < b; i++) { const v = Math.abs(c[i]); if (v > best) { best = v; at = i; } }
  stopPlay(); cursor = at; selA = selB = null;
  const w = canvas.clientWidth * spp; viewStart = at - w / 2; clampView(); refresh();
  toast(`Loudest sample at ${fmt(at / doc.sr)}: ${best ? (20 * Math.log10(best)).toFixed(1) + ' dB' : 'silent'}`);
}
// Clicks and pops: samples that jump far away from their neighbours compared with the local
// average are replaced by a straight line between the good samples either side.
function declickCh(ch, sr, sens) {
  const factor = 4 + (10 - sens) * 3, maxLen = Math.max(3, Math.round(sr * 0.002)), W = 512;
  let fixed = 0;
  const out = ch.map(c => {
    const o = c.slice(), n = o.length;
    if (n < 8) return o;
    const e = new Float32Array(n);
    for (let i = 1; i < n - 1; i++) e[i] = Math.abs(o[i] - (o[i - 1] + o[i + 1]) / 2);
    const pre = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + e[i];
    for (let i = 2; i < n - 2; i++) {
      const a0 = Math.max(0, i - W), b0 = Math.min(n, i + W), mean = (pre[b0] - pre[a0]) / (b0 - a0);
      if (e[i] < 0.02 || e[i] < factor * mean) continue;
      let s0 = i - 1, s1 = i + 1;
      while (s1 < n - 2 && s1 - s0 < maxLen && e[s1] > factor * mean * 0.3) s1++;
      const va = o[s0 - 1] ?? 0, vb = o[s1 + 1] ?? 0;
      for (let j = s0; j <= s1; j++) o[j] = va + (vb - va) * (j - s0 + 1) / (s1 - s0 + 2);
      for (let j = s0; j <= s1 + 1 && j < n - 1; j++) e[j] = 0;
      fixed++; i = s1 + 1;
    }
    return o;
  });
  return { out, fixed };
}
async function removeClicks() {
  if (!doc || !len()) return;
  stopPlay();
  const v = await askParams('Click / pop removal', 'Finds short clicks and pops (vinyl crackle, mouth clicks, digital glitches) and smooths them over.', [
    { id: 'sens', label: 'Sensitivity', value: 5, min: 1, max: 10, step: 1, unit: '1 = only big clicks · 10 = also small ones' },
  ], { ok: 'Remove clicks', preview: async (ch, sr, v) => declickCh(ch, sr, v.sens).out });
  if (!v) return;
  const [a, b] = range(), { out, fixed } = declickCh(sliceCh(doc.ch, a, b), doc.sr, v.sens);
  if (!fixed) { toast('No clicks found — try a higher sensitivity.'); return; }
  const ch = doc.ch.map((c, k) => { const o = c.slice(); o.set(out[k], a); return o; });
  commit(makeDoc(doc.sr, ch, doc.markers.slice()), `Removed ${fixed} click${fixed === 1 ? '' : 's'}`);
}
async function createRingtone() {
  if (!doc || !len()) return;
  stopPlay();
  const v = await askParams('Create ringtone', 'Saves a short clip — from the selection, or from the cursor — with gentle fades, at full loudness.', [
    { id: 'secs', label: 'Length', value: 30, min: 3, max: 60, step: 1, unit: 'seconds' },
    { id: 'fin', label: 'Fade in', value: 300, min: 0, max: 5000, step: 50, unit: 'ms' },
    { id: 'fout', label: 'Fade out', value: 1500, min: 0, max: 10000, step: 50, unit: 'ms' },
  ], { ok: 'Save ringtone' });
  if (!v) return;
  const a = hasSel() ? selA : (cursor < len() - doc.sr ? cursor : 0);
  const b = Math.min(hasSel() ? selB : len(), a + Math.round(v.secs * doc.sr));
  let ch = normaliseCh(sliceCh(doc.ch, a, b));
  ch = fadeCh(ch, doc.sr, v.fin, v.fout);
  withBusy('Encoding…', async () => downloadBlob(await encode(ch, doc.sr), baseName() + '-ringtone' + ext(), mime()));
}

/* ---------- Voice tools ---------- */
// Run fn(channels, sr) -> channels (same length) over the selection or whole file, as one undo step.
async function runOnRange(label, fn) {
  if (!doc || !len()) return;
  stopPlay();
  const [a, b] = range();
  busy(true);
  try {
    const out = fitChannels(await fn(sliceCh(doc.ch, a, b), doc.sr), doc.ch.length);
    const ch = doc.ch.map((c, k) => { const o = c.slice(); o.set(out[k].subarray(0, b - a), a); return o; });
    commit(makeDoc(doc.sr, ch, doc.markers.slice()), label);
  } catch (e) { console.error(e); toast(label + ' failed.'); }
  finally { busy(false); }
}
const midOf = ch => ch.length === 1 ? ch[0] : ch[0].map((v, i) => (v + ch[1][i]) / 2);
function reduceVoice() {
  if (!doc || doc.ch.length < 2) { toast('Reduce voice needs a stereo recording (music with the voice in the centre).'); return; }
  runOnRange('Reduced voice', async (ch, sr) => {
    // Voice is usually mixed dead-centre: left − right cancels it. Keep the bass (also centred) from the mid.
    const side = ch[0].map((v, i) => (v - ch[1][i]) / 2);
    const [bass] = await renderOffline([midOf(ch)], sr, (ctx, src) => chain(src, biquad(ctx, 'lowpass', 150), biquad(ctx, 'lowpass', 150)));
    const out = side.map((v, i) => v + bass[i]);
    return [out, out.slice()];
  });
}
function isolateVoice() {
  runOnRange('Isolated voice', async (ch, sr) => {
    const [v] = await renderOffline([midOf(ch)], sr, (ctx, src) => chain(src,
      biquad(ctx, 'highpass', 120), biquad(ctx, 'highpass', 120), biquad(ctx, 'lowpass', 7000), biquad(ctx, 'lowpass', 7000),
      biquad(ctx, 'peaking', 3000, 3, 0.8)));
    return [v];
  });
}
function amplifyVocals() {
  runOnRange('Amplified vocals', async (ch, sr) => {
    let src = ch;
    if (ch.length >= 2) { // turn the centre up relative to the sides
      const m = midOf(ch), sL = ch[0].map((v, i) => (v - ch[1][i]) / 2);
      src = [m.map((v, i) => v * 1.2 + sL[i] * 0.7), m.map((v, i) => v * 1.2 - sL[i] * 0.7)];
    }
    return renderOffline(src, sr, (ctx, s) => chain(s, biquad(ctx, 'peaking', 250, -2, 0.8), biquad(ctx, 'peaking', 1500, 4, 0.7), biquad(ctx, 'peaking', 3000, 5, 0.8)));
  });
}
function voiceCleanup() {
  runOnRange('Voice cleanup', async (ch, sr) => {
    let x = await renderOffline(ch, sr, (ctx, s) => chain(s, biquad(ctx, 'highpass', 90), biquad(ctx, 'highpass', 90)));
    x = await reduceNoise(x, sr, { src: 'auto', amount: 15, sens: 1.5 });
    x = await renderOffline(x, sr, (ctx, s) => {
      const c = ctx.createDynamicsCompressor(); c.threshold.value = -26; c.ratio.value = 3; c.knee.value = 8; c.attack.value = 0.005; c.release.value = 0.2;
      return chain(s, c);
    });
    return normaliseCh(x);
  });
}
function audioEnhancer() {
  runOnRange('Audio enhancer', async (ch, sr) => {
    const x = await renderOffline(ch, sr, (ctx, s) => {
      const c = ctx.createDynamicsCompressor(); c.threshold.value = -22; c.ratio.value = 2.5; c.knee.value = 10;
      return chain(s, ...eqFilters(ctx, EQ_PRESETS['Voice clarity']), c);
    });
    return normaliseCh(x);
  });
}

/* ---------- Frequency analysis ---------- */
const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const noteOf = f => { const n = Math.round(12 * Math.log2(f / 440) + 69); return NOTE_NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1); };
let fftData = null;
function openFFT() {
  if (!doc || !len()) return;
  const [a, b] = range();
  if (b - a < NR_N) { toast('Select at least 0.05 s to analyse.'); return; }
  const sp = eqMeasureSpectrum(a, b), binHz = doc.sr / NR_N;
  let pk = 2; for (let k = 2; k < sp.length - 1; k++) if (k * binHz >= 20 && sp[k] > sp[pk]) pk = k;
  const y0 = sp[pk - 1], y1 = sp[pk], y2 = sp[pk + 1], d = (y0 - y2) / (2 * (y0 - 2 * y1 + y2) || 1);
  const peakF = (pk + (isFinite(d) ? clamp(d, -0.5, 0.5) : 0)) * binHz;
  fftData = { sp, binHz, max: Math.max(...sp.slice(1)), peakF };
  $('fftScope').textContent = hasSel() ? `(selection, ${fmt((b - a) / doc.sr)})` : '(whole file)';
  $('fftInfo').textContent = `Loudest frequency: ${Math.round(peakF)} Hz (${noteOf(peakF)}). Hover the graph to read any frequency.`;
  $('fftDlg').showModal();
  drawFFT();
}
function drawFFT(hx) {
  const cv = $('fftGraph'), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g2 = cv.getContext('2d'); g2.setTransform(dpr, 0, 0, dpr, 0, 0);
  g2.fillStyle = css('--wave-bg'); g2.fillRect(0, 0, W, H);
  const fMax = Math.min(20000, doc.sr / 2), xOf = f => Math.log(f / 20) / Math.log(fMax / 20) * W, yOf = db => 8 + (-(db - fftData.max)) / 90 * (H - 26);
  g2.font = '10px ' + css('--ui'); g2.textBaseline = 'top';
  for (const f of [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]) if (f <= fMax) {
    const x = xOf(f); g2.fillStyle = 'rgba(169,124,37,.2)'; g2.fillRect(Math.round(x), 0, 1, H); g2.fillStyle = css('--muted'); g2.fillText(eqFmtF(f), x + 2, H - 12);
  }
  for (let db = 0; db >= -90; db -= 15) { const y = yOf(fftData.max + db); g2.fillStyle = 'rgba(169,124,37,.2)'; g2.fillRect(0, Math.round(y), W, 1); g2.fillStyle = css('--muted'); g2.fillText(db + ' dB', 3, y + 1); }
  const at = x => { const f = 20 * Math.pow(fMax / 20, x / W), k = Math.min(fftData.sp.length - 1, Math.max(1, Math.round(f / fftData.binHz))); return [f, fftData.sp[k]]; };
  g2.beginPath(); g2.moveTo(0, H);
  for (let x = 0; x <= W; x++) g2.lineTo(x, Math.min(H, yOf(at(x)[1])));
  g2.lineTo(W, H); g2.closePath(); g2.fillStyle = 'rgba(46,107,88,.25)'; g2.fill();
  g2.beginPath(); for (let x = 0; x <= W; x++) { const y = Math.min(H, yOf(at(x)[1])); x ? g2.lineTo(x, y) : g2.moveTo(x, y); }
  g2.strokeStyle = css('--green'); g2.lineWidth = 1.5; g2.stroke();
  const px = xOf(fftData.peakF); g2.fillStyle = ENV_COL; g2.fillRect(px - 1, 0, 2, H);
  if (hx !== undefined) {
    const [f, db] = at(hx); g2.fillStyle = css('--ink-navy'); g2.fillRect(hx, 0, 1, H);
    const label = `${f < 1000 ? Math.round(f) + ' Hz' : (f / 1000).toFixed(2) + ' kHz'} · ${(db - fftData.max).toFixed(1)} dB · ${noteOf(f)}`;
    g2.font = '600 12px ' + css('--ui'); const tw = g2.measureText(label).width + 12, lx = clamp(hx + 8, 2, W - tw - 2);
    g2.fillRect(lx, 8, tw, 20); g2.fillStyle = '#fff'; g2.textBaseline = 'middle'; g2.fillText(label, lx + 6, 18);
  }
}
$('fftGraph').addEventListener('pointermove', e => { if (fftData) drawFFT(e.clientX - $('fftGraph').getBoundingClientRect().left); });
$('fftGraph').addEventListener('pointerleave', () => { if (fftData) drawFFT(); });
on('fftClose', () => $('fftDlg').close());

/* ---------- Key detection (and key changer) ---------- */
// Chromagram: how much of each of the 12 notes is in the audio (all octaves folded together),
// matched against the Krumhansl–Schmuckler major / minor key profiles in all 12 transpositions.
const KEY_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KEY_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const PC_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const keyName = k => PC_NAMES[k.tonic] + (k.minor ? ' minor' : ' major');
function chroma(ch, sr, a, b) {
  const N = 8192, n = b - a, frames = Math.min(300, Math.max(1, Math.floor(n / (N / 2)) - 1));
  const win = new Float64Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  const bins = []; // precomputed bin → pitch class for 60 Hz – 5 kHz
  for (let k = 1; k < N / 2; k++) { const f = k * sr / N; if (f < 60 || f > 5000) continue; bins.push([k, ((Math.round(12 * Math.log2(f / 440) + 69) % 12) + 12) % 12]); }
  const total = new Float64Array(12), re = new Float64Array(N), im = new Float64Array(N);
  for (let f = 0; f < frames; f++) {
    const st = a + Math.floor(Math.max(0, n - N) * (frames > 1 ? f / (frames - 1) : 0));
    let energy = 0;
    for (let i = 0; i < N; i++) { let v = 0; for (const c of ch) v += c[st + i] || 0; re[i] = v * win[i]; im[i] = 0; energy += v * v; }
    if (energy < 1e-6) continue; // skip silence
    fft(re, im, false);
    const c12 = new Float64Array(12);
    for (const [k, pc] of bins) c12[pc] += Math.sqrt(Math.hypot(re[k], im[k]));
    const mx = Math.max(...c12) || 1;
    for (let i = 0; i < 12; i++) total[i] += c12[i] / mx; // every frame counts equally
  }
  return total;
}
function corr(x, y) {
  const mx = x.reduce((s, v) => s + v, 0) / 12, my = y.reduce((s, v) => s + v, 0) / 12;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < 12; i++) { num += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
  return num / (Math.sqrt(dx * dy) || 1);
}
function detectKey(c12) {
  const all = [];
  for (let t = 0; t < 12; t++) for (const minor of [false, true]) {
    const prof = (minor ? KEY_MINOR : KEY_MAJOR).map((_, i, p) => p[(i - t + 12) % 12]);
    all.push({ tonic: t, minor, r: corr(c12, prof) });
  }
  return all.sort((x, y) => y.r - x.r);
}
let keyState = null;
function openKey(focusChanger) {
  if (!doc || !len()) return;
  const [a, b] = range();
  if (b - a < doc.sr * 2) { toast('Select at least 2 seconds of music to detect the key.'); return; }
  busy(true);
  setTimeout(() => {
    try {
      const c12 = chroma(doc.ch, doc.sr, a, b), ranked = detectKey(c12), best = ranked[0];
      keyState = { c12, best, ranked };
      $('keyScope').textContent = hasSel() ? `(selection, ${fmt((b - a) / doc.sr)})` : '(whole file)';
      $('keyResult').textContent = keyName(best);
      const rel = best.minor ? { tonic: (best.tonic + 3) % 12, minor: false } : { tonic: (best.tonic + 9) % 12, minor: true };
      $('keyInfo').textContent = `Confidence ${Math.round(clamp(best.r, 0, 1) * 100)}% · relative ${best.minor ? 'major' : 'minor'}: ${keyName(rel)} · next closest: ${keyName(ranked[1])}, ${keyName(ranked[2])}`;
      const sel = $('keyTarget'); sel.innerHTML = '';
      for (let t = 0; t < 12; t++) sel.add(new Option(keyName({ tonic: t, minor: best.minor }), t));
      sel.value = String(best.tonic); syncKeyShift();
      $('keyDlg').showModal(); drawKey();
      if (focusChanger) sel.focus();
    } finally { busy(false); }
  }, 30);
}
// Shortest way to the target key: −6…+5 semitones.
const keySemis = () => { const d = ((+$('keyTarget').value - keyState.best.tonic) % 12 + 12) % 12; return d > 6 ? d - 12 : d; };
function syncKeyShift() {
  const d = keySemis();
  $('keyShift').textContent = d ? `(${d > 0 ? '+' : ''}${d} semitone${Math.abs(d) === 1 ? '' : 's'}, same speed)` : '(no change)';
  $('keyChange').disabled = !d;
}
function drawKey() {
  const cv = $('keyGraph'), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g2 = cv.getContext('2d'); g2.setTransform(dpr, 0, 0, dpr, 0, 0);
  g2.fillStyle = css('--wave-bg'); g2.fillRect(0, 0, W, H);
  const c = keyState.c12, mx = Math.max(...c) || 1, bw = W / 12, best = keyState.best;
  const scale = (best.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]).map(i => (i + best.tonic) % 12);
  g2.font = '600 12px ' + css('--ui'); g2.textAlign = 'center';
  for (let i = 0; i < 12; i++) {
    const h = (H - 34) * c[i] / mx, x = i * bw;
    g2.fillStyle = i === best.tonic ? ENV_COL : scale.includes(i) ? css('--green') : 'rgba(46,107,88,.3)';
    g2.fillRect(x + 6, H - 20 - h, bw - 12, h);
    g2.fillStyle = css('--ink-navy'); g2.fillText(PC_NAMES[i], x + bw / 2, H - 6);
  }
  g2.textAlign = 'left'; g2.font = '11px ' + css('--ui');
  const cap = 'orange = key note · green = notes of the scale';
  g2.fillStyle = css('--chip'); g2.fillRect(2, 1, g2.measureText(cap).width + 8, 15);
  g2.fillStyle = css('--muted'); g2.fillText(cap, 6, 12);
}
$('keyTarget').addEventListener('change', syncKeyShift);
on('keyChange', () => {
  const d = keySemis(); if (!d) return;
  const target = keyName({ tonic: +$('keyTarget').value, minor: keyState.best.minor });
  $('keyDlg').close();
  runOnRange(`Key change to ${target}`, (ch, sr) => pitchShift(ch, sr, d));
});
on('keyClose', () => $('keyDlg').close());
