/* ===================== Four Player Manager =====================
   Owns the four racers for a race. Each of the four physical players
   controls a fixed character -- Player 1 is always Zayd, Player 2 is
   always Layla, and so on -- matching how the game is specced (this
   also guarantees a race never has two players with the same ability,
   which is what makes the shortcut-per-character balance work). */

import { CHARACTERS } from './characterManager.js';
import { ZaydRacer } from './zaydController.js';
import { LaylaRacer } from './laylaController.js';
import { MalikRacer } from './malikController.js';
import { AmiraRacer } from './amiraController.js';

const CONTROLLER_CLASSES = [ZaydRacer, LaylaRacer, MalikRacer, AmiraRacer];

export class FourPlayerManager {
  constructor(){
    this.racers = CHARACTERS.map((c, i) => new CONTROLLER_CLASSES[i](i, c));
  }

  resetAll(){
    this.racers.forEach(r => r.reset());
  }

  update(dt, inputs, now, level){
    this.racers.forEach((r, i) => r.update(dt, inputs[i], now, level));
  }

  draw(ctx, cameraX, now){
    this.racers.forEach(r => r.draw(ctx, cameraX, now));
  }

  leaderX(){
    return Math.max(...this.racers.map(r => r.x));
  }

  averageX(){
    return this.racers.reduce((sum, r) => sum + r.x, 0) / this.racers.length;
  }

  allFinished(){
    return this.racers.every(r => r.finished);
  }
}
