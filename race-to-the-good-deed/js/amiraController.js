/* ===================== Amira Controller (Pink -- Hammer Switch) =====================
   Amira can activate a nearby switch with her hammer. Once a switch is
   activated its gate stays open for the rest of the race -- so if she
   opens a shortcut, it helps whoever comes through after her too. */

import { Racer } from './playerController.js';
import { canActivate, startCooldown } from './abilitySystem.js';
import { playAbility } from './audioManager.js';

const ACTIVATE_RANGE = 60;
const COOLDOWN_MS = 500;

export class AmiraRacer extends Racer {
  onAbilityPressed(now, level){
    if(!canActivate(this, now)) return;
    const sw = (level.switches || []).find(s => !s.activated && Math.abs(s.x - this.x) < ACTIVATE_RANGE);
    if(sw){
      sw.activated = true;
      startCooldown(this, now, COOLDOWN_MS);
      this.flashAbility(now, 400);
      playAbility('amira');
    }
  }
}
