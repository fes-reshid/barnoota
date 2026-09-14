/* ===================== Four Player Manager =====================
   Owns the four Rider instances for the whole game: their names,
   colors, and shared per-frame update/draw, independent of whichever
   chapter map they're currently placed on. */

import { Rider, CLOTHING_COLORS, CAMEL_COLORS } from './playerController.js';

export class FourPlayerManager {
  constructor(){
    this.riders = [0, 1, 2, 3].map(i => new Rider(i, 'Player ' + (i + 1), CLOTHING_COLORS[i], CAMEL_COLORS[i]));
  }

  applySetup(setups){
    setups.forEach((s, i) => {
      const r = this.riders[i];
      r.name = (s.name || '').trim() || ('Player ' + (i + 1));
      r.clothingColor = s.clothingColor || CLOTHING_COLORS[i];
      r.camelColor = s.camelColor || CAMEL_COLORS[i];
    });
  }

  placeAllAt(cx, cy){
    this.riders.forEach(r => r.placeAt(cx, cy));
  }

  update(dt, keysDown, bounds, obstacles){
    this.riders.forEach(r => r.update(dt, keysDown, bounds, obstacles));
  }

  draw(ctx){
    this.riders.forEach(r => r.draw(ctx));
  }

  averageStamina(){
    return this.riders.reduce((sum, r) => sum + r.stamina, 0) / this.riders.length;
  }

  anyTired(){
    return this.riders.some(r => r.stamina <= 30);
  }

  tiredestRider(){
    return this.riders.reduce((min, r) => (r.stamina < min.stamina ? r : min), this.riders[0]);
  }
}
