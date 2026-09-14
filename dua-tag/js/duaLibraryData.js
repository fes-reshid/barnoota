/* ===================== Du'a Library Data =====================
   Every entry here is a short, well-known, authentic supplication.
   `category` distinguishes the source type honestly:
     - "quran"  : a direct verse of the Qur'an (ayah + surah given)
     - "hadith" : reported from the Prophet Muhammad ﷺ in a hadith collection
   Nothing here is invented. If you add more du'as, keep the same rule:
   only include text you can point to a real Qur'an ayah or a named,
   citable hadith collection for, and never blend the two categories or
   present a hadith-based phrase as if it were a Qur'anic ayah (or vice
   versa). When in doubt, ask a knowledgeable local scholar to verify
   wording and reference before adding an entry. */

export const DUA_LIBRARY = [
  {
    id: 'zidni-ilma',
    category: 'quran',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: 'Rabbi zidni ‘ilma',
    english: 'My Lord, increase me in knowledge.',
    source: 'Qur’an, Surah Ta-Ha (20:114)'
  },
  {
    id: 'rabbana-atina',
    category: 'quran',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina ‘adhaban-nar',
    english: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    source: 'Qur’an, Surah Al-Baqarah (2:201)'
  },
  {
    id: 'ighfir-warham',
    category: 'quran',
    arabic: 'رَبِّ اغْفِرْ وَارْحَمْ وَأَنتَ خَيْرُ الرَّاحِمِينَ',
    transliteration: 'Rabbi-ghfir warham wa anta khayru-r-rahimin',
    english: 'My Lord, forgive and have mercy, and You are the best of the merciful.',
    source: 'Qur’an, Surah Al-Mu’minun (23:118)'
  },
  {
    id: 'ishrah-sadri',
    category: 'quran',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    transliteration: 'Rabbi-shrah li sadri wa yassir li amri',
    english: 'My Lord, expand for me my chest, and ease for me my task.',
    source: 'Qur’an, Surah Ta-Ha (20:25–26) — the du’a of Prophet Musa (AS)'
  },
  {
    id: 'before-eating',
    category: 'hadith',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    english: 'In the name of Allah.',
    source: 'Reported in Sunan Abi Dawud and Jami’ at-Tirmidhi — said before eating'
  },
  {
    id: 'after-eating',
    category: 'hadith',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
    transliteration: 'Alhamdulillahi-lladhi at’amana wa saqana wa ja‘alana muslimin',
    english: 'All praise is for Allah who fed us, gave us drink, and made us Muslims.',
    source: 'Sunan Abi Dawud, Jami’ at-Tirmidhi'
  },
  {
    id: 'before-sleep',
    category: 'hadith',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amutu wa ahya',
    english: 'In Your name, O Allah, I die and I live.',
    source: 'Sahih al-Bukhari — said before sleeping'
  },
  {
    id: 'upon-waking',
    category: 'hadith',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: 'Alhamdulillahi-lladhi ahyana ba‘da ma amatana wa ilayhin-nushur',
    english: 'All praise is for Allah who gave us life after having taken it from us, and to Him is the return.',
    source: 'Sahih al-Bukhari — said upon waking'
  },
  {
    id: 'entering-home',
    category: 'hadith',
    arabic: 'بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    transliteration: 'Bismillahi walajna, wa bismillahi kharajna, wa ‘ala Rabbina tawakkalna',
    english: 'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we depend.',
    source: 'Sunan Abi Dawud — said when entering the home'
  },
  {
    id: 'leaving-home',
    category: 'hadith',
    arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'Bismillahi tawakkaltu ‘ala Allah, wa la hawla wa la quwwata illa billah',
    english: 'In the name of Allah, I place my trust in Allah, and there is no power nor strength except with Allah.',
    source: 'Sunan Abi Dawud, Jami’ at-Tirmidhi — said when leaving the home'
  }
];

export function getDuaById(id){
  return DUA_LIBRARY.find(d => d.id === id) || null;
}

/* Picks a random du'a, avoiding immediate repeats when the pool is large
   enough to do so (so the same child doesn't see the same du'a twice in a row). */
export function pickRandomDua(recentIds){
  const recent = recentIds || [];
  let pool = DUA_LIBRARY.filter(d => !recent.includes(d.id));
  if(pool.length === 0) pool = DUA_LIBRARY;
  return pool[Math.floor(Math.random() * pool.length)];
}
