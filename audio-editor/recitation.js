// Audio editor — recitation & teaching tools: name parts from a list, memorisation tracks,
// timestamps export/import, and opening audio from a link (?open=…).
'use strict';

/* ---------- Name all parts from a list ---------- */
async function nameParts() {
  if (!doc || !len()) return;
  const segs = segments();
  if (segs.length < 2) { toast('First add markers (or Auto-split at pauses) to make parts.'); return; }
  const v = await askParams('Name the parts', `Type or paste one name per line — line 1 names part 1, and so on (${segs.length} parts). Names are used for the saved files, e.g. “${baseName()}-01-Al-Fatiha 1”.`, [
    { id: 'names', label: 'Names', type: 'textarea', value: segs.map((_, i) => (doc.labels && doc.labels[i]) || '').join('\n') },
  ], { ok: 'Save names' });
  if (!v) return;
  const lines = v.names.split(/\r?\n/).map(x => x.trim());
  const labels = segs.map((_, i) => lines[i] || '');
  const d = makeDoc(doc.sr, doc.ch, doc.markers.slice()); d.labels = labels;
  commit(d, `Named ${labels.filter(Boolean).length} parts`);
}

/* ---------- Memorisation track ---------- */
const MEM_PATTERNS = [
  ['each', 'Each part repeated (1 1 1, 2 2 2, …)'],
  ['link', 'Linked (1, 2, then 1+2, 3, then 2+3, …)'],
  ['cumulative', 'Growing (1, then 1–2, then 1–3, …)'],
];
async function memorisationTrack() {
  if (!doc || !len()) return;
  const segs = segments();
  if (segs.length < 2) { toast('First add markers (or Auto-split at pauses) so each line or ayah is a part.'); return; }
  const v = await askParams('Memorisation track', `Builds a practice recording from the ${segs.length} parts — each part (or group) is repeated with pauses so you can recite along. It opens as a new tab; the original is not changed.`, [
    { id: 'pattern', label: 'Pattern', type: 'select', value: 'each', options: MEM_PATTERNS },
    { id: 'reps', label: 'Repeat each part / group', value: 3, min: 1, max: 20, step: 1, unit: 'times' },
    { id: 'gapRep', label: 'Pause between repeats (time to recite it back)', value: 1.5, min: 0, max: 30, step: 0.5, unit: 's' },
    { id: 'gapPart', label: 'Pause before the next part', value: 2, min: 0, max: 30, step: 0.5, unit: 's' },
    { id: 'whole', type: 'check', label: 'Finish with the whole passage once', value: true },
    { id: 'fromTo', label: 'Parts to use (e.g. 1-7, or leave empty for all)', type: 'text', value: '' },
  ], { ok: 'Build' });
  if (!v) return;
  let first = 0, last = segs.length - 1;
  const m = String(v.fromTo || '').match(/^\s*(\d+)\s*(?:[-–]\s*(\d+))?\s*$/);
  if (m) { first = clamp(+m[1] - 1, 0, segs.length - 1); last = clamp(+(m[2] || m[1]) - 1, first, segs.length - 1); }
  const name = i => (doc.labels && doc.labels[i]) || `Part ${i + 1}`;
  const items = []; // { a, b, label }
  const span = (i, j) => ({ a: segs[i][0], b: segs[j][1], label: i === j ? name(i) : `${name(i)} – ${name(j)}` });
  for (let i = first; i <= last; i++) {
    if (v.pattern === 'each') items.push(span(i, i));
    else if (v.pattern === 'cumulative') items.push(span(first, i));
    else { items.push(span(i, i)); if (i > first) items.push(span(i - 1, i)); }
  }
  if (v.whole) items.push({ ...span(first, last), label: 'Whole passage', once: true });
  const sr = doc.sr, gr = Math.round(v.gapRep * sr), gp = Math.round(v.gapPart * sr);
  let total = 0;
  const plan = items.map(it => { const n = it.once ? 1 : v.reps, len1 = it.b - it.a, size = n * len1 + (n - 1) * gr; total += size + gp; return { ...it, n, len1, size }; });
  total -= gp;
  if (total / sr > 3600 && !confirm(`The practice track will be ${fmt(total / sr)} long. Build it anyway?`)) return;
  busy(true);
  setTimeout(() => {
    try {
      const ch = doc.ch.map(() => new Float32Array(total)), markers = [], labels = [];
      let o = 0;
      plan.forEach((it, k) => {
        if (k) markers.push(o);
        labels.push(it.once ? it.label : `${it.label} ×${it.n}`);
        for (let r = 0; r < it.n; r++) { doc.ch.forEach((c, j) => ch[j].set(c.subarray(it.a, it.b), o)); o += it.len1 + (r < it.n - 1 ? gr : 0); }
        o += gp;
      });
      const d = makeDoc(sr, ch, markers); d.labels = labels;
      const base = baseName();
      newDocument(d, `${base} - memorise`, false);
      dirty = true; refresh();
      toast(`Practice track ready: ${plan.length} blocks, ${fmt(total / sr)}`);
    } finally { busy(false); }
  }, 30);
}

/* ---------- Timestamps export / import ---------- */
const TS_FORMATS = [
  ['txt', 'Plain text list (.txt)'], ['csv', 'Spreadsheet (.csv)'], ['json', 'JSON — for websites and apps (.json)'],
  ['srt', 'Subtitles (.srt)'], ['lrc', 'Lyrics (.lrc)'], ['labels', 'Audacity labels (.txt)'],
];
const two = n => String(n).padStart(2, '0'), three = n => String(n).padStart(3, '0');
const srtTime = t => { const ms = Math.round(t * 1000); return `${two(Math.floor(ms / 3600000))}:${two(Math.floor(ms / 60000) % 60)}:${two(Math.floor(ms / 1000) % 60)},${three(ms % 1000)}`; };
const lrcTime = t => `${two(Math.floor(t / 60))}:${(t % 60).toFixed(2).padStart(5, '0')}`;
function timestampsText(kind) {
  const sr = doc.sr, segs = segments().length >= 2 ? segments() : [[0, len()]];
  const rows = segs.map(([a, b], i) => ({ n: i + 1, start: a / sr, end: b / sr, name: (doc.labels && doc.labels[i]) || '' }));
  const nm = r => r.name || `Part ${r.n}`;
  if (kind === 'csv') return 'part,start,end,duration,name\n' + rows.map(r => [r.n, r.start.toFixed(3), r.end.toFixed(3), (r.end - r.start).toFixed(3), '"' + r.name.replace(/"/g, '""') + '"'].join(',')).join('\n') + '\n';
  if (kind === 'json') return JSON.stringify({ file: baseName(), sampleRate: sr, duration: +(len() / sr).toFixed(3), parts: rows.map(r => ({ part: r.n, start: +r.start.toFixed(3), end: +r.end.toFixed(3), name: r.name })) }, null, 2) + '\n';
  if (kind === 'srt') return rows.map(r => `${r.n}\n${srtTime(r.start)} --> ${srtTime(r.end)}\n${nm(r)}\n`).join('\n');
  if (kind === 'lrc') return `[ti:${baseName()}]\n` + rows.map(r => `[${lrcTime(r.start)}]${nm(r)}`).join('\n') + '\n';
  if (kind === 'labels') return rows.map(r => `${r.start.toFixed(6)}\t${r.end.toFixed(6)}\t${nm(r)}`).join('\n') + '\n';
  return rows.map(r => `${two(r.n)}  ${fmt(r.start)} – ${fmt(r.end)}  ${r.name}`.trimEnd()).join('\n') + '\n';
}
async function exportTimestamps(kind) {
  if (!doc || !len()) return;
  if (!kind) {
    const v = await askParams('Export timestamps', 'Saves the start and end time (and name) of every part — for websites, subtitles, or your notes.', [
      { id: 'kind', label: 'Format', type: 'select', value: 'txt', options: TS_FORMATS },
      { id: 'copy', type: 'check', label: 'Also copy it to the clipboard', value: false },
    ], { ok: 'Save' });
    if (!v) return; kind = v.kind;
    if (v.copy) try { await navigator.clipboard.writeText(timestampsText(kind)); } catch (e) {}
  }
  const extn = { txt: '.txt', csv: '.csv', json: '.json', srt: '.srt', lrc: '.lrc', labels: '-labels.txt' }[kind];
  downloadBlob(new TextEncoder().encode(timestampsText(kind)), baseName() + '-timestamps' + extn, kind === 'json' ? 'application/json' : 'text/plain');
}
function parseTimestamps(text) {
  const t = text.replace(/^﻿/, '').trim(), out = []; // [{ start, end?, name }]
  const hms = s => { const m = s.trim().replace(',', '.').split(':').map(Number); return m.reduce((a, x) => a * 60 + x, 0); };
  if (t.startsWith('{') || /^\[\s*[{\]]/.test(t)) { // JSON (LRC files also start with “[”, e.g. [ti:…])
    const j = JSON.parse(t), parts = Array.isArray(j) ? j : j.parts || [];
    for (const p of parts) out.push({ start: +p.start, end: p.end != null ? +p.end : undefined, name: p.name || p.label || p.text || '' });
  } else if (/-->/.test(t)) { // SRT / VTT
    for (const block of t.split(/\n\s*\n/)) {
      const m = block.match(/([\d:.,]+)\s*-->\s*([\d:.,]+)[^\n]*\n?([\s\S]*)/);
      if (m) out.push({ start: hms(m[1]), end: hms(m[2]), name: m[3].trim().replace(/\n/g, ' ') });
    }
  } else if (/^\[\d+:\d/m.test(t)) { // LRC
    for (const line of t.split('\n')) { const m = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/); if (m) out.push({ start: +m[1] * 60 + +m[2], name: m[3].trim() }); }
  } else {
    for (const line of t.split('\n')) {
      if (/^\s*part\s*,/i.test(line)) continue; // CSV header
      const cells = line.includes('\t') ? line.split('\t') : line.split(',');
      if (cells.length >= 2 && !isNaN(parseFloat(cells[0])) && !/:/.test(cells[0])) {
        const csv = !line.includes('\t') && cells.length >= 4;
        out.push(csv ? { start: +cells[1], end: +cells[2], name: cells.slice(4).join(',').replace(/^"|"$/g, '').replace(/""/g, '"') } : { start: +cells[0], end: +cells[1], name: (cells[2] || '').trim() });
      } else { // "01  0:00.000 – 0:03.250  Name"
        const m = line.match(/(\d+:\d+(?:\.\d+)?)\s*[–-]\s*(\d+:\d+(?:\.\d+)?)\s*(.*)$/);
        if (m) out.push({ start: hms(m[1]), end: hms(m[2]), name: m[3].trim() });
      }
    }
  }
  return out.filter(p => isFinite(p.start)).sort((a, b) => a.start - b.start);
}
async function importTimestamps(file) {
  if (!doc || !len()) { toast('Open the audio first, then import its timestamps.'); return; }
  let parts;
  try { parts = parseTimestamps(await file.text()); } catch (e) { parts = []; }
  if (!parts.length) { toast(`No timestamps found in “${file.name}”.`); return; }
  const sr = doc.sr, L = len(), bounds = new Set();
  const starts = parts.map(p => Math.round(p.start * sr));
  const markers = [...new Set(starts.filter(s0 => s0 > 0 && s0 < L))].sort((a, b) => a - b);
  // A gap before a part (end of one < start of the next) is kept as its own unnamed part.
  parts.forEach(p => { if (p.end != null) { const e = Math.round(p.end * sr); if (e > 0 && e < L && !starts.includes(e)) bounds.add(e); } });
  const all = [...new Set([...markers, ...bounds])].sort((a, b) => a - b);
  const labels = [0, ...all].map(s0 => { const p = parts.find(q => Math.round(q.start * sr) === s0); return p ? p.name : ''; });
  const d = makeDoc(sr, doc.ch, all); d.labels = labels;
  commit(d, `Imported ${parts.length} timestamps`);
}
const tsIn = document.createElement('input');
tsIn.type = 'file'; tsIn.accept = '.txt,.csv,.json,.srt,.vtt,.lrc'; tsIn.hidden = true; document.body.appendChild(tsIn);
tsIn.addEventListener('change', () => { const f = tsIn.files[0]; tsIn.value = ''; if (f) importTimestamps(f); });

/* ---------- askParams: multi-line text fields ---------- */
// (used by "Name the parts"; other dialogs are unaffected)
const _askParams = askParams;
askParams = function (title, desc, fields, opts) {
  const p = _askParams(title, desc, fields, opts);
  fields.forEach(f => {
    if (f.type !== 'textarea') return;
    const inp = $('pf_' + f.id); if (!inp) return;
    const ta = document.createElement('textarea');
    ta.id = inp.id; ta.value = f.value; ta.rows = 10; ta.dir = 'auto';
    ta.style.cssText = 'width:100%; font:14px/1.5 var(--ui); padding:8px; border:1px solid var(--gold-soft); border-radius:8px; background:var(--surface); resize:vertical';
    inp.replaceWith(ta); ta.focus();
    ta.addEventListener('keydown', e => e.stopPropagation()); // Enter makes a new line, not "OK"
  });
  return p;
};
const _paramValues = paramValues;
paramValues = function () {
  const v = _paramValues();
  for (const f of paramState.fields) if (f.type === 'textarea') v[f.id] = $('pf_' + f.id).value;
  return v;
};

/* ---------- Open audio from a link: …/audio-editor/?open=<url>&name=<title> ---------- */
(async () => {
  const qs = new URLSearchParams(location.search), url = qs.get('open');
  if (!url) return;
  history.replaceState(null, '', location.pathname); // don't reopen on refresh
  busy(true);
  try {
    const res = await fetch(new URL(url, location.href));
    if (!res.ok) throw new Error(res.status);
    const blob = await res.blob();
    const name = qs.get('name') || decodeURIComponent(new URL(url, location.href).pathname.split('/').pop() || 'audio');
    await loadFile(new File([blob], /\.\w{2,4}$/.test(name) ? name : name + '.mp3', { type: blob.type }), { remember: false });
  } catch (e) {
    console.warn(e);
    toast('Could not download that audio (the site may not allow it). Save the file to your device and open it with Open….');
  } finally { busy(false); }
})();

/* ---------- Buttons and menus ---------- */
(() => {
  const row = $('zipBtn').parentElement;
  const mk = (label, title, fn) => { const bt = document.createElement('button'); bt.className = 'btn'; bt.type = 'button'; bt.textContent = label; bt.title = title; bt.onclick = fn; row.appendChild(bt); return bt; };
  mk('Name parts…', 'Give every part a name at once (one per line)', nameParts);
  mk('Memorise…', 'Build a practice track that repeats each part', memorisationTrack);
  mk('Timestamps…', 'Save the start/end times of the parts (txt, csv, json, srt, lrc)', () => exportTimestamps());
  row.style.flexWrap = 'wrap';
  const bm = MENUS.find(m => m.label === 'Bookmark').items;
  bm.push('-',
    { label: 'Name Parts from a List…', run: nameParts, en: has.markers },
    { label: 'Memorisation Track…', run: memorisationTrack, en: has.markers },
    { label: 'Export Timestamps', sub: () => TS_FORMATS.map(([k, l]) => ({ label: l, run: () => exportTimestamps(k), en: has.audio })) },
    { label: 'Import Timestamps…', run: () => tsIn.click(), en: has.audio });
  const tools = MENUS.find(m => m.label === 'Tools').items;
  tools.splice(tools.findIndex(it => it.label === 'Generate Tone…'), 0, { label: 'Memorisation Track…', run: memorisationTrack, en: has.markers });
})();
