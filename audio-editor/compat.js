// Audio editor — browser compatibility (Safari/iOS, Firefox, older browsers). Loaded right after editor.js.
'use strict';

// Safari (especially on iPhone/iPad) keeps Web Audio silent until it is started from a tap or key
// press, and suspends it again after calls or when the page was in the background. Some actions start
// playback only after a moment of processing (previews, chains…), outside the tap, so the audio is
// unlocked on every gesture instead.
(() => {
  const unlock = () => {
    try {
      const c = audio();
      if (c.state !== 'running') {
        c.resume().catch(() => {});
        const b = c.createBuffer(1, 1, c.sampleRate), s = c.createBufferSource(); // a silent sample: iOS needs a sound started in the gesture
        s.buffer = b; s.connect(c.destination); s.start(0);
      }
    } catch (e) {}
  };
  for (const t of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(t, unlock, { capture: true, passive: true });
})();

// Browsers too old for the editor get a clear message instead of a page that half works.
(() => {
  const missing = [];
  if (!(window.AudioContext || window.webkitAudioContext)) missing.push('Web Audio');
  if (!window.OfflineAudioContext) missing.push('offline audio rendering');
  if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) missing.push('dialog windows');
  if (!window.indexedDB) missing.push('storage');
  if (!missing.length) return;
  const box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.style.cssText = 'margin:0 auto 18px; max-width:620px; padding:14px 16px; border-radius:12px; border:1.5px solid var(--red); background:var(--warn-bg); font-family:var(--ui); font-size:15px;';
  box.textContent = `This browser is missing features the editor needs (${missing.join(', ')}). Please update it, or use a recent Chrome, Edge, Firefox or Safari (iPhone/iPad: iOS 15.4 or newer).`;
  const main = document.querySelector('main'); if (main) main.insertBefore(box, main.firstChild);
})();
