/* ===================== Touch Controls =====================
   On a touch device, gives each of the 4 players a Run / Jump / Ability
   cluster in a corner of the screen, so four thumbs can share one
   tablet/phone the same way four hands share one keyboard. Every
   button just adds/removes the same key codes the keyboard already
   uses in gameManager's keysDown set -- no other game code needs to
   know touch exists. Slide is left off touch controls to keep each
   corner to three buttons; it's a nice-to-have, not required to
   finish a level. */

const CORNER_CLASS = ['tl', 'tr', 'bl', 'br'];

export function isTouchDevice(){
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
}

let root = null;
let topClearanceEl = null;

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
    #touch-controls{ position:fixed; inset:0; pointer-events:none; z-index:40; display:none; --top-clearance:8px; }
    #touch-controls.visible{ display:block; }
    .touch-pad{ position:absolute; width:178px; height:92px; pointer-events:none; }
    .touch-pad-tl{ top:var(--top-clearance); left:8px; }
    .touch-pad-tr{ top:var(--top-clearance); right:8px; }
    .touch-pad-bl{ bottom:8px; left:8px; }
    .touch-pad-br{ bottom:8px; right:8px; }
    .touch-pad-label{ position:absolute; top:-6px; left:-6px; width:26px; height:26px; border-radius:50%;
      background:var(--pad-color); color:#fff; font-weight:800; font-family:'Baloo 2',sans-serif;
      display:flex; align-items:center; justify-content:center; font-size:12px; opacity:.9; }
    .touch-btn{ position:absolute; border-radius:14px; border:2px solid var(--pad-color);
      background:rgba(255,255,255,.6); color:var(--pad-color); font-weight:800; font-family:'Baloo 2',sans-serif;
      pointer-events:auto; -webkit-tap-highlight-color:transparent; touch-action:none; }
    .touch-btn.active{ background:var(--pad-color); color:#fff; }
    .touch-run{ left:0; top:6px; width:80px; height:80px; border-radius:50%; font-size:13px; }
    .touch-jump{ left:92px; top:0; width:86px; height:40px; font-size:13px; }
    .touch-ability{ left:92px; top:46px; width:86px; height:40px; font-size:11px; }
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
      '<button class="touch-btn touch-run" data-code="' + scheme.right + '">RUN</button>' +
      '<button class="touch-btn touch-jump" data-code="' + scheme.jump + '">JUMP</button>' +
      '<button class="touch-btn touch-ability" data-code="' + scheme.ability + '">ABILITY</button>';
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
