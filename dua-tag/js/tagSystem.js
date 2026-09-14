/* ===================== Tag System =====================
   Pure collision-detection + role-transfer logic, kept separate from
   rendering and input so it's easy to reason about (and, later, to move
   onto a server-authoritative host for real networked play without
   touching anything else).

   Rule this game uses (chosen to satisfy every constraint at once,
   including "can't be tagged" and "no repeat-tag exploits"): tagging
   transfers the It role to the tagged player immediately, but that new
   It cannot tag anyone for the length of their du'a protection window.
   Since only the current It can ever tag someone, that one lock alone
   makes every other player briefly untouchable too -- a natural "catch
   your breath" beat for the whole group after every tag. */

export function findCurrentIt(players){
  return players.find(p => p.isIt) || null;
}

/* Returns the player who should be tagged this frame, or null. */
export function checkForTag(players, now){
  const itPlayer = findCurrentIt(players);
  if(!itPlayer || itPlayer.frozen) return null;
  if(now < itPlayer.tagLockedUntil) return null;

  for(const p of players){
    if(p === itPlayer) continue;
    if(p.frozen) continue;
    if(p.isProtected(now)) continue;
    const dist = Math.hypot(p.x - itPlayer.x, p.y - itPlayer.y);
    if(dist < p.radius + itPlayer.radius) return p;
  }
  return null;
}

/* Freezes the tagged player and flips the It flag right away (the du'a +
   protection window that follows is what actually keeps them safe and
   keeps the new It from tagging anyone, so the order here is safe). */
export function performTag(itPlayer, taggedPlayer){
  itPlayer.isIt = false;
  taggedPlayer.isIt = true;
  taggedPlayer.timesIt += 1;
  taggedPlayer.frozen = true;
}

/* Called once the tagged player presses "I Recited It". */
export function grantProtectionAndResume(player, now, durationMs){
  player.frozen = false;
  player.duasRecited += 1;
  player.protectedUntil = now + durationMs;
  player.tagLockedUntil = now + durationMs;
}
