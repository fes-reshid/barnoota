/* ===================== Collectible Manager =====================
   Four token types, each a game bonus only -- picking one up is never
   described as literally performing worship, it just helps in the
   race:
     KINDNESS  -> an extra jump charge right away
     HELPING   -> a few seconds of protection from bump obstacles
     PATIENCE  -> instantly recharges your character's ability
     TEAMWORK  -> a short speed boost, for everyone's character */

import { playCollect } from './audioManager.js';

const SHIELD_DURATION_MS = 3000;
const BOOST_DURATION_MS = 2000;
const BOOST_MULTIPLIER = 1.35;

export function checkCollectibles(racer, level, now){
  for(const item of level.collectibles || []){
    if(item.taken) continue;
    if(Math.abs(item.x - racer.x) < 26 && Math.abs(item.y - racer.y) < 40){
      item.taken = true;
      racer.tokens[item.kind] = (racer.tokens[item.kind] || 0) + 1;
      applyEffect(racer, item.kind, now);
      playCollect();
      return item;
    }
  }
  return null;
}

function applyEffect(racer, kind, now){
  if(kind === 'kindness'){
    racer.jumpsUsed = 0;
  } else if(kind === 'helping'){
    racer.shieldUntil = now + SHIELD_DURATION_MS;
  } else if(kind === 'patience'){
    racer.abilityCooldownUntil = 0;
  } else if(kind === 'teamwork'){
    racer.tokenBoostUntil = now + BOOST_DURATION_MS;
  }
}

export function tokenSpeedMultiplier(racer, now){
  return racer.tokenBoostUntil && now < racer.tokenBoostUntil ? BOOST_MULTIPLIER : 1;
}

export function isShielded(racer, now){
  return !!(racer.shieldUntil && now < racer.shieldUntil);
}
