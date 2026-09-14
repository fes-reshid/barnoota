/* ===================== Protection Timer =====================
   Turns a player's raw `protectedUntil` timestamp into the whole-second
   countdown the HUD displays ("Protection: 30s" -> ... -> "Protection: 1s"),
   and fires a tick callback exactly once per second so the game manager
   can play a countdown sound without re-triggering every frame. */

import { playCountdownTick, playProtectionEnd } from './audioManager.js';

const lastAnnouncedSecond = new WeakMap();

export const PROTECTION_DURATION_MS = 30000;

/* Call once per frame for every player. Returns the whole seconds left
   (0 if not currently protected) and plays tick/end sounds as needed. */
export function updateProtectionDisplay(player, now){
  if(!player.isProtected(now)){
    if(lastAnnouncedSecond.has(player)){
      lastAnnouncedSecond.delete(player);
      playProtectionEnd();
    }
    return 0;
  }
  const remainingMs = player.protectedUntil - now;
  const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
  if(lastAnnouncedSecond.get(player) !== remainingSec){
    lastAnnouncedSecond.set(player, remainingSec);
    playCountdownTick(remainingSec);
  }
  return remainingSec;
}
