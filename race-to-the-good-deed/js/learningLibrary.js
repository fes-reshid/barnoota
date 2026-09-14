/* ===================== Learning Library =====================
   All the educational content: the short value card shown after a
   level, the full Good Deed Library (plain child-friendly guidance,
   no religious citation needed), and the small Qur'an & Hadith
   library. Every Arabic entry here is real and verified, with an
   exact source -- nothing invented, nothing guessed at. If you add
   more, keep that rule: only include text you can point to an exact
   surah:ayah or a named hadith collection for. */

export const POST_LEVEL_CARDS = {
  kindness: { title: 'KINDNESS', text: 'Being kind to others is an important part of good character.' },
  charity: { title: 'CHARITY', text: 'Helping others and giving generously are encouraged in Islam.' },
  honesty: { title: 'HONESTY', text: 'Tell the truth and be trustworthy.' },
  patience: { title: 'PATIENCE', text: 'Be patient when something is difficult.' },
  'helping-others': { title: 'HELPING OTHERS', text: 'Look for opportunities to help people around you.' }
};

export const GOOD_DEED_LIBRARY_CARDS = [
  { id: 'helping-others', title: 'Helping Others', icon: '🤝', what: 'Doing something useful for someone else, big or small.', why: 'It makes the people around you feel supported, and it feels good to help too.', how: 'Look for chances to help -- carrying something, holding a door, or lending a hand.' },
  { id: 'kindness', title: 'Kindness', icon: '💛', what: 'Being warm, gentle and thoughtful toward others.', why: 'Kindness can turn someone’s hard day into a better one.', how: 'Smile, say something encouraging, or check on a friend who seems upset.' },
  { id: 'sharing', title: 'Sharing', icon: '🍪', what: 'Giving part of what you have to someone else.', why: 'Sharing shows you care about others, not just yourself.', how: 'Offer to share your snack, your toys, or your time with someone.' },
  { id: 'charity', title: 'Charity', icon: '🤲', what: 'Giving generously to people who need help.', why: 'It is one of the most encouraged good deeds, and it helps build a caring community.', how: 'Give some of your allowance, donate toys you don’t use, or help a charity project.' },
  { id: 'honesty', title: 'Honesty', icon: '✅', what: 'Telling the truth, even when it is hard.', why: 'People trust you more when they know you tell the truth.', how: 'If you make a mistake, say so calmly instead of hiding it.' },
  { id: 'patience', title: 'Patience', icon: '⏳', what: 'Staying calm when something takes time or doesn’t go your way.', why: 'Patience helps you handle hard moments without giving up.', how: 'Take a deep breath, wait your turn, and keep trying.' },
  { id: 'helping-parents', title: 'Helping Parents', icon: '🏠', what: 'Doing chores or tasks your parents ask for.', why: 'It shows respect and makes home life easier for everyone.', how: 'Tidy your room, help set the table, or offer before you’re asked.' },
  { id: 'caring-animals', title: 'Caring for Animals', icon: '🐾', what: 'Treating animals gently and making sure they’re cared for.', why: 'Animals depend on us and can’t ask for help in words.', how: 'Give a thirsty animal water, or be gentle with pets.' },
  { id: 'caring-nature', title: 'Caring for Nature', icon: '🌳', what: 'Looking after trees, plants, rivers and the outdoors.', why: 'A clean, green world is better for everyone who lives in it.', how: 'Plant a tree, pick up litter, or avoid wasting water.' },
  { id: 'speaking-kindly', title: 'Speaking Kindly', icon: '💬', what: 'Choosing gentle, encouraging words.', why: 'Words can lift someone up or bring them down -- kind words help.', how: 'Say something encouraging instead of teasing, especially after a mistake.' },
  { id: 'helping-friends', title: 'Helping Friends', icon: '🧑‍🤝‍🧑', what: 'Being there for your friends when they need support.', why: 'True friendship means helping each other, not just having fun together.', how: 'Notice when a friend is struggling and offer to help.' },
  { id: 'keeping-clean', title: 'Keeping Places Clean', icon: '🧹', what: 'Keeping shared spaces like parks and streets tidy.', why: 'Clean places are healthier and nicer for the whole community.', how: 'Put rubbish in the bin, and pick up litter when you see it.' }
];

export const QURAN_HADITH_LIBRARY = [
  {
    id: 'do-good',
    title: 'Do Good',
    arabic: 'وَأَحْسِنوا ۖ إِنَّ اللّهَ يُحِبُّ الْمُحْسِنِينَ',
    translation: 'And do good; indeed, Allah loves the doers of good.',
    source: 'Qur’an, Surah Al-Baqarah (2:195)'
  },
  {
    id: 'allah-with-patient',
    title: 'Allah Is With the Patient',
    arabic: 'إِنَّ اللّهَ مَعَ الصَّابِرِينَ',
    translation: 'Indeed, Allah is with the patient.',
    source: 'Qur’an, Surah Al-Baqarah (2:153)'
  },
  {
    id: 'be-truthful',
    title: 'Be Truthful',
    arabic: 'اتَّقوا اللّهَ وَكونوا مَعَ الصَّادِقِينَ',
    translation: 'Fear Allah and be with those who are truthful.',
    source: 'Qur’an, Surah At-Tawbah (9:119)'
  },
  {
    id: 'smile-is-charity',
    title: 'A Smile Is Charity',
    arabic: 'تَبَسُّمُكَ في وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
    translation: 'Your smiling in the face of your brother is charity.',
    source: 'Reported in Jami’ at-Tirmidhi'
  }
];

export function getGoodDeedCard(id){
  return GOOD_DEED_LIBRARY_CARDS.find(c => c.id === id) || null;
}
