# -*- coding: utf-8 -*-
"""Short biographies of the narrating Companions.

A Companion's full biography is printed at his or her first hadith; later
hadith refer back to it.
"""

BIO = {
"umar": dict(name="ʿUmar ibn al-Khaṭṭāb", ar="عُمَرُ بْنُ الخَطَّابِ رَضِيَ اللَّهُ عَنْهُ", dates="d. 23 AH",
  text="Abū Ḥafṣ ʿUmar ibn al-Khaṭṭāb of Quraysh was at first a fierce enemy of Islam, until he heard the opening verses of Sūrah Ṭā-Hā and accepted Islam in Makkah around 6 years after the first revelation. The Prophet ﷺ had prayed for Islam to be strengthened by him, and after he became Muslim the believers prayed openly at the Kaʿbah. He was called **al-Fārūq** because Allah separated truth from falsehood through him. He became the second rightly guided caliph after Abū Bakr, ruled for ten years with famous justice and humility, founded the Hijri calendar, and saw Islam reach Shām, Iraq, Persia and Egypt. He was killed while leading the Fajr prayer in 23 AH and is buried beside the Prophet ﷺ and Abū Bakr."),
"ibnumar": dict(name="ʿAbdullāh ibn ʿUmar", ar="عَبْدُ اللَّهِ بْنُ عُمَرَ رَضِيَ اللَّهُ عَنْهُمَا", dates="d. 73 AH",
  text="The son of ʿUmar ibn al-Khaṭṭāb, he accepted Islam as a child in Makkah and emigrated with his father. He was too young for Badr and Uḥud, and his first battle was the Trench. He was famous for following the Sunnah in the smallest details — praying where the Prophet ﷺ prayed and stopping where he stopped — and for his night prayer, generosity and avoiding the disputes of his time. He is among the Companions who narrated the most hadith, and gave fatwas for sixty years. He died in Makkah in 73 AH, one of the last of the great Companions there."),
"ibnmasud": dict(name="ʿAbdullāh ibn Masʿūd", ar="عَبْدُ اللَّهِ بْنُ مَسْعُودٍ رَضِيَ اللَّهُ عَنْهُ", dates="d. 32 AH",
  text="A young shepherd of Makkah and among the first six people to accept Islam, he was the first to recite the Qur’an aloud at the Kaʿbah, and was beaten for it. He served the Prophet ﷺ closely, carrying his sandals and his siwāk. The Prophet ﷺ said: “Whoever would like to recite the Qur’an fresh as it was revealed, let him recite it like Ibn Umm ʿAbd.” He was one of the greatest scholars of the Qur’an and fiqh, and ʿUmar sent him to teach the people of Kūfah. He died in Madinah in 32 AH."),
"aishah": dict(name="ʿĀ’ishah bint Abī Bakr", ar="عَائِشَةُ أُمُّ المُؤْمِنِينَ رَضِيَ اللَّهُ عَنْهَا", dates="d. 57 AH",
  text="The daughter of Abū Bakr aṣ-Ṣiddīq and the beloved wife of the Prophet ﷺ, she is a Mother of the Believers. Allah declared her innocence in Sūrah an-Nūr. She had a sharp memory and deep understanding, and became one of the greatest scholars of the Ummah: senior Companions came to ask her about the Sunnah, fiqh, poetry and medicine. She narrated over two thousand hadith, especially about the Prophet’s ﷺ life at home. The Prophet ﷺ passed away in her room, with his head on her chest. She died in Madinah in 57 AH."),
"numan": dict(name="An-Nuʿmān ibn Bashīr", ar="النُّعْمَانُ بْنُ بَشِيرٍ رَضِيَ اللَّهُ عَنْهُمَا", dates="d. 65 AH",
  text="The first child born to the Anṣār after the Hijrah; his parents were both Companions. He was only about eight when the Prophet ﷺ died, yet he narrated this hadith clearly, pointing to his ears and saying he heard it himself. He later became a governor of Kūfah and Ḥimṣ, a judge and a poet, known for his gentleness. He was killed in the troubles of 65 AH."),
"tamim": dict(name="Tamīm ibn Aws ad-Dārī", ar="تَمِيمُ بْنُ أَوْسٍ الدَّارِيُّ رَضِيَ اللَّهُ عَنْهُ", dates="d. 40 AH",
  text="A Christian monk from Palestine who came to Madinah and accepted Islam in 9 AH. He was famous for long night prayers, sometimes reciting the whole Qur’an in one rakʿah. He was the first to light lamps in the Prophet’s Mosque. The Prophet ﷺ himself narrated from him the story of the Dajjāl (Muslim). This hadith on naṣīḥah is the only one Muslim records from him. He settled in Palestine and died around 40 AH."),
"abuhurayrah": dict(name="Abū Hurayrah", ar="أَبُو هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ", dates="d. 57 AH",
  text="ʿAbd ar-Raḥmān ibn Ṣakhr ad-Dawsī, from the tribe of Daws in Yemen, came to the Prophet ﷺ in 7 AH at the time of Khaybar. He was nicknamed ‘father of the little cat’ because he played with a kitten. He lived among the poor of the Ṣuffah and stayed by the Prophet ﷺ day and night for four years, often hungry, so that he would not miss anything. The Prophet ﷺ prayed for his memory, and he became the Companion who narrated the most hadith — over five thousand. He was later governor of Madinah and died there in 57 AH."),
"hasan": dict(name="Al-Ḥasan ibn ʿAlī", ar="الحَسَنُ بْنُ عَلِيٍّ رَضِيَ اللَّهُ عَنْهُمَا", dates="d. 49/50 AH",
  text="The grandson of the Prophet ﷺ, the son of ʿAlī and Fāṭimah, born in 3 AH. The Prophet ﷺ loved him dearly, carried him on his shoulders, called him ‘my sweet basil’, and said that he and al-Ḥusayn are the masters of the youth of Paradise. He foretold: “This son of mine is a master, and through him Allah will make peace between two great groups of Muslims.” This came true when al-Ḥasan gave up the caliphate in 41 AH to unite the Muslims. He died in Madinah in 49 or 50 AH."),
"anas": dict(name="Anas ibn Mālik", ar="أَنَسُ بْنُ مَالِكٍ رَضِيَ اللَّهُ عَنْهُ", dates="d. 93 AH",
  text="From the Anṣār, his mother Umm Sulaym brought him at ten years old to serve the Prophet ﷺ, which he did for ten years. He said: “He never once said ‘uff’ to me, nor asked me why I did something.” The Prophet ﷺ prayed for him to have much wealth and many children and a long life, and Allah answered: he lived to about a hundred and had a very large family. He narrated over two thousand hadith and was among the last Companions to die, in Basra in 93 AH."),
"shaddad": dict(name="Shaddād ibn Aws", ar="شَدَّادُ بْنُ أَوْسٍ رَضِيَ اللَّهُ عَنْهُ", dates="d. 58 AH",
  text="An Anṣārī Companion from Madinah, the nephew of Ḥassān ibn Thābit, the poet of the Prophet ﷺ. He was known for knowledge, wisdom and gentle speech; Abū ad-Dardā’ said that every people have a man of understanding and that Shaddād was theirs. He settled in Palestine, where he taught, and died there in 58 AH."),
"abudharr": dict(name="Abū Dharr al-Ghifārī", ar="أَبُو ذَرٍّ الغِفَارِيُّ رَضِيَ اللَّهُ عَنْهُ", dates="d. 32 AH",
  text="Jundub ibn Junādah of the tribe of Ghifār worshipped Allah alone even before Islam. He travelled to Makkah, accepted Islam among the very first, and announced it loudly at the Kaʿbah, for which he was beaten. He returned and brought much of his tribe to Islam. He was famous for honesty — the Prophet ﷺ said the earth has not carried anyone more truthful in speech — and for his zuhd and love of the poor. He died alone in ar-Rabadhah in 32 AH, as the Prophet ﷺ had foretold."),
"muadh": dict(name="Muʿādh ibn Jabal", ar="مُعَاذُ بْنُ جَبَلٍ رَضِيَ اللَّهُ عَنْهُ", dates="d. 18 AH",
  text="A young Anṣārī who accepted Islam as a teenager and attended the Pledge of ʿAqabah, Badr and all the battles. He was one of the few who gathered the Qur’an in the Prophet’s ﷺ lifetime. The Prophet ﷺ said he was the most knowledgeable of the Ummah about the halal and the haram, and once took his hand and said: “O Muʿādh, by Allah I love you.” He sent him to Yemen as a teacher and judge. He died in the plague of ʿAmwās in Shām in 18 AH, aged about 33."),
"ibnabbas": dict(name="ʿAbdullāh ibn ʿAbbās", ar="عَبْدُ اللَّهِ بْنُ عَبَّاسٍ رَضِيَ اللَّهُ عَنْهُمَا", dates="d. 68 AH",
  text="The cousin of the Prophet ﷺ, born three years before the Hijrah. He was about thirteen when the Prophet ﷺ died, yet the Prophet ﷺ had prayed for him: “O Allah, give him understanding of the religion and teach him interpretation.” After the Prophet’s ﷺ death he went from Companion to Companion collecting knowledge, sometimes sleeping at their doors. He became known as **the scholar of the Ummah** and the interpreter of the Qur’an, and ʿUmar sat him with the senior Companions. He died in aṭ-Ṭā’if in 68 AH."),
"abumasud": dict(name="Abū Masʿūd al-Badrī", ar="أَبُو مَسْعُودٍ البَدْرِيُّ رَضِيَ اللَّهُ عَنْهُ", dates="d. c. 40 AH",
  text="ʿUqbah ibn ʿAmr al-Anṣārī was one of the youngest at the Second Pledge of ʿAqabah. He is called al-Badrī because he lived at the well of Badr. He fought at Uḥud and later battles, settled in Kūfah, and was known for his knowledge. He died around 40 AH."),
"sufyan": dict(name="Sufyān ibn ʿAbdullāh ath-Thaqafī", ar="سُفْيَانُ بْنُ عَبْدِ اللَّهِ الثَّقَفِيُّ رَضِيَ اللَّهُ عَنْهُ", dates="",
  text="From the tribe of Thaqīf in aṭ-Ṭā’if, he came with the delegation of his people and accepted Islam in 9 AH. His request for ‘one statement about Islam’ shows his wish for clear, complete guidance. ʿUmar later appointed him to collect the zakah of aṭ-Ṭā’if."),
"jabir": dict(name="Jābir ibn ʿAbdullāh", ar="جَابِرُ بْنُ عَبْدِ اللَّهِ رَضِيَ اللَّهُ عَنْهُمَا", dates="d. 78 AH",
  text="An Anṣārī Companion who attended the Second Pledge of ʿAqabah as a boy with his father, who was later martyred at Uḥud. Jābir cared for his many sisters, and the Prophet ﷺ helped him pay his father’s debts with a blessing in his dates. He took part in nineteen expeditions and the Pledge of Riḍwān, travelled a month to hear a single hadith, and narrated over 1,500 hadith. He was among the last Companions to die in Madinah, in 78 AH."),
"abumalik": dict(name="Abū Mālik al-Ashʿarī", ar="أَبُو مَالِكٍ الأَشْعَرِيُّ رَضِيَ اللَّهُ عَنْهُ", dates="d. 18 AH",
  text="Al-Ḥārith ibn ʿĀṣim of the Ashʿarī tribe of Yemen came to Madinah with his people, whom the Prophet ﷺ praised for their soft hearts and generosity. He settled in Shām and died in the plague of ʿAmwās in 18 AH, in the same year as Muʿādh ibn Jabal."),
"nawwas": dict(name="An-Nawwās ibn Samʿān", ar="النَّوَّاسُ بْنُ سَمْعَانَ رَضِيَ اللَّهُ عَنْهُ", dates="",
  text="From the tribe of Kilāb, he stayed in Madinah for a whole year only to learn and ask the Prophet ﷺ questions. He narrated the long hadith about the Dajjāl and the descent of ʿĪsā in Muslim. He later settled in Shām."),
"wabisah": dict(name="Wābiṣah ibn Maʿbad", ar="وَابِصَةُ بْنُ مَعْبَدٍ رَضِيَ اللَّهُ عَنْهُ", dates="",
  text="Of the tribe of Asad, he came in 9 AH determined to ask about every kind of good and evil. Before he spoke, the Prophet ﷺ said: “You have come to ask about righteousness,” and taught him to consult his heart. He settled in Kūfah and later ar-Raqqah, where he died."),
"irbad": dict(name="Al-ʿIrbāḍ ibn Sāriyah", ar="العِرْبَاضُ بْنُ سَارِيَةَ رَضِيَ اللَّهُ عَنْهُ", dates="d. 75 AH",
  text="A poor Companion from the people of the Ṣuffah. He was among those who wept because they had no mount to join the expedition of Tabūk, about whom Allah revealed at-Tawbah 9:92. He settled in Ḥimṣ in Shām and died there in 75 AH."),
"abuthalabah": dict(name="Abū Thaʿlabah al-Khushanī", ar="أَبُو ثَعْلَبَةَ الخُشَنِيُّ رَضِيَ اللَّهُ عَنْهُ", dates="d. 75 AH",
  text="Jurthūm ibn Nāshir gave the Pledge of Riḍwān under the tree and was sent by the Prophet ﷺ to call his own people to Islam, who accepted. He settled in Shām. He used to pray that he would not suffer at death, and he died in sujūd while praying at night in 75 AH."),
"sahl": dict(name="Sahl ibn Saʿd as-Sāʿidī", ar="سَهْلُ بْنُ سَعْدٍ السَّاعِدِيُّ رَضِيَ اللَّهُ عَنْهُ", dates="d. 91 AH",
  text="An Anṣārī who was fifteen when the Prophet ﷺ died. His name was Ḥazn (‘sadness’) and the Prophet ﷺ changed it to Sahl (‘ease’). He lived long and is said to be the last Companion to die in Madinah, in 91 AH, at about a hundred years old."),
"abusaid": dict(name="Abū Saʿīd al-Khudrī", ar="أَبُو سَعِيدٍ الخُدْرِيُّ رَضِيَ اللَّهُ عَنْهُ", dates="d. 74 AH",
  text="Saʿd ibn Mālik ibn Sinān al-Anṣārī tried to join Uḥud at thirteen but was sent home for being too young; his father was martyred there. He then joined twelve expeditions. He became one of the jurists among the young Companions and narrated over a thousand hadith. He was known for speaking the truth to rulers, as when he objected to Marwān’s change of the Eid sermon. He died in Madinah in 74 AH."),
"abdullahibnamr": dict(name="ʿAbdullāh ibn ʿAmr ibn al-ʿĀṣ", ar="عَبْدُ اللَّهِ بْنُ عَمْرٍو رَضِيَ اللَّهُ عَنْهُمَا", dates="d. 65 AH",
  text="He accepted Islam before his father ʿAmr ibn al-ʿĀṣ. He could read and write, and with the Prophet’s ﷺ permission wrote down hadith in a collection called aṣ-Ṣaḥīfah aṣ-Ṣādiqah. He was very devoted to worship, fasting every day and reciting the whole Qur’an every night, until the Prophet ﷺ told him to be moderate: “Your body has a right over you.” He died in 65 AH."),
"abumusa": dict(name="Abū Mūsā al-Ashʿarī", ar="أَبُو مُوسَى الأَشْعَرِيُّ رَضِيَ اللَّهُ عَنْهُ", dates="d. c. 44 AH",
  text="ʿAbdullāh ibn Qays of the Ashʿarīs of Yemen. His recitation was so beautiful that the Prophet ﷺ said he had been given ‘one of the flutes of the family of Dāwūd’. The Prophet ﷺ sent him with Muʿādh to teach Yemen, and ʿUmar made him governor of Basra and Kūfah, where he taught the Qur’an and fiqh. He died around 44 AH."),
"miqdam": dict(name="Al-Miqdām ibn Maʿdī Karib", ar="المِقْدَامُ بْنُ مَعْدِي كَرِبَ رَضِيَ اللَّهُ عَنْهُ", dates="d. 87 AH",
  text="From the tribe of Kindah in Yemen, he came with its delegation in 10 AH. He settled in Ḥimṣ in Shām, where the scholars of the Successors learned from him, and he died there in 87 AH."),
"ibnbusr": dict(name="ʿAbdullāh ibn Busr al-Māzinī", ar="عَبْدُ اللَّهِ بْنُ بُسْرٍ رَضِيَ اللَّهُ عَنْهُ", dates="d. 88 AH",
  text="He and his family were young Companions; the Prophet ﷺ visited their home, ate there and made du‘a for them. The Prophet ﷺ placed his hand on his head and said he would live a century, and he did. He settled in Ḥimṣ and was among the last Companions to die in Shām, in 88 AH."),
}

NARRATORS = {
1: ["umar"], 2: ["umar"], 3: ["ibnumar"], 4: ["ibnmasud"], 5: ["aishah"], 6: ["numan"], 7: ["tamim"], 8: ["ibnumar"],
9: ["abuhurayrah"], 10: ["abuhurayrah"], 11: ["hasan"], 12: ["abuhurayrah"], 13: ["anas"], 14: ["ibnmasud"],
15: ["abuhurayrah"], 16: ["abuhurayrah"], 17: ["shaddad"], 18: ["abudharr", "muadh"], 19: ["ibnabbas"], 20: ["abumasud"],
21: ["sufyan"], 22: ["jabir"], 23: ["abumalik"], 24: ["abudharr"], 25: ["abudharr"], 26: ["abuhurayrah"],
27: ["nawwas", "wabisah"], 28: ["irbad"], 29: ["muadh"], 30: ["abuthalabah"], 31: ["sahl"], 32: ["abusaid"],
33: ["ibnabbas"], 34: ["abusaid"], 35: ["abuhurayrah"], 36: ["abuhurayrah"], 37: ["ibnabbas"], 38: ["abuhurayrah"],
39: ["ibnabbas"], 40: ["ibnumar"], 41: ["abdullahibnamr"], 42: ["anas"], 43: ["ibnabbas"], 44: ["aishah"],
45: ["jabir"], 46: ["abumusa"], 47: ["miqdam"], 48: ["abdullahibnamr"], 49: ["umar"], 50: ["ibnbusr", "muadh"],
}

# A line about the occasion of the hadith, where it adds something.
CONTEXT = {
2: "ʿUmar was present in the gathering and saw the visit of Jibrīl in the form of a man.",
16: "In a narration of Aḥmad, the man who asked is named as Jāriyah ibn Qudāmah.",
22: "The man who asked is named in Muslim as an-Nuʿmān ibn Qawqal.",
24: "When the Successor Abū Idrīs al-Khawlānī narrated this hadith, he would kneel down out of respect for it.",
40: "The Prophet ﷺ took Ibn ʿUmar by the shoulder to draw his full attention.",
44: "This was said when ʿĀ’ishah’s foster-uncle Aflaḥ asked permission to enter her house.",
46: "Abū Burdah, who narrates it from his father, was a Successor and later a judge of Kūfah.",
}


def first_seen():
    seen = {}
    for n in sorted(NARRATORS):
        for k in NARRATORS[n]:
            seen.setdefault(k, n)
    return seen
