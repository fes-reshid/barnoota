// Audio editor — autosave & recovery. Keeps the open tabs (audio, names, markers, tags) and the
// multitrack session in this browser's IndexedDB, a few seconds after each change, so a closed tab,
// crash or flat battery doesn't lose work. Nothing leaves the device.
'use strict';

const AS_DB = 'diin-audio-editor-autosave';
let asDbP = null;
function asDb() {
  return asDbP || (asDbP = new Promise((res, rej) => {
    const r = indexedDB.open(AS_DB, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('audio'); r.result.createObjectStore('meta'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
}
const asReq = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function asTx(stores, mode, fn) {
  const db = await asDb(), tx = db.transaction(stores, mode), out = await fn(tx);
  await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
  return out;
}

// Audio arrays are immutable in the editor, so each one gets a stable id and is written once.
const asIds = new WeakMap(); let asNext = Date.now();
const asIdFor = ch => { if (!asIds.has(ch[0])) asIds.set(ch[0], 'a' + (asNext++).toString(36)); return asIds.get(ch[0]); };
let asWritten = new Set(), asLastSig = '', asBusy = false, asEnabled = true, asRestoring = false;

function asSnapshot() {
  stashTab();
  const audioRefs = new Map(); // id → { ch, sr }
  const ref = (ch, sr) => { const id = asIdFor(ch); audioRefs.set(id, { ch, sr }); return id; };
  const meta = {
    savedAt: Date.now(), activeIndex: tabs.indexOf(active),
    tabs: tabs.filter(t => t.doc).map(t => ({ name: t.name, dirty: !!t.dirty, markers: t.doc.markers, labels: t.doc.labels || null, tags: t.tags || null, audio: ref(t.doc.ch, t.doc.sr), sr: t.doc.sr })),
    multitrack: mt.tracks.length ? {
      pps: mt.pps, scroll: mt.scroll, playhead: mt.playhead, markers: mt.markers, loop: mt.loop, looping: mt.looping,
      tracks: mt.tracks.map(({ id, name, vol, pan, mute, solo, color }) => ({ id, name, vol, pan, mute, solo, color })),
      clips: mt.clips.map(c => ({ id: c.id, track: c.track, start: c.start, offset: c.offset, dur: c.dur, name: c.name, srcName: c.src.name, audio: ref(c.src.ch, c.src.sr), sr: c.src.sr, fadeIn: c.fadeIn || 0, fadeOut: c.fadeOut || 0, gain: c.gain == null ? 1 : c.gain })),
    } : null,
  };
  return { meta, audioRefs };
}
async function asSave(force) {
  if (!asEnabled || asBusy || asRestoring) return;
  const { meta, audioRefs } = asSnapshot();
  const sig = JSON.stringify({ ...meta, savedAt: 0, tags: undefined, tabs: meta.tabs.map(t => ({ ...t, tags: t.tags ? Object.keys(t.tags).join() + (t.tags.cover ? t.tags.cover.data.length : '') : '' })) });
  if (!force && sig === asLastSig) return;
  asBusy = true;
  try {
    await asTx(['audio', 'meta'], 'readwrite', async tx => {
      const as = tx.objectStore('audio');
      for (const [id, { ch, sr }] of audioRefs) if (!asWritten.has(id)) { as.put({ sr, ch }, id); asWritten.add(id); }
      // Drop audio no longer used by anything open.
      const keys = await asReq(as.getAllKeys());
      for (const k of keys) if (!audioRefs.has(k)) { as.delete(k); asWritten.delete(k); }
      tx.objectStore('meta').put(meta, 'session');
    });
    asLastSig = sig;
  } catch (e) {
    console.warn('Autosave failed', e);
    if (e && e.name === 'QuotaExceededError') { asEnabled = false; toast('Autosave is off: this browser has no more storage space. Save a project to keep your work.'); }
  } finally { asBusy = false; }
}
async function asLoad() {
  try {
    return await asTx(['audio', 'meta'], 'readonly', async tx => {
      const meta = await asReq(tx.objectStore('meta').get('session'));
      if (!meta || (!meta.tabs.length && !(meta.multitrack && meta.multitrack.clips.length))) return null;
      const audio = new Map();
      const need = new Set([...meta.tabs.map(t => t.audio), ...(meta.multitrack ? meta.multitrack.clips.map(c => c.audio) : [])]);
      for (const id of need) { const a = await asReq(tx.objectStore('audio').get(id)); if (a) audio.set(id, a); }
      return { meta, audio };
    });
  } catch (e) { console.warn(e); return null; }
}
async function asRestore(saved) {
  asRestoring = true;
  try {
    const { meta, audio } = saved, made = [];
    for (const t of meta.tabs) {
      const a = audio.get(t.audio); if (!a) continue;
      asIds.set(a.ch[0], t.audio); asWritten.add(t.audio);
      const d = makeDoc(a.sr, a.ch, (t.markers || []).filter(m => m > 0 && m < a.ch[0].length));
      if (t.labels) d.labels = t.labels;
      newDocument(d, t.name, false);
      active.tags = t.tags || undefined; dirty = t.dirty; made.push(active);
    }
    if (made[meta.activeIndex]) showTab(made[meta.activeIndex]);
    const m = meta.multitrack;
    if (m) {
      mt.tracks = m.tracks.map(t => ({ ...t }));
      mt.clips = m.clips.filter(c => audio.has(c.audio)).map(c => {
        const a = audio.get(c.audio); asIds.set(a.ch[0], c.audio); asWritten.add(c.audio);
        return { id: c.id, track: c.track, start: c.start, offset: c.offset, dur: c.dur, name: c.name, fadeIn: c.fadeIn || 0, fadeOut: c.fadeOut || 0, gain: c.gain == null ? 1 : c.gain, src: { name: c.srcName || c.name, sr: a.sr, ch: a.ch } };
      });
      mt.pps = m.pps || 60; mt.scroll = m.scroll || 0; mt.playhead = m.playhead || 0;
      mt.markers = m.markers || []; mt.loop = m.loop || null; mt.looping = !!m.looping && !!m.loop; mt.picked = new Set();
      mt.nextId = Math.max(0, ...mt.tracks.map(t => t.id), ...mt.clips.map(c => c.id)) + 1;
      mt.undo = []; mt.redo = []; mt.sel = null; mt.selTrack = mt.tracks[0] ? mt.tracks[0].id : null;
    }
    if (active) refresh();
    toast(`Restored ${made.length} file${made.length === 1 ? '' : 's'}${m && m.clips.length ? ' and your multitrack session' : ''}`);
  } finally { asRestoring = false; }
}
async function asDiscard() {
  try { await asTx(['audio', 'meta'], 'readwrite', tx => { tx.objectStore('audio').clear(); tx.objectStore('meta').delete('session'); }); } catch (e) {}
  asWritten.clear(); asLastSig = '';
}

// Offer the saved session on the start screen.
(async () => {
  const saved = await asLoad();
  if (saved && !tabs.length) {
    const box = document.createElement('div');
    box.id = 'restoreBox';
    box.style.cssText = 'margin:0 auto 22px; max-width:560px; background:var(--green-bg); border:1.5px solid var(--green); border-radius:12px; padding:14px 16px; text-align:left; font-family:var(--ui); font-size:14px;';
    const n = saved.meta.tabs.length, when = new Date(saved.meta.savedAt);
    const names = saved.meta.tabs.slice(0, 3).map(t => t.name).join(', ') + (n > 3 ? '…' : '');
    box.innerHTML = `<strong style="font-size:15px; color:var(--ink-navy)">Continue where you left off?</strong>
      <div style="margin:4px 0 10px; color:var(--muted)">${n} file${n === 1 ? '' : 's'}${saved.meta.multitrack && saved.meta.multitrack.clips.length ? ' and a multitrack session' : ''} from ${when.toLocaleString()}${names ? ' — ' + names.replace(/[<>&]/g, '') : ''}</div>
      <button class="btn primary" id="restoreYes" type="button">Restore my work</button>
      <button class="btn" id="restoreNo" type="button">Start fresh</button>`;
    const main = document.querySelector('main'); main.insertBefore(box, main.firstChild); // stays visible after opening files too
    $('restoreYes').onclick = async () => { box.remove(); busy(true); try { await asRestore(saved); } finally { busy(false); } };
    $('restoreNo').onclick = async () => { if (confirm('Delete the automatically saved work? This cannot be undone.')) { box.remove(); await asDiscard(); } };
  }
  // Start saving only after the offer is answered (or there was nothing to restore).
  setInterval(() => { if (!document.getElementById('restoreBox')) asSave(false); }, 4000);
})();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && !document.getElementById('restoreBox')) asSave(false); });
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// Settings entry: turn autosave off/on (e.g. on a shared computer).
(() => {
  try { if (localStorage.getItem('ae-autosave') === 'off') asEnabled = false; } catch (e) {}
  const file = MENUS.find(m => m.label === 'File').items, i = file.findIndex(it => it.label === 'Save Project');
  file.splice(i + 1, 0, { label: 'Autosave in This Browser', check: () => asEnabled, run: async () => {
    asEnabled = !asEnabled;
    try { localStorage.setItem('ae-autosave', asEnabled ? 'on' : 'off'); } catch (e) {}
    if (!asEnabled) { await asDiscard(); toast('Autosave is off and the saved copy was deleted.'); } else { asSave(true); toast('Autosave is on.'); }
  } });
})();
