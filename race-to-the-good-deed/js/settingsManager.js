/* ===================== Settings Manager =====================
   Holds current settings in memory and keeps them in sync with the
   Save System. Controller/keyboard "settings" here just display the
   fixed control scheme for each player -- there is nothing to remap
   in a shared local 4-player game, since every physical key already
   belongs to exactly one player. */

import { loadSave, saveSettings } from './saveSystem.js';
import { setSfxVolume, setMusicVolume, setVoiceVolume, setMuted, setMusicOn } from './audioManager.js';

const DEFAULTS = {
  sfxVolume: 0.8,
  musicVolume: 0.5,
  voiceVolume: 0.8,
  muted: false,
  musicOn: false,
  textScale: 1,
  subtitles: true,
  language: 'en'
};

let current = { ...DEFAULTS };

export function loadSettings(){
  const saved = loadSave().settings;
  current = { ...DEFAULTS, ...(saved || {}) };
  applyToAudio();
  return current;
}

export function getSettings(){ return current; }

export function updateSetting(key, value){
  current[key] = value;
  applyToAudio();
  saveSettings(current);
}

function applyToAudio(){
  setSfxVolume(current.sfxVolume);
  setMusicVolume(current.musicVolume);
  setVoiceVolume(current.voiceVolume);
  setMuted(current.muted);
  setMusicOn(current.musicOn);
}
