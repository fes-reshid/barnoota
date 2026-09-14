/* ===================== Obstacle Manager =====================
   Collision between a racer and the level's ground, gaps, platforms
   (static or moving), springs, breakable rocks, climbable walls and
   switch-gates. Kept as pure functions operating on plain data so a
   level is just data (see levelManager.js), not code. */

import { isShielded } from './collectibleManager.js';

export const GROUND_Y = 400;
export const FALL_LIMIT = GROUND_Y + 260;
const SPRING_VELOCITY = -900;
const CLIMB_SPEED = 140;
const WATER_SLOW_FACTOR = 0.55;
const HAZARD_SLOW_FACTOR = 0.35;
const HAZARD_MESSAGE_COOLDOWN_MS = 1500;

function overlapsX(ax1, ax2, bx1, bx2){
  return ax1 < bx2 && ax2 > bx1;
}

function inGap(x, gaps){
  return gaps.some(g => x > g.x1 && x < g.x2);
}

export function resolveCollisions(racer, level, dt, now){
  const halfW = racer.width / 2;
  const rx1 = racer.x - halfW, rx2 = racer.x + halfW;

  racer.grounded = false;
  racer.currentPlatform = null;
  racer._justBumped = false;

  /* Hazards (rolling objects, falling rocks, sliding barriers, spinning
     platforms) -- non-blocking, just a friendly slow-down and a
     "KEEP GOING!" message, never a harsh or shaming one. A Helping
     token's shield makes a racer immune for a few seconds. */
  (level.hazards || []).forEach(h => {
    if(racer.x > h.x1 && racer.x < h.x2 && racer.y >= GROUND_Y - 4 && !isShielded(racer, now)){
      racer.vx *= HAZARD_SLOW_FACTOR;
      if(!racer.lastBumpAt || now - racer.lastBumpAt > HAZARD_MESSAGE_COOLDOWN_MS){
        racer.lastBumpAt = now;
        racer._justBumped = true;
      }
    }
  });

  /* Water: slows a grounded racer while inside the zone (not while
     flying or riding a platform above it). */
  (level.waterZones || []).forEach(w => {
    if(racer.x > w.x1 && racer.x < w.x2 && racer.y >= GROUND_Y - 4){
      racer.vx *= WATER_SLOW_FACTOR;
    }
  });

  /* Platforms (static or moving) -- land on top only, when falling. */
  (level.platforms || []).forEach(p => {
    const px1 = p.x, px2 = p.x + p.width;
    if(overlapsX(rx1, rx2, px1, px2) && racer.vy >= 0 && racer.y <= p.y + 14 && racer.y >= p.y - 2){
      racer.y = p.y;
      racer.vy = 0;
      racer.grounded = true;
      racer.jumpsUsed = 0;
      racer.currentPlatform = p;
    }
  });

  /* Ground, except where a gap has been carved out of it. */
  if(!racer.grounded && !inGap(racer.x, level.groundGaps || [])){
    if(racer.y >= GROUND_Y && racer.vy >= 0){
      racer.y = GROUND_Y;
      racer.vy = 0;
      racer.grounded = true;
      racer.jumpsUsed = 0;
    }
  }

  /* Springs: touching one from above launches the racer upward and
     refreshes their jumps. */
  (level.springs || []).forEach(s => {
    const sx1 = s.x, sx2 = s.x + s.width;
    if(overlapsX(rx1, rx2, sx1, sx2) && racer.y >= s.y - 6 && racer.y <= s.y + 10 && racer.vy >= 0){
      racer.vy = SPRING_VELOCITY;
      racer.grounded = false;
      racer.jumpsUsed = 0;
    }
  });

  /* Breakable rocks: solid until Malik breaks them; block horizontal
     movement like a wall for everyone else. */
  (level.rocks || []).forEach(r => {
    if(r.broken) return;
    if(overlapsX(rx1, rx2, r.x, r.x + r.width) && racer.y > r.y - r.height && racer.y <= r.y + 4){
      if(racer.x < r.x){ racer.x = r.x - halfW; racer.vx = 0; }
      else { racer.x = r.x + r.width + halfW; racer.vx = 0; }
    }
  });

  /* Climbable walls: Malik can climb while holding his ability there;
     everyone else treats it as a solid obstacle to route around. */
  (level.walls || []).forEach(w => {
    const within = racer.x > w.x - 14 && racer.x < w.x + 14 && racer.y > w.y1 - 4 && racer.y < w.y2 + 40;
    if(!within) return;
    if(racer.character.id === 'malik' && racer._climbing){
      racer.y = Math.max(w.y1, racer.y - CLIMB_SPEED * dt);
      racer.vy = 0;
      racer.grounded = racer.y <= w.y1 + 2;
      if(racer.grounded) racer.jumpsUsed = 0;
    } else if(racer.y > w.y1){
      if(racer.x < w.x){ racer.x = w.x - halfW - 14; racer.vx = 0; }
      else { racer.x = w.x + 14 + halfW; racer.vx = 0; }
    }
  });

  /* Switch-gates: solid until their switch has been activated (by
     anyone -- once open, it stays open for the rest of the race, which
     is what lets one player's good deed help the whole group). */
  (level.gates || []).forEach(g => {
    const sw = (level.switches || []).find(s => s.id === g.switchId);
    if(sw && sw.activated) return;
    if(overlapsX(rx1, rx2, g.x, g.x + (g.width || 18)) && racer.y > g.y1 && racer.y <= g.y2 + 4){
      if(racer.x < g.x){ racer.x = g.x - halfW; racer.vx = 0; }
      else { racer.x = g.x + (g.width || 18) + halfW; racer.vx = 0; }
    }
  });

  /* The cooperative teamwork gate, solid until every required ability
     has been used at its own switch. */
  if(level.teamworkGate && !level.teamworkGate.completed){
    const g = level.teamworkGate;
    if(overlapsX(rx1, rx2, g.x, g.x + 18) && racer.y > g.y1 && racer.y <= g.y2 + 4){
      if(racer.x < g.x){ racer.x = g.x - halfW; racer.vx = 0; }
      else { racer.x = g.x + 18 + halfW; racer.vx = 0; }
    }
  }
}
