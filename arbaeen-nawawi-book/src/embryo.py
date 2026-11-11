# -*- coding: utf-8 -*-
"""Online cards for the Hadith 4 picture (stages of creation), with real images and the science discussion.

Images are openly licensed (Wikimedia Commons) and stored in arbaeen-nawawi/img/embryo/ with their credits.
Claims about scientists are limited to what is verifiable.
"""

IMG = {
"eight": dict(src="img/embryo/eight-cell.jpg", cap="A human embryo of eight cells, about three days after fertilisation — far smaller than a grain of sand.",
              credit="Ajay Kumar Chaurasiya, CC BY-SA 4.0, via Wikimedia Commons", page="https://commons.wikimedia.org/wiki/File:Eight-_Cell_Embryo-Blastomeres.jpg"),
"week1": dict(src="img/embryo/preembryonic.jpg", cap="Week 1: fertilisation in the tube, cell division, and the embryo settling into the wall of the womb.",
              credit="OpenStax College, Anatomy & Physiology, CC BY 3.0, via Wikimedia Commons", page="https://commons.wikimedia.org/wiki/File:2904_Preembryonic_Development-02.jpg"),
"week3": dict(src="img/embryo/week3.jpg", cap="Week 3: the embryo hangs from the wall of the womb by a stalk and is fed by the mother’s blood.",
              credit="OpenStax College, Anatomy & Physiology, CC BY 3.0, via Wikimedia Commons", page="https://commons.wikimedia.org/wiki/File:2909_Embryo_Week_3-02.jpg"),
"folding": dict(src="img/embryo/folding.jpg", cap="Week 4: the flat embryo folds into a curved body; blocks called somites form along its back.",
                credit="OpenStax College, Anatomy & Physiology, CC BY 3.0, via Wikimedia Commons", page="https://commons.wikimedia.org/wiki/File:2913_Embryonic_Folding.jpg"),
"w75": dict(src="img/embryo/embryo-7-5-weeks.jpg", cap="A real embryo at about 5½ weeks after fertilisation (7½ weeks of pregnancy), from a miscarriage.",
            credit="Littlecontribution, CC0, via Wikimedia Commons", page="https://commons.wikimedia.org/wiki/File:7,5_weeks_embryo.jpg"),
"w7": dict(src="img/embryo/embryo-seven-weeks.jpg", cap="Seven weeks of development: about 10 mm long, with eyes, limb buds and fingers forming.",
           credit="Ed Uthman, CC BY 4.0 (OpenStax), via Wikimedia Commons", page="https://commons.wikimedia.org/wiki/File:819_Embryo_at_Seven_Weeks.jpg"),
"w9": dict(src="img/embryo/embryo-nine-weeks.jpg", cap="About seven weeks after fertilisation (nine weeks of pregnancy): the human form is clear.",
           credit="Ed Uthman, CC BY 2.0, via Wikimedia Commons", page="https://commons.wikimedia.org/wiki/File:9-Week_Human_Embryo_from_Ectopic_Pregnancy.jpg"),
"his": dict(src="img/embryo/his-atlas-1880.jpg", cap="A table of human embryos from Wilhelm His’s Atlas of Human Embryos (Leipzig, 1880).",
            credit="Public domain, via Wikimedia Commons", page="https://commons.wikimedia.org/wiki/File:Basel_2012-10-05_Batch_2_(6).JPG"),
}

VIDEOS = [
    dict(title="The Folding of the Embryo (3–4 weeks)", by="Endowment for Human Development — free official clip",
         url="https://www.ehd.org/movies/11/The-Folding-of-the-Embryo"),
    dict(title="Prenatal Development Timeline — week by week, with real images", by="Endowment for Human Development",
         url="https://ehd.org/interactive_timeline_html.php?level=all"),
    dict(title="One Minute Embryology — short animations for weeks 3 to 8", by="UNSW Embryology (University of New South Wales)",
         url="https://embryology.med.unsw.edu.au/embryology/index.php/One_Minute_Embryology"),
]

# cards opened from the picture (same format as figinfo.INFO, plus optional images / sections)
CARDS = {
"nutfah": dict(ar="النُّطْفَة", title="Nuṭfah — the drop",
  meaning="In Arabic, nuṭfah means a small amount of fluid — a drop. The Qur’an says: “Then We placed him as a nuṭfah in a firm resting place” (al-Mu’minūn 23:13).",
  sections=[("What embryology describes",
             "After fertilisation, the single cell divides again and again — two, four, eight cells — while it travels down the tube. By about day 6 to 10 it has sunk into the wall of the womb, where it is held securely and fed. At this stage the whole embryo is a fraction of a millimetre across.")],
  images=["eight", "week1"],
  verse=("ثُمَّ جَعَلْنَاهُ نُطْفَةً فِي قَرَارٍ مَكِينٍ", "“Then We placed him as a drop in a firm resting place.”", "al-Mu’minūn 23:13"),
  hadith=[4]),
"alaqah": dict(ar="العَلَقَة", title="ʿAlaqah — that which clings",
  meaning="ʿAlaqah comes from a root meaning ‘to cling or hang’. The word is also used for a leech and for a clot of blood. Classical translators usually wrote ‘clot of blood’; many modern writers point out that all three meanings describe the embryo at this stage.",
  sections=[("What embryology describes",
             "In weeks 3 and 4 the embryo is about 1.5 to 4 mm long. It hangs from the wall of the womb by a stalk and draws its nourishment from the mother’s blood. Its blood vessels form and it looks dark and blood-filled; the heart begins to beat around day 21–22. Some embryologists have compared its shape at this time to a leech.")],
  images=["week3"],
  verse=("ثُمَّ خَلَقْنَا النُّطْفَةَ عَلَقَةً", "“Then We made the drop into an ʿalaqah.”", "al-Mu’minūn 23:14"),
  hadith=[4]),
"mudghah": dict(ar="المُضْغَة", title="Muḍghah — the chewed lump",
  meaning="Muḍghah means a piece of something that has been chewed — a small lump that fits in the mouth. The Qur’an describes it as “formed and unformed” (al-Ḥajj 22:5).",
  sections=[("What embryology describes",
             "From about the end of week 3 and through week 4, paired blocks called somites appear along the embryo’s back, a few each day. Many writers have compared them to the marks left by teeth in chewed gum. Some parts of the embryo are already taking shape while others are not yet formed. The somites go on to form the bones and muscles — and the Qur’an continues: “then We made the lump into bones, then clothed the bones with flesh” (23:14)."),
            ("Then the human form", "By seven to eight weeks after fertilisation all the main organs have begun, the face, fingers and toes can be seen, and the embryo is called a foetus.")],
  images=["folding", "w75", "w7", "w9"],
  verse=("فَخَلَقْنَا العَلَقَةَ مُضْغَةً فَخَلَقْنَا المُضْغَةَ عِظَامًا فَكَسَوْنَا العِظَامَ لَحْمًا", "“Then We made the ʿalaqah into a muḍghah, then We made the muḍghah into bones, then We clothed the bones with flesh.”", "al-Mu’minūn 23:14"),
  hadith=[4]),
"soul": dict(ar="نَفْخُ الرُّوح", title="The breathing of the soul",
  meaning="The soul (rūḥ) is from the unseen: science can observe the body, but not the soul. “They ask you about the soul. Say: The soul is from the affair of my Lord, and you have been given only a little knowledge” (al-Isrā’ 17:85).",
  sections=[("When?", "Based on this hadith, most scholars hold that the soul is breathed in after 120 days (four months)."),
            ("Rulings connected to it", "Scholars connect several rulings to this: a baby miscarried after four months is washed, shrouded, given a name and prayed over, and the sanctity of the unborn child’s life becomes even greater. In real cases, ask a qualified scholar.")],
  verse=("وَيَسْأَلُونَكَ عَنِ الرُّوحِ قُلِ الرُّوحُ مِنْ أَمْرِ رَبِّي", "“They ask you about the soul. Say: The soul is from the affair of my Lord.”", "al-Isrā’ 17:85"),
  hadith=[4]),
"writing": dict(ar="الكِتَابَة", title="The four things that are written",
  meaning="The angel writes the person’s provision, life-span, deeds, and whether he will be wretched or happy. This is part of belief in qadar: Allah knows everything before it happens and has written it.",
  sections=[("Does that mean we have no choice?", "No. Allah’s knowledge does not force anyone. Each person chooses and is judged for his choices. When the Companions asked why they should work, the Prophet ﷺ said: “Work, for each person is eased towards what he was created for.”"),
            ("What it means for us", "Provision and life-span are written, so a believer is calm and content. Deeds and endings are hidden from us, so he keeps striving, stays humble and asks Allah for a good ending.")],
  verse=("إِنَّا كُلَّ شَيْءٍ خَلَقْنَاهُ بِقَدَرٍ", "“Indeed, We have created everything by a decree.”", "al-Qamar 54:49"),
  hadith=[4, 19]),
}

SCIENCE = dict(
  title="Science and this hadith",
  sections=[
    ("The stages in the Qur’an and Sunnah",
     "The Qur’an describes the stages of creation in al-Mu’minūn 23:12–14 and al-Ḥajj 22:5: a drop (nuṭfah), something that clings (ʿalaqah), a chewed lump (muḍghah), then bones, then flesh, then “another creation”. This hadith adds the forty-day periods, the angel, the soul and the four things that are written."),
    ("Two ways scholars read “forty days”",
     "Most classical scholars, including an-Nawawī and Ibn Rajab, understood the hadith to mean forty days for each stage, so the soul is breathed in after 120 days. Another narration in Ṣaḥīḥ Muslim (2645), from Ḥudhayfah ibn Asīd, says that after forty-two nights the angel is sent to shape the embryo and create its hearing, sight, skin, flesh and bones. Some scholars, especially in recent times, therefore understood the three stages to take place within the early weeks, with “like that” meaning “in the same way”, and the soul still breathed in after 120 days. Modern embryology agrees that the stages described (drop, clinging embryo, somite stage, bones and muscles) happen within roughly the first eight weeks. Both views are held by scholars; this book does not decide between them."),
    ("What scientists have said",
     "In the 1980s, the Canadian anatomist Prof. Keith L. Moore — author of the widely used textbook The Developing Human — studied these verses and hadith with Muslim scholars. He said that the descriptions were remarkably accurate for their time, and a 1983 edition of his textbook included “Islamic additions”. However, Moore did not become a Muslim; he said he remained a Christian. Other professors who spoke at the same conferences, such as Prof. T. V. N. Persaud and Prof. Marshall Johnson, are often quoted too."),
    ("How many scientists accepted Islam because of this?",
     "There is no reliable count. Stories circulate online — for example that the Thai anatomist Prof. Tejatat Tejasen said the shahādah at a conference in Saudi Arabia — but we could not find independent evidence for them, so this book does not repeat them as facts. It is also not true, as is sometimes claimed, that Keith Moore accepted Islam."),
    ("How a Muslim should view this",
     "A Muslim believes the Qur’an and the Sunnah are true because they come from Allah, not because science confirms them. Scientific knowledge grows and sometimes changes, so scholars warn against tying the meaning of a verse or hadith too tightly to the latest theory. When a description revealed 1,400 years ago agrees with what we see today, it increases a believer in faith and wonder — and the purpose of this hadith remains what it teaches: humility, belief in qadar, and striving for a good ending."),
  ],
  images=["his"],
  sources=[
    ("Qur’an, al-Mu’minūn 23:12–14", "https://quran.com/23/12-14"),
    ("Qur’an, al-Ḥajj 22:5", "https://quran.com/22/5"),
    ("Ṣaḥīḥ Muslim 2645a (Ḥudhayfah ibn Asīd: forty-two nights)", "https://sunnah.com/muslim:2645a"),
    ("Ṣaḥīḥ al-Bukhārī 4949 (“Work, for each person is eased…”)", "https://sunnah.com/bukhari:4949"),
    ("K. L. Moore, The Developing Human: Clinically Oriented Embryology, with Islamic Additions (Jeddah: Dar al-Qiblah, 1983)", ""),
    ("OpenStax, Anatomy & Physiology, 28.2 Embryonic Development", "https://openstax.org/books/anatomy-and-physiology/pages/28-2-embryonic-development"),
    ("Endowment for Human Development, Prenatal Development Timeline", "https://ehd.org/interactive_timeline_html.php?level=all"),
    ("UNSW Embryology, Carnegie Stages", "https://embryology.med.unsw.edu.au/embryology/index.php/Carnegie_Stages"),
  ],
)
