"""Text content of the Zaad planner: the hadith behind each tick, the weekly hadith, month themes."""

# ---------------------------------------------------------------------------
# The hadith behind every tick. The number is printed next to the tick on the daily page.
# (key, tick label, hadith, reference)
# ---------------------------------------------------------------------------
EVIDENCE = [
    ("ontime", "Prayer on time",
     "The Prophet ﷺ was asked, “Which deed is most beloved to Allah?” He said, “Prayer at its proper time.”",
     "al-Bukhari 527, Muslim 85"),
    ("jamaah", "Prayer in congregation",
     "“Prayer in congregation is twenty-seven degrees better than prayer offered alone.”",
     "al-Bukhari 645, Muslim 650"),
    ("rawatib", "The twelve sunnah rak'ahs",
     "“Whoever prays twelve rak'ahs in a day and a night, a house will be built for him in Paradise.” "
     "They are four before Dhuhr and two after it, two after Maghrib, two after 'Isha and two before Fajr.",
     "Muslim 728; at-Tirmidhi 415"),
    ("fajr2", "Two rak'ahs before Fajr",
     "“The two rak'ahs of Fajr are better than this world and all that is in it.”",
     "Muslim 725"),
    ("tasbih", "Dhikr after each prayer",
     "“Whoever glorifies Allah thirty-three times after every prayer, praises Him thirty-three times and "
     "magnifies Him thirty-three times, that is ninety-nine, and completes the hundred with <i>La ilaha illa "
     "Allah, wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir</i>, his sins "
     "are forgiven even if they are like the foam of the sea.”",
     "Muslim 597"),
    ("adhkar", "Morning and evening adhkar",
     "“Whoever says <i>Subhan Allahi wa bihamdih</i> one hundred times in the morning and in the evening, no one "
     "will come on the Day of Resurrection with anything better, except one who said the same or more.”",
     "Muslim 2692"),
    ("quran", "Qur'an every day",
     "“Recite the Qur'an, for it will come on the Day of Resurrection as an intercessor for its companions.”",
     "Muslim 804"),
    ("duha", "Duha prayer",
     "Abu Hurayrah said: “My close friend ﷺ advised me to do three things: to fast three days of every month, "
     "to pray the two rak'ahs of Duha, and to pray Witr before I sleep.”",
     "al-Bukhari 1981, Muslim 721"),
    ("witr", "Witr",
     "“Make Witr the last of your prayer at night.”",
     "al-Bukhari 998, Muslim 751"),
    ("qiyam", "Night prayer",
     "“The best prayer after the obligatory prayers is prayer in the depth of the night.”",
     "Muslim 1163"),
    ("istighfar", "Istighfar",
     "“By Allah, I seek Allah's forgiveness and turn to Him in repentance more than seventy times a day.”",
     "al-Bukhari 6307"),
    ("salawat", "Salawat on the Prophet ﷺ",
     "“Whoever sends blessings upon me once, Allah sends blessings upon him ten times.”",
     "Muslim 408"),
    ("sadaqah", "Sadaqah, however small",
     "“Protect yourselves from the Fire, even with half a date; and whoever does not find that, then with a "
     "kind word.”",
     "al-Bukhari and Muslim (Muslim 1016)"),
    ("kin", "Parents and kin",
     "“Whoever would like his provision to be increased and his life to be extended, let him keep the ties of "
     "kinship.”",
     "al-Bukhari 5986, Muslim 2557"),
    ("tongue", "Guarding the tongue",
     "“Whoever believes in Allah and the Last Day, let him speak good or remain silent.”",
     "al-Bukhari 6018, Muslim 47"),
    ("siwak", "Siwak",
     "“Were it not that I would burden my ummah, I would have ordered them to use the siwak at every prayer.”",
     "al-Bukhari 887, Muslim 252"),
    ("sleep", "Sleeping with wudu, on the right side",
     "“When you go to your bed, perform wudu as you do for prayer, then lie down on your right side.”",
     "al-Bukhari 247, Muslim 2710"),
    ("kursi", "Ayat al-Kursi before sleep",
     "“When you go to your bed, recite Ayat al-Kursi. A guardian from Allah will remain over you, and no devil "
     "will come near you until morning.”",
     "al-Bukhari 2311"),
    ("baqarah", "The last two verses of al-Baqarah",
     "“Whoever recites the last two verses of Surat al-Baqarah at night, they will suffice him.”",
     "al-Bukhari 5009, Muslim 808"),
    ("constant", "Small and constant",
     "“The most beloved of deeds to Allah are the most consistent of them, even if they are few.”",
     "al-Bukhari 6464, Muslim 783"),
    ("smile", "A cheerful face",
     "“Do not belittle any good deed, even meeting your brother with a cheerful face.”",
     "Muslim 2626"),
    ("shukr", "Gratitude and patience",
     "“How wonderful is the affair of the believer, for all of his affair is good. If something good happens to "
     "him he is grateful, and that is good for him. If hardship befalls him he is patient, and that is good for "
     "him.”",
     "Muslim 2999"),
]
EV_NUM = {e[0]: i + 1 for i, e in enumerate(EVIDENCE)}

# Weekly and seasonal ticks. (key, tick label, hadith, reference)
SEASONAL = [
    ("jumuah", "Friday: ghusl, perfume, early and silent",
     "“Whoever takes a bath on Friday, purifies himself as much as he can, uses his oil or the perfume of his "
     "house, then goes out and does not separate two people, prays what is written for him and remains silent "
     "while the imam speaks, his sins between that Friday and the last are forgiven.”",
     "al-Bukhari 883"),
    ("kahf", "Friday: Surat al-Kahf",
     "“Whoever recites Surat al-Kahf on Friday, a light will shine for him between the two Fridays.”",
     "al-Hakim and al-Bayhaqi; graded sahih by al-Albani"),
    ("hour", "Friday: the hour of response",
     "“On Friday there is an hour in which no Muslim stands praying and asks Allah for something, but He gives "
     "it to him.” Many scholars hold it is the last hour after 'Asr.",
     "al-Bukhari 935, Muslim 852"),
    ("monthu", "Fasting Monday and Thursday",
     "“Deeds are presented on Monday and Thursday, and I love that my deeds are presented while I am fasting.”",
     "at-Tirmidhi 747"),
    ("white", "Fasting the white days (13, 14, 15)",
     "“If you fast three days of the month, then fast the thirteenth, fourteenth and fifteenth.”",
     "at-Tirmidhi 761, an-Nasa'i"),
    ("ramadan", "Fasting Ramadan",
     "“Whoever fasts Ramadan with faith and hoping for reward, his previous sins are forgiven.”",
     "al-Bukhari 38, Muslim 760"),
    ("taraweeh", "Standing in prayer in Ramadan",
     "“Whoever stands in prayer in Ramadan with faith and hoping for reward, his previous sins are forgiven.”",
     "al-Bukhari 37, Muslim 759"),
    ("suhoor", "Suhoor",
     "“Take suhoor, for in suhoor there is blessing.”",
     "al-Bukhari 1923, Muslim 1095"),
    ("iftar", "Breaking the fast without delay",
     "“The people will remain upon goodness as long as they hasten to break the fast.”",
     "al-Bukhari 1957, Muslim 1098"),
    ("qadr", "Laylat al-Qadr",
     "“Seek Laylat al-Qadr in the odd nights of the last ten nights of Ramadan.” 'A'ishah asked what to say on "
     "it, and he taught her: <i>Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni</i>. O Allah, You are "
     "Pardoning and love to pardon, so pardon me.",
     "al-Bukhari 2017; at-Tirmidhi 3513"),
    ("shawwal", "Six days of Shawwal",
     "“Whoever fasts Ramadan and then follows it with six days of Shawwal, it is as if he fasted the whole "
     "year.”",
     "Muslim 1164"),
    ("tendays", "The first ten days of Dhul-Hijjah",
     "“There are no days in which righteous deeds are more beloved to Allah than these ten days.”",
     "al-Bukhari 969; Abu Dawud 2438"),
    ("arafah", "Fasting 'Arafah and 'Ashura",
     "“Fasting the day of 'Arafah, I hope from Allah that it expiates the year before it and the year after it. "
     "Fasting the day of 'Ashura, I hope from Allah that it expiates the year before it.”",
     "Muslim 1162"),
    ("tashriq", "The days of Tashriq",
     "“The days of Tashriq are days of eating, drinking and remembering Allah.” They are not fasted.",
     "Muslim 1141"),
]
SEA = {s[0]: s for s in SEASONAL}

# ---------------------------------------------------------------------------
# Hadith of the week. (title, text, reference, action for the week)
# ---------------------------------------------------------------------------
WEEKLY = [
    ("Begin with the intention",
     "“Actions are only by intentions, and every person will have only what he intended.”",
     "al-Bukhari 1, Muslim 1907",
     "Before each task this week, pause and name who it is for."),
    ("The five pillars",
     "“Islam is built upon five: testifying that none has the right to be worshipped but Allah and that "
     "Muhammad is the Messenger of Allah, establishing the prayer, giving zakah, the pilgrimage to the House, "
     "and fasting Ramadan.”",
     "al-Bukhari 8, Muslim 16",
     "Choose the pillar you are weakest in and strengthen one part of it."),
    ("Leave what does not concern you",
     "“Part of the excellence of a person's Islam is his leaving what does not concern him.”",
     "at-Tirmidhi 2317",
     "Cut one source of idle talk or scrolling for seven days."),
    ("Love for your brother",
     "“None of you truly believes until he loves for his brother what he loves for himself.”",
     "al-Bukhari 13, Muslim 45",
     "Make dua by name for someone who has what you wish for."),
    ("Do not become angry",
     "A man said to the Prophet ﷺ, “Advise me.” He said, “Do not become angry.” The man repeated his request "
     "several times, and each time he said, “Do not become angry.”",
     "al-Bukhari 6116",
     "When anger rises: seek refuge in Allah, be silent, change your posture."),
    ("The gates are opened",
     "“When Ramadan comes, the gates of Paradise are opened, the gates of the Fire are closed, and the devils "
     "are chained.”",
     "al-Bukhari 1899, Muslim 1079",
     "Prepare: settle debts of fasting, plan your Qur'an, clear your schedule."),
    ("Fasting is for Allah",
     "Allah said: “Every deed of the son of Adam is for him, except fasting. It is for Me, and I shall reward "
     "for it.” Fasting is a shield. The fasting person has two joys: one when he breaks his fast, and one when "
     "he meets his Lord.",
     "al-Bukhari 1904, Muslim 1151",
     "Guard the fast of the eyes, ears and tongue along with the stomach."),
    ("More than hunger",
     "“Whoever does not give up false speech and acting upon it, Allah has no need of his giving up his food "
     "and drink.”",
     "al-Bukhari 1903",
     "No lying, no backbiting, no arguing. If provoked say: I am fasting."),
    ("The most generous of people",
     "“The Messenger of Allah ﷺ was the most generous of people, and he was most generous in Ramadan when "
     "Jibril met him. Jibril would meet him every night of Ramadan and review the Qur'an with him.”",
     "al-Bukhari 6, Muslim 2308",
     "Give something every day this week, and review Qur'an with a companion."),
    ("Seek the Night of Decree",
     "“Whoever stands in prayer on Laylat al-Qadr with faith and hoping for reward, his previous sins are "
     "forgiven.”",
     "al-Bukhari 1901, Muslim 760",
     "Treat every one of the last ten nights as if it were the night."),
    ("Follow it with six",
     "“Whoever fasts Ramadan and then follows it with six days of Shawwal, it is as if he fasted the whole "
     "year.”",
     "Muslim 1164",
     "Keep one Ramadan habit alive, and plan your six days of Shawwal."),
    ("Taqwa wherever you are",
     "“Fear Allah wherever you are, follow a bad deed with a good deed and it will wipe it out, and treat "
     "people with good character.”",
     "at-Tirmidhi 1987",
     "After any slip this week, follow it at once with a good deed."),
    ("Be mindful of Allah",
     "“Be mindful of Allah and He will protect you. Be mindful of Allah and you will find Him before you. When "
     "you ask, ask Allah. When you seek help, seek help from Allah.”",
     "at-Tirmidhi 2516",
     "Take your need to Allah in sujud before you take it to anyone else."),
    ("Leave what makes you doubt",
     "“Leave what makes you doubt for what does not make you doubt.”",
     "at-Tirmidhi 2518, an-Nasa'i",
     "Drop one doubtful thing from your income, food or habits."),
    ("Purity is half of faith",
     "“Purity is half of faith. <i>Alhamdulillah</i> fills the scale. Prayer is light, charity is proof, "
     "patience is illumination, and the Qur'an is a proof for you or against you.”",
     "Muslim 223",
     "Stay in wudu as much as you can, and renew it with care."),
    ("A traveller in this world",
     "“Be in this world as though you were a stranger or a traveller.”",
     "al-Bukhari 6416",
     "Give away something you own but do not need."),
    ("Excellence in everything",
     "“Allah has prescribed excellence in all things.”",
     "Muslim 1955",
     "Pick one ordinary task and do it with ihsan from start to finish."),
    ("The strong believer",
     "“The strong believer is better and more beloved to Allah than the weak believer, and in both there is "
     "good. Strive for what benefits you, seek the help of Allah, and do not give up.”",
     "Muslim 2664",
     "Build strength: one habit for the body, one for the heart."),
    ("The ten best days",
     "“There are no days in which righteous deeds are more beloved to Allah than these ten days.”",
     "al-Bukhari 969",
     "Fill the ten days with takbir, fasting, charity and Qur'an."),
    ("Two blessings",
     "“There are two blessings which many people lose out on: health and free time.”",
     "al-Bukhari 6412",
     "Give your best free hour this week to something that outlives you."),
    ("True strength",
     "“The strong man is not the one who overpowers others. The strong man is the one who controls himself "
     "when he is angry.”",
     "al-Bukhari 6114, Muslim 2609",
     "Win one argument this week by not having it."),
    ("Safe from your tongue and hand",
     "“The Muslim is the one from whose tongue and hand the Muslims are safe.”",
     "al-Bukhari 10, Muslim 40",
     "No message, comment or word that harms a Muslim."),
    ("Make things easy",
     "“Make things easy and do not make them difficult. Give glad tidings and do not drive people away.”",
     "al-Bukhari 69, Muslim 1734",
     "Make one thing easier for someone at home or at work."),
    ("The path of knowledge",
     "“Whoever treads a path seeking knowledge, Allah will make easy for him a path to Paradise.”",
     "Muslim 2699",
     "Fix a time for one lesson or one chapter, and attend it."),
    ("The best of you",
     "“The best of you are those who learn the Qur'an and teach it.”",
     "al-Bukhari 5027",
     "Learn one new ayah with its meaning and teach it to someone."),
    ("Two rewards",
     "“The one who is skilled in the Qur'an is with the noble, righteous scribes. The one who recites it and "
     "stumbles over it, finding it difficult, has two rewards.”",
     "al-Bukhari 4937, Muslim 798",
     "Read aloud every day, however slowly."),
    ("Three that continue",
     "“When a person dies his deeds come to an end, except for three: ongoing charity, knowledge that is "
     "benefited from, or a righteous child who prays for him.”",
     "Muslim 1631",
     "Start one deed that will keep working after you."),
    ("Charity does not decrease wealth",
     "“Charity does not decrease wealth. Allah increases a servant in honour when he forgives. No one humbles "
     "himself for Allah except that Allah raises him.”",
     "Muslim 2588",
     "Give, forgive and step back, once each."),
    ("One body",
     "“The believers, in their mutual love, mercy and compassion, are like one body. When one limb aches, the "
     "whole body responds with sleeplessness and fever.”",
     "al-Bukhari 6011, Muslim 2586",
     "Visit, call or support a Muslim who is in hardship."),
    ("Hearts and deeds",
     "“Allah does not look at your appearance or your wealth. He looks at your hearts and your deeds.”",
     "Muslim 2564",
     "Do one good deed that no one will ever know about."),
    ("Best in character",
     "“The most complete of the believers in faith are those with the best character, and the best of you are "
     "those who are best to their wives.”",
     "at-Tirmidhi 1162",
     "Be at your gentlest with the people of your own home."),
    ("Best to his family",
     "“The best of you is the one who is best to his family, and I am the best of you to my family.”",
     "at-Tirmidhi 3895",
     "Serve your family with your own hands this week."),
    ("Mercy to the young, honour to the old",
     "“He is not one of us who does not show mercy to our young and respect to our elders.”",
     "at-Tirmidhi 1919",
     "Give a child your full attention and an elder your time."),
    ("The merciful are shown mercy",
     "“The merciful are shown mercy by the Most Merciful. Be merciful to those on the earth, and the One above "
     "the heavens will have mercy upon you.”",
     "at-Tirmidhi 1924, Abu Dawud 4941",
     "Show mercy to a person, an animal and yourself."),
    ("Your mother",
     "A man asked, “O Messenger of Allah, who is most deserving of my good company?” He said, “Your mother.” "
     "He asked, “Then who?” He said, “Your mother.” He asked, “Then who?” He said, “Your mother.” He asked, "
     "“Then who?” He said, “Your father.”",
     "al-Bukhari 5971, Muslim 2548",
     "Honour your parents: a call, a gift, a service, or dua if they have passed."),
    ("The neighbour",
     "“Jibril kept advising me about the neighbour until I thought he would make him an heir.”",
     "al-Bukhari 6014, Muslim 2624",
     "Greet a neighbour and share food with one."),
    ("Every kindness is charity",
     "“Every act of kindness is charity.”",
     "al-Bukhari 6021, Muslim 1005",
     "Count seven small kindnesses, one for each day."),
    ("The branches of faith",
     "“Faith has seventy-odd branches. The highest is saying <i>La ilaha illa Allah</i>, the lowest is removing "
     "something harmful from the path, and modesty is a branch of faith.”",
     "Muslim 35",
     "Remove a harm from someone's path, in the street or in life."),
    ("Truthfulness",
     "“Truthfulness leads to righteousness, and righteousness leads to Paradise. A man keeps telling the truth "
     "until he is written with Allah as truthful.”",
     "al-Bukhari 6094, Muslim 2607",
     "Tell the whole truth, including in jokes and excuses."),
    ("Three signs",
     "“The signs of the hypocrite are three: when he speaks he lies, when he promises he breaks it, and when he "
     "is trusted he betrays.”",
     "al-Bukhari 33, Muslim 59",
     "Keep every promise and return every trust, however small."),
    ("Beware of suspicion",
     "“Beware of suspicion, for suspicion is the most false of speech. Do not spy on one another, do not envy "
     "one another, do not hate one another. Be servants of Allah, as brothers.”",
     "al-Bukhari 6064, Muslim 2563",
     "Give seventy excuses before you believe one bad thought."),
    ("What backbiting is",
     "“Do you know what backbiting is? It is to mention your brother with what he dislikes.”",
     "Muslim 2589",
     "Leave any gathering or chat the moment someone absent is discussed."),
    ("Gentleness",
     "“Gentleness is not found in anything except that it beautifies it, and it is not removed from anything "
     "except that it makes it ugly.”",
     "Muslim 2594",
     "Lower your voice and soften your words in every correction."),
    ("Even the prick of a thorn",
     "“No fatigue, illness, worry, grief, harm or distress befalls a Muslim, even the prick of a thorn, except "
     "that Allah expiates some of his sins by it.”",
     "al-Bukhari 5641, Muslim 2573",
     "Meet one hardship this week with <i>Alhamdulillah</i> and patience."),
    ("Look at those below you",
     "“Look at those who are below you and do not look at those who are above you, so that you do not belittle "
     "the favours of Allah upon you.”",
     "Muslim 2963",
     "Write ten blessings you have never thanked Allah for."),
    ("True richness",
     "“Richness is not in having many possessions. True richness is the richness of the soul.”",
     "al-Bukhari 6446, Muslim 1051",
     "Buy nothing you do not need for seven days."),
    ("The work of your hand",
     "“No one has ever eaten better food than what he eats from the work of his own hand.”",
     "al-Bukhari 2072",
     "Work with honesty and ask Allah for halal, blessed provision."),
    ("Easy in buying and selling",
     "“May Allah have mercy on a man who is easygoing when he sells, when he buys and when he asks for "
     "payment.”",
     "al-Bukhari 2076",
     "Be generous in a deal, and give time to someone who owes you."),
    ("As the birds are provided for",
     "“If you were to rely upon Allah as He should be relied upon, He would provide for you as He provides for "
     "the birds. They go out hungry in the morning and return full in the evening.”",
     "at-Tirmidhi 2344",
     "Do your part fully, then leave the result to Allah."),
    ("As My servant thinks of Me",
     "Allah says: “I am as My servant thinks of Me, and I am with him when he remembers Me.”",
     "al-Bukhari 7405, Muslim 2675",
     "Make dua this week with certainty that you are heard."),
    ("The living and the dead",
     "“The example of the one who remembers his Lord and the one who does not is like the living and the "
     "dead.”",
     "al-Bukhari 6407",
     "Fill your waiting time with dhikr: queues, travel, chores."),
    ("Two words",
     "“Two words are light on the tongue, heavy in the scale and beloved to the Most Merciful: <i>Subhan "
     "Allahi wa bihamdih, Subhan Allahil-'Azim</i>.”",
     "al-Bukhari 6406, Muslim 2694",
     "Say them a hundred times each day."),
    ("The last third of the night",
     "“Our Lord descends every night to the lowest heaven when the last third of the night remains, and says: "
     "Who is calling upon Me, that I may answer him? Who is asking of Me, that I may give him? Who is seeking "
     "My forgiveness, that I may forgive him?”",
     "al-Bukhari 1145, Muslim 758",
     "Rise before Fajr at least twice, even for two rak'ahs."),
    ("The best of those who err",
     "“Every son of Adam errs, and the best of those who err are those who repent.”",
     "at-Tirmidhi 2499, Ibn Majah 4251",
     "Name one sin, leave it, regret it, and resolve not to return."),
    ("Asked about four",
     "“The feet of a servant will not move on the Day of Resurrection until he is asked about his life and how "
     "he spent it, his knowledge and what he did with it, his wealth, from where he earned it and on what he "
     "spent it, and his body and how he used it.”",
     "at-Tirmidhi 2417",
     "Answer the four questions in writing, honestly."),
    ("Guide to good",
     "“Whoever guides to something good has a reward like that of the one who does it.”",
     "Muslim 1893",
     "Share one benefit you learned this year with someone who needs it."),
    ("Deeds are by their endings",
     "“Deeds are only judged by their endings.”",
     "al-Bukhari 6607",
     "End the year well: repent, forgive, settle what you owe, and renew your intention."),
]
# index in WEEKLY -> placement rule handled in build.py
SEASON_WEEK_TITLES = {
    "pre_ramadan": "The gates are opened",
    "ramadan1": "Fasting is for Allah",
    "ramadan2": "More than hunger",
    "ramadan3": "The most generous of people",
    "ramadan4": "Seek the Night of Decree",
    "shawwal": "Follow it with six",
    "dhulhijjah": "The ten best days",
    "last": "Deeds are by their endings",
}

# ---------------------------------------------------------------------------
# Months: (theme, ayah, reference, accent, soft tint)
# ---------------------------------------------------------------------------
MONTHS = [
    ("Renewal", "Indeed, Allah will not change the condition of a people until they change what is in themselves.",
     "ar-Ra'd 13:11", "#0f5a4f", "#e3f0ec"),
    ("The month of the Qur'an", "The month of Ramadan in which the Qur'an was revealed, a guidance for mankind "
     "and clear proofs of guidance and the criterion.", "al-Baqarah 2:185", "#5b3a8c", "#ece6f5"),
    ("Gratitude", "If you are grateful, I will surely increase you.", "Ibrahim 14:7", "#1d6a8a", "#e2f0f5"),
    ("Steadfastness", "So when you have finished, then stand up for worship, and to your Lord direct your "
     "longing.", "ash-Sharh 94:7-8", "#8a5a1d", "#f6ecdd"),
    ("Sacrifice", "Say: Indeed my prayer, my sacrifice, my living and my dying are for Allah, Lord of the "
     "worlds.", "al-An'am 6:162", "#7a2e3a", "#f5e4e7"),
    ("Hijrah", "Whoever emigrates for the cause of Allah will find on the earth many places of refuge and "
     "abundance.", "an-Nisa' 4:100", "#1d4e7a", "#e4edf6"),
    ("Trust in Allah", "Whoever relies upon Allah, He is sufficient for him.", "at-Talaq 65:3",
     "#2f6b3a", "#e5f1e6"),
    ("The best example", "There has certainly been for you in the Messenger of Allah an excellent example.",
     "al-Ahzab 33:21", "#9a4a1f", "#f7e8de"),
    ("Knowledge", "And say: My Lord, increase me in knowledge.", "Ta-Ha 20:114", "#3b4a8c", "#e6e9f5"),
    ("Patience", "O you who believe, seek help through patience and prayer. Indeed, Allah is with the "
     "patient.", "al-Baqarah 2:153", "#6b2d5c", "#f3e6ef"),
    ("Remembrance", "Truly, in the remembrance of Allah do hearts find rest.", "ar-Ra'd 13:28",
     "#0f6470", "#e0f0f2"),
    ("Taking account", "O you who believe, fear Allah, and let every soul look to what it has sent forth for "
     "tomorrow.", "al-Hashr 59:18", "#4a4034", "#eeeae3"),
]

HIJRI_MONTHS = [
    ("Muharram", "مُحَرَّم"), ("Safar", "صَفَر"), ("Rabi' al-Awwal", "رَبِيع الأَوَّل"),
    ("Rabi' al-Akhir", "رَبِيع الآخِر"), ("Jumada al-Ula", "جُمَادَى الأُولَى"),
    ("Jumada al-Akhirah", "جُمَادَى الآخِرَة"), ("Rajab", "رَجَب"), ("Sha'ban", "شَعْبَان"),
    ("Ramadan", "رَمَضَان"), ("Shawwal", "شَوَّال"), ("Dhul-Qa'dah", "ذُو القَعْدَة"),
    ("Dhul-Hijjah", "ذُو الحِجَّة"),
]
WEEKDAYS_AR = ["الإِثْنَيْن", "الثُّلَاثَاء", "الأَرْبِعَاء", "الخَمِيس", "الجُمُعَة", "السَّبْت", "الأَحَد"]

# Essential adhkar. The Arabic is taken from the Hisnul Muslim data in this repository
# (matched by the opening words); the English is given here.
ADHKAR = [
    ("On waking", "الحمد لله الذي احيانا بعد ما اماتنا",
     "All praise is for Allah who gave us life after He had caused us to die, and to Him is the resurrection.",
     "al-Bukhari 6312", ""),
    ("Morning and evening: the master of istighfar", "اللهم انت ربي لا اله الا انت خلقتني",
     "O Allah, You are my Lord. None has the right to be worshipped but You. You created me and I am Your "
     "servant, and I keep Your covenant and promise as best I can. I seek refuge in You from the evil of what I "
     "have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives "
     "sins but You.",
     "al-Bukhari 6306", "Whoever says it with certainty in the day or night and dies before the next is of the people of Paradise."),
    ("Morning and evening: three times", "بسم الله الذي لا يضر مع اسمه شيء",
     "In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the "
     "All-Hearing, the All-Knowing.",
     "Abu Dawud 5088, at-Tirmidhi 3388", "Nothing will harm the one who says it three times."),
    ("After the salam", "اللهم انت السلام ومنك السلام",
     "I seek Allah's forgiveness (three times). O Allah, You are Peace and from You is peace. Blessed are You, "
     "Possessor of majesty and honour.",
     "Muslim 591", ""),
    ("After Fajr", "اللهم اني اسالك علما نافعا",
     "O Allah, I ask You for knowledge that benefits, provision that is good, and deeds that are accepted.",
     "Ibn Majah 925", ""),
    ("Before sleep", "باسمك اللهم اموت واحيا",
     "In Your name, O Allah, I die and I live.",
     "al-Bukhari 6324", ""),
]
