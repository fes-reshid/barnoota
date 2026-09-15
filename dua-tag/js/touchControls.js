/* ===================== Touch Controls =====================
   On a touch device, gives each of the 4 players their own joystick in a
   corner of the screen, so four thumbs can share one tablet/phone the
   same way four hands share one keyboard. Holding the joystick and
   dragging it in any direction (including diagonals) adds/removes the
   same key codes the keyboard already uses in gameManager's keysDown
   set -- no other game code needs to know touch exists. */

const CORNER_CLASS = ['tl', 'tr', 'bl', 'br'];
const JOYSTICK_MAX_PX = 34;
const JOYSTICK_DEADZONE_PX = 10;

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

/* Turns a drag vector into 1-2 held key codes, using 8 compass sectors
   (45 degrees each) so a diagonal drag holds both adjacent keys at once,
   exactly like pressing two arrow keys together on a keyboard. */
function vectorToCodes(dx, dy, scheme){
  const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360; // 0=right, 90=down
  if(deg >= 337.5 || deg < 22.5) return [scheme.right];
  if(deg < 67.5) return [scheme.down, scheme.right];
  if(deg < 112.5) return [scheme.down];
  if(deg < 157.5) return [scheme.down, scheme.left];
  if(deg < 202.5) return [scheme.left];
  if(deg < 247.5) return [scheme.up, scheme.left];
  if(deg < 292.5) return [scheme.up];
  return [scheme.up, scheme.right];
}

function setupJoystick(base, knob, scheme, keysDown){
  let touchId = null;
  let heldCodes = [];

  function setCodes(codes){
    heldCodes.forEach(c => { if(codes.indexOf(c) < 0) keysDown.delete(c); });
    codes.forEach(c => keysDown.add(c));
    heldCodes = codes;
  }

  function updateFromPoint(clientX, clientY){
    const rect = base.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    if(dist < JOYSTICK_DEADZONE_PX){
      knob.style.transform = 'translate(-50%,-50%)';
      setCodes([]);
      return;
    }
    const clamped = Math.min(dist, JOYSTICK_MAX_PX);
    const nx = (dx / dist) * clamped, ny = (dy / dist) * clamped;
    knob.style.transform = 'translate(calc(-50% + ' + nx + 'px), calc(-50% + ' + ny + 'px))';
    setCodes(vectorToCodes(dx, dy, scheme));
  }

  function reset(){
    knob.style.transform = 'translate(-50%,-50%)';
    setCodes([]);
    touchId = null;
    base.classList.remove('active');
  }

  function findTouch(e){
    for(let i = 0; i < e.changedTouches.length; i++){
      if(e.changedTouches[i].identifier === touchId) return e.changedTouches[i];
    }
    return null;
  }

  base.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    touchId = t.identifier;
    base.classList.add('active');
    updateFromPoint(t.clientX, t.clientY);
  }, { passive: false });

  base.addEventListener('touchmove', e => {
    if(touchId === null) return;
    const t = findTouch(e);
    if(!t) return;
    e.preventDefault();
    updateFromPoint(t.clientX, t.clientY);
  }, { passive: false });

  const end = e => {
    if(touchId === null || !findTouch(e)) return;
    reset();
  };
  base.addEventListener('touchend', end, { passive: false });
  base.addEventListener('touchcancel', end, { passive: false });
}

export function initTouchControls(keysDown, controlSchemes, playerColors, topClearanceElement){
  if(!isTouchDevice() || root) return;
  topClearanceEl = topClearanceElement || null;

  const style = document.createElement('style');
  style.textContent = `
    #touch-controls{ position:fixed; inset:0; pointer-events:none; z-index:40; display:none; }
    #touch-controls.visible{ display:block; }
    #touch-controls{ --top-clearance:8px; }
    .touch-pad{ position:absolute; width:120px; height:120px; pointer-events:none;
      display:flex; align-items:center; justify-content:center; }
    .touch-pad-tl{ top:var(--top-clearance); left:8px; }
    .touch-pad-tr{ top:var(--top-clearance); right:8px; }
    .touch-pad-bl{ bottom:8px; left:8px; }
    .touch-pad-br{ bottom:8px; right:8px; }
    .joy-base{ position:relative; width:104px; height:104px; border-radius:50%; pointer-events:auto;
      background:rgba(255,255,255,.45); border:3px solid var(--pad-color); touch-action:none;
      -webkit-tap-highlight-color:transparent; }
    .joy-base.active{ background:rgba(255,255,255,.75); }
    .joy-knob{ position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      width:50px; height:50px; border-radius:50%; background:var(--pad-color); color:#fff;
      display:flex; align-items:center; justify-content:center; font-weight:800;
      font-family:'Baloo 2',sans-serif; font-size:16px; pointer-events:none; opacity:.9; }

    #rotate-overlay{ position:fixed; inset:0; z-index:60; background:rgba(20,40,35,.92); color:#fff;
      display:none; flex-direction:column; align-items:center; justify-content:center; text-align:center;
      padding:24px; font-family:'Nunito',sans-serif; }
    #rotate-overlay.show{ display:flex; }
    #rotate-overlay .spin{ font-size:56px; margin-bottom:14px; animation:rotate-hint 1.6s ease-in-out infinite; }
    #rotate-overlay p{ font-size:1.1rem; font-weight:700; max-width:320px; margin:0; }
    @keyframes rotate-hint{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(90deg); } }

    @media (orientation:landscape){
      .touch-pad-tl, .touch-pad-bl{ left:6px; }
      .touch-pad-tr, .touch-pad-br{ right:6px; }
      .touch-pad-tl{ top:calc(50% - 128px); }
      .touch-pad-bl{ top:calc(50% + 8px); bottom:auto; }
      .touch-pad-tr{ top:calc(50% - 128px); }
      .touch-pad-br{ top:calc(50% + 8px); bottom:auto; }
    }
  `;
  document.head.appendChild(style);

  root = document.createElement('div');
  root.id = 'touch-controls';
  document.body.appendChild(root);

  controlSchemes.forEach((scheme, i) => {
    const pad = document.createElement('div');
    pad.className = 'touch-pad touch-pad-' + CORNER_CLASS[i];
    pad.style.setProperty('--pad-color', playerColors[i]);
    pad.innerHTML = '<div class="joy-base"><div class="joy-knob">' + (i + 1) + '</div></div>';
    root.appendChild(pad);
    setupJoystick(pad.querySelector('.joy-base'), pad.querySelector('.joy-knob'), scheme, keysDown);
  });

  const overlay = document.createElement('div');
  overlay.id = 'rotate-overlay';
  overlay.innerHTML = '<div class="spin">📱</div><p>Turn your device sideways to play &mdash; four players fit best in landscape!</p>';
  document.body.appendChild(overlay);
}

export function setTouchControlsVisible(visible){
  if(!root) return;
  root.classList.toggle('visible', visible);
  if(visible) updateTopClearance();
}

/* Best-effort landscape lock: only Chromium-based mobile browsers support
   the Screen Orientation API, and even there it needs a fullscreen
   element on some versions -- iOS Safari has no equivalent at all, which
   is exactly why the rotate-device overlay below exists as the real,
   universal fallback rather than relying on this succeeding. */
export function requestLandscape(){
  try{
    const lock = screen.orientation && screen.orientation.lock;
    if(lock) screen.orientation.lock('landscape').catch(() => {});
  }catch(e){}
}
export function releaseLandscapeLock(){
  try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){}
}

function isPortrait(){
  return window.matchMedia && window.matchMedia('(orientation: portrait)').matches;
}

/* Wires visibility to the gameplay screen and any overlays (pause,
   quiz/story modals, etc.) that should hide the joysticks while open --
   without gameManager having to call show/hide at every single
   transition point. `overlayEls` may be a single element or an array.
   Also shows the "please rotate" overlay whenever the game screen is the
   active one but the device is still in portrait. */
export function autoShowTouchControls(gameScreenEl, overlayEls){
  if(!isTouchDevice()) return;
  const overlays = (Array.isArray(overlayEls) ? overlayEls : [overlayEls]).filter(Boolean);
  const rotateOverlay = document.getElementById('rotate-overlay');
  const update = () => {
    const gameVisible = gameScreenEl && !gameScreenEl.hidden;
    const anyOverlayOpen = overlays.some(el => !el.hidden);
    const needsRotate = gameVisible && isPortrait();
    if(rotateOverlay) rotateOverlay.classList.toggle('show', needsRotate);
    setTouchControlsVisible(!!gameVisible && !anyOverlayOpen && !needsRotate);
  };
  const observer = new MutationObserver(update);
  if(gameScreenEl) observer.observe(gameScreenEl, { attributes: true, attributeFilter: ['hidden'] });
  overlays.forEach(el => observer.observe(el, { attributes: true, attributeFilter: ['hidden'] }));
  window.addEventListener('resize', () => { updateTopClearance(); update(); });
  window.addEventListener('orientationchange', () => { updateTopClearance(); update(); });
  update();
}
