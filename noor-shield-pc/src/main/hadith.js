'use strict';

/**
 * The same cited set as the Android app's Hadith.kt — kept in sync so the
 * phone and the PC give the family the same reminders.
 *
 * Translations are common English renderings used for reminder purposes, not
 * scholarly translations. Grading notes are included where scholars discuss a
 * hadith's authenticity (e.g. hasan rather than sahih). Verify against
 * sunnah.com or a qualified scholar before relying on this list beyond
 * in-app reminders.
 */

const CATEGORY = {
  LOWER_GAZE: 'Lowering the Gaze',
  TAWBAH: 'Tawbah (Repentance)',
  ISTIGHFAR: 'Istighfar (Seeking Forgiveness)',
  AKHIRAH: 'Remembering the Akhirah',
  PRIVATE_SIN: 'The Danger of Sinning in Private',
};

const HADITHS = [
  {
    id: 1,
    category: CATEGORY.LOWER_GAZE,
    text:
      '"Allah has written for the son of Adam his share of zina (illicit desire) which he will ' +
      'inevitably have. The zina of the eyes is the (lustful) glance, the zina of the tongue is ' +
      '(improper) speech, the zina of the ears is listening (to what is unlawful)... and the ' +
      'private parts confirm all this or deny it."',
    source: 'Sahih Muslim 2657a',
    grading: 'Sahih',
  },
  {
    id: 2,
    category: CATEGORY.LOWER_GAZE,
    text:
      'The Prophet (peace be upon him) said to ʿAli: "O ʿAli, do not follow a (lustful) ' +
      'glance with another glance. The first is forgiven for you, but not the second."',
    source: 'Sunan Abi Dawud 2149, Jamiʿ at-Tirmidhi 2777',
    grading: 'Hasan',
  },
  {
    id: 3,
    category: CATEGORY.LOWER_GAZE,
    text:
      '"Seven will be shaded by Allah under His shade on the Day when there will be no shade ' +
      'except His... and a man who is called by a woman of beauty and position [for an illicit ' +
      'relationship] but says, \'I fear Allah.\'"',
    source: 'Sahih al-Bukhari 660, Sahih Muslim 1031',
    grading: 'Sahih',
  },
  {
    id: 4,
    category: CATEGORY.PRIVATE_SIN,
    text:
      '"I certainly know people from my nation who will come on the Day of Resurrection with good ' +
      'deeds like the mountains of Tihamah, white and shining, but Allah will turn them into ' +
      'scattered dust." Thawban asked him to describe them, and he said: "They are your brothers ' +
      'and of your race... but they are people who, when they are alone, violate the prohibitions ' +
      'of Allah."',
    source: 'Sunan Ibn Majah 4245',
    grading: 'Hasan (graded by al-Albani)',
  },
  {
    id: 5,
    category: CATEGORY.TAWBAH,
    text:
      '"Allah is more pleased with the repentance of His slave than one of you would be if he were ' +
      'riding his camel in a barren land, and it ran away from him with his food and water on ' +
      'it... and then he found it again."',
    source: 'Sahih al-Bukhari 6309, Sahih Muslim 2747',
    grading: 'Sahih',
  },
  {
    id: 6,
    category: CATEGORY.TAWBAH,
    text:
      '"Allah, the Exalted, extends His Hand during the night so that those who sinned during the ' +
      'day may repent, and He extends His Hand during the day so that those who sinned during the ' +
      'night may repent, until the sun rises from the west."',
    source: 'Sahih Muslim 2759a',
    grading: 'Sahih',
  },
  {
    id: 7,
    category: CATEGORY.TAWBAH,
    text: '"All the children of Adam are sinners, but the best of sinners are those who repent often."',
    source: 'Sunan Ibn Majah 4251, Jamiʿ at-Tirmidhi 2499',
    grading: 'Hasan',
  },
  {
    id: 8,
    category: CATEGORY.ISTIGHFAR,
    text:
      '"O people, turn to Allah in repentance and seek His forgiveness, for I turn to Him in ' +
      'repentance a hundred times a day."',
    source: 'Sahih Muslim 2702',
    grading: 'Sahih',
  },
  {
    id: 9,
    category: CATEGORY.ISTIGHFAR,
    text: '"By Allah, I seek Allah\'s forgiveness and repent to Him more than seventy times a day."',
    source: 'Sahih al-Bukhari 6307',
    grading: 'Sahih',
  },
  {
    id: 10,
    category: CATEGORY.AKHIRAH,
    text: '"Remember often the destroyer of pleasures" — meaning death.',
    source: 'Jamiʿ at-Tirmidhi 2307, Sunan an-Nasa\'i 1824',
    grading: 'Hasan/Sahih',
  },
  {
    id: 11,
    category: CATEGORY.AKHIRAH,
    text:
      '"What business do I have with this world? My similitude in comparison to this world is that ' +
      'of a rider who takes shelter under a tree, then moves on and leaves it behind."',
    source: 'Jamiʿ at-Tirmidhi 2377, Sunan Ibn Majah 4109',
    grading: 'Sahih/Hasan',
  },
  {
    id: 12,
    category: CATEGORY.AKHIRAH,
    text: '"Be in this world as though you were a stranger or a traveler."',
    source: 'Sahih al-Bukhari 6416',
    grading: 'Sahih',
  },
];

function byCategory(category) {
  return HADITHS.filter((h) => h.category === category);
}

function random() {
  return HADITHS[Math.floor(Math.random() * HADITHS.length)];
}

function randomLowerGazeReminder() {
  const pool = byCategory(CATEGORY.LOWER_GAZE);
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { CATEGORY, HADITHS, byCategory, random, randomLowerGazeReminder };
