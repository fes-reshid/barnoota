package com.barnoota.noorshield.reminders

enum class HadithCategory {
    LOWER_GAZE,
    TAWBAH,
    ISTIGHFAR,
    AKHIRAH,
    PRIVATE_SIN,
}

/**
 * Translations below are common English renderings used for da'wah purposes,
 * not a substitute for the Arabic text or a scholarly translation. Grading
 * notes are included where a hadith's authenticity is discussed by scholars
 * (e.g. hasan rather than sahih) — verify against sunnah.com or a local
 * scholar before relying on this list for anything beyond in-app reminders.
 */
data class Hadith(
    val id: Int,
    val category: HadithCategory,
    val text: String,
    val source: String,
    val grading: String,
)

object HadithRepository {

    val all: List<Hadith> = listOf(
        Hadith(
            id = 1,
            category = HadithCategory.LOWER_GAZE,
            text = "\"Allah has written for the son of Adam his share of zina (illicit desire) which " +
                "he will inevitably have. The zina of the eyes is the (lustful) glance, the zina of " +
                "the tongue is (improper) speech, the zina of the ears is listening (to what is " +
                "unlawful)... and the private parts confirm all this or deny it.\"",
            source = "Sahih Muslim 2657a",
            grading = "Sahih",
        ),
        Hadith(
            id = 2,
            category = HadithCategory.LOWER_GAZE,
            text = "The Prophet (peace be upon him) said to 'Ali: \"O 'Ali, do not follow a (lustful) " +
                "glance with another glance. The first is forgiven for you, but not the second.\"",
            source = "Sunan Abi Dawud 2149, Jami' at-Tirmidhi 2777",
            grading = "Hasan",
        ),
        Hadith(
            id = 3,
            category = HadithCategory.LOWER_GAZE,
            text = "\"Seven will be shaded by Allah under His shade on the Day when there will be no " +
                "shade except His... and a man who is called by a woman of beauty and position [for " +
                "an illicit relationship] but says, 'I fear Allah.'\"",
            source = "Sahih al-Bukhari 660, Sahih Muslim 1031",
            grading = "Sahih",
        ),
        Hadith(
            id = 4,
            category = HadithCategory.PRIVATE_SIN,
            text = "\"I certainly know people from my nation who will come on the Day of Resurrection " +
                "with good deeds like the mountains of Tihamah, white and shining, but Allah will turn " +
                "them into scattered dust.\" Thawban asked him to describe them, and he said: \"They are " +
                "your brothers and of your race... but they are people who, when they are alone, violate " +
                "the prohibitions of Allah.\"",
            source = "Sunan Ibn Majah 4245",
            grading = "Hasan (graded by al-Albani)",
        ),
        Hadith(
            id = 5,
            category = HadithCategory.TAWBAH,
            text = "\"Allah is more pleased with the repentance of His slave than one of you would be " +
                "if he were riding his camel in a barren land, and it ran away from him with his food " +
                "and water on it... and then he found it again.\"",
            source = "Sahih al-Bukhari 6309, Sahih Muslim 2747",
            grading = "Sahih",
        ),
        Hadith(
            id = 6,
            category = HadithCategory.TAWBAH,
            text = "\"Allah, the Exalted, extends His Hand during the night so that those who sinned " +
                "during the day may repent, and He extends His Hand during the day so that those who " +
                "sinned during the night may repent, until the sun rises from the west.\"",
            source = "Sahih Muslim 2759a",
            grading = "Sahih",
        ),
        Hadith(
            id = 7,
            category = HadithCategory.TAWBAH,
            text = "\"All the children of Adam are sinners, but the best of sinners are those who " +
                "repent often.\"",
            source = "Sunan Ibn Majah 4251, Jami' at-Tirmidhi 2499",
            grading = "Hasan",
        ),
        Hadith(
            id = 8,
            category = HadithCategory.ISTIGHFAR,
            text = "\"O people, turn to Allah in repentance and seek His forgiveness, for I turn to " +
                "Him in repentance a hundred times a day.\"",
            source = "Sahih Muslim 2702",
            grading = "Sahih",
        ),
        Hadith(
            id = 9,
            category = HadithCategory.ISTIGHFAR,
            text = "\"By Allah, I seek Allah's forgiveness and repent to Him more than seventy times a " +
                "day.\"",
            source = "Sahih al-Bukhari 6307",
            grading = "Sahih",
        ),
        Hadith(
            id = 10,
            category = HadithCategory.AKHIRAH,
            text = "\"Remember often the destroyer of pleasures\" — meaning death.",
            source = "Jami' at-Tirmidhi 2307, Sunan an-Nasa'i 1824",
            grading = "Hasan/Sahih",
        ),
        Hadith(
            id = 11,
            category = HadithCategory.AKHIRAH,
            text = "\"What business do I have with this world? My similitude in comparison to this " +
                "world is that of a rider who takes shelter under a tree, then moves on and leaves it " +
                "behind.\"",
            source = "Jami' at-Tirmidhi 2377, Sunan Ibn Majah 4109",
            grading = "Sahih/Hasan",
        ),
        Hadith(
            id = 12,
            category = HadithCategory.AKHIRAH,
            text = "\"Be in this world as though you were a stranger or a traveler.\"",
            source = "Sahih al-Bukhari 6416",
            grading = "Sahih",
        ),
    )

    fun byCategory(category: HadithCategory): List<Hadith> = all.filter { it.category == category }

    /** Short reminder shown on the blur overlay when explicit content is detected. */
    fun randomLowerGazeReminder(context: android.content.Context): String {
        val pick = byCategory(HadithCategory.LOWER_GAZE).random()
        return "${pick.text}\n— ${pick.source}"
    }

    fun random(): Hadith = all.random()
}
