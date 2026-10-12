// Audio editor — the multitrack editor: tracks, clips, live mixing, recording a track, mixdown.
// Part of the main program: editor.js and its editor-*.js parts load in order as classic scripts and share top-level names.
'use strict';

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
on('mtMix', mtMixToTab); on('mtSaveProj', () => saveProject()); on('mtMixSave', mtMixSave); on('mtClose', mtClose);
window.addEventListener('resize', () => { if ($('mt').classList.contains('open')) mtRender(); });
