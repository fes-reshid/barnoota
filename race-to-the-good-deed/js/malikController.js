/* ===================== Malik Controller (Red -- Power) =====================
   Malik can smash through breakable rocks just ahead of him, and climb
   marked walls while holding his ability there (obstacleManager reads
   `_climbing` to let him ascend instead of being blocked). */

import { Racer } from './playerController.js';
import { canActivate, startCooldown } from './abilitySystem.js';
import { playAbility } from './audioManager.js';

const BREAK_RANGE = 70;
const COOLDOWN_MS = 500;

export class MalikRacer extends Racer {
  updateAbility(dt, input, now, level){
    this._climbing = !!input.abilityHeld;
  }

  onAbilityPressed(now, level){
    if(!canActivate(this, now)) return;
    const rock = (level.rocks || []).find(r => !r.broken && r.x > this.x - 10 && r.x < this.x + BREAK_RANGE);
    if(rock){
      rock.broken = true;
      startCooldown(this, now, COOLDOWN_MS);
      this.flashAbility(now, 400);
      playAbility('malik');
    }
  }
}
