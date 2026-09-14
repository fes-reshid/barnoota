/* ===================== Camel Controller =====================
   Pure stamina logic for a rider's camel, kept separate from movement
   and rendering. Stamina drains while moving and regenerates while
   resting -- used for the HUD stamina bar and to narratively motivate
   the "tired camel" teamwork moment on the Desert Route. */

export const STAMINA_MAX = 100;
const DRAIN_PER_SEC = 6;
const REGEN_PER_SEC = 10;
export const TIRED_THRESHOLD = 30;

export function createStamina(){
  return STAMINA_MAX;
}

export function updateStamina(current, isMoving, dt){
  if(isMoving){
    return Math.max(0, current - DRAIN_PER_SEC * dt);
  }
  return Math.min(STAMINA_MAX, current + REGEN_PER_SEC * dt);
}

export function isTired(stamina){
  return stamina <= TIRED_THRESHOLD;
}
