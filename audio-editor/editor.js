// Audio editor — main script (Diin Islaam). Runs entirely in the browser; nothing is uploaded.
// Loaded as a classic script together with editor-audio.js, editor-multitrack.js, editor-tools.js and editor-ui.js (in that order); their top-level names are shared with each other and with the feature files loaded after them.
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
