/* ===================== Quiz System =====================
   All quiz questions used across landmarks and the final review. Kept as
   plain data so content can be checked for accuracy independently of the
   UI code that renders it. */

export const CAVE_QUESTION = {
  question: 'The cave reminds us of which quality?',
  options: ['Patience', 'Courage and trust in Allah', 'Giving up', 'Being selfish'],
  correctIndex: 1,
  reward: 10
};

export const MINOR_STOPS = [
  {
    id: 'why-hijrah',
    title: 'Why Leave Makkah?',
    discover: 'A small gathering place along the desert route, where travelers used to rest and share news.',
    learn: 'In Makkah, the early Muslims faced hardship and persecution for their beliefs. The Hijrah gave the growing community a safe place — Madinah — where they could practice their faith and build a new community.',
    why: 'Understanding why the journey happened helps us understand why it mattered so much to the people who made it.',
    reference: 'Traditional sira (biography) sources.',
    question: {
      question: 'Why did the early Muslims leave Makkah?',
      options: [
        'They wanted a vacation',
        'They were facing hardship and needed a safe place to practice their faith',
        'They wanted more animals',
        'They were bored'
      ],
      correctIndex: 1,
      reward: 5
    }
  },
  {
    id: 'city-of-two-names',
    title: 'A City With Two Names',
    discover: 'A worn signpost half-buried in the sand, pointing the way north.',
    learn: 'Before the Hijrah, the city the travelers were heading to was known as Yathrib. Afterward, it became known as Madinat an-Nabi ("the City of the Prophet") or simply al-Madinah ("the City").',
    why: 'The new name reflected how important this city became in Islamic history after the Hijrah.',
    reference: 'Traditional sira (biography) sources.',
    question: {
      question: 'What was Madinah called before the Hijrah?',
      options: ['Yathrib', 'Makkah', "Ta'if", 'Quba'],
      correctIndex: 0,
      reward: 5
    }
  }
];

export const TEAMWORK_EVENT = {
  title: 'A Tired Camel',
  narration: 'One of the camels in your group is looking tired after the long desert stretch. What should the group do?',
  choiceHelp: { label: 'Help your friend', reward: 15 },
  choiceRace: { label: 'Race ahead', reward: 0 },
  afterHelp: 'One lesson from a difficult journey is that people should help one another.',
  afterRace: 'The group presses on, but leaving a friend behind doesn’t feel like the right way to travel together. Maybe next time, everyone can help.'
};

export const QUBA_QUESTION = {
  question: 'Which city are we getting closer to?',
  options: ['Makkah', "Ta'if", 'Madinah', 'Yathrib, forever'],
  correctIndex: 2,
  reward: 5
};

export const FINAL_QUIZ = [
  {
    question: 'What was the journey from Makkah to Madinah called?',
    options: ['The Hijrah', 'The Hajj', 'The Isra', 'The Umrah'],
    correctIndex: 0
  },
  {
    question: 'Which cave is connected with the Hijrah?',
    options: ['Cave of Hira', 'Cave of Thawr', 'Cave of Uhud', 'Cave of Badr'],
    correctIndex: 1
  },
  {
    question: 'Which surah contains the verse mentioning the two companions in the cave?',
    options: ['Surah Al-Baqarah', 'Surah Yasin', 'Surah At-Tawbah', 'Surah Al-Ikhlas'],
    correctIndex: 2
  },
  {
    question: 'What words from Surah 9:40 are especially well known from the cave?',
    options: ['لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا', 'الْحَمْدُ لِلَّهِ', 'بِسْمِ اللَّهِ', 'اللَّهُ أَكْبَرُ'],
    correctIndex: 0
  },
  {
    question: 'What city did the journey lead toward?',
    options: ['Makkah', "Ta'if", 'Jerusalem', 'Madinah'],
    correctIndex: 3
  }
];

export const FINAL_QUIZ_REWARD_PER_CORRECT = 5;
