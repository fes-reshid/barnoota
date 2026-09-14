/* ===================== UI Manager =====================
   All DOM rendering and screen switching. Knows nothing about game
   rules -- it renders what it's given and forwards clicks to whatever
   handlers it was initialized with. */

import { CHARACTERS } from './characterManager.js';
import { CONTROL_SCHEMES } from './playerController.js';
import { LEVELS } from './levelManager.js';
import { GOOD_DEED_LIBRARY_CARDS, QURAN_HADITH_LIBRARY } from './learningLibrary.js';
import { starsToText } from './scoreManager.js';
import { isLevelUnlocked, loadSave } from './saveSystem.js';

const els = {};
const SCREENS = [
  'screen-menu', 'screen-level-select', 'screen-character-confirm', 'screen-good-deed-reveal',
  'screen-level-intro', 'screen-starting-line', 'screen-race', 'screen-results',
  'screen-final-message', 'screen-library', 'screen-howto', 'screen-settings'
];
const MODALS = ['modal-finish-question', 'overlay-pause'];

function q(id){ return document.getElementById(id); }
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function cacheEls(){
  [
    'screen-menu', 'screen-level-select', 'screen-character-confirm', 'screen-good-deed-reveal',
    'screen-level-intro', 'screen-starting-line', 'screen-race', 'screen-results',
    'screen-final-message', 'screen-library', 'screen-howto', 'screen-settings',
    'modal-finish-question', 'overlay-pause',
    'menu-play-btn', 'menu-4p-btn', 'level-grid',
    'char-grid', 'confirm-hint',
    'reveal-deed-label', 'reveal-continue-btn',
    'intro-level-name', 'intro-level-desc', 'intro-continue-btn',
    'starters', 'countdown-text',
    'race-pause-btn', 'hud-players', 'hud-ranks', 'hud-distance',
    'game-canvas', 'minimap-canvas', 'race-toast',
    'results-deed-line', 'results-list', 'results-continue-btn',
    'post-level-card', 'next-level-btn',
    'lib-tabs', 'lib-deeds', 'lib-quran',
    'finish-deed-label', 'finish-question-text', 'finish-answers', 'finish-feedback', 'finish-continue-btn',
    'pause-resume-btn', 'pause-quit-btn',
    'range-music', 'range-sfx', 'range-voice', 'toggle-mute', 'toggle-music', 'range-text', 'toggle-subtitles',
    'reset-progress-btn'
  ].forEach(id => els[id] = q(id));
}

export function showScreen(id){
  MODALS.forEach(m => { if(els[m]) els[m].hidden = true; });
  SCREENS.forEach(s => { if(els[s]) els[s].hidden = (s !== id); });
}

/* ---------- level select ---------- */
export function renderLevelSelect(){
  const save = loadSave();
  els['level-grid'].innerHTML = '';
  LEVELS.forEach(lvl => {
    const unlocked = isLevelUnlocked(lvl.id, LEVELS);
    const best = save.bestTimes[lvl.id];
    const card = document.createElement('div');
    card.className = 'level-card' + (unlocked ? '' : ' locked');
    card.innerHTML =
      '<h3>' + escapeHtml(lvl.name) + '</h3>' +
      '<p style="font-size:13px; color:#4a5a78; margin:0 0 8px;">' + (unlocked ? 'Ready to race!' : '🔒 Complete the previous level first') + '</p>' +
      (best ? '<p style="font-size:12px; color:#1f9c63; font-weight:800;">Best time: ' + best.toFixed(1) + 's</p>' : '') +
      (unlocked ? '<button class="big-btn" style="max-width:none;" data-level="' + lvl.id + '">Race Here</button>' : '');
    els['level-grid'].appendChild(card);
  });
}

/* ---------- character confirm ---------- */
export function renderCharacterConfirm(){
  els['char-grid'].innerHTML = '';
  CHARACTERS.forEach((c, i) => {
    const scheme = CONTROL_SCHEMES[i];
    const panel = document.createElement('div');
    panel.className = 'char-panel';
    panel.id = 'char-panel-' + i;
    panel.style.borderColor = '#eef4ff';
    panel.innerHTML =
      '<span class="checkmark">✅</span>' +
      '<div class="icon">' + c.accent + '</div>' +
      '<h3 style="color:' + c.color + '">Player ' + (i + 1) + ': ' + c.name + '</h3>' +
      '<div class="ability" style="color:' + c.colorDark + '">' + c.abilityName + '</div>' +
      '<div class="desc">' + escapeHtml(c.abilityDesc) + '</div>' +
      '<div class="desc" style="margin-top:6px;">Press <strong>' + labelForKey(scheme.ability) + '</strong> to ready up</div>';
    els['char-grid'].appendChild(panel);
  });
  els['confirm-hint'].textContent = 'Waiting for all four players...';
}

function labelForKey(code){
  const map = { KeyA: 'A', ArrowLeft: '←', KeyJ: 'J', KeyF: 'F' };
  return map[code] || code;
}

export function markPlayerReady(index){
  const panel = els['char-grid'].querySelector('#char-panel-' + index);
  if(panel){
    panel.classList.add('ready');
    panel.style.borderColor = CHARACTERS[index].color;
  }
}

export function setConfirmHint(text){
  els['confirm-hint'].textContent = text;
}

/* ---------- good deed reveal / level intro ---------- */
export function showGoodDeedReveal(label){
  els['reveal-deed-label'].textContent = label.toUpperCase();
}

export function showLevelIntro(level, deedLabel){
  els['intro-level-name'].textContent = level.name;
  els['intro-level-desc'].textContent = 'Today’s good deed: ' + deedLabel + '. Race through and reach the Good Deed Station!';
}

/* ---------- starting line ---------- */
export function renderStartingLine(){
  els['starters'].innerHTML = CHARACTERS.map(c =>
    '<div class="starter"><div class="dot" style="background:' + c.color + '"></div>' + c.icon + ' ' + c.name + '</div>'
  ).join('');
}

export function setCountdownText(text){
  els['countdown-text'].textContent = text;
}

/* ---------- race HUD ---------- */
export function updateRaceHud(state){
  els['hud-players'].innerHTML = '';
  state.players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'hud-player';
    div.style.borderLeftColor = p.color;
    div.innerHTML =
      '<div class="name" style="color:' + p.colorDark + '">' + p.icon + ' ' + escapeHtml(p.name) + '</div>' +
      '<div>' + p.ability + (p.abilityReady ? ' ✓' : '') + '</div>' +
      '<div class="hud-cooldown"><div class="hud-cooldown-fill" style="width:' + Math.round((1 - p.cooldownPct) * 100) + '%; background:' + p.color + '"></div></div>';
    els['hud-players'].appendChild(div);
  });

  els['hud-ranks'].innerHTML = state.ranks.map(r =>
    '<div class="rank-chip" style="background:' + r.color + '">' + r.rank + '</div>'
  ).join('');

  els['hud-distance'].textContent = 'GOOD DEED DISTANCE: ' + state.distance + 'm';
}

let toastTimer = null;
export function showToast(text, color){
  const el = els['race-toast'];
  el.textContent = text;
  el.style.color = color || '#fff';
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1400);
}

export function getCanvas(){ return els['game-canvas']; }
export function getMiniMapCanvas(){ return els['minimap-canvas']; }
export function showPauseButton(){ els['race-pause-btn'].style.display = 'block'; }

/* ---------- finish question ---------- */
export function openFinishQuestion(deedLabel, question, onResolved, onContinue){
  els['finish-deed-label'].textContent = 'GOOD DEED: ' + deedLabel.toUpperCase();
  els['finish-question-text'].textContent = question.question;
  els['finish-answers'].innerHTML = '';
  els['finish-feedback'].textContent = '';
  els['finish-feedback'].className = 'feedback';
  els['finish-continue-btn'].hidden = true;
  let answered = false;

  question.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      if(answered) return;
      answered = true;
      const correct = i === question.correctIndex;
      btn.classList.add(correct ? 'correct' : 'wrong');
      if(!correct) els['finish-answers'].children[question.correctIndex].classList.add('correct');
      els['finish-feedback'].textContent = correct ? 'GOOD CHOICE!' : 'Good try! Here’s a great choice for next time.';
      els['finish-feedback'].className = 'feedback ' + (correct ? 'good' : 'bad');
      Array.from(els['finish-answers'].children).forEach(c => c.disabled = true);
      els['finish-continue-btn'].hidden = false;
      onResolved(correct);
    });
    els['finish-answers'].appendChild(btn);
  });
  els['finish-continue-btn'].onclick = onContinue;
  els['modal-finish-question'].hidden = false;
}

export function hideFinishQuestion(){ els['modal-finish-question'].hidden = true; }

/* ---------- pause ---------- */
export function showPause(){ els['overlay-pause'].hidden = false; }
export function hidePause(){ els['overlay-pause'].hidden = true; }

/* ---------- results ---------- */
export function showResults(results, deedLabel){
  els['results-deed-line'].textContent = 'Today’s Good Deed: ' + deedLabel.toUpperCase();
  els['results-list'].innerHTML = '';
  results.forEach(r => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.borderLeftColor = r.character.color;
    card.innerHTML =
      '<h3 style="color:' + r.character.colorDark + '">' + r.character.icon + ' ' + r.character.name.toUpperCase() + '</h3>' +
      '<div class="result-row"><span>Speed</span><span>' + starsToText(r.speedStars) + '</span></div>' +
      '<div class="result-row"><span>Kindness</span><span>' + starsToText(r.kindnessStars) + '</span></div>' +
      '<div class="result-row"><span>Teamwork</span><span>' + starsToText(r.teamworkStars) + '</span></div>';
    els['results-list'].appendChild(card);
  });
}

/* ---------- final message ---------- */
export function showFinalMessage(card){
  els['post-level-card'].innerHTML = card
    ? '<h3>' + card.title + '</h3><p>' + card.text + '</p>'
    : '';
}

/* ---------- library ---------- */
export function renderLibrary(){
  els['lib-deeds'].innerHTML = GOOD_DEED_LIBRARY_CARDS.map(c =>
    '<div class="deed-card"><h3>' + c.icon + ' ' + escapeHtml(c.title) + '</h3>' +
    '<p class="label">What is it?</p><p>' + escapeHtml(c.what) + '</p>' +
    '<p class="label">Why is it important?</p><p>' + escapeHtml(c.why) + '</p>' +
    '<p class="label">How can I do it?</p><p>' + escapeHtml(c.how) + '</p></div>'
  ).join('');

  els['lib-quran'].innerHTML = QURAN_HADITH_LIBRARY.map(a =>
    '<div class="ayah-box"><h3>' + escapeHtml(a.title) + '</h3>' +
    '<div class="arabic">' + a.arabic + '</div>' +
    '<p>' + escapeHtml(a.translation) + '</p>' +
    '<p style="font-size:13px; color:#6b5a3f;">' + escapeHtml(a.source) + '</p></div>'
  ).join('');
}

export function setLibraryTab(tab){
  els['lib-deeds'].hidden = tab !== 'deeds';
  els['lib-quran'].hidden = tab !== 'quran';
  els['lib-tabs'].querySelectorAll('button').forEach(b => b.classList.toggle('selected', b.dataset.tab === tab));
}

/* ---------- settings ---------- */
export function applySettingsToUI(s){
  els['range-music'].value = s.musicVolume;
  els['range-sfx'].value = s.sfxVolume;
  els['range-voice'].value = s.voiceVolume;
  els['toggle-mute'].checked = s.muted;
  els['toggle-music'].checked = s.musicOn;
  els['range-text'].value = s.textScale;
  els['toggle-subtitles'].checked = s.subtitles;
  document.documentElement.style.setProperty('--text-scale', s.textScale);
}

/* ---------- wiring ---------- */
export function init(handlers){
  cacheEls();

  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => { handlers.click(); showScreen(btn.dataset.nav); handlers.onNavigate(btn.dataset.nav); });
  });

  els['menu-play-btn'].addEventListener('click', () => { handlers.click(); handlers.playRandom(); });
  els['menu-4p-btn'].addEventListener('click', () => { handlers.click(); handlers.playRandom(); });
  els['level-grid'].addEventListener('click', e => {
    const btn = e.target.closest('[data-level]');
    if(btn){ handlers.click(); handlers.playLevel(btn.dataset.level); }
  });

  els['reveal-continue-btn'].addEventListener('click', () => { handlers.click(); handlers.goToLevelIntro(); });
  els['intro-continue-btn'].addEventListener('click', () => { handlers.click(); handlers.goToStartingLine(); });
  els['results-continue-btn'].addEventListener('click', () => { handlers.click(); handlers.goToFinalMessage(); });
  els['next-level-btn'].addEventListener('click', () => { handlers.click(); handlers.nextLevel(); });

  els['race-pause-btn'].addEventListener('click', () => { handlers.click(); handlers.pause(); });
  els['pause-resume-btn'].addEventListener('click', () => { handlers.click(); handlers.resume(); });
  els['pause-quit-btn'].addEventListener('click', () => { handlers.click(); handlers.quitToMenu(); });

  els['lib-tabs'].addEventListener('click', e => {
    const btn = e.target.closest('button[data-tab]');
    if(btn){ handlers.click(); setLibraryTab(btn.dataset.tab); }
  });

  els['range-music'].addEventListener('input', e => handlers.setSetting('musicVolume', parseFloat(e.target.value)));
  els['range-sfx'].addEventListener('input', e => handlers.setSetting('sfxVolume', parseFloat(e.target.value)));
  els['range-voice'].addEventListener('input', e => handlers.setSetting('voiceVolume', parseFloat(e.target.value)));
  els['toggle-mute'].addEventListener('change', e => handlers.setSetting('muted', e.target.checked));
  els['toggle-music'].addEventListener('change', e => handlers.setSetting('musicOn', e.target.checked));
  els['range-text'].addEventListener('input', e => handlers.setSetting('textScale', parseFloat(e.target.value)));
  els['toggle-subtitles'].addEventListener('change', e => handlers.setSetting('subtitles', e.target.checked));
  els['reset-progress-btn'].addEventListener('click', () => { handlers.click(); handlers.resetProgress(); });

  renderLibrary();
  setLibraryTab('deeds');
}
