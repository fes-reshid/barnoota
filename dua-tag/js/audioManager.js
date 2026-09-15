/* ===================== Audio Manager =====================
   Every sound here is a synthesized beep from the Web Audio API — there
   are no audio files, and in particular no Qur'an recitation or other
   sacred audio is ever used as a game sound effect. A mute toggle turns
   everything off instantly. */

let muted = false;
let ctx = null;

function getCtx(){
  if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Browsers create (or suspend) the context until a user gesture resumes it --
  // without this, oscillators run silently and no error is ever thrown.
  if(ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* Called once, as early as possible after any user click/key/tap, so the
   very first sound of the game isn't silently swallowed by the browser's
   autoplay-suspension policy. Safe to call repeatedly. */
export function unlockAudio(){
  getCtx();
}

function beep(freq, dur, type, gain){
  if(muted) return;
  try{
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(gain || 0.1, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur + 0.02);
  }catch(e){}
}

export function setMuted(value){
  muted = value;
  if(value) stopSpeech();
}
export function isMuted(){ return muted; }

/* Reads a du'a aloud using the browser's built-in text-to-speech (Web
   Speech API) -- never the Arabic itself, since a synthesized voice
   mispronouncing a Qur'anic ayah or hadith wording would be disrespectful.
   It speaks the transliteration and English meaning instead, the same
   words already shown on screen, so a tagged player gets pronunciation
   help and the meaning read to them while they're frozen. */
export function speakDua(dua){
  stopSpeech();
  if(muted || !('speechSynthesis' in window)) return;
  try{
    [dua.transliteration, dua.english].forEach(text => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.85;
      utter.pitch = 1.05;
      window.speechSynthesis.speak(utter);
    });
  }catch(e){}
}

export function stopSpeech(){
  try{ if('speechSynthesis' in window) window.speechSynthesis.cancel(); }catch(e){}
}

export function playFootstep(){ beep(180, 0.03, 'square', 0.02); }
export function playTag(){ beep(220, 0.12, 'sawtooth', 0.14); setTimeout(() => beep(140, 0.16, 'sawtooth', 0.12), 100); }
export function playUiClick(){ beep(500, 0.05, 'sine', 0.08); }
export function playRecited(){ beep(660, 0.1, 'sine', 0.1); setTimeout(() => beep(880, 0.14, 'sine', 0.1), 90); }
export function playCountdownTick(secondsLeft){
  beep(secondsLeft <= 5 ? 720 : 500, 0.06, 'sine', 0.08);
}
export function playProtectionEnd(){ beep(300, 0.15, 'triangle', 0.09); }
export function playRoundEnd(){ [523,659,784,1047].forEach((f,i) => setTimeout(() => beep(f, 0.2, 'sine', 0.1), i * 140)); }

/* A small, genuinely-generated ambient pad (two soft detuned oscillators)
   used for the optional background "music" toggle -- there are no audio
   files in this game, so this keeps that control honest rather than a
   dead switch with nothing behind it. */
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
    master.gain.setValueAtTime(0.035, c.currentTime);
    master.connect(c.destination);
    const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = 196; // G3
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 246.94; // B3
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
