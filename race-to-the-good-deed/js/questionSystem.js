/* ===================== Question System =====================
   The "good deed" question bank used at the finish-line challenge.
   Every message is encouraging -- there is no wrong-answer message
   that shames or insults a child, only "Good choice!" or a gentle
   nudge to try again. Answering is never framed as an act of worship
   itself; it's simply part of a fun racing game about good character. */

export const GOOD_DEED_QUESTIONS = {
  'help-someone': {
    label: 'HELP SOMEONE',
    question: 'Someone dropped their books. What should you do?',
    options: ['Walk away', 'Help pick them up', 'Laugh'],
    correctIndex: 1
  },
  'share-food': {
    label: 'SHARE FOOD',
    question: 'Your friend has no snack. What could you do?',
    options: ['Hide your food', 'Share some', 'Laugh'],
    correctIndex: 1
  },
  'help-parents': {
    label: 'HELP YOUR PARENTS',
    question: 'Your parent asks you to help tidy up. What should you do?',
    options: ['Help', 'Ignore them', 'Run away'],
    correctIndex: 0
  },
  kindness: {
    label: 'BE KIND',
    question: 'Someone is feeling sad. What could you do?',
    options: ['Be kind and ask if they need help', 'Make fun of them', 'Ignore them completely'],
    correctIndex: 0
  },
  environment: {
    label: 'CLEAN THE PARK',
    question: 'You see rubbish in the park. What is a good choice?',
    options: ['Leave it there', 'Put it in the proper bin', 'Throw more rubbish'],
    correctIndex: 1
  },
  honesty: {
    label: 'BE HONEST',
    question: 'You accidentally break something. What should you do?',
    options: ['Lie about it', 'Tell the truth', 'Blame someone else'],
    correctIndex: 1
  },
  'plant-tree': {
    label: 'PLANT A TREE',
    question: 'You want to help nature grow. What is a good choice?',
    options: ['Plant a tree and water it', 'Pull up young plants', 'Leave litter near the river'],
    correctIndex: 0
  },
  'help-friend': {
    label: 'HELP A FRIEND',
    question: 'Your friend is struggling to carry something heavy. What should you do?',
    options: ['Walk past', 'Offer to help carry it', 'Tell them to hurry up'],
    correctIndex: 1
  },
  animals: {
    label: 'CARE FOR ANIMALS',
    question: 'You see a thirsty animal outside. What is a kind choice?',
    options: ['Ignore it', 'Give it some water', 'Chase it away'],
    correctIndex: 1
  },
  'speak-kindly': {
    label: 'SPEAK KINDLY',
    question: 'Your friend makes a mistake during a game. What should you say?',
    options: ['"You always mess up!"', '"That’s okay, try again!"', 'Nothing, just walk off'],
    correctIndex: 1
  }
};

export function getQuestion(id){
  return GOOD_DEED_QUESTIONS[id] || null;
}

const ALL_IDS = Object.keys(GOOD_DEED_QUESTIONS);

export function pickQuestionFor(goodDeedId){
  return GOOD_DEED_QUESTIONS[goodDeedId] ? goodDeedId : ALL_IDS[Math.floor(Math.random() * ALL_IDS.length)];
}
