// Audio editor — spectrogram view, AI noise removal (RNNoise) and speech to text with an editable
// transcript (Whisper). Loaded after editor.js. The AI parts download their engine the first time
// they are used, then run on this device; the audio is never uploaded.
'use strict';

/* ---------- Spectrogram ---------- */
let specOn = false;
try { specOn = localStorage.getItem('ae-spectro') === 'on'; } catch (e) {}
const SPEC_N = 1024, SPEC_FMIN = 40;
const specWin = (() => { const w = new Float64Array(SPEC_N); for (let i = 0; i < SPEC_N; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / SPEC_N); return w; })();
const specLUT = (() => { // dark blue → purple → red → orange → pale yellow
  const stops = [[0, [16, 18, 38]], [0.3, [70, 30, 110]], [0.55, [170, 45, 85]], [0.78, [240, 130, 40]], [1, [255, 246, 200]]], lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255; let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, c0] = stops[k], [t1, c1] = stops[k + 1], u = (t - t0) / (t1 - t0);
    for (let j = 0; j < 3; j++) lut[i * 3 + j] = c0[j] + (c1[j] - c0[j]) * u;
  }
  return lut;
})();
let specCache = null;
function specBitmap(W, h) {
  if (specCache && specCache.doc === doc && specCache.viewStart === viewStart && specCache.spp === spp && specCache.W === W && specCache.h === h) return specCache.cv;
  const cv = specCache && specCache.cv || document.createElement('canvas');
  cv.width = W; cv.height = h;
  const cx = cv.getContext('2d'), img = cx.createImageData(W, h), px = img.data;
  const sr = doc.sr, L = len(), nch = doc.ch.length, lmin = Math.log(SPEC_FMIN), lmax = Math.log(sr / 2);
  // Rows run from the top (highest frequency) down, on a log scale; each row takes the loudest bin it covers.
  const rowLo = new Float64Array(h), rowHi = new Float64Array(h);
  for (let y = 0; y < h; y++) {
    const f1 = Math.exp(lmax - (y / h) * (lmax - lmin)), f0 = Math.exp(lmax - ((y + 1) / h) * (lmax - lmin));
    rowLo[y] = f0 / sr * SPEC_N; rowHi[y] = f1 / sr * SPEC_N;
  }
  const re = new Float64Array(SPEC_N), im = new Float64Array(SPEC_N), db = new Float32Array(SPEC_N / 2 + 1);
  const norm = SPEC_N / 4;
  for (let x = 0; x < W; x++) {
    const centre = Math.round(viewStart + (x + 0.5) * spp), start = centre - SPEC_N / 2;
    if (centre >= L) { for (let y = 0; y < h; y++) { const o = (y * W + x) * 4; px[o] = 16; px[o + 1] = 18; px[o + 2] = 38; px[o + 3] = 255; } continue; }
    for (let i = 0; i < SPEC_N; i++) {
      const j = start + i; let v = 0;
      if (j >= 0 && j < L) { for (let k = 0; k < nch; k++) v += doc.ch[k][j]; v /= nch; }
      re[i] = v * specWin[i]; im[i] = 0;
    }
    fft(re, im, false);
    for (let i = 0; i <= SPEC_N / 2; i++) db[i] = 10 * Math.log10((re[i] * re[i] + im[i] * im[i]) / (norm * norm) + 1e-12);
    for (let y = 0; y < h; y++) {
      const b0 = rowLo[y], b1 = rowHi[y];
      let v;
      if (b1 - b0 < 1) { const b = Math.min(SPEC_N / 2 - 1, Math.floor(b0)), f = b0 - b; v = db[b] * (1 - f) + db[b + 1] * f; }
      else { v = -200; for (let b = Math.floor(b0), e = Math.min(SPEC_N / 2, Math.ceil(b1)); b <= e; b++) if (db[b] > v) v = db[b]; }
      const t = Math.max(0, Math.min(255, Math.round((v + 95) / 95 * 255))), o = (y * W + x) * 4;
      px[o] = specLUT[t * 3]; px[o + 1] = specLUT[t * 3 + 1]; px[o + 2] = specLUT[t * 3 + 2]; px[o + 3] = 255;
    }
  }
  cx.putImageData(img, 0, 0);
  specCache = { doc, viewStart, spp, W, h, cv };
  return cv;
}
// editor.js calls this in place of drawing the waveform lanes; returning true means "drawn".
waveOverlay = (g, W, H, RULER) => {
  if (!specOn || !len()) return false;
  const h = H - RULER;
  g.imageSmoothingEnabled = false;
  g.drawImage(specBitmap(Math.max(1, Math.round(W)), Math.max(1, Math.round(h))), 0, RULER, W, h);
  if (hasSel()) {
    const x0 = (selA - viewStart) / spp, x1 = (selB - viewStart) / spp;
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x0, RULER, x1 - x0, h);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(Math.round(x0), RULER, 1, h); g.fillRect(Math.round(x1), RULER, 1, h);
  }
  // Frequency scale
  const lmin = Math.log(SPEC_FMIN), lmax = Math.log(doc.sr / 2);
  g.font = '10px ' + css('--ui'); g.textBaseline = 'middle';
  for (const f of [100, 200, 500, 1000, 2000, 5000, 10000, 20000]) {
    if (f >= doc.sr / 2) break;
    const y = RULER + h * (lmax - Math.log(f)) / (lmax - lmin);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, Math.round(y), 6, 1);
    const label = f >= 1000 ? f / 1000 + 'k' : String(f);
    g.fillStyle = 'rgba(16,18,38,.6)'; g.fillRect(7, y - 7, g.measureText(label).width + 6, 13);
    g.fillStyle = '#f4ecd8'; g.fillText(label, 10, y);
  }
  return true;
};
function toggleSpectrogram() {
  specOn = !specOn;
  try { localStorage.setItem('ae-spectro', specOn ? 'on' : 'off'); } catch (e) {}
  $('specBtn').classList.toggle('on', specOn); $('specBtn').setAttribute('aria-pressed', specOn);
  draw();
}

/* ---------- AI noise removal (RNNoise, a small neural network for speech) ---------- */
const RNN_SOURCES = ['https://cdn.jsdelivr.net/npm/@shiguredo/rnnoise-wasm@2025.1.5/dist/rnnoise.js', 'https://unpkg.com/@shiguredo/rnnoise-wasm@2025.1.5/dist/rnnoise.js'];
const RNN_DELAY = 960; // RNNoise's output lags its input by two 10 ms frames (measured)
let rnnP = null;
function loadRnnoise() {
  return rnnP || (rnnP = (async () => {
    let err;
    for (const u of RNN_SOURCES) { try { const m = await import(u); return await m.Rnnoise.load(); } catch (e) { err = e; } }
    rnnP = null; throw err || new Error('Could not load the noise remover');
  })());
}
async function rnnoiseCh(ch, sr, amount, onProgress) {
  const rn = await loadRnnoise(), N = rn.frameSize, n = ch[0].length;
  const x = sr === 48000 ? ch : await resample(ch, sr, 48000);
  const mix = clamp(amount / 100, 0, 1), total = x.length * x[0].length;
  let done = 0;
  const out = [];
  for (const c of x) {
    const st = rn.createDenoiseState(), o = new Float32Array(c.length), fr = new Float32Array(N);
    try {
      for (let i = 0; i < c.length + RNN_DELAY; i += N) {
        for (let j = 0; j < N; j++) { const v = c[i + j]; fr[j] = v === undefined ? 0 : v * 32768; }
        st.processFrame(fr);
        for (let j = 0; j < N; j++) { const k = i + j - RNN_DELAY; if (k >= 0 && k < c.length) o[k] = c[k] * (1 - mix) + (fr[j] / 32768) * mix; }
        if ((i / N) % 400 === 0) { done = Math.min(total, done + 400 * N); if (onProgress) onProgress(done / total); await new Promise(r => setTimeout(r, 0)); }
      }
    } finally { st.destroy(); }
    out.push(o);
  }
  let back = sr === 48000 ? out : await resample(out, 48000, sr);
  return back.map(c => { if (c.length === n) return c; const r = new Float32Array(n); r.set(c.subarray(0, n)); return r; });
}
async function fxAiNoise() {
  if (!doc || !len()) return;
  if (!rnnP) { busyText('Downloading the AI noise remover (5 MB, first time only)…'); busy(true); try { await loadRnnoise(); } catch (e) { console.error(e); toast('Could not download the AI noise remover — check the internet connection.'); return; } finally { busy(false); busyText('Working…'); } }
  processFx('AI noise removal', 'A small neural network trained on speech removes background noise — fans, traffic, keyboard, room noise — and keeps the voice. Works best on speech; on music or Qur’an recitation with long notes, compare with ▶ Preview and lower the amount if the voice sounds thin.', [
    { id: 'amount', label: 'Amount', value: 100, min: 10, max: 100, step: 5, unit: '% (lower keeps some of the original)' },
  ], (ch, sr, v) => rnnoiseCh(ch, sr, v.amount, p => busyText(`Removing noise… ${Math.round(p * 100)}%`)));
}

/* ---------- Speech to text and transcript editing (Whisper) ---------- */
const TR_MODELS = [
  ['onnx-community/whisper-base_timestamped', 'Balanced — about 80 MB download'],
  ['onnx-community/whisper-tiny_timestamped', 'Fast — about 40 MB, less accurate'],
  ['onnx-community/whisper-small_timestamped', 'Most accurate — about 250 MB, slow'],
];
const TR_LANGS = [['', 'Detect automatically'], ['english', 'English'], ['arabic', 'Arabic'], ['somali', 'Somali'], ['swahili', 'Swahili'], ['amharic', 'Amharic'], ['french', 'French'], ['turkish', 'Turkish'], ['urdu', 'Urdu'], ['indonesian', 'Indonesian'], ['malay', 'Malay']];
const FILLER_RE = /^(u+h+m*|u+m+|e+r+m*|e+h+|a+h+|h+m+|m+h*m+|mm+|er|uh|um|erm|hmm|أه+|إمم+|اه+)$/i;
let trWorker = null, trSeq = 0;
const trPending = new Map();
function trRun(msg, onMsg) {
  if (!trWorker) {
    trWorker = new Worker('transcribe-worker.js?v=' + EDITOR_VERSION, { type: 'module' });
    trWorker.onmessage = e => { const p = trPending.get(e.data.id); if (p) p(e.data); };
    trWorker.onerror = e => { for (const p of trPending.values()) p({ error: e.message || 'The speech recogniser stopped' }); trPending.clear(); trWorker = null; };
  }
  const id = ++trSeq;
  return new Promise((res, rej) => {
    trPending.set(id, d => {
      if (d.error) { trPending.delete(id); rej(new Error(d.error)); }
      else if (d.out) { trPending.delete(id); res(d.out); }
      else onMsg(d);
    });
    trWorker.postMessage({ id, ...msg }, [msg.audio.buffer]);
  });
}

const trDlg = document.createElement('dialog');
trDlg.className = 'dlg eq'; trDlg.id = 'trDlg';
trDlg.innerHTML = `<div class="eq-top"><h2>Transcript <span class="info" id="trScope"></span></h2></div>
  <p class="info" style="margin:0 0 10px">Speech to text with Whisper, running on this device (the model downloads once, then works offline). Click a word to hear it; Shift+click to select several; then delete them and the audio goes too — like editing a document. <strong>Afaan Oromoo is not supported by Whisper yet</strong>; for Qur’an recitation the text is only a rough guide.</p>
  <div class="row"><label>Model <select id="trModel" class="num" style="width:auto"></select></label>
    <label>Language <select id="trLang" class="num" style="width:auto"></select></label>
    <button class="btn primary" id="trGo" type="button">Transcribe</button><span class="info" id="trStatus"></span></div>
  <div id="trText" tabindex="0" style="max-height:340px; min-height:120px; overflow:auto; line-height:2; font-size:16px; padding:10px 12px; margin-top:10px; background:#fff; border:1px solid var(--gold-soft); border-radius:8px"></div>
  <div class="row" style="margin-top:10px">
    <button class="btn" id="trPlay" type="button">▶ Play selected</button>
    <button class="btn" id="trDel" type="button">Delete selected words</button>
    <button class="btn" id="trFill" type="button">Remove fillers</button>
    <button class="btn" id="trMarks" type="button" title="A marker at the start of each sentence — then Save parts">Markers at sentences</button>
    <select id="trExport" class="num" style="width:auto; flex:none; min-width:150px"><option value="">Export text…</option><option value="txt">Plain text (.txt)</option><option value="srt">Subtitles (.srt)</option><option value="vtt">Web subtitles (.vtt)</option></select>
  </div>
  <div class="actions"><span style="flex:1"></span><button class="btn" id="trClose" type="button">Close</button></div>`;
document.body.appendChild(trDlg);
TR_MODELS.forEach(([v, l]) => $('trModel').add(new Option(l, v)));
TR_LANGS.forEach(([v, l]) => $('trLang').add(new Option(l, v)));
try { const s = JSON.parse(localStorage.getItem('ae-transcribe') || '{}'); if (s.model) $('trModel').value = s.model; if (s.lang != null) $('trLang').value = s.lang; } catch (e) {}

let trPick = null, trAnchor = null; // selected word range [i, j]
const trData = () => active && active.transcript && active.transcript.doc === doc ? active.transcript : null;
const isFiller = w => FILLER_RE.test(w.t.replace(/[\s.,!?;:…"'“”()\-]/g, ''));
function trRender() {
  const box = $('trText'), tr = trData(); box.innerHTML = '';
  $('trScope').textContent = doc ? (active.name ? '— ' + active.name : '') : '';
  const stale = active && active.transcript && !tr;
  if (!tr) { box.innerHTML = `<p class="info" style="margin:0">${stale ? 'The audio has changed since it was transcribed — press <b>Transcribe</b> again to match it.' : 'Press <b>Transcribe</b> to turn the speech into text.'}</p>`; }
  else tr.words.forEach((w, i) => {
    const s = document.createElement('span'); s.textContent = w.t; s.dataset.i = i; s.title = `${fmt(w.s / doc.sr)} – ${fmt(w.e / doc.sr)}`;
    s.style.cssText = 'cursor:pointer; border-radius:4px; padding:1px 0';
    if (isFiller(w)) s.style.background = 'rgba(211,162,28,.35)';
    if (trPick && i >= trPick[0] && i <= trPick[1]) { s.style.background = 'var(--green)'; s.style.color = '#fff'; }
    box.appendChild(s);
  });
  const nf = tr ? tr.words.filter(isFiller).length : 0;
  if (tr && !$('trGo').disabled) $('trStatus').textContent = `${tr.words.length} word${tr.words.length === 1 ? '' : 's'}`;
  $('trFill').textContent = `Remove fillers${tr ? ` (${nf})` : ''}`;
  $('trFill').disabled = !nf; $('trDel').disabled = $('trPlay').disabled = !(tr && trPick);
  $('trMarks').disabled = $('trExport').disabled = !tr;
}
$('trText').addEventListener('click', e => {
  const i = e.target.dataset && e.target.dataset.i; if (i == null) return;
  const k = +i, tr = trData(); if (!tr) return;
  if (e.shiftKey && trAnchor != null) trPick = [Math.min(trAnchor, k), Math.max(trAnchor, k)];
  else { trPick = [k, k]; trAnchor = k; }
  selA = tr.words[trPick[0]].s; selB = tr.words[trPick[1]].e; cursor = selA;
  if (selA < viewStart || selB > viewStart + canvas.clientWidth * spp) zoomSel(); else refresh();
  trRender();
  if (!e.shiftKey) { stopPlay(); play(); }
});
async function transcribe() {
  if (!doc || !len()) return;
  const model = $('trModel').value, language = $('trLang').value;
  try { localStorage.setItem('ae-transcribe', JSON.stringify({ model, lang: language })); } catch (e) {}
  const forDoc = doc, sr = doc.sr;
  $('trGo').disabled = true; $('trStatus').textContent = 'Preparing the audio…';
  try {
    let mono = doc.ch.length === 1 ? doc.ch[0] : doc.ch[0].map((v, i) => doc.ch.reduce((t, c) => t + c[i], 0) / doc.ch.length);
    const [a16] = await resample([mono], sr, 16000);
    const files = new Map();
    const out = await trRun({ audio: a16.slice(), model, language, words: true }, d => {
      if (d.status === 'listening') $('trStatus').textContent = 'Listening… (about as long as the audio, or faster)';
      else if (d.progress && d.progress.status === 'progress' && d.progress.total) {
        files.set(d.progress.file, [d.progress.loaded, d.progress.total]);
        let got = 0, all = 0; for (const [l, t] of files.values()) { got += l; all += t; }
        $('trStatus').textContent = `Downloading the model (first time only)… ${Math.round(got / 1048576)} of ${Math.round(all / 1048576)} MB`;
      } else if (d.progress && d.progress.status === 'initiate') $('trStatus').textContent = 'Downloading the model (first time only)…';
      else if (d.progress && d.progress.status === 'ready') $('trStatus').textContent = 'Model ready';
    });
    const words = (out.chunks || []).filter(c => c.timestamp && c.text.trim()).map(c => {
      const s0 = c.timestamp[0] || 0, e0 = c.timestamp[1] == null ? s0 + 0.3 : c.timestamp[1];
      return { t: c.text, s: clamp(Math.round(s0 * sr), 0, len()), e: clamp(Math.round(e0 * sr), 0, len()) };
    }).filter(w => w.e > w.s);
    if (forDoc !== doc) throw new Error('The audio changed while transcribing — try again.');
    active.transcript = { doc, words }; trPick = null;
    $('trStatus').textContent = words.length ? `${words.length} words` : 'No speech was found.';
  } catch (e) {
    console.error(e);
    $('trStatus').textContent = /fetch|network|import|load/i.test(e.message) ? 'Could not download the speech model — check the internet connection.' : 'Transcribing failed: ' + e.message;
  } finally { trRender(); $('trGo').disabled = false; }
}
// Delete words (and the pause after them, down to a short gap) from the audio and the transcript.
function trDeleteWords(indices, label) {
  const tr = trData(); if (!tr || !indices.length) return;
  const sr = doc.sr, keepGap = Math.round(0.12 * sr), set = new Set(indices), w = tr.words, cuts = [];
  for (let i = 0; i < w.length; i++) {
    if (!set.has(i)) continue;
    let j = i; while (set.has(j + 1)) j++;
    const a = w[i].s, next = j + 1 < w.length ? w[j + 1].s : len();
    const b = Math.max(w[j].e, Math.min(next, next - keepGap));
    cuts.push([a, Math.max(a, b)]); i = j;
  }
  const keep = []; let from = 0;
  for (const [a, b] of cuts) { if (a > from) keep.push([from, a]); from = Math.max(from, b); }
  if (from < len()) keep.push([from, len()]);
  const at = m => { let p = 0; for (const [a, b] of keep) { if (m < a) return p; if (m <= b) return p + m - a; p += b - a; } return p; };
  const words = w.filter((_, i) => !set.has(i)).map(x => ({ t: x.t, s: at(x.s), e: at(x.e) }));
  stopPlay(); selA = selB = null; cursor = cuts.length ? at(cuts[0][0]) : 0;
  const removed = len() - keep.reduce((t, [a, b]) => t + b - a, 0);
  commit(makeDoc(sr, keepRangesCh(doc.ch, sr, keep), mapMarkers(doc.markers, keep)), `${label} (${(removed / sr).toFixed(1)} s shorter)`);
  active.transcript = { doc, words }; trPick = null; trAnchor = null;
  zoomFit(); trRender();
}
function trSentences(tr) { // groups of words: split at sentence punctuation or long pauses, max ~7 s
  const out = []; let cur = [];
  tr.words.forEach((w, i) => {
    cur.push(w);
    const next = tr.words[i + 1], gap = next ? (next.s - w.e) / doc.sr : 0;
    if (!next || /[.!?؟۔]$/.test(w.t.trim()) || gap > 0.8 || (w.e - cur[0].s) / doc.sr > 7) { out.push(cur); cur = []; }
  });
  return out;
}
function trExport(kind) {
  const tr = trData(); if (!tr) return;
  const sr = doc.sr, lines = trSentences(tr);
  const ts = (x, sep) => { const t = x / sr, h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = Math.floor(t) % 60, ms = Math.round((t % 1) * 1000) % 1000; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${sep}${String(ms).padStart(3, '0')}`; };
  const text = l => l.map(w => w.t).join('').trim();
  let body;
  if (kind === 'txt') body = lines.map(text).join('\n') + '\n';
  else if (kind === 'srt') body = lines.map((l, i) => `${i + 1}\n${ts(l[0].s, ',')} --> ${ts(l[l.length - 1].e, ',')}\n${text(l)}\n`).join('\n');
  else body = 'WEBVTT\n\n' + lines.map(l => `${ts(l[0].s, '.')} --> ${ts(l[l.length - 1].e, '.')}\n${text(l)}\n`).join('\n');
  downloadBlob(new Blob([body], { type: 'text/plain;charset=utf-8' }), baseName() + '-transcript.' + kind, 'text/plain');
}
function openTranscript() {
  if (!doc || !len()) return;
  trPick = null; trAnchor = null; $('trStatus').textContent = '';
  trRender(); trDlg.showModal();
}
on('trGo', transcribe);
on('trPlay', () => { stopPlay(); play(); });
on('trDel', () => { if (trPick) { const idx = []; for (let i = trPick[0]; i <= trPick[1]; i++) idx.push(i); trDeleteWords(idx, `Deleted ${idx.length} word${idx.length === 1 ? '' : 's'}`); } });
on('trFill', () => { const tr = trData(); if (!tr) return; const idx = tr.words.map((w, i) => isFiller(w) ? i : -1).filter(i => i >= 0); trDeleteWords(idx, `Removed ${idx.length} filler${idx.length === 1 ? '' : 's'}`); });
on('trMarks', () => {
  const tr = trData(); if (!tr) return;
  const starts = trSentences(tr).slice(1).map(l => l[0].s);
  const labels = trSentences(tr).map(l => l.map(w => w.t).join('').trim().slice(0, 60));
  const d = makeDoc(doc.sr, doc.ch, [...new Set(starts)].filter(m => m > 0 && m < len()).sort((a, b) => a - b));
  if (d.markers.length === starts.length) d.labels = labels;
  commit(d, `Markers at sentences (${d.markers.length})`);
  active.transcript = { doc, words: tr.words }; trRender(); toast(`${d.markers.length} marker${d.markers.length === 1 ? '' : 's'} added — the Markers panel can save each sentence as a file`);
});
$('trExport').addEventListener('change', e => { const k = e.target.value; e.target.value = ''; if (k) trExport(k); });
on('trClose', () => trDlg.close());
trDlg.addEventListener('keydown', e => { if ((e.key === 'Delete' || e.key === 'Backspace') && trPick && e.target.tagName !== 'SELECT') { e.preventDefault(); $('trDel').click(); } });

/* ---------- Menus and buttons ---------- */
(() => {
  const view = MENUS.find(m => m.label === 'View').items;
  view.splice(view.findIndex(it => it.label === 'Overview Bar'), 0, { label: 'Spectrogram', check: () => specOn, run: toggleSpectrogram, en: has.audio });
  const fx = MENUS.find(m => m.label === 'Effects').items;
  fx.splice(fx.findIndex(it => it.label === 'Equalizer…'), 0, { label: 'AI Noise Removal…', run: fxAiNoise, en: has.audio });
  const voice = MENUS.find(m => m.label === 'Voice').items;
  voice.splice(voice.findIndex(it => it.label && it.label.startsWith('Remove Filler Words')), 0,
    { label: 'Transcribe & Edit by Text…', run: openTranscript, en: has.audio, title: 'Speech to text; delete words to cut the audio' });
  voice.splice(voice.findIndex(it => it.label === 'Voice Cleanup'), 0, { label: 'AI Noise Removal…', run: fxAiNoise, en: has.audio, title: 'Neural-network noise removal for speech' });
  const mk = (id, text, title, fn, cls) => { const b = document.createElement('button'); b.className = 'btn' + (cls ? ' ' + cls : ''); b.type = 'button'; b.id = id; b.textContent = text; b.title = title; b.onclick = fn; return b; };
  $('noiseBtn').after(mk('rnnBtn', 'AI noise removal…', 'A neural network trained on speech removes background noise — no noise sample needed', fxAiNoise, 'fx-need'));
  $('zoomFitBtn').after(mk('specBtn', 'Spectrogram', 'Show the frequencies (spectrogram) instead of the waveform', toggleSpectrogram));
  $('specBtn').classList.toggle('on', specOn); $('specBtn').setAttribute('aria-pressed', specOn);
  // The filler-word window gets a link to the (more accurate) transcript way.
  const fl = $('fillScan'); if (fl) fl.after(mk('fillTrBtn', 'Use speech recognition…', 'Find fillers from a transcript (more accurate, downloads a model once)', () => { $('fillDlg').close(); openTranscript(); }));
})();
