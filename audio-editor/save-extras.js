// Audio editor — extra save formats, background encoding, audio tags and sharing.
// Loaded after editor.js (uses its FORMATS, encode helpers, dialogs and menus).
'use strict';

const EDITOR_VERSION = (document.currentScript && new URL(document.currentScript.src).searchParams.get('v')) || '';

/* ---------- Background encoder (MP3 / FLAC in a Web Worker) ---------- */
let encWorker = null, encSeq = 0;
const encJobs = new Map();
function encoderWorker() {
  if (encWorker) return encWorker;
  encWorker = new Worker('encoder-worker.js' + (EDITOR_VERSION ? '?v=' + EDITOR_VERSION : ''));
  encWorker.onmessage = e => {
    const j = encJobs.get(e.data.id); if (!j) return;
    if (e.data.progress !== undefined) { if (j.onProgress) j.onProgress(e.data.progress); return; }
    encJobs.delete(e.data.id);
    if (e.data.error) j.reject(new Error(e.data.error)); else j.resolve(new Uint8Array(e.data.out));
  };
  encWorker.onerror = err => { for (const j of encJobs.values()) j.reject(err); encJobs.clear(); encWorker = null; };
  return encWorker;
}
function runEncoder(kind, ch, sr, opts, onProgress) {
  return new Promise((resolve, reject) => {
    const id = ++encSeq, copy = ch.map(c => c.slice());
    encJobs.set(id, { resolve, reject, onProgress });
    encoderWorker().postMessage({ id, kind, ch: copy, sr, ...opts }, copy.map(c => c.buffer));
  });
}
const kbpsNow = () => parseInt($('kbpsSel').value, 10) || 192;

/* ---------- Tags (title, artist, … cover) for the current tab ---------- */
const tabTags = () => (active && active.tags) || {};

// ID3v2.3 tag for MP3.
function id3Tag(tags) {
  const frames = [], te = s => { const b = new Uint8Array(2 + s.length * 2); b[0] = 0xff; b[1] = 0xfe; for (let i = 0; i < s.length; i++) { b[2 + i * 2] = s.charCodeAt(i) & 0xff; b[3 + i * 2] = s.charCodeAt(i) >> 8; } return b; };
  const frame = (fid, body) => { const h = new Uint8Array(10); for (let i = 0; i < 4; i++) h[i] = fid.charCodeAt(i); new DataView(h.buffer).setUint32(4, body.length); frames.push(h, body); };
  const text = (fid, s) => { if (!s) return; const t = te(String(s)); const b = new Uint8Array(1 + t.length); b[0] = 1; b.set(t, 1); frame(fid, b); };
  text('TIT2', tags.title); text('TPE1', tags.artist); text('TALB', tags.album); text('TYER', tags.year); text('TCON', tags.genre);
  if (tags.comment) { const d = te(''), t = te(tags.comment), b = new Uint8Array(4 + d.length + 2 + t.length); b[0] = 1; b.set([101, 110, 103], 1); b.set(d, 4); b.set(t, 6 + d.length); frame('COMM', b); }
  if (tags.cover) {
    const m = new TextEncoder().encode(tags.cover.mime || 'image/jpeg'), b = new Uint8Array(1 + m.length + 1 + 1 + 1 + tags.cover.data.length);
    let o = 0; b[o++] = 0; b.set(m, o); o += m.length; b[o++] = 0; b[o++] = 3; b[o++] = 0; b.set(tags.cover.data, o); frame('APIC', b);
  }
  if (!frames.length) return new Uint8Array(0);
  const size = frames.reduce((t, f) => t + f.length, 0), out = new Uint8Array(10 + size);
  out.set([73, 68, 51, 3, 0, 0], 0);
  out[6] = (size >> 21) & 0x7f; out[7] = (size >> 14) & 0x7f; out[8] = (size >> 7) & 0x7f; out[9] = size & 0x7f;
  let o = 10; for (const f of frames) { out.set(f, o); o += f.length; }
  return out;
}
const joinBytes = (...parts) => { const out = new Uint8Array(parts.reduce((t, p) => t + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };

/* ---------- MP3 and FLAC through the worker ---------- */
async function prepMp3(ch, sr) { // MP3 only allows some rates and at most 2 channels
  if (ch.length > 2) ch = fitChannels(ch, 1);
  if (!MP3_RATES.includes(sr)) { const to = sr > 48000 ? 48000 : 44100; ch = await resample(ch, sr, to); sr = to; }
  return [ch, sr];
}
FORMATS.mp3.encode = async (ch, sr, onProgress) => {
  let bytes;
  try { const [c2, s2] = await prepMp3(ch, sr); bytes = await runEncoder('mp3', c2, s2, { kbps: kbpsNow() }, onProgress); }
  catch (e) { console.warn('Worker MP3 failed, encoding on the page', e); bytes = await encodeMp3(ch, sr, onProgress); }
  return joinBytes(id3Tag(tabTags()), bytes);
};
FORMATS.flac = {
  label: 'FLAC (lossless, about half the size of WAV)', ext: '.flac', mime: 'audio/flac',
  encode: (ch, sr, onProgress) => runEncoder('flac', ch.length > 8 ? fitChannels(ch, 2) : ch, sr, { tags: tabTags() }, onProgress),
};

/* ---------- OGG/Opus through WebCodecs (small files; WhatsApp voice notes use it) ---------- */
const OGG_CRC = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let r = i << 24; for (let k = 0; k < 8; k++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1; t[i] = r >>> 0; } return t; })();
function oggPage(serial, seq, granule, flags, packets) {
  const lacing = [];
  for (const p of packets) { let n = p.length; while (n >= 255) { lacing.push(255); n -= 255; } lacing.push(n); }
  const body = packets.reduce((t, p) => t + p.length, 0), out = new Uint8Array(27 + lacing.length + body), dv = new DataView(out.buffer);
  out.set([79, 103, 103, 83], 0); out[4] = 0; out[5] = flags;
  dv.setUint32(6, granule % 2 ** 32, true); dv.setUint32(10, Math.floor(granule / 2 ** 32), true);
  dv.setUint32(14, serial, true); dv.setUint32(18, seq, true); out[26] = lacing.length; out.set(lacing, 27);
  let o = 27 + lacing.length; for (const p of packets) { out.set(p, o); o += p.length; }
  let crc = 0; for (let i = 0; i < out.length; i++) crc = ((crc << 8) ^ OGG_CRC[((crc >>> 24) ^ out[i]) & 0xff]) >>> 0;
  dv.setUint32(22, crc, true);
  return out;
}
async function webcodecsEncode(codec, ch, sr, kbps, onProgress) {
  const nch = Math.min(2, ch.length), packets = []; let failed = null, desc = null;
  const enc = new AudioEncoder({
    output: (chunk, meta) => { const d = new Uint8Array(chunk.byteLength); chunk.copyTo(d); packets.push({ d, ts: chunk.timestamp, dur: chunk.duration }); if (meta && meta.decoderConfig && meta.decoderConfig.description) desc = meta.decoderConfig.description; },
    error: e => { failed = e; },
  });
  enc.configure({ codec, sampleRate: sr, numberOfChannels: nch, bitrate: kbps * 1000 });
  const n = ch[0].length, STEP = sr; // one second per AudioData
  for (let a = 0; a < n; a += STEP) {
    const b = Math.min(n, a + STEP), m = b - a, data = new Float32Array(m * nch);
    for (let k = 0; k < nch; k++) data.set(ch[k].subarray(a, b), k * m);
    const ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: m, numberOfChannels: nch, timestamp: Math.round(a / sr * 1e6), data });
    enc.encode(ad); ad.close();
    if (enc.encodeQueueSize > 10) await new Promise(r => setTimeout(r, 0));
    if (onProgress) onProgress(b / n);
    if (failed) break;
  }
  await enc.flush(); enc.close();
  if (failed) throw failed;
  return { packets, desc, nch };
}
async function encodeOpus(ch, sr, onProgress) {
  if (ch.length > 2) ch = fitChannels(ch, 2);
  if (sr !== 48000) { ch = await resample(ch, sr, 48000); } // Opus works at 48 kHz
  // Opus sounds as good as MP3 at about half the bitrate, so it uses half the chosen quality.
  const { packets, nch } = await webcodecsEncode('opus', ch, 48000, Math.max(24, Math.min(160, Math.round(kbpsNow() / 2))), onProgress);
  const serial = (Math.random() * 2 ** 31) >>> 0, preSkip = 312, pages = [];
  const head = new Uint8Array(19), hv = new DataView(head.buffer);
  head.set(new TextEncoder().encode('OpusHead')); head[8] = 1; head[9] = nch; hv.setUint16(10, preSkip, true); hv.setUint32(12, sr, true);
  pages.push(oggPage(serial, 0, 0, 2, [head]));
  const tags = tabTags(), te = new TextEncoder(), vendor = te.encode('Diin Islaam audio editor');
  const items = [['TITLE', tags.title], ['ARTIST', tags.artist], ['ALBUM', tags.album], ['DATE', tags.year], ['GENRE', tags.genre], ['COMMENT', tags.comment]].filter(x => x[1]).map(([k, v]) => te.encode(k + '=' + v));
  const tl = 8 + 4 + vendor.length + 4 + items.reduce((t, i) => t + 4 + i.length, 0), tb = new Uint8Array(tl), tv = new DataView(tb.buffer);
  tb.set(te.encode('OpusTags')); let o = 8; tv.setUint32(o, vendor.length, true); o += 4; tb.set(vendor, o); o += vendor.length;
  tv.setUint32(o, items.length, true); o += 4; for (const i of items) { tv.setUint32(o, i.length, true); o += 4; tb.set(i, o); o += i.length; }
  pages.push(oggPage(serial, 1, 0, 0, [tb]));
  const total = ch[0].length; let granule = preSkip, seq = 2;
  for (let i = 0; i < packets.length; i += 50) {
    const group = packets.slice(i, i + 50);
    for (const p of group) granule += Math.round(p.dur * 48000 / 1e6);
    const lastPage = i + 50 >= packets.length;
    pages.push(oggPage(serial, seq++, lastPage ? total + preSkip : granule, lastPage ? 4 : 0, group.map(p => p.d)));
  }
  return joinBytes(...pages);
}
// M4A (AAC) where the browser has an AAC encoder (Chrome/Edge on Windows & Mac, Safari).
let mp4MuxerPromise = null;
const loadMp4Muxer = () => mp4MuxerPromise || (mp4MuxerPromise = new Promise((res, rej) => {
  const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.js';
  sc.onload = () => res(window.Mp4Muxer); sc.onerror = () => { mp4MuxerPromise = null; rej(new Error('Could not load the M4A packager')); };
  document.head.appendChild(sc);
}));
async function encodeM4a(ch, sr, onProgress, codec = 'mp4a.40.2') {
  if (ch.length > 2) ch = fitChannels(ch, 2);
  if (![44100, 48000].includes(sr)) { ch = await resample(ch, sr, 48000); sr = 48000; }
  const M = await loadMp4Muxer();
  const { packets, desc, nch } = await webcodecsEncode(codec, ch, sr, kbpsNow(), onProgress);
  const target = new M.ArrayBufferTarget();
  const muxer = new M.Muxer({ target, audio: { codec: codec.startsWith('mp4a') ? 'aac' : 'opus', numberOfChannels: nch, sampleRate: sr }, fastStart: 'in-memory' });
  for (const p of packets) muxer.addAudioChunkRaw(p.d, 'key', p.ts, p.dur, desc ? { decoderConfig: { codec, sampleRate: sr, numberOfChannels: nch, description: desc } } : undefined);
  muxer.finalize();
  return new Uint8Array(target.buffer);
}
function addFormat(key, info) {
  FORMATS[key] = info;
  if (![...$('fmtSel').options].some(o => o.value === key)) $('fmtSel').add(new Option(info.label, key));
}
addFormat('flac', FORMATS.flac);
(async () => {
  if (typeof AudioEncoder === 'undefined') return;
  try {
    if ((await AudioEncoder.isConfigSupported({ codec: 'opus', sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 })).supported)
      addFormat('ogg', { label: 'OGG/Opus (very small, great for WhatsApp)', ext: '.ogg', mime: 'audio/ogg', lossy: true, encode: encodeOpus });
    if ((await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 })).supported)
      addFormat('m4a', { label: 'M4A (AAC — iPhone friendly)', ext: '.m4a', mime: 'audio/mp4', lossy: true, encode: (ch, sr, p) => encodeM4a(ch, sr, p) });
  } catch (e) { console.warn(e); }
  try { const saved = localStorage.getItem('ae-format'); if (saved && FORMATS[saved]) { $('fmtSel').value = saved; syncFormat(); } } catch (e) {}
})();
$('fmtSel').addEventListener('change', () => { try { localStorage.setItem('ae-format', $('fmtSel').value); } catch (e) {} });
$('kbpsWrap').firstChild.textContent = 'Quality ';

/* ---------- Tags dialog ---------- */
const tagDlg = document.createElement('dialog');
tagDlg.className = 'dlg'; tagDlg.id = 'tagDlg';
tagDlg.innerHTML = `<h2>Audio tags</h2>
  <p class="info" style="margin:0 0 12px">Shown by music players and phones. Saved into MP3, FLAC and OGG files of this tab (and in projects).</p>
  ${[['title', 'Title'], ['artist', 'Artist / reciter'], ['album', 'Album / series'], ['year', 'Year'], ['genre', 'Genre'], ['comment', 'Comment']].map(([k, l]) =>
    `<div class="field"><label for="tag_${k}">${l}</label><input id="tag_${k}" type="text" class="num" style="width:100%" dir="auto"></div>`).join('')}
  <div class="field"><label>Cover picture</label><div class="field-row">
    <img id="tagCoverImg" alt="" style="width:56px; height:56px; object-fit:cover; border-radius:6px; border:1px solid var(--gold-soft); display:none">
    <button class="btn" id="tagCoverBtn" type="button">Choose picture…</button>
    <button class="btn" id="tagCoverDel" type="button">Remove</button></div></div>
  <input type="file" id="tagCoverIn" accept="image/jpeg,image/png" hidden>
  <div class="actions"><button class="btn" id="tagCancel" type="button">Cancel</button><button class="btn primary" id="tagOk" type="button">Save tags</button></div>`;
document.body.appendChild(tagDlg);
let tagCover = null;
function showCover() { const img = $('tagCoverImg'); if (tagCover) { img.src = URL.createObjectURL(new Blob([tagCover.data], { type: tagCover.mime })); img.style.display = ''; } else img.style.display = 'none'; $('tagCoverDel').disabled = !tagCover; }
function openTags() {
  if (!active) return;
  const t = tabTags();
  for (const k of ['title', 'artist', 'album', 'year', 'genre', 'comment']) $('tag_' + k).value = t[k] || (k === 'title' ? $('fileName').value : '');
  tagCover = t.cover || null; showCover();
  tagDlg.showModal();
}
on('tagCoverBtn', () => $('tagCoverIn').click());
$('tagCoverIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  tagCover = { mime: f.type || 'image/jpeg', data: new Uint8Array(await f.arrayBuffer()) }; showCover();
});
on('tagCoverDel', () => { tagCover = null; showCover(); });
on('tagCancel', () => tagDlg.close());
on('tagOk', () => {
  const t = {}; for (const k of ['title', 'artist', 'album', 'year', 'genre', 'comment']) { const v = $('tag_' + k).value.trim(); if (v) t[k] = v; }
  if (tagCover) t.cover = tagCover;
  active.tags = t; dirty = true; tagDlg.close(); refresh(); toast('Tags saved for this tab');
});

/* ---------- Share (phones: WhatsApp, Telegram, email…) ---------- */
const canShareFiles = () => !!(navigator.share && navigator.canShare && navigator.canShare({ files: [new File([new Uint8Array(1)], 'x.mp3', { type: 'audio/mpeg' })] }));
async function shareAudio(selectionOnly) {
  if (!doc || !len()) return;
  const [a, b] = selectionOnly && hasSel() ? [selA, selB] : [0, len()];
  let file;
  await withBusy('Preparing to share…', async () => {
    const bytes = await encode(sliceCh(doc.ch, a, b), doc.sr, p => busyText(`Encoding… ${Math.round(p * 100)}%`));
    file = new File([bytes], baseName() + (selectionOnly && hasSel() ? '-selection' : '') + ext(), { type: mime() });
  });
  if (!file) return;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: file.name }); return; }
    catch (e) { if (e.name === 'AbortError') return; console.warn(e); }
  }
  downloadBlob(new Uint8Array(await file.arrayBuffer()), file.name, file.type);
  toast('Sharing isn’t available in this browser, so the file was downloaded instead.');
}
const shareBtn = document.createElement('button');
shareBtn.className = 'btn'; shareBtn.id = 'shareBtn'; shareBtn.type = 'button';
shareBtn.textContent = canShareFiles() ? '⇪ Share…' : '⇪ Share / download';
shareBtn.title = 'Send the file to WhatsApp, Telegram, email… (on phones)';
$('exportSelBtn').after(shareBtn);
shareBtn.addEventListener('click', () => shareAudio(false));
const tagsBtn = document.createElement('button');
tagsBtn.className = 'btn'; tagsBtn.id = 'tagsBtn'; tagsBtn.type = 'button'; tagsBtn.textContent = 'Tags…';
tagsBtn.title = 'Title, artist, cover picture… saved into the file';
shareBtn.after(tagsBtn);
tagsBtn.addEventListener('click', openTags);

// Menu entries.
(() => {
  const file = MENUS.find(m => m.label === 'File').items, i = file.findIndex(it => it.label === 'Save All Files (.zip)');
  file.splice(i + 1, 0,
    { label: 'Share…', run: () => shareAudio(false), en: has.audio },
    { label: 'Share Selection…', run: () => shareAudio(true), en: has.sel },
    { label: 'Audio Tags…', run: openTags, en: has.doc });
})();
