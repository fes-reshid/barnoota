/* ===================== UI =====================
   All DOM rendering and screen-switching lives here. This module knows
   nothing about game rules -- it just shows/hides screens, draws the HUD
   and du'a modal from data it's given, and forwards user clicks to the
   handler functions it's initialized with. */

import { DUA_LIBRARY } from './duaLibraryData.js';
import { CONTROL_SCHEMES, PLAYER_COLORS } from './playerController.js';

const els = {};

function q(id){ return document.getElementById(id); }

export function cacheEls(){
  [
    'screen-menu', 'screen-howto', 'screen-library', 'screen-settings',
    'screen-setup', 'screen-game', 'screen-roundend',
    'modal-dua', 'overlay-pause',
    'game-canvas', 'hud-it', 'hud-timer', 'hud-mode', 'hud-players',
    'setup-mode-buttons', 'setup-players', 'setup-start-btn',
    'library-list', 'library-filter',
    'dua-arabic', 'dua-translit', 'dua-english', 'dua-source', 'dua-who', 'dua-recited-btn',
    'roundend-title', 'roundend-stats', 'roundend-again-btn', 'roundend-menu-btn',
    'toggle-sound', 'toggle-music',
    'range-text-size', 'range-arabic-size',
    'pause-resume-btn', 'pause-quit-btn'
  ].forEach(id => els[id] = q(id));
}

const SCREENS = ['screen-menu', 'screen-howto', 'screen-library', 'screen-settings', 'screen-setup', 'screen-game', 'screen-roundend'];

export function showScreen(id){
  SCREENS.forEach(s => { if(els[s]) els[s].hidden = (s !== id); });
}

export function showDuaModal(dua, whoName){
  els['dua-who'].textContent = whoName + ' was tagged!';
  els['dua-arabic'].textContent = dua.arabic;
  els['dua-translit'].textContent = dua.transliteration;
  els['dua-english'].textContent = dua.english;
  els['dua-source'].textContent = dua.source + (dua.category === 'quran' ? ' — Qur’an' : ' — Hadith');
  els['modal-dua'].hidden = false;
}

export function hideDuaModal(){
  els['modal-dua'].hidden = true;
}

export function showPause(){ els['overlay-pause'].hidden = false; }
export function hidePause(){ els['overlay-pause'].hidden = true; }

export function updateHud(state){
  els['hud-it'].textContent = 'It: ' + (state.itName || '—');
  els['hud-timer'].textContent = state.timerLabel;
  els['hud-mode'].textContent = state.modeLabel;
  els['hud-players'].innerHTML = '';
  state.players.forEach(p => {
    const chip = document.createElement('div');
    chip.className = 'hud-chip';
    chip.style.borderColor = p.color;
    let status = '';
    if(p.isIt) status = '🏷️';
    else if(p.frozen) status = '💬';
    else if(p.protectedSec > 0) status = '🛡️ ' + p.protectedSec + 's';
    chip.innerHTML = '<span class="hud-chip-name">' + escapeHtml(p.name) + '</span><span class="hud-chip-status">' + status + '</span>';
    els['hud-players'].appendChild(chip);
  });
}

export function renderSetupPlayers(names){
  els['setup-players'].innerHTML = '';
  CONTROL_SCHEMES.forEach((scheme, i) => {
    const row = document.createElement('div');
    row.className = 'setup-row';
    row.innerHTML =
      '<span class="setup-swatch" style="background:' + PLAYER_COLORS[i] + '"></span>' +
      '<input type="text" class="setup-name-input" data-index="' + i + '" maxlength="14" value="' + escapeHtml(names[i] || ('Player ' + (i + 1))) + '">' +
      '<span class="setup-scheme">' + scheme.label + '</span>';
    els['setup-players'].appendChild(row);
  });
}

export function getSetupNames(){
  return Array.from(els['setup-players'].querySelectorAll('.setup-name-input')).map(inp => inp.value.trim() || null);
}

export function markModeButton(mode){
  els['setup-mode-buttons'].querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.mode === mode);
  });
}

export function renderLibrary(filter){
  els['library-list'].innerHTML = '';
  const items = DUA_LIBRARY.filter(d => filter === 'all' || d.category === filter);
  items.forEach(d => {
    const card = document.createElement('div');
    card.className = 'library-card';
    card.innerHTML =
      '<div class="library-badge ' + d.category + '">' + (d.category === 'quran' ? 'Qur’an' : 'Hadith') + '</div>' +
      '<div class="library-arabic">' + d.arabic + '</div>' +
      '<div class="library-translit">' + escapeHtml(d.transliteration) + '</div>' +
      '<div class="library-english">' + escapeHtml(d.english) + '</div>' +
      '<div class="library-source">' + escapeHtml(d.source) + '</div>';
    els['library-list'].appendChild(card);
  });
}

export function markLibraryFilter(filter){
  els['library-filter'].querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.filter === filter);
  });
}

export function showRoundEnd(mode, stats){
  els['roundend-title'].textContent = mode === 'practice' ? 'Practice Complete' : 'Round Complete!';
  els['roundend-stats'].innerHTML = '';

  if(mode !== 'practice'){
    const loser = stats.find(s => s.isIt);
    const winners = stats.filter(s => !s.isIt);
    const banner = document.createElement('div');
    banner.className = 'roundend-banner';
    if(loser && winners.length){
      banner.innerHTML =
        '🏆 ' + winners.map(w => escapeHtml(w.name)).join(', ') + ' escaped the tag!<br>' +
        '<span class="roundend-banner-sub">' + escapeHtml(loser.name) + ' was left holding it when time ran out.</span>';
    }
    els['roundend-stats'].appendChild(banner);
  }

  stats.forEach(s => {
    const row = document.createElement('div');
    row.className = 'roundend-row';
    row.innerHTML =
      '<span class="setup-swatch" style="background:' + s.color + '"></span>' +
      '<span class="roundend-name">' + escapeHtml(s.name) + '</span>' +
      '<span class="roundend-stat">Was It: ' + s.timesIt + '×</span>' +
      '<span class="roundend-stat">Du’as recited: ' + s.duasRecited + '</span>';
    els['roundend-stats'].appendChild(row);
  });
}

export function setToggleState(muted, musicOn){
  els['toggle-sound'].checked = !muted;
  els['toggle-music'].checked = musicOn;
}

export function applyTextScale(textScale, arabicScale){
  document.documentElement.style.setProperty('--text-scale', textScale);
  document.documentElement.style.setProperty('--arabic-scale', arabicScale);
  els['range-text-size'].value = textScale;
  els['range-arabic-size'].value = arabicScale;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function getCanvas(){ return els['game-canvas']; }

export function init(handlers){
  cacheEls();

  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => { handlers.playClickSound(); showScreen(btn.dataset.nav); });
  });

  q('menu-play-btn').addEventListener('click', () => { handlers.playClickSound(); handlers.goToSetup(); });

  els['setup-mode-buttons'].querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => { handlers.playClickSound(); handlers.selectMode(btn.dataset.mode); });
  });
  els['setup-start-btn'].addEventListener('click', () => { handlers.playClickSound(); handlers.startGame(); });

  els['library-filter'].querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => { handlers.playClickSound(); handlers.filterLibrary(btn.dataset.filter); });
  });

  els['dua-recited-btn'].addEventListener('click', () => { handlers.playClickSound(); handlers.recited(); });

  q('game-pause-btn').addEventListener('click', () => { handlers.playClickSound(); handlers.pause(); });
  els['pause-resume-btn'].addEventListener('click', () => { handlers.playClickSound(); handlers.resume(); });
  els['pause-quit-btn'].addEventListener('click', () => { handlers.playClickSound(); handlers.quitToMenu(); });

  els['roundend-again-btn'].addEventListener('click', () => { handlers.playClickSound(); handlers.startGame(); });
  els['roundend-menu-btn'].addEventListener('click', () => { handlers.playClickSound(); handlers.quitToMenu(); });

  els['toggle-sound'].addEventListener('change', e => handlers.setMuted(!e.target.checked));
  els['toggle-music'].addEventListener('change', e => handlers.setMusicOn(e.target.checked));
  els['range-text-size'].addEventListener('input', e => handlers.setTextScale(parseFloat(e.target.value)));
  els['range-arabic-size'].addEventListener('input', e => handlers.setArabicScale(parseFloat(e.target.value)));

  renderLibrary('all');
  markLibraryFilter('all');
}
