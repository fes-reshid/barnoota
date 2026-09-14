/* ===================== Game Manager =====================
   The orchestrator: game state machine, the race's requestAnimationFrame
   loop, keyboard input for all four fixed control zones, and wiring
   every other module together. Local-only 4-player, one screen, like
   this site's other multiplayer mini-games. */

import { CHARACTERS } from './characterManager.js';
import { CONTROL_SCHEMES } from './playerController.js';
import { FourPlayerManager } from './fourPlayerManager.js';
import { LEVELS, getLevel, resetLevelState, updateMovingPlatforms } from './levelManager.js';
import { GROUND_Y } from './obstacleManager.js';
import { checkCheckpoints } from './checkpointManager.js';
import { checkCollectibles } from './collectibleManager.js';
import { updateTeamworkGate } from './teamworkSystem.js';
import { computeRankings, distanceRemaining, runCountdown } from './raceManager.js';
import { computeResults } from './scoreManager.js';
import { pickRandomGoodDeed, getGoodDeed, questionIdForDeed } from './goodDeedManager.js';
import { getQuestion } from './questionSystem.js';
import { POST_LEVEL_CARDS } from './learningLibrary.js';
import { markLevelComplete, markGoodDeedDiscovered, resetProgress as resetSaveProgress, isLevelUnlocked } from './saveSystem.js';
import { loadSettings, getSettings, updateSetting } from './settingsManager.js';
import * as ui from './uiManager.js';
import { unlockAudio, playUiClick, playCheckpoint, playObstacleBump, playTeamworkComplete, playRaceFinish } from './audioManager.js';
import { drawMiniMap } from './miniMapManager.js';

const CANVAS_W = 960, CANVAS_H = 520;

export class GameManager {
  constructor(){
    this.players = new FourPlayerManager();
    this.keysDown = new Set();
    this.prevKeysDown = new Set();
    this.running = false;
    this.raceActive = false;
    this.awaitingReadyUp = false;
    this.readySet = new Set();
    this.canvas = null;
    this.ctx = null;
    this.miniCanvas = null;
    this.currentLevel = null;
    this.elapsed = 0;
    this.lastTime = 0;
    this.reachedCheckpoints = new Set();
    this.finishQuestionShown = false;
    this.frozenRankings = null;
    this._tick = this._tick.bind(this);
  }

  init(){
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    window.addEventListener('keydown', e => {
      if(this.raceActive && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if(e.code === 'Escape' && this.raceActive && this.running) this.pause();
      this.keysDown.add(e.code);
      if(this.awaitingReadyUp) this._checkReadyUp(e.code);
    });
    window.addEventListener('keyup', e => this.keysDown.delete(e.code));

    loadSettings();

    ui.init({
      click: () => playUiClick(),
      onNavigate: target => { if(target === 'screen-level-select') ui.renderLevelSelect(); if(target === 'screen-settings') ui.applySettingsToUI(getSettings()); },
      playRandom: () => this.startFlow(this._pickRandomUnlockedLevel()),
      playLevel: id => this.startFlow(getLevel(id)),
      goToLevelIntro: () => this.goToLevelIntro(),
      goToStartingLine: () => this.goToStartingLine(),
      goToFinalMessage: () => this.goToFinalMessage(),
      nextLevel: () => this.nextLevel(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      quitToMenu: () => this.quitToMenu(),
      setSetting: (k, v) => { updateSetting(k, v); },
      resetProgress: () => { resetSaveProgress(); ui.renderLevelSelect(); }
    });

    this.canvas = ui.getCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.miniCanvas = ui.getMiniMapCanvas();
    this.miniCtx = this.miniCanvas.getContext('2d');

    ui.applySettingsToUI(getSettings());
    ui.renderLevelSelect();
    ui.showScreen('screen-menu');
  }

  _pickRandomUnlockedLevel(){
    const unlocked = LEVELS.filter(l => isLevelUnlocked(l.id, LEVELS));
    return unlocked[Math.floor(Math.random() * unlocked.length)];
  }

  /* ---------------- character confirm ---------------- */

  startFlow(level){
    this.currentLevel = level;
    this.players.resetAll();
    this.readySet = new Set();
    this.awaitingReadyUp = true;
    ui.renderCharacterConfirm();
    ui.showScreen('screen-character-confirm');
  }

  _checkReadyUp(code){
    const idx = CONTROL_SCHEMES.findIndex(s => s.ability === code);
    if(idx === -1 || this.readySet.has(idx)) return;
    this.readySet.add(idx);
    ui.markPlayerReady(idx);
    if(this.readySet.size < 4){
      ui.setConfirmHint((4 - this.readySet.size) + ' more player(s) to go...');
    } else {
      ui.setConfirmHint('Everyone’s ready! Here we go...');
      this.awaitingReadyUp = false;
      setTimeout(() => this.goToGoodDeedReveal(), 700);
    }
  }

  goToGoodDeedReveal(){
    const deed = getGoodDeed(this.currentLevel.goodDeedId) || pickRandomGoodDeed();
    this.currentGoodDeed = deed;
    markGoodDeedDiscovered(deed.id);
    ui.showGoodDeedReveal(deed.label);
    ui.showScreen('screen-good-deed-reveal');
  }

  goToLevelIntro(){
    ui.showLevelIntro(this.currentLevel, this.currentGoodDeed.label);
    ui.showScreen('screen-level-intro');
  }

  goToStartingLine(){
    ui.renderStartingLine();
    ui.setCountdownText('READY...');
    ui.showScreen('screen-starting-line');
    runCountdown((text) => ui.setCountdownText(text), () => this.startRace());
  }

  /* ---------------- race ---------------- */

  startRace(){
    resetLevelState(this.currentLevel);
    this.players.resetAll();
    this.reachedCheckpoints = new Set();
    this.elapsed = 0;
    this.finishQuestionShown = false;
    this.frozenRankings = null;

    ui.showScreen('screen-race');
    ui.showPauseButton();

    this.lastTime = performance.now();
    this.running = true;
    this.raceActive = true;
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

  quitToMenu(){
    this.running = false;
    this.raceActive = false;
    ui.hidePause();
    ui.showScreen('screen-menu');
  }

  _buildInput(scheme){
    return {
      right: this.keysDown.has(scheme.right),
      jumpPressed: this.keysDown.has(scheme.jump) && !this.prevKeysDown.has(scheme.jump),
      down: this.keysDown.has(scheme.down),
      abilityHeld: this.keysDown.has(scheme.ability),
      abilityPressed: this.keysDown.has(scheme.ability) && !this.prevKeysDown.has(scheme.ability)
    };
  }

  _tick(now){
    if(!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.elapsed += dt;

    const level = this.currentLevel;
    updateMovingPlatforms(level, dt, this.elapsed);

    const inputs = CONTROL_SCHEMES.map(s => this._buildInput(s));
    this.players.update(dt, inputs, now, level);
    this.prevKeysDown = new Set(this.keysDown);

    this.players.racers.forEach(racer => {
      const cp = checkCheckpoints(racer, level, this.reachedCheckpoints);
      if(cp){ playCheckpoint(); ui.showToast('CHECKPOINT!', racer.character.color); }

      checkCollectibles(racer, level, now);

      if(racer._justBumped){ playObstacleBump(); ui.showToast('KEEP GOING!', '#fff'); }

      if(!racer.finished && racer.x >= level.finishX){
        racer.finished = true;
        racer.finishTime = this.elapsed;
      }
    });

    if(level.teamworkGate && !level.teamworkGate.completed){
      const result = updateTeamworkGate(level, this.players.racers, now);
      if(result.newlyDoneRacers.some(Boolean)){
        ui.showToast('TEAMWORK BONUS!', '#2ec27e');
        result.newlyDoneRacers.forEach(r => { if(r) r.helpedCount += 1; });
      }
      if(result.justCompleted){
        playTeamworkComplete();
        ui.showToast('TEAMWORK COMPLETE!', '#2ec27e');
        this.players.racers.forEach(r => { r.helpedCount += 1; r.tokens.teamwork += 1; });
      }
    }

    if(!this.finishQuestionShown){
      const winner = this.players.racers.find(r => r.finished);
      if(winner){
        this.finishQuestionShown = true;
        this.frozenRankings = computeRankings(this.players.racers);
        this.running = false;
        playRaceFinish();
        this._openFinishQuestion(winner);
        return;
      }
    }

    this._draw(now);
    this._updateHud(now);

    requestAnimationFrame(this._tick);
  }

  _openFinishQuestion(winner){
    const qId = questionIdForDeed(this.currentGoodDeed.id);
    const question = getQuestion(qId);
    ui.openFinishQuestion(this.currentGoodDeed.label, question, correct => {
      if(correct) winner.correctChoices += 1;
    }, () => {
      ui.hideFinishQuestion();
      this._finishRace();
    });
  }

  _finishRace(){
    const winner = this.players.racers.find(r => r.finished);
    markLevelComplete(this.currentLevel.id, winner ? winner.finishTime : this.elapsed);
    const results = computeResults(this.players.racers, this.frozenRankings);
    ui.showResults(results, this.currentGoodDeed.label);
    ui.showScreen('screen-results');
  }

  goToFinalMessage(){
    const keys = Object.keys(POST_LEVEL_CARDS);
    const card = POST_LEVEL_CARDS[keys[Math.floor(Math.random() * keys.length)]];
    ui.showFinalMessage(card);
    ui.showScreen('screen-final-message');
  }

  nextLevel(){
    const idx = LEVELS.findIndex(l => l.id === this.currentLevel.id);
    if(idx >= 0 && idx < LEVELS.length - 1){
      this.currentLevel = LEVELS[idx + 1];
      this.goToGoodDeedReveal();
    } else {
      ui.showScreen('screen-menu');
    }
  }

  /* ---------------- HUD + rendering ---------------- */

  _updateHud(now){
    const rankings = computeRankings(this.players.racers);
    const players = this.players.racers.map(r => {
      const cooldownPct = r.abilityCooldownUntil ? Math.min(1, Math.max(0, (r.abilityCooldownUntil - now) / 1000)) : 0;
      return {
        name: r.character.name, icon: r.character.accent, color: r.character.color, colorDark: r.character.colorDark,
        ability: r.character.abilityName, abilityReady: now >= (r.abilityCooldownUntil || 0), cooldownPct
      };
    });
    const ranks = rankings.map(entry => ({ rank: entry.rank, color: entry.racer.character.color }))
      .sort((a, b) => a.rank - b.rank);

    const leader = rankings[0].racer;
    ui.updateRaceHud({
      players,
      ranks,
      distance: distanceRemaining(leader, this.currentLevel)
    });
  }

  _draw(now){
    const ctx = this.ctx;
    const level = this.currentLevel;
    const theme = level.theme;

    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, theme.sky[0]);
    grad.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const leader = this.players.leaderX();
    const cameraX = Math.max(0, Math.min(level.length - CANVAS_W, leader - CANVAS_W * 0.35));

    ctx.save();
    ctx.translate(-cameraX, 0);

    ctx.fillStyle = theme.ground;
    ctx.fillRect(cameraX - 40, GROUND_Y, CANVAS_W + 80, CANVAS_H - GROUND_Y);
    (level.groundGaps || []).forEach(g => {
      ctx.clearRect(g.x1, GROUND_Y, g.x2 - g.x1, CANVAS_H - GROUND_Y);
    });

    (level.waterZones || []).forEach(w => {
      ctx.fillStyle = 'rgba(58,166,255,0.35)';
      ctx.fillRect(w.x1, GROUND_Y + 6, w.x2 - w.x1, 10);
    });

    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    (level.decor || []).forEach((emoji, i) => {
      ctx.fillText(emoji, 140 + i * 480 + (i % 2) * 60, GROUND_Y - 60 - (i % 3) * 20);
    });

    ctx.fillStyle = theme.accent;
    (level.platforms || []).forEach(p => {
      ctx.fillRect(p.x, p.y, p.width, 14);
    });

    ctx.fillStyle = '#8a7f6e';
    (level.rocks || []).forEach(r => {
      if(r.broken) return;
      ctx.fillRect(r.x, r.y - r.height, r.width, r.height);
    });

    ctx.fillStyle = '#c9a24a';
    (level.gates || []).forEach(g => {
      const sw = (level.switches || []).find(s => s.id === g.switchId);
      if(sw && sw.activated) return;
      ctx.fillRect(g.x, g.y1, g.width || 18, g.y2 - g.y1);
    });

    (level.switches || []).forEach(s => {
      ctx.font = '22px sans-serif';
      ctx.fillText(s.activated ? '🟢' : '🔴', s.x, s.y - 10);
    });

    ctx.fillStyle = '#ff5d8f';
    (level.springs || []).forEach(s => {
      ctx.fillRect(s.x, s.y - 12, s.width, 12);
    });

    if(level.teamworkGate && !level.teamworkGate.completed){
      const g = level.teamworkGate;
      ctx.fillStyle = '#6b5a3f';
      ctx.fillRect(g.x, g.y1, 18, g.y2 - g.y1);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#3c2f26';
      ctx.fillText('TEAMWORK GATE', g.x, g.y1 - 10);
    }

    const tokenEmoji = { kindness: '💛', helping: '🤝', patience: '⏳', teamwork: '🤝' };
    ctx.font = '20px sans-serif';
    (level.collectibles || []).forEach(c => {
      if(c.taken) return;
      ctx.fillText(tokenEmoji[c.kind] || '⭐', c.x, c.y);
    });

    ctx.font = '20px sans-serif';
    (level.hazards || []).forEach(h => ctx.fillText('🪨', (h.x1 + h.x2) / 2, GROUND_Y - 8));

    ctx.font = 'bold 16px "Baloo 2", sans-serif';
    ctx.fillStyle = '#2ec27e';
    ctx.fillText('⭐ GOOD DEED STATION', level.finishX, GROUND_Y - 70);
    ctx.font = '34px sans-serif';
    ctx.fillText('🌟', level.finishX, GROUND_Y - 20);

    ctx.restore();

    // Racers compute their own screen position from cameraX, so they're
    // drawn after restoring the transform above (not inside it) --
    // otherwise the camera offset would be applied to them twice.
    this.players.draw(ctx, cameraX, now);

    drawMiniMap(this.miniCtx, this.miniCanvas, this.players.racers, level);
  }
}
