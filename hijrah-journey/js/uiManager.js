/* ===================== UI Manager =====================
   All DOM rendering and screen-switching. Knows nothing about game
   rules -- it renders data it's given and forwards clicks to whatever
   handler functions it was initialized with. */

import { CLOTHING_COLORS, CAMEL_COLORS } from './playerController.js';
import { STAMINA_MAX } from './camelController.js';
import { renderMapSVG } from './mapManager.js';
import { TIMELINE, DATING_NOTE, KEY_FACTS, SOURCES } from './historySystem.js';
import { AYAH_LIBRARY } from './ayahSystem.js';
import { canSpeakAyah, speakAyah } from './audioManager.js';

const els = {};
const SCREENS = [
  'screen-menu', 'screen-setup', 'screen-intro', 'screen-chapter', 'screen-madinah-arrival',
  'screen-final-quiz', 'screen-ending', 'screen-alhamdulillah', 'screen-map', 'screen-history',
  'screen-ayah-library', 'screen-howto', 'screen-settings'
];
const MODALS = ['modal-landmark', 'modal-cave', 'modal-teamwork', 'modal-quba', 'overlay-pause'];

function q(id){ return document.getElementById(id); }

export function cacheEls(){
  [
    'screen-menu', 'screen-setup', 'screen-intro', 'screen-chapter', 'screen-madinah-arrival',
    'screen-final-quiz', 'screen-ending', 'screen-alhamdulillah', 'screen-map', 'screen-history',
    'screen-ayah-library', 'screen-howto', 'screen-settings',
    'modal-landmark', 'modal-cave', 'modal-teamwork', 'modal-quba', 'overlay-pause',
    'menu-play-btn', 'setup-players', 'setup-start-btn', 'setup-continue-btn',
    'intro-continue-btn', 'madinah-title', 'madinah-continue-btn',
    'game-canvas', 'hud-location', 'hud-distance', 'hud-stars', 'hud-riders', 'chapter-pause-btn',
    'quiz-progress', 'quiz-question', 'quiz-answers', 'quiz-feedback',
    'ending-continue-btn', 'lessons-checklist', 'restart-btn',
    'map-svg-wrap', 'map-back-btn', 'history-facts', 'history-dating-note', 'history-sources', 'history-back-btn', 'ayah-list',
    'toggle-sound', 'toggle-wind', 'range-text-size', 'range-arabic-size',
    'pause-resume-btn', 'pause-quit-btn',
    'landmark-kicker', 'landmark-title', 'landmark-discover', 'landmark-learn', 'landmark-why',
    'landmark-reference', 'landmark-question', 'landmark-answers', 'landmark-feedback', 'landmark-continue-btn',
    'cave-ayah-box', 'cave-question', 'cave-answers', 'cave-feedback', 'cave-continue-btn',
    'teamwork-narration', 'teamwork-help-btn', 'teamwork-race-btn', 'teamwork-feedback', 'teamwork-continue-btn',
    'quba-question', 'quba-answers', 'quba-feedback', 'quba-continue-btn'
  ].forEach(id => els[id] = q(id));
}

export function showScreen(id){
  MODALS.forEach(m => { if(els[m]) els[m].hidden = true; });
  SCREENS.forEach(s => { if(els[s]) els[s].hidden = (s !== id); });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- generic answer-list renderer, shared by every quiz-like modal ---------- */
function renderAnswers(container, feedbackEl, continueBtn, options, correctIndex, onResolved){
  container.innerHTML = '';
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  if(continueBtn) continueBtn.hidden = true;
  let answered = false;

  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      if(answered) return;
      answered = true;
      const correct = i === correctIndex;
      btn.classList.add(correct ? 'correct' : 'wrong');
      if(!correct){
        const correctBtn = container.children[correctIndex];
        if(correctBtn) correctBtn.classList.add('correct');
      }
      feedbackEl.textContent = correct ? 'Correct! Well done.' : 'Not quite — here’s the right answer.';
      feedbackEl.className = 'feedback ' + (correct ? 'good' : 'bad');
      Array.from(container.children).forEach(c => c.disabled = true);
      if(continueBtn) continueBtn.hidden = false;
      onResolved(correct);
    });
    container.appendChild(btn);
  });
}

/* ---------- setup screen ---------- */
export function renderSetupPlayers(defaults){
  const selection = defaults.map((d, i) => ({
    name: d.name || ('Player ' + (i + 1)),
    clothingColor: d.clothingColor || CLOTHING_COLORS[i],
    camelColor: d.camelColor || CAMEL_COLORS[i]
  }));

  els['setup-players'].innerHTML = '';
  selection.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'setup-row';
    row.innerHTML =
      '<input type="text" class="setup-name-input" data-index="' + i + '" maxlength="14" value="' + escapeHtml(s.name) + '">' +
      '<div class="swatch-label">Clothing color</div>' +
      '<div class="swatch-row" data-role="clothing" data-index="' + i + '">' +
        CLOTHING_COLORS.map((c, ci) => '<span class="swatch' + (c === s.clothingColor ? ' selected' : '') + '" style="background:' + c + '" data-color="' + c + '"></span>').join('') +
      '</div>' +
      '<div class="swatch-label">Camel color</div>' +
      '<div class="swatch-row" data-role="camel" data-index="' + i + '">' +
        CAMEL_COLORS.map((c, ci) => '<span class="swatch' + (c === s.camelColor ? ' selected' : '') + '" style="background:' + c + '" data-color="' + c + '"></span>').join('') +
      '</div>' +
      '<div class="swatch-label" style="margin-top:4px; color:#8a7654;">🏒 Backpack and 💧 water are already packed for the journey!</div>';
    els['setup-players'].appendChild(row);
  });

  els['setup-players'].querySelectorAll('.swatch-row').forEach(row => {
    row.querySelectorAll('.swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        row.querySelectorAll('.swatch').forEach(s2 => s2.classList.remove('selected'));
        sw.classList.add('selected');
      });
    });
  });
}

export function getSetupSelections(){
  const rows = Array.from(els['setup-players'].children);
  return rows.map((row, i) => {
    const name = row.querySelector('.setup-name-input').value;
    const clothing = row.querySelector('[data-role="clothing"] .swatch.selected');
    const camel = row.querySelector('[data-role="camel"] .swatch.selected');
    return {
      name,
      clothingColor: clothing ? clothing.dataset.color : CLOTHING_COLORS[i],
      camelColor: camel ? camel.dataset.color : CAMEL_COLORS[i]
    };
  });
}

/* ---------- chapter HUD ---------- */
export function updateChapterHud(state){
  els['hud-location'].textContent = state.location;
  els['hud-distance'].textContent = state.distanceLabel;
  els['hud-stars'].textContent = '⭐ ' + state.stars;
  els['hud-riders'].innerHTML = '';
  state.riders.forEach(r => {
    const pct = Math.round((r.stamina / STAMINA_MAX) * 100);
    const div = document.createElement('div');
    div.className = 'hud-rider';
    div.innerHTML =
      '<span class="hud-rider-name" style="color:' + r.clothingColor + '">' + escapeHtml(r.name) + '</span>' +
      '<div class="stamina-track"><div class="stamina-fill" style="width:' + pct + '%"></div></div>';
    els['hud-riders'].appendChild(div);
  });
}

export function getCanvas(){ return els['game-canvas']; }

/* ---------- landmark (DISCOVER / LEARN / QUESTION) modal ---------- */
export function openLandmarkModal(stop, onResolved, onContinue){
  els['landmark-title'].textContent = stop.title;
  els['landmark-discover'].textContent = stop.discover;
  els['landmark-learn'].textContent = stop.learn;
  els['landmark-why'].textContent = stop.why;
  els['landmark-reference'].textContent = stop.reference;
  els['landmark-question'].textContent = stop.question.question;
  renderAnswers(els['landmark-answers'], els['landmark-feedback'], els['landmark-continue-btn'], stop.question.options, stop.question.correctIndex, onResolved);
  els['landmark-continue-btn'].onclick = onContinue;
  els['modal-landmark'].hidden = false;
}

export function hideLandmarkModal(){ els['modal-landmark'].hidden = true; }

/* ---------- cave of thawr modal ---------- */
export function openCaveModal(ayah, question, onResolved, onContinue){
  els['cave-ayah-box'].innerHTML =
    '<div class="arabic">' + ayah.arabicFull.replace(ayah.highlightArabic, '<mark>' + ayah.highlightArabic + '</mark>') + '</div>' +
    '<div class="translation">' + escapeHtml(ayah.translationSimple) + '</div>' +
    '<div class="ref">' + escapeHtml(ayah.surah) + ' — ' + escapeHtml(ayah.ayah) + '</div>';
  els['cave-question'].textContent = question.question;
  renderAnswers(els['cave-answers'], els['cave-feedback'], els['cave-continue-btn'], question.options, question.correctIndex, onResolved);
  els['cave-continue-btn'].onclick = onContinue;
  els['modal-cave'].hidden = false;
}

export function hideCaveModal(){ els['modal-cave'].hidden = true; }

/* ---------- teamwork event modal ---------- */
export function openTeamworkModal(event, onChoice){
  els['teamwork-narration'].textContent = event.narration;
  els['teamwork-feedback'].textContent = '';
  els['teamwork-feedback'].className = 'feedback';
  els['teamwork-continue-btn'].hidden = true;
  els['teamwork-help-btn'].disabled = false;
  els['teamwork-race-btn'].disabled = false;
  els['teamwork-help-btn'].onclick = () => resolveTeamwork(true, event, onChoice);
  els['teamwork-race-btn'].onclick = () => resolveTeamwork(false, event, onChoice);
  els['modal-teamwork'].hidden = false;
}

function resolveTeamwork(helped, event, onChoice){
  els['teamwork-help-btn'].disabled = true;
  els['teamwork-race-btn'].disabled = true;
  els['teamwork-feedback'].textContent = helped ? event.afterHelp : event.afterRace;
  els['teamwork-feedback'].className = 'feedback ' + (helped ? 'good' : 'bad');
  els['teamwork-continue-btn'].hidden = false;
  onChoice(helped);
}

export function setTeamworkContinue(onContinue){ els['teamwork-continue-btn'].onclick = onContinue; }
export function hideTeamworkModal(){ els['modal-teamwork'].hidden = true; }

/* ---------- quba modal ---------- */
export function openQubaModal(question, onResolved, onContinue){
  els['quba-question'].textContent = question.question;
  renderAnswers(els['quba-answers'], els['quba-feedback'], els['quba-continue-btn'], question.options, question.correctIndex, onResolved);
  els['quba-continue-btn'].onclick = onContinue;
  els['modal-quba'].hidden = false;
}

export function hideQubaModal(){ els['modal-quba'].hidden = true; }

/* ---------- pause overlay ---------- */
export function showPause(){ els['overlay-pause'].hidden = false; }
export function hidePause(){ els['overlay-pause'].hidden = true; }

/* ---------- Madinah arrival ---------- */
export function setMadinahTitle(text){ els['madinah-title'].textContent = text; }

/* ---------- final quiz ---------- */
export function renderFinalQuizQuestion(index, total, q, onResolved){
  els['quiz-progress'].textContent = 'Question ' + (index + 1) + ' of ' + total;
  els['quiz-question'].textContent = q.question;
  renderAnswers(els['quiz-answers'], els['quiz-feedback'], null, q.options, q.correctIndex, onResolved);
}

/* ---------- ending checklist ---------- */
export function getSelectedLessons(){
  return Array.from(els['lessons-checklist'].querySelectorAll('input:checked')).map(i => i.value);
}
export function resetLessonsChecklist(){
  els['lessons-checklist'].querySelectorAll('input').forEach(i => i.checked = false);
}

/* ---------- map screen ---------- */
export function renderMapScreen(stopsReached){
  els['map-svg-wrap'].innerHTML = renderMapSVG(stopsReached);
}

/* ---------- history screen ---------- */
export function renderHistoryScreen(){
  els['history-facts'].innerHTML = '<ul style="margin:0; padding-left:20px;">' + KEY_FACTS.map(f => '<li style="margin-bottom:8px;">' + f + '</li>').join('') + '</ul>' +
    '<p style="margin-top:10px; font-family:\'JetBrains Mono\', monospace; font-size:13px; color:var(--gold-dark);">' + TIMELINE.map(t => t.year + ' (' + t.islamicYear + ') — ' + t.label).join('') + '</p>';
  els['history-dating-note'].textContent = DATING_NOTE;
  els['history-sources'].innerHTML = SOURCES.map(s => '<li style="margin-bottom:6px;">' + s + '</li>').join('');
}

/* ---------- ayah library ---------- */
export function renderAyahLibrary(){
  els['ayah-list'].innerHTML = '';
  AYAH_LIBRARY.forEach(a => {
    const box = document.createElement('div');
    box.className = 'ayah-box';
    const canSpeak = canSpeakAyah();
    box.innerHTML =
      '<div class="ref" style="margin-bottom:6px; font-weight:800; color:var(--ink-navy);">' + escapeHtml(a.surah) + ' — ' + escapeHtml(a.ayah) + '</div>' +
      '<div class="arabic">' + a.arabicFull + '</div>' +
      '<div class="translation">' + escapeHtml(a.translationSimple) + '</div>' +
      '<div class="ref">Lesson: ' + escapeHtml(a.lesson) + '</div>' +
      (canSpeak ? '<button class="big-btn secondary" style="margin-top:10px; max-width:220px;" data-speak="' + a.id + '">🔊 Hear the Ayah (computer voice)</button>' : '');
    els['ayah-list'].appendChild(box);
  });
  els['ayah-list'].querySelectorAll('[data-speak]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ayah = AYAH_LIBRARY.find(a => a.id === btn.dataset.speak);
      if(ayah) speakAyah(ayah.arabicFull);
    });
  });
}

/* ---------- settings ---------- */
export function setToggleState(muted, windOn){
  els['toggle-sound'].checked = !muted;
  els['toggle-wind'].checked = windOn;
}

export function applyTextScale(textScale, arabicScale){
  document.documentElement.style.setProperty('--text-scale', textScale);
  document.documentElement.style.setProperty('--arabic-scale', arabicScale);
  els['range-text-size'].value = textScale;
  els['range-arabic-size'].value = arabicScale;
}

/* ---------- setup screen: continue button visibility ---------- */
export function setContinueButtonVisible(visible){
  els['setup-continue-btn'].hidden = !visible;
}

/* ---------- wiring ---------- */
export function init(handlers){
  cacheEls();

  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      handlers.click();
      handlers.onNavigate(btn.dataset.nav);
      showScreen(btn.dataset.nav);
      if(btn.dataset.nav === 'screen-map') handlers.onNavigateMap();
    });
  });

  els['menu-play-btn'].addEventListener('click', () => { handlers.click(); handlers.goToSetup(); });
  els['setup-start-btn'].addEventListener('click', () => { handlers.click(); handlers.startNewJourney(); });
  els['setup-continue-btn'].addEventListener('click', () => { handlers.click(); handlers.continueJourney(); });
  els['intro-continue-btn'].addEventListener('click', () => { handlers.click(); handlers.beginJourney(); });
  els['madinah-continue-btn'].addEventListener('click', () => { handlers.click(); handlers.goToFinalQuiz(); });
  els['ending-continue-btn'].addEventListener('click', () => { handlers.click(); handlers.goToAlhamdulillah(); });
  els['restart-btn'].addEventListener('click', () => { handlers.click(); handlers.restart(); });
  els['chapter-pause-btn'].addEventListener('click', () => { handlers.click(); handlers.pause(); });
  els['pause-resume-btn'].addEventListener('click', () => { handlers.click(); handlers.resume(); });
  els['pause-quit-btn'].addEventListener('click', () => { handlers.click(); handlers.quitToMenu(); });
  els['map-back-btn'].addEventListener('click', () => { handlers.click(); handlers.goBack(); });
  els['history-back-btn'].addEventListener('click', () => { handlers.click(); handlers.goBack(); });

  els['toggle-sound'].addEventListener('change', e => handlers.setMuted(!e.target.checked));
  els['toggle-wind'].addEventListener('change', e => handlers.setWindOn(e.target.checked));
  els['range-text-size'].addEventListener('input', e => handlers.setTextScale(parseFloat(e.target.value)));
  els['range-arabic-size'].addEventListener('input', e => handlers.setArabicScale(parseFloat(e.target.value)));

  renderHistoryScreen();
  renderAyahLibrary();
}
