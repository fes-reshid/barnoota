/* ===================== Audio Manager =====================
   Every sound in this game is synthesized with the Web Audio API --
   there are no audio files, and Qur'an recitation is never used as a
   casual arcade sound effect, loop, or victory sound. Three independent
   volume sliders (music/SFX/voice) plus a master mute, all settable
   from the Settings screen. */

let ctx = null;
let sfxVolume = 0.8;
let musicVolume = 0.5;
let voiceVolume = 0.8;
let muted = false;

function getCtx(){
  if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if(ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio(){ getCtx(); }

export function setSfxVolume(v){ sfxVolume = v; }
export function setMusicVolume(v){ musicVolume = v; if(musicNodes) musicNodes.master.gain.setValueAtTime(0.05 * musicVolume, getCtx().currentTime); }
export function setVoiceVolume(v){ voiceVolume = v; }
export function setMuted(v){ muted = v; }
export function isMuted(){ return muted; }
export function getVolumes(){ return { sfx: sfxVolume, music: musicVolume, voice: voiceVolume }; }

function tone(freq, dur, type, gain, delay){
  if(muted) return;
  try{
    const c = getCtx();
    const start = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, start);
    const peak = (gain || 0.1) * sfxVolume;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(start); o.stop(start + dur + 0.03);
  }catch(e){}
}

export function playJump(){ tone(480, 0.09, 'square', 0.08); }
export function playDoubleJump(){ tone(600, 0.09, 'square', 0.08); }
export function playCollect(){ tone(880, 0.08, 'sine', 0.09); tone(1100, 0.1, 'sine', 0.08, 0.06); }
export function playCheckpoint(){ [660, 880, 1046].forEach((f, i) => tone(f, 0.14, 'sine', 0.09, i * 0.08)); }
export function playUiClick(){ tone(520, 0.05, 'sine', 0.07); }
export function playCorrect(){ tone(660, 0.1, 'sine', 0.1); tone(880, 0.14, 'sine', 0.1, 0.09); }
export function playWrong(){ tone(280, 0.15, 'sawtooth', 0.07); }
export function playObstacleBump(){ tone(200, 0.1, 'triangle', 0.06); }
export function playTeamworkComplete(){ [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'sine', 0.1, i * 0.12)); }
export function playRaceFinish(){ [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.1, i * 0.13)); }
export function playCountdownBeep(isGo){ tone(isGo ? 900 : 500, isGo ? 0.3 : 0.12, 'sine', 0.12); }

const ABILITY_TONES = { zayd: 1200, layla: 700, malik: 180, amira: 950 };
export function playAbility(characterId){
  const f = ABILITY_TONES[characterId] || 700;
  tone(f, 0.15, characterId === 'malik' ? 'square' : 'sine', 0.1);
  tone(f * 1.3, 0.12, 'sine', 0.07, 0.06);
}

/* Optional ambient music pad -- synthesized, off by default. */
let musicNodes = null;
let musicOn = false;
export function isMusicOn(){ return musicOn; }
export function setMusicOn(value){
  musicOn = value;
  if(value) startMusic(); else stopMusic();
}
function startMusic(){
  if(musicNodes || muted) return;
  try{
    const c = getCtx();
    const master = c.createGain();
    master.gain.setValueAtTime(0.05 * musicVolume, c.currentTime);
    master.connect(c.destination);
    const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = 262;
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 330;
    o1.connect(master); o2.connect(master);
    o1.start(); o2.start();
    musicNodes = { master, o1, o2 };
  }catch(e){}
}
function stopMusic(){
  if(!musicNodes) return;
  try{ musicNodes.o1.stop(); musicNodes.o2.stop(); }catch(e){}
  musicNodes = null;
}

/* "Voice" line -- a short spoken cue using the browser's own
   text-to-speech, clearly a computer voice, used only for the
   BISMILLAH! / GO! start line if the player wants it (Voice Volume
   in Settings controls this independently of SFX/music). */
export function speakLine(text){
  if(muted || voiceVolume <= 0 || !('speechSynthesis' in window)) return;
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.volume = voiceVolume;
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  }catch(e){}
}
