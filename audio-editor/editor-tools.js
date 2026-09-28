// Audio editor — text to speech, filler words, beat detection, Save As / Save All / projects, help links.
// Part of the main program: editor.js and its editor-*.js parts load in order as classic scripts and share top-level names.
'use strict';

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
