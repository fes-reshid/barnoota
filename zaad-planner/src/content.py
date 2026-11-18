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
     "“The best prayer after the obligatory prayer is the night prayer.”",
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
     "“Were it not that I would burden my ummah, or the people, I would have ordered them to use the siwak at every prayer.”",
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
     "“How wonderful is the affair of the believer, for all of his affair is good, and this is for no one but the "
     "believer. If something good happens to "
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
     "“There are no days in which righteous deeds are more beloved to Allah than these days,” meaning the first "
     "ten days of Dhul-Hijjah.",
     "Abu Dawud 2438; al-Bukhari 969"),
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
     "“Purity is half of faith. <i>Alhamdulillah</i> fills the scale. <i>Subhan Allah wal-hamdulillah</i> fill "
     "what is between the heavens and the earth. Prayer is light, charity is proof, patience is illumination, "
     "and the Qur'an is a proof for you or against you.”",
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
     "“There are no days in which righteous deeds are more beloved to Allah than these days,” meaning the first "
     "ten days of Dhul-Hijjah.",
     "Abu Dawud 2438; al-Bukhari 969",
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
     "“Faith has seventy-odd, or sixty-odd, branches. The highest is saying <i>La ilaha illa Allah</i>, the lowest is removing "
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
     "“Beware of suspicion, for suspicion is the most false of speech. Do not pry, do not spy, do not envy one "
     "another, do not turn your backs on one another, do not hate one another. Be servants of Allah, as brothers.”",
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

# ---------------------------------------------------------------------------
# A name of Allah for each week. (transliteration, Arabic, meaning)
# "Allah has ninety-nine names. Whoever preserves them will enter Paradise." al-Bukhari 2736, Muslim 2677
# ---------------------------------------------------------------------------
NAMES = [
    ("Ar-Rahman", "الرَّحْمَنُ", "The Most Merciful"), ("Ar-Rahim", "الرَّحِيمُ", "The Bestower of Mercy"),
    ("Al-Malik", "المَلِكُ", "The King"), ("Al-Quddus", "القُدُّوسُ", "The Most Holy"),
    ("As-Salam", "السَّلَامُ", "The Source of Peace"), ("Al-Mu'min", "المُؤْمِنُ", "The Giver of Security"),
    ("Al-Muhaymin", "المُهَيْمِنُ", "The Guardian over All"), ("Al-'Aziz", "العَزِيزُ", "The Almighty"),
    ("Al-Jabbar", "الجَبَّارُ", "The Compeller, the Restorer"), ("Al-Mutakabbir", "المُتَكَبِّرُ", "The Supreme in Greatness"),
    ("Al-Khaliq", "الخَالِقُ", "The Creator"), ("Al-Bari'", "البَارِئُ", "The Originator"),
    ("Al-Musawwir", "المُصَوِّرُ", "The Fashioner"), ("Al-Ghaffar", "الغَفَّارُ", "The Ever-Forgiving"),
    ("Al-Qahhar", "القَهَّارُ", "The Subduer"), ("Al-Wahhab", "الوَهَّابُ", "The Giver of Gifts"),
    ("Ar-Razzaq", "الرَّزَّاقُ", "The Provider"), ("Al-Fattah", "الفَتَّاحُ", "The Opener"),
    ("Al-'Alim", "العَلِيمُ", "The All-Knowing"), ("Al-Qabid", "القَابِضُ", "The Withholder"),
    ("Al-Basit", "البَاسِطُ", "The Extender"), ("Al-Khafid", "الخَافِضُ", "The One who Lowers"),
    ("Ar-Rafi'", "الرَّافِعُ", "The One who Raises"), ("Al-Mu'izz", "المُعِزُّ", "The Giver of Honour"),
    ("Al-Mudhill", "المُذِلُّ", "The One who Humbles"), ("As-Sami'", "السَّمِيعُ", "The All-Hearing"),
    ("Al-Basir", "البَصِيرُ", "The All-Seeing"), ("Al-Hakam", "الحَكَمُ", "The Judge"),
    ("Al-'Adl", "العَدْلُ", "The Just"), ("Al-Latif", "اللَّطِيفُ", "The Subtle, the Kind"),
    ("Al-Khabir", "الخَبِيرُ", "The All-Aware"), ("Al-Halim", "الحَلِيمُ", "The Forbearing"),
    ("Al-'Azim", "العَظِيمُ", "The Magnificent"), ("Al-Ghafur", "الغَفُورُ", "The All-Forgiving"),
    ("Ash-Shakur", "الشَّكُورُ", "The Most Appreciative"), ("Al-'Aliyy", "العَلِيُّ", "The Most High"),
    ("Al-Kabir", "الكَبِيرُ", "The Most Great"), ("Al-Hafiz", "الحَفِيظُ", "The Preserver"),
    ("Al-Muqit", "المُقِيتُ", "The Nourisher"), ("Al-Hasib", "الحَسِيبُ", "The Reckoner, the Sufficient"),
    ("Al-Jalil", "الجَلِيلُ", "The Majestic"), ("Al-Karim", "الكَرِيمُ", "The Most Generous"),
    ("Ar-Raqib", "الرَّقِيبُ", "The Watchful"), ("Al-Mujib", "المُجِيبُ", "The One who Answers"),
    ("Al-Wasi'", "الوَاسِعُ", "The All-Encompassing"), ("Al-Hakim", "الحَكِيمُ", "The All-Wise"),
    ("Al-Wadud", "الوَدُودُ", "The Most Loving"), ("Al-Majid", "المَجِيدُ", "The Glorious"),
    ("Al-Ba'ith", "البَاعِثُ", "The Resurrector"), ("Ash-Shahid", "الشَّهِيدُ", "The Witness"),
    ("Al-Haqq", "الحَقُّ", "The Truth"), ("Al-Wakil", "الوَكِيلُ", "The Trustee"),
    ("Al-Qawiyy", "القَوِيُّ", "The All-Strong"), ("Al-Matin", "المَتِينُ", "The Firm"),
    ("Al-Waliyy", "الوَلِيُّ", "The Protecting Friend"), ("Al-Hamid", "الحَمِيدُ", "The Praiseworthy"),
    ("Al-Muhsi", "المُحْصِي", "The One who Counts All"), ("Al-Mubdi'", "المُبْدِئُ", "The Beginner of Creation"),
    ("Al-Mu'id", "المُعِيدُ", "The Restorer"), ("Al-Muhyi", "المُحْيِي", "The Giver of Life"),
    ("Al-Mumit", "المُمِيتُ", "The Bringer of Death"), ("Al-Hayy", "الحَيُّ", "The Ever-Living"),
    ("Al-Qayyum", "القَيُّومُ", "The Sustainer of All"), ("Al-Wajid", "الوَاجِدُ", "The One who Finds"),
    ("Al-Majid", "المَاجِدُ", "The Noble"), ("Al-Wahid", "الوَاحِدُ", "The One"),
    ("Al-Ahad", "الأَحَدُ", "The Unique"), ("As-Samad", "الصَّمَدُ", "The Eternal Refuge"),
    ("Al-Qadir", "القَادِرُ", "The Able"), ("Al-Muqtadir", "المُقْتَدِرُ", "The All-Powerful"),
    ("Al-Muqaddim", "المُقَدِّمُ", "The One who Brings Forward"), ("Al-Mu'akhkhir", "المُؤَخِّرُ", "The One who Delays"),
    ("Al-Awwal", "الأَوَّلُ", "The First"), ("Al-Akhir", "الآخِرُ", "The Last"),
    ("Az-Zahir", "الظَّاهِرُ", "The Manifest"), ("Al-Batin", "البَاطِنُ", "The Hidden"),
    ("Al-Wali", "الوَالِي", "The Governor"), ("Al-Muta'ali", "المُتَعَالِي", "The Most Exalted"),
    ("Al-Barr", "البَرُّ", "The Source of All Goodness"), ("At-Tawwab", "التَّوَّابُ", "The Acceptor of Repentance"),
    ("Al-Muntaqim", "المُنْتَقِمُ", "The Avenger"), ("Al-'Afuww", "العَفُوُّ", "The Pardoner"),
    ("Ar-Ra'uf", "الرَّؤُوفُ", "The Most Kind"), ("Malik al-Mulk", "مَالِكُ المُلْكِ", "Owner of All Sovereignty"),
    ("Dhul-Jalali wal-Ikram", "ذُو الجَلَالِ وَالإِكْرَامِ", "Lord of Majesty and Honour"), ("Al-Muqsit", "المُقْسِطُ", "The Equitable"),
    ("Al-Jami'", "الجَامِعُ", "The Gatherer"), ("Al-Ghaniyy", "الغَنِيُّ", "The Self-Sufficient"),
    ("Al-Mughni", "المُغْنِي", "The Enricher"), ("Al-Mani'", "المَانِعُ", "The Preventer"),
    ("Ad-Darr", "الضَّارُّ", "The One who Brings Harm"), ("An-Nafi'", "النَّافِعُ", "The One who Brings Benefit"),
    ("An-Nur", "النُّورُ", "The Light"), ("Al-Hadi", "الهَادِي", "The Guide"),
    ("Al-Badi'", "البَدِيعُ", "The Incomparable Originator"), ("Al-Baqi", "البَاقِي", "The Everlasting"),
    ("Al-Warith", "الوَارِثُ", "The Inheritor"), ("Ar-Rashid", "الرَّشِيدُ", "The Guide to the Right Way"),
    ("As-Sabur", "الصَّبُورُ", "The Most Patient"),
]
assert len(NAMES) == 99

# Who narrated each hadith (checked against the English editions of the same source).
AH = "Abu Hurayrah"
NARRATOR = {
    "ontime": "'Abdullah ibn Mas'ud", "jamaah": "'Abdullah ibn 'Umar", "rawatib": "Umm Habibah", "fajr2": "'A'ishah", "tasbih": AH,
    "adhkar": AH, "quran": "Abu Umamah", "duha": AH, "witr": "'Abdullah ibn 'Umar", "qiyam": AH, "istighfar": AH, "salawat": AH,
    "sadaqah": "'Adi ibn Hatim", "kin": "Anas ibn Malik", "tongue": AH, "siwak": AH, "sleep": "al-Bara' ibn 'Azib", "kursi": AH,
    "baqarah": "Abu Mas'ud al-Ansari", "constant": "'A'ishah", "smile": "Abu Dharr", "shukr": "Suhayb",
    "jumuah": "Salman al-Farisi", "kahf": "Abu Sa'id al-Khudri", "hour": AH, "monthu": AH, "white": "Abu Dharr", "ramadan": AH,
    "taraweeh": AH, "suhoor": "Anas ibn Malik", "iftar": "Sahl ibn Sa'd", "qadr": "'A'ishah", "afuww": "'A'ishah",
    "shawwal": "Abu Ayyub al-Ansari", "tendays": "Ibn 'Abbas", "arafah": "Abu Qatadah", "ashura": "Abu Qatadah",
    "tashriq": "Nubayshah al-Hudhali", "firstaccount": AH, "charity_short": AH, "names99": AH, "jazak": "Usamah ibn Zayd",
    "Begin with the intention": "'Umar ibn al-Khattab", "The five pillars": "'Abdullah ibn 'Umar",
    "Leave what does not concern you": AH, "Love for your brother": "Anas ibn Malik", "Do not become angry": AH,
    "The gates are opened": AH, "Fasting is for Allah": AH, "More than hunger": AH, "The most generous of people": "Ibn 'Abbas",
    "Seek the Night of Decree": AH, "Follow it with six": "Abu Ayyub al-Ansari", "Taqwa wherever you are": "Abu Dharr",
    "Be mindful of Allah": "Ibn 'Abbas", "Leave what makes you doubt": "al-Hasan ibn 'Ali", "Purity is half of faith": "Abu Malik al-Ash'ari",
    "A traveller in this world": "'Abdullah ibn 'Umar", "Excellence in everything": "Shaddad ibn Aws", "The strong believer": AH,
    "The ten best days": "Ibn 'Abbas", "Two blessings": "Ibn 'Abbas", "True strength": AH,
    "Safe from your tongue and hand": "'Abdullah ibn 'Amr", "Make things easy": "Anas ibn Malik", "The path of knowledge": AH,
    "The best of you": "'Uthman ibn 'Affan", "Two rewards": "'A'ishah", "Three that continue": AH,
    "Charity does not decrease wealth": AH, "One body": "an-Nu'man ibn Bashir", "Hearts and deeds": AH, "Best in character": AH,
    "Best to his family": "'A'ishah", "Mercy to the young, honour to the old": "Anas ibn Malik",
    "The merciful are shown mercy": "'Abdullah ibn 'Amr", "Your mother": AH, "The neighbour": "'A'ishah",
    "Every kindness is charity": "Jabir ibn 'Abdullah", "The branches of faith": AH, "Truthfulness": "'Abdullah ibn Mas'ud",
    "Three signs": AH, "Beware of suspicion": AH, "What backbiting is": AH, "Gentleness": "'A'ishah",
    "Even the prick of a thorn": "Abu Sa'id al-Khudri and Abu Hurayrah", "Look at those below you": AH, "True richness": AH,
    "The work of your hand": "al-Miqdam ibn Ma'dikarib", "Easy in buying and selling": "Jabir ibn 'Abdullah",
    "As the birds are provided for": "'Umar ibn al-Khattab", "As My servant thinks of Me": AH, "The living and the dead": "Abu Musa al-Ash'ari",
    "Two words": AH, "The last third of the night": AH, "The best of those who err": "Anas ibn Malik",
    "Asked about four": "Abu Barzah al-Aslami", "Guide to good": "Abu Mas'ud al-Ansari", "Deeds are by their endings": "Sahl ibn Sa'd",
}


# Arabic that is not taken from the hadith-api editions (see tools/fetch_arabic.py for the rest).
ARABIC_MANUAL = {
    "kahf": "مَنْ قَرَأَ سُورَةَ الْكَهْفِ فِي يَوْمِ الْجُمُعَةِ، أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ.",
    "afuww": "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ، فَاعْفُ عَنِّي.",
    "umar": "حَاسِبُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُحَاسَبُوا.",
}

# ---------------------------------------------------------------------------
# One line for each name of Allah: how to live by it today. Same order as NAMES.
# These are reflections for the reader, not quotations from the Qur'an or hadith.
# ---------------------------------------------------------------------------
NAME_LIVE = [
    "Show mercy to someone today, in word or in deed.", "Be gentle with someone who is weak or struggling.",
    "Remember that every power you hold is only lent to you.", "Keep your heart and your tongue clean today.",
    "Say salam first, and leave peace behind you.", "Keep your word and be someone people feel safe with.",
    "Remember that He watches over all you do, even in secret.", "Seek honour through obeying Him, not through people.",
    "Ask Him to mend what is broken in you.", "Be humble today; greatness belongs to Him alone.",
    "Look at the sky or a tree and say Subhan Allah.", "Thank Him for all He brought into being from nothing.",
    "Thank Him for your face and body, and use them well.", "Ask forgiveness for your sins, again and again.",
    "Trust that nothing can overcome His decree.", "Ask Him for a gift, then give a gift yourself.",
    "Ask Him for provision, then work with honesty.", "Ask Him to open a door that seems closed.",
    "Ask Him for what you do not know, and learn something new.", "Accept what is held back from you, and be patient.",
    "Trust that relief from Him comes after tightness.", "Do not envy; He lowers and raises as He wills.",
    "Look down on no one; He raises whom He wills.", "Seek honour only by pleasing Him.",
    "Remember that arrogance ends in humiliation.", "Be careful what you say; He hears every word.",
    "Mind what you do when no one is watching.", "Accept His judgement, and judge others fairly.",
    "Be fair to everyone, even those you dislike.", "Do a small kindness that nobody will notice.",
    "Take your hidden worries to the One who knows them.", "Do not rush to punish; be forbearing today.",
    "Stand in awe of Him in your prayer.", "Forgive someone who wronged you, as you hope to be forgiven.",
    "Thank Allah, and thank people for small kindnesses.", "Never let a matter feel too big for Him.",
    "Say Allahu akbar, and let your worries grow small.", "Ask Him to protect you, your family and your faith.",
    "Be thankful for your food, and share some of it.", "Count your own deeds before you are counted.",
    "Respect what is great in His religion and His signs.", "Be generous with your time, food and kind words.",
    "Know that every moment is watched; do it well.", "Make dua today, and be sure it is heard.",
    "Ask Him boldly; His giving has no limit.", "Trust His wisdom in what you do not understand.",
    "Love someone for His sake, and tell them so.", "Praise Him for His greatness and glorify Him.",
    "Prepare for the day you will be raised.", "Be truthful; He is witness to everything.",
    "Hold to the truth even when it costs you.", "Do your part, then rely on Him fully.",
    "Ask Him for strength in your body and in your faith.", "Stay firm on what is right, like a steady rock.",
    "Choose friends who help you obey Him.", "Praise Him in every state, and say Alhamdulillah.",
    "Remember that every deed is counted.", "Begin each task with Bismillah.",
    "Remember that all things return to Him.", "Ask Him to give life to a heart that has gone dead.",
    "Remember death, and prepare for it.", "Stay awake to the One who never sleeps.",
    "Rely on the One who sustains all things.", "Ask Him to find what you have lost.",
    "Honour those who deserve honour; He is the Most Noble.", "Worship Him alone, and put nothing before Him.",
    "Keep your heart for Him alone.", "Take every need to Him alone.",
    "Remember that He can do what you cannot.", "Fear no one's power but His.",
    "Put first things first: pray, then plan.", "Do not delay your repentance.",
    "Begin the day by remembering Him.", "End the day by remembering Him.",
    "See His signs all around you.", "Know that He sees even what is hidden in the heart.",
    "Take Him as your protecting friend.", "Raise your hands in dua; He is above all.",
    "Be good to your parents, as He is good to you.", "Repent today, and mean it.",
    "Wrong no one; He takes the right of the wronged.", "Pardon someone today, and say His dua for pardon.",
    "Be kind to the people in your home.", "Give up pride in what you own; it all belongs to Him.",
    "Honour the one who deserves it: parents, elders, scholars.", "Judge fairly, and give each person their due.",
    "Bring together what has been divided: family, friends.", "Be content with what He has given you.",
    "Ask Him to free you from needing anyone but Him.", "Accept what He holds back as His kindness.",
    "Know that harm comes only by His leave; say Bismillah.", "Ask for what benefits you, and help others to benefit.",
    "Open the Qur'an and let its light guide you.", "Ask Him to guide you, and guide someone yourself.",
    "Marvel at His creation and say Subhan Allah.", "Invest in what lasts: good deeds and knowledge.",
    "Remember that all returns to Him; give in charity.", "Ask Him for the right decision before you act.",
    "Be patient today with one thing you dislike.",
]
assert len(NAME_LIVE) == 99

# ---------------------------------------------------------------------------
# A Sunnah to practise for a week: 53 of them. (text, reference, book, number, check pattern)
# The last three fields are used only by tools/check_sunnah.py, which looks each one up in the source collections.
# ---------------------------------------------------------------------------
SUNNAH_WEEK = [
    ("Begin with the right: wudu, dressing, combing, entering the home.", "al-Bukhari 168, Muslim 268", "bukhari", 168, "right"),
    ("Say Bismillah and eat with your right hand, from what is near you.", "al-Bukhari 5376, Muslim 2022", "bukhari", 5376, "right hand"),
    ("Greet people you know and people you do not know.", "al-Bukhari 12, Muslim 39", "bukhari", 12, "greet"),
    ("Meet people with a cheerful face.", "Muslim 2626", "muslim", None, "cheerful"),
    ("Use the siwak before each prayer.", "al-Bukhari 887, Muslim 252", "bukhari", 887, "siwak|miswak|tooth"),
    ("Pray two rak'ahs when you enter a masjid.", "al-Bukhari 444, Muslim 714", "bukhari", 444, "two rak"),
    ("Say the dua of leaving home: Bismillah, tawakkaltu 'ala Allah.", "Abu Dawud 5095, at-Tirmidhi 3426", "abudawud", 5095, "trust in allah"),
    ("Greet your family with salam when you enter your home.", "at-Tirmidhi 2698", "tirmidhi", 2698, "family"),
    ("Visit someone who is sick.", "al-Bukhari 1240, Muslim 2162", "bukhari", 1240, "sick"),
    ("Say Alhamdulillah when you sneeze, and Yarhamukallah to one who does.", "al-Bukhari 6224", "bukhari", 6224, "sneez"),
    ("Repeat after the caller to prayer, then send salawat and make dua.", "al-Bukhari 611, 614", "bukhari", 611, "adhan|muadhdhin|mu'adh"),
    ("Make dua between the adhan and the iqamah.", "at-Tirmidhi 212, Abu Dawud 521", "tirmidhi", 212, "adhan.*iqamah"),
    ("Walk to the prayer calmly, with dignity.", "al-Bukhari 636, Muslim 602", "bukhari", 636, "tranquil|calm|dignity|serenity"),
    ("Pray some of your voluntary prayers at home.", "al-Bukhari 731, Muslim 781", "bukhari", 731, "houses"),
    ("After Fajr, stay in dhikr until sunrise, then pray two rak'ahs.", "at-Tirmidhi 586", "tirmidhi", 586, "sun"),
    ("Pray two rak'ahs after every wudu.", "al-Bukhari 1149, Muslim 2458", "bukhari", 1149, "footsteps|ablution"),
    ("Recite Ikhlas, Falaq and Nas three times, morning and evening.", "Abu Dawud 5082, at-Tirmidhi 3575", "abudawud", 5082, "three times"),
    ("Say La hawla wa la quwwata illa billah, a treasure of Paradise.", "al-Bukhari 4205, Muslim 2704", "bukhari", 4205, "treasure"),
    ("Say Subhan Allahi wa bihamdihi a hundred times.", "al-Bukhari 6405, Muslim 2691", "bukhari", 6405, "hundred|100"),
    ("Send salawat upon the Prophet ﷺ.", "Muslim 408", "muslim", None, "blessing"),
    ("Make dua for your brother in his absence.", "Muslim 2732", "muslim", None, "absence|behind"),
    ("Give a gift, and accept gifts.", "al-Bukhari 2585", "bukhari", 2585, "gift"),
    ("Remove something harmful from the path.", "al-Bukhari 2989, Muslim 1009", "bukhari", 2989, "harmful"),
    ("Give water to someone who is thirsty.", "al-Bukhari 2363, Muslim 2244", "bukhari", 2363, "water"),
    ("Plant a tree or sow a seed.", "al-Bukhari 2320, Muslim 1553", "bukhari", 2320, "plant"),
    ("Feed a fasting person at iftar.", "at-Tirmidhi 807", "tirmidhi", 807, "fast"),
    ("Make peace between two people who have fallen out.", "Abu Dawud 4919, at-Tirmidhi 2509", "abudawud", 4919, "putting things right"),
    ("Cover a Muslim's fault instead of exposing it.", "Muslim 2590", "muslim", None, "conceal"),
    ("Be kind to an orphan.", "al-Bukhari 5304", "bukhari", 5304, "orphan"),
    ("Be generous to your neighbour.", "al-Bukhari 6019, Muslim 47", "bukhari", 6019, "neighbo"),
    ("Please your parents; Allah's pleasure is in theirs.", "at-Tirmidhi 1899", "tirmidhi", 1899, "pleasure"),
    ("Keep the ties of kinship, and do not cut them.", "al-Bukhari 5984, Muslim 2556", "bukhari", 5984, "kinship|ties|relatives"),
    ("Give sadaqah in secret.", "al-Bukhari 660, Muslim 1031", "bukhari", 660, "secret"),
    ("Recite the Qur'an in a beautiful voice.", "al-Bukhari 7527", "bukhari", 7527, "chant|sweet|voice"),
    ("Visit the graves to remember the Hereafter.", "Muslim 976", "muslim", None, "graves"),
    ("Pray over the dead and follow the funeral.", "al-Bukhari 1325, Muslim 945", "bukhari", 1325, "qirat"),
    ("Be clean and well-presented; Allah is beautiful and loves beauty.", "Muslim 91", "muslim", None, "beautiful|beauty"),
    ("Keep the acts of the fitrah: trim nails, clip the moustache, remove hair.", "al-Bukhari 5889, Muslim 257", "bukhari", 5889, "fitra"),
    ("Eat dates; a home without dates goes hungry.", "Muslim 2046", "muslim", None, "dates"),
    ("Drink sitting, and in three breaths.", "Muslim 2028", "muslim", None, "three"),
    ("Praise Allah after your food and drink.", "Muslim 2734", "muslim", None, "morsel|praises"),
    ("Say: Ya Muqallib al-qulub, thabbit qalbi 'ala dinik.", "at-Tirmidhi 2140", "tirmidhi", 2140, "hearts"),
    ("Sleep with the dua: Bismika Allahumma amutu wa ahya.", "al-Bukhari 6314", "bukhari", 6314, "bismika"),
    ("Pray at night while people sleep.", "at-Tirmidhi 2485", "tirmidhi", 2485, "while the people are sleeping"),
    ("When angry, sit down; if it persists, lie down.", "Abu Dawud 4782", "abudawud", 4782, "sit"),
    ("When angry, say A'udhu billahi min ash-shaytan ir-rajim.", "al-Bukhari 6115, Muslim 2610", "bukhari", 6115, "refuge"),
    ("Say: Allahumma inni a'udhu bika minal-hammi wal-hazan.", "al-Bukhari 6369", "bukhari", 6369, "worry|anxiety|grief|sorrow"),
    ("Honour the elderly Muslim.", "Abu Dawud 4843", "abudawud", 4843, "grey|white hair|elder"),
    ("After wudu, say the shahadah; the eight gates of Paradise open.", "Muslim 234", "muslim", None, "eight gates"),
    ("Pray two rak'ahs of Duha as sadaqah for your joints.", "Muslim 720", "muslim", None, "duha|forenoon"),
    ("Say Amin when the imam says it.", "al-Bukhari 780, Muslim 410", "bukhari", 780, "amin|ameen"),
    ("Treat people as you would like to be treated.", "Muslim 1844", "muslim", None, "like to be treated|wish"),
    ("End each gathering: Subhanaka Allahumma wa bihamdika...", "at-Tirmidhi 3433", "tirmidhi", 3433, "glory|gathering"),
]
assert len(SUNNAH_WEEK) == 53, len(SUNNAH_WEEK)
