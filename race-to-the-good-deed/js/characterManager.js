/* ===================== Character Manager =====================
   Four original characters (not the copyrighted Sonic cast this game
   was inspired by -- this site has no license for those characters, so
   each one here has an equivalent color and ability but its own name
   and original design). Colors stay fixed everywhere in the game: HUD,
   mini-map, checkpoints, selection outline, ability effects. */

export const CHARACTERS = [
  {
    id: 'zayd',
    name: 'Zayd',
    color: '#1E6FE0',
    colorDark: '#0F4DA8',
    abilityName: 'SUPER SPEED',
    abilityDesc: 'Zayd runs faster than anyone -- and can burst even faster for a few seconds.',
    icon: '⚡',
    baseSpeed: 235,
    accent: '⚡' // lightning headband
  },
  {
    id: 'layla',
    name: 'Layla',
    color: '#F08A1E',
    colorDark: '#B8630F',
    abilityName: 'FLIGHT',
    abilityDesc: 'Layla can glide through the air for a few seconds to cross gaps others can’t.',
    icon: '🪶',
    baseSpeed: 205,
    accent: '🪶' // small glider wings
  },
  {
    id: 'malik',
    name: 'Malik',
    color: '#E0301E',
    colorDark: '#A8210F',
    abilityName: 'POWER',
    abilityDesc: 'Malik can smash through breakable rocks blocking the way.',
    icon: '👊',
    baseSpeed: 205,
    accent: '👊' // gauntlet fist
  },
  {
    id: 'amira',
    name: 'Amira',
    color: '#E0479C',
    colorDark: '#A82F73',
    abilityName: 'HAMMER SWITCH',
    abilityDesc: 'Amira can activate special switches with her hammer to open the way for everyone.',
    icon: '🔨',
    baseSpeed: 205,
    accent: '🔨' // hammer
  }
];

export function getCharacter(id){
  return CHARACTERS.find(c => c.id === id) || null;
}

export function getCharacterByIndex(i){
  return CHARACTERS[i] || null;
}
