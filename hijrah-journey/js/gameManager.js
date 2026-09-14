/* ===================== Game Manager =====================
   The orchestrator: owns the four riders, overall journey state, the
   requestAnimationFrame loop, keyboard input, and wires every other
   module together. Movement is local-only (four keyboard schemes on one
   screen), same approach used across this site's other multiplayer
   mini-games. */

import { FourPlayerManager } from './fourPlayerManager.js';
import { JourneyManager, STAGES } from './journeyManager.js';
import { RewardSystem } from './rewardSystem.js';
import { CHAPTER_LANDMARKS, checkLandmarkProximity } from './landmarkManager.js';
import { getAyahById } from './ayahSystem.js';
import { CAVE_QUESTION, MINOR_STOPS, TEAMWORK_EVENT, QUBA_QUESTION, FINAL_QUIZ, FINAL_QUIZ_REWARD_PER_CORRECT } from './quizSystem.js';
import { saveProgress, loadProgress, clearProgress, hasSavedProgress } from './saveSystem.js';
import * as ui from './uiManager.js';
import {
  setMuted, isMuted, setWindOn, isWindOn, unlockAudio,
  playUiClick, playDiscovery, playCorrect, playWrong, playJourneyComplete
} from './audioManager.js';

const CANVAS_W = 900, CANVAS_H = 520;

const CHAPTER_THEMES = {
  'makkah-thawr': {
    sky: ['#16213f', '#3a4d78'], ground: '#cdb27c', stars: true,
    obstacles: [{ x: 150, y: 330, r: 26 }, { x: 300, y: 420, r: 22 }, { x: 500, y: 340, r: 24 }],
    palms: [{ x: 90, y: 400 }, { x: 160, y: 440 }, { x: 620, y: 420 }],
    mountain: { x: 820, y: 260 }
  },
  'desert-route': {
    sky: ['#e8b45c', '#f6d98a'], ground: '#e3c98f', stars: false,
    obstacles: [{ x: 120, y: 300 }, { x: 380, y: 260 }, { x: 600, y: 380 }, { x: 700, y: 200 }].map(o => ({ ...o, r: 24 })),
    palms: [{ x: 200, y: 440 }, { x: 400, y: 460 }, { x: 720, y: 440 }],
    mountain: null
  },
  quba: {
    sky: ['#a9d9c4', '#e7f3d7'], ground: '#bfe0a6', stars: false,
    obstacles: [{ x: 200, y: 340, r: 22 }, { x: 620, y: 380, r: 22 }],
    palms: [{ x: 100, y: 420 }, { x: 700, y: 420 }, { x: 780, y: 460 }],
    mosque: { x: 820, y: 260 }
  }
};

export class GameManager {
  constructor(){
    this.players = new FourPlayerManager();
    this.journey = new JourneyManager();
    this.reward = new RewardSystem();
    this.keysDown = new Set();
    this.canvas = null;
    this.ctx = null;
    this.running = false;
    this.lastTime = 0;
    this.chapterKey = null;
    this.modalOpen = false;
    this.textScale = 1;
    this.arabicScale = 1;
    this.pausedForModal = false;
    this.chapterActive = false;
    this.pausedBeforeNav = false;
    this._tick = this._tick.bind(this);
  }

  init(){
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    window.addEventListener('keydown', e => {
      if(this.running && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if(e.code === 'Escape' && this.running && !this.modalOpen) this.pause();
      this.keysDown.add(e.code);
    });
    window.addEventListener('keyup', e => this.keysDown.delete(e.code));

    ui.init({
      click: () => playUiClick(),
      goToSetup: () => this.goToSetup(),
      startNewJourney: () => this.startNewJourney(),
      continueJourney: () => this.continueJourney(),
      beginJourney: () => this.beginJourney(),
      goToFinalQuiz: () => this.startFinalQuiz(),
      goToAlhamdulillah: () => this.goToAlhamdulillah(),
      onNavigate: target => this._onNavigate(target),
      onNavigateMap: () => ui.renderMapScreen(this.journey.majorStopsReached()),
      goBack: () => this.goBack(),
      restart: () => this.restart(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      quitToMenu: () => this.quitToMenu(),
      setMuted: v => { setMuted(v); ui.setToggleState(isMuted(), isWindOn()); },
      setWindOn: v => { setWindOn(v); ui.setToggleState(isMuted(), isWindOn()); },
      setTextScale: v => { this.textScale = v; ui.applyTextScale(this.textScale, this.arabicScale); },
      setArabicScale: v => { this.arabicScale = v; ui.applyTextScale(this.textScale, this.arabicScale); }
    });

    this.canvas = ui.getCanvas();
    this.ctx = this.canvas.getContext('2d');
    ui.setToggleState(isMuted(), isWindOn());
    ui.applyTextScale(this.textScale, this.arabicScale);
    ui.showScreen('screen-menu');
  }

  goToSetup(){
    ui.renderSetupPlayers(this.players.riders);
    ui.setContinueButtonVisible(hasSavedProgress());
    ui.showScreen('screen-setup');
  }

  _applySetupSelections(){
    this.players.applySetup(ui.getSetupSelections());
  }

  startNewJourney(){
    this._applySetupSelections();
    this.journey = new JourneyManager();
    this.reward = new RewardSystem();
    this.chapterActive = false;
    clearProgress();
    ui.showScreen('screen-intro');
  }

  continueJourney(){
    this._applySetupSelections();
    const saved = loadProgress();
    this.journey.restoreFrom(saved && saved.journey);
    if(saved && typeof saved.stars === 'number') this.reward.stars = saved.stars;
    this._enterCurrentStage();
  }

  beginJourney(){
    this.journey.stageIndex = STAGES.indexOf('makkah-thawr');
    this._enterCurrentStage();
  }

  restart(){
    this.running = false;
    clearProgress();
    this.journey = new JourneyManager();
    this.reward = new RewardSystem();
    this.chapterActive = false;
    ui.showScreen('screen-menu');
  }

  quitToMenu(){
    this.running = false;
    this.chapterActive = false;
    ui.hidePause();
    this._save();
    ui.showScreen('screen-menu');
  }

  _save(){
    saveProgress({ journey: this.journey.serialize(), stars: this.reward.stars });
  }

  /* Called for every [data-nav] click, so a mid-chapter detour to the Map
     or History screen can be resumed correctly by goBack() -- returning to
     the game (paused or running, matching how it was left) instead of
     dead-ending at the main menu. */
  _onNavigate(target){
    if((target === 'screen-map' || target === 'screen-history') && this.chapterActive){
      this.pausedBeforeNav = !this.running;
      this.running = false;
    }
  }

  goBack(){
    if(this.chapterActive){
      ui.showScreen('screen-chapter');
      if(this.pausedBeforeNav){
        ui.showPause();
      } else {
        this.resume();
      }
    } else {
      ui.showScreen('screen-menu');
    }
  }

  _enterCurrentStage(){
    const stage = this.journey.stage;
    if(stage === 'makkah-thawr' || stage === 'desert-route' || stage === 'quba'){
      this._enterChapter(stage);
    } else if(stage === 'cave'){
      this._enterChapter('makkah-thawr');
    } else if(stage === 'madinah-arrival'){
      this._showMadinahArrival();
    } else if(stage === 'final-quiz'){
      this.startFinalQuiz();
    } else if(stage === 'ending'){
      ui.showScreen('screen-ending');
    } else {
      ui.showScreen('screen-intro');
    }
  }

  /* ---------------- open-map chapters ---------------- */

  _enterChapter(key){
    this.chapterKey = key;
    this.chapterActive = true;
    this.players.placeAllAt(90, CANVAS_H / 2);
    ui.showScreen('screen-chapter');
    this.lastTime = performance.now();
    this.running = true;
    this.modalOpen = false;
    requestAnimationFrame(this._tick);
  }

  pause(){
    if(!this.running) return;
    this.running = false;
    ui.showPause();
  }

  resume(){
    if(this.running) return;
    ui.hidePause();
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this._tick);
  }

  _tick(now){
    if(!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    const theme = CHAPTER_THEMES[this.chapterKey];
    const bounds = { x: 0, y: 60, width: CANVAS_W, height: CANVAS_H - 60 };

    if(!this.modalOpen){
      this.players.update(dt, this.keysDown, bounds, theme.obstacles);
      this._checkLandmarks(now);
    }

    this._draw(now);
    ui.updateChapterHud({
      location: this.journey.locationLabel(),
      distanceLabel: this.journey.distanceLabel(),
      stars: this.reward.stars,
      riders: this.players.riders
    });

    requestAnimationFrame(this._tick);
  }

  _checkLandmarks(now){
    const landmarks = CHAPTER_LANDMARKS[this.chapterKey];
    const hit = checkLandmarkProximity(this.players.riders, landmarks, this.journey.discoveredLandmarks);
    if(!hit) return;

    this.modalOpen = true;
    playDiscovery();

    if(hit.kind === 'cave'){
      this._openCave(hit);
    } else if(hit.kind === 'minor'){
      this._openMinorStop(hit);
    } else if(hit.kind === 'teamwork'){
      this._openTeamwork(hit);
    } else if(hit.kind === 'quba'){
      this._openQuba(hit);
    } else if(hit.kind === 'exit'){
      this.journey.discover(hit.id);
      this._save();
      this.modalOpen = false;
      this.running = false;
      this._advanceAfterChapter();
    }
  }

  _closeModalAndResume(landmarkId){
    if(landmarkId) this.journey.discover(landmarkId);
    this._save();
    this.modalOpen = false;
    this.lastTime = performance.now();
  }

  _openCave(landmark){
    const ayah = getAyahById('tawbah-9-40');
    ui.openCaveModal(ayah, CAVE_QUESTION, correct => {
      if(correct){ this.reward.add(CAVE_QUESTION.reward); playCorrect(); } else { playWrong(); }
    }, () => {
      ui.hideCaveModal();
      // The cave is the only landmark in this chapter, so finishing it
      // is also what carries the party on toward the Desert Route.
      this.journey.discover(landmark.id);
      this._save();
      this.modalOpen = false;
      this.running = false;
      this._advanceAfterChapter();
    });
  }

  _openMinorStop(landmark){
    const stop = MINOR_STOPS.find(s => s.id === landmark.id);
    ui.openLandmarkModal(stop, correct => {
      if(correct){ this.reward.add(stop.question.reward); playCorrect(); } else { playWrong(); }
    }, () => {
      ui.hideLandmarkModal();
      this._closeModalAndResume(landmark.id);
    });
  }

  _openTeamwork(landmark){
    ui.openTeamworkModal(TEAMWORK_EVENT, helped => {
      if(helped){ this.reward.add(TEAMWORK_EVENT.choiceHelp.reward); playCorrect(); }
    });
    ui.setTeamworkContinue(() => {
      ui.hideTeamworkModal();
      this._closeModalAndResume(landmark.id);
    });
  }

  _openQuba(landmark){
    ui.openQubaModal(QUBA_QUESTION, correct => {
      if(correct){ this.reward.add(QUBA_QUESTION.reward); playCorrect(); } else { playWrong(); }
    }, () => {
      ui.hideQubaModal();
      this.journey.discover(landmark.id);
      this._save();
      this.modalOpen = false;
      this.running = false;
      this._advanceAfterChapter();
    });
  }

  _advanceAfterChapter(){
    if(this.chapterKey === 'makkah-thawr'){
      this.journey.stageIndex = STAGES.indexOf('desert-route');
      this._save();
      this._enterChapter('desert-route');
    } else if(this.chapterKey === 'desert-route'){
      this.journey.stageIndex = STAGES.indexOf('quba');
      this._save();
      this._enterChapter('quba');
    } else if(this.chapterKey === 'quba'){
      this.journey.stageIndex = STAGES.indexOf('madinah-arrival');
      this._save();
      this._showMadinahArrival();
    }
  }

  _showMadinahArrival(){
    this.running = false;
    this.chapterActive = false;
    ui.setMadinahTitle('Journey Complete!');
    ui.showScreen('screen-madinah-arrival');
  }

  /* ---------------- final quiz ---------------- */

  startFinalQuiz(){
    this.running = false;
    this.journey.stageIndex = STAGES.indexOf('final-quiz');
    this._save();
    this.quizIndex = 0;
    ui.showScreen('screen-final-quiz');
    this._showQuizQuestion();
  }

  _showQuizQuestion(){
    const q = FINAL_QUIZ[this.quizIndex];
    ui.renderFinalQuizQuestion(this.quizIndex, FINAL_QUIZ.length, q, correct => {
      if(correct){ this.reward.add(FINAL_QUIZ_REWARD_PER_CORRECT); playCorrect(); } else { playWrong(); }
      setTimeout(() => {
        this.quizIndex++;
        if(this.quizIndex < FINAL_QUIZ.length){
          this._showQuizQuestion();
        } else {
          this.journey.stageIndex = STAGES.indexOf('ending');
          this._save();
          playJourneyComplete();
          ui.showScreen('screen-ending');
        }
      }, 1400);
    });
  }

  goToAlhamdulillah(){
    this.running = false;
    ui.resetLessonsChecklist();
    ui.showScreen('screen-alhamdulillah');
  }

  /* ---------------- rendering ---------------- */

  _draw(now){
    const ctx = this.ctx;
    const theme = CHAPTER_THEMES[this.chapterKey];

    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, theme.sky[0]);
    grad.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if(theme.stars){
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for(let i = 0; i < 40; i++){
        const sx = (i * 137) % CANVAS_W;
        const sy = (i * 71) % 220;
        ctx.fillRect(sx, sy, 2, 2);
      }
    } else {
      ctx.beginPath();
      ctx.arc(760, 70, 34, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,247,214,.9)';
      ctx.fill();
    }

    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, CANVAS_H - 140, CANVAS_W, 140);

    if(theme.mountain){
      this._drawMountainWithCave(ctx, theme.mountain);
    }
    if(theme.mosque){
      this._drawMosque(ctx, theme.mosque);
    }

    theme.palms.forEach(p => {
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌴', p.x, p.y);
    });

    theme.obstacles.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(120,95,60,.55)';
      ctx.fill();
    });

    this._drawLandmarkGlows(ctx, now);
    this.players.draw(ctx);
  }

  _drawMountainWithCave(ctx, pos){
    ctx.beginPath();
    ctx.moveTo(pos.x - 140, CANVAS_H - 100);
    ctx.lineTo(pos.x, CANVAS_H - 300);
    ctx.lineTo(pos.x + 140, CANVAS_H - 100);
    ctx.closePath();
    ctx.fillStyle = '#8a7f6e';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(pos.x, CANVAS_H - 108, 26, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#241d16';
    ctx.fill();
  }

  _drawMosque(ctx, pos){
    ctx.fillStyle = '#f4ecd8';
    ctx.fillRect(pos.x - 60, CANVAS_H - 150, 120, 70);
    ctx.beginPath();
    ctx.arc(pos.x, CANVAS_H - 150, 30, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(pos.x + 70, CANVAS_H - 200, 14, 120);
    ctx.beginPath();
    ctx.arc(pos.x + 77, CANVAS_H - 200, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#c9a24a';
    ctx.fill();
  }

  _drawLandmarkGlows(ctx, now){
    const landmarks = CHAPTER_LANDMARKS[this.chapterKey] || [];
    landmarks.forEach(lm => {
      if(this.journey.discoveredLandmarks.has(lm.id)) return;
      const pulse = 5 * Math.sin(now / 250);
      ctx.beginPath();
      ctx.arc(lm.x, lm.y, lm.r * 0.5 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#f6d98a';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.font = '13px "Marcellus", serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#3c2f26';
      ctx.fillText(lm.name, lm.x, lm.y - lm.r * 0.5 - 12);
    });
  }
}
