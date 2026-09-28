// Audio editor — main script (Diin Islaam). Runs entirely in the browser; nothing is uploaded.
// Loaded as a classic script: its top-level names are shared with the feature files loaded after it.
'use strict';

/* ---------- State ---------- */
// A document is immutable: { sr, ch:[Float32Array...], markers:[sample...] }.
// Edits build a new document, so undo snapshots can share unchanged channel arrays.
let doc = null;
let undoStack = [], redoStack = [];
let clip = null;                 // { sr, ch }
let selA = null, selB = null;    // selection in samples, selA < selB
let cursor = 0;
let viewStart = 0, spp = 1;      // first visible sample, samples per CSS pixel
let loop = false;
let dirty = false;
let peaks = null;                // per channel { min, max } at PEAK_BIN resolution
let playBuf = null;              // cached AudioBuffer of the current doc
const PEAK_BIN = 256;
const UNDO_BYTES = 400 * 1024 * 1024;

let actx = null;
const audio = () => actx || (actx = new (window.AudioContext || window.webkitAudioContext)());

const $ = id => document.getElementById(id);
const on = (id, fn) => $(id).addEventListener('click', fn);
const canvas = $('wave'), g = canvas.getContext('2d');
let waveOverlay = null; // optional (g, W, H, rulerHeight) => true when it drew the audio instead of the waveform
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
// Touch screens get bigger grab areas for handles, edges and markers.
const TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches), HIT = TOUCH ? 14 : 6;

/* ---------- Helpers ---------- */
const len = () => doc ? doc.ch[0].length : 0;
const hasSel = () => selA !== null && selB - selA > 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function fmt(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60), s = sec - m * 60;
  return m + ':' + s.toFixed(3).padStart(6, '0');
}
function parseTime(str) {
  str = String(str).trim();
  if (!str) return NaN;
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return NaN;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}
let toastT;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}
function busy(on) { $('busy').classList.toggle('show', on); }

/* ---------- Document operations ---------- */
function makeDoc(sr, ch, markers) { return { sr, ch, markers: markers || [] }; }

function shiftMarkersDelete(markers, a, b) {
  const d = b - a;
  return markers.filter(m => m <= a || m >= b).map(m => m >= b ? m - d : m).filter(m => m > 0);
}
function shiftMarkersInsert(markers, p, n) {
  return markers.map(m => m >= p ? m + n : m);
}
function sliceCh(ch, a, b) { return ch.map(c => c.slice(a, b)); }

// Match a clip's channel count to the document's.
function fitChannels(src, count) {
  if (src.length === count) return src;
  if (count === 1) {
    const out = new Float32Array(src[0].length);
    src.forEach(c => { for (let i = 0; i < c.length; i++) out[i] += c[i] / src.length; });
    return [out];
  }
  return Array.from({ length: count }, (_, i) => src[Math.min(i, src.length - 1)]);
}

function opDelete(a, b) {
  const ch = doc.ch.map(c => {
    const out = new Float32Array(c.length - (b - a));
    out.set(c.subarray(0, a)); out.set(c.subarray(b), a);
    return out;
  });
  return makeDoc(doc.sr, ch, shiftMarkersDelete(doc.markers, a, b));
}
function opInsert(p, ins) {
  ins = fitChannels(ins, doc.ch.length);
  const n = ins[0].length;
  const ch = doc.ch.map((c, k) => {
    const out = new Float32Array(c.length + n);
    out.set(c.subarray(0, p)); out.set(ins[k], p); out.set(c.subarray(p), p + n);
    return out;
  });
  return makeDoc(doc.sr, ch, shiftMarkersInsert(doc.markers, p, n));
}
// Apply fn(channelCopy, a, b) to a copy of every channel.
function opMap(a, b, fn) {
  const ch = doc.ch.map(c => { const out = c.slice(); fn(out, a, b); return out; });
  return makeDoc(doc.sr, ch, doc.markers.slice());
}

// Add a clip on top of the audio from p, extending the file if the clip runs past the end.
function opMix(p, ins, gain = 1) {
  ins = fitChannels(ins, doc.ch.length);
  const n = ins[0].length, L = Math.max(len(), p + n);
  const ch = doc.ch.map((c, k) => {
    const out = new Float32Array(L), src = ins[k];
    out.set(c);
    for (let i = 0; i < n; i++) out[p + i] = clamp(out[p + i] + src[i] * gain, -1, 1);
    return out;
  });
  return makeDoc(doc.sr, ch, doc.markers.slice());
}

/* ---------- Undo ---------- */
function docBytes(stack) {
  const seen = new Set(); let bytes = 0;
  for (const d of stack) for (const c of d.ch) if (!seen.has(c)) { seen.add(c); bytes += c.byteLength; }
  return bytes;
}
// Part names (doc.labels[i] names the part starting at 0 or at markers[i-1]) follow the
// parts through edits: same number of markers → same names; otherwise matched by start position.
function carryLabels(old, nw) {
  if (!old || !old.labels || !old.labels.some(Boolean)) return undefined;
  if (nw.markers.length === old.markers.length) return old.labels.slice();
  const starts = [0, ...old.markers], byStart = new Map(starts.map((s0, i) => [s0, old.labels[i]]));
  return [0, ...nw.markers].map(s0 => byStart.get(s0) || '');
}
function commit(next, label) {
  if (!next.labels && doc) next.labels = carryLabels(doc, next);
  next.label = label || 'Edit';
  undoStack.push(doc);
  while (undoStack.length > 1 && (undoStack.length > 60 || docBytes(undoStack) > UNDO_BYTES)) undoStack.shift();
  redoStack = [];
  setDoc(next);
  dirty = true;
  if (label) toast(label);
}
function undo() {
  if (!undoStack.length) return;
  stopPlay(); redoStack.push(doc); setDoc(undoStack.pop()); dirty = true; toast('Undo');
}
function redo() {
  if (!redoStack.length) return;
  stopPlay(); undoStack.push(doc); setDoc(redoStack.pop()); dirty = true; toast('Redo');
}

function setDoc(d) {
  if (env) { env = null; syncEnvBar(); } // any edit, undo or new file leaves envelope mode
  const audioChanged = !doc || d.ch.length !== doc.ch.length || d.ch.some((c, i) => c !== doc.ch[i]);
  doc = d;
  if (audioChanged) { buildPeaks(); playBuf = null; }
  const L = len();
  cursor = clamp(cursor, 0, L);
  if (selA !== null) { selA = clamp(selA, 0, L); selB = clamp(selB, 0, L); if (selB - selA <= 0) selA = selB = null; }
  clampView();
  refresh();
}

function buildPeaks() {
  peaks = doc.ch.map(c => {
    const n = Math.ceil(c.length / PEAK_BIN);
    const mn = new Float32Array(n), mx = new Float32Array(n);
    for (let b = 0; b < n; b++) {
      let lo = 1, hi = -1;
      const end = Math.min(c.length, (b + 1) * PEAK_BIN);
      for (let i = b * PEAK_BIN; i < end; i++) { const v = c[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
      mn[b] = lo; mx[b] = hi;
    }
    return { mn, mx };
  });
}

/* ---------- Tabs ---------- */
// Each tab holds one document with its own history, selection and view. The globals
// above always describe the active tab; stashTab() copies them back into it.
let tabs = [], active = null;
function stashTab() {
  if (!active) return;
  Object.assign(active, { doc, undoStack, redoStack, selA, selB, cursor, viewStart, spp, dirty, peaks, playBuf, name: $('fileName').value });
}
function showTab(t) {
  if (t === active) return;
  if (env) { env = null; syncEnvBar(); }
  stopPlay(); stashTab();
  active = t;
  ({ doc, undoStack, redoStack, selA, selB, cursor, viewStart, spp, dirty, peaks, playBuf } = t);
  $('fileName').value = t.name;
  lastW = canvas.clientWidth;
  clampView(); refresh();
}
function closeTab(t, force = false) {
  const isDirty = t === active ? dirty : t.dirty;
  const name = t === active ? $('fileName').value : t.name;
  if (!force && isDirty && !confirm(`Close “${name}” without saving your edits?`)) return;
  const i = tabs.indexOf(t);
  tabs.splice(i, 1);
  if (t !== active) { renderTabs(); return; }
  stopPlay(); active = null;
  if (tabs.length) { showTab(tabs[Math.min(i, tabs.length - 1)]); return; }
  doc = null; dirty = false;
  $('editor').style.display = 'none';
  $('empty').style.display = '';
}
function renderTabs() {
  const bar = $('tabBar');
  bar.innerHTML = '';
  tabs.forEach(t => {
    const isActive = t === active;
    const name = (isActive ? $('fileName').value : t.name) || 'untitled';
    const el = document.createElement('div');
    el.className = 'tab' + (isActive ? ' active' : '');
    el.setAttribute('role', 'tab'); el.setAttribute('aria-selected', isActive); el.tabIndex = 0;
    el.title = name;
    const nm = document.createElement('span'); nm.className = 'nm';
    nm.textContent = ((isActive ? dirty : t.dirty) ? '*' : '') + name;
    const x = document.createElement('button'); x.className = 'x'; x.type = 'button'; x.textContent = '×';
    x.title = 'Close'; x.setAttribute('aria-label', 'Close ' + name);
    x.onclick = e => { e.stopPropagation(); closeTab(t); };
    el.append(nm, x);
    el.onclick = () => showTab(t);
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTab(t); } };
    el.onauxclick = e => { if (e.button === 1) closeTab(t); };
    bar.appendChild(el);
  });
  const add = document.createElement('button');
  add.className = 'tab-add'; add.type = 'button'; add.textContent = '+';
  add.title = 'New empty tab (N) — record, paste or drop audio into it'; add.setAttribute('aria-label', 'New empty tab');
  add.onclick = newEmpty;
  bar.appendChild(add);
  const cur = bar.querySelector('.tab.active');
  // Scroll only the tab strip — scrollIntoView would also scroll the page.
  if (cur) {
    if (cur.offsetLeft < bar.scrollLeft) bar.scrollLeft = cur.offsetLeft;
    else if (cur.offsetLeft + cur.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = cur.offsetLeft + cur.offsetWidth - bar.clientWidth;
  }
}

/* ---------- Mix with file ---------- */
let mixFile = null; // { name, sr, ch } picked with Browse…
function decodeFile(file) {
  return file.arrayBuffer().then(buf => audio().decodeAudioData(buf)).then(ab => {
    const ch = [];
    for (let i = 0; i < ab.numberOfChannels; i++) ch.push(ab.getChannelData(i).slice());
    return { name: file.name.replace(/\.[^.]+$/, ''), sr: ab.sampleRate, ch };
  });
}
function fillMixSources(pick) {
  stashTab();
  const sel = $('mixSrc');
  sel.innerHTML = '';
  tabs.forEach((t, i) => { if (t !== active) sel.add(new Option('Tab: ' + (t.name || 'untitled'), 'tab:' + i)); });
  if (mixFile) sel.add(new Option('File: ' + mixFile.name, 'file'));
  if (!sel.options.length) sel.add(new Option('Click Browse… to choose a file', ''));
  if (pick) sel.value = pick;
  $('mixGo').disabled = !sel.value;
}
function openMixDialog() {
  if (!doc) return;
  stopPlay();
  fillMixSources();
  const at = hasSel() ? selA : cursor;
  const opts = $('mixAt');
  opts.innerHTML = '';
  opts.add(new Option(`Cursor (${fmt(at / doc.sr)})`, String(at)));
  if (at !== 0) opts.add(new Option('Beginning of file', '0'));
  $('mixDlg').showModal();
  // With nothing else open, go straight to the file picker.
  if (!$('mixSrc').value) $('mixFileIn').click();
}
async function runMix() {
  const v = $('mixSrc').value;
  if (!v) return;
  const src = v === 'file' ? mixFile : (t => ({ name: t.name, sr: t.doc.sr, ch: t.doc.ch }))(tabs[+v.slice(4)]);
  const gain = $('mixVol').value / 100, at = clamp(+$('mixAt').value, 0, len());
  $('mixDlg').close();
  busy(true);
  try {
    adoptFormat(src.sr, src.ch.length);
    const ins = src.sr === doc.sr ? src.ch : await resample(src.ch, src.sr, doc.sr);
    commit(opMix(at, ins, gain), `Mixed in “${src.name}”`);
    selA = at; selB = Math.min(len(), at + ins[0].length); cursor = at; refresh();
  } catch (e) { console.error(e); toast('Mixing failed.'); }
  finally { busy(false); }
}

/* ---------- Loading ---------- */
async function loadFiles(files) {
  for (const f of files) await loadFile(f);
}
async function loadFile(file, { remember = true } = {}) {
  if (!file) return;
  if (/\.zip$/i.test(file.name)) return openProject(file);
  stopPlay(); busy(true);
  try {
    const buf = await file.arrayBuffer();
    const ab = await audio().decodeAudioData(buf);
    const ch = [];
    for (let i = 0; i < ab.numberOfChannels; i++) ch.push(ab.getChannelData(i).slice());
    newDocument(makeDoc(ab.sampleRate, ch), file.name.replace(/\.[^.]+$/, ''));
    if (remember) recentAdd(file);
  } catch (e) {
    console.error(e);
    toast(`Could not read “${file.name}”. Try MP3, WAV, M4A or OGG.`);
  } finally { busy(false); }
}
// Copy the selection (or the whole file, with its markers) into a new tab.
function duplicate() {
  if (!doc || !len()) return;
  const base = $('fileName').value.trim() || 'audio';
  const d = hasSel()
    ? makeDoc(doc.sr, sliceCh(doc.ch, selA, selB), doc.markers.filter(m => m > selA && m < selB).map(m => m - selA))
    : makeDoc(doc.sr, doc.ch, doc.markers.slice()); // documents are immutable, so the audio can be shared
  const what = hasSel() ? 'Selection' : 'File';
  newDocument(d, base + (hasSel() ? ' (part)' : ' (copy)'));
  dirty = true; refresh();
  toast(what + ' duplicated into a new tab');
}
let untitledCount = 0;
function newEmpty() {
  newDocument(makeDoc(clip ? clip.sr : (actx ? actx.sampleRate : 44100), [new Float32Array(0)]), 'Untitled ' + (++untitledCount), false);
}
// An empty tab takes on the sample rate and channels of the first audio put into it.
function adoptFormat(sr, nch) {
  if (len() || (doc.sr === sr && doc.ch.length === nch)) return;
  const label = doc.label;
  doc = makeDoc(sr, Array.from({ length: nch }, () => new Float32Array(0)), []);
  doc.label = label;
}
// Opening a file while an untouched empty tab is showing fills that tab instead of adding one.
function newDocument(d, name, reuseEmpty = true) {
  stopPlay();
  let at = tabs.length;
  if (reuseEmpty && active && doc && !len() && !undoStack.length) { at = tabs.indexOf(active); tabs.splice(at, 1); active = null; }
  else stashTab();
  const t = { name: name || 'recording' };
  tabs.splice(at, 0, t); active = t;
  doc = null; undoStack = []; redoStack = []; selA = selB = null; cursor = 0; viewStart = 0; spp = 1; dirty = false; peaks = null; playBuf = null;
  $('fileName').value = t.name;
  d.label = d.label || (d.ch[0].length ? 'Opened' : 'New empty file');
  $('empty').style.display = 'none';
  $('editor').style.display = 'block';
  setDoc(d);
  zoomFit();
}

/* ---------- Recording ---------- */
let rec = null;
async function toggleRecord() {
  if (rec) { rec.stop(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Recording is not supported in this browser.'); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
  catch (e) { toast('Microphone permission was refused.'); return; }
  stopPlay();
  const chunks = [];
  const mr = new MediaRecorder(stream);
  const t0 = Date.now();
  const tick = setInterval(() => setRecLabel('■ Stop ' + fmt((Date.now() - t0) / 1000).slice(0, -4)), 250);
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  mr.onstop = async () => {
    clearInterval(tick); stream.getTracks().forEach(t => t.stop()); rec = null; setRecLabel(null);
    busy(true);
    try {
      const blob = new Blob(chunks, { type: mr.mimeType });
      const ab = await audio().decodeAudioData(await blob.arrayBuffer());
      const ch = [];
      for (let i = 0; i < ab.numberOfChannels; i++) ch.push(ab.getChannelData(i).slice());
      if (!doc) newDocument(makeDoc(ab.sampleRate, ch), 'recording');
      else {
        adoptFormat(ab.sampleRate, ch.length);
        const ins = ab.sampleRate === doc.sr ? ch : await resample(ch, ab.sampleRate, doc.sr);
        const at = hasSel() ? selA : cursor;
        let base = doc;
        if (hasSel()) { doc = opDelete(selA, selB); }
        const next = opInsert(at, ins);
        doc = base;
        commit(next, 'Recording inserted');
        selA = at; selB = at + ins[0].length; cursor = at; refresh();
      }
    } catch (e) { console.error(e); toast('Could not decode the recording.'); }
    finally { busy(false); }
  };
  mr.start();
  rec = mr; setRecLabel('■ Stop 0:00');
}
function setRecLabel(text) {
  for (const id of ['recBtn', 'recBtn2']) {
    const b = $(id);
    b.textContent = text || '● Record';
    b.classList.toggle('live', !!text);
  }
}

/* ---------- Playback ---------- */
let player = null; // { src, t0, from, to, loop }
function getPlayBuf() {
  if (playBuf) return playBuf;
  const ctx = audio();
  playBuf = ctx.createBuffer(doc.ch.length, Math.max(1, len()), doc.sr);
  doc.ch.forEach((c, i) => playBuf.copyToChannel(c, i));
  return playBuf;
}
function play() {
  if (!doc || !len()) return;
  stopPlay();
  const ctx = audio(); ctx.resume();
  let from, to;
  if (hasSel()) { from = selA; to = selB; if (cursor > selA && cursor < selB && !loop) from = cursor; }
  else { from = cursor >= len() ? 0 : cursor; to = len(); }
  const src = ctx.createBufferSource();
  const rate = parseFloat($('rateSel').value) || 1;
  src.buffer = getPlayBuf(); src.playbackRate.value = rate; src.connect(ctx.destination);
  const meters = connectMeters(ctx, src, doc.ch.length);
  const looping = loop && hasSel();
  if (looping) {
    src.loop = true; src.loopStart = selA / doc.sr; src.loopEnd = selB / doc.sr;
    src.start(0, from / doc.sr);
  } else { src.start(0, from / doc.sr); src.stop(ctx.currentTime + (to - from) / doc.sr / rate); }
  const p = { src, t0: ctx.currentTime, from, to, loop: looping, rate, meters };
  src.onended = () => { if (player === p) { player = null; drawMeter(null); cursor = hasSel() ? cursor : to; updatePlayBtn(); refresh(); } };
  player = p; updatePlayBtn(); animate();
}
function stopPlay() {
  if (!player) return;
  const p = player; player = null;
  try { p.src.stop(); } catch (e) {}
  drawMeter(null);
  updatePlayBtn(); draw();
}
function togglePlay() {
  if (player) { const pos = playPos(); stopPlay(); if (!hasSel()) cursor = pos; refresh(); }
  else play();
}
function playPos() {
  if (!player) return cursor;
  const el = (audio().currentTime - player.t0) * doc.sr * player.rate;
  if (player.loop) {
    const span = player.to - player.from;
    const first = selB - player.from;
    return el < first ? player.from + el : selA + ((el - first) % span);
  }
  return Math.min(player.from + el, player.to);
}
function updatePlayBtn() { $('playBtn').textContent = player ? '❚❚ Pause' : '▶ Play'; }
function animate() {
  if (!player) return;
  const pos = playPos();
  const w = canvas.clientWidth, vis = w * spp;
  if (pos < viewStart || pos > viewStart + vis) { viewStart = pos - vis * 0.05; clampView(); }
  $('clock').textContent = fmt(pos / doc.sr);
  drawMeter(player.meters);
  draw(pos);
  requestAnimationFrame(animate);
}

/* ---------- View / zoom ---------- */
function clampView() {
  const w = canvas.clientWidth || 800;
  const L = Math.max(1, len());
  spp = clamp(spp, 0.02, Math.max(1, L / w));
  viewStart = clamp(viewStart, 0, Math.max(0, L - w * spp));
  syncScroll();
}
function zoomFit() { lastW = canvas.clientWidth; spp = Math.max(1, len()) / (canvas.clientWidth || 800); viewStart = 0; clampView(); draw(); }
function zoomAt(factor, anchorSample) {
  const w = canvas.clientWidth;
  if (anchorSample === undefined) anchorSample = player ? playPos() : (hasSel() ? (selA + selB) / 2 : cursor);
  const frac = clamp((anchorSample - viewStart) / (w * spp), 0, 1);
  spp *= factor; clampView();
  viewStart = anchorSample - frac * w * spp; clampView(); draw();
}
function zoomSel() {
  if (!hasSel()) return;
  const w = canvas.clientWidth, pad = (selB - selA) * 0.05;
  spp = (selB - selA + pad * 2) / w; clampView();
  viewStart = selA - pad; clampView(); draw();
}
function syncScroll() {
  const w = canvas.clientWidth || 800, max = Math.max(0, len() - w * spp);
  const s = $('scroll');
  s.disabled = max <= 0;
  s.value = max > 0 ? Math.round(viewStart / max * 1000) : 0;
}
$('scroll').addEventListener('input', e => {
  const w = canvas.clientWidth, max = Math.max(0, len() - w * spp);
  viewStart = e.target.value / 1000 * max; draw();
});

/* ---------- Drawing ---------- */
function draw(playhead) {
  if (!doc) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = css('--wave-bg'); g.fillRect(0, 0, W, H);

  const RULER = RULER_H;
  const toX = s => (s - viewStart) / spp;

  // Selection
  if (hasSel()) {
    const x0 = toX(selA), x1 = toX(selB);
    g.fillStyle = css('--sel'); g.fillRect(x0, RULER, x1 - x0, H - RULER);
  }

  // Waveform lanes (or another view, e.g. the spectrogram, drawn by waveOverlay)
  const nch = doc.ch.length, laneH = (H - RULER) / nch;
  const waveCol = css('--wave'), replaced = !!(waveOverlay && waveOverlay(g, W, H, RULER));
  for (let k = 0; k < (replaced ? 0 : nch); k++) {
    const top = RULER + k * laneH, mid = top + laneH / 2, amp = laneH / 2 - 4;
    g.fillStyle = css('--wave-mid'); g.fillRect(0, Math.round(mid), W, 1);
    if (k > 0) { g.fillStyle = css('--gold-soft'); g.fillRect(0, Math.round(top), W, 1); }
    const c = doc.ch[k];
    g.fillStyle = waveCol; g.strokeStyle = waveCol;
    if (spp < 1) {
      // Sample-level: draw a line through the samples.
      const s0 = Math.max(0, Math.floor(viewStart)), s1 = Math.min(c.length - 1, Math.ceil(viewStart + W * spp));
      g.beginPath(); g.lineWidth = 1.2;
      const v = i => clamp(c[i] * envAt(i), -1, 1);
      for (let i = s0; i <= s1; i++) { const x = toX(i), y = mid - v(i) * amp; i === s0 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
      if (spp < 0.12) for (let i = s0; i <= s1; i++) g.fillRect(toX(i) - 1.5, mid - v(i) * amp - 1.5, 3, 3);
    } else {
      const pk = peaks[k];
      for (let x = 0; x < W; x++) {
        const a = Math.floor(viewStart + x * spp), b = Math.min(c.length, Math.floor(viewStart + (x + 1) * spp));
        if (a >= c.length) break;
        let lo = 1, hi = -1;
        if (spp >= PEAK_BIN * 2) {
          const ba = Math.floor(a / PEAK_BIN), bb = Math.min(pk.mn.length, Math.ceil(b / PEAK_BIN));
          for (let i = ba; i < bb; i++) { if (pk.mn[i] < lo) lo = pk.mn[i]; if (pk.mx[i] > hi) hi = pk.mx[i]; }
        } else {
          for (let i = a; i < Math.max(b, a + 1); i++) { const v = c[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
        }
        if (hi < lo) continue;
        if (env) { const f = envAt(viewStart + (x + 0.5) * spp); lo = Math.max(-1, lo * f); hi = Math.min(1, hi * f); } // live preview
        const y0 = mid - hi * amp, y1 = mid - lo * amp;
        g.fillRect(x, y0, 1, Math.max(1, y1 - y0));
      }
    }
  }

  // Ruler
  g.fillStyle = css('--parchment-deep'); g.fillRect(0, 0, W, RULER);
  g.fillStyle = css('--gold-soft'); g.fillRect(0, RULER - 1, W, 1);
  const secPerPx = spp / doc.sr;
  const steps = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600];
  const step = steps.find(s => s / secPerPx >= 80) || 3600;
  const t0 = Math.floor(viewStart / doc.sr / step) * step;
  g.font = '11px ' + css('--ui'); g.textBaseline = 'middle';
  for (let t = t0; t <= (viewStart + W * spp) / doc.sr; t += step) {
    const x = toX(t * doc.sr);
    g.fillStyle = css('--gold'); g.fillRect(Math.round(x), RULER - 7, 1, 6);
    g.fillStyle = css('--muted');
    const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;
    let label = fmt(t).slice(0, decimals ? decimals - 3 || undefined : -4);
    g.fillText(label, x + 3, RULER / 2 - 1);
  }

  // Markers
  g.font = 'bold 11px ' + css('--ui');
  doc.markers.forEach((m, i) => {
    const x = toX(m);
    if (x < -20 || x > W + 20) return;
    g.fillStyle = css('--marker');
    g.fillRect(Math.round(x) - 0.5, RULER, 1.5, H - RULER);
    g.beginPath(); g.moveTo(x - 6, 0); g.lineTo(x + 6, 0); g.lineTo(x + 6, RULER - 6); g.lineTo(x, RULER); g.lineTo(x - 6, RULER - 6); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(String(i + 1), x, 8); g.textAlign = 'left';
  });
  // Part names, written just after the start of each part when there is room.
  if (doc.labels && doc.labels.some(Boolean)) {
    g.font = '600 11px ' + css('--ui'); g.textBaseline = 'middle';
    const starts = [0, ...doc.markers, len()];
    for (let i = 0; i < starts.length - 1; i++) {
      const name = doc.labels[i]; if (!name) continue;
      const x0 = toX(starts[i]) + 5, room = toX(starts[i + 1]) - x0 - 8;
      if (room < 30 || x0 > W || x0 + room < 0) continue;
      let t = name; while (t.length > 1 && g.measureText(t).width > room) t = t.slice(0, -2) + '…';
      const tw = g.measureText(t).width;
      g.fillStyle = css('--chip'); g.fillRect(x0 - 3, RULER + 4, tw + 6, 16);
      g.fillStyle = css('--marker'); g.fillText(t, x0, RULER + 12);
    }
  }

  // Cursor
  const cx = toX(cursor);
  g.fillStyle = css('--ink-navy'); g.globalAlpha = 0.55; g.fillRect(Math.round(cx), RULER, 1, H - RULER); g.globalAlpha = 1;

  // Volume envelope: dim outside its range, draw the 100% guide, the line and its points.
  if (env) {
    const xa = toX(env.a), xb = toX(env.b), h = H - RULER, yOf = gv => RULER + h * (1 - gv / 2);
    g.fillStyle = 'rgba(60,45,20,.12)';
    g.fillRect(0, RULER, Math.max(0, xa), h); g.fillRect(xb, RULER, Math.max(0, W - xb), h);
    g.setLineDash([4, 4]); g.strokeStyle = 'rgba(200,100,30,.45)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(xa, yOf(1)); g.lineTo(xb, yOf(1)); g.stroke(); g.setLineDash([]);
    g.beginPath(); env.pts.forEach((pt, i) => { const x = toX(pt.s), y = yOf(pt.g); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.strokeStyle = ENV_COL; g.lineWidth = 2.5; g.stroke();
    env.pts.forEach((pt, i) => {
      const x = toX(pt.s), y = yOf(pt.g), big = i === env.sel || i === env.hover;
      g.beginPath(); g.arc(x, y, big ? 7 : 5, 0, Math.PI * 2);
      g.fillStyle = i === env.sel ? ENV_COL : '#fff'; g.fill(); g.strokeStyle = ENV_COL; g.lineWidth = 2; g.stroke();
    });
  }

  // Fade being dragged: shade the volume that will be removed and draw the fade curve.
  if (drag && drag.kind === 'fade' && drag.n > 0) {
    const inFade = drag.side === 'in';
    const x0 = toX(inFade ? drag.a : drag.b - drag.n), x1 = toX(inFade ? drag.a + drag.n : drag.b), h = H - RULER;
    const yAt = t => RULER + h * (1 - fadeGain(inFade ? t : 1 - t));
    g.beginPath(); g.moveTo(x0, RULER);
    for (let i = 0; i <= 48; i++) g.lineTo(x0 + (x1 - x0) * i / 48, yAt(i / 48));
    g.lineTo(x1, RULER); g.closePath();
    g.fillStyle = 'rgba(28,43,70,.22)'; g.fill();
    g.beginPath();
    for (let i = 0; i <= 48; i++) { const x = x0 + (x1 - x0) * i / 48, y = yAt(i / 48); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.strokeStyle = css('--ink-navy'); g.lineWidth = 2; g.stroke();
    const label = `Fade ${inFade ? 'in' : 'out'} ${(drag.n / doc.sr).toFixed(2)} s`;
    g.font = '600 12px ' + css('--ui');
    const tw = g.measureText(label).width + 12, lx = clamp(inFade ? x1 + 6 : x0 - tw - 6, 2, W - tw - 2), ly = RULER + FADE_H + 22;
    g.fillStyle = css('--ink-navy'); g.fillRect(lx, ly, tw, 20);
    g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(label, lx + 6, ly + 10);
  }
  // Selection holder (drag to move the selection) and edge grips (drag to resize it).
  const sh = selHandles();
  if (sh) {
    const { x0, x1, barY } = sh, bx0 = Math.max(0, x0), bx1 = Math.min(W, x1);
    if (bx1 > bx0) {
      g.fillStyle = drag && drag.kind === 'move' ? css('--gold') : 'rgba(169,124,37,.55)';
      g.fillRect(bx0, barY, bx1 - bx0, SEL_BAR);
      g.fillStyle = '#fff';
      const cx = (bx0 + bx1) / 2;
      if (bx1 - bx0 > 150) {
        g.font = '600 11px ' + css('--ui'); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('⟷  drag to move the selection', cx, barY + SEL_BAR / 2 + 0.5); g.textAlign = 'left';
      } else if (bx1 - bx0 > 16) for (const dx of [-4, 0, 4]) g.fillRect(Math.round(cx + dx), barY + 3, 1.5, SEL_BAR - 6);
    }
    for (const x of [x0, x1]) {
      if (x < -6 || x > W + 6) continue;
      const gy = RULER + (H - RULER - SEL_BAR) / 2 - 18;
      g.fillStyle = css('--gold'); g.fillRect(Math.round(x) - 4, gy, 8, 36);
      g.fillStyle = '#fff'; g.fillRect(Math.round(x) - 1.5, gy + 8, 1, 20); g.fillRect(Math.round(x) + 0.5, gy + 8, 1, 20);
    }
  }

  // Fade handles: small squares at the top corners of the selection (or of the file).
  for (const hd of fadeHandles()) {
    if (hd.x < -FADE_H || hd.x > W) continue;
    g.fillStyle = '#fff'; g.fillRect(hd.x, hd.y, FADE_H, FADE_H);
    g.strokeStyle = css('--gold'); g.lineWidth = 1.5; g.strokeRect(hd.x + 0.5, hd.y + 0.5, FADE_H - 1, FADE_H - 1);
    g.beginPath(); // ramp icon: rising for fade in, falling for fade out
    if (hd.side === 'in') { g.moveTo(hd.x + 3, hd.y + FADE_H - 3); g.lineTo(hd.x + FADE_H - 3, hd.y + FADE_H - 3); g.lineTo(hd.x + FADE_H - 3, hd.y + 3); }
    else { g.moveTo(hd.x + 3, hd.y + 3); g.lineTo(hd.x + 3, hd.y + FADE_H - 3); g.lineTo(hd.x + FADE_H - 3, hd.y + FADE_H - 3); }
    g.closePath(); g.fillStyle = css('--green'); g.fill();
  }

  // Playhead
  if (playhead !== undefined) {
    const px = toX(playhead);
    g.fillStyle = css('--playhead'); g.fillRect(Math.round(px) - 1, 0, 2, H);
  }
  drawOverview(playhead);
}

/* ---------- Overview bar (whole file, like WavePad) ---------- */
// The whole-file waveform is drawn once into an offscreen canvas (it only changes when the
// audio or the width changes); each redraw just copies it and adds the view box on top.
const ovCanvas = $('overview'), ovG = ovCanvas.getContext('2d');
let ovCache = null; // { peaks, w, img }
function ovWave(W, H, dpr) {
  if (ovCache && ovCache.peaks === peaks && ovCache.w === W && ovCache.dpr === dpr) return ovCache.img;
  const img = document.createElement('canvas'); img.width = Math.round(W * dpr); img.height = Math.round(H * dpr);
  const c2 = img.getContext('2d'); c2.setTransform(dpr, 0, 0, dpr, 0, 0);
  const nb = peaks[0].mn.length, mid = H / 2, amp = H / 2 - 3;
  c2.fillStyle = css('--wave');
  for (let x = 0; x < W; x++) {
    const b0 = Math.floor(x * nb / W), b1 = Math.max(b0 + 1, Math.floor((x + 1) * nb / W));
    let lo = 1, hi = -1;
    for (const pk of peaks) for (let i = b0; i < b1 && i < nb; i++) { if (pk.mn[i] < lo) lo = pk.mn[i]; if (pk.mx[i] > hi) hi = pk.mx[i]; }
    if (hi >= lo) c2.fillRect(x, mid - hi * amp, 1, Math.max(1, (hi - lo) * amp));
  }
  ovCache = { peaks, w: W, dpr, img };
  return img;
}
function ovBox() {
  const W = ovCanvas.clientWidth, L = Math.max(1, len()), vis = canvas.clientWidth * spp;
  const x = viewStart / L * W, w = Math.max(6, Math.min(W, vis / L * W));
  return { x: Math.min(x, W - w), w, W, L, vis };
}
function drawOverview(playhead) {
  if (!doc || !len() || document.body.classList.contains('no-overview')) { ovCanvas.style.visibility = doc && len() ? '' : 'hidden'; return; }
  ovCanvas.style.visibility = '';
  const dpr = window.devicePixelRatio || 1, W = ovCanvas.clientWidth, H = ovCanvas.clientHeight;
  if (!W) return;
  if (ovCanvas.width !== Math.round(W * dpr) || ovCanvas.height !== Math.round(H * dpr)) { ovCanvas.width = Math.round(W * dpr); ovCanvas.height = Math.round(H * dpr); }
  ovG.setTransform(1, 0, 0, 1, 0, 0);
  ovG.fillStyle = css('--wave-bg'); ovG.fillRect(0, 0, ovCanvas.width, ovCanvas.height);
  ovG.drawImage(ovWave(W, H, dpr), 0, 0);
  ovG.setTransform(dpr, 0, 0, dpr, 0, 0);
  const L = len(), X = v => v / L * W, b = ovBox();
  ovCanvas.title = `Showing ${fmt(viewStart / doc.sr)} – ${fmt(Math.min(L, viewStart + b.vis) / doc.sr)} of ${fmt(L / doc.sr)} · drag the box to scroll, its edges to zoom, double-click for everything`;
  if (hasSel()) { ovG.fillStyle = css('--sel'); ovG.fillRect(X(selA), 0, Math.max(1, X(selB) - X(selA)), H); }
  ovG.fillStyle = css('--marker'); for (const m of doc.markers) ovG.fillRect(Math.round(X(m)), 0, 1, H);
  // Dim what's outside the view and frame the part shown below.
  ovG.fillStyle = 'rgba(60,45,20,.16)'; ovG.fillRect(0, 0, b.x, H); ovG.fillRect(b.x + b.w, 0, W - b.x - b.w, H);
  ovG.strokeStyle = css('--gold'); ovG.lineWidth = 2; ovG.strokeRect(b.x + 1, 1, b.w - 2, H - 2);
  ovG.fillStyle = css('--gold'); ovG.fillRect(b.x, H / 2 - 8, 3, 16); ovG.fillRect(b.x + b.w - 3, H / 2 - 8, 3, 16);
  ovG.fillStyle = css('--ink-navy'); ovG.globalAlpha = 0.6; ovG.fillRect(Math.round(X(cursor)), 0, 1, H); ovG.globalAlpha = 1;
  if (playhead !== undefined) { ovG.fillStyle = css('--playhead'); ovG.fillRect(Math.round(X(playhead)) - 1, 0, 2, H); }
}
let ovDrag = null; // { kind: 'pan' | 'left' | 'right', off }
function ovPart(e) {
  const r = ovCanvas.getBoundingClientRect(), x = e.clientX - r.left, b = ovBox();
  if (Math.abs(x - b.x) <= HIT) return 'left';
  if (Math.abs(x - (b.x + b.w)) <= HIT) return 'right';
  return x > b.x && x < b.x + b.w ? 'pan' : 'jump';
}
ovCanvas.addEventListener('pointerdown', e => {
  if (!doc || !len()) return;
  ovCanvas.setPointerCapture(e.pointerId);
  const r = ovCanvas.getBoundingClientRect(), x = e.clientX - r.left, b = ovBox(), part = ovPart(e);
  if (part === 'jump') { // centre the view where you clicked, then keep dragging it
    viewStart = x / b.W * b.L - b.vis / 2; clampView(); draw(player ? playPos() : undefined);
    ovDrag = { kind: 'pan', off: ovBox().w / 2 };
  } else ovDrag = { kind: part, off: x - b.x };
});
ovCanvas.addEventListener('pointermove', e => {
  if (!doc || !len()) return;
  if (!ovDrag) { const part = ovPart(e); ovCanvas.style.cursor = part === 'pan' ? 'grab' : part === 'jump' ? 'pointer' : 'ew-resize'; return; }
  const r = ovCanvas.getBoundingClientRect(), x = clamp(e.clientX - r.left, 0, r.width), b = ovBox(), Wm = canvas.clientWidth;
  if (ovDrag.kind === 'pan') { viewStart = (x - ovDrag.off) / b.W * b.L; ovCanvas.style.cursor = 'grabbing'; }
  else if (ovDrag.kind === 'left') { const right = viewStart + b.vis, st = Math.min(x / b.W * b.L, right - Wm * 0.05); spp = (right - st) / Wm; viewStart = st; }
  else { const end = Math.max(x / b.W * b.L, viewStart + Wm * 0.05); spp = (end - viewStart) / Wm; }
  clampView(); draw(player ? playPos() : undefined);
});
const ovEnd = () => { ovDrag = null; };
ovCanvas.addEventListener('pointerup', ovEnd); ovCanvas.addEventListener('pointercancel', ovEnd);
ovCanvas.addEventListener('dblclick', () => { if (doc && len()) zoomFit(); });
ovCanvas.addEventListener('wheel', e => { // wheel over the overview scrolls, Ctrl+wheel zooms
  if (!doc || !len()) return;
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) zoomAt(e.deltaY > 0 ? 1.25 : 0.8);
  else { viewStart += (e.deltaY || e.deltaX) * spp * 2; clampView(); draw(player ? playPos() : undefined); }
}, { passive: false });

/* ---------- UI refresh ---------- */
function refresh() {
  if (!doc) return;
  const sr = doc.sr, L = len();
  $('emptyHint').hidden = L > 0;
  $('fileInfo').textContent = !L ? 'Empty' : `${doc.ch.length === 1 ? 'Mono' : doc.ch.length === 2 ? 'Stereo' : doc.ch.length + ' ch'} · ${(sr / 1000).toFixed(1)} kHz`;
  $('totalLen').textContent = fmt(L / sr);
  if (!player) $('clock').textContent = fmt(cursor / sr);
  const s = hasSel();
  if (document.activeElement !== $('selStartIn')) $('selStartIn').value = fmt((s ? selA : cursor) / sr);
  if (document.activeElement !== $('selEndIn')) $('selEndIn').value = s ? fmt(selB / sr) : '';
  $('selEndIn').placeholder = '—';
  $('selLen').textContent = s ? fmt((selB - selA) / sr) : '—';
  $('fxScope').textContent = s ? '(selection)' : '(whole file)';
  for (const id of ['cutBtn', 'copyBtn', 'delBtn', 'trimBtn', 'zoomSelBtn', 'exportSelBtn']) $(id).disabled = !s;
  $('pasteBtn').disabled = $('pasteMixBtn').disabled = !clip;
  renderTabs();
  $('undoBtn').disabled = !undoStack.length;
  $('redoBtn').disabled = !redoStack.length;
  $('monoBtn').disabled = doc.ch.length === 1;
  $('stereoBtn').disabled = doc.ch.length !== 1 || !L;
  $('swapBtn').disabled = doc.ch.length !== 2;
  document.querySelectorAll('.fx-need').forEach(b => { b.disabled = !L; });
  $('repeatBtn').disabled = $('redactBtn').disabled = $('noiseGrabBtn').disabled = !s;
  $('splitBtn').disabled = !L || (!doc.markers.length && (cursor <= 0 || cursor >= L));
  renderHistory();
  $('loopBtn').classList.toggle('on', loop);
  $('clearMarksBtn').disabled = !doc.markers.length;
  renderSegments();
  draw(player ? playPos() : undefined);
}

function segments() {
  const pts = [0, ...doc.markers.filter(m => m > 0 && m < len()), len()];
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) if (pts[i + 1] > pts[i]) out.push([pts[i], pts[i + 1]]);
  return out;
}
function renderSegments() {
  const ul = $('segList'), segs = segments(), sr = doc.sr;
  ul.innerHTML = '';
  $('zipBtn').disabled = segs.length < 2;
  if (segs.length < 2) {
    const li = document.createElement('li'); li.className = 'empty';
    li.textContent = 'Add markers (or auto-split) to cut the audio into parts.';
    ul.appendChild(li); return;
  }
  segs.forEach(([a, b], i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="idx">${i + 1}</span><span class="pcol"><input class="pname" type="text" dir="auto" spellcheck="false" placeholder="Name (optional)" aria-label="Name of part ${i + 1}"><span class="t">${fmt(a / sr)} – ${fmt(b / sr)} (${((b - a) / sr).toFixed(2)} s)</span></span>`;
    const nameIn = li.querySelector('.pname');
    nameIn.value = (doc.labels && doc.labels[i]) || '';
    nameIn.onchange = () => setPartName(i, nameIn.value);
    nameIn.onkeydown = e => { if (e.key === 'Enter') { nameIn.blur(); const nx = ul.querySelectorAll('.pname')[i + 1]; if (nx) nx.focus(); } };
    const mk = (label, title, fn) => { const bt = document.createElement('button'); bt.className = 'btn'; bt.type = 'button'; bt.textContent = label; bt.title = title; bt.onclick = fn; li.appendChild(bt); };
    mk('▶', 'Select and play this part', () => { selA = a; selB = b; cursor = a; refresh(); play(); });
    mk('Select', 'Select this part', () => { selA = a; selB = b; cursor = a; stopPlay(); refresh(); });
    mk('↓', 'Download this part', () => exportPart(a, b, partName(i + 1, segs.length)));
    if (i > 0) mk('✕', `Remove marker ${i}`, () => { const m = doc.markers.slice(); m.splice(i - 1, 1); commit(makeDoc(doc.sr, doc.ch, m)); });
    ul.appendChild(li);
  });
}
function baseName() { return ($('fileName').value.trim() || 'audio').replace(/[\\/:*?"<>|]+/g, '_'); }
function partName(n, total) {
  const num = String(n).padStart(String(total).length < 2 ? 2 : String(total).length, '0');
  const label = doc && doc.labels && doc.labels[n - 1] ? '-' + doc.labels[n - 1].trim().replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) : '';
  return baseName() + '-' + num + label;
}
function setPartName(i, name) {
  const labels = (doc.labels || []).slice(); while (labels.length < doc.markers.length + 1) labels.push('');
  if ((labels[i] || '') === name.trim()) return;
  labels[i] = name.trim();
  const d = makeDoc(doc.sr, doc.ch, doc.markers.slice()); d.labels = labels;
  commit(d, name.trim() ? `Named part ${i + 1}` : `Unnamed part ${i + 1}`);
}

/* ---------- Edit commands ---------- */
function range() { return hasSel() ? [selA, selB] : [0, len()]; }
function cmdCopy() { if (!hasSel()) return; clip = { sr: doc.sr, ch: sliceCh(doc.ch, selA, selB) }; refresh(); toast('Copied ' + fmt((selB - selA) / doc.sr)); }
function cmdDelete(label) {
  if (!hasSel()) return;
  stopPlay();
  const a = selA, b = selB;
  selA = selB = null; cursor = a;
  commit(opDelete(a, b), label || 'Deleted');
}
function cmdCut() { if (!hasSel()) return; cmdCopy(); cmdDelete('Cut'); }
// The clipboard may come from another tab: convert it to this document's sample rate.
async function clipFor(sr) {
  if (clip.sr === sr) return clip.ch;
  busy(true);
  try { return await resample(clip.ch, clip.sr, sr); } finally { busy(false); }
}
async function cmdPaste() {
  if (!clip || !doc) return;
  stopPlay();
  adoptFormat(clip.sr, clip.ch.length);
  const ins = await clipFor(doc.sr);
  let base = doc, at = cursor;
  if (hasSel()) { at = selA; doc = opDelete(selA, selB); }
  const next = opInsert(at, ins);
  doc = base;
  commit(next, 'Pasted');
  selA = at; selB = at + ins[0].length; cursor = at; refresh();
}
async function cmdPasteMix() {
  if (!clip || !doc) return;
  stopPlay();
  adoptFormat(clip.sr, clip.ch.length);
  const ins = await clipFor(doc.sr), at = hasSel() ? selA : cursor;
  commit(opMix(at, ins), 'Mixed in');
  selA = at; selB = at + ins[0].length; cursor = at; refresh();
}
function cmdTrim() {
  if (!hasSel()) return;
  stopPlay();
  const a = selA, b = selB;
  const markers = doc.markers.filter(m => m > a && m < b).map(m => m - a);
  selA = selB = null; cursor = 0;
  commit(makeDoc(doc.sr, sliceCh(doc.ch, a, b), markers), 'Trimmed to selection');
  zoomFit();
}
function effect(label, fn) {
  if (!doc) return;
  stopPlay();
  const [a, b] = range();
  if (b <= a) return;
  commit(opMap(a, b, fn), label);
}
function peakOf(a, b) {
  let p = 0;
  for (const c of doc.ch) for (let i = a; i < b; i++) { const v = Math.abs(c[i]); if (v > p) p = v; }
  return p;
}
const fadeIn = () => effect('Faded in', (c, a, b) => { const n = b - a; for (let i = 0; i < n; i++) c[a + i] *= fadeGain(i / n); });
const fadeOut = () => effect('Faded out', (c, a, b) => { const n = b - a; for (let i = 0; i < n; i++) c[a + i] *= fadeGain(1 - i / n); });
const reverse = () => effect('Reversed', (c, a, b) => c.subarray(a, b).reverse());
const silence = () => effect('Silenced', (c, a, b) => c.fill(0, a, b));
function normalise() {
  const [a, b] = range(), p = peakOf(a, b);
  if (p === 0) { toast('Nothing to normalise — the audio is silent.'); return; }
  const k = Math.pow(10, -1 / 20) / p;
  effect(`Normalised (${(20 * Math.log10(k)).toFixed(1)} dB)`, (c, a, b) => { for (let i = a; i < b; i++) c[i] *= k; });
}
function amplify() {
  const db = parseFloat($('gainIn').value);
  if (!isFinite(db) || db === 0) return;
  const [a, b] = range(), k = Math.pow(10, db / 20);
  const clipping = peakOf(a, b) * k > 1;
  effect(`Amplified ${db > 0 ? '+' : ''}${db} dB${clipping ? ' — some peaks clipped' : ''}`, (c, a, b) => {
    for (let i = a; i < b; i++) c[i] = clamp(c[i] * k, -1, 1);
  });
}
function insertSilence() {
  const sec = parseFloat($('insSilIn').value);
  if (!doc || !(sec > 0)) return;
  stopPlay();
  const n = Math.round(sec * doc.sr), at = cursor;
  commit(opInsert(at, doc.ch.map(() => new Float32Array(n))), `Inserted ${sec} s of silence`);
  selA = at; selB = at + n; refresh();
}
function makeMono() {
  if (!doc || doc.ch.length < 2) return;
  stopPlay();
  commit(makeDoc(doc.sr, fitChannels(doc.ch, 1), doc.markers.slice()), 'Mixed down to mono');
}

/* ---------- Silence detection ---------- */
function loudness(chs = doc.ch, sr = doc.sr) {
  // dB level of each 10 ms window (loudest channel).
  const L = chs[0].length;
  const win = Math.max(1, Math.round(sr * 0.01)), n = Math.ceil(L / win);
  const db = new Float32Array(n);
  for (let w = 0; w < n; w++) {
    const a = w * win, b = Math.min(L, a + win);
    let best = 0;
    for (const c of chs) { let s = 0; for (let i = a; i < b; i++) s += c[i] * c[i]; best = Math.max(best, s / (b - a)); }
    db[w] = best > 0 ? 10 * Math.log10(best) : -120;
  }
  return { win, db };
}
function autoSplit() {
  if (!doc) return;
  const thr = parseFloat($('thrIn').value), minMs = parseFloat($('minSilIn').value);
  const { win, db } = loudness(), minWins = Math.max(1, Math.round(minMs / 10));
  const marks = [];
  let runStart = -1;
  for (let w = 0; w <= db.length; w++) {
    const quiet = w < db.length && db[w] < thr;
    if (quiet && runStart < 0) runStart = w;
    if (!quiet && runStart >= 0) {
      // Ignore silence touching either end of the file: nothing to split there.
      if (w - runStart >= minWins && runStart > 0 && w < db.length) marks.push(Math.round((runStart + w) / 2 * win));
      runStart = -1;
    }
  }
  if (!marks.length) { toast('No pauses found — try a higher threshold or shorter minimum.'); return; }
  commit(makeDoc(doc.sr, doc.ch, marks), `Found ${marks.length + 1} parts`);
}
// Ranges of audio to keep for Auto trim (everything else is silence to drop).
function autoTrimRanges(ch, sr, v) {
  const { win, db } = loudness(ch, sr), L = ch[0].length, keep = Math.round(sr * v.keep / 1000);
  let first = 0, last = db.length - 1;
  while (first < db.length && db[first] < v.thr) first++;
  while (last >= 0 && db[last] < v.thr) last--;
  if (first > last) return null;
  const a = v.mode === 'end' ? 0 : Math.max(0, first * win - keep);
  const b = v.mode === 'start' ? L : Math.min(L, (last + 1) * win + keep);
  if (v.mode !== 'pauses') return [[a, b]];
  const out = [], minW = Math.ceil(v.minPause / 10), half = keep >> 1;
  let from = a, run = -1;
  for (let w = first; w <= last + 1; w++) {
    const quiet = w <= last && db[w] < v.thr;
    if (quiet && run < 0) run = w;
    if (!quiet && run >= 0) {
      const s0 = run * win, e0 = w * win;
      if (w - run >= minW && e0 - s0 > keep) { out.push([from, s0 + half]); from = e0 - (keep - half); }
      run = -1;
    }
  }
  out.push([from, b]);
  return out.filter(([x, y]) => y > x);
}
// Join kept ranges with 3 ms fades at each cut so the joins never click.
function keepRangesCh(ch, sr, ranges) {
  const total = ranges.reduce((t, [a, b]) => t + b - a, 0), f = Math.round(sr * 0.003);
  return ch.map(c => {
    const o = new Float32Array(total); let p = 0;
    ranges.forEach(([a, b], i) => {
      o.set(c.subarray(a, b), p);
      const n = Math.min(f, (b - a) >> 1);
      if (i > 0) for (let j = 0; j < n; j++) o[p + j] *= j / n;
      if (i < ranges.length - 1) for (let j = 0; j < n; j++) o[p + (b - a) - 1 - j] *= j / n;
      p += b - a;
    });
    return o;
  });
}
// Move markers to their new positions; one inside a removed stretch moves to the cut point.
function mapMarkers(markers, ranges) {
  const total = ranges.reduce((t, [a, b]) => t + b - a, 0);
  const at = m => { let p = 0; for (const [a, b] of ranges) { if (m < a) return p; if (m < b) return p + m - a; p += b - a; } return p; };
  return [...new Set(markers.map(at))].filter(m => m > 0 && m < total).sort((x, y) => x - y);
}
async function autoTrim() {
  if (!doc || !len()) return;
  stopPlay();
  const v = await askParams('Auto trim', 'Removes silence from the whole file. “Shorten long pauses” also tightens every gap inside the recording.', [
    { id: 'mode', label: 'What to trim', type: 'select', value: 'ends', options: [
      ['ends', 'Silence at the start and end'], ['start', 'Silence at the start only'], ['end', 'Silence at the end only'],
      ['pauses', 'Start and end, and shorten long pauses inside'] ] },
    { id: 'thr', label: 'Count as silence below', value: parseFloat($('thrIn').value) || -40, min: -90, max: -5, step: 1, unit: 'dB' },
    { id: 'keep', label: 'Leave this much silence', value: 250, min: 0, max: 5000, step: 50, unit: 'ms (at each end / per pause)' },
    { id: 'minPause', label: 'Only shorten pauses longer than', value: 700, min: 100, max: 10000, step: 50, unit: 'ms (pauses mode)' },
  ], { ok: 'Trim', preview: async (ch, sr, v) => { const r = autoTrimRanges(ch, sr, v); return r ? keepRangesCh(ch, sr, r) : ch; } });
  if (!v) return;
  const ranges = autoTrimRanges(doc.ch, doc.sr, v);
  if (!ranges) { toast('Everything is below the threshold — try a lower (more negative) dB value.'); return; }
  const kept = ranges.reduce((t, [a, b]) => t + b - a, 0), removed = len() - kept;
  if (removed <= 0) { toast('Nothing to trim with these settings.'); return; }
  selA = selB = null; cursor = 0;
  commit(makeDoc(doc.sr, keepRangesCh(doc.ch, doc.sr, ranges), mapMarkers(doc.markers, ranges)),
    `Auto trim: removed ${(removed / doc.sr).toFixed(2)} s${ranges.length > 1 ? ` (${ranges.length - 1} pauses shortened)` : ''}`);
  zoomFit();
}

function addMarker() {
  if (!doc) return;
  const at = Math.round(player ? playPos() : cursor);
  if (at <= 0 || at >= len()) { toast('Place the cursor inside the audio first.'); return; }
  if (doc.markers.includes(at)) return;
  commit(makeDoc(doc.sr, doc.ch, [...doc.markers, at].sort((x, y) => x - y)), 'Marker added');
}

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

/* ---------- Multitrack editor (like WavePad's) ---------- */
// Tracks hold clips; a clip plays part of a source (offset/dur, in seconds) at a start time.
// Sources are immutable channel arrays (e.g. a tab's audio), so clips just reference them.
const MT_ROW = 92, MT_RULER = 26, MT_COLORS = ['#2e6b58', '#a97c25', '#3a6ea5', '#8a4f9e', '#b5543a', '#4f8a3a', '#2a7f8a', '#9a6a2a'];
const mt = { tracks: [], clips: [], markers: [], loop: null, looping: false, picked: new Set(), pps: 60, scroll: 0, playhead: 0, sel: null, selTrack: null, undo: [], redo: [], nextId: 1 };
// Clip volume (gain, ×) and fade lengths (seconds) — clips made before these existed have none.
const clipGain = c => c.gain == null ? 1 : c.gain;
const clipFades = c => { const fi = Math.min(c.fadeIn || 0, c.dur), fo = Math.min(c.fadeOut || 0, c.dur - fi); return [fi, fo]; };
function clipEnvAt(c, u) { const [fi, fo] = clipFades(c); return clipGain(c) * Math.max(0, Math.min(1, fi ? u / fi : 1, fo ? (c.dur - u) / fo : 1)); }
const mtPickedClips = () => mt.clips.filter(c => c.id === mt.sel || mt.picked.has(c.id));
function mtPick(id, add) { // select a clip; with add (Shift/Ctrl) toggle it in a group
  if (!add) { mt.picked = new Set(id == null ? [] : [id]); mt.sel = id; return; }
  if (mt.sel != null) mt.picked.add(mt.sel);
  if (mt.picked.has(id)) { mt.picked.delete(id); mt.sel = [...mt.picked].pop() ?? null; } else { mt.picked.add(id); mt.sel = id; }
}
let mtPlayer = null, mtRecorder = null, mtDrag = null;
const mtCanvas = $('mtCanvas'), mtG = mtCanvas.getContext('2d');
const mtBuffers = new WeakMap(), mtPeakCache = new WeakMap();
const mtEnd = () => mt.clips.reduce((e, c) => Math.max(e, c.start + c.dur), 0);
const mtClip = id => mt.clips.find(c => c.id === id);
const mtTrack = id => mt.tracks.find(t => t.id === id);
function mtSnapshot() { return { tracks: mt.tracks.map(t => ({ ...t })), clips: mt.clips.map(c => ({ ...c })), markers: mt.markers.slice() }; }
function mtChange(fn) { // record an undo step, then change
  mt.undo.push(mtSnapshot()); if (mt.undo.length > 80) mt.undo.shift(); mt.redo = [];
  fn(); mtRender();
  if (mtPlayer) mtRestart();
}
function mtUndo(redo) {
  const from = redo ? mt.redo : mt.undo, to = redo ? mt.undo : mt.redo;
  if (!from.length) return;
  to.push(mtSnapshot()); const s0 = from.pop(); mt.tracks = s0.tracks; mt.clips = s0.clips; if (s0.markers) mt.markers = s0.markers;
  if (mt.sel && !mtClip(mt.sel)) mt.sel = null;
  mt.picked = new Set([...mt.picked].filter(id => mtClip(id)));
  mtRender(); if (mtPlayer) mtRestart();
}
function mtAddTrackObj(name) {
  const t = { id: mt.nextId++, name: name || 'Track ' + (mt.tracks.length + 1), vol: 1, pan: 0, mute: false, solo: false, color: MT_COLORS[mt.tracks.length % MT_COLORS.length] };
  mt.tracks.push(t); mt.selTrack = t.id; return t;
}
function mtAddClip(src, trackId, start) {
  const c = { id: mt.nextId++, track: trackId, src, start: Math.max(0, start), offset: 0, dur: src.ch[0].length / src.sr, name: src.name };
  mt.clips.push(c); mt.sel = c.id; return c;
}
function mtBuffer(src) {
  if (!mtBuffers.has(src)) {
    const b = audio().createBuffer(src.ch.length, Math.max(1, src.ch[0].length), src.sr);
    src.ch.forEach((c, i) => b.copyToChannel(c, i)); mtBuffers.set(src, b);
  }
  return mtBuffers.get(src);
}
function mtPeaks(src) { // min/max per 256 samples, all channels together
  if (!mtPeakCache.has(src)) {
    const n = Math.ceil(src.ch[0].length / 256), mn = new Float32Array(n), mx = new Float32Array(n);
    for (let b = 0; b < n; b++) {
      let lo = 1, hi = -1;
      for (const c of src.ch) for (let i = b * 256, e = Math.min(c.length, i + 256); i < e; i++) { const v = c[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
      mn[b] = lo; mx[b] = hi;
    }
    mtPeakCache.set(src, { mn, mx });
  }
  return mtPeakCache.get(src);
}
// ---------- Drawing ----------
const mtX = t => (t - mt.scroll) * mt.pps;
const mtT = x => x / mt.pps + mt.scroll;
function mtRender() { mtHeads(); mtDraw(); mtSync(); }
function mtSync() {
  stashTab();
  const hasTabs = tabs.some(t => t.doc && t.doc.ch[0].length);
  const sel = $('mtAddTab'); sel.innerHTML = '';
  sel.add(new Option(hasTabs ? '＋ Add an open tab…' : 'No open tabs', ''));
  tabs.forEach((t, i) => { if (t.doc && t.doc.ch[0].length) sel.add(new Option(t.name || 'untitled', i)); });
  const c = mt.sel && mtClip(mt.sel), many = mtPickedClips().length;
  const vol = k => { const g = clipGain(k); return g === 1 ? '' : ` · volume ${(20 * Math.log10(Math.max(g, 1e-4))).toFixed(1)} dB`; };
  $('mtInfo').textContent = many > 1 ? `${many} clips selected — drag one to move them together · Del removes them · Shift+click adds or removes a clip`
    : c ? `${c.name}: starts ${fmt(c.start)} · length ${fmt(c.dur)} · on ${(mtTrack(c.track) || {}).name}${vol(c)} · double-click for volume and fades`
    : 'Drag clips to move them (also onto other tracks) · Shift+click selects several · drag a clip\'s edge to trim it, its top corners to fade · drag on the ruler to loop · M adds a marker · Ctrl+wheel zooms';
  for (const id of ['mtSplit', 'mtDup', 'mtDel', 'mtEdit', 'mtClipBtn']) $(id).disabled = !c;
  $('mtEdit').disabled = $('mtClipBtn').disabled = !c || many > 1;
  $('mtLoopBtn').classList.toggle('on', mt.looping && !!mt.loop);
  $('mtSplit').disabled = !c || mt.playhead <= c.start || mt.playhead >= c.start + c.dur;
  $('mtUndo').disabled = !mt.undo.length; $('mtRedo').disabled = !mt.redo.length;
  $('mtMix').disabled = $('mtMixSave').disabled = !mt.clips.length;
  $('mtEmpty').hidden = mt.clips.length > 0;
  const W = $('mtLane').clientWidth, total = Math.max(mtEnd() + 5, W / mt.pps), max = Math.max(0, total - W / mt.pps);
  $('mtScroll').max = 1000; $('mtScroll').value = max ? Math.round(mt.scroll / max * 1000) : 0; $('mtScroll').disabled = !max;
  if (!mtPlayer) $('mtClock').textContent = fmt(mt.playhead);
}
function mtHeads() {
  const box = $('mtHeads'); box.innerHTML = '<div class="spacer">Tracks</div>';
  mt.tracks.forEach(t => {
    const d = document.createElement('div'); d.className = 'mt-head' + (t.id === mt.selTrack ? ' sel' : '');
    d.innerHTML = `<div class="r1"><span class="sw" style="background:${t.color}"></span><input type="text" aria-label="Track name"><button class="tb" data-a="m" title="Mute">M</button><button class="tb" data-a="s" title="Solo (hear only this track)">S</button><button class="tb" data-a="x" title="Remove track">✕</button></div>
      <label><span>Vol</span><input type="range" min="0" max="200" step="1" data-a="vol"><output></output></label>
      <label><span>Pan</span><input type="range" min="-100" max="100" step="5" data-a="pan"><output></output></label>`;
    const nm = d.querySelector('input[type=text]'); nm.value = t.name;
    nm.onchange = () => mtChange(() => { t.name = nm.value.trim() || t.name; });
    const [vol, pan] = d.querySelectorAll('input[type=range]'), [ov, op] = d.querySelectorAll('output');
    vol.value = Math.round(t.vol * 100); ov.value = vol.value + '%';
    pan.value = Math.round(t.pan * 100); op.value = t.pan ? (t.pan < 0 ? 'L' : 'R') + Math.abs(Math.round(t.pan * 100)) : 'C';
    vol.oninput = () => { t.vol = vol.value / 100; ov.value = vol.value + '%'; mtLive(); };
    pan.oninput = () => { t.pan = pan.value / 100; op.value = t.pan ? (t.pan < 0 ? 'L' : 'R') + Math.abs(pan.value) : 'C'; mtLive(); };
    d.querySelector('[data-a=m]').classList.toggle('on-m', t.mute);
    d.querySelector('[data-a=s]').classList.toggle('on-s', t.solo);
    d.querySelector('[data-a=m]').onclick = () => { t.mute = !t.mute; mtHeads(); mtLive(); mtDraw(); };
    d.querySelector('[data-a=s]').onclick = () => { t.solo = !t.solo; mtHeads(); mtLive(); mtDraw(); };
    d.querySelector('[data-a=x]').onclick = () => {
      if (mt.clips.some(c => c.track === t.id) && !confirm(`Remove “${t.name}” and its clips?`)) return;
      mtChange(() => { mt.tracks = mt.tracks.filter(x => x !== t); mt.clips = mt.clips.filter(c => c.track !== t.id); });
    };
    d.onpointerdown = e => { if (e.target === d) { mt.selTrack = t.id; mtHeads(); } };
    box.appendChild(d);
  });
}
function mtAudible(t) { const anySolo = mt.tracks.some(x => x.solo); return !t.mute && (!anySolo || t.solo); }
function mtDraw() {
  if (!$('mt').classList.contains('open')) return;
  const lane = $('mtLane'), dpr = window.devicePixelRatio || 1;
  const W = lane.clientWidth, H = MT_RULER + Math.max(1, mt.tracks.length) * MT_ROW;
  if (mtCanvas.width !== Math.round(W * dpr) || mtCanvas.height !== Math.round(H * dpr)) {
    mtCanvas.width = Math.round(W * dpr); mtCanvas.height = Math.round(H * dpr); mtCanvas.style.width = W + 'px'; mtCanvas.style.height = H + 'px';
  }
  const g2 = mtG; g2.setTransform(dpr, 0, 0, dpr, 0, 0);
  g2.fillStyle = css('--wave-bg'); g2.fillRect(0, 0, W, H);
  // Ruler
  g2.fillStyle = css('--parchment-deep'); g2.fillRect(0, 0, W, MT_RULER);
  const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  const step = steps.find(st => st * mt.pps >= 70) || 600;
  g2.font = '11px ' + css('--ui'); g2.textBaseline = 'middle';
  for (let t = Math.floor(mt.scroll / step) * step; mtX(t) < W; t += step) {
    const x = mtX(t); if (x < 0) continue;
    g2.fillStyle = 'rgba(169,124,37,.25)'; g2.fillRect(Math.round(x), MT_RULER, 1, H - MT_RULER);
    g2.fillStyle = css('--gold'); g2.fillRect(Math.round(x), MT_RULER - 7, 1, 7);
    g2.fillStyle = css('--muted'); g2.fillText(step >= 1 ? fmt(t).slice(0, -4) : fmt(t).replace(/0+$/, ''), x + 3, MT_RULER / 2);
  }
  // Loop region
  if (mt.loop) {
    const lx0 = mtX(mt.loop.a), lx1 = mtX(mt.loop.b), on = mt.looping;
    g2.fillStyle = on ? 'rgba(46,107,88,.35)' : 'rgba(120,120,120,.22)'; g2.fillRect(lx0, 0, lx1 - lx0, MT_RULER);
    g2.fillStyle = on ? 'rgba(46,107,88,.06)' : 'rgba(0,0,0,.025)'; g2.fillRect(lx0, MT_RULER, lx1 - lx0, H - MT_RULER);
    g2.fillStyle = on ? css('--green') : '#888'; g2.fillRect(Math.round(lx0), 0, 2, H); g2.fillRect(Math.round(lx1) - 2, 0, 2, H);
  }
  // Rows and clips
  mt.tracks.forEach((t, row) => {
    const y = MT_RULER + row * MT_ROW;
    if (t.id === mt.selTrack) { g2.fillStyle = 'rgba(46,107,88,.05)'; g2.fillRect(0, y, W, MT_ROW); }
    g2.fillStyle = 'rgba(169,124,37,.3)'; g2.fillRect(0, y + MT_ROW - 1, W, 1);
    const dim = !mtAudible(t);
    for (const c of mt.clips) {
      if (c.track !== t.id) continue;
      const x0 = mtX(c.start), x1 = mtX(c.start + c.dur);
      if (x1 < 0 || x0 > W) continue;
      const cy = y + 5, ch = MT_ROW - 10, sel = c.id === mt.sel || mt.picked.has(c.id);
      g2.globalAlpha = dim ? 0.35 : 1;
      g2.fillStyle = t.color + '26'; g2.strokeStyle = sel ? css('--ink-navy') : t.color; g2.lineWidth = sel ? 2.5 : 1.5;
      g2.beginPath(); g2.roundRect ? g2.roundRect(x0, cy, x1 - x0, ch, 6) : g2.rect(x0, cy, x1 - x0, ch); g2.fill(); g2.stroke();
      // waveform
      const pk = mtPeaks(c.src), mid = cy + ch / 2 + 6, amp = (ch / 2 - 10) * Math.min(2, clipGain(c)), spb = c.src.sr / 256;
      g2.fillStyle = t.color;
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x1); x++) {
        const ta = c.offset + (mtT(x) - c.start), tb2 = ta + 1 / mt.pps;
        const b0 = Math.max(0, Math.floor(ta * spb)), b1 = Math.min(pk.mn.length, Math.max(b0 + 1, Math.ceil(tb2 * spb)));
        let lo = 1, hi = -1; for (let i = b0; i < b1; i++) { if (pk.mn[i] < lo) lo = pk.mn[i]; if (pk.mx[i] > hi) hi = pk.mx[i]; }
        const e = clipEnvAt(c, mtT(x) - c.start) / clipGain(c);
        if (hi >= lo) g2.fillRect(x, mid - hi * amp * e, 1, Math.max(1, (hi - lo) * amp * e));
      }
      // Fades: shaded corners with a line, and handles on the selected clip
      const [fi, fo] = clipFades(c), fx0 = x0 + fi * mt.pps, fx1 = x1 - fo * mt.pps;
      g2.fillStyle = css('--chip'); g2.strokeStyle = css('--ink-navy'); g2.lineWidth = 1.2;
      if (fi) { g2.beginPath(); g2.moveTo(x0, cy + ch); g2.lineTo(fx0, cy); g2.lineTo(x0, cy); g2.closePath(); g2.fill(); g2.beginPath(); g2.moveTo(x0, cy + ch); g2.lineTo(fx0, cy); g2.stroke(); }
      if (fo) { g2.beginPath(); g2.moveTo(x1, cy + ch); g2.lineTo(fx1, cy); g2.lineTo(x1, cy); g2.closePath(); g2.fill(); g2.beginPath(); g2.moveTo(x1, cy + ch); g2.lineTo(fx1, cy); g2.stroke(); }
      if (c.id === mt.sel) { g2.fillStyle = css('--ink-navy'); g2.fillRect(fx0 - (fi ? 5 : 0), cy, 10, 10); g2.fillRect(fx1 - (fo ? 5 : 10), cy, 10, 10); }
      g2.fillStyle = css('--ink-navy'); g2.font = '600 11px ' + css('--ui'); g2.textBaseline = 'top';
      g2.save(); g2.beginPath(); g2.rect(x0, cy, x1 - x0, ch); g2.clip();
      g2.fillText(c.name + '  ' + fmt(c.dur).replace(/\d$/, ''), Math.max(x0, 0) + 6, cy + 4); g2.restore();
      if (sel) { g2.fillStyle = css('--ink-navy'); g2.fillRect(x0, cy + ch / 2 - 10, 3, 20); g2.fillRect(x1 - 3, cy + ch / 2 - 10, 3, 20); }
      g2.globalAlpha = 1;
    }
  });
  // Markers
  g2.font = '600 10px ' + css('--ui'); g2.textBaseline = 'top';
  mt.markers.forEach((m, i) => {
    const x = Math.round(mtX(m)); if (x < -10 || x > W + 10) return;
    g2.fillStyle = 'rgba(163,64,46,.5)'; for (let yy = MT_RULER; yy < H; yy += 6) g2.fillRect(x, yy, 1, 3);
    g2.fillStyle = '#a3402e'; g2.beginPath(); g2.moveTo(x - 5, 0); g2.lineTo(x + 5, 0); g2.lineTo(x + 5, 12); g2.lineTo(x, 17); g2.lineTo(x - 5, 12); g2.closePath(); g2.fill();
    g2.fillStyle = '#fff'; g2.fillText(String(i + 1), x - (i >= 9 ? 5 : 2.5), 2);
  });
  // Playhead
  const px = mtX(mt.playhead);
  if (px >= 0 && px <= W) { g2.fillStyle = css('--playhead'); g2.fillRect(Math.round(px) - 1, 0, 2, H); }
  if (mtRecorder) { const rx0 = mtX(mtRecorder.start), rx1 = mtX(mt.playhead); g2.fillStyle = 'rgba(163,64,46,.25)'; g2.fillRect(rx0, MT_RULER + mtRecorder.row * MT_ROW + 5, Math.max(2, rx1 - rx0), MT_ROW - 10); }
}
// ---------- Playback (live mix through Web Audio) ----------
function mtGraph(ctx, dest) {
  const master = ctx.createGain(); master.connect(dest);
  const nodes = new Map();
  for (const t of mt.tracks) {
    const gn = ctx.createGain(), pn = ctx.createStereoPanner();
    gn.gain.value = mtAudible(t) ? t.vol : 0; pn.pan.value = t.pan;
    gn.connect(pn); pn.connect(master); nodes.set(t.id, { gn, pn });
  }
  return nodes;
}
function mtSchedule(ctx, nodes, from, when) {
  const srcs = [];
  for (const c of mt.clips) {
    const end = c.start + c.dur; if (end <= from) continue;
    const n = nodes.get(c.track); if (!n) continue;
    const sn = ctx.createBufferSource(); sn.buffer = mtBuffer(c.src);
    const skip = Math.max(0, from - c.start), at = when + Math.max(0, c.start - from);
    const [fi, fo] = clipFades(c), k = clipGain(c);
    if (fi || fo || k !== 1) { // per-clip volume envelope
      const g = ctx.createGain(); sn.connect(g); g.connect(n.gn);
      g.gain.setValueAtTime(clipEnvAt(c, skip), at);
      if (fi && skip < fi) g.gain.linearRampToValueAtTime(k, at + fi - skip);
      if (fo) { const us = c.dur - fo; if (us > skip) g.gain.setValueAtTime(k, at + us - skip); g.gain.linearRampToValueAtTime(0, at + c.dur - skip); }
    } else sn.connect(n.gn);
    sn.start(at, c.offset + skip, c.dur - skip);
    srcs.push(sn);
  }
  return srcs;
}
function mtPlay() {
  if (mtPlayer) { mtPause(); return; }
  stopPlay(); stopPreview();
  const ctx = audio(); ctx.resume();
  const nodes = mtGraph(ctx, ctx.destination), t0 = ctx.currentTime + 0.05;
  if (mt.playhead >= mtEnd() && !mtRecorder) mt.playhead = 0;
  if (mt.looping && mt.loop && !mtRecorder && mt.playhead >= mt.loop.b - 0.01) mt.playhead = mt.loop.a;
  const srcs = mtSchedule(ctx, nodes, mt.playhead, t0);
  mtPlayer = { nodes, srcs, t0, from: mt.playhead };
  $('mtPlay').textContent = '❚❚ Pause';
  mtAnimate();
}
function mtStopNodes() { if (!mtPlayer) return; mtPlayer.srcs.forEach(sn => { try { sn.stop(); } catch (e) {} }); mtPlayer = null; $('mtPlay').textContent = '▶ Play'; }
function mtPause() { if (mtPlayer) mt.playhead = mtPos(); mtStopNodes(); if (mtRecorder) mtRecStop(); mtRender(); }
function mtRestart() { const pos = mtPos(); mtStopNodes(); mt.playhead = pos; mtPlay(); }
const mtPos = () => mtPlayer ? mtPlayer.from + Math.max(0, audio().currentTime - mtPlayer.t0) : mt.playhead;
function mtLive() { if (mtPlayer) for (const t of mt.tracks) { const n = mtPlayer.nodes.get(t.id); if (n) { n.gn.gain.setTargetAtTime(mtAudible(t) ? t.vol : 0, audio().currentTime, 0.02); n.pn.pan.setTargetAtTime(t.pan, audio().currentTime, 0.02); } } }
function mtAnimate() {
  if (!mtPlayer) return;
  mt.playhead = mtPos();
  if (mt.looping && mt.loop && !mtRecorder && mtPlayer.from < mt.loop.b && mt.playhead >= mt.loop.b) { mtStopNodes(); mt.playhead = mt.loop.a; mtPlay(); return; }
  if (mt.playhead >= mtEnd() + 0.05 && !mtRecorder) { mtStopNodes(); mt.playhead = mtEnd(); mtRender(); return; }
  const W = $('mtLane').clientWidth;
  if (mtX(mt.playhead) > W - 30) { mt.scroll = mt.playhead - 30 / mt.pps; }
  $('mtClock').textContent = fmt(mt.playhead);
  mtDraw(); requestAnimationFrame(mtAnimate);
}
// ---------- Recording a new track while the others play ----------
async function mtRec() {
  if (mtRecorder) { mtRecStop(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Recording is not supported in this browser.'); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
  catch (e) { toast('Microphone permission was refused.'); return; }
  // One undo step covers the new track and its recording.
  mt.undo.push(mtSnapshot()); mt.redo = [];
  const t = mtAddTrackObj('Recording ' + (mt.tracks.filter(x => /^Recording/.test(x.name)).length + 1));
  const chunks = [], mr = new MediaRecorder(stream);
  mtRecorder = { mr, stream, start: mt.playhead, track: t.id, row: mt.tracks.indexOf(t), t0: null };
  // Where on the timeline the recording's first sample is: taken when the recorder really starts,
  // against the playback clock (both use the audio clock).
  mr.onstart = () => { if (mtRecorder) mtRecorder.t0 = audio().currentTime; };
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  mr.onstop = async () => {
    stream.getTracks().forEach(x => x.stop());
    try {
      const ab = await audio().decodeAudioData(await new Blob(chunks, { type: mr.mimeType }).arrayBuffer());
      const ch = []; for (let i = 0; i < ab.numberOfChannels; i++) ch.push(ab.getChannelData(i).slice());
      const r = mtRecorder, trackId = r.track;
      // What you hear comes out late (output latency) and your voice reaches the recorder late
      // (input latency), so the take is moved earlier by that delay.
      let start = r.start;
      if (r.t0 != null && r.play) start = r.play.from + (r.t0 - r.play.t0);
      start -= mtLatency();
      mtRecorder = null;
      const c = mtAddClip({ name: mtTrack(trackId).name, sr: ab.sampleRate, ch }, trackId, 0);
      if (start < 0) { c.offset = Math.min(-start, c.dur - 0.01); c.dur -= c.offset; start = 0; }
      c.start = start; mtRender();
    } catch (e) { console.error(e); mtRecorder = null; mtUndo(false); mt.redo.pop(); toast('Could not decode the recording.'); }
  };
  mr.start();
  $('mtRec').textContent = '■ Stop recording'; $('mtRec').classList.add('live');
  mtRender();
  if (!mtPlayer) mtPlay(); // hear the other tracks while recording
  if (mtPlayer) mtRecorder.play = { from: mtPlayer.from, t0: mtPlayer.t0 };
}
// Recording delay (seconds) to correct: the saved value from Recording Options, else the browser's own estimate.
function mtLatency() {
  let ms = null; try { ms = JSON.parse(localStorage.getItem('ae-rec-options') || '{}').latency; } catch (e) {}
  if (typeof ms === 'number' && isFinite(ms)) return ms / 1000;
  const ctx = audio(); return (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
}
function mtRecStop() {
  if (!mtRecorder || mtRecorder.mr.state === 'inactive') return;
  mtRecorder.mr.stop();
  $('mtRec').textContent = '● Record track'; $('mtRec').classList.remove('live');
  if (mtPlayer) { mt.playhead = mtPos(); mtStopNodes(); }
}
// ---------- Mixdown ----------
async function mtMixdown() {
  const end = mtEnd(); if (!end) return null;
  const sr = Math.max(44100, ...mt.clips.map(c => c.src.sr));
  const off = new OfflineAudioContext(2, Math.ceil(end * sr), sr);
  mtSchedule(off, mtGraph(off, off.destination), 0, 0);
  const r = await off.startRendering();
  return { sr, ch: [r.getChannelData(0).slice(), r.getChannelData(1).slice()] };
}
async function mtMixToTab() {
  busy(true);
  try { const m = await mtMixdown(); if (!m) return; mtClose(); newDocument(makeDoc(m.sr, m.ch), 'Multitrack mix', false); dirty = true; refresh(); toast('Mix opened in a new tab'); }
  catch (e) { console.error(e); toast('Mixing failed.'); } finally { busy(false); }
}
function mtMixSave() {
  withBusy('Mixing…', async () => { const m = await mtMixdown(); if (m) downloadBlob(await encode(m.ch, m.sr), 'multitrack-mix' + ext(), mime()); });
}
// ---------- Pointer editing on the timeline ----------
function mtHit(e) {
  const r = mtCanvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (y < MT_RULER) { const mi = mt.markers.findIndex(m => Math.abs(mtX(m) - x) <= HIT); return { x, y, ruler: true, marker: mi < 0 ? null : mi }; }
  const row = Math.floor((y - MT_RULER) / MT_ROW), track = mt.tracks[row];
  if (!track) return { x, y, row };
  const c = mt.clips.filter(k => k.track === track.id).reverse().find(k => x >= mtX(k.start) - 5 && x <= mtX(k.start + k.dur) + 5);
  let part = null;
  const sc = mt.sel && mtClip(mt.sel);
  if (sc && sc.track === track.id) { // fade handles (top corners) of the selected clip come first
    const cy = MT_RULER + row * MT_ROW + 5, [fi, fo] = clipFades(sc), hx0 = mtX(sc.start) + fi * mt.pps + (fi ? 0 : 5), hx1 = mtX(sc.start + sc.dur) - fo * mt.pps - (fo ? 0 : 5);
    if (y >= cy - 2 && y <= cy + 13) { if (Math.abs(x - hx0) <= HIT + 1) return { x, y, row, track, clip: sc, part: 'fi' }; if (Math.abs(x - hx1) <= HIT + 1) return { x, y, row, track, clip: sc, part: 'fo' }; }
  }
  if (c) part = Math.abs(x - mtX(c.start)) <= HIT + 1 ? 'l' : Math.abs(x - mtX(c.start + c.dur)) <= HIT + 1 ? 'r' : x > mtX(c.start) && x < mtX(c.start + c.dur) ? 'move' : null;
  return { x, y, row, track, clip: part ? c : null, part };
}
function mtSnap(t, ignore) { // snap to 0, the playhead and other clips' edges within 8 px
  let best = t, bd = 8 / mt.pps;
  for (const p of [0, mt.playhead, ...mt.markers, ...mt.clips.filter(c => c !== ignore && !(Array.isArray(ignore) && ignore.includes(c))).flatMap(c => [c.start, c.start + c.dur])]) if (Math.abs(p - t) < bd) { bd = Math.abs(p - t); best = p; }
  return best;
}
mtCanvas.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  mtCanvas.setPointerCapture(e.pointerId);
  const h = mtHit(e), add = e.shiftKey || e.ctrlKey || e.metaKey;
  if (h.track) mt.selTrack = h.track.id;
  if (h.ruler && h.marker != null) { // drag a marker, or click it to jump there
    mt.undo.push(mtSnapshot()); mt.redo = [];
    mtDrag = { part: 'marker', i: h.marker, x0: h.x, moved: false }; mtRender(); return;
  }
  if (h.ruler) { // click: move the playhead · drag: mark a loop
    mtDrag = { part: 'ruler', x0: h.x, t0: Math.max(0, mtT(h.x)), moved: false };
    if (!mtPlayer) { mt.playhead = mtDrag.t0; mtRender(); }
    return;
  }
  if (h.clip) {
    if (add && h.part === 'move') { mtPick(h.clip.id, true); mtRender(); return; }
    const inGroup = mt.picked.has(h.clip.id) && mt.picked.size > 1 && h.part === 'move';
    if (!inGroup) mtPick(h.clip.id, false); else mt.sel = h.clip.id;
    mt.undo.push(mtSnapshot()); mt.redo = [];
    const group = inGroup ? mtPickedClips().map(c => ({ c, start: c.start })) : null;
    mtDrag = { part: h.part, c: h.clip, x0: h.x, row0: h.row, orig: { ...h.clip }, moved: false, group };
  } else {
    mtPick(null, false);
    if (mtPlayer) { mtStopNodes(); mt.playhead = Math.max(0, mtT(h.x)); mtPlay(); } else mt.playhead = Math.max(0, mtT(h.x));
    mtDrag = { part: 'playhead' };
  }
  mtRender();
});
mtCanvas.addEventListener('pointermove', e => {
  const h = mtHit(e);
  if (!mtDrag) { mtCanvas.style.cursor = h.part === 'move' ? 'grab' : h.part ? 'ew-resize' : 'default'; return; }
  if (mtDrag.part === 'playhead') { mt.playhead = Math.max(0, mtT(h.x)); if (!mtPlayer) $('mtClock').textContent = fmt(mt.playhead); mtDraw(); return; }
  if (mtDrag.part === 'marker') {
    if (Math.abs(h.x - mtDrag.x0) > 3) mtDrag.moved = true;
    if (mtDrag.moved) { mt.markers[mtDrag.i] = Math.max(0, mtT(h.x)); $('mtInfo').textContent = `Marker ${mtDrag.i + 1} at ${fmt(mt.markers[mtDrag.i])}`; mtDraw(); }
    return;
  }
  if (mtDrag.part === 'ruler') {
    if (Math.abs(h.x - mtDrag.x0) > 4) mtDrag.moved = true;
    if (mtDrag.moved) { const t = mtSnap(Math.max(0, mtT(h.x))); mt.loop = { a: Math.min(mtDrag.t0, t), b: Math.max(mtDrag.t0, t) }; mt.looping = true; $('mtInfo').textContent = `Loop ${fmt(mt.loop.a)} – ${fmt(mt.loop.b)} (${fmt(mt.loop.b - mt.loop.a)})`; mtDraw(); }
    return;
  }
  const c = mtDrag.c, o = mtDrag.orig, dt = (h.x - mtDrag.x0) / mt.pps, srcLen = c.src.ch[0].length / c.src.sr;
  if (Math.abs(h.x - mtDrag.x0) > 2) mtDrag.moved = true;
  if (mtDrag.group) { // several clips move together (in time only)
    const lead = Math.min(...mtDrag.group.map(g => g.start)), members = mtDrag.group.map(g => g.c);
    let d = Math.max(-lead, dt), st = o.start + d;
    const sn = mtSnap(st, members); if (sn !== st && sn - o.start >= -lead) d = sn - o.start;
    for (const g of mtDrag.group) g.c.start = g.start + d;
    mtCanvas.style.cursor = 'grabbing';
  } else if (mtDrag.part === 'fi') {
    c.fadeIn = clamp((h.x - mtX(c.start)) / mt.pps, 0, c.dur - (c.fadeOut || 0));
    $('mtInfo').textContent = `Fade in: ${fmt(c.fadeIn)}`; mtDraw(); return;
  } else if (mtDrag.part === 'fo') {
    c.fadeOut = clamp((mtX(c.start + c.dur) - h.x) / mt.pps, 0, c.dur - (c.fadeIn || 0));
    $('mtInfo').textContent = `Fade out: ${fmt(c.fadeOut)}`; mtDraw(); return;
  } else if (mtDrag.part === 'move') {
    let st = Math.max(0, o.start + dt);
    const snapA = mtSnap(st, c), snapB = mtSnap(st + o.dur, c) - o.dur;
    st = Math.abs(snapA - st) <= Math.abs(snapB - st) ? snapA : Math.max(0, snapB);
    c.start = st;
    const row = clamp(Math.floor((h.y - MT_RULER) / MT_ROW), 0, mt.tracks.length - 1);
    c.track = mt.tracks[row].id;
    mtCanvas.style.cursor = 'grabbing';
  } else if (mtDrag.part === 'l') { // trim the start: the audio stays in place
    const ns = clamp(mtSnap(o.start + dt, c), Math.max(0, o.start - o.offset), o.start + o.dur - 0.02);
    c.offset = o.offset + (ns - o.start); c.dur = o.dur - (ns - o.start); c.start = ns;
  } else { // trim the end
    const ne = clamp(mtSnap(o.start + o.dur + dt, c), o.start + 0.02, o.start + (srcLen - o.offset));
    c.dur = ne - o.start;
  }
  $('mtInfo').textContent = `${c.name}: starts ${fmt(c.start)} · length ${fmt(c.dur)}`;
  mtDraw();
});
function mtEndDrag() {
  if (!mtDrag) return;
  const d = mtDrag; mtDrag = null;
  if (d.part === 'marker') {
    if (!d.moved) { mt.undo.pop(); mt.playhead = mt.markers[d.i]; if (mtPlayer) mtRestart(); }
    else mt.markers.sort((a, b) => a - b);
  }
  if (d.part === 'ruler') {
    if (!d.moved) mt.playhead = d.t0;
    else { if (mt.loop.b - mt.loop.a < 0.05) { mt.loop = null; mt.looping = false; } else mt.playhead = mt.loop.a; }
    if (mtPlayer) { mtStopNodes(); mtPlay(); }
  }
  if (d.c && !d.moved) mt.undo.pop(); // a plain click selects, it isn't an edit
  mtRender();
  if (d.c && d.moved && mtPlayer) mtRestart();
}
mtCanvas.addEventListener('pointerup', mtEndDrag); mtCanvas.addEventListener('pointercancel', mtEndDrag);
mtCanvas.addEventListener('dblclick', e => { const h = mtHit(e); if (h.clip) { mtPick(h.clip.id, false); mtClipProps(); } });
mtCanvas.addEventListener('wheel', e => {
  e.preventDefault();
  const r = mtCanvas.getBoundingClientRect();
  if (e.ctrlKey || e.metaKey) { const t = mtT(e.clientX - r.left); mt.pps = clamp(mt.pps * (e.deltaY > 0 ? 0.8 : 1.25), 2, 2000); mt.scroll = Math.max(0, t - (e.clientX - r.left) / mt.pps); }
  else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) mt.scroll = Math.max(0, mt.scroll + (e.deltaX || e.deltaY) / mt.pps);
  else { $('mtMain').scrollTop += e.deltaY; return; }
  mtDraw(); mtSync();
}, { passive: false });
$('mtScroll').addEventListener('input', e => {
  const W = $('mtLane').clientWidth, max = Math.max(0, Math.max(mtEnd() + 5, W / mt.pps) - W / mt.pps);
  mt.scroll = e.target.value / 1000 * max; mtDraw();
});
// ---------- Clip commands ----------
function mtSplit() {
  const c = mt.sel && mtClip(mt.sel), p = mt.playhead;
  if (!c || p <= c.start || p >= c.start + c.dur) return;
  mtChange(() => { const cut = p - c.start, b = { ...c, id: mt.nextId++, start: p, offset: c.offset + cut, dur: c.dur - cut }; c.dur = cut; mt.clips.push(b); mt.sel = b.id; });
}
function mtDup() { // duplicates the selected clip(s) right after themselves
  const g = mtPickedClips(); if (!g.length) return;
  const a = Math.min(...g.map(c => c.start)), span = Math.max(...g.map(c => c.start + c.dur)) - a;
  mtChange(() => { const made = g.map(c => { const b = { ...c, id: mt.nextId++, start: c.start + span }; mt.clips.push(b); return b.id; }); mt.picked = new Set(made); mt.sel = made[made.length - 1]; });
}
function mtDel() { const g = mtPickedClips(); if (g.length) mtChange(() => { mt.clips = mt.clips.filter(k => !g.includes(k)); mtPick(null, false); }); }
function mtSelectAll() { mt.picked = new Set(mt.clips.map(c => c.id)); mt.sel = mt.clips.length ? mt.clips[mt.clips.length - 1].id : null; mtRender(); }
async function mtClipProps() {
  const c = mt.sel && mtClip(mt.sel); if (!c) return;
  const [fi, fo] = clipFades(c);
  const v = await askParams('Clip volume and fades', `“${c.name}” — ${fmt(c.dur)} long. Fades can also be dragged from the clip's top corners.`, [
    { id: 'db', label: 'Clip volume', value: +(20 * Math.log10(Math.max(clipGain(c), 1e-4))).toFixed(1), min: -40, max: 20, step: 0.5, unit: 'dB (0 = as recorded)' },
    { id: 'fi', label: 'Fade in', value: +fi.toFixed(2), min: 0, max: +c.dur.toFixed(2), step: 0.1, unit: 's' },
    { id: 'fo', label: 'Fade out', value: +fo.toFixed(2), min: 0, max: +c.dur.toFixed(2), step: 0.1, unit: 's' },
    { id: 'start', label: 'Starts at', value: +c.start.toFixed(3), min: 0, step: 0.01, unit: 's' },
  ], { ok: 'Apply' });
  if (!v) return;
  mtChange(() => {
    c.gain = Math.pow(10, clamp(v.db, -40, 20) / 20); if (Math.abs(c.gain - 1) < 1e-6) c.gain = 1;
    c.fadeIn = clamp(v.fi, 0, c.dur); c.fadeOut = clamp(v.fo, 0, c.dur - c.fadeIn); c.start = Math.max(0, v.start);
  });
}
function mtMarker() { // add a marker at the playhead, or remove the one there
  const i = mt.markers.findIndex(m => Math.abs(mtX(m) - mtX(mt.playhead)) <= 4);
  mtChange(() => { if (i >= 0) mt.markers.splice(i, 1); else { mt.markers.push(mt.playhead); mt.markers.sort((a, b) => a - b); } });
  toast(i >= 0 ? 'Marker removed' : `Marker ${mt.markers.indexOf(mt.playhead) + 1} added`);
}
function mtGotoMarker(dir) {
  const p = mtPlayer ? mtPos() : mt.playhead, list = [0, ...mt.markers, mtEnd()];
  const t = dir > 0 ? list.find(m => m > p + 0.01) : list.filter(m => m < p - (mtPlayer ? 0.4 : 0.01)).pop();
  if (t == null) return;
  mt.playhead = t; const W = $('mtLane').clientWidth;
  if (mtX(t) < 0 || mtX(t) > W - 20) mt.scroll = Math.max(0, t - 40 / mt.pps);
  if (mtPlayer) mtRestart(); else mtRender();
}
function mtToggleLoop() {
  if (!mt.loop) {
    const g = mtPickedClips();
    if (!g.length) { toast('Drag along the ruler (top strip) to mark the part to loop, or select a clip first.'); return; }
    mt.loop = { a: Math.min(...g.map(c => c.start)), b: Math.max(...g.map(c => c.start + c.dur)) }; mt.looping = true;
  } else mt.looping = !mt.looping;
  toast(mt.looping ? `Looping ${fmt(mt.loop.a)} – ${fmt(mt.loop.b)}` : 'Loop off');
  if (mtPlayer) { const p = mtPos(); mtStopNodes(); mt.playhead = p; mtPlay(); } else mtRender();
}
function mtEditClip() {
  const c = mt.sel && mtClip(mt.sel); if (!c) return;
  const a = Math.round(c.offset * c.src.sr), b = a + Math.round(c.dur * c.src.sr);
  mtClose(); newDocument(makeDoc(c.src.sr, sliceCh(c.src.ch, a, b)), c.name + ' (clip)', false); dirty = true; refresh();
  toast('Clip opened in a new tab — edit it, then add it back from the Multitrack tab list');
}
function mtZoom(f) { const W = $('mtLane').clientWidth, mid = mt.scroll + W / 2 / mt.pps; mt.pps = clamp(mt.pps * f, 2, 2000); mt.scroll = Math.max(0, mid - W / 2 / mt.pps); mtDraw(); mtSync(); }
function mtFit() { const W = $('mtLane').clientWidth; mt.pps = clamp((W - 20) / Math.max(1, mtEnd()), 2, 2000); mt.scroll = 0; mtDraw(); mtSync(); }
// ---------- Open / close ----------
function openMultitrack() {
  stopPlay(); closeMenus();
  $('mt').classList.add('open'); document.body.classList.add('mt-open');
  if (!mt.tracks.length) {
    mt.undo = []; mt.redo = []; mt.markers = []; mt.loop = null; mt.looping = false; mt.picked = new Set();
    if (doc && len()) { const t = mtAddTrackObj($('fileName').value || 'Track 1'); mtAddClip({ name: $('fileName').value || 'audio', sr: doc.sr, ch: doc.ch }, t.id, 0); }
    else mtAddTrackObj();
    requestAnimationFrame(mtFit);
  }
  mtRender();
}
function mtClose() { mtStopNodes(); if (mtRecorder) mtRecStop(); $('mt').classList.remove('open'); document.body.classList.remove('mt-open'); }
function mtKey(e) {
  const t = e.target;
  if (t.tagName === 'INPUT' && t.type === 'text' || t.tagName === 'SELECT') return false;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  const act = k === ' ' ? mtPlay : k === 'escape' ? mtClose : (k === 'delete' || k === 'backspace') ? mtDel : k === 's' && !mod ? mtSplit
    : mod && k === 'd' ? mtDup : mod && k === 'z' && !e.shiftKey ? () => mtUndo(false) : mod && (k === 'y' || (k === 'z' && e.shiftKey)) ? () => mtUndo(true)
    : k === 'r' && !mod ? () => mtRec() : k === 'm' && !mod ? mtMarker : k === ';' && !mod ? () => mtGotoMarker(-1) : k === "'" && !mod ? () => mtGotoMarker(1)
    : k === 'l' && !mod ? mtToggleLoop : mod && k === 'a' ? mtSelectAll : k === 'home' ? () => { mt.playhead = 0; mt.scroll = 0; if (mtPlayer) mtRestart(); mtRender(); } : k === '+' || k === '=' ? () => mtZoom(1.5) : k === '-' ? () => mtZoom(1 / 1.5) : null;
  if (!act) return false;
  e.preventDefault(); act(); return true;
}
on('mtPlay', mtPlay);
on('mtBtn2', openMultitrack);
on('mtStop', () => { mtStopNodes(); if (mtRecorder) mtRecStop(); mt.playhead = mtPlayer ? mtPlayer.from : mt.playhead; mtRender(); });
on('mtHome', () => { const was = !!mtPlayer; mtStopNodes(); mt.playhead = 0; mt.scroll = 0; mtRender(); if (was) mtPlay(); });
on('mtRec', () => mtRec());
on('mtAddTrack', () => mtChange(() => mtAddTrackObj()));
$('mtAddTab').addEventListener('change', e => {
  const t = tabs[+e.target.value]; e.target.value = '';
  if (!t || !t.doc) return;
  mtChange(() => {
    const track = mtTrack(mt.selTrack) || mtAddTrackObj(t.name);
    mtAddClip({ name: t.name || 'audio', sr: t.doc.sr, ch: t.doc.ch }, track.id, mt.playhead);
  });
});
on('mtAddFile', () => $('mtFileIn').click());
$('mtFileIn').addEventListener('change', async e => {
  const files = [...e.target.files]; e.target.value = '';
  busy(true);
  try {
    for (const f of files) {
      try { const d = await decodeFile(f); mtChange(() => { const t = mtAddTrackObj(d.name); mtAddClip(d, t.id, 0); }); }
      catch (err) { console.error(err); toast(`Could not read “${f.name}”.`); }
    }
  } finally { busy(false); }
  if (mt.clips.length) mtFit();
});
on('mtSplit', mtSplit); on('mtDup', mtDup); on('mtDel', mtDel); on('mtEdit', mtEditClip); on('mtClipBtn', mtClipProps);
on('mtMarkBtn', mtMarker); on('mtLoopBtn', mtToggleLoop);
on('mtUndo', () => mtUndo(false)); on('mtRedo', () => mtUndo(true));
on('mtZoomIn', () => mtZoom(1.5)); on('mtZoomOut', () => mtZoom(1 / 1.5)); on('mtFit', mtFit);
on('mtMix', mtMixToTab); on('mtSaveProj', saveProject); on('mtMixSave', mtMixSave); on('mtClose', mtClose);
window.addEventListener('resize', () => { if ($('mt').classList.contains('open')) mtRender(); });

/* ---------- Text to speech (eSpeak-NG compiled to WebAssembly, runs in the browser) ---------- */
const TTS_SOURCES = ['https://cdn.jsdelivr.net/npm/espeak-ng@1.0.2/dist/', 'https://unpkg.com/espeak-ng@1.0.2/dist/'];
let ttsEngine = null; // Promise<{ factory, wasmBinary }>
function loadTTS() {
  if (ttsEngine) return ttsEngine;
  ttsEngine = (async () => {
    let lastErr;
    for (const base of TTS_SOURCES) {
      try {
        $('ttsStatus').textContent = 'Downloading the speech engine (18 MB, first time only)…';
        const [mod, wasm] = await Promise.all([import(base + 'espeak-ng.js'), fetch(base + 'espeak-ng.wasm').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })]);
        return { factory: mod.default, wasmBinary: new Uint8Array(wasm) };
      } catch (e) { lastErr = e; }
    }
    ttsEngine = null;
    throw lastErr || new Error('Could not load the speech engine');
  })();
  return ttsEngine;
}
// eSpeak runs like its command-line tool: one run per sentence batch, writing a WAV file.
async function runEspeak(args, print) {
  const { factory, wasmBinary } = await loadTTS();
  return factory({ arguments: args, wasmBinary: wasmBinary.slice(0), print: print || (() => {}), printErr: () => {} });
}
const TTS_TOP = [['om', 'Afaan Oromoo'], ['ar', 'Arabic'], ['en-us', 'English (US)'], ['en', 'English (UK)'], ['am', 'Amharic'], ['so', 'Somali'], ['sw', 'Swahili'], ['fr', 'French'], ['tr', 'Turkish'], ['ur', 'Urdu'], ['id', 'Indonesian'], ['ms', 'Malay']];
let ttsVoicesLoaded = false;
async function fillTTSVoices() {
  const sel = $('ttsVoice');
  if (!sel.options.length) {
    const g1 = document.createElement('optgroup'); g1.label = 'Common';
    TTS_TOP.forEach(([v, l]) => g1.appendChild(new Option(l, v)));
    sel.appendChild(g1);
    try { const last = localStorage.getItem('ae-tts-voice'); if (last) sel.value = last; else sel.value = 'en-us'; } catch (e) { sel.value = 'en-us'; }
  }
  if (ttsVoicesLoaded) return;
  // Add every other language the engine has.
  const lines = [];
  await runEspeak(['--voices'], l => lines.push(l));
  const have = new Set(TTS_TOP.map(t => t[0])), g2 = document.createElement('optgroup'); g2.label = 'All languages';
  lines.slice(1).map(l => l.trim().split(/\s+/)).filter(p => p.length >= 4 && !have.has(p[1]))
    .map(p => [p[1], p[3].replace(/_/g, ' ')]).sort((a, b) => a[1].localeCompare(b[1]))
    .forEach(([v, l]) => g2.appendChild(new Option(l, v)));
  sel.appendChild(g2);
  ttsVoicesLoaded = true;
}
async function synthesize() {
  const text = $('ttsText').value.trim();
  if (!text) { toast('Type some text first.'); return null; }
  const voice = $('ttsVoice').value + $('ttsGender').value;
  try { localStorage.setItem('ae-tts-voice', $('ttsVoice').value); } catch (e) {}
  $('ttsStatus').textContent = 'Speaking…';
  const es = await runEspeak(['-v', voice, '-s', String(clamp(+$('ttsSpeed').value || 150, 80, 450)), '-p', String(clamp(+$('ttsPitch').value || 0, 0, 99)),
    '-g', String(clamp(+$('ttsGap').value || 0, 0, 50)), '-w', 'speech.wav', ' ' + text.replace(/\s+/g, ' ')]);
  const w = parseWav(es.FS.readFile('speech.wav'));
  $('ttsStatus').textContent = `Ready: ${fmt(w.ch[0].length / w.sr)} of speech.`;
  return w;
}
async function ttsDo(action) {
  const btns = ['ttsPlay', 'ttsNew', 'ttsInsert'].map($);
  btns.forEach(b => (b.disabled = true));
  try {
    const w = await synthesize();
    if (!w) return;
    if (action === 'play') {
      stopPreview(); stopPlay();
      const ctx = audio(); ctx.resume();
      const buf = ctx.createBuffer(1, w.ch[0].length, w.sr); buf.copyToChannel(w.ch[0], 0);
      const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(); previewSrc = src;
      return;
    }
    const name = 'Speech - ' + $('ttsText').value.trim().split(/\s+/).slice(0, 4).join(' ').replace(/[\\/:*?"<>|]+/g, '');
    $('ttsDlg').close();
    if (action === 'new' || !doc) { newDocument(makeDoc(w.sr, w.ch), name, false); dirty = true; refresh(); toast('Speech opened in a new tab'); return; }
    stopPlay();
    adoptFormat(w.sr, 1);
    const ins = w.sr === doc.sr ? w.ch : await resample(w.ch, w.sr, doc.sr);
    insertAt(ins, 'Text to speech');
  } catch (e) {
    console.error(e);
    $('ttsStatus').textContent = 'The speech engine could not be loaded — check your internet connection and try again.';
  } finally { btns.forEach(b => (b.disabled = false)); }
}
async function openTTS() {
  $('ttsDlg').showModal();
  $('ttsText').focus();
  $('ttsInsert').hidden = !doc;
  try { await fillTTSVoices(); $('ttsStatus').textContent = 'Speech engine ready.'; }
  catch (e) { console.error(e); $('ttsStatus').textContent = 'The speech engine could not be loaded — check your internet connection and try again.'; }
}
on('ttsPlay', () => ttsDo('play'));
on('ttsBtn2', openTTS);
on('ttsNew', () => ttsDo('new'));
on('ttsInsert', () => ttsDo('insert'));
on('ttsCancel', () => $('ttsDlg').close());
$('ttsDlg').addEventListener('close', stopPreview);

/* ---------- Filler words (um, uh, er…) ---------- */
// No speech recognition (that would mean uploading the audio): fillers are found acoustically.
// A filled pause is a stretch of sound that is almost all voiced, holds a very steady pitch,
// has no consonants (steady zero-crossing rate) and usually sits between two pauses.
function analyseSpeech(ch, sr) {
  const n = ch[0].length, d = Math.max(1, Math.floor(sr / 11025)), sr2 = sr / d, n2 = Math.floor(n / d);
  const x = new Float32Array(n2); // mono, decimated for the pitch tracker
  for (let i = 0; i < n2; i++) { let v = 0; for (let j = 0; j < d; j++) for (const c of ch) v += c[i * d + j]; x[i] = v / (d * ch.length); }
  const W = Math.round(sr2 * 0.04), H = Math.round(sr2 * 0.01), minL = Math.floor(sr2 / 400), maxL = Math.ceil(sr2 / 70);
  const frames = Math.max(0, Math.floor((n2 - W - maxL) / H));
  const db = new Float32Array(frames), f0 = new Float32Array(frames), zcr = new Float32Array(frames);
  const rw = Math.round(sr * 0.04), rh = Math.round(sr * 0.01);
  for (let f = 0; f < frames; f++) {
    const o = f * H;
    let e = 0; for (let i = 0; i < W; i++) e += x[o + i] * x[o + i];
    db[f] = 10 * Math.log10(e / W + 1e-12);
    // Zero crossings of the full-rate signal's slope: high when consonants (s, t, f…) are present.
    let z = 0, prev = 0; const ro = f * rh;
    for (let i = 1; i < rw && ro + i < n; i++) { let v = 0; for (const c of ch) v += c[ro + i] - c[ro + i - 1]; if ((v > 0) !== (prev > 0)) z++; prev = v; }
    zcr[f] = z / rw;
    if (db[f] < -55) continue;
    let best = 0, bestL = 0;
    for (let L = minL; L <= maxL; L++) {
      let num = 0, e1 = 0, e2 = 0;
      for (let i = 0; i < W; i++) { const a = x[o + i], b = x[o + i + L]; num += a * b; e1 += a * a; e2 += b * b; }
      const r = num / (Math.sqrt(e1 * e2) + 1e-12);
      if (r > best) { best = r; bestL = L; }
    }
    if (best > 0.6) f0[f] = sr2 / bestL;
  }
  return { db, f0, zcr, hop: rh, frames };
}
function findFillers(ch, sr, thresh) {
  const A = analyseSpeech(ch, sr), { db, f0, zcr, hop, frames } = A;
  if (!frames) return [];
  const loud = [...db].sort((p, q) => q - p)[Math.floor(frames * 0.05)] || -20;
  const gate = loud - 30; // "sound" = within 30 dB of the loud parts
  // Chunks of sound between pauses (gaps under 60 ms are bridged).
  const chunks = []; let st = -1, lastOn = -1;
  for (let f = 0; f <= frames; f++) {
    const on = f < frames && db[f] > gate;
    if (on) { if (st < 0) st = f; lastOn = f; }
    else if (st >= 0 && (f === frames || f - lastOn > 6)) { chunks.push([st, lastOn + 1]); st = -1; }
  }
  const out = [];
  chunks.forEach(([a, b], i) => {
    const dur = (b - a) * hop / sr;
    if (dur < 0.18 || dur > 1.6) return;
    const vs = [], zs = [];
    for (let f = a; f < b; f++) { zs.push(zcr[f]); if (f0[f]) vs.push(12 * Math.log2(f0[f] / 100)); }
    const voiced = vs.length / (b - a);
    if (voiced < 0.6) return;
    const med = vs.slice().sort((p, q) => p - q)[vs.length >> 1], v2 = vs.filter(v => Math.abs(v - med) < 6);
    const mean = v2.reduce((t, v) => t + v, 0) / v2.length, pitchSd = Math.sqrt(v2.reduce((t, v) => t + (v - mean) ** 2, 0) / v2.length);
    const zm = zs.reduce((t, v) => t + v, 0) / zs.length, zcv = Math.sqrt(zs.reduce((t, v) => t + (v - zm) ** 2, 0) / zs.length) / (zm || 1);
    const zmax = Math.max(...zs);
    const pb = i ? (a - chunks[i - 1][1]) * hop / sr : a * hop / sr, pa = i < chunks.length - 1 ? (chunks[i + 1][0] - b) * hop / sr : (frames - b) * hop / sr;
    const s1 = clamp((voiced - 0.6) / 0.3, 0, 1);            // almost all voiced
    const s2 = clamp((2.2 - pitchSd) / 1.6, 0, 1);            // flat pitch (semitones)
    const s3 = clamp((0.6 - zcv) / 0.45, 0, 1) * (zmax < zm * 2.5 ? 1 : 0.4); // no consonant bursts
    const s4 = (pb > 0.12 ? 0.5 : 0) + (pa > 0.12 ? 0.5 : 0); // pauses around it
    const score = s1 * s2 * Math.sqrt(s3) * (0.55 + 0.45 * s4);
    if (score >= thresh) out.push({ a: a * hop, b: Math.min(ch[0].length, b * hop + Math.round(sr * 0.03)), score, pb, pa, on: score >= thresh + 0.1 || thresh >= 0.5 });
  });
  return out;
}
let fillState = null;
function openFillers() {
  if (!doc || !len()) return;
  const [a, b] = range();
  if (b - a < doc.sr) { toast('Select at least 1 second of speech.'); return; }
  fillState = { a, b };
  $('fillScope').textContent = hasSel() ? `(selection, ${fmt((b - a) / doc.sr)})` : '(whole file)';
  $('fillDlg').showModal();
  scanFillers();
}
function scanFillers() {
  const { a, b } = fillState;
  $('fillList').innerHTML = '<li class="empty">Listening for ums and uhs…</li>';
  setTimeout(() => {
    const found = findFillers(sliceCh(doc.ch, a, b), doc.sr, parseFloat($('fillSens').value));
    fillState.items = found.map(f => ({ ...f, a: f.a + a, b: f.b + a }));
    renderFillers();
  }, 30);
}
function renderFillers() {
  const ul = $('fillList'), items = fillState.items; ul.innerHTML = '';
  if (!items.length) { ul.innerHTML = '<li class="empty">No filler sounds found. Try High sensitivity.</li>'; }
  items.forEach(it => {
    const li = document.createElement('li');
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = it.on; cb.onchange = () => { it.on = cb.checked; count(); };
    const t = document.createElement('span'); t.className = 'grow'; t.textContent = `${fmt(it.a / doc.sr)} · ${((it.b - it.a) / doc.sr).toFixed(2)} s`;
    const sc = document.createElement('span'); sc.className = 'sub'; sc.textContent = `${Math.round(it.score * 100)}% sure`;
    const play = document.createElement('button'); play.type = 'button'; play.className = 'btn'; play.textContent = '▶'; play.title = 'Listen (with a little around it)';
    play.onclick = () => playSnippet(Math.max(0, it.a - Math.round(doc.sr * 0.4)), Math.min(len(), it.b + Math.round(doc.sr * 0.4)));
    li.append(cb, t, sc, play); ul.appendChild(li);
  });
  const count = () => { const n = items.filter(i => i.on).length; $('fillCount').textContent = `${items.length} found · ${n} ticked`; $('fillApply').disabled = !n; };
  count();
}
function playSnippet(a, b) {
  stopPreview(); stopPlay();
  const ctx = audio(); ctx.resume();
  const out = sliceCh(doc.ch, a, b), buf = ctx.createBuffer(out.length, Math.max(1, out[0].length), doc.sr);
  out.forEach((c, i) => buf.copyToChannel(c, i));
  const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(); previewSrc = src;
}
function applyFillers() {
  const pick = fillState.items.filter(i => i.on);
  $('fillDlg').close();
  if (!pick.length) return;
  stopPlay();
  if ($('fillMode').value === 'silence') {
    const ch = doc.ch.map(c => { const o = c.slice(); for (const f of pick) o.fill(0, f.a, f.b); return o; });
    commit(makeDoc(doc.sr, ch, doc.markers.slice()), `Silenced ${pick.length} filler${pick.length === 1 ? '' : 's'}`);
    return;
  }
  // Cut each filler and shorten the pauses around it so the gap left is about 0.25 s.
  const keepGap = 0.25, cuts = pick.map(f => {
    const extra = Math.max(0, f.pb + f.pa - keepGap) / 2;
    return [Math.max(0, f.a - Math.round(Math.min(f.pb, extra) * doc.sr)), Math.min(len(), f.b + Math.round(Math.min(f.pa, extra) * doc.sr))];
  }).sort((x, y) => x[0] - y[0]);
  const keep = []; let from = 0;
  for (const [a, b] of cuts) { if (a > from) keep.push([from, a]); from = Math.max(from, b); }
  if (from < len()) keep.push([from, len()]);
  const removed = len() - keep.reduce((t, [a, b]) => t + b - a, 0);
  selA = selB = null; cursor = 0;
  commit(makeDoc(doc.sr, keepRangesCh(doc.ch, doc.sr, keep), mapMarkers(doc.markers, keep)),
    `Removed ${pick.length} filler${pick.length === 1 ? '' : 's'} (${(removed / doc.sr).toFixed(1)} s shorter)`);
  zoomFit();
}
$('fillSens').addEventListener('change', scanFillers);
on('fillScan', scanFillers);
on('fillCancel', () => $('fillDlg').close());
on('fillApply', applyFillers);
$('fillDlg').addEventListener('close', stopPreview);

/* ---------- Beat detection ---------- */
// Onset strength (spectral flux) → tempo from its autocorrelation (weighted towards
// 120 BPM) → beat positions from the best-fitting phase of that pulse.
const BEAT_N = 1024, BEAT_H = 512;
function onsetEnvelope(ch, sr, a, b) {
  const n = b - a, frames = Math.max(0, Math.floor((n - BEAT_N) / BEAT_H));
  const win = new Float64Array(BEAT_N); for (let i = 0; i < BEAT_N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / BEAT_N);
  const re = new Float64Array(BEAT_N), im = new Float64Array(BEAT_N), prev = new Float64Array(BEAT_N / 2), env = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    const st = a + f * BEAT_H;
    for (let i = 0; i < BEAT_N; i++) { let v = 0; for (const c of ch) v += c[st + i]; re[i] = v * win[i]; im[i] = 0; }
    fft(re, im, false);
    let flux = 0;
    for (let k = 1; k < BEAT_N / 2; k++) { const m = Math.log1p(100 * Math.hypot(re[k], im[k])); if (f) flux += Math.max(0, m - prev[k]); prev[k] = m; }
    env[f] = flux;
  }
  // Remove the slowly varying loudness so only the "hits" remain.
  const w = Math.round(sr / BEAT_H * 0.4), pre = new Float64Array(frames + 1);
  for (let i = 0; i < frames; i++) pre[i + 1] = pre[i] + env[i];
  const out = new Float64Array(frames);
  for (let i = 0; i < frames; i++) { const x0 = Math.max(0, i - w), x1 = Math.min(frames, i + w + 1); out[i] = Math.max(0, env[i] - (pre[x1] - pre[x0]) / (x1 - x0)); }
  // Compress: a soft kick and a loud snare should count almost equally, otherwise the loud
  // hit on every other beat makes the tempo come out at half speed.
  const mx = Math.max(...out) || 1;
  for (let i = 0; i < frames; i++) out[i] = Math.sqrt(out[i] / mx);
  return out;
}
function tempoFromEnvelope(env, fr) {
  const ac = L => { let s = 0; for (let i = 0; i + L < env.length; i++) s += env[i] * env[i + L]; return s / (env.length - L); };
  const lo = Math.floor(fr * 60 / 220), hi = Math.ceil(fr * 60 / 50);
  const vals = []; for (let L = lo; L <= hi + 1; L++) vals[L] = ac(L);
  let best = lo, bestScore = -Infinity;
  for (let L = lo; L <= hi; L++) {
    const bpm = 60 * fr / L, wgt = Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.7) ** 2); // prefer 80–180 BPM
    const sc = vals[L] * wgt; if (sc > bestScore) { bestScore = sc; best = L; }
  }
  const y0 = vals[best - 1] ?? vals[best], y1 = vals[best], y2 = vals[best + 1] ?? vals[best];
  const d = (y0 - 2 * y1 + y2) ? clamp((y0 - y2) / (2 * (y0 - 2 * y1 + y2)), -0.5, 0.5) : 0;
  const mean = vals.slice(lo, hi + 1).reduce((t, v) => t + v, 0) / (hi - lo + 1);
  return { bpm: 60 * fr / (best + d), strength: y1 / (mean || 1) };
}
function beatTimes(env, fr, bpm) {
  const P = fr * 60 / bpm;
  let bestO = 0, bestS = -1;
  for (let o = 0; o < P; o += 0.25) { let sc = 0; for (let t = o; t < env.length; t += P) sc += env[Math.round(t)] || 0; if (sc > bestS) { bestS = sc; bestO = o; } }
  const out = []; for (let t = bestO; t < env.length; t += P) out.push(t);
  return out; // in frames
}
let beatState = null;
function openBeats() {
  if (!doc || !len()) return;
  const [a, b] = range();
  if (b - a < doc.sr * 4) { toast('Select at least 4 seconds of music to detect the beat.'); return; }
  busy(true);
  setTimeout(() => {
    try {
      const env = onsetEnvelope(doc.ch, doc.sr, a, b), fr = doc.sr / BEAT_H, t = tempoFromEnvelope(env, fr);
      beatState = { a, env, fr, bpm: Math.round(t.bpm * 10) / 10, strength: t.strength };
      $('beatScope').textContent = hasSel() ? `(selection, ${fmt((b - a) / doc.sr)})` : '(whole file)';
      $('beatBpm').value = beatState.bpm;
      updateBeats();
      $('beatDlg').showModal(); drawBeats();
    } finally { busy(false); }
  }, 30);
}
function updateBeats() {
  const st = beatState;
  st.bpm = clamp(parseFloat($('beatBpm').value) || st.bpm, 40, 240);
  // Frame f covers samples [f·H, f·H + N): place each beat at the frame centre.
  st.beats = beatTimes(st.env, st.fr, st.bpm).map(f => Math.round(st.a + f * BEAT_H + BEAT_N / 2)).filter(x => x < len());
  $('beatResult').textContent = `${st.bpm.toFixed(1)} BPM`;
  const clear = st.strength > 2.2 ? 'a clear, steady beat' : st.strength > 1.4 ? 'a fairly steady beat' : 'no clear beat (speech or free rhythm?)';
  $('beatInfo').textContent = `${st.beats.length} beats found · ${clear}. If it sounds twice too fast or slow, use ½× or 2×.`;
}
function drawBeats() {
  const cv = $('beatGraph'), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g2 = cv.getContext('2d'); g2.setTransform(dpr, 0, 0, dpr, 0, 0);
  g2.fillStyle = css('--wave-bg'); g2.fillRect(0, 0, W, H);
  const st = beatState, show = Math.min(st.env.length, Math.round(st.fr * 12)), mx = Math.max(...st.env.subarray(0, show)) || 1;
  g2.fillStyle = 'rgba(46,107,88,.55)';
  for (let x = 0; x < W; x++) { const f = Math.floor(x / W * show), h = (H - 22) * st.env[f] / mx; g2.fillRect(x, H - 16 - h, 1, h); }
  g2.fillStyle = ENV_COL;
  st.beats.forEach((s, i) => { const f = (s - st.a - BEAT_N / 2) / BEAT_H; if (f > show) return; const x = f / show * W; g2.fillRect(x - 1, 0, i % 4 ? 1.5 : 3, H - 16); });
  g2.font = '10px ' + css('--ui'); g2.fillStyle = css('--muted');
  for (let t = 0; t <= show / st.fr; t += 2) g2.fillText(t + ' s', t * st.fr / show * W + 2, H - 4);
  const cap = 'first 12 s · green = note onsets · orange = beats (thick = start of a bar)';
  g2.fillStyle = css('--chip'); g2.fillRect(2, 1, g2.measureText(cap).width + 8, 14);
  g2.fillStyle = css('--muted'); g2.fillText(cap, 6, 11);
}
function playWithClick() {
  const st = beatState; stopPreview(); stopPlay();
  const a = st.a, b = Math.min(len(), a + doc.sr * 20), out = sliceCh(doc.ch, a, b);
  const clickLen = Math.round(doc.sr * 0.02);
  st.beats.forEach((s, i) => {
    const o = s - a; if (o < 0 || o >= out[0].length) return;
    const f = i % 4 ? 1500 : 2500;
    for (const c of out) for (let j = 0; j < clickLen && o + j < c.length; j++) c[o + j] = clamp(c[o + j] * 0.6 + 0.5 * Math.sin(2 * Math.PI * f * j / doc.sr) * (1 - j / clickLen), -1, 1);
  });
  const ctx = audio(); ctx.resume();
  const buf = ctx.createBuffer(out.length, out[0].length, doc.sr); out.forEach((c, i) => buf.copyToChannel(c, i));
  const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(); previewSrc = src;
}
function beatMarkers(every) {
  const st = beatState, pts = st.beats.filter((_, i) => i % every === 0).filter(x => x > 0 && x < len());
  $('beatDlg').close();
  const merged = [...new Set([...doc.markers, ...pts])].sort((x, y) => x - y);
  commit(makeDoc(doc.sr, doc.ch, merged), `Added ${pts.length} beat markers`);
}
$('beatBpm').addEventListener('change', () => { updateBeats(); drawBeats(); });
on('beatHalf', () => { $('beatBpm').value = (beatState.bpm / 2).toFixed(1); updateBeats(); drawBeats(); });
on('beatDouble', () => { $('beatBpm').value = (beatState.bpm * 2).toFixed(1); updateBeats(); drawBeats(); });
on('beatClick', playWithClick);
on('beatMarkBeats', () => beatMarkers(1));
on('beatMarkBars', () => beatMarkers(4));
on('beatClose', () => $('beatDlg').close());
$('beatDlg').addEventListener('close', stopPreview);

/* ---------- Save As, Save All, Close All, projects ---------- */
async function saveAs() {
  if (!doc || !len()) return;
  const v = await askParams('Save file as', 'Choose a name and format. The file downloads to your computer.', [
    { id: 'name', label: 'File name', type: 'text', value: baseName() },
    { id: 'fmt', label: 'Format', type: 'select', value: saveFormat(), options: formatOptions() },
    { id: 'kbps', label: 'Quality (MP3, OGG, M4A)', type: 'select', value: $('kbpsSel').value, options: [['96', '96 kbps'], ['128', '128 kbps'], ['192', '192 kbps'], ['320', '320 kbps']] },
  ], { ok: 'Save' });
  if (!v) return;
  $('fileName').value = v.name.trim() || baseName(); $('fmtSel').value = v.fmt; $('kbpsSel').value = v.kbps; syncFormat(); renderTabs();
  exportAll();
}
async function saveAll() {
  stashTab();
  const list = tabs.filter(t => t.doc && t.doc.ch[0].length);
  if (!list.length) return;
  await withBusy('Encoding…', async () => {
    const files = [], used = new Set();
    for (let i = 0; i < list.length; i++) {
      busyText(`Encoding ${i + 1} of ${list.length}…`);
      let name = (list[i].name || 'audio').replace(/[\\/:*?"<>|]+/g, '_');
      while (used.has(name)) name += '-' + (i + 1);
      used.add(name);
      files.push({ name: name + ext(), data: await encode(list[i].doc.ch, list[i].doc.sr) });
      list[i].dirty = false;
    }
    if (active) dirty = active.dirty;
    const url = URL.createObjectURL(makeZip(files));
    const link = document.createElement('a'); link.href = url; link.download = 'all-files.zip';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    renderTabs(); toast(`Saved ${files.length} files`);
  });
}
function closeAll() {
  stashTab();
  if (!tabs.length) return;
  if (tabs.some(t => t.dirty) && !confirm('Close all files? Unsaved edits will be lost.')) return;
  while (tabs.length) closeTab(active || tabs[0], true);
}
// 32-bit float WAV: lossless, used for projects.
function encodeWavFloat(ch, sr) {
  const n = ch[0].length, nc = ch.length, bytes = n * nc * 4, buf = new ArrayBuffer(44 + bytes), v = new DataView(buf);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + bytes, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 3, true); v.setUint16(22, nc, true); v.setUint32(24, sr, true); v.setUint32(28, sr * nc * 4, true); v.setUint16(32, nc * 4, true); v.setUint16(34, 32, true);
  str(36, 'data'); v.setUint32(40, bytes, true);
  let o = 44;
  for (let i = 0; i < n; i++) for (let k = 0; k < nc; k++) { v.setFloat32(o, ch[k][i], true); o += 4; }
  return new Uint8Array(buf);
}
function parseWav(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let o = 12, fmtTag = 1, nc = 1, sr = 44100, bits = 16, data = null;
  while (o + 8 <= v.byteLength) {
    const id = String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3)), size = v.getUint32(o + 4, true);
    if (id === 'fmt ') { fmtTag = v.getUint16(o + 8, true); nc = v.getUint16(o + 10, true); sr = v.getUint32(o + 12, true); bits = v.getUint16(o + 22, true); }
    if (id === 'data') data = [o + 8, size];
    o += 8 + size + (size & 1);
  }
  if (!data) throw new Error('No audio data');
  const bps = bits / 8, n = Math.floor(data[1] / (bps * nc)), ch = Array.from({ length: nc }, () => new Float32Array(n));
  for (let i = 0, p = data[0]; i < n; i++) for (let k = 0; k < nc; k++, p += bps)
    ch[k][i] = fmtTag === 3 ? v.getFloat32(p, true) : v.getInt16(p, true) / 32768;
  return { sr, ch };
}
function unzipStored(buf) {
  const v = new DataView(buf), files = {}, dec = new TextDecoder();
  let o = 0;
  while (o + 30 <= v.byteLength && v.getUint32(o, true) === 0x04034b50) {
    const method = v.getUint16(o + 8, true), size = v.getUint32(o + 18, true), nl = v.getUint16(o + 26, true), xl = v.getUint16(o + 28, true);
    const name = dec.decode(new Uint8Array(buf, o + 30, nl)), start = o + 30 + nl + xl;
    if (method !== 0) throw new Error('Compressed zip');
    files[name] = new Uint8Array(buf, start, size);
    o = start + size;
  }
  return files;
}
// Tags go into project.json; a cover picture is stored as base64 text.
function tagsToJSON(t) {
  if (!t) return undefined;
  const { cover, ...rest } = t;
  if (!cover) return rest;
  let bin = ''; for (let i = 0; i < cover.data.length; i += 0x8000) bin += String.fromCharCode.apply(null, cover.data.subarray(i, i + 0x8000));
  return { ...rest, cover: { mime: cover.mime, b64: btoa(bin) } };
}
function tagsFromJSON(t) {
  if (!t) return undefined;
  const { cover, ...rest } = t;
  if (!cover) return rest;
  const bin = atob(cover.b64), data = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
  return { ...rest, cover: { mime: cover.mime, data } };
}
async function saveProject() {
  stashTab();
  const list = tabs.filter(t => t.doc);
  if (!list.length && !mt.clips.length) return;
  await withBusy('Saving project…', async () => {
    const meta = { app: 'diinislaam-audio-editor', version: 2, active: list.indexOf(active), tabs: [] }, files = [];
    // Each piece of audio is stored once: a multitrack clip made from a tab reuses that tab's file.
    const written = new Map(); // first channel array → file name
    const store = (ch, sr, name) => {
      if (written.has(ch[0])) return written.get(ch[0]);
      written.set(ch[0], name); files.push({ name, data: encodeWavFloat(ch, sr) }); return name;
    };
    list.forEach((t, i) => meta.tabs.push({ name: t.name, sr: t.doc.sr, markers: t.doc.markers, labels: t.doc.labels, tags: tagsToJSON(t.tags), file: store(t.doc.ch, t.doc.sr, `tab${i + 1}.wav`) }));
    if (mt.tracks.length) {
      let n = 0;
      meta.multitrack = {
        pps: mt.pps, scroll: mt.scroll, playhead: mt.playhead, markers: mt.markers, loop: mt.loop, looping: mt.looping,
        tracks: mt.tracks.map(({ id, name, vol, pan, mute, solo, color }) => ({ id, name, vol, pan, mute, solo, color })),
        clips: mt.clips.map(({ src, ...c }) => ({ ...c, srcName: src.name, file: store(src.ch, src.sr, `clip${++n}.wav`) })),
      };
    }
    files.unshift({ name: 'project.json', data: new TextEncoder().encode(JSON.stringify(meta, null, 1)) });
    const url = URL.createObjectURL(makeZip(files));
    const link = document.createElement('a'); link.href = url; link.download = (list.length ? baseName() : 'multitrack') + '-project.zip';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    const mtNote = mt.clips.length ? ` and the multitrack session (${mt.tracks.length} tracks, ${mt.clips.length} clips)` : '';
    toast(`Project saved: ${list.length} tab${list.length === 1 ? '' : 's'}${mtNote}`);
  });
}
async function openProject(file) {
  busy(true);
  try {
    const files = unzipStored(await file.arrayBuffer());
    const meta = JSON.parse(new TextDecoder().decode(files['project.json'] || new Uint8Array()));
    if (meta.app !== 'diinislaam-audio-editor') throw new Error('not a project');
    const parsed = new Map(); // file name → { sr, ch } (read once, shared by tabs and clips)
    const load = f => { if (!parsed.has(f)) parsed.set(f, parseWav(files[f])); return parsed.get(f); };
    const made = [];
    for (const t of meta.tabs) {
      const w = load(t.file);
      const d = makeDoc(w.sr, w.ch, (t.markers || []).filter(m => m > 0 && m < w.ch[0].length));
      if (t.labels) d.labels = t.labels;
      newDocument(d, t.name, false);
      active.tags = tagsFromJSON(t.tags);
      made.push(active);
    }
    if (made[meta.active]) showTab(made[meta.active]);
    let mtNote = '';
    if (meta.multitrack) {
      if (!mt.clips.length || confirm('This project has a multitrack session. Replace the multitrack session you have open now?')) {
        mtStopNodes();
        const m = meta.multitrack;
        mt.tracks = m.tracks.map(t => ({ ...t }));
        mt.clips = m.clips.map(({ file: f, srcName, ...c }) => { const w = load(f); return { ...c, src: { name: srcName || c.name, sr: w.sr, ch: w.ch } }; });
        mt.pps = m.pps || 60; mt.scroll = m.scroll || 0; mt.playhead = m.playhead || 0;
        mt.markers = m.markers || []; mt.loop = m.loop || null; mt.looping = !!m.looping && !!m.loop; mt.picked = new Set();
        mt.nextId = Math.max(0, ...mt.tracks.map(t => t.id), ...mt.clips.map(c => c.id)) + 1;
        mt.undo = []; mt.redo = []; mt.sel = null; mt.selTrack = mt.tracks[0] ? mt.tracks[0].id : null;
        mtNote = ` and a multitrack session (${mt.tracks.length} tracks, ${mt.clips.length} clips) — open it with Tools ▸ Multitrack Editor`;
      }
    }
    toast(`Opened project: ${made.length} tab${made.length === 1 ? '' : 's'}${mtNote}`);
  } catch (e) { console.error(e); toast(`“${file.name}” is not a project saved by this editor.`); }
  finally { busy(false); }
}
$('projIn').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) openProject(f); });
function showHistory() {
  const panel = $('histList').closest('.panel');
  document.body.classList.remove('compact');
  panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  panel.classList.remove('flash'); void panel.offsetWidth; panel.classList.add('flash');
}
function toggleView(cls) {
  document.body.classList.toggle(cls);
  try { localStorage.setItem('ae-view-' + cls, document.body.classList.contains(cls) ? '1' : ''); } catch (e) {}
  if (doc) { clampView(); draw(); }
}
try { for (const c of ['compact', 'tall', 'no-overview']) if (localStorage.getItem('ae-view-' + c)) document.body.classList.add(c); } catch (e) {}

/* ---------- Help page ---------- */
const HELP_TUTORIALS = [
  ['t-open', 'Open, play and save a file'], ['t-record', 'Record from the microphone'], ['t-edit', 'Cut, copy, paste and delete'],
  ['t-trim', 'Trim silence (Auto trim)'], ['t-split', 'Split a recitation into lines'], ['t-times', 'Timestamps and links'], ['t-join', 'Join audio files'],
  ['t-fade', 'Fade in and fade out'], ['t-volume', 'Volume: amplify, normalise, envelope'], ['t-clean', 'Clean up a voice recording'],
  ['t-transcript', 'Transcribe and edit by text'], ['t-filler', 'Remove filler words'], ['t-effects', 'Equaliser and sound effects'], ['t-tempo', 'Slow down a recitation'],
  ['t-tabs', 'Work with several files'], ['t-ringtone', 'Make a ringtone'], ['t-music', 'Key and beat detection'],
  ['t-multi', 'Multitrack editor'], ['t-tts', 'Text to speech'], ['t-batch', 'Batch convert many files'], ['t-safe', 'Autosave, offline use and installing'], ['t-look', 'Language, dark mode, touch, shortcuts'], ['t-project', 'Save your work and continue later'],
];
// Opens in a new tab so the editor (and unsaved audio) stays open.
function openHelp(id) { window.open('help.html' + (id ? '#' + id : ''), '_blank', 'noopener'); }

/* ---------- Menu bar ---------- */
const has = {
  doc: () => !!doc, audio: () => !!doc && len() > 0, sel: () => hasSel(), clip: () => !!clip && !!doc,
  stereo: () => !!doc && doc.ch.length === 2, mono: () => !!doc && doc.ch.length === 1 && len() > 0,
  markers: () => !!doc && doc.markers.length > 0, tabs: () => tabs.length > 0, many: () => tabs.length > 1,
};
const fadeTypes = [['linear', 'Linear'], ['smooth', 'Smooth (default)'], ['fast', 'Fast start'], ['scurve', 'S-curve']];
const MENUS = [
  { label: 'File', items: [
    { label: 'New File', key: 'N', run: newEmpty },
    { label: 'Open File…', key: 'Ctrl+O', run: () => $('fileIn').click() },
    { label: 'Recent Files', sub: async () => { const r = await recentAll(); return r.length ? r.map(x => ({ label: x.name, run: () => loadFile(new File([x.blob], x.name, { type: x.type }), { remember: false }) })) : [{ label: 'No recent files', en: () => false }]; } },
    '-',
    { label: 'Save File', key: 'Ctrl+S', run: exportAll, en: has.audio },
    { label: 'Save File As…', key: 'Ctrl+Shift+S', run: saveAs, en: has.audio },
    { label: 'Save Selected Region As…', run: exportSel, en: has.sel },
    { label: 'Save All Files (.zip)', run: saveAll, en: has.tabs },
    { label: 'Save Format', sub: () => formatOptions().map(([v, l]) => ({ label: l, check: () => saveFormat() === v, run: () => { $('fmtSel').value = v; syncFormat(); } })) },
    '-',
    { label: 'Open Project…', run: () => $('projIn').click() },
    { label: 'Save Project', run: saveProject, en: () => tabs.length > 0 || mt.clips.length > 0 },
    '-',
    { label: 'Join Audio Files…', run: () => openJoin(true) },
    { label: 'Batch Converter…', run: () => $('batchFileIn').click() },
    '-',
    { label: 'Close File', run: () => active && closeTab(active), en: has.tabs },
    { label: 'Close All', run: closeAll, en: has.tabs },
  ] },
  { label: 'Edit', items: [
    { label: 'Undo', key: 'Ctrl+Z', run: undo, en: () => undoStack.length > 0 },
    { label: 'Redo', key: 'Ctrl+Y', run: redo, en: () => redoStack.length > 0 },
    { label: 'History Manager', run: showHistory, en: has.doc },
    '-',
    { label: 'Cut', key: 'Ctrl+X', run: cmdCut, en: has.sel },
    { label: 'Copy', key: 'Ctrl+C', run: cmdCopy, en: has.sel },
    { label: 'Duplicate', key: 'Ctrl+D', run: duplicate, en: has.audio },
    { label: 'Paste', key: 'Ctrl+V', run: cmdPaste, en: has.clip },
    { label: 'Paste Mix', key: 'Ctrl+Shift+V', run: cmdPasteMix, en: has.clip },
    { label: 'Delete', key: 'Del', run: () => cmdDelete(), en: has.sel },
    '-',
    { label: 'Select', sub: () => [
      { label: 'All', key: 'Ctrl+A', run: () => selectPart('all'), en: has.audio },
      { label: 'None', key: 'Esc', run: () => selectPart('none'), en: has.sel },
      { label: 'Start to Cursor', run: () => selectPart('start'), en: has.audio },
      { label: 'Cursor to End', run: () => selectPart('end'), en: has.audio },
      { label: 'Part Between Markers', run: () => selectPart('part'), en: has.markers },
    ] },
    { label: 'Jump to Location…', key: 'G', run: jumpTo, en: has.audio },
    '-',
    { label: 'Repeat Loop…', run: repeatLoop, en: has.sel },
    { label: 'Mix with File…', run: openMixDialog, en: has.doc },
    { label: 'Insert File…', run: () => $('insFileIn').click(), en: has.doc },
    { label: 'Silence', sub: () => [
      { label: 'Silence Selection', run: silence, en: has.sel },
      { label: 'Insert Silence…', run: async () => { const v = await askParams('Insert silence', 'Inserted at the cursor.', [{ id: 's', label: 'Length', value: parseFloat($('insSilIn').value) || 1, min: 0.01, max: 600, step: 0.25, unit: 'seconds' }], { ok: 'Insert' }); if (v) { $('insSilIn').value = v.s; insertSilence(); } }, en: has.doc },
    ] },
    { label: 'Trim', sub: () => [
      { label: 'Trim to Selection', key: 'T', run: cmdTrim, en: has.sel },
      { label: 'Auto Trim…', run: autoTrim, en: has.audio },
    ] },
    { label: 'Cleanup', sub: () => [
      { label: 'Grab Noise Sample', run: grabNoise, en: has.sel },
      { label: 'Noise Reduction…', run: fxNoise, en: has.audio },
      { label: 'Noise Gate…', run: fxGate, en: has.audio },
      { label: 'Click / Pop Removal…', run: removeClicks, en: has.audio },
      { label: 'Remove Rumble…', run: fxHighpass, en: has.audio },
      { label: 'Remove Hiss…', run: fxLowpass, en: has.audio },
    ] },
    { label: 'Redact / Beep…', run: redact, en: has.sel },
    '-',
    { label: 'Split File', sub: () => [
      { label: 'Split into Tabs (at markers or cursor)', run: splitIntoTabs, en: has.audio },
      { label: 'Split at Pauses into Tabs', run: () => { autoSplit(); if (doc && doc.markers.length) splitIntoTabs(); }, en: has.audio },
    ] },
    { label: 'Join Audio…', run: () => openJoin(false) },
    { label: 'Convert', sub: () => [
      { label: 'Make Mono', run: makeMono, en: has.stereo },
      { label: 'Make Stereo', run: makeStereo, en: has.mono },
      { label: 'Swap Left / Right', run: swapChannels, en: has.stereo },
      { label: 'Sample Rate…', run: fxSampleRate, en: has.audio },
    ] },
  ] },
  { label: 'Effects', items: [
    { label: 'Amplify…', key: 'Shift+A', run: amplifyDlg, en: has.audio },
    { label: 'Normalize', key: 'Shift+N', run: normalise, en: has.audio },
    { label: 'Mute Channel', sub: () => [
      { label: 'Left', run: () => muteChannel(0), en: has.stereo },
      { label: 'Right', run: () => muteChannel(1), en: has.stereo },
    ] },
    '-',
    { label: 'Fade In', key: 'I', run: fadeIn, en: has.audio },
    { label: 'Fade Out', key: 'O', run: fadeOut, en: has.audio },
    { label: 'Fade In & Out Selection', run: fadeInOut, en: has.sel },
    { label: 'Fade Type', sub: () => fadeTypes.map(([v, l]) => ({ label: l, check: () => fadeCurve === v, run: () => { fadeCurve = v; toast('Fade type: ' + l); } })) },
    { label: 'Envelope…', key: 'E', run: envStart, en: has.audio },
    { label: 'Stereo Pan…', run: stereoPan, en: has.audio },
    '-',
    { label: 'Equalizer…', run: fxEqualiser, en: has.audio },
    { label: 'Echo…', run: fxEcho, en: has.audio },
    { label: 'Reverb…', run: fxReverb, en: has.audio },
    { label: 'Compressor…', run: fxCompressor, en: has.audio },
    { label: 'Pitch…', run: fxPitch, en: has.audio },
    { label: 'Tempo…', run: fxTempo, en: has.audio },
    { label: 'Speed…', run: fxSpeed, en: has.audio },
    '-',
    { label: 'Reverse', run: reverse, en: has.audio },
    { label: 'Invert', run: invert, en: has.audio },
    { label: 'Silence', run: silence, en: has.audio },
  ] },
  { label: 'Control', items: [
    { label: 'Play / Pause', key: 'Space', run: togglePlay, en: has.audio },
    { label: 'Stop', run: () => { stopPlay(); refresh(); }, en: has.audio },
    { label: 'Record / Stop Recording', key: 'R', run: () => toggleRecord() },
    { label: 'Loop Selection', key: 'L', check: () => loop, run: () => { loop = !loop; if (player) play(); refresh(); }, en: has.doc },
    '-',
    { label: 'Go to Start', key: 'Home', run: () => { stopPlay(); cursor = 0; viewStart = 0; clampView(); refresh(); }, en: has.audio },
    { label: 'Go to End', key: 'End', run: () => { stopPlay(); cursor = len(); viewStart = len(); clampView(); refresh(); }, en: has.audio },
    { label: 'Back 5 Seconds', key: ',', run: () => seekBy(-5), en: has.audio },
    { label: 'Forward 5 Seconds', key: '.', run: () => seekBy(5), en: has.audio },
    { label: 'Playback Speed', sub: () => ['0.5', '0.75', '1', '1.25', '1.5', '2'].map(r => ({ label: r + '×', check: () => $('rateSel').value === r, run: () => { $('rateSel').value = r; $('rateSel').dispatchEvent(new Event('change')); } })) },
  ] },
  { label: 'Tools', items: [
    { label: 'Frequency Analysis (FFT)…', run: openFFT, en: has.audio },
    { label: 'Find Peak Sample', run: findPeak, en: has.audio },
    { label: 'Key Detector…', run: () => openKey(false), en: has.audio },
    { label: 'Key Changer…', run: () => openKey(true), en: has.audio },
    { label: 'Automatic Beat Detection…', run: openBeats, en: has.audio },
    { label: 'Remove Filler Words (um, uh)…', run: openFillers, en: has.audio },
    { label: 'Text to Speech…', run: openTTS },
    { label: 'Multitrack Editor…', key: 'Ctrl+M', run: openMultitrack },
    '-',
    { label: 'Noise Removal…', run: fxNoise, en: has.audio },
    { label: 'Click / Pop Removal…', run: removeClicks, en: has.audio },
    '-',
    { label: 'Generate Tone…', run: generate, en: has.doc },
    { label: 'Create Ringtone…', run: createRingtone, en: has.audio },
    { label: 'Batch Converter…', run: () => $('batchFileIn').click() },
  ] },
  { label: 'Bookmark', items: [
    { label: 'Add Marker at Cursor', key: 'M', run: addMarker, en: has.audio },
    { label: 'Next Marker', key: "'", run: () => gotoMarker(1), en: has.markers },
    { label: 'Previous Marker', key: ';', run: () => gotoMarker(-1), en: has.markers },
    { label: 'Auto-split at Pauses', run: autoSplit, en: has.audio },
    { label: 'Markers on Beats…', run: openBeats, en: has.audio },
    { label: 'Clear All Markers', run: () => commit(makeDoc(doc.sr, doc.ch, []), 'Markers cleared'), en: has.markers },
    '-',
    { label: 'Save All Parts (.zip)', run: exportZip, en: has.markers },
    { label: 'Split Parts into Tabs', run: splitIntoTabs, en: has.markers },
  ] },
  { label: 'View', items: [
    { label: 'Zoom In', key: '+', run: () => zoomAt(0.5), en: has.audio },
    { label: 'Zoom Out', key: '−', run: () => zoomAt(2), en: has.audio },
    { label: 'Zoom to Selection', key: 'Z', run: zoomSel, en: has.sel },
    { label: 'Zoom to Fit', key: 'F', run: zoomFit, en: has.audio },
    '-',
    { label: 'Overview Bar', check: () => !document.body.classList.contains('no-overview'), run: () => toggleView('no-overview') },
    { label: 'Taller Waveform', check: () => document.body.classList.contains('tall'), run: () => toggleView('tall') },
    { label: 'Show Effects & Tools Panels', check: () => !document.body.classList.contains('compact'), run: () => toggleView('compact') },
    '-',
    { label: 'Next Tab', key: ']', run: () => switchTab(1), en: has.many },
    { label: 'Previous Tab', key: '[', run: () => switchTab(-1), en: has.many },
  ] },
  { label: 'Voice', items: [
    { mhead: 'One-click voice tools' },
    { label: 'Text to Speech…', run: openTTS, title: 'Type text and turn it into speech' },
    { label: 'Remove Filler Words (um, uh)…', run: openFillers, en: has.audio, title: 'Find and remove hesitation sounds' },
    { label: 'Voice Cleanup', run: voiceCleanup, en: has.audio, title: 'Remove rumble → reduce noise → even out volume → normalise' },
    { label: 'Audio Enhancer', run: audioEnhancer, en: has.audio, title: 'Clearer, fuller, evenly loud voice' },
    { label: 'Amplify Vocals', run: amplifyVocals, en: has.audio, title: 'Brings the voice forward' },
    { label: 'Isolate Voice', run: isolateVoice, en: has.audio, title: 'Keeps the centre and the speech frequencies' },
    { label: 'Reduce Voice (karaoke)', run: reduceVoice, en: has.stereo, title: 'Removes centre-panned vocals from stereo music' },
    '-',
    { label: 'Pitch (higher / lower voice)…', run: fxPitch, en: has.audio },
    { label: 'Tempo (slower / faster, same voice)…', run: fxTempo, en: has.audio },
  ] },
  { label: 'Help', items: [
    { label: 'Help & Tutorials (full page)', key: 'F1', run: () => openHelp('') },
    { label: 'Tutorials', sub: () => HELP_TUTORIALS.map(([id, label]) => ({ label, run: () => openHelp(id) })) },
    { label: 'Menu Reference', run: () => openHelp('menus') },
    { label: 'Guide & Keyboard Shortcuts', key: '?', run: openGuide },
    '-',
    { label: 'About', run: () => toast('Audio Editor — Diin Islaam. Everything runs in your browser; your audio is never uploaded.') },
  ] },
];

let openMenus = []; // [{ el, level }]
const menuOpen = () => openMenus.length > 0;
function closeMenus(fromLevel = 0) {
  openMenus.filter(m => m.level >= fromLevel).forEach(m => m.el.remove());
  openMenus = openMenus.filter(m => m.level < fromLevel);
  if (!fromLevel) document.querySelectorAll('#menuBar > button.open').forEach(b => b.classList.remove('open'));
}
// On narrow (phone) screens submenus open inline under their item instead of flying out.
const narrowMenus = () => innerWidth < 600;
// Hooks for other files: tr translates a label, menuKey gives the shortcut shown for an item.
let tr = s => s, menuKey = it => it.key;
function fillMenu(el, items, level) {
  items.forEach(it => {
    if (it === '-') { const d = document.createElement('div'); d.className = 'sep'; el.appendChild(d); return; }
    if (it.mhead) { const d = document.createElement('div'); d.className = 'mhead'; d.setAttribute('role', 'presentation'); d.textContent = tr(it.mhead); el.appendChild(d); return; }
    const d = document.createElement('div'); d.className = 'mi'; d.tabIndex = -1;
    const enabled = !it.en || it.en();
    d.setAttribute('role', it.check ? 'menuitemcheckbox' : 'menuitem');
    if (!enabled) { d.classList.add('dis'); d.setAttribute('aria-disabled', 'true'); }
    if (it.check) { const on = !!it.check(); d.classList.toggle('chk', on); d.setAttribute('aria-checked', on); }
    if (it.sub) { d.classList.add('sub'); d.setAttribute('aria-haspopup', 'menu'); }
    if (it.title) d.title = it.title;
    const l = document.createElement('span'); l.textContent = tr(it.label); d.appendChild(l);
    const key = menuKey(it);
    if (key) { const k = document.createElement('span'); k.className = 'k'; k.textContent = key; d.appendChild(k); }
    const clearActive = () => el.querySelectorAll(':scope > .mi.active').forEach(x => x.classList.remove('active'));
    if (it.sub && narrowMenus()) {
      d.addEventListener('click', async () => {
        const next = d.nextElementSibling;
        if (next && next.classList.contains('msub')) { next.remove(); d.classList.remove('active'); return; }
        const box = document.createElement('div'); box.className = 'msub';
        d.after(box); d.classList.add('active');
        fillMenu(box, typeof it.sub === 'function' ? await it.sub() : it.sub, level + 1);
      });
    } else if (it.sub) {
      const open = () => { clearActive(); d.classList.add('active'); showMenu(it.sub, d.getBoundingClientRect(), level + 1, true); };
      d.addEventListener('mouseenter', open); d.addEventListener('click', open);
    } else {
      d.addEventListener('mouseenter', () => { if (!narrowMenus()) { clearActive(); closeMenus(level + 1); } });
      if (enabled) d.addEventListener('click', () => { closeMenus(); it.run(); });
    }
    el.appendChild(d);
  });
}
async function showMenu(items, rect, level, asSub) {
  if (typeof items === 'function') items = await items();
  closeMenus(level);
  const el = document.createElement('div'); el.className = 'menu'; el.setAttribute('role', 'menu');
  fillMenu(el, items, level);
  document.body.appendChild(el);
  // Place it (to the right of a submenu's item, or under the menu bar button), keeping it on screen.
  const w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight;
  let x = asSub ? rect.right - 4 : rect.left, y = asSub ? rect.top - 5 : rect.bottom + 2;
  if (x + w > vw - 8) x = asSub ? Math.max(8, rect.left - w + 4) : Math.max(8, vw - w - 8);
  if (y + h > vh - 8) y = Math.max(8, vh - h - 8);
  el.style.left = x + 'px'; el.style.top = y + 'px';
  openMenus.push({ el, level });
}
function buildMenuBar() {
  const bar = $('menuBar');
  MENUS.forEach(m => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = m.label; b.setAttribute('aria-haspopup', 'true');
    const open = () => { closeMenus(); b.classList.add('open'); showMenu(m.items, b.getBoundingClientRect(), 0, false); };
    b.addEventListener('click', () => (b.classList.contains('open') ? closeMenus() : open()));
    b.addEventListener('mouseenter', () => { if (menuOpen() && !b.classList.contains('open')) open(); });
    bar.appendChild(b);
  });
}
buildMenuBar();
document.addEventListener('pointerdown', e => { if (menuOpen() && !e.target.closest('.menu') && !e.target.closest('#menuBar')) closeMenus(); }, true);
window.addEventListener('resize', () => closeMenus());

/* ---------- Pointer interaction ---------- */
let drag = null; // { kind:'sel', anchor } | { kind:'marker', index } | { kind:'fade', side, a, b, n }

// Volume envelope (like WavePad): a line over the selection (or file) with draggable points;
// 100% is the middle of the waveform, the top is 200%, the bottom silence.
let env = null; // { a, b, pts: [{ s, g }], sel, hover }
const ENV_COL = '#c8641e';
function envAt(i) {
  if (!env || i < env.a || i > env.b) return 1;
  const p = env.pts;
  for (let k = 1; k < p.length; k++) if (i <= p[k].s) {
    const s0 = p[k - 1].s, s1 = p[k].s;
    return s1 > s0 ? p[k - 1].g + (p[k].g - p[k - 1].g) * (i - s0) / (s1 - s0) : p[k].g;
  }
  return p[p.length - 1].g;
}
function applyEnvTo(c, from, pts, offset) {
  for (let k = 1; k < pts.length; k++) {
    const s0 = pts[k - 1].s, s1 = pts[k].s, g0 = pts[k - 1].g, g1 = pts[k].g, n = s1 - s0;
    for (let i = s0; i < s1 + (k === pts.length - 1 ? 1 : 0); i++) {
      const j = i - offset; if (j < 0 || j >= c.length) continue;
      c[j] = clamp(c[j] * (n > 0 ? g0 + (g1 - g0) * (i - s0) / n : g1), -1, 1);
    }
  }
}
function envInfoText(pt) {
  if (!pt) return '—';
  const db = pt.g > 0 ? 20 * Math.log10(pt.g) : -Infinity;
  return `${fmt(pt.s / doc.sr)} · ${Math.round(pt.g * 100)}% (${isFinite(db) ? (db > 0 ? '+' : '') + db.toFixed(1) + ' dB' : 'silent'})`;
}
function syncEnvBar(pt) {
  $('envBar').hidden = !env;
  $('envBtn').classList.toggle('on', !!env);
  if (env) $('envInfo').textContent = envInfoText(pt);
}
function envStart() {
  if (!doc || !len()) return;
  if (env) { envCancel(); return; }
  stopPlay(); stopPreview();
  const [a, b] = range();
  env = { a, b, pts: [{ s: a, g: 1 }, { s: b, g: 1 }], sel: -1, hover: -1 };
  syncEnvBar(); draw();
}
function envCancel() { if (!env) return; stopPreview(); env = null; syncEnvBar(); draw(); }
function envApply() {
  if (!env) return;
  stopPreview(); stopPlay();
  const e = env; env = null; syncEnvBar();
  if (e.pts.every(pt => pt.g === 1)) { draw(); toast('The envelope is flat — nothing changed.'); return; }
  commit(opMap(e.a, e.b, c => applyEnvTo(c, e.a, e.pts, 0)), 'Volume envelope');
}
function envPreview() {
  if (!env) return;
  stopPlay(); stopPreview();
  const a = env.a, b = Math.min(env.b, a + doc.sr * 20);
  const out = sliceCh(doc.ch, a, b);
  out.forEach(c => applyEnvTo(c, a, env.pts, a));
  const ctx = audio(); ctx.resume();
  const buf = ctx.createBuffer(out.length, Math.max(1, out[0].length), doc.sr);
  out.forEach((c, i) => buf.copyToChannel(c, i));
  const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start();
  previewSrc = src;
}
function envGainFromY(clientY) {
  const r = canvas.getBoundingClientRect(), h = canvas.clientHeight - RULER_H;
  const gv = clamp(2 * (1 - (clientY - r.top - RULER_H) / h), 0, 2);
  return Math.abs(gv - 1) < 0.04 ? 1 : Math.round(gv * 100) / 100; // snap to 100%
}
function envPointNear(clientX, clientY) {
  const r = canvas.getBoundingClientRect(), x = clientX - r.left, y = clientY - r.top, h = canvas.clientHeight - RULER_H;
  let best = -1, bestD = 10;
  env.pts.forEach((pt, i) => {
    const d = Math.hypot((pt.s - viewStart) / spp - x, RULER_H + h * (1 - pt.g / 2) - y);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}
function envRemove(i) {
  if (!env || i <= 0 || i >= env.pts.length - 1) return; // the two end points stay
  env.pts.splice(i, 1); env.sel = -1; env.hover = -1;
  syncEnvBar(); draw();
}
function envPointerDown(e) {
  let i = envPointNear(e.clientX, e.clientY);
  if (i < 0) {
    const s = sampleAt(e.clientX);
    if (s <= env.a || s >= env.b) return;
    i = env.pts.findIndex(pt => pt.s > s);
    env.pts.splice(i, 0, { s, g: envGainFromY(e.clientY) });
  }
  env.sel = i;
  drag = { kind: 'env', idx: i };
  syncEnvBar(env.pts[i]); draw();
}
function envPointerMove(e) {
  if (drag && drag.kind === 'env') {
    const p = env.pts, i = drag.idx, pt = p[i];
    if (i > 0 && i < p.length - 1) pt.s = clamp(sampleAt(e.clientX), p[i - 1].s + 1, p[i + 1].s - 1);
    pt.g = envGainFromY(e.clientY);
    syncEnvBar(pt); draw(); return;
  }
  const i = envPointNear(e.clientX, e.clientY), s = sampleAt(e.clientX);
  canvas.style.cursor = i >= 0 ? 'grab' : (s > env.a && s < env.b ? 'crosshair' : 'default');
  if (i !== env.hover) { env.hover = i; syncEnvBar(i >= 0 ? env.pts[i] : null); draw(); }
}
canvas.addEventListener('dblclick', e => { if (env) envRemove(envPointNear(e.clientX, e.clientY)); });
canvas.addEventListener('contextmenu', e => {
  if (!env) return;
  e.preventDefault();
  envRemove(envPointNear(e.clientX, e.clientY));
});

// Fade handles (like WavePad): drag the square at the selection's top-left corner inwards to
// fade in, the top-right one to fade out. With no selection they sit at the file's start and end.
const RULER_H = 22, FADE_H = TOUCH ? 22 : 16;
// Fade curve shared by the Fade buttons, the fade handles and Effects ▸ Fade type.
let fadeCurve = 'smooth';
const fadeGain = t => fadeCurve === 'linear' ? t : fadeCurve === 'fast' ? 1 - (1 - t) * (1 - t) : fadeCurve === 'scurve' ? t * t * (3 - 2 * t) : t * t;
function fadeSpan() { return hasSel() ? [selA, selB] : [0, len()]; }
function fadeHandles() {
  if (!doc || !len() || env) return [];
  const [a, b] = fadeSpan(), toX = v => (v - viewStart) / spp;
  const n = side => (drag && drag.kind === 'fade' && drag.side === side ? drag.n : 0);
  return [{ side: 'in', x: toX(a + n('in')), y: RULER_H + 3 }, { side: 'out', x: toX(b - n('out')) - FADE_H, y: RULER_H + 3 }];
}
function fadeHandleAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect(), x = clientX - r.left, y = clientY - r.top;
  for (const h of fadeHandles()) { const p = TOUCH ? 10 : 4; if (x >= h.x - p && x <= h.x + FADE_H + p && y >= h.y - p && y <= h.y + FADE_H + p) return h.side; }
  return null;
}
function applyFade(side, a, b, n) {
  stopPlay();
  const [fa, fb] = side === 'in' ? [a, a + n] : [b - n, b];
  commit(opMap(fa, fb, (c, s0, s1) => {
    const len0 = s1 - s0;
    for (let i = 0; i < len0; i++) { const t = i / len0; c[s0 + i] *= fadeGain(side === 'in' ? t : 1 - t); }
  }), `Fade ${side} ${(n / doc.sr).toFixed(2)} s`);
}
function sampleAt(clientX) {
  const r = canvas.getBoundingClientRect();
  return clamp(Math.round(viewStart + (clientX - r.left) * spp), 0, len());
}
function markerNear(clientX) {
  const r = canvas.getBoundingClientRect(), x = clientX - r.left;
  let best = -1, bestD = HIT + 1;
  doc.markers.forEach((m, i) => { const d = Math.abs((m - viewStart) / spp - x); if (d < bestD) { bestD = d; best = i; } });
  return best;
}
// Selection holder (bottom bar) and edge grips, like WavePad: move or resize a selection
// by dragging, without starting a new one.
const SEL_BAR = TOUCH ? 24 : 16;
function selHandles() {
  if (!doc || !hasSel() || env) return null;
  return { x0: (selA - viewStart) / spp, x1: (selB - viewStart) / spp, barY: canvas.clientHeight - SEL_BAR };
}
function selHandleAt(clientX, clientY) {
  const h = selHandles(); if (!h) return null;
  const r = canvas.getBoundingClientRect(), x = clientX - r.left, y = clientY - r.top;
  if (y < RULER_H + FADE_H + 6) return null; // leave the ruler and fade handles alone
  if (Math.abs(x - h.x0) <= HIT) return 'edgeA';
  if (Math.abs(x - h.x1) <= HIT) return 'edgeB';
  if (y >= h.barY - 2 && x > h.x0 && x < h.x1) return 'move';
  return null;
}
// While dragging past the edge of the waveform, scroll the view along.
function edgeScroll(clientX) {
  const r = canvas.getBoundingClientRect(), x = clientX - r.left, W = canvas.clientWidth;
  if (x < 24) viewStart -= spp * (24 - x); else if (x > W - 24) viewStart += spp * (x - W + 24); else return;
  clampView();
}

canvas.addEventListener('pointerdown', e => {
  if (!doc || e.button > 0) return;
  canvas.setPointerCapture(e.pointerId);
  if (env) { envPointerDown(e); return; }
  const sh = selHandleAt(e.clientX, e.clientY);
  if (sh) {
    if (player) stopPlay();
    if (sh === 'move') drag = { kind: 'move', off: sampleAt(e.clientX) - selA, w: selB - selA };
    else drag = { kind: 'sel', anchor: sh === 'edgeA' ? selB : selA, x0: -1e9, edge: true }; // the other edge stays put
    canvas.style.cursor = sh === 'move' ? 'grabbing' : 'ew-resize';
    draw(); return;
  }
  const fh = fadeHandleAt(e.clientX, e.clientY);
  if (fh) {
    const [a, b] = fadeSpan();
    if (player) stopPlay();
    // Remember where on the handle it was grabbed so the fade follows the pointer exactly.
    drag = { kind: 'fade', side: fh, a, b, n: 0, off: sampleAt(e.clientX) - (fh === 'in' ? a : b) };
    draw(); return;
  }
  const mi = markerNear(e.clientX);
  if (mi >= 0) { drag = { kind: 'marker', index: mi, orig: doc, markers: doc.markers.slice(), moved: false }; return; }
  const s = sampleAt(e.clientX);
  if (e.shiftKey) {
    const anchor = hasSel() ? (Math.abs(s - selA) < Math.abs(s - selB) ? selB : selA) : cursor;
    drag = { kind: 'sel', anchor, x0: -1e9 };
    selA = Math.min(anchor, s); selB = Math.max(anchor, s);
  } else {
    drag = { kind: 'sel', anchor: s, x0: e.clientX };
    selA = selB = null; cursor = s;
  }
  if (player) stopPlay();
  refresh();
});
canvas.addEventListener('pointermove', e => {
  if (!doc) return;
  if (env) { envPointerMove(e); return; }
  if (!drag) {
    const sh = selHandleAt(e.clientX, e.clientY);
    canvas.style.cursor = sh === 'move' ? 'grab' : sh || fadeHandleAt(e.clientX, e.clientY) || markerNear(e.clientX) >= 0 ? 'ew-resize' : 'text';
    return;
  }
  if (drag.kind === 'move' || drag.edge) edgeScroll(e.clientX);
  const s = sampleAt(e.clientX);
  if (drag.kind === 'move') {
    selA = clamp(s - drag.off, 0, len() - drag.w); selB = selA + drag.w; cursor = selA;
    refresh(); return;
  }
  if (drag.kind === 'fade') {
    const span = drag.b - drag.a;
    const at = s - drag.off;
    drag.n = drag.side === 'in' ? clamp(at - drag.a, 0, span) : clamp(drag.b - at, 0, span);
    draw(); return;
  }
  if (drag.kind === 'marker') {
    drag.markers[drag.index] = clamp(s, 1, len() - 1); drag.moved = true;
    doc = makeDoc(doc.sr, doc.ch, drag.markers); // live preview; committed on release
    draw(); return;
  }
  if (Math.abs(e.clientX - drag.x0) < 3) return;
  selA = Math.min(drag.anchor, s); selB = Math.max(drag.anchor, s);
  cursor = selA;
  refresh();
});
function endDrag() {
  if (!drag) return;
  const d = drag; drag = null;
  if (d.kind === 'env') { draw(); return; }
  if (d.kind === 'fade') {
    if (d.n >= Math.max(2, spp * 3)) applyFade(d.side, d.a, d.b, d.n); else draw();
    return;
  }
  if (d.kind === 'marker' && d.moved) {
    doc = d.orig; // commit from the pre-drag document so undo restores the old position
    commit(makeDoc(doc.sr, doc.ch, d.markers.slice().sort((x, y) => x - y)));
    return;
  }
  refresh();
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', e => {
  if (!doc) return;
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) {
    zoomAt(e.deltaY > 0 ? 1.25 : 0.8, sampleAt(e.clientX));
  } else {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    viewStart += d * spp; clampView(); draw(player ? playPos() : undefined);
  }
}, { passive: false });

/* ---------- Selection inputs ---------- */
function applyTimeInputs() {
  if (!doc) return;
  const a = parseTime($('selStartIn').value), b = parseTime($('selEndIn').value);
  const L = len();
  if (isFinite(a) && isFinite(b) && b > a) { selA = clamp(Math.round(a * doc.sr), 0, L); selB = clamp(Math.round(b * doc.sr), 0, L); cursor = selA; if (selB <= selA) selA = selB = null; }
  else if (isFinite(a)) { cursor = clamp(Math.round(a * doc.sr), 0, L); if (!$('selEndIn').value.trim()) selA = selB = null; }
  refresh();
}
for (const id of ['selStartIn', 'selEndIn']) {
  $(id).addEventListener('change', applyTimeInputs);
  $(id).addEventListener('keydown', e => { if (e.key === 'Enter') { e.target.blur(); } });
}

/* ---------- Wire up buttons ---------- */
on('openBtn', () => $('fileIn').click());
on('openBtn2', () => $('fileIn').click());
$('fileIn').addEventListener('change', e => { loadFiles([...e.target.files]); e.target.value = ''; });
$('fileName').addEventListener('input', renderTabs);
on('recBtn', () => toggleRecord()); on('recBtn2', () => toggleRecord());
on('playBtn', togglePlay);
on('stopBtn', () => { stopPlay(); refresh(); });
on('homeBtn', () => { stopPlay(); cursor = 0; selA = selB = null; viewStart = 0; clampView(); refresh(); });
on('endBtn', () => { stopPlay(); cursor = len(); selA = selB = null; viewStart = len(); clampView(); refresh(); });
on('loopBtn', () => { loop = !loop; if (player) play(); refresh(); });
on('undoBtn', undo); on('redoBtn', redo);
on('mixFileBtn', openMixDialog);
on('dupBtn', duplicate);
on('envBtn', envStart); on('envApply', envApply); on('envCancel', envCancel); on('envPreview', envPreview);
on('envReset', () => { if (env) { env.pts = [{ s: env.a, g: 1 }, { s: env.b, g: 1 }]; env.sel = env.hover = -1; syncEnvBar(); draw(); } });
on('backBtn', () => seekBy(-5)); on('fwdBtn', () => seekBy(5));
$('rateSel').addEventListener('change', () => { if (player) { const pos = playPos(); stopPlay(); cursor = Math.round(pos); play(); } });
on('eqBtn', fxEqualiser); on('echoBtn', fxEcho); on('reverbBtn', fxReverb); on('speedBtn', fxSpeed); on('pitchBtn', fxPitch); on('tempoBtn', fxTempo); on('compBtn', fxCompressor);
on('gateBtn', fxGate); on('noiseGrabBtn', grabNoise); on('noiseBtn', fxNoise); on('hpBtn', fxHighpass); on('lpBtn', fxLowpass);
on('stereoBtn', makeStereo); on('swapBtn', swapChannels); on('rateConvBtn', fxSampleRate);
on('insFileBtn', () => $('insFileIn').click()); on('genBtn', generate); on('repeatBtn', repeatLoop); on('redactBtn', redact);
on('splitBtn', splitIntoTabs); on('joinBtn', () => openJoin(false)); on('joinBtn2', () => openJoin(true));
function openGuide() { $('guideDlg').showModal(); $('guideDlg').querySelector('.guide-body').scrollTop = 0; }
on('guideBtn', openGuide);
on('guideClose', () => $('guideDlg').close());
$('guideDlg').addEventListener('click', e => { if (e.target === $('guideDlg')) $('guideDlg').close(); });
on('newBtn2', newEmpty);
on('emptyRec', () => toggleRecord());
on('emptyPaste', () => clip ? cmdPaste() : toast('Nothing copied yet — select audio in another tab and press Ctrl+C.'));
on('emptyOpen', () => $('fileIn').click());
on('mixCancel', () => $('mixDlg').close());
on('mixGo', runMix);
on('mixBrowse', () => $('mixFileIn').click());
$('mixVol').addEventListener('input', e => { $('mixVolOut').value = e.target.value + '%'; });
$('mixSrc').addEventListener('change', e => { $('mixGo').disabled = !e.target.value; });
$('mixFileIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  busy(true);
  try { mixFile = await decodeFile(f); fillMixSources('file'); }
  catch (err) { console.error(err); toast(`Could not read “${f.name}”.`); }
  finally { busy(false); }
});
on('cutBtn', cmdCut); on('copyBtn', cmdCopy); on('pasteBtn', cmdPaste); on('pasteMixBtn', cmdPasteMix);
on('delBtn', () => cmdDelete()); on('trimBtn', cmdTrim);
on('zoomInBtn', () => zoomAt(0.5)); on('zoomOutBtn', () => zoomAt(2));
on('zoomSelBtn', zoomSel); on('zoomFitBtn', zoomFit);
on('fadeInBtn', fadeIn); on('fadeOutBtn', fadeOut); on('normBtn', normalise);
on('revBtn', reverse); on('silBtn', silence); on('gainBtn', amplify);
on('insSilBtn', insertSilence); on('trimSilBtn', autoTrim); on('monoBtn', makeMono);
on('exportBtn', exportAll); on('exportSelBtn', exportSel);
on('markBtn', addMarker);
on('clearMarksBtn', () => { if (doc && doc.markers.length) commit(makeDoc(doc.sr, doc.ch, []), 'Markers cleared'); });
on('autoSplitBtn', autoSplit);
on('zipBtn', exportZip);

/* ---------- Keyboard ---------- */
function switchTab(dir) {
  if (tabs.length < 2) return;
  showTab(tabs[(tabs.indexOf(active) + dir + tabs.length) % tabs.length]);
}
document.addEventListener('keydown', e => {
  const t = e.target;
  if (menuOpen()) { if (e.key === 'Escape') { e.preventDefault(); closeMenus(); } return; }
  if ($('mt').classList.contains('open')) { if (!document.querySelector('dialog[open]')) mtKey(e); return; }
  if (document.querySelector('dialog[open]')) return;
  if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (env) {
    const envKeys = { enter: envApply, escape: envCancel, e: envCancel, delete: () => envRemove(env.sel), backspace: () => envRemove(env.sel) };
    if (!mod && envKeys[k]) { e.preventDefault(); envKeys[k](); return; }
  }
  let handled = true;
  // These work even with no file open.
  if (k === '?') openGuide();
  else if (k === 'f1') openHelp('');
  else if (mod && k === 'o') $('fileIn').click();
  else if (mod && k === 'm') openMultitrack();
  else if (!mod && !e.altKey && !e.shiftKey && k === 'n') newEmpty();
  else if ((!mod && !e.altKey && k === 'r') || k === 'f5') toggleRecord();
  else handled = false;
  if (handled || !doc) { if (handled) e.preventDefault(); return; }
  handled = true;
  if (k === ' ') togglePlay();
  else if (mod && e.shiftKey && k === 's') saveAs();
  else if (!mod && e.shiftKey && k === 'a') amplifyDlg();
  else if (!mod && e.shiftKey && k === 'n') normalise();
  else if (!mod && k === 'g') jumpTo();
  else if (!mod && k === ';') gotoMarker(-1);
  else if (!mod && k === "'") gotoMarker(1);
  else if (mod && k === 'z' && !e.shiftKey) undo();
  else if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) redo();
  else if (mod && k === 'x') cmdCut();
  else if (mod && k === 'c') cmdCopy();
  else if (mod && k === 'v' && e.shiftKey) cmdPasteMix();
  else if (mod && k === 'v') cmdPaste();
  else if (mod && k === 'a') { selA = 0; selB = len(); cursor = 0; refresh(); }
  else if (mod && k === 's') exportAll();
  else if (mod && k === 'd') duplicate();
  else if (!mod && k === ',') seekBy(-5);
  else if (!mod && k === '.') seekBy(5);
  else if (!mod && k === '[') switchTab(-1);
  else if (!mod && k === ']') switchTab(1);
  else if (!mod && k === 't') cmdTrim();
  else if (!mod && k === 'e') envStart();
  else if (!mod && k === 'i') fadeIn();
  else if (!mod && k === 'o') fadeOut();
  else if (!mod && k === 'z') zoomSel();
  else if (!mod && k === 'f') zoomFit();
  else if (!mod && (k === 'delete' || k === 'backspace')) cmdDelete();
  else if (!mod && k === 'm') addMarker();
  else if (!mod && k === 'l') { loop = !loop; if (player) play(); refresh(); }
  else if (!mod && (k === '+' || k === '=')) zoomAt(0.5);
  else if (!mod && (k === '-' || k === '_')) zoomAt(2);
  else if (!mod && k === 'escape') { selA = selB = null; refresh(); }
  else if (!mod && k === 'home') { cursor = 0; viewStart = 0; clampView(); refresh(); }
  else if (!mod && k === 'end') { cursor = len(); viewStart = len(); clampView(); refresh(); }
  else if (!mod && (k === 'arrowleft' || k === 'arrowright')) {
    const step = Math.round((e.shiftKey ? 1 : 0.1) * doc.sr) * (k === 'arrowleft' ? -1 : 1);
    cursor = clamp(cursor + step, 0, len()); if (!player) selA = selB = null; refresh();
  }
  else handled = false;
  if (handled) e.preventDefault();
});

/* ---------- Drag & drop ---------- */
const dropTarget = document.body;
let dragDepth = 0;
dropTarget.addEventListener('dragenter', e => { e.preventDefault(); dragDepth++; $('empty').classList.add('drag'); });
dropTarget.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('empty').classList.remove('drag'); } });
dropTarget.addEventListener('dragover', e => e.preventDefault());
dropTarget.addEventListener('drop', e => {
  e.preventDefault(); dragDepth = 0; $('empty').classList.remove('drag');
  if (e.dataTransfer.files && e.dataTransfer.files.length) loadFiles([...e.dataTransfer.files]);
});

// Keep the same stretch of time on screen when the window is resized.
let lastW = 0;
window.addEventListener('resize', () => {
  const w = canvas.clientWidth;
  if (doc && lastW && w) { spp *= lastW / w; clampView(); draw(player ? playPos() : undefined); }
  lastW = w;
});
window.addEventListener('beforeunload', e => { stashTab(); if (tabs.some(t => t.dirty)) { e.preventDefault(); e.returnValue = ''; } });
