/* ===================== Ability System =====================
   Small shared helpers for cooldown-gated abilities. Each character
   controller decides what its own ability actually does; this just
   answers "am I allowed to activate again yet?" so that logic isn't
   copy-pasted four times. */

export function canActivate(racer, now){
  return now >= (racer.abilityCooldownUntil || 0);
}

export function startCooldown(racer, now, cooldownMs){
  racer.abilityCooldownUntil = now + cooldownMs;
}

export function cooldownRemainingPct(racer, now, cooldownMs){
  const remaining = (racer.abilityCooldownUntil || 0) - now;
  if(remaining <= 0) return 0;
  return Math.min(1, remaining / cooldownMs);
}
