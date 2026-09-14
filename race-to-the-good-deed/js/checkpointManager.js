/* ===================== Checkpoint Manager =====================
   Detects when a racer reaches a checkpoint and updates their respawn
   point, reporting it once per checkpoint per racer so the UI can flash
   a "CHECKPOINT!" message in that player's color. */

import { GROUND_Y } from './obstacleManager.js';

export function checkCheckpoints(racer, level, reachedSet){
  for(const cp of level.checkpoints || []){
    const key = racer.index + ':' + cp.id;
    if(racer.x >= cp.x && !reachedSet.has(key)){
      reachedSet.add(key);
      racer.lastCheckpointX = cp.x + 10;
      racer.lastCheckpointY = GROUND_Y;
      return cp;
    }
  }
  return null;
}
