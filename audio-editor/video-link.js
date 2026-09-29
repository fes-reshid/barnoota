// Audio editor ↔ video editor (/video-editing/): "Send to Video Editor" in the File menu, and
// opening a clip the video editor hands over (?from=video-editor). The two editors share a small
// IndexedDB store on this site ("diin-handoff") — one puts a file in, the other takes it out.
// Nothing is uploaded. Loaded after editor.js (uses doc, selA/selB, encodeWav, loadFile, MENUS).
'use strict';

(() => {
  const DB = 'diin-handoff', STORE = 'items', MAX_AGE = 60 * 60 * 1000;
  let dbP = null;
  const openDb = () => dbP || (dbP = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const done = (tx) => new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });

  async function put(key, blob, name) {
    const tx = (await openDb()).transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ blob, name, type: blob.type, time: Date.now() }, key);
    await done(tx);
  }
  async function take(key) {
    const tx = (await openDb()).transaction(STORE, 'readwrite'), s = tx.objectStore(STORE);
    const rec = await new Promise((res, rej) => { const r = s.get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    s.delete(key);
    await done(tx);
    if (!rec || Date.now() - (rec.time || 0) > MAX_AGE) return null;
    return rec.blob instanceof File ? rec.blob : new File([rec.blob], rec.name || 'from-video-editor', { type: rec.type || rec.blob.type });
  }

  async function sendToVideo(selectionOnly) {
    if (!doc || !len()) return;
    let ch = doc.ch;
    if (selectionOnly && hasSel()) ch = ch.map(c => c.subarray(selA, selB));
    const name = baseName() + (selectionOnly && hasSel() ? ' (selection)' : '') + '.wav';
    try {
      await put('to-video-editor', new Blob([encodeWav(ch, doc.sr)], { type: 'audio/wav' }), name);
      window.open('/video-editing/?from=audio-editor', '_blank');
    } catch (e) {
      console.error(e);
      toast('Could not pass the audio to the video editor.');
    }
  }

  const file = MENUS.find(m => m.label === 'File').items;
  const at = file.findIndex(it => it && it.label === 'Save All Files (.zip)');
  file.splice(at === -1 ? file.length : at + 1, 0,
    { label: 'Send to Video Editor', run: () => sendToVideo(false), en: has.audio },
    { label: 'Send Selection to Video Editor', run: () => sendToVideo(true), en: has.sel });

  // A clip handed over by the video editor opens as a new file here.
  if (new URLSearchParams(location.search).get('from') === 'video-editor') {
    history.replaceState(null, '', location.pathname);
    take('to-audio-editor').then(f => {
      if (!f) return;
      loadFile(f, { remember: false });
      toast('Opened “' + f.name + '” from the video editor. When you are done, use File ▸ Send to Video Editor.');
    }).catch(e => console.error(e));
  }
})();
