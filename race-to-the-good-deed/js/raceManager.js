/* ===================== Race Manager =====================
   Live position ranking, distance-to-goal, and the READY / 3-2-1 /
   Bismillah! / Go! starting sequence. Position is just how far along
   the level each racer's x has gotten -- there's no combat, so "1st"
   simply means "furthest along right now." */

import { playCountdownBeep, speakLine } from './audioManager.js';

export const COUNTDOWN_STEPS = [
  { text: 'READY...', voice: null, delay: 700 },
  { text: '3', voice: '3', delay: 700 },
  { text: '2', voice: '2', delay: 700 },
  { text: '1', voice: '1', delay: 700 },
  { text: 'BISMILLAH!', voice: 'Bismillah', delay: 700 },
  { text: 'GO!', voice: 'Go!', delay: 500 }
];

export function runCountdown(onStep, onDone){
  let i = 0;
  function next(){
    if(i >= COUNTDOWN_STEPS.length){ onDone(); return; }
    const step = COUNTDOWN_STEPS[i];
    onStep(step.text, i);
    playCountdownBeep(step.text === 'GO!');
    if(step.voice) speakLine(step.voice);
    i++;
    setTimeout(next, step.delay);
  }
  next();
}

export function computeRankings(racers){
  return racers
    .map((r, i) => ({ racer: r, index: i }))
    .sort((a, b) => b.racer.x - a.racer.x)
    .map((entry, rank) => ({ ...entry, rank: rank + 1 }));
}

export function distanceRemaining(racer, level){
  return Math.max(0, Math.round(level.finishX - racer.x));
}
