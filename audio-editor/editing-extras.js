// Audio editor — right-click menu, effect presets, effect chains, punch-in recording,
// metronome and count-in. Loaded after editor.js.
'use strict';

/* ---------- Saved presets in effect dialogs ---------- */
const PRESET_KEY = 'ae-presets';
const loadPresets = () => { try { return JSON.parse(localStorage.getItem(PRESET_KEY)) || {}; } catch (e) { return {}; } };
const savePresets = p => { try { localStorage.setItem(PRESET_KEY, JSON.stringify(p)); } catch (e) {} };
{
  const base = askParams;
  askParams = function (title, desc, fields, opts = {}) {
    const promise = base(title, desc, fields, opts);
    // Effects (dialogs with a preview) get a preset row: pick saved values, or save the current ones.
    if (opts.preview && fields.some(f => f.type !== 'check')) {
      const all = loadPresets(), mine = all[title] || {};
      const row = document.createElement('div'); row.className = 'field-row preset-row'; row.style.cssText = 'margin:-4px 0 12px; gap:6px';
      row.innerHTML = '<select class="num" style="flex:1; width:auto"></select><button class="btn" type="button">Save preset…</button><button class="btn" type="button" title="Delete this preset">✕</button>';
      const [sel, saveB, delB] = row.children;
      const fill = () => {
        sel.innerHTML = ''; sel.add(new Option(Object.keys(mine).length ? 'Presets…' : 'No saved presets yet', ''));
        Object.keys(mine).sort().forEach(n => sel.add(new Option(n, n)));
        delB.disabled = true;
      };
      fill();
      sel.onchange = () => {
        const vals = mine[sel.value]; delB.disabled = !vals; if (!vals) return;
        for (const f of fields) { const el = $('pf_' + f.id); if (!el || !(f.id in vals)) continue; if (f.type === 'check') el.checked = !!vals[f.id]; else el.value = vals[f.id]; }
      };
      saveB.onclick = () => {
        const name = (prompt('Name for this preset (e.g. “My recitation room”):', sel.value || '') || '').trim(); if (!name) return;
        mine[name] = paramValues(); all[title] = mine; savePresets(all); fill(); sel.value = name; delB.disabled = false;
        toast(`Preset “${name}” saved`);
      };
      delB.onclick = () => { if (!sel.value) return; delete mine[sel.value]; all[title] = mine; savePresets(all); fill(); };
      $('paramFields').prepend(row);
    }
    return promise;
  };
}

/* ---------- Effect chains ---------- */
const echoGraph = v => (ctx, src) => { const out = ctx.createGain(), d = ctx.createDelay(5), fb = ctx.createGain(); d.delayTime.value = v.delay / 1000; fb.gain.value = v.decay / 100; src.connect(out); src.connect(d); d.connect(fb); fb.connect(d); fb.connect(out); return out; };
const compGraph = v => (ctx, src) => { const c = ctx.createDynamicsCompressor(); c.threshold.value = v.thr; c.ratio.value = v.ratio; c.knee.value = 8; c.attack.value = 0.005; c.release.value = 0.2; const g2 = ctx.createGain(); g2.gain.value = Math.pow(10, v.makeup / 20); return chain(src, c, g2); };
const reverbGraph = v => (ctx, src) => {
  const n = Math.round(v.size * ctx.sampleRate), nc = Math.min(2, ctx.destination.channelCount || 2), ir = ctx.createBuffer(nc, n, ctx.sampleRate);
  for (let k = 0; k < nc; k++) { const d = ir.getChannelData(k); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
  const conv = ctx.createConvolver(); conv.buffer = ir; const dry = ctx.createGain(), wet = ctx.createGain(), out = ctx.createGain();
  dry.gain.value = 1 - v.mix / 200; wet.gain.value = v.mix / 100; src.connect(dry); dry.connect(out); src.connect(conv); conv.connect(wet); wet.connect(out); return out;
};
const CHAIN_FX = {
  highpass: { label: 'Remove rumble', fields: [{ id: 'f', label: 'Cut below', value: 90, min: 20, max: 1000, step: 10, unit: 'Hz' }], run: (ch, sr, v) => renderOffline(ch, sr, (c, s) => chain(s, biquad(c, 'highpass', v.f), biquad(c, 'highpass', v.f))) },
  lowpass: { label: 'Remove hiss', fields: [{ id: 'f', label: 'Cut above', value: 7000, min: 500, max: 20000, step: 100, unit: 'Hz' }], run: (ch, sr, v) => renderOffline(ch, sr, (c, s) => chain(s, biquad(c, 'lowpass', v.f), biquad(c, 'lowpass', v.f))) },
  noise: { label: 'Noise reduction (automatic)', fields: [{ id: 'amount', label: 'Reduce by', value: 15, min: 3, max: 40, step: 1, unit: 'dB' }, { id: 'sens', label: 'Sensitivity', value: 1.5, min: 0.5, max: 4, step: 0.1 }], run: (ch, sr, v) => reduceNoise(ch, sr, { src: 'auto', amount: v.amount, sens: v.sens }) },
  gate: { label: 'Noise gate', fields: [{ id: 'thr', label: 'Mute below', value: -48, min: -90, max: -5, step: 1, unit: 'dB' }, { id: 'hold', label: 'Hold', value: 80, min: 10, max: 1000, step: 10, unit: 'ms' }], run: async (ch, sr, v) => gateCh(ch, sr, v.thr, v.hold) },
  declick: { label: 'Click / pop removal', fields: [{ id: 'sens', label: 'Sensitivity', value: 5, min: 1, max: 10, step: 1 }], run: async (ch, sr, v) => declickCh(ch, sr, v.sens).out },
  eq: { label: 'Equaliser preset', fields: [{ id: 'preset', label: 'Preset', type: 'select', value: 'Voice clarity', options: Object.keys(EQ_PRESETS).map(k => [k, k]) }], run: (ch, sr, v) => renderOffline(ch, sr, (c, s) => chain(s, ...eqFilters(c, EQ_PRESETS[v.preset] || EQ_PRESETS.Flat))) },
  compressor: { label: 'Compressor', fields: [{ id: 'thr', label: 'Above', value: -24, min: -60, max: 0, step: 1, unit: 'dB' }, { id: 'ratio', label: 'Ratio', value: 3, min: 1, max: 20, step: 0.5 }, { id: 'makeup', label: 'Make-up', value: 4, min: 0, max: 24, step: 1, unit: 'dB' }], run: (ch, sr, v) => renderOffline(ch, sr, compGraph(v)) },
  echo: { label: 'Echo', fields: [{ id: 'delay', label: 'Delay', value: 300, min: 20, max: 2000, step: 10, unit: 'ms' }, { id: 'decay', label: 'Each echo', value: 35, min: 5, max: 90, step: 5, unit: '%' }], run: (ch, sr, v) => renderOffline(ch, sr, echoGraph(v)) },
  reverb: { label: 'Reverb', fields: [{ id: 'size', label: 'Room size', value: 1.5, min: 0.2, max: 8, step: 0.1, unit: 's' }, { id: 'mix', label: 'Amount', value: 20, min: 0, max: 100, step: 5, unit: '%' }], run: (ch, sr, v) => renderOffline(ch, sr, reverbGraph(v)) },
  amplify: { label: 'Amplify', fields: [{ id: 'db', label: 'By', value: 3, min: -40, max: 40, step: 0.5, unit: 'dB' }], run: async (ch, sr, v) => { const k = Math.pow(10, v.db / 20); return ch.map(c => c.map(x => clamp(x * k, -1, 1))); } },
  normalise: { label: 'Normalise', fields: [{ id: 'peak', label: 'Loudest point at', value: -1, min: -20, max: 0, step: 0.5, unit: 'dB' }], run: async (ch, sr, v) => { let p = 0; for (const c of ch) for (const x of c) p = Math.max(p, Math.abs(x)); if (!p) return ch; const k = Math.pow(10, v.peak / 20) / p; return ch.map(c => c.map(x => x * k)); } },
  pitch: { label: 'Pitch', fields: [{ id: 'semi', label: 'Semitones', value: 1, min: -12, max: 12, step: 0.5 }], run: (ch, sr, v) => pitchShift(ch, sr, v.semi) },
  tempo: { label: 'Tempo (same pitch)', fields: [{ id: 'pct', label: 'Tempo', value: 90, min: 25, max: 400, step: 5, unit: '%' }], run: (ch, sr, v) => v.pct === 100 ? ch : timeStretch(ch, sr, v.pct / 100) },
  speed: { label: 'Speed (pitch follows)', fields: [{ id: 'pct', label: 'Speed', value: 110, min: 25, max: 400, step: 5, unit: '%' }], run: (ch, sr, v) => resample(ch, sr * v.pct / 100, sr) },
  fadein: { label: 'Fade in', fields: [{ id: 'ms', label: 'Length', value: 500, min: 0, max: 20000, step: 50, unit: 'ms' }], run: async (ch, sr, v) => fadeCh(ch, sr, v.ms, 0) },
  fadeout: { label: 'Fade out', fields: [{ id: 'ms', label: 'Length', value: 1500, min: 0, max: 20000, step: 50, unit: 'ms' }], run: async (ch, sr, v) => fadeCh(ch, sr, 0, v.ms) },
  trim: { label: 'Trim silent ends', fields: [{ id: 'thr', label: 'Silence below', value: -45, min: -90, max: -5, step: 1, unit: 'dB' }], run: async (ch, sr, v) => trimSilenceCh(ch, sr, v.thr) },
  mono: { label: 'Make mono', fields: [], run: async ch => fitChannels(ch, 1) },
};
const BUILTIN_CHAINS = {
  'Recitation polish': [['highpass', { f: 80 }], ['noise', { amount: 12, sens: 1.3 }], ['compressor', { thr: -24, ratio: 2.5, makeup: 3 }], ['normalise', { peak: -1 }]],
  'Clean voice (podcast / lesson)': [['highpass', { f: 90 }], ['noise', { amount: 15, sens: 1.5 }], ['gate', { thr: -50, hold: 100 }], ['eq', { preset: 'Voice clarity' }], ['compressor', { thr: -26, ratio: 3, makeup: 4 }], ['normalise', { peak: -1 }]],
  'Phone recording fix': [['highpass', { f: 150 }], ['declick', { sens: 5 }], ['eq', { preset: 'Voice clarity' }], ['compressor', { thr: -24, ratio: 3, makeup: 3 }], ['normalise', { peak: -1 }]],
  'WhatsApp voice note': [['trim', { thr: -45 }], ['mono', {}], ['highpass', { f: 90 }], ['normalise', { peak: -1 }]],
  'Slow down for memorising': [['tempo', { pct: 80 }], ['normalise', { peak: -1 }]],
};
const CHAIN_KEY = 'ae-chains';
const userChains = () => { try { return JSON.parse(localStorage.getItem(CHAIN_KEY)) || {}; } catch (e) { return {}; } };
const allChains = () => ({ ...BUILTIN_CHAINS, ...userChains() });
const chainOptions = () => Object.keys(allChains()).map(k => [k, k]);
const stepValues = (key, v) => Object.fromEntries(CHAIN_FX[key].fields.map(f => [f.id, v && f.id in v ? v[f.id] : f.value]));
async function runChain(steps, ch, sr, onStep) {
  for (let i = 0; i < steps.length; i++) {
    const [key, v] = steps[i], fx = CHAIN_FX[key]; if (!fx) continue;
    if (onStep) onStep(i, fx.label);
    ch = await fx.run(ch, sr, stepValues(key, v));
    await new Promise(r => setTimeout(r, 0));
  }
  return ch;
}
async function applyChainToRange(name, steps) {
  if (!doc || !len()) return;
  stopPlay();
  const whole = !hasSel(), [a, b] = range();
  await withBusy('Applying chain…', async () => {
    let out = await runChain(steps, sliceCh(doc.ch, a, b), doc.sr, (i, l) => busyText(`Step ${i + 1} of ${steps.length}: ${l}…`));
    if (whole) {
      const k = out[0].length / len(), markers = k === 1 ? doc.markers.slice() : doc.markers.map(m => Math.round(m * k)).filter(m => m > 0 && m < out[0].length);
      selA = selB = null; cursor = Math.min(cursor, out[0].length);
      commit(makeDoc(doc.sr, out, markers), `Effect chain: ${name}`);
      if (k !== 1) zoomFit();
    } else {
      out = fitChannels(out, doc.ch.length);
      commit(opReplace(a, b, out), `Effect chain: ${name}`);
      selB = selA + out[0].length; refresh();
    }
  });
}
// Chain editor dialog
const chainDlg = document.createElement('dialog');
chainDlg.className = 'dlg eq'; chainDlg.id = 'chainDlg';
chainDlg.innerHTML = `<div class="eq-top"><h2>Effect chain <span class="info" id="chScope"></span></h2></div>
  <p class="info" style="margin:0 0 10px">Several effects applied one after another in a single step — e.g. your usual clean-up. Start from a ready-made chain or build your own and save it.</p>
  <div class="row"><label>Chain <select id="chPick" class="num" style="width:auto; max-width:280px"></select></label>
    <button class="btn" id="chSave" type="button">Save as…</button><button class="btn" id="chDel" type="button">Delete</button></div>
  <ol class="list" id="chSteps" style="max-height:320px; padding-left:0; list-style:none"></ol>
  <div class="row" style="margin-top:10px"><select id="chAdd" class="num" style="width:auto"></select><button class="btn" id="chAddBtn" type="button">＋ Add step</button></div>
  <div class="actions"><button class="btn" id="chPreview" type="button">▶ Preview</button><span style="flex:1"></span>
    <button class="btn" id="chCancel" type="button">Close</button><button class="btn primary" id="chApply" type="button">Apply</button></div>`;
document.body.appendChild(chainDlg);
let chSteps = [], chName = '';
function chRender() {
  const ol = $('chSteps'); ol.innerHTML = '';
  if (!chSteps.length) ol.innerHTML = '<li class="empty">No steps yet — add one below.</li>';
  chSteps.forEach(([key, v], i) => {
    const fx = CHAIN_FX[key], li = document.createElement('li'); li.style.flexWrap = 'wrap';
    li.innerHTML = `<span class="idx" style="width:24px;height:24px;border-radius:50%;background:var(--green-bg);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px">${i + 1}</span><strong style="min-width:150px">${fx.label}</strong>`;
    const vals = stepValues(key, v); chSteps[i][1] = vals;
    fx.fields.forEach(f => {
      const lab = document.createElement('label'); lab.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:12px;color:var(--muted)';
      let inp;
      if (f.type === 'select') { inp = document.createElement('select'); f.options.forEach(([a, l]) => inp.add(new Option(l, a))); }
      else { inp = document.createElement('input'); inp.type = 'number'; for (const k of ['min', 'max', 'step']) if (f[k] !== undefined) inp[k] = f[k]; inp.style.width = '70px'; }
      inp.className = 'num'; inp.value = vals[f.id];
      inp.onchange = () => { vals[f.id] = f.type === 'select' ? inp.value : clamp(parseFloat(inp.value) || 0, f.min ?? -Infinity, f.max ?? Infinity); };
      lab.append(f.label + ' ', inp, f.unit ? ' ' + f.unit : ''); li.appendChild(lab);
    });
    const sp = document.createElement('span'); sp.style.flex = '1'; li.appendChild(sp);
    const mk = (t, title, fn, dis) => { const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = t; b.title = title; b.disabled = !!dis; b.onclick = fn; li.appendChild(b); };
    mk('↑', 'Move up', () => { [chSteps[i - 1], chSteps[i]] = [chSteps[i], chSteps[i - 1]]; chRender(); }, i === 0);
    mk('↓', 'Move down', () => { [chSteps[i + 1], chSteps[i]] = [chSteps[i], chSteps[i + 1]]; chRender(); }, i === chSteps.length - 1);
    mk('✕', 'Remove step', () => { chSteps.splice(i, 1); chRender(); });
    ol.appendChild(li);
  });
  $('chApply').disabled = $('chPreview').disabled = !chSteps.length;
  $('chDel').disabled = !(chName in userChains());
}
function chLoad(name) { chName = name; chSteps = (allChains()[name] || []).map(([k, v]) => [k, { ...v }]); chRender(); }
function openChains(preselect) {
  if (!doc || !len()) return;
  const pick = $('chPick'); pick.innerHTML = '';
  const g1 = document.createElement('optgroup'); g1.label = 'Ready-made'; Object.keys(BUILTIN_CHAINS).forEach(k => g1.appendChild(new Option(k, k))); pick.appendChild(g1);
  const u = Object.keys(userChains()); if (u.length) { const g2 = document.createElement('optgroup'); g2.label = 'My chains'; u.forEach(k => g2.appendChild(new Option(k, k))); pick.appendChild(g2); }
  pick.appendChild(new Option('— New empty chain —', ''));
  const add = $('chAdd'); add.innerHTML = ''; Object.entries(CHAIN_FX).forEach(([k, f]) => add.add(new Option(f.label, k)));
  pick.value = preselect && preselect in allChains() ? preselect : Object.keys(BUILTIN_CHAINS)[0];
  chLoad(pick.value);
  $('chScope').textContent = hasSel() ? '(selection)' : '(whole file)';
  chainDlg.showModal();
}
$('chPick').addEventListener('change', e => chLoad(e.target.value));
on('chAddBtn', () => { const k = $('chAdd').value; chSteps.push([k, stepValues(k)]); chRender(); });
on('chSave', () => {
  const name = (prompt('Name for this chain:', chName && !(chName in BUILTIN_CHAINS) ? chName : 'My chain') || '').trim(); if (!name) return;
  if (name in BUILTIN_CHAINS) { toast('That name is used by a ready-made chain — choose another.'); return; }
  const u = userChains(); u[name] = chSteps.map(([k, v]) => [k, { ...v }]); try { localStorage.setItem(CHAIN_KEY, JSON.stringify(u)); } catch (e) {}
  openChains(name); toast(`Chain “${name}” saved`);
});
on('chDel', () => { const u = userChains(); if (!(chName in u) || !confirm(`Delete the chain “${chName}”?`)) return; delete u[chName]; try { localStorage.setItem(CHAIN_KEY, JSON.stringify(u)); } catch (e) {} openChains(); });
on('chCancel', () => chainDlg.close());
on('chApply', () => { const steps = chSteps.map(([k, v]) => [k, { ...v }]), name = chName || 'Custom'; chainDlg.close(); applyChainToRange(name, steps); });
on('chPreview', async () => {
  stopPreview(); stopPlay();
  const [a, b0] = range(), b = Math.min(b0, a + doc.sr * 10);
  $('chPreview').disabled = true; $('chPreview').textContent = 'Working…';
  try {
    const out = await runChain(chSteps, sliceCh(doc.ch, a, b), doc.sr);
    const ctx = audio(); ctx.resume();
    const buf = ctx.createBuffer(out.length, Math.max(1, out[0].length), doc.sr); out.forEach((c, i) => buf.copyToChannel(c, i));
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(); previewSrc = src;
  } catch (e) { console.error(e); toast('Preview failed.'); }
  finally { $('chPreview').disabled = false; $('chPreview').textContent = '▶ Preview'; }
});
chainDlg.addEventListener('close', stopPreview);

/* ---------- Metronome and count-in (for all recording) ---------- */
const REC_KEY = 'ae-rec-options';
const recOpts = () => { try { return { bpm: 90, beats: 4, countIn: 0, metronome: false, preroll: 2, ...JSON.parse(localStorage.getItem(REC_KEY)) }; } catch (e) { return { bpm: 90, beats: 4, countIn: 0, metronome: false, preroll: 2 }; } };
function click(ctx, when, accent) {
  const o = ctx.createOscillator(), g2 = ctx.createGain();
  o.frequency.value = accent ? 1760 : 1100; g2.gain.setValueAtTime(0.0001, when); g2.gain.exponentialRampToValueAtTime(accent ? 0.6 : 0.35, when + 0.002); g2.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
  o.connect(g2); g2.connect(ctx.destination); o.start(when); o.stop(when + 0.08);
}
function countIn(o) { // resolves when the count-in finishes
  const n = o.countIn * o.beats; if (!n) return Promise.resolve();
  const ctx = audio(); ctx.resume();
  const t0 = ctx.currentTime + 0.1, beat = 60 / o.bpm;
  for (let i = 0; i < n; i++) click(ctx, t0 + i * beat, i % o.beats === 0);
  toast(`Count-in: ${n} beats…`);
  return new Promise(r => setTimeout(r, (0.1 + n * beat) * 1000 - 30));
}
let metroTimer = null;
function metronome(on) {
  clearInterval(metroTimer); metroTimer = null;
  if (!on) return;
  const o = recOpts(), ctx = audio(), beat = 60 / o.bpm; let next = ctx.currentTime + 0.05, i = 0;
  metroTimer = setInterval(() => {
    if (!rec && !mtRecorder && !punch) { metronome(false); return; }
    while (next < ctx.currentTime + 0.12) { click(ctx, next, i % o.beats === 0); next += beat; i++; }
  }, 25);
}
{
  const baseRecord = toggleRecord;
  let counting = false; // ignore extra presses during the count-in
  toggleRecord = async function () {
    if (rec) return baseRecord();
    if (counting) return;
    const o = recOpts(); counting = true;
    try { await countIn(o); } finally { counting = false; }
    await baseRecord();
    if (rec && o.metronome) metronome(true);
  };
  const baseMtRec = mtRec;
  mtRec = async function () {
    if (mtRecorder) return baseMtRec();
    if (counting) return;
    const o = recOpts(); counting = true;
    try { await countIn(o); } finally { counting = false; }
    await baseMtRec();
    if (mtRecorder && o.metronome) metronome(true);
  };
}
async function recordingOptions() {
  const o = recOpts(), est = Math.round(mtLatency() * 1000);
  const v = await askParams('Recording options', 'For recording in time with a beat. The metronome clicks come out of the speakers — use headphones so they aren’t recorded.', [
    { id: 'countIn', label: 'Count-in before recording starts', type: 'select', value: o.countIn, options: [[0, 'None'], [1, '1 bar'], [2, '2 bars']] },
    { id: 'metronome', type: 'check', label: 'Metronome click while recording', value: o.metronome },
    { id: 'bpm', label: 'Tempo', value: o.bpm, min: 30, max: 240, step: 1, unit: 'beats per minute' },
    { id: 'beats', label: 'Beats per bar', value: o.beats, min: 1, max: 12, step: 1 },
    { id: 'preroll', label: 'Punch-in: play this much before the selection', value: o.preroll, min: 0, max: 10, step: 0.5, unit: 's' },
    { id: 'latency', label: 'Multitrack: recording delay to correct', value: est, min: 0, max: 1000, step: 1, unit: 'ms (if new takes land late, raise this)' },
  ], { ok: 'Save' });
  if (!v) return;
  v.countIn = +v.countIn;
  if (typeof o.latency !== 'number' && v.latency === est) delete v.latency; // unchanged: keep following the browser's estimate
  try { localStorage.setItem(REC_KEY, JSON.stringify(v)); } catch (e) {}
  toast('Recording options saved');
}

/* ---------- Punch-in: re-record the selection ---------- */
let punch = null;
async function punchIn() {
  if (punch) { punchStop(); return; }
  if (!doc || !hasSel()) { toast('Select the part to re-record first.'); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Recording is not supported in this browser.'); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
  catch (e) { toast('Microphone permission was refused.'); return; }
  stopPlay(); stopPreview();
  const o = recOpts(), a = selA, b = selB, pre = Math.min(o.preroll, a / doc.sr);
  const ctx = audio(); await ctx.resume();
  const chunks = [], mr = new MediaRecorder(stream);
  let recStart = 0;
  mr.onstart = () => { recStart = performance.now(); };
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  // Pre-roll: play the audio just before the selection so you come in on time.
  const when = ctx.currentTime + 0.15, wallAtPunch = performance.now() + (0.15 + pre) * 1000;
  if (pre > 0) {
    const src = ctx.createBufferSource(); src.buffer = getPlayBuf(); src.connect(ctx.destination);
    src.start(when, (a / doc.sr) - pre, pre);
  }
  punch = { mr, stream, a, b, wallAtPunch };
  mr.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    const p = punch; punch = null; setRecLabel(null);
    try {
      const ab = await ctx.decodeAudioData(await new Blob(chunks, { type: mr.mimeType }).arrayBuffer());
      let ch = []; for (let i = 0; i < ab.numberOfChannels; i++) ch.push(ab.getChannelData(i));
      const skip = Math.max(0, Math.round((p.wallAtPunch - recStart) / 1000 * ab.sampleRate)); // drop the pre-roll
      ch = ch.map(c => c.slice(Math.min(skip, c.length)));
      if (!ch[0].length) { toast('Nothing was recorded after the pre-roll.'); return; }
      if (ab.sampleRate !== doc.sr) ch = await resample(ch, ab.sampleRate, doc.sr);
      ch = fitChannels(ch, doc.ch.length);
      const f = Math.min(Math.round(doc.sr * 0.01), ch[0].length >> 1); // 10 ms fades at the joins
      ch = ch.map(c => { for (let i = 0; i < f; i++) { c[i] *= i / f; c[c.length - 1 - i] *= i / f; } return c; });
      commit(opReplace(p.a, p.b, ch), 'Punch-in recording');
      selA = p.a; selB = p.a + ch[0].length; cursor = p.a; refresh();
    } catch (e) { console.error(e); toast('Could not decode the recording.'); }
  };
  mr.start();
  setRecLabel('■ Stop punch-in');
  toast(pre ? `Get ready — recording starts after ${pre.toFixed(1)} s of playback` : 'Recording…');
  if (o.metronome) metronome(true);
}
function punchStop() { if (punch && punch.mr.state !== 'inactive') punch.mr.stop(); }
{ // the record buttons stop a punch-in too
  const base = toggleRecord;
  toggleRecord = function () { if (punch) { punchStop(); return; } return base(); };
}

/* ---------- Right-click (and long-press) menu on the waveform ---------- */
function waveMenuItems(at) {
  return [
    { label: hasSel() ? 'Play Selection' : 'Play from Here', key: 'Space', run: () => { if (!hasSel()) cursor = at; togglePlay(); }, en: has.audio },
    { label: 'Zoom to Selection', key: 'Z', run: zoomSel, en: has.sel },
    '-',
    { label: 'Cut', key: 'Ctrl+X', run: cmdCut, en: has.sel },
    { label: 'Copy', key: 'Ctrl+C', run: cmdCopy, en: has.sel },
    { label: 'Paste', key: 'Ctrl+V', run: () => { if (!hasSel()) cursor = at; cmdPaste(); }, en: has.clip },
    { label: 'Delete', key: 'Del', run: () => cmdDelete(), en: has.sel },
    { label: 'Trim to Selection', key: 'T', run: cmdTrim, en: has.sel },
    { label: 'Duplicate to New Tab', key: 'Ctrl+D', run: duplicate, en: has.audio },
    '-',
    { label: 'Amplify…', run: amplifyDlg, en: has.audio },
    { label: 'Normalize', run: normalise, en: has.audio },
    { label: 'Fade In', run: fadeIn, en: has.audio },
    { label: 'Fade Out', run: fadeOut, en: has.audio },
    { label: 'Silence', run: silence, en: has.sel },
    { label: 'Effect Chain', sub: () => [...chainOptions().map(([k]) => ({ label: k, run: () => applyChainToRange(k, allChains()[k]) })), '-', { label: 'Edit chains…', run: () => openChains() }] },
    '-',
    { label: 'Add Marker Here', key: 'M', run: () => { cursor = at; selA = selB = null; addMarker(); }, en: has.audio },
    { label: 'Select This Part', run: () => { cursor = at; selectPart('part'); }, en: has.markers },
    { label: 'Re-record Selection (punch-in)…', run: punchIn, en: has.sel },
    { label: 'Save Selection As…', run: exportSel, en: has.sel },
  ];
}
function openWaveMenu(clientX, clientY) {
  const at = sampleAt(clientX);
  if (hasSel() && (at < selA || at > selB)) { selA = selB = null; cursor = at; refresh(); } // right-click outside the selection moves the cursor there
  else if (!hasSel()) { cursor = at; refresh(); }
  closeMenus();
  showMenu(waveMenuItems(at), { left: clientX, right: clientX, top: clientY, bottom: clientY }, 0, false);
}
canvas.addEventListener('contextmenu', e => { if (env || !doc || !len()) return; e.preventDefault(); openWaveMenu(e.clientX, e.clientY); });
{ // long-press on touch screens
  let lp = null;
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || env) return;
    const x0 = e.clientX, y0 = e.clientY, a0 = selA, b0 = selB;
    lp = { x0, y0, t: setTimeout(() => { lp = null; drag = null; selA = a0; selB = b0; openWaveMenu(x0, y0); }, 550) };
  });
  const cancel = e => { if (lp && (!e || e.type !== 'pointermove' || Math.hypot(e.clientX - lp.x0, e.clientY - lp.y0) > 8)) { clearTimeout(lp.t); lp = null; } };
  canvas.addEventListener('pointermove', cancel); canvas.addEventListener('pointerup', () => cancel()); canvas.addEventListener('pointercancel', () => cancel());
}

/* ---------- Menus and buttons ---------- */
(() => {
  const fx = MENUS.find(m => m.label === 'Effects').items;
  fx.splice(fx.findIndex(it => it.label === 'Equalizer…'), 0, { label: 'Effect Chains…', run: () => openChains(), en: has.audio },
    { label: 'Apply Chain', sub: () => chainOptions().map(([k]) => ({ label: k, run: () => applyChainToRange(k, allChains()[k]), en: has.audio })) }, '-');
  const ctl = MENUS.find(m => m.label === 'Control').items;
  ctl.splice(ctl.findIndex(it => it.label === 'Loop Selection') , 0,
    { label: 'Re-record Selection (punch-in)', run: punchIn, en: has.sel },
    { label: 'Recording Options (metronome, count-in)…', run: recordingOptions });
  const row = $('eqBtn').parentElement;
  const b = document.createElement('button'); b.className = 'btn fx-need'; b.type = 'button'; b.id = 'chainBtn'; b.textContent = 'Effect chain…';
  b.title = 'Several effects in one go — ready-made clean-ups or your own saved chains'; b.onclick = () => openChains(); row.prepend(b);
  const rb = document.createElement('button'); rb.className = 'btn'; rb.type = 'button'; rb.id = 'punchBtn'; rb.textContent = '⟲● Re-record';
  rb.title = 'Punch-in: play a little before the selection, then record over it'; rb.onclick = punchIn;
  $('recBtn').after(rb);
})();
