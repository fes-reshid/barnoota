// Audio editor — the clean layout (the default): the Effects, Markers, Tools and History panels are
// hidden and everything is in the menus. Two buttons stay in reach next to the file name: ⬇ Save, and
// Parts, which opens the markers list as a side sheet (it also opens by itself after auto-split).
// View ▸ Show Effects & Tools Panels brings the panels back; the choice is remembered.
'use strict';

(() => {
  let layout = 'clean';
  try { layout = localStorage.getItem('ae-layout') || (localStorage.getItem('ae-view-compact') === '' ? 'panels' : 'clean'); } catch (e) {}
  document.body.classList.toggle('compact', layout === 'clean');
  const remember = () => { try { localStorage.setItem('ae-layout', document.body.classList.contains('compact') ? 'clean' : 'panels'); } catch (e) {} };

  // The View menu's switch keeps working, and now also remembers the layout.
  const view = MENUS.find(m => m.label === 'View').items;
  const item = view.find(it => it && it.label === 'Show Effects & Tools Panels');
  if (item) item.run = () => { toggleView('compact'); document.body.classList.remove('show-parts'); remember(); refreshQuick(); };

  // ⬇ Save and Parts beside the file name
  const top = document.querySelector('.topline');
  const save = document.createElement('button');
  save.className = 'btn primary quick'; save.id = 'saveTopBtn'; save.type = 'button';
  save.title = 'Save this file (Ctrl+S) — the format is in File ▸ Save Format';
  save.onclick = () => $('exportBtn').click();
  const parts = document.createElement('button');
  parts.className = 'btn quick'; parts.id = 'partsBtn'; parts.type = 'button';
  parts.title = 'Markers and parts: auto-split at pauses, name the parts, save them';
  parts.onclick = () => showParts(!document.body.classList.contains('show-parts'));
  top.insertBefore(parts, $('fileName'));
  top.insertBefore(save, $('fileName'));

  function showParts(on) {
    document.body.classList.toggle('show-parts', on && document.body.classList.contains('compact'));
    parts.setAttribute('aria-expanded', String(document.body.classList.contains('show-parts')));
    if (on) $('autoSplitBtn').focus({ preventScroll: true });
  }
  on('partsClose', () => showParts(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('show-parts') && !document.querySelector('dialog[open]')) showParts(false); });

  const t = w => (typeof tr === 'function' ? tr(w) : w);
  function refreshQuick() {
    const n = $('segList').children.length;
    parts.textContent = t('Parts') + (n > 1 ? ' (' + n + ')' : '');
    save.textContent = '⬇ ' + t('Save') + ' ' + fmtShort(saveFormat());
    save.hidden = parts.hidden = !document.body.classList.contains('compact');
  }
  // Keep the labels in step with the parts list and the save format; open the sheet when parts appear.
  let had = 0;
  new MutationObserver(() => {
    const n = $('segList').children.length;
    if (n > 1 && had <= 1 && document.body.classList.contains('compact')) showParts(true);
    had = n; refreshQuick();
  }).observe($('segList'), { childList: true });
  new MutationObserver(refreshQuick).observe($('exportBtn'), { childList: true, characterData: true, subtree: true });
  document.addEventListener('change', e => { if (e.target && e.target.id === 'langSel') refreshQuick(); });
  window.addEventListener('load', refreshQuick);
  refreshQuick();
})();
