// Adds a small "✂ Edit in audio editor" link under every <audio controls> on a page
// (including players added later). Include with: <script src="/audio-editor/edit-link.js" defer></script>. Opens NoorEditor (nooreditor.web.app); GitHub Pages serves the recordings with CORS, so it can load them.
(() => {
  'use strict';
  const EDITOR = 'https://nooreditor.web.app/audio-editor/';
  const style = document.createElement('style');
  style.textContent = '.ae-edit-link{display:inline-block;margin:4px 0 0;font:13px/1.4 system-ui,sans-serif;color:#1f4f40;text-decoration:none;border-bottom:1px dotted #a97c25}.ae-edit-link:hover{color:#2e6b58;border-bottom-style:solid}';
  document.head.appendChild(style);
  const titleFor = a => {
    const box = a.closest('article, li, section, .card, div');
    const h = box && box.querySelector('h1, h2, h3, h4, strong, .title');
    return (a.dataset.title || a.title || (h && h.textContent) || document.title).trim().slice(0, 80);
  };
  function add(a) {
    if (a.dataset.aeLink || !a.hasAttribute('controls')) return;
    const src = a.currentSrc || a.src || (a.querySelector('source') || {}).src;
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
    a.dataset.aeLink = '1';
    const link = document.createElement('a');
    link.className = 'ae-edit-link'; link.target = '_blank'; link.rel = 'noopener';
    link.href = EDITOR + '?open=' + encodeURIComponent(new URL(src, location.href).href) + '&name=' + encodeURIComponent(titleFor(a));
    link.textContent = '✂ Edit in audio editor';
    link.title = 'Open this recording in the audio editor to cut, split or save a part';
    a.insertAdjacentElement('afterend', link);
  }
  const scan = () => document.querySelectorAll('audio[controls]').forEach(add);
  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
