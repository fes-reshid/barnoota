/* ===================== Zayd Controller (Blue -- Super Speed) =====================
   Zayd already runs fastest; his ability is a short extra speed burst. */

import { Racer } from './playerController.js';
import { canActivate, startCooldown } from './abilitySystem.js';
import { playAbility } from './audioManager.js';

const BOOST_MULTIPLIER = 1.6;
const BOOST_DURATION_MS = 2200;
const COOLDOWN_MS = 6000;

export class ZaydRacer extends Racer {
  reset(){
    super.reset();
    this.speedBoostUntil = 0;
    this._boosted = false;
  }

  currentSpeed(){
    return this.character.baseSpeed * (this._boosted ? BOOST_MULTIPLIER : 1);
  }

  updateAbility(dt, input, now, level){
    this._boosted = now < this.speedBoostUntil;
  }

  onAbilityPressed(now, level){
    if(!canActivate(this, now)) return;
    this.speedBoostUntil = now + BOOST_DURATION_MS;
    startCooldown(this, now, COOLDOWN_MS);
    this.flashAbility(now, BOOST_DURATION_MS);
    playAbility('zayd');
  }
}
