/* ===================== Ayah System =====================
   Every ayah here is a real, verifiable verse of the Qur'an, given with
   its exact surah name and ayah number. Nothing here is invented, and
   nothing is presented as a Prophetic saying (hadith) or vice versa.

   If you add more ayat, keep the same rule: only include text you can
   point to an exact surah:ayah reference for, double-check the Arabic
   against a trusted mushaf before adding it, and never guess at wording
   from memory alone without that check. When in doubt, ask a
   knowledgeable local source to verify before adding an entry. */

export const AYAH_LIBRARY = [
  {
    id: 'tawbah-9-40',
    surah: 'At-Tawbah',
    ayah: '9:40',
    context: 'Revealed about the Hijrah — the two companions in the cave.',
    arabicFull:
      'إِلَّا تَنصُرُوهُ فَقَدْ نَصَرَهُ اللَّهُ إِذْ أَخْرَجَهُ الَّذِينَ كَفَرُوا ثَانِيَ اثْنَيْنِ إِذْ هُمَا فِي الْغَارِ إِذْ يَقُولُ لِصَاحِبِهِ لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا فَأَنزَلَ اللَّهُ سَكِينَتَهُ عَلَيْهِ وَأَيَّدَهُ بِجُنُودٍ لَمْ تَرَوْهَا وَجَعَلَ كَلِمَةَ الَّذِينَ كَفَرُوا السُّفْلَىٰ وَكَلِمَةُ اللَّهِ هِيَ الْعُلْيَا وَاللَّهُ عَزِيزٌ حَكِيمٌ',
    highlightArabic: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
    highlightTranslation: 'Do not grieve; indeed, Allah is with us.',
    translationSimple:
      'Allah helped him even when others forced him to leave his home. He was one of two companions — when they were both in the cave, he said to his companion, "Do not grieve; indeed Allah is with us." Then Allah sent calm into his heart, helped him with support that could not be seen, and made sure that the truth would rise above everything raised against it. Allah is Mighty and Wise.',
    lesson: 'Trust Allah during difficult moments.'
  },
  {
    id: 'sharh-94-5-6',
    surah: 'Ash-Sharh',
    ayah: '94:5-6',
    context: 'A well-known reminder that hardship is followed by ease.',
    arabicFull: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾',
    highlightArabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    highlightTranslation: 'So truly, with hardship comes ease.',
    translationSimple: 'So truly, with hardship comes ease. Truly, with hardship comes ease.',
    lesson: 'Even on a hard journey, Allah promises that ease will come.'
  }
];

export function getAyahById(id){
  return AYAH_LIBRARY.find(a => a.id === id) || null;
}
