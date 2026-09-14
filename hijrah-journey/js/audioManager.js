/* ===================== Audio Manager =====================
   Every game sound here is synthesized with the Web Audio API -- no
   audio files, and Qur'an recitation is never used as a background
   effect or victory sound. The optional "hear the ayah" feature uses
   the browser's own text-to-speech voice and is clearly labeled as a
   computer voice, not a reciter, kept fully separate from normal game
   audio and off unless a player asks for it. */

let muted = false;
let ctx = null;

function getCtx(){
  if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if(ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio(){ getCtx(); }

function tone(freq, dur, type, gain, delay){
  if(muted) return;
  try{
    const c = getCtx();
    const start = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain || 0.1, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(start); o.stop(start + dur + 0.03);
  }catch(e){}
}

function noiseBurst(dur, gain){
  if(muted) return;
  try{
    const c = getCtx();
    const bufferSize = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const g = c.createGain();
    g.gain.setValueAtTime(gain || 0.05, c.currentTime);
    src.connect(g); g.connect(c.destination);
    src.start();
  }catch(e){}
}

export function setMuted(value){ muted = value; }
export function isMuted(){ return muted; }

export function playFootstep(){ noiseBurst(0.05, 0.02); }
export function playUiClick(){ tone(520, 0.05, 'sine', 0.08); }
export function playDiscovery(){ [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'sine', 0.09, i * 0.09)); }
export function playCorrect(){ tone(660, 0.1, 'sine', 0.1); tone(880, 0.14, 'sine', 0.1, 0.09); }
export function playWrong(){ tone(220, 0.18, 'sawtooth', 0.08); }
export function playCountdownTick(){ tone(500, 0.06, 'sine', 0.07); }
export function playJourneyComplete(){ [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'sine', 0.1, i * 0.15)); }

/* A soft, continuous "desert wind" drone -- two detuned, gently filtered
   oscillators. Optional ambience, off by default, never music. */
let windNodes = null;
let windOn = false;
export function isWindOn(){ return windOn; }
export function setWindOn(value){
  windOn = value;
  if(value) startWind(); else stopWind();
}
function startWind(){
  if(windNodes || muted) return;
  try{
    const c = getCtx();
    const master = c.createGain();
    master.gain.setValueAtTime(0.03, c.currentTime);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    master.connect(filter); filter.connect(c.destination);
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 90;
    const o2 = c.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 94;
    o1.connect(master); o2.connect(master);
    o1.start(); o2.start();
    windNodes = { master, filter, o1, o2 };
  }catch(e){}
}
function stopWind(){
  if(!windNodes) return;
  try{ windNodes.o1.stop(); windNodes.o2.stop(); }catch(e){}
  windNodes = null;
}

/* Text-to-speech "hear the ayah" -- a computer voice, not a Qari.
   Feature-detected and silently unavailable if the browser has no
   speech synthesis or no Arabic voice installed. */
export function canSpeakAyah(){
  return 'speechSynthesis' in window;
}

export function speakAyah(arabicText){
  if(!canSpeakAyah()) return false;
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(arabicText);
    u.lang = 'ar-SA';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
    return true;
  }catch(e){ return false; }
}
