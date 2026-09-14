/* ===================== Good Deed Manager =====================
   The list of good deeds the race can be "about", and which question
   from questionSystem.js goes with each one. A virtual token or star in
   this game is only ever a game bonus -- never described as literally
   equal to religious reward. */

export const GOOD_DEEDS = [
  { id: 'help-someone', label: 'Help Someone' },
  { id: 'share-food', label: 'Share Food' },
  { id: 'give-water', label: 'Give Someone Water' },
  { id: 'clean-park', label: 'Clean a Park' },
  { id: 'plant-tree', label: 'Plant a Tree' },
  { id: 'help-friend', label: 'Help a Friend' },
  { id: 'carry-help', label: 'Help Someone Carry Something' },
  { id: 'speak-kindly', label: 'Speak Kindly' },
  { id: 'help-learn', label: 'Help Someone Learn' },
  { id: 'care-animal', label: 'Care for an Animal' }
];

/* Maps a good deed id to the question-bank entry used at the finish
   line (a few good deeds share a closely related question). */
const QUESTION_FOR_DEED = {
  'help-someone': 'help-someone',
  'share-food': 'share-food',
  'give-water': 'animals',
  'clean-park': 'environment',
  'plant-tree': 'plant-tree',
  'help-friend': 'help-friend',
  'carry-help': 'help-friend',
  'speak-kindly': 'speak-kindly',
  'help-learn': 'kindness',
  'care-animal': 'animals'
};

export function questionIdForDeed(deedId){
  return QUESTION_FOR_DEED[deedId] || 'kindness';
}

export function pickRandomGoodDeed(){
  return GOOD_DEEDS[Math.floor(Math.random() * GOOD_DEEDS.length)];
}

export function getGoodDeed(id){
  return GOOD_DEEDS.find(d => d.id === id) || GOOD_DEEDS[0];
}
