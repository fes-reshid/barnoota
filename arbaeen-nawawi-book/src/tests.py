# -*- coding: utf-8 -*-
"""End-of-part review tests.

Each part: 25 multiple choice (question, [A, B, C, D], index of correct answer),
10 matching pairs (Arabic phrase from the hadith, its English meaning) — the meanings are shuffled,
10 short-answer questions (with a model answer for the key),
5 critical-thinking questions.
"""

TESTS = {}

# ======================================================================= PART ONE (1-10)
TESTS[1] = dict(
mcq=[
("Which hadith did an-Nawawī place first in his collection?", ["Islam is built on five", "Actions are by intentions", "The religion is sincere advice", "The halal is clear"], 1),
("Where is the intention (niyyah) found?", ["On the tongue", "In the heart", "In the hands", "In writing"], 1),
("In Hadith 1, which journey did the Prophet ﷺ use as his example?", ["Hajj", "The Night Journey", "Hijrah (migration)", "Trade to Shām"], 2),
("Who came to the gathering in Hadith 2 in the form of a man?", ["Mīkā’īl", "Jibrīl", "Isrāfīl", "A Bedouin from Najd"], 1),
("How many pillars of Īmān are mentioned in Hadith 2?", ["Four", "Five", "Six", "Seven"], 2),
("Iḥsān means to worship Allah…", ["only in Ramadan", "as though you see Him", "only in congregation", "with loud dhikr"], 1),
("About the time of the Hour, the Prophet ﷺ said:", ["It will be in 100 years", "The one asked knows no more than the one asking", "Only Jibrīl knows it", "It will come on a Monday"], 1),
("In Hadith 3, Islam is compared to…", ["a tree", "a building", "a river", "a ship"], 1),
("Which is the first and foundation pillar of Islam?", ["Salah", "Zakah", "The two testimonies", "Fasting"], 2),
("According to Hadith 4, how long is each stage in the womb?", ["7 days", "30 days", "40 days", "60 days"], 2),
("Which of these is NOT one of the four things the angel writes?", ["Provision", "Life-span", "Nationality", "Wretched or happy"], 2),
("Hadith 4 teaches that deeds are judged by…", ["their beginnings", "their endings", "their number", "their size"], 1),
("“Whoever introduces into this affair of ours what is not of it” refers mainly to…", ["new technology", "new acts of worship", "new buildings", "new languages"], 1),
("A deed is accepted when it is sincere AND…", ["done in public", "done in Arabic", "according to the Sunnah", "done many times"], 2),
("Hadith 6 divides matters into…", ["two kinds", "three kinds", "four kinds", "five kinds"], 1),
("In Hadith 6, the shepherd who grazes near the sanctuary…", ["is rewarded", "will soon fall into it", "is safe", "must leave his sheep"], 1),
("Allah’s sanctuary (ḥimā) is…", ["the Kaʿbah", "His prohibitions", "Madinah", "Paradise"], 1),
("Which part of the body, when sound, makes the whole body sound?", ["The brain", "The tongue", "The heart", "The hands"], 2),
("“The religion is naṣīḥah.” Naṣīḥah means…", ["anger", "sincere goodwill", "fasting", "travelling"], 1),
("Which of these is NOT among the five that naṣīḥah is owed to?", ["Allah", "His Book", "His Messenger", "Wealth"], 3),
("In Hadith 8, which two acts are mentioned with the testimony?", ["Fasting and Hajj", "Prayer and zakah", "Jihad and Hajj", "Wudu and prayer"], 1),
("Who used Hadith 8 against those who refused to pay zakah?", ["ʿUmar", "Abū Bakr", "ʿAlī", "ʿUthmān"], 1),
("In Hadith 9, prohibitions should be avoided…", ["as much as you can", "completely", "only in Ramadan", "only in public"], 1),
("What destroyed the nations before us, according to Hadith 9?", ["Poverty", "Too many questions and disagreeing with their prophets", "Earthquakes", "Lack of buildings"], 1),
("In Hadith 10, why was the traveller’s du‘a not answered?", ["He did not raise his hands", "His food, drink and clothing were haram", "He was not in Makkah", "He prayed too quickly"], 1),
],
match=[
('إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ', 'Actions are only by intentions.'),
('أَنْ تَعْبُدَ اللَّهَ كَأَنَّكَ تَرَاهُ', 'That you worship Allah as though you see Him.'),
('بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ', 'Islam is built upon five.'),
('يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ', 'His creation is gathered in his mother’s womb.'),
('مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ', 'Whoever introduces into this matter of ours what is not from it, it is rejected.'),
('إِنَّ الحَلَالَ بَيِّنٌ وَإِنَّ الحَرَامَ بَيِّنٌ', 'The lawful is clear and the unlawful is clear.'),
('الدِّينُ النَّصِيحَةُ', 'The religion is sincere advice.'),
('وَحِسَابُهُمْ عَلَى اللَّهِ', 'And their reckoning is with Allah.'),
('فَأْتُوا مِنْهُ مَا اسْتَطَعْتُمْ', 'Do of it as much as you are able.'),
('إِنَّ اللَّهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا', 'Allah is good and accepts only what is good.'),
],
short=[
("What two things does Hadith 1 teach about actions?", "An action is valid only with an intention, and its reward depends on what was intended."),
("List the five pillars of Islam.", "The two testimonies, prayer, zakah, fasting Ramadan, Hajj."),
("List the six pillars of Īmān.", "Belief in Allah, His angels, His books, His messengers, the Last Day, and qadar (good and bad)."),
("Name the three stages of creation in the womb.", "Nuṭfah (drop), ʿalaqah (clinging clot), muḍghah (lump of flesh)."),
("What are the two conditions for a deed to be accepted?", "Sincerity for Allah (ikhlāṣ) and following the Sunnah."),
("What does a person protect by avoiding doubtful matters?", "His religion and his honour."),
("Name the five to whom naṣīḥah is owed.", "Allah, His Book, His Messenger, the leaders of the Muslims, and the common Muslims."),
("What does ‘their reckoning is with Allah’ mean in Hadith 8?", "We judge by what people show outwardly; their hearts are for Allah to judge."),
("What is the difference between how we treat commands and prohibitions (Hadith 9)?", "Prohibitions are left completely; commands are done as much as we are able."),
("Give two things that help a du‘a to be answered, from Hadith 10.", "e.g. eating halal, travelling, humility, raising the hands, calling ‘Yā Rabb’."),
],
critical=[
"Two students both help to clean the mosque. One is rewarded and the other is not. Using Hadith 1, explain how this can happen, and how the second student could have earned the reward.",
"Hadith 2 calls Iḥsān the highest level. Describe what your day would look like if you lived with Iḥsān from morning to night.",
"Your friend says: “Everything is already written, so there is no point in working hard.” Using Hadith 4, how would you reply kindly and correctly?",
"Give an example of a ‘doubtful matter’ that young people face today. How do Hadith 6 and the shepherd example help you decide what to do?",
"Hadith 5 rejects new acts of worship, but Muslims use cars and phones. Explain the difference between worship and worldly matters, with your own examples.",
],
)

# ======================================================================= PART TWO (11-20)
TESTS[2] = dict(
mcq=[
("Who narrated “Leave what makes you doubt for what does not make you doubt”?", ["Anas ibn Mālik", "Al-Ḥasan ibn ʿAlī", "Abū Hurayrah", "Ibn ʿAbbās"], 1),
("Hadith 11 is a practical rule that follows from which earlier hadith?", ["Hadith 3", "Hadith 6", "Hadith 8", "Hadith 10"], 1),
("A passing doubt about wudu after being certain of it should be…", ["obeyed", "ignored, because certainty is not removed by doubt", "followed by a new ghusl", "told to everyone"], 1),
("“Part of the perfection of one’s Islam is…”", ["praying at night", "leaving what does not concern him", "travelling", "giving a lot of money"], 1),
("Who decides what ‘concerns’ a person?", ["His desires", "His friends", "The Shariah", "The news"], 2),
("In Hadith 13, ‘none of you believes’ means…", ["he leaves Islam", "his faith is not complete", "he must repeat his shahadah", "he cannot pray"], 1),
("Anas ibn Mālik served the Prophet ﷺ for…", ["one year", "five years", "ten years", "twenty years"], 2),
("Hadith 14 mentions how many cases in which a Muslim’s life may be taken?", ["Two", "Three", "Four", "Five"], 1),
("Who may carry out the punishments in Hadith 14?", ["Any Muslim", "The family", "The legitimate authority and courts", "Neighbours"], 2),
("Hadith 15 tells the believer to speak good or…", ["shout", "stay silent", "write it down", "leave the room"], 1),
("Which two people does Hadith 15 tell us to honour?", ["Teacher and student", "Neighbour and guest", "Ruler and judge", "Father and son"], 1),
("What advice did the Prophet ﷺ repeat many times in Hadith 16?", ["Pray at night", "Do not become angry", "Give charity", "Read Qur’an"], 1),
("Who is truly strong, according to the Prophet ﷺ?", ["The best wrestler", "The one who controls himself when angry", "The richest man", "The tallest man"], 1),
("Which of these is a remedy for anger taught in the Sunnah?", ["Shouting louder", "Making wudu", "Running away from home", "Breaking something"], 1),
("Hadith 17 says Allah has prescribed iḥsān in…", ["prayer only", "everything", "Ramadan only", "trade only"], 1),
("When slaughtering, the knife should be…", ["blunt", "sharp", "shown to the animal", "heated"], 1),
("“Follow a bad deed with a good deed and it will…”", ["double it", "wipe it out", "hide it", "delay it"], 1),
("Who narrated Hadith 18 together with Abū Dharr?", ["Muʿādh ibn Jabal", "Bilāl", "Salmān", "Khālid ibn al-Walīd"], 0),
("Ibn ʿAbbās received the advice of Hadith 19 while…", ["sitting in the mosque", "riding behind the Prophet ﷺ", "travelling to Shām", "at the battle of Badr"], 1),
("“Guard Allah and…”", ["you will be rich", "He will guard you", "people will love you", "you will never be sad"], 1),
("“The pens have been lifted and…”", ["the books are closed", "the pages have dried", "the angels have left", "the Hour has come"], 1),
("If the whole nation gathered to harm you, they could only harm you with…", ["their weapons", "what Allah has written against you", "their money", "their numbers"], 1),
("“Know Allah in ease and He will know you in…”", ["Ramadan", "hardship", "the grave", "Paradise"], 1),
("Hadith 20 says the saying about modesty comes from…", ["the poets", "the earliest prophecy", "the kings of Persia", "the Companions"], 1),
("“Modesty brings nothing but…”", ["shyness", "good", "difficulty", "silence"], 1),
],
match=[
('دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ', 'Leave what makes you doubt for what does not make you doubt.'),
('مِنْ حُسْنِ إِسْلَامِ المَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ', 'Part of the beauty of a person’s Islam is leaving what does not concern him.'),
('حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', 'Until he loves for his brother what he loves for himself.'),
('لَا يَحِلُّ دَمُ امْرِئٍ مُسْلِمٍ إِلَّا بِإِحْدَى ثَلَاثٍ', 'The blood of a Muslim is not lawful except in one of three cases.'),
('فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ', 'Let him speak good or keep silent.'),
('لَا تَغْضَبْ', 'Do not become angry.'),
('إِنَّ اللَّهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ', 'Allah has prescribed excellence in everything.'),
('وَأَتْبِعِ السَّيِّئَةَ الحَسَنَةَ تَمْحُهَا', 'Follow a bad deed with a good deed and it will wipe it out.'),
('احْفَظِ اللَّهَ يَحْفَظْكَ', 'Guard Allah and He will guard you.'),
('إِذَا لَمْ تَسْتَحِ فَاصْنَعْ مَا شِئْتَ', 'If you feel no shame, then do as you wish.'),
],
short=[
("What is the difference between a real doubt and waswās?", "A real doubt has a reason; waswās is a whisper against something one is already certain of."),
("Give three examples of things that do not concern a person.", "e.g. gossip, prying into private lives, useless arguing, endless scrolling."),
("How does Hadith 13 remove envy from the heart?", "It makes you want the same good for others that you want for yourself."),
("What are the three cases mentioned in Hadith 14?", "The married adulterer, a life for a life, and the one who leaves the religion and separates from the community."),
("What is the right of a guest according to the Sunnah?", "Special care for a day and a night; hospitality up to three days."),
("List four remedies for anger.", "Seek refuge with Allah, stay silent, change position, make wudu (also: remember the reward of restraint)."),
("Name three rules of kindness when slaughtering an animal.", "Sharp knife, not sharpening it in front of the animal, gentleness, quick cut, not slaughtering in front of another animal."),
("What are the three commands of Hadith 18?", "Fear Allah wherever you are, follow a bad deed with a good one, treat people with good character."),
("Which steps make repentance sincere?", "Stop the sin, regret it, resolve not to return, return any rights to people."),
("What are the two explanations of ‘do as you wish’ in Hadith 20?", "A warning (do it and face the consequence), and a permission (if it is not shameful, you may do it)."),
],
critical=[
"Hadith 12 tells us to leave what does not concern us. How can a young Muslim apply this to phones and social media? Give a practical plan.",
"Is it possible to love for others what you love for yourself while competing with them in an exam or a race? Explain using Hadith 13.",
"A classmate insults you in front of others. Using Hadith 16 and Hadith 18, describe step by step what you should do, both in the moment and afterwards.",
"Hadith 19 was taught to a young boy. Why do you think the Prophet ﷺ chose to teach these words to a child? What would change if every child learned them?",
"Modesty sometimes stops people from asking questions in class. Is that true modesty? Explain using Hadith 20 and the example of the women of the Anṣār.",
],
)

# ======================================================================= PART THREE (21-30)
TESTS[3] = dict(
mcq=[
("What did the Prophet ﷺ tell Sufyān ath-Thaqafī to say?", ["I believe in Allah, then be steadfast", "Allah is the Greatest", "I seek forgiveness", "Glory be to Allah"], 0),
("Istiqāmah means…", ["travelling", "steadfastness on the straight path", "fasting every day", "leaving the world"], 1),
("Those who say ‘Our Lord is Allah’ and remain steadfast receive what from the angels (Fuṣṣilat 41:30)?", ["Wealth", "Good news: do not fear and do not grieve", "A long life", "Fame"], 1),
("In Hadith 22, the man asked whether he would enter Paradise if he…", ["fasted every day", "did the obligations and avoided the haram", "travelled for Hajj every year", "gave all his wealth"], 1),
("What did the Prophet ﷺ answer the man in Hadith 22?", ["No", "Yes", "Only if he does more", "Allah knows best"], 1),
("“Purity is…”", ["all of faith", "half of faith", "a quarter of faith", "not related to faith"], 1),
("Which words fill the scale (al-mīzān)?", ["Subḥān Allāh", "Al-ḥamdu lillāh", "Allāhu akbar", "Astaghfirullāh"], 1),
("“Prayer is…”", ["light", "a proof", "radiance", "a shield"], 0),
("“Charity is…”", ["light", "a proof", "radiance", "half of faith"], 1),
("“Patience is…”", ["a proof", "radiance (ḍiyā’)", "half of faith", "light"], 1),
("The Qur’an is…", ["only for scholars", "a proof for you or against you", "only for Ramadan", "only for the dead"], 1),
("Hadith 24 is a ḥadīth qudsī, meaning…", ["a weak hadith", "the Prophet ﷺ relates it from his Lord", "a saying of a Companion", "a verse of the Qur’an"], 1),
("What has Allah forbidden for Himself in Hadith 24?", ["Mercy", "Oppression", "Forgiveness", "Knowledge"], 1),
("If all creation asked Allah and were given, His treasures would decrease only like…", ["a cup from a river", "a needle dipped in the ocean", "a stone from a mountain", "a leaf from a tree"], 1),
("In Hadith 25, the poor Companions were sad about missing…", ["money", "the rewards of charity", "food", "clothes"], 1),
("Which of these is called charity in Hadith 25?", ["Every tasbīḥ", "Sleeping", "Buying clothes", "Watching people"], 0),
("How many joints does a person have, according to a narration in Muslim?", ["206", "360", "100", "33"], 1),
("Which prayer is enough for the charity due on all the joints?", ["Witr", "Two rakʿahs of Ḍuḥā", "Tahajjud", "Ẓuhr"], 1),
("Which of these is mentioned as a charity in Hadith 26?", ["Removing harm from the road", "Buying a car", "Sleeping early", "Wearing perfume"], 0),
("“Righteousness is…”", ["fasting", "good character", "wealth", "knowledge"], 1),
("Sin is that which wavers in your chest and…", ["you share proudly", "you dislike people seeing", "you forget", "you write down"], 1),
("In Hadith 28, the Companions felt the sermon was…", ["a Friday khutbah", "a farewell sermon", "a war speech", "a wedding speech"], 1),
("‘Bite onto it with your molar teeth’ means…", ["eat slowly", "hold on as firmly as possible", "be angry", "stay silent"], 1),
("In Hadith 29, the ‘pillar’ (ʿamūd) of the religion is…", ["fasting", "the prayer", "Hajj", "jihad"], 1),
("What did the Prophet ﷺ hold when he said ‘Restrain this’?", ["His beard", "His tongue", "His hand", "His sword"], 1),
],
match=[
('قُلْ: آمَنْتُ بِاللَّهِ، ثُمَّ اسْتَقِمْ', 'Say: I believe in Allah, then be steadfast.'),
('أَأَدْخُلُ الجَنَّةَ؟ قَالَ: نَعَمْ', '“Will I enter Paradise?” He said: “Yes.”'),
('الطُّهُورُ شَطْرُ الإِيمَانِ', 'Purity is half of faith.'),
('يَا عِبَادِي، إِنِّي حَرَّمْتُ الظُّلْمَ عَلَى نَفْسِي', 'O My servants, I have forbidden oppression for Myself.'),
('إِنَّ بِكُلِّ تَسْبِيحَةٍ صَدَقَةً', 'In every tasbīḥ there is a charity.'),
('وَالكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ', 'And a good word is a charity.'),
('البِرُّ حُسْنُ الخُلُقِ', 'Righteousness is good character.'),
('فَعَلَيْكُمْ بِسُنَّتِي', 'So hold to my Sunnah.'),
('كُفَّ عَلَيْكَ هَذَا', 'Restrain this (your tongue).'),
('وَسَكَتَ عَنْ أَشْيَاءَ رَحْمَةً لَكُمْ', 'And He was silent about some things out of mercy for you.'),
],
short=[
("How did ʿUmar explain istiqāmah?", "Being steadfast in obedience, and not slipping away like foxes."),
("Why might zakah and Hajj not be mentioned in Hadith 22?", "They may not yet have been obligatory, or the man was not able; other hadith complete the picture."),
("Match each deed to its description in Hadith 23: prayer, charity, patience.", "Prayer is light; charity is a proof; patience is radiance."),
("Name the four things Hadith 24 says we need to ask Allah for.", "Guidance, food, clothing and forgiveness."),
("Why were the Companions surprised by the last charity in Hadith 25, and how was it explained?", "Intimacy with one’s spouse; doing it in the haram is a sin, so doing it in the halal earns reward."),
("Give four charities from Hadith 26.", "Judging fairly, helping someone with his mount or luggage, a good word, steps to the prayer, removing harm from the road."),
("What should you do in an unclear matter when your heart feels uneasy (Hadith 27)?", "Check the texts, ask a scholar, and leave what disturbs the heart."),
("List the four commands of the Prophet ﷺ in Hadith 28.", "Taqwā; listening and obeying; holding to the Sunnah and the rightly guided caliphs; avoiding newly invented matters."),
("Name the three ‘doors of good’ in Hadith 29.", "Fasting is a shield; charity puts out sin; prayer in the depths of the night."),
("What are the four kinds of matters in Hadith 30?", "Obligations, limits, prohibitions, and things left unmentioned out of mercy."),
],
critical=[
"Hadith 22 shows that doing only the obligations leads to Paradise. Why, then, do Muslims still do voluntary deeds? Give at least three reasons.",
"‘Every person goes out in the morning selling himself.’ Describe a normal school or work day and show where a person ‘frees’ or ‘ruins’ his soul.",
"Hadith 24 says obeying Allah adds nothing to His kingdom. If Allah does not need our worship, why do we worship Him? Explain using the hadith.",
"The tongue can destroy a person’s good deeds (Hadith 29). Choose three sins of the tongue that are common today and suggest a practical cure for each.",
"Hadith 30 says Allah left some things unmentioned as a mercy. How does this protect Muslims from two extremes: making the halal haram, and inventing new worship?",
],
)

# ======================================================================= PART FOUR (31-40)
TESTS[4] = dict(
mcq=[
("According to Hadith 31, zuhd in the world brings…", ["the love of people", "the love of Allah", "more wealth", "fame"], 1),
("Ibn Taymiyyah defined zuhd as leaving…", ["all wealth", "what does not benefit you in the Hereafter", "your family", "food"], 1),
("Zuhd in what people have brings…", ["the love of people", "poverty", "anger", "loneliness"], 0),
("“Lā ḍarar wa lā ḍirār” means…", ["no harm and no returning harm", "no trade without witnesses", "no prayer without wudu", "no fasting while travelling"], 0),
("Which great legal rule comes from Hadith 32?", ["Certainty is not removed by doubt", "Harm is to be removed", "Custom is a judge", "Hardship brings ease"], 1),
("In Hadith 33, the burden of proof is on…", ["the one who denies", "the claimant", "the judge", "the witnesses"], 1),
("If the claimant has no proof, the one who denies must…", ["pay", "take an oath", "leave the city", "bring witnesses"], 1),
("In Hadith 34, the weakest level of faith is changing evil…", ["with the hand", "with the tongue", "with the heart", "with money"], 2),
("Who should change an evil with the hand?", ["Anyone", "Those with authority over the matter", "Only children", "Strangers"], 1),
("Abū Saʿīd narrated Hadith 34 when Marwān…", ["delayed Ẓuhr", "gave the Eid sermon before the prayer", "built a mosque", "went to Hajj"], 1),
("Najash (in Hadith 35) is…", ["praying fast", "bidding up a price with no intention to buy", "giving a gift", "travelling"], 1),
("Where did the Prophet ﷺ point when he said ‘Taqwā is here’?", ["To the sky", "To his chest", "To the Kaʿbah", "To his head"], 1),
("Which three things of a Muslim are sacred to another Muslim?", ["Car, house, phone", "Blood, wealth, honour", "Name, tribe, city", "Food, drink, clothes"], 1),
("Whoever relieves a believer of a worldly distress, Allah will relieve him of…", ["a debt", "a distress of the Day of Resurrection", "an illness", "a journey"], 1),
("Whoever walks a path seeking knowledge, Allah makes easy for him…", ["wealth", "a path to Paradise", "marriage", "fame"], 1),
("Which is NOT one of the gifts for those who gather to study the Qur’an?", ["Tranquillity descends", "Mercy covers them", "Angels surround them", "They become rich"], 3),
("“Whoever is slowed down by his deeds will not be hurried forward by…”", ["his wealth", "his lineage", "his strength", "his speed"], 1),
("A good deed that is intended but not done is written as…", ["nothing", "one complete good deed", "ten good deeds", "a bad deed"], 1),
("A good deed that is done can be multiplied up to…", ["two times", "seven hundred times and more", "ten times only", "a hundred times only"], 1),
("A bad deed that is done is written as…", ["ten bad deeds", "one bad deed", "nothing", "seven hundred bad deeds"], 1),
("According to Hadith 38, the most beloved way to draw near to Allah is…", ["voluntary deeds", "the obligations", "travel", "silence"], 1),
("The friends (awliyā’) of Allah are…", ["people with special powers", "the believers who have taqwā", "only the prophets", "the rich"], 1),
("Which three things are pardoned for this Ummah in Hadith 39?", ["Laziness, anger, jealousy", "Mistakes, forgetfulness and coercion", "Lying, cheating, stealing", "Sleep, food, travel"], 1),
("If someone forgets a prayer, he must…", ["leave it", "pray it when he remembers", "fast instead", "give charity instead"], 1),
("“Be in this world as if you were a stranger or…”", ["a king", "a wayfarer", "a merchant", "a scholar"], 1),
],
match=[
('ازْهَدْ فِي الدُّنْيَا يُحِبَّكَ اللَّهُ', 'Renounce the world and Allah will love you.'),
('لَا ضَرَرَ وَلَا ضِرَارَ', 'No harm and no returning harm.'),
('البَيِّنَةُ عَلَى المُدَّعِي', 'The proof is upon the one who makes the claim.'),
('مَنْ رَأَى مِنْكُمْ مُنْكَرًا فَلْيُغَيِّرْهُ بِيَدِهِ', 'Whoever of you sees an evil, let him change it with his hand.'),
('وَكُونُوا عِبَادَ اللَّهِ إِخْوَانًا', 'And be, O servants of Allah, brothers.'),
('وَاللَّهُ فِي عَوْنِ العَبْدِ مَا كَانَ العَبْدُ فِي عَوْنِ أَخِيهِ', 'Allah helps His servant as long as the servant helps his brother.'),
('كَتَبَهَا اللَّهُ عِنْدَهُ حَسَنَةً كَامِلَةً', 'Allah writes it down with Himself as a complete good deed.'),
('وَلَا يَزَالُ عَبْدِي يَتَقَرَّبُ إِلَيَّ بِالنَّوَافِلِ حَتَّى أُحِبَّهُ', 'My servant keeps drawing near to Me with voluntary deeds until I love him.'),
('الخَطَأَ وَالنِّسْيَانَ وَمَا اسْتُكْرِهُوا عَلَيْهِ', 'Mistakes, forgetfulness and what they are forced to do.'),
('كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ', 'Be in this world as though you are a stranger.'),
],
short=[
("Does zuhd mean being poor? Explain.", "No. It means the world is in your hand, not your heart; you leave what does not benefit the Hereafter."),
("What is the difference between ḍarar and ḍirār?", "Ḍarar is harming someone at all; ḍirār is harming in return, beyond what is just."),
("Give two examples of rulings built on Hadith 32.", "e.g. a neighbour may not build what seriously harms his neighbour; a will may not be made to harm the heirs."),
("What counts as ‘proof’ (bayyinah) in Hadith 33?", "Witnesses or clear evidence."),
("Name three conditions before changing an evil.", "Knowledge that it is an evil, ability/authority, gentleness, and that it does not lead to a greater evil."),
("List the five ‘do not’s at the start of Hadith 35.", "Do not envy, inflate prices, hate, turn your backs, or undercut each other’s sales."),
("What does ‘covering a Muslim’ mean, and what does it not mean?", "Not exposing a private mistake; it does not mean hiding harm or crimes against others."),
("When is leaving a bad deed written as a good deed?", "When it is left for the sake of Allah."),
("What happens when Allah loves a servant (Hadith 38)?", "He guides his hearing, sight, hands and feet, answers his du‘a and grants him refuge."),
("Explain Ibn ʿUmar’s advice at the end of Hadith 40.", "Do not delay good deeds from evening to morning; use health before sickness and life before death."),
],
critical=[
"Zuhd (Hadith 31) and working hard to earn halal money can seem to clash. Explain how a Muslim can be both successful at work and a zāhid.",
"Using Hadith 33, explain why we should not believe or share rumours on social media. What would happen to a community that ignored this rule?",
"You see a friend doing something wrong. Using Hadith 34, decide which level applies to you and write exactly what you would say or do.",
"Hadith 37 shows how generous Allah is in recording deeds. How should this change the way you plan your week? Give examples of intentions you could make.",
"If you truly lived ‘as a stranger or a wayfarer’ (Hadith 40), what would you do differently with your time, money and belongings?",
],
)

# ======================================================================= PART FIVE (41-50)
TESTS[5] = dict(
mcq=[
("In Hadith 41, faith is complete when a person’s desires…", ["are satisfied", "follow what the Prophet ﷺ brought", "are hidden", "are written down"], 1),
("Which verse supports the meaning of Hadith 41?", ["an-Nisā’ 4:65", "al-Baqarah 2:255", "al-Ikhlāṣ 112:1", "al-Kawthar 108:1"], 0),
("Hadith 42 is the last hadith of…", ["Ibn Rajab’s additions", "an-Nawawī’s original collection", "Ṣaḥīḥ al-Bukhārī", "the Qur’an"], 1),
("Which is NOT one of the three means of forgiveness in Hadith 42?", ["Du‘a with hope", "Istighfār", "Tawḥīd", "Travelling to Makkah"], 3),
("Which sin will not be forgiven if a person dies upon it?", ["Lying", "Shirk", "Anger", "Laziness"], 1),
("Hadith 43 is about…", ["prayer times", "the shares of inheritance", "fasting", "trade"], 1),
("What remains after the fixed shares goes to…", ["the poor", "the nearest male relative", "the government", "the eldest daughter"], 1),
("Which is paid FIRST from a person’s estate?", ["The heirs’ shares", "Funeral costs", "The bequest", "Gifts"], 1),
("A bequest (waṣiyyah) may be at most…", ["one-half", "one-third", "one-quarter", "all of the wealth"], 1),
("Hadith 44 teaches that fosterage forbids…", ["nothing", "what birth (blood relationship) forbids", "only marriage to the foster mother", "inheritance"], 1),
("Fosterage counts only if it happens within…", ["the first two years", "the first ten years", "any age", "the first week"], 0),
("Does fosterage give a right of inheritance?", ["Yes, always", "No", "Only for sons", "Only for daughters"], 1),
("In Hadith 45, which of these did the Prophet ﷺ forbid to be sold?", ["Dates", "Wine", "Wool", "Wheat"], 1),
("Melting the fat and selling it was a trick that teaches…", ["changing a thing’s form does not change its ruling", "trade is forbidden", "fat is halal", "selling is always allowed"], 0),
("Hadith 45 was said in the year of…", ["Badr", "the Conquest of Makkah", "the Trench", "Tabūk"], 1),
("“Every intoxicant is…”", ["disliked", "forbidden", "allowed in small amounts", "allowed for medicine"], 1),
("Bitʿ was a drink made from…", ["barley", "honey", "dates", "grapes"], 1),
("“Whatever intoxicates in a large amount, a small amount of it is…”", ["allowed", "forbidden", "disliked", "recommended"], 1),
("According to Hadith 47, the worst vessel a person fills is…", ["a bucket", "his stomach", "his bag", "his house"], 1),
("If one must eat more, the stomach is divided into…", ["halves", "thirds", "quarters", "fifths"], 1),
("Which is NOT one of the four signs of hypocrisy in Hadith 48?", ["When he speaks, he lies", "When he promises, he breaks it", "When he prays, he is late", "When he makes a pact, he betrays"], 2),
("Al-Ḥasan al-Baṣrī said that only a believer…", ["is rich", "fears hypocrisy", "is never sad", "knows the future"], 1),
("In Hadith 49, the birds go out in the morning…", ["full", "hungry", "sleeping", "singing"], 1),
("“Tie your camel and…”", ["leave it", "rely on Allah", "sell it", "ride it"], 1),
("In Hadith 50, the man was told to keep his tongue moist with…", ["water", "the remembrance of Allah", "honey", "poetry"], 1),
],
match=[
('حَتَّى يَكُونَ هَوَاهُ تَبَعًا لِمَا جِئْتُ بِهِ', 'Until his desires follow what I have brought.'),
('إِنَّكَ مَا دَعَوْتَنِي وَرَجَوْتَنِي غَفَرْتُ لَكَ', 'As long as you call on Me and hope in Me, I will forgive you.'),
('أَلْحِقُوا الفَرَائِضَ بِأَهْلِهَا', 'Give the fixed shares to those entitled to them.'),
('الرَّضَاعَةُ تُحَرِّمُ مَا تُحَرِّمُ الوِلَادَةُ', 'Breast-feeding makes unlawful what birth makes unlawful.'),
('إِنَّ اللَّهَ وَرَسُولَهُ حَرَّمَ بَيْعَ الخَمْرِ', 'Allah and His Messenger have forbidden the sale of wine.'),
('كُلُّ مُسْكِرٍ حَرَامٌ', 'Every intoxicant is forbidden.'),
('فَثُلُثٌ لِطَعَامِهِ، وَثُلُثٌ لِشَرَابِهِ، وَثُلُثٌ لِنَفَسِهِ', 'A third for his food, a third for his drink and a third for his breath.'),
('إِذَا حَدَّثَ كَذَبَ، وَإِذَا وَعَدَ أَخْلَفَ', 'When he speaks he lies, and when he promises he breaks it.'),
('تَغْدُو خِمَاصًا وَتَرُوحُ بِطَانًا', 'They go out hungry in the morning and return full in the evening.'),
('لَا يَزَالُ لِسَانُكَ رَطْبًا مِنْ ذِكْرِ اللَّهِ', 'Let your tongue remain moist with the remembrance of Allah.'),
],
short=[
("What does hawā mean, and why is following it against the Shariah dangerous?", "What the soul desires; following it against revelation is the root of sins and innovations."),
("Name the three means of forgiveness in Hadith 42.", "Du‘a with hope, seeking forgiveness (istighfār), and meeting Allah with tawḥīd."),
("Put these in order: bequest, funeral costs, inheritance shares, debts.", "Funeral costs, debts, bequest, inheritance shares."),
("Name four relatives who become maḥram through fosterage.", "The foster mother, foster father (her husband), foster siblings, foster aunts, foster grandparents."),
("What general rule did scholars take from Hadith 45?", "When Allah forbids something to be used, He forbids its price."),
("Why is Hadith 46 an example of jawāmiʿ al-kalim?", "One short sentence gives a rule that covers every intoxicant in every age."),
("List four manners of eating from the Sunnah.", "Bismillah, right hand, eat from what is in front of you, do not criticise food, praise Allah after."),
("What are the two kinds of hypocrisy?", "Major (in belief) and minor (in actions)."),
("Explain the difference between tawakkul and laziness.", "Tawakkul is relying on Allah while taking the means; laziness abandons the means."),
("Why is dhikr called an easy deed?", "It needs no money, place or special time and can be done in any position."),
],
critical=[
"Hadith 42 gives great hope. How would you use it to help a friend who feels his sins are too many — without making him careless about sin?",
"A Muslim company calls interest a ‘service fee’. Using Hadith 45 and the story of the melted fat, explain why the name does not change the ruling.",
"Plan one week of meals for yourself or your family that follows Hadith 47. What changes would you make, and what benefits do you expect?",
"Which of the four signs of hypocrisy (Hadith 48) is most common in school or work today? Suggest a practical way to fight it.",
"You have finished the fifty hadith. Choose the three that changed you the most and explain why, ending with how Hadith 50 can keep you steadfast.",
],
)


import random


def answer_positions(part, n):
    """Balanced, mixed positions for the correct answers: each letter about n/4 times, never 3 in a row."""
    rnd = random.Random(part * 97 + 11)
    while True:
        pos = [i % 4 for i in range(n)]
        rnd.shuffle(pos)
        if all(not (pos[i] == pos[i - 1] == pos[i - 2]) for i in range(2, n)):
            return pos


def shuffled_mcq(part):
    """Options in a fixed shuffled order (same in print and online); returns list of (q, opts, correct_index)."""
    out = []
    mcq = TESTS[part]["mcq"]
    targets = answer_positions(part, len(mcq))
    for i, (q, opts, ans) in enumerate(mcq):
        rnd = random.Random(part * 1000 + i)
        others = [o for k, o in enumerate(opts) if k != ans]
        rnd.shuffle(others)
        t = targets[i]
        out.append((q, others[:t] + [opts[ans]] + others[t:], t))
    return out


def shuffled_match(part):
    """Right column in a fixed shuffled order; returns (lefts, rights, key) where key[i] = index in rights."""
    pairs = TESTS[part]["match"]
    rnd = random.Random(part * 7 + 3)
    order = list(range(len(pairs)))
    while True:
        rnd.shuffle(order)
        if all(order[i] != i for i in range(len(order))):
            break
    rights = [pairs[k][1] for k in order]
    key = [order.index(i) for i in range(len(pairs))]
    return [p[0] for p in pairs], rights, key


# Which hadith each multiple-choice question is about (in the order written above), for the online advice.
MCQ_HADITH = {
1: [1, 1, 1, 2, 2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 6, 6, 6, 6, 7, 7, 8, 8, 9, 9, 10],
2: [11, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16, 16, 17, 17, 18, 18, 19, 19, 19, 19, 19, 20, 20],
3: [21, 21, 21, 22, 22, 23, 23, 23, 23, 23, 23, 24, 24, 24, 25, 25, 26, 26, 26, 27, 27, 28, 28, 29, 29],
4: [31, 31, 31, 32, 32, 33, 33, 34, 34, 34, 35, 35, 35, 36, 36, 36, 36, 37, 37, 37, 38, 38, 39, 39, 40],
5: [41, 41, 42, 42, 42, 43, 43, 43, 43, 44, 44, 44, 45, 45, 45, 46, 46, 46, 47, 47, 48, 48, 49, 49, 50],
}
