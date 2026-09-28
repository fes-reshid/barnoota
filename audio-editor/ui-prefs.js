// Audio editor — look and feel: light/dark theme, pinch-to-zoom on touch screens, custom keyboard
// shortcuts, and keyboard/screen-reader access to the menus. Loaded after editor.js.
'use strict';

/* ---------- Theme ---------- */
let uiTheme = 'auto';
try { uiTheme = localStorage.getItem('ae-theme') || 'auto'; } catch (e) {}
const darkMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
function redrawAll() {
  if (doc) { draw(); try { drawOverview(); } catch (e) {} }
  if ($('mt').classList.contains('open')) mtRender();
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.content = css('--parchment') || '#2e6b58';
}
function setTheme(t) {
  uiTheme = t;
  try { localStorage.setItem('ae-theme', t); } catch (e) {}
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  redrawAll();
}
if (darkMQ && darkMQ.addEventListener) darkMQ.addEventListener('change', () => { if (uiTheme === 'auto') redrawAll(); });

/* ---------- Pinch to zoom (two fingers) on the waveform and the multitrack timeline ---------- */
function pinchZoom(el, { start, move, end }) {
  const pts = new Map(); let pinch = null, swallow = false;
  const dist = () => { const [a, b] = [...pts.values()]; return Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)); };
  const mid = () => { const [a, b] = [...pts.values()]; return (a.x + b.x) / 2; };
  el.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    if (!pts.size) start.first && start.first();
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      e.stopImmediatePropagation(); e.preventDefault();
      pinch = { d0: dist(), m0: mid(), ...start.pinch(mid()) }; swallow = true;
      el.dispatchEvent(new Event('pointercancel')); // stops the long-press menu and any drag the first finger began
    } else if (pts.size > 2) e.stopImmediatePropagation();
  }, { capture: true });
  el.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (swallow) e.stopImmediatePropagation();
    if (pinch && pts.size >= 2) move(pinch, pinch.d0 / dist(), mid());
  }, { capture: true });
  const up = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (swallow) e.stopImmediatePropagation();
    if (pinch && pts.size < 2) { pinch = null; end && end(); }
    if (!pts.size) swallow = false;
  };
  el.addEventListener('pointerup', up, { capture: true }); el.addEventListener('pointercancel', e => { if (e.isTrusted) up(e); }, { capture: true });
}
{
  let before = null;
  pinchZoom(canvas, {
    start: {
      first: () => { before = doc ? { selA, selB, cursor } : null; },
      pinch: m => {
        if (before) ({ selA, selB, cursor } = before);
        drag = null;
        const r = canvas.getBoundingClientRect();
        return { spp0: spp, s0: viewStart + (m - r.left) * spp };
      },
    },
    move: (p, k, m) => {
      if (!doc) return;
      const r = canvas.getBoundingClientRect();
      spp = p.spp0 * k; clampView(); viewStart = p.s0 - (m - r.left) * spp; clampView(); draw(); try { drawOverview(); } catch (e) {}
    },
    end: () => refresh(),
  });
  pinchZoom(mtCanvas, {
    start: {
      pinch: m => {
        if (mtDrag && mtDrag.c) { Object.assign(mtDrag.c, mtDrag.orig); if (!mtDrag.moved) mt.undo.pop(); }
        mtDrag = null;
        const r = mtCanvas.getBoundingClientRect();
        return { pps0: mt.pps, t0: mtT(m - r.left) };
      },
    },
    move: (p, k, m) => {
      const r = mtCanvas.getBoundingClientRect();
      mt.pps = clamp(p.pps0 / k, 2, 2000); mt.scroll = Math.max(0, p.t0 - (m - r.left) / mt.pps); mtDraw(); mtSync();
    },
  });
}

/* ---------- Custom keyboard shortcuts ---------- */
const KEY_STORE = 'ae-keys';
const keyActions = []; // { id, group, label, item }
const keyIdOf = new WeakMap();
for (const m of MENUS) (function collect(items, path) {
  for (const it of items) {
    if (!it || it === '-' || it.mhead) continue;
    if (Array.isArray(it.sub)) collect(it.sub, path + it.label + ' › ');
    else if (it.run && !it.sub) { const id = m.label + ' › ' + path + it.label; keyActions.push({ id, group: m.label, label: path + it.label, item: it }); keyIdOf.set(it, id); }
  }
})(m.items, '');
let customKeys = {};
try { customKeys = JSON.parse(localStorage.getItem(KEY_STORE)) || {}; } catch (e) {}
const saveKeys = () => { try { localStorage.setItem(KEY_STORE, JSON.stringify(customKeys)); } catch (e) {} };
function comboOf(e) {
  const k = e.key;
  if (['Control', 'Shift', 'Alt', 'Meta', 'AltGraph', 'CapsLock', 'Tab'].includes(k)) return null;
  const name = k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k === 'Delete' ? 'Del' : k;
  return [(e.ctrlKey || e.metaKey) && 'Ctrl', e.altKey && 'Alt', e.shiftKey && k.length > 1 && 'Shift', e.shiftKey && k.length === 1 && /[A-Z]/i.test(k) && 'Shift', name].filter(Boolean).join('+');
}
const comboToAction = () => { const m = new Map(); for (const [id, c] of Object.entries(customKeys)) if (c) m.set(c, id); return m; };
menuKey = it => { const id = keyIdOf.get(it); return id && customKeys[id] ? customKeys[id] : it.key; };
window.addEventListener('keydown', e => {
  if (!Object.keys(customKeys).length || e.defaultPrevented || recordingKeyFor) return;
  const t = e.target;
  if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
  if (document.querySelector('dialog[open]') || menuOpen() || $('mt').classList.contains('open')) return;
  const c = comboOf(e); if (!c) return;
  const id = comboToAction().get(c); if (!id) return;
  const a = keyActions.find(x => x.id === id); if (!a) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (!a.item.en || a.item.en()) a.item.run();
}, { capture: true });

const keysDlg = document.createElement('dialog');
keysDlg.className = 'dlg eq'; keysDlg.id = 'keysDlg'; keysDlg.setAttribute('aria-labelledby', 'keysTitle');
keysDlg.innerHTML = `<div class="eq-top"><h2 id="keysTitle">Keyboard shortcuts</h2></div>
  <p class="info" style="margin:0 0 8px">Give any menu command your own key. Press <b>Change</b>, then the key (with Ctrl, Alt or Shift if you like). <kbd>Esc</kbd> cancels. Your keys win over the built-in ones.</p>
  <div class="row"><input type="search" id="keysFilter" class="num" style="flex:1; width:auto" placeholder="Find a command…" aria-label="Find a command"><button class="btn" id="keysReset" type="button">Reset all</button></div>
  <ul class="keys-list" id="keysList"></ul>
  <div class="actions"><span style="flex:1"></span><button class="btn primary" id="keysClose" type="button">Done</button></div>`;
document.body.appendChild(keysDlg);
let recordingKeyFor = null;
function keysRender() {
  const q = $('keysFilter').value.trim().toLowerCase(), ul = $('keysList'); ul.innerHTML = '';
  for (const a of keyActions) {
    if (q && !(a.label + ' ' + tr(a.label) + ' ' + a.group).toLowerCase().includes(q)) continue;
    const li = document.createElement('li'), cur = customKeys[a.id] || a.item.key || '';
    li.innerHTML = `<span class="grp"></span><span class="nm"></span><kbd></kbd><button class="btn" type="button">Change</button><button class="btn" type="button" title="Back to the built-in key">↺</button>`;
    const [g, nm, kb, ch, rs] = li.children;
    g.textContent = tr(a.group); nm.textContent = a.label.split(' › ').map(tr).join(' › '); kb.textContent = recordingKeyFor === a.id ? 'Press a key…' : cur || '—';
    kb.classList.toggle('custom', !!customKeys[a.id]); rs.disabled = !customKeys[a.id];
    if (recordingKeyFor === a.id) li.classList.add('wait');
    ch.setAttribute('aria-label', 'Change the key for ' + a.label);
    ch.onclick = () => { recordingKeyFor = a.id; keysRender(); };
    rs.onclick = () => { delete customKeys[a.id]; saveKeys(); keysRender(); };
    ul.appendChild(li);
  }
}
window.addEventListener('keydown', e => { // while waiting for a new key, take the next key press
  if (!recordingKeyFor || !keysDlg.open) return;
  e.preventDefault(); e.stopPropagation();
  if (e.key === 'Escape') { recordingKeyFor = null; keysRender(); return; }
  const c = comboOf(e); if (!c) return;
  const other = comboToAction().get(c), id = recordingKeyFor;
  if (other && other !== id) { delete customKeys[other]; toast(`${c} moved from “${other.split(' › ').pop()}”`); }
  customKeys[id] = c; saveKeys(); recordingKeyFor = null; keysRender();
  const again = [...$('keysList').querySelectorAll('li')].find(li => li.querySelector('.nm').textContent === (keyActions.find(a => a.id === id) || {}).label); if (again) again.querySelector('button').focus();
}, true);
$('keysFilter').addEventListener('input', keysRender);
on('keysReset', () => { if (confirm('Remove all your own shortcuts?')) { customKeys = {}; saveKeys(); keysRender(); } });
on('keysClose', () => keysDlg.close());
keysDlg.addEventListener('close', () => { recordingKeyFor = null; });
function openKeys() { recordingKeyFor = null; $('keysFilter').value = ''; keysRender(); keysDlg.showModal(); }

/* ---------- Keyboard access to menus ---------- */
function menuItems(menu) { return [...menu.querySelectorAll(':scope > .mi, :scope > .msub > .mi')].filter(d => !d.classList.contains('dis')); }
function focusFirst(menu) { const it = menuItems(menu)[0]; if (it) it.focus(); }
let menuBtnForKeys = null; // the menu-bar button to return to after Esc
$('menuBar').addEventListener('keydown', e => {
  const btns = [...$('menuBar').children], i = btns.indexOf(e.target); if (i < 0) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const rtl = document.dir === 'rtl', d = (e.key === 'ArrowRight') !== rtl ? 1 : -1; btns[(i + d + btns.length) % btns.length].focus(); if (menuOpen()) btns[(i + d + btns.length) % btns.length].click(); return; }
  if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); menuBtnForKeys = e.target; if (!document.querySelector('.menu')) e.target.click();
    setTimeout(() => { const m = document.querySelector('.menu'); if (m) focusFirst(m); }, 30);
  }
});
document.addEventListener('keydown', e => {
  const cur = e.target.closest && e.target.closest('.menu'); if (!cur) return;
  const items = menuItems(cur), i = items.indexOf(e.target.closest('.mi'));
  const rtl = document.dir === 'rtl', fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = items.length; if (n) items[(i + (e.key === 'ArrowDown' ? 1 : -1) + n) % n].focus(); }
  else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); const it = e.key === 'Home' ? items[0] : items[items.length - 1]; if (it) it.focus(); }
  else if (e.key === 'Enter' || e.key === ' ' || e.key === fwd) {
    const it = items[i]; if (!it) return;
    if (e.key === fwd && !it.classList.contains('sub')) return;
    e.preventDefault(); it.click();
    if (it.classList.contains('sub')) setTimeout(() => { const nx = it.nextElementSibling && it.nextElementSibling.classList.contains('msub') ? it.nextElementSibling : [...document.querySelectorAll('.menu')].pop(); if (nx) focusFirst(nx); }, 30);
  } else if (e.key === back || e.key === 'Escape') {
    const all = [...document.querySelectorAll('.menu')];
    if (all.length > 1 && all.indexOf(cur) > 0) {
      e.preventDefault(); e.stopPropagation();
      const m = openMenus.find(x => x.el === cur); if (m) closeMenus(m.level); else cur.remove();
      const parent = all[all.indexOf(cur) - 1], act = parent.querySelector('.mi.active'); if (act) act.focus();
    } else if (e.key === 'Escape') { const b = menuBtnForKeys || document.querySelector('#menuBar > button.open'); setTimeout(() => b && b.focus(), 0); }
  } else if (e.key === 'Tab') { e.preventDefault(); closeMenus(); }
}, true);

/* ---------- Screen-reader labels for symbol-only buttons ---------- */
function labelSymbolButtons(root) {
  const list = root.matches && root.matches('button') ? [root] : root.querySelectorAll ? root.querySelectorAll('button[title]:not([aria-label])') : [];
  list.forEach(b => { if (b.title && !b.hasAttribute('aria-label') && !/[A-Za-z\u0600-\u06FF]{2}/.test(b.textContent)) b.setAttribute('aria-label', b.title); });
}
labelSymbolButtons(document);
new MutationObserver(recs => { for (const r of recs) r.addedNodes.forEach(n => { if (n.nodeType === 1) labelSymbolButtons(n); }); }).observe(document.body, { childList: true, subtree: true });
canvas.setAttribute('role', 'img'); canvas.tabIndex = 0;
$('mtCanvas').setAttribute('role', 'img');

/* ---------- Menus ---------- */
(() => {
  const view = MENUS.find(m => m.label === 'View').items;
  view.push('-', { label: 'Theme', sub: () => [['auto', 'Automatic (like this device)'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => ({ label: l, check: () => uiTheme === k, run: () => setTheme(k) })) });
  const help = MENUS.find(m => m.label === 'Help').items;
  help.splice(help.findIndex(it => it.label === 'Guide & Keyboard Shortcuts') + 1, 0, { label: 'Keyboard Shortcuts…', run: openKeys });
  // A light/dark switch in the header
  const b = document.createElement('button'); b.className = 'back'; b.type = 'button'; b.id = 'themeBtn'; b.textContent = '◐';
  b.title = 'Light / dark (View ▸ Theme)'; b.setAttribute('aria-label', 'Switch between light and dark');
  b.onclick = () => { const dark = uiTheme === 'dark' || (uiTheme === 'auto' && darkMQ && darkMQ.matches); setTheme(dark ? 'light' : 'dark'); };
  const head = document.querySelector('.head-actions'); if (head) head.prepend(b);
})();
