/* ===================== Touch Controls =====================
   On a touch device, gives each of the 4 players their own D-pad in a
   corner of the screen, so four thumbs can share one tablet/phone the
   same way four hands share one keyboard. Every button just adds/removes
   the same key codes the keyboard already uses in gameManager's
   keysDown set -- no other game code needs to know touch exists. */

const CORNER_CLASS = ['tl', 'tr', 'bl', 'br'];

export function isTouchDevice(){
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
}

let root = null;
let topClearanceEl = null;

/* Keeps the top-corner pads below whatever HUD bar the game is showing,
   instead of a hardcoded offset -- each game's HUD is a different
   height, and this measures the real one instead of guessing. */
function updateTopClearance(){
  if(!root) return;
  let top = 8;
  if(topClearanceEl && !topClearanceEl.hidden){
    const rect = topClearanceEl.getBoundingClientRect();
    if(rect.height > 0) top = Math.round(rect.bottom + 10);
  }
  root.style.setProperty('--top-clearance', top + 'px');
}

export function initTouchControls(keysDown, controlSchemes, playerColors, topClearanceElement){
  if(!isTouchDevice() || root) return;
  topClearanceEl = topClearanceElement || null;

  const style = document.createElement('style');
  style.textContent = `
    #touch-controls{ position:fixed; inset:0; pointer-events:none; z-index:40; display:none; }
    #touch-controls.visible{ display:block; }
    #touch-controls{ --top-clearance:8px; }
    .touch-pad{ position:absolute; width:150px; height:150px; pointer-events:none; }
    .touch-pad-tl{ top:var(--top-clearance); left:8px; }
    .touch-pad-tr{ top:var(--top-clearance); right:8px; }
    .touch-pad-bl{ bottom:8px; left:8px; }
    .touch-pad-br{ bottom:8px; right:8px; }
    .touch-pad-label{ position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:44px; height:44px;
      border-radius:50%; background:var(--pad-color); color:#fff; font-weight:800; font-family:'Baloo 2',sans-serif;
      display:flex; align-items:center; justify-content:center; font-size:15px; opacity:.85; }
    .touch-btn{ position:absolute; width:48px; height:48px; border-radius:12px; border:2px solid var(--pad-color);
      background:rgba(255,255,255,.55); color:var(--pad-color); font-size:20px; font-weight:800; pointer-events:auto;
      -webkit-tap-highlight-color:transparent; touch-action:none; }
    .touch-btn.active{ background:var(--pad-color); color:#fff; }
    .touch-up{ top:0; left:51px; }
    .touch-down{ top:102px; left:51px; }
    .touch-left{ top:51px; left:0; }
    .touch-right{ top:51px; left:102px; }
  `;
  document.head.appendChild(style);

  root = document.createElement('div');
  root.id = 'touch-controls';
  document.body.appendChild(root);

  controlSchemes.forEach((scheme, i) => {
    const pad = document.createElement('div');
    pad.className = 'touch-pad touch-pad-' + CORNER_CLASS[i];
    pad.style.setProperty('--pad-color', playerColors[i]);
    pad.innerHTML =
      '<div class="touch-pad-label">' + (i + 1) + '</div>' +
      '<button class="touch-btn touch-up" data-code="' + scheme.up + '">▲</button>' +
      '<button class="touch-btn touch-down" data-code="' + scheme.down + '">▼</button>' +
      '<button class="touch-btn touch-left" data-code="' + scheme.left + '">◀</button>' +
      '<button class="touch-btn touch-right" data-code="' + scheme.right + '">▶</button>';
    root.appendChild(pad);
  });

  root.querySelectorAll('.touch-btn').forEach(btn => {
    const code = btn.dataset.code;
    const press = e => { e.preventDefault(); keysDown.add(code); btn.classList.add('active'); };
    const release = e => { e.preventDefault(); keysDown.delete(code); btn.classList.remove('active'); };
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
  });
}

export function setTouchControlsVisible(visible){
  if(!root) return;
  root.classList.toggle('visible', visible);
  if(visible) updateTopClearance();
}

/* Wires visibility to the gameplay screen and any overlays (pause,
   quiz/story modals, etc.) that should hide the D-pads while open --
   without gameManager having to call show/hide at every single
   transition point. `overlayEls` may be a single element or an array. */
export function autoShowTouchControls(gameScreenEl, overlayEls){
  if(!isTouchDevice()) return;
  const overlays = (Array.isArray(overlayEls) ? overlayEls : [overlayEls]).filter(Boolean);
  const update = () => {
    const gameVisible = gameScreenEl && !gameScreenEl.hidden;
    const anyOverlayOpen = overlays.some(el => !el.hidden);
    setTouchControlsVisible(!!gameVisible && !anyOverlayOpen);
  };
  const observer = new MutationObserver(update);
  if(gameScreenEl) observer.observe(gameScreenEl, { attributes: true, attributeFilter: ['hidden'] });
  overlays.forEach(el => observer.observe(el, { attributes: true, attributeFilter: ['hidden'] }));
  window.addEventListener('resize', updateTopClearance);
  window.addEventListener('orientationchange', updateTopClearance);
  update();
}
