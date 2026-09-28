// Audio editor — menu bar and menus, pointer editing on the waveform, buttons, keyboard shortcuts, drag and drop.
// Part of the main program: editor.js and its editor-*.js parts load in order as classic scripts and share top-level names.
'use strict';

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
