/* ===================== Layla Controller (Orange -- Flight) =====================
   Layla can glide for a short, fuel-limited time while airborne, letting
   her cross gaps other racers can't. Flight fuel refills while she's on
   the ground, so it's a repeatable tool rather than a one-time trick. */

import { Racer } from './playerController.js';
import { playAbility } from './audioManager.js';

const MAX_FUEL = 1.8; // seconds of flight
const REGEN_PER_SEC = 0.9;
const FLIGHT_RISE_SPEED = 70;

export class LaylaRacer extends Racer {
  reset(){
    super.reset();
    this.flightFuel = MAX_FUEL;
    this.flying = false;
  }

  updateAbility(dt, input, now, level){
    const canFly = !this.grounded && input.abilityHeld && this.flightFuel > 0;
    this.flying = canFly;
    if(canFly){
      this.flightFuel = Math.max(0, this.flightFuel - dt);
      this._skipGravity = true;
      this.vy = -FLIGHT_RISE_SPEED;
      this.flashAbility(now, 200);
    } else {
      this._skipGravity = false;
      if(this.grounded) this.flightFuel = Math.min(MAX_FUEL, this.flightFuel + REGEN_PER_SEC * dt);
    }
  }

  onAbilityPressed(now, level){
    if(!this.grounded && this.flightFuel > 0) playAbility('layla');
  }
}
