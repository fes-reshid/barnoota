/* ===================== Game Manager =====================
   The orchestrator: owns the players, the current mode/state, the
   requestAnimationFrame loop, keyboard + gamepad input, and wires the
   pure logic modules (tagSystem, duaSystem, protectionTimer) to the
   canvas renderer and the DOM-facing ui module. Kept local-only (no
   networking) for now, but every piece it touches -- Player.connected,
   the pure functions in tagSystem.js, the standalone DuaSystem class --
   was written so a networked/server-authoritative mode could be layered
   on top later without a rewrite. */

import { Player, CONTROL_SCHEMES, PLAYER_COLORS } from './playerController.js';
import { MAP_WIDTH, MAP_HEIGHT, drawMap } from './mapEnvironment.js';
import { checkForTag, performTag, grantProtectionAndResume } from './tagSystem.js';
import { PROTECTION_DURATION_MS, updateProtectionDisplay } from './protectionTimer.js';
import { DuaSystem } from './duaSystem.js';
import * as ui from './ui.js';
import { setMuted, isMuted, setMusicOn, isMusicOn, playUiClick, playTag, playRecited, playRoundEnd } from './audioManager.js';

const CLASSIC_PROTECTION_MS = 3000;
const ROUND_DURATION_MS = { classic: 120000, dua: 150000, practice: null };
const MODE_LABELS = { classic: 'Classic Tag', dua: 'Du’a Tag', practice: 'Practice Mode' };

export class GameManager {
  constructor(){
    this.mode = 'dua';
    this.setupNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
    this.players = [];
    this.duaSystem = new DuaSystem();
    this.frozenIndex = null;
    this.roundEndAt = 0;
    this.running = false;
    this.keysDown = new Set();
    this.canvas = null;
    this.ctx = null;
    this.lastTime = 0;
    this.libraryFilter = 'all';
    this.textScale = 1;
    this.arabicScale = 1;

    this._tick = this._tick.bind(this);
  }

  init(){
    window.addEventListener('keydown', e => {
      if(this.running && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if(e.code === 'Escape' && this.running) this.pause();
      this.keysDown.add(e.code);
    });
    window.addEventListener('keyup', e => this.keysDown.delete(e.code));

    ui.init({
      playClickSound: () => playUiClick(),
      goToSetup: () => this.goToSetup(),
      selectMode: mode => this.selectMode(mode),
      startGame: () => this.startGame(),
      filterLibrary: filter => { this.libraryFilter = filter; ui.renderLibrary(filter); ui.markLibraryFilter(filter); },
      recited: () => this.playerRecited(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      quitToMenu: () => this.quitToMenu(),
      setMuted: value => { setMuted(value); ui.setToggleState(isMuted(), isMusicOn()); },
      setMusicOn: value => { setMusicOn(value); ui.setToggleState(isMuted(), isMusicOn()); },
      setTextScale: value => { this.textScale = value; ui.applyTextScale(this.textScale, this.arabicScale); },
      setArabicScale: value => { this.arabicScale = value; ui.applyTextScale(this.textScale, this.arabicScale); }
    });

    this.canvas = ui.getCanvas();
    this.ctx = this.canvas.getContext('2d');

    ui.setToggleState(isMuted(), isMusicOn());
    ui.applyTextScale(this.textScale, this.arabicScale);
    ui.markModeButton(this.mode);
    ui.showScreen('screen-menu');
  }

  goToSetup(){
    ui.renderSetupPlayers(this.setupNames);
    ui.markModeButton(this.mode);
    ui.showScreen('screen-setup');
  }

  selectMode(mode){
    this.mode = mode;
    ui.markModeButton(mode);
  }

  startGame(){
    const names = ui.getSetupNames ? ui.getSetupNames() : null;
    if(names) this.setupNames = names.map((n, i) => n || ('Player ' + (i + 1)));

    this.players = CONTROL_SCHEMES.map((scheme, i) => new Player(i, this.setupNames[i], PLAYER_COLORS[i]));
    this.players[0].isIt = true;
    this.frozenIndex = null;
    this.duaSystem.close();

    const duration = ROUND_DURATION_MS[this.mode];
    this.roundEndAt = duration ? performance.now() + duration : null;

    ui.hideDuaModal();
    ui.hidePause();
    ui.showScreen('screen-game');

    this.lastTime = performance.now();
    this.running = true;
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
    ui.hidePause();
    ui.hideDuaModal();
    ui.showScreen('screen-menu');
  }

  playerRecited(){
    if(this.frozenIndex === null) return;
    const player = this.players[this.frozenIndex];
    grantProtectionAndResume(player, performance.now(), PROTECTION_DURATION_MS);
    playRecited();
    this.frozenIndex = null;
    this.duaSystem.close();
    ui.hideDuaModal();
  }

  _gamepadVec(index){
    const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
    const pad = pads[index];
    if(!pad) return null;
    let x = pad.axes[0] || 0, y = pad.axes[1] || 0;
    if(pad.buttons[14] && pad.buttons[14].pressed) x -= 1;
    if(pad.buttons[15] && pad.buttons[15].pressed) x += 1;
    if(pad.buttons[12] && pad.buttons[12].pressed) y -= 1;
    if(pad.buttons[13] && pad.buttons[13].pressed) y += 1;
    if(Math.abs(x) < 0.2) x = 0;
    if(Math.abs(y) < 0.2) y = 0;
    return (x || y) ? { x, y } : null;
  }

  _tick(now){
    if(!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.players.forEach((p, i) => p.update(dt, this.keysDown, this._gamepadVec(i)));

    if(this.frozenIndex === null){
      const tagged = checkForTag(this.players, now);
      if(tagged){
        const itPlayer = this.players.find(p => p.isIt);
        performTag(itPlayer, tagged);
        playTag();
        if(this.mode === 'classic'){
          grantProtectionAndResume(tagged, now, CLASSIC_PROTECTION_MS);
        } else {
          this.frozenIndex = tagged.index;
          const dua = this.duaSystem.openForTag();
          ui.showDuaModal(dua, tagged.name);
        }
      }
    }

    if(this.roundEndAt !== null && now >= this.roundEndAt){
      this._endRound();
      return;
    }

    this.ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    drawMap(this.ctx);
    this.players.forEach(p => p.draw(this.ctx, now));

    const itPlayer = this.players.find(p => p.isIt);
    const hudPlayers = this.players.map(p => ({
      name: p.name, color: p.color, isIt: p.isIt, frozen: p.frozen,
      protectedSec: updateProtectionDisplay(p, now)
    }));
    ui.updateHud({
      itName: itPlayer ? itPlayer.name : null,
      timerLabel: this.roundEndAt ? this._formatTime(this.roundEndAt - now) : '∞',
      modeLabel: MODE_LABELS[this.mode],
      players: hudPlayers
    });

    requestAnimationFrame(this._tick);
  }

  _formatTime(ms){
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  _endRound(){
    this.running = false;
    playRoundEnd();
    ui.hideDuaModal();
    const stats = this.players.map(p => ({ name: p.name, color: p.color, timesIt: p.timesIt, duasRecited: p.duasRecited }));
    ui.showRoundEnd(this.mode, stats);
    ui.showScreen('screen-roundend');
  }
}
