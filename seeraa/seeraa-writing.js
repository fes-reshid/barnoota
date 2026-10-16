/* Question 15 of every Map Challenge is the student's reflection on the map, in
   four parts: what I learned, what I will do, the duʿāʾ I learned, and whether I
   have practised it. The student answers in their own words and sends it to the
   teacher; only then do they see their result. Sending earns the 15th point.
   It is kept in the student's own progress (profile.mapWritings[map]), so the
   Teacher portal (Maps → Map review) can read it, correct it, add a note, and
   accept it or ask for it again; it also goes to the teacher as a private
   message, through the messages the app already has. The teacher's reply shows
   under the map in “From your teacher”. A teacher changes the questions and the
   duʿāʾ with ✏️ Edit Map N. */
(function(){
'use strict';
/* What did you learn: one task for each map */
const PROMPTS=[
 'In your own words, tell how the Kaʿbah was built for Allah alone, and how idols came into Makkah. Why did the people need guidance from Allah?',
 'Choose one person from the Prophet’s ﷺ family in this map — Hāshim, ʿAbd al-Muṭṭalib, ʿAbdullāh or Āminah. Write what they did, and one good quality you learned from them.',
 'Tell the story of Abrahah and his elephant army in your own words. What did ʿAbd al-Muṭṭalib mean when he said “The House has a Lord”, and how did Allah protect His House?',
 'Write about the Prophet’s ﷺ blessed birth and his years with Ḥalīmah in the desert. What blessings came to Ḥalīmah’s family while she looked after him?',
 'The Prophet ﷺ lost his mother and his grandfather when he was young, and he worked as a shepherd. Write how Allah took care of him, and what a shepherd learns that helps a leader.',
 'Why did the people of Makkah call the Prophet ﷺ al-Amīn, the Trustworthy One? Write about the Pact of Fairness or another story from this map, and how you can be trustworthy too.',
 'Write about the Prophet’s ﷺ honest trading for Khadījah and what Maysarah told her. Then tell why Zayd chose to stay with the Prophet ﷺ instead of going home.',
 'Retell how the Prophet ﷺ solved the quarrel about the Black Stone so that every tribe was happy. Then write why he liked to go to the Cave of Ḥirāʾ.',
 'Tell what happened in the Cave of Ḥirāʾ when the first verses, “Read!”, came down. How did Khadījah comfort the Prophet ﷺ, and what did Waraqah say?',
 'Who were the first people to believe? Write about one of them — Khadījah, Abū Bakr, ʿAlī or Zayd — and why their faith was so special.',
 'Write about the day the Prophet ﷺ called the people from Mount Ṣafā. What did he ask them, what did he tell them, and how did Abū Ṭālib stand by him?',
 'Bilāl kept saying “Aḥad, Aḥad — One, One” even while he was hurt. Write about Bilāl or the family of Yāsir, and how you can stay firm when something is hard.',
 'Retell the journey across the sea to Abyssinia in your own words. What did Jaʿfar say to the Najāshī, and why did the king protect the Muslims?',
 'Choose Ḥamzah or ʿUmar. Write how he became a Muslim, and how his Islam gave strength to the believers.',
 'Write about the three hard years in the valley. How did the Muslims stay patient, how did the boycott end, and why was the next year called the Year of Sorrow?',
 'At Ṭāʾif the people hurt the Prophet ﷺ, yet he hoped that their children would worship Allah instead of asking for them to be punished. Write the story and what it teaches you about mercy.',
 'Write about the Night Journey and the rising through the heavens in your own words. What gift did Allah give the Muslims that night, and why was Abū Bakr called aṣ-Ṣiddīq?',
 'Choose Ṭufayl, Abū Dharr or the six men from Yathrib. Write how Islam reached their hearts, and what they did next.',
 'Write about Muṣʿab ibn ʿUmayr, the first teacher sent to Yathrib. How did his gentle words help Usayd and Saʿd accept Islam, and what was promised at the Second Pledge?',
 'Write how the believers left Makkah for Madīnah. Choose Ṣuhayb’s “best trade” or ʿAlī sleeping in the Prophet’s ﷺ bed, and tell what it shows about their faith.',
 'Imagine you are near the Cave of Thawr. Write what happened there and on the road to Madīnah — Asmāʾ, the careful plan and Surāqah’s horse. What do you learn about trusting Allah?',
 'Describe the day the Prophet ﷺ arrived in Madīnah. How did the people welcome him, and what happened when everyone asked him to stay with them?',
 'The first things built in Madīnah were the Masjid and the brotherhood between the Muhājirūn and the Anṣār. Write about one of them, and how you can be a good brother or sister to others.',
 'Choose ʿAbdullāh ibn Salām or Salmān al-Fārisī. Write how he searched for the truth and found it. Then write one thing you learned about the new qiblah or the first Ramaḍān.',
 'Write about the dangers Madīnah faced — people with two faces inside and enemies outside. Why did Allah give the believers permission to defend themselves?',
 'Before Badr the Prophet ﷺ asked his companions for advice and made long duʿāʾ in the shelter. Write how Allah helped the believers before the battle.',
 'Write about the Day of Badr in your own words. Then tell how some captives earned their freedom by teaching Muslim children to read and write. Why is that special?',
 'Choose one story from this map — ʿUthmān staying behind, Zaynab’s necklace, or Fāṭimah’s simple wedding — and write what it teaches about family and kindness.',
 'Write about the Battle of Uḥud. What happened when the archers left the hill, and what lesson about obeying the Prophet ﷺ do we learn?',
 'Choose one hero of Uḥud — Umm ʿUmārah, Ḥamzah, Muṣʿab, or the companions who shielded the Prophet ﷺ — and write about their courage.',
 'After Uḥud the believers said “Ḥasbunallāh — Allah is enough for us.” Write what this means, and a time in your own life when you can say it.',
 'Write about the digging of the Trench. Who suggested the idea, how did everyone work and sing together, and what happened at Jābir’s little meal?',
 'Write how the siege of the Trench ended with a wind from Allah. Then tell about Abū Lubābah tying himself to the pillar — what does it teach about turning back to Allah?',
 'This map is about tests of truth, like the lie that was spread about ʿĀʾishah. Write why we must not pass on stories we hear, and how beautiful patience helps.',
 'Write about the Treaty of Ḥudaybiyyah. Some terms seemed unfair, yet Allah called it “a clear victory”. Why? Also write how Umm Salamah’s advice helped.',
 'The Prophet ﷺ sent letters to kings, inviting them to Islam. Write about one letter, or about the questions Heraclius asked Abū Sufyān and what the answers showed.',
 'Choose a story from this map — Khaybar, Jaʿfar coming home, Ṣafiyyah, or Abū Hurayrah and the cup of milk — and write it in your own words with its lesson.',
 'A man raised a sword and asked, “Who will protect you from me?” Write the story and the Prophet’s ﷺ answer. What does it teach about trusting Allah?',
 'Write about the Battle of Muʾtah. Why is Jaʿfar called “Jaʿfar of the Two Wings”, and how did Khālid become the Sword of Allah?',
 'Write how the treaty was broken and how the Prophet ﷺ marched to Makkah. What happened with Ḥāṭib’s letter, and why were many fires lit at Marr aẓ-Ẓahrān?',
 'When the Prophet ﷺ entered Makkah he forgave the people who had hurt him for years. Write about this mercy and one person who was forgiven, like ʿIkrimah.',
 'At Ḥunayn the Muslims were many, but numbers alone did not bring victory. Write the lesson of Ḥunayn, or why the Anṣār wept after the Prophet ﷺ spoke to them.',
 'Write about Kaʿb ibn Mālik, who told the truth even though it was hard. What happened to him, and why is honesty always better?',
 'Many groups came to Madīnah to learn about Islam. Write about Ḍimām’s questions or another visitor — and one question you would ask to learn more about Islam.',
 'Write about the Farewell Pilgrimage and the Prophet’s ﷺ final days. What is one thing from his last sermon that you want to remember all your life?'
];
/* For each map: what to apply, and the duʿāʾ the map teaches (Arabic, meaning, source).
   duaQ, when given, replaces the usual duʿāʾ question. */
const REFLECT=[
 {apply:'How will you keep your worship for Allah alone this week?',dua:['رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ','Our Lord, accept this from us. You are the All-Hearing, the All-Knowing.','al-Baqarah 2:127 · the duʿāʾ of Ibrāhīm and Ismāʿīl as they built the Kaʿbah']},
 {apply:'How will you show love and care to your parents and family this week?',dua:['رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا','My Lord, have mercy on them, as they raised me when I was small.','al-Isrāʾ 17:24 · a duʿāʾ for parents']},
 {apply:'When something feels too big for you, what will you do?',dua:['رَّبَّنَا عَلَيْكَ تَوَكَّلْنَا وَإِلَيْكَ أَنَبْنَا وَإِلَيْكَ الْمَصِيرُ','Our Lord, in You we trust, to You we turn, and to You is the return.','al-Mumtaḥanah 60:4 · the duʿāʾ of Ibrāhīm']},
 {apply:'How will you send ṣalāh on the Prophet ﷺ and share his story with someone?',dua:['اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ','O Allah, send Your blessings on Muḥammad and on the family of Muḥammad.','the ṣalāh on the Prophet ﷺ · Ṣaḥīḥ al-Bukhārī 3370']},
 {apply:'Who is an orphan or a lonely person you can be kind to, and how?',dua:['رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ','Our Lord, forgive me, my parents and the believers on the Day the account is taken.','Ibrāhīm 14:41']},
 {apply:'How will you be trustworthy at home and at school this week?',dua:['اللَّهُمَّ اهْدِنِي لِأَحْسَنِ الْأَخْلَاقِ، لَا يَهْدِي لِأَحْسَنِهَا إِلَّا أَنْتَ','O Allah, guide me to the best manners; no one guides to the best of them except You.','from a duʿāʾ of the Prophet ﷺ · Ṣaḥīḥ Muslim 771']},
 {apply:'How will you be honest when you buy, sell, share or play?',dua:['رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا','Our Lord, give us joy in our families and children, and make us good examples for those who are mindful of You.','al-Furqān 25:74']},
 {apply:'How will you find a quiet time each day to remember Allah and make duʿāʾ?',dua:['اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ','Guide us to the straight path.','al-Fātiḥah 1:6 · we ask for it in every prayer']},
 {apply:'How will you love reading and learning, like the first word that came down: “Read!”?',dua:['رَّبِّ زِدْنِي عِلْمًا','My Lord, increase me in knowledge.','Ṭā Hā 20:114']},
 {apply:'How can you be a good friend who helps others come closer to Allah?',dua:['رَبَّنَا آمَنَّا بِمَا أَنزَلْتَ وَاتَّبَعْنَا الرَّسُولَ فَاكْتُبْنَا مَعَ الشَّاهِدِينَ','Our Lord, we believe in what You sent down and we follow the Messenger, so write us among those who bear witness.','Āl ʿImrān 3:53']},
 {apply:'How will you speak the truth kindly, even when it is hard?',dua:['رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي','My Lord, open my heart for me, and make my task easy for me.','Ṭā Hā 20:25–26 · the duʿāʾ of Mūsā before he spoke to Firʿawn']},
 {apply:'What will you do to stay firm and patient when something is hard?',dua:['يَا مُقَلِّبَ الْقُلُوبِ، ثَبِّتْ قَلْبِي عَلَىٰ دِينِكَ','O Turner of hearts, keep my heart firm on Your religion.','Jāmiʿ at-Tirmidhī 2140']},
 {apply:'How will you help someone who is new, a stranger or far from home?',dua:['رَبِّ نَجِّنِي مِنَ الْقَوْمِ الظَّالِمِينَ','My Lord, save me from the people who do wrong.','al-Qaṣaṣ 28:21 · the duʿāʾ of Mūsā as he left for safety']},
 {apply:'How can you use your strength or your talent to help Islam and people?',dua:['اللَّهُمَّ أَعِزَّ الْإِسْلَامَ بِأَحَبِّ هَذَيْنِ الرَّجُلَيْنِ إِلَيْكَ: بِأَبِي جَهْلٍ أَوْ بِعُمَرَ بْنِ الْخَطَّابِ','O Allah, strengthen Islam through whichever of these two men is more beloved to You: Abū Jahl or ʿUmar ibn al-Khaṭṭāb.','Jāmiʿ at-Tirmidhī 3681'],duaQ:'Allah answered this duʿāʾ when ʿUmar became Muslim. Who would you like Allah to guide? Write a duʿāʾ for them.'},
 {apply:'How will you stay patient, and share with others, when times are hard?',dua:['إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ','We belong to Allah, and to Him we return.','al-Baqarah 2:156 · said at a time of loss']},
 {apply:'How will you answer unkindness with mercy, like the Prophet ﷺ at Ṭāʾif?',dua:null,duaQ:'At Ṭāʾif the Prophet ﷺ hoped his people would one day worship Allah, instead of asking for them to be punished. Write a duʿāʾ for someone who was unkind to you — ask Allah to guide them.'},
 {apply:'How will you look after your five daily prayers?',dua:['رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ','My Lord, make me one who keeps up the prayer, and my children too. Our Lord, accept my duʿāʾ.','Ibrāhīm 14:40']},
 {apply:'What good thing you learned about Islam will you share with someone, and how?',dua:['رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا','Our Lord, do not let our hearts turn away after You have guided us.','Āl ʿImrān 3:8']},
 {apply:'What promise to Allah will you keep this week?',dua:['اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ، وَأَعُوذُ بِكَ مِنَ النَّارِ','O Allah, I ask You for Paradise, and I seek Your protection from the Fire.','Sunan Abī Dāwūd 792']},
 {apply:'What will you give up, or do, for the sake of Allah?',dua:['رَّبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ','My Lord, let me enter in truth and let me leave in truth.','al-Isrāʾ 17:80']},
 {apply:'How will you plan carefully and still put your trust in Allah?',dua:['سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ','Glory be to the One who made this ride easy for us; we could never have done it by ourselves.','az-Zukhruf 43:13 · the duʿāʾ for travelling']},
 {apply:'How will you welcome guests and make people happy to see you?',dua:['بِسْمِ اللَّهِ','In the name of Allah.','said before eating, drinking and starting good things, as the Prophet ﷺ did in Umm Maʿbad’s tent']},
 {apply:'How will you be a good brother or sister to the Muslims around you?',dua:['اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ','O Allah, open for me the doors of Your mercy.','Ṣaḥīḥ Muslim 713 · said when entering the masjid']},
 {apply:'How will you prepare for Ramaḍān, or keep your fasting and prayer well?',dua:['ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ','The thirst is gone, the body is refreshed, and the reward is sure, if Allah wills.','Sunan Abī Dāwūd 2357 · said when breaking the fast']},
 {apply:'How will you be the same person in front of people and when you are alone?',dua:['أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ','I seek protection in the perfect words of Allah from the harm of what He created.','Ṣaḥīḥ Muslim 2708']},
 {apply:'Before something hard, like a test, how will you prepare — and then make duʿāʾ?',dua:['اللَّهُمَّ أَنْجِزْ لِي مَا وَعَدْتَنِي','O Allah, fulfil for me what You promised me.','Ṣaḥīḥ Muslim 1763 · the Prophet’s ﷺ duʿāʾ in the shelter at Badr'],duaQ:'The Prophet ﷺ prepared well, then raised his hands to Allah. Write this duʿāʾ, and the duʿāʾ you will make before something hard.'},
 {apply:'How will you thank Allah when something goes well for you?',dua:['رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ','My Lord, help me to be thankful for the blessings You have given me and my parents.','an-Naml 27:19']},
 {apply:'How will you be kind, simple and helpful with your family?',dua:['سُبْحَانَ اللَّهِ · الْحَمْدُ لِلَّهِ · اللَّهُ أَكْبَرُ','Glory be to Allah (33 times), all praise is for Allah (33 times), Allah is the Greatest (34 times) — at bedtime.','Ṣaḥīḥ al-Bukhārī 3705 · taught to ʿAlī and Fāṭimah']},
 {apply:'How will you listen to your parents and teachers, even when you want something else?',dua:['رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا وَثَبِّتْ أَقْدَامَنَا','Our Lord, forgive our sins and our mistakes, and make our feet firm.','Āl ʿImrān 3:147']},
 {apply:'How will you be brave in doing what is right?',dua:['اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ','O Allah, forgive him and have mercy on him.','Ṣaḥīḥ Muslim 963 · a duʿāʾ for those who have passed away']},
 {apply:'When you feel afraid or tired, what will you say and do?',dua:['حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ','Allah is enough for us, and He is the best One to rely on.','Āl ʿImrān 3:173']},
 {apply:'How will you help in a team job at home or at school, even when it is hard?',dua:['اللَّهُمَّ إِنَّ الْعَيْشَ عَيْشُ الْآخِرَهْ، فَاغْفِرْ لِلْأَنْصَارِ وَالْمُهَاجِرَهْ','O Allah, the real life is the life of the Hereafter, so forgive the Anṣār and the Muhājirūn.','Ṣaḥīḥ al-Bukhārī 2834 · sung while digging the Trench']},
 {apply:'When you make a mistake, how will you turn back to Allah and say sorry?',dua:['أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ','I ask Allah to forgive me, and I turn back to Him.','Ṣaḥīḥ al-Bukhārī 6307 · the Prophet ﷺ said it more than seventy times a day']},
 {apply:'What will you do when you hear a story about someone that may not be true?',dua:['سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ','Glory and praise be to Allah, as many times as His creation, as much as pleases Him, as heavy as His Throne, and as much as the ink of His words.','Ṣaḥīḥ Muslim 2726 · taught to Juwayriyyah']},
 {apply:'How will you choose peace and listen to good advice?',dua:['رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا','Our Lord, give us mercy from You, and guide us to what is right in our affairs.','al-Kahf 18:10']},
 {apply:'How can you invite someone to Islam with good manners?',dua:['اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَىٰ وَالتُّقَىٰ وَالْعَفَافَ وَالْغِنَىٰ','O Allah, I ask You for guidance, mindfulness of You, purity, and a heart that is content.','Ṣaḥīḥ Muslim 2721']},
 {apply:'How will you share your food or your things with someone in need?',dua:['الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَٰذَا الطَّعَامَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ','All praise is for Allah, who fed me this food and gave it to me without any power or strength from me.','Jāmiʿ at-Tirmidhī 3458 · said after eating']},
 {apply:'How will you trust Allah when you feel afraid?',dua:['بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ','In the name of Allah, with whose name nothing on earth or in the sky can harm, and He is the All-Hearing, the All-Knowing.','Sunan Abī Dāwūd 5088 · said three times in the morning and evening']},
 {apply:'How will you be brave and keep going when others need you?',dua:['رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا','Our Lord, pour patience upon us and make our feet firm.','al-Baqarah 2:250']},
 {apply:'How will you be honest about your mistakes?',dua:['رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ','Our Lord, we have wronged ourselves. If You do not forgive us and have mercy on us, we will surely be losers.','al-Aʿrāf 7:23 · the duʿāʾ of Ādam and Ḥawwāʾ']},
 {apply:'Who will you forgive this week, even if they hurt you?',dua:['سُبْحَانَكَ اللَّهُمَّ رَبَّنَا وَبِحَمْدِكَ، اللَّهُمَّ اغْفِرْ لِي','Glory be to You, O Allah, our Lord, and praise be to You. O Allah, forgive me.','Ṣaḥīḥ al-Bukhārī 817 · the Prophet ﷺ said it often, following Sūrat an-Naṣr']},
 {apply:'How will you remember that help comes from Allah, not from how many we are?',dua:['لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ','There is no power and no strength except with Allah.','Ṣaḥīḥ al-Bukhārī 6384 · a treasure of Paradise']},
 {apply:'How will you tell the truth even when it is hard?',dua:['اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي','O Allah, You are the One who pardons, and You love to pardon, so pardon me.','Jāmiʿ at-Tirmidhī 3513']},
 {apply:'What question about Islam will you ask your teacher or your parents?',dua:['اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي، وَعَلِّمْنِي مَا يَنْفَعُنِي، وَزِدْنِي عِلْمًا','O Allah, benefit me with what You have taught me, teach me what will benefit me, and increase me in knowledge.','Jāmiʿ at-Tirmidhī 3599']},
 {apply:'Which advice from the Farewell Sermon will you live by?',dua:['رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ','Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.','al-Baqarah 2:201 · the duʿāʾ the Prophet ﷺ made most often (al-Bukhārī 6389)']}
];
const DUA_Q='Learn this duʿāʾ. Write it in Arabic or in your own words, and tell when you will say it.';
const PRACTICE_Q='Have you practised it — the duʿāʾ and what you will do?';
const PRACTICE=['Yes, every day','Yes, a few times','Not yet — I will start'];
const PART=[['learn','📖','What I learned'],['apply','🌱','What I will do'],['dua','🤲','The duʿāʾ I learned'],['practice','✅','Have I practised it?']];
const MIN={learn:15,apply:6,dua:3};
const esc=s=>typeof escapeHtml==='function'?escapeHtml(String(s==null?'':s)):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const q=s=>document.querySelector(s);
const defaultPrompt=w=>PROMPTS[w]||`Write what you learned on Map ${w+1} in your own words.`;
const edit=w=>typeof contentEdits!=='undefined'&&typeof mapKey==='function'?contentEdits[mapKey(w)]||{}:{};
const pick=(v,d)=>typeof v==='string'&&v.trim()?v.trim():d;
function original(w){const r=REFLECT[w]||{};return{learn:defaultPrompt(w),apply:r.apply||'What will you do in your own life because of this map?',dua:r.dua?{ar:r.dua[0],en:r.dua[1],ref:r.dua[2]}:null,duaQ:r.duaQ||(r.dua?DUA_Q:'Which duʿāʾ or dhikr did you learn or say on this map? Write it, and when you say it.')}}
/* the questions for a map, with the teacher's edits */
function cfg(w){const o=original(w),e=edit(w),ar=pick(e.duaAr,'');
 return{learn:pick(e.writePrompt,o.learn),apply:pick(e.applyPrompt,o.apply),dua:ar?{ar,en:pick(e.duaEn,''),ref:pick(e.duaRef,'')}:o.dua,duaQ:pick(e.duaPrompt,o.duaQ)}}
const promptFor=w=>cfg(w).learn;
const words=t=>String(t||'').trim().split(/\s+/).filter(x=>/[\p{L}\p{N}]/u.test(x));
const different=t=>new Set(words(t).map(x=>x.toLowerCase().replace(/[^\p{L}\p{N}]/gu,''))).size;
function list(){if(!Array.isArray(profile.mapWritings))profile.mapWritings=[];return profile.mapWritings}
const mine=w=>list()[w]||null;
/* the teacher has answered this version (a newer send waits for a new answer);
   review.for is the version it answers, so the two devices' clocks never matter */
const answered=x=>!!(x&&x.review&&x.review.at&&(x.review.for?x.review.for===x.at:String(x.review.at)>=String(x.at||'')));
const draftKey=w=>(typeof progressKey==='function'?progressKey():'seeraa')+':reflection:'+w;
const getDraft=w=>{try{return JSON.parse(localStorage.getItem(draftKey(w))||'null')}catch(e){return null}};
const setDraft=(w,d)=>{try{if(d)localStorage.setItem(draftKey(w),JSON.stringify(d));else localStorage.removeItem(draftKey(w))}catch(e){}};
const fmtDate=d=>{const x=new Date(d);return isNaN(x)?'':x.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})};
const answerOf=p=>p.k==='practice'?(p.a||'')+(p.how?' — '+p.how:''):(p.a||'');
const textOf=parts=>parts.map(p=>{const L=PART.find(x=>x[0]===p.k);return `${L[1]} ${L[2]}: ${answerOf(p)}`}).join('\n\n');
const duaHTML=d=>d?`<div class="wr-dua"><p class="wr-dua-ar" lang="ar" dir="rtl">${esc(d.ar)}</p>${d.en?`<p class="wr-dua-en">${esc(d.en)}</p>`:''}${d.ref?`<small>${esc(d.ref)}</small>`:''}</div>`:'';

/* keep the list one place per map */
if(typeof normalizeProfile==='function'){const before=normalizeProfile;normalizeProfile=function(){const d=before.apply(this,arguments);if(d&&typeof d==='object'){const a=Array.isArray(d.mapWritings)?d.mapWritings:[];d.mapWritings=[...a,...Array(worlds.length).fill(null)].slice(0,worlds.length).map(x=>x&&typeof x==='object'&&typeof x.text==='string'?x:null)}return d}}

function reviewHTML(x){
 if(!answered(x))return '';const r=x.review,who=esc(r.by||'Your teacher'),again=r.status==='rewrite';
 return `<div class="wr-reply ${again?'again':'ok'}"><div class="who">${again?'↩️':'✅'} ${who} · ${fmtDate(r.at)}</div><p class="wr-reply-state">${again?'Your teacher asks you to write it again.':'Your teacher accepted your reflection. Mā shā’ Allāh!'}</p>${r.note?`<p class="wr-reply-note">${esc(r.note)}</p>`:''}${r.text&&r.text!==x.text?`<details class="wr-fix"><summary>See your teacher’s corrected version</summary><p>${esc(r.text)}</p></details>`:''}</div>`;
}
function partsHTML(x){
 if(!Array.isArray(x.parts))return `<p class="wr-mine-text">${esc(x.text)}</p>`;
 return x.parts.map(p=>{const L=PART.find(z=>z[0]===p.k)||['','•',''];return `<div class="wr-mine-part"><b>${L[1]} ${esc(L[2])}</b><span class="wr-mine-q">${esc(p.q||'')}</span>${p.k==='dua'&&p.dua?`<span class="wr-mine-dua" lang="ar" dir="rtl">${esc(p.dua.ar)}</span>`:''}<p>${esc(answerOf(p))}</p></div>`}).join('');
}

/* the reflection also goes to the teacher as a private message (the existing
   messages: kids_quest_messages/{student}), so it shows up in their inbox */
function messageTeacher(w,rec){
 const KC=window.KidsCloud;if(typeof cloudUser==='undefined'||!cloudUser||!KC||!KC.sendMessage||!KC.currentUid||!KC.currentUid())return Promise.resolve(false);
 const name=typeof myName==='function'?myName():(profile.name||'Student'),title=String(worlds[w].title||'').replace(/^Map \d+\s*·\s*/,'');
 let text=`✍️ Map ${w+1} reflection · ${title}\n\n${rec.text}`;if(text.length>1990)text=text.slice(0,1960).trimEnd()+'…\n(The rest is in Map review.)';
 return KC.sendMessage(KC.currentUid(),{from:'student',text,authorName:name,studentName:name}).then(()=>{rec.messagedAt=new Date().toISOString();save();if(typeof loadStudentMsgPreview==='function')loadStudentMsgPreview();return true}).catch(()=>false);
}

/* one screen for both: question 15 of the challenge, and “write it again” from the map */
let challengeDone=false,sentWords=0;
function showWriting(mode){
 const w=viewWorld,prev=mine(w),inChallenge=mode==='challenge',c=cfg(w);
 const was=k=>{const p=prev&&Array.isArray(prev.parts)?prev.parts.find(x=>x.k===k):null;return p||null};
 const d=getDraft(w)||{learn:was('learn')?was('learn').a:(prev?prev.text:''),apply:was('apply')?was('apply').a:'',dua:was('dua')?was('dua').a:'',practice:was('practice')?was('practice').a:'',how:was('practice')?was('practice').how||'':''};
 const head=inChallenge?`<p class="kicker">Map ${w+1} Certificate Challenge</p><h1>${MAP_QUIZ_TOTAL} Questions</h1><div class="map-quiz-score">🏆 Question ${mapQuizIndex+1}/${MAP_QUIZ_TOTAL} &nbsp; · &nbsp; Score ${mapQuizCorrect}</div><div class="quiz-meta"><span>Score ${MAP_QUIZ_PASS} or more to pass</span><span class="quiz-dots">${Array(MAP_QUIZ_TOTAL).fill(0).map((_,i)=>`<span class="quiz-dot ${i<mapQuizIndex?'done':i===mapQuizIndex?'current':''}"></span>`).join('')}</span></div>`
  :`<p class="kicker">Map ${w+1} · My reflection</p><h1>Write it again</h1>`;
 const box=(k,n,body)=>{const L=PART.find(x=>x[0]===k);return `<section class="wr-part" data-part="${k}"><h3><span class="wr-n">${n}</span>${L[1]} ${esc(L[2])}</h3>${body}<p class="wr-need-msg" aria-live="polite"></p></section>`};
 const area=(k,rows,ph)=>`<textarea id="wr-${k}" class="wr-text" rows="${rows}" maxlength="1500" placeholder="${esc(ph)}" spellcheck="true" autocapitalize="sentences">${esc(d[k]||'')}</textarea><div class="wr-count" data-count="${k}"></div>`;
 q('#mapQuizBody').innerHTML=`${head}<div class="wr-task"><span class="wr-tag">✍️ My reflection · your teacher will read it</span><p class="wr-rule">Answer the four parts in your own words. It goes to your teacher like a message.</p></div>${prev&&!inChallenge?reviewHTML(prev):''}${prev&&inChallenge?`<p class="wr-before">You sent a reflection on ${fmtDate(prev.at)}. Read it again, make it better, and send it.</p>`:''}`
  +box('learn',1,`<p class="wr-prompt" id="wrPrompt">${esc(c.learn)}</p>${area('learn',6,'Start writing here…')}`)
  +box('apply',2,`<p class="wr-prompt">${esc(c.apply)}</p>${area('apply',3,'I will…')}`)
  +box('dua',3,`${duaHTML(c.dua)}<p class="wr-prompt">${esc(c.duaQ)}</p>${area('dua',3,'The duʿāʾ, and when I say it…')}`)
  +box('practice',4,`<p class="wr-prompt">${esc(PRACTICE_Q)}</p><div class="wr-choices" role="radiogroup" aria-label="${esc(PRACTICE_Q)}">${PRACTICE.map((t,i)=>`<label class="wr-choice"><input type="radio" name="wr-practice" value="${esc(t)}" ${d.practice===t?'checked':''}><span>${['✅','🙂','⏳'][i]} ${esc(t)}</span></label>`).join('')}</div><input id="wr-how" class="wr-how" maxlength="300" placeholder="How? When? (optional)" value="${esc(d.how||'')}">`)
  +`${typeof cloudUser!=='undefined'&&cloudUser?'':'<p class="wr-guest">Sign in so your teacher can read it — for now it stays on this device.</p>'}<div class="feedback" id="wrMsg" aria-live="polite"></div>`;
 q('#mapQuizActions').innerHTML=`<button class="btn green" id="wrSend">📨 Send to my teacher</button><button class="ghost" id="wrExit">${inChallenge?'Exit to Map':'Back to map'}</button>`;
 const body=q('#mapQuizBody'),val=k=>(q('#wr-'+k)||{}).value||'',practice=()=>{const r=body.querySelector('input[name="wr-practice"]:checked');return r?r.value:''};
 const current=()=>({learn:val('learn').trim(),apply:val('apply').trim(),dua:val('dua').trim(),practice:practice(),how:val('how').trim()});
 const count=k=>{const el=body.querySelector(`[data-count="${k}"]`),n=words(val(k)).length;if(el){el.textContent=n>=MIN[k]?`✓ ${n} words`:`${n} / ${MIN[k]} words`;el.className='wr-count'+(n>=MIN[k]?' ok':'')}};
 const clearNeed=part=>{part.classList.remove('wr-need');part.querySelector('.wr-need-msg').textContent='';const m=q('#wrMsg');if(m&&m.classList.contains('bad')&&!body.querySelector('.wr-part.wr-need')){m.textContent='';m.className='feedback'}};
 Object.keys(MIN).forEach(k=>{count(k);q('#wr-'+k).addEventListener('input',()=>{count(k);clearNeed(q('#wr-'+k).closest('.wr-part'));setDraft(w,current())})});
 body.querySelectorAll('input[name="wr-practice"]').forEach(r=>r.onchange=()=>{clearNeed(r.closest('.wr-part'));setDraft(w,current())});q('#wr-how').oninput=()=>setDraft(w,current());
 q('#wrExit').onclick=()=>{renderMap();show('mapScreen')};
 const send=q('#wrSend'),msg=q('#wrMsg');
 send.onclick=()=>{
  const v=current(),need=(k,t)=>{const part=body.querySelector(`[data-part="${k}"]`);part.classList.add('wr-need');part.querySelector('.wr-need-msg').textContent=t;return part};
  body.querySelectorAll('.wr-part').forEach(clearNeed);msg.textContent='';msg.className='feedback';
  const bad=[];
  if(words(v.learn).length<MIN.learn)bad.push(need('learn',`Write at least ${MIN.learn} words about what you learned.`));
  else if(different(v.learn)<6||v.learn.toLowerCase()===c.learn.toLowerCase())bad.push(need('learn','Use your own words — tell it like you would tell a friend.'));
  if(words(v.apply).length<MIN.apply)bad.push(need('apply',`Write at least ${MIN.apply} words about what you will do.`));
  if(words(v.dua).length<MIN.dua)bad.push(need('dua','Write the duʿāʾ you learned, and when you will say it.'));
  if(!v.practice)bad.push(need('practice','Choose one answer.'));
  if(bad.length){msg.textContent=bad.length===1?'One part still needs your answer.':`${bad.length} parts still need your answer.`;msg.className='feedback bad';bad[0].scrollIntoView({block:'center',behavior:'smooth'});typeof tryAgainSound==='function'&&tryAgainSound();return}
  const parts=[{k:'learn',q:c.learn,a:v.learn},{k:'apply',q:c.apply,a:v.apply},{k:'dua',q:c.duaQ,a:v.dua,dua:c.dua},{k:'practice',q:PRACTICE_Q,a:v.practice,how:v.how}];
  const text=textOf(parts),same=prev&&prev.text===text;
  if(same&&!inChallenge&&answered(prev)&&prev.review.status==='rewrite'){msg.textContent='Change your reflection first — use your teacher’s note to make it better.';msg.className='feedback bad';typeof tryAgainSound==='function'&&tryAgainSound();return}
  const n=words(v.learn).length+words(v.apply).length+words(v.dua).length;
  const rec=same?prev:{prompt:c.learn,parts,text,words:n,at:new Date().toISOString(),review:prev&&prev.review||null};
  list()[w]=rec;setDraft(w,null);
  if(inChallenge){mapQuizCorrect++;challengeDone=true;sentWords=n}
  save();if(typeof syncStats==='function')syncStats();if(typeof happySound==='function')happySound();
  body.querySelectorAll('textarea,input').forEach(x=>x.disabled=true);
  msg.textContent=same?'📨 Your reflection is with your teacher.':`📨 Sent to your teacher!${inChallenge?' +1 point ⭐':' Your teacher will read it again.'}`;msg.className='feedback good';
  if(!same)messageTeacher(w,rec).then(ok=>{if(ok&&msg.isConnected)msg.textContent+=' It is in your messages too.'});
  const sc=body.querySelector('.map-quiz-score');if(sc)sc.innerHTML=`🏆 Question ${mapQuizIndex+1}/${MAP_QUIZ_TOTAL} &nbsp; · &nbsp; Score ${mapQuizCorrect}`;
  q('#mapQuizActions').innerHTML=inChallenge?'<button class="btn green" id="wrResult">See My Result 🏆</button>':'<button class="btn green" id="wrResult">Back to map</button>';
  q('#wrResult').onclick=()=>{if(inChallenge)finishMapQuiz();else{renderMap();show('mapScreen')}};q('#wrResult').focus();
 };
 if(!inChallenge)show('mapQuizScreen');
}

/* question 15 → the reflection (in place of the story match) */
const renderMapQuizBeforeWriting=renderMapQuiz;
renderMapQuiz=function(){if(mapQuizIndex===MAP_QUIZ_TOTAL-1){challengeDone=false;showWriting('challenge');return}return renderMapQuizBeforeWriting.apply(this,arguments)};
const finishMapQuizBeforeWriting=finishMapQuiz;
finishMapQuiz=function(){
 const done=challengeDone;challengeDone=false;const r=finishMapQuizBeforeWriting.apply(this,arguments);if(!done)return r;
 const rec=profile.mapQuizScores[viewWorld];if(rec){rec.writing={words:sentWords,at:new Date().toISOString()};save()}
 const res=document.querySelector('.map-quiz-result');if(res)res.insertAdjacentHTML('beforebegin',`<p class="map-quiz-match">✍️ Question ${MAP_QUIZ_TOTAL} · My reflection: sent to your teacher ✓ (+1 point)<br><small>Your teacher’s reply will appear under this map in “From your teacher”.</small></p>`);
 return r;
};

/* the teacher's reply, under the map in “From your teacher” */
function seen(){if(!profile.mapWritingSeen||typeof profile.mapWritingSeen!=='object')profile.mapWritingSeen={};return profile.mapWritingSeen}
function renderWritingBox(){
 const anchor=q('#teacherNoteBox');if(!anchor)return;let box=q('#writingBox');
 if(!box){anchor.insertAdjacentHTML('afterend','<div id="writingBox"></div>');box=q('#writingBox')}
 const w=viewWorld,x=mine(w);if(!x){box.innerHTML='';return}
 const r=answered(x)?x.review:null,isNew=!!(r&&seen()[w]!==r.at),again=r&&r.status==='rewrite';
 const sum=!r?`Sent ${fmtDate(x.at)} · waiting for your teacher`:again?'Your teacher asks you to write it again':'Accepted by your teacher ✓';
 const body=`<div class="wr-mine">${partsHTML(x)}<small>Sent ${fmtDate(x.at)}</small></div>${reviewHTML(x)}${again?'<button type="button" class="btn green" id="wrAgain">✍️ Write it again</button>':''}`;
 box.innerHTML=typeof foldHTML==='function'?foldHTML('writing','✍️','My reflection · Map '+(w+1),sum,isNew?(again?'Write again':'New'):'',body):body;
 if(typeof wireFolds==='function')wireFolds(box);
 const b=q('#wrAgain');if(b)b.onclick=()=>showWriting('again');
}
function markSeen(){const x=mine(viewWorld);if(answered(x)&&seen()[viewWorld]!==x.review.at){seen()[viewWorld]=x.review.at;save();renderWritingBox();if(typeof refreshMapMenu==='function')refreshMapMenu()}}
if(typeof renderTeacherQuizzes==='function'){const before=renderTeacherQuizzes;renderTeacherQuizzes=function(){const r=before.apply(this,arguments);renderWritingBox();return r}}
if(typeof onFoldOpened==='function'){const before=onFoldOpened;onFoldOpened=function(id){if(id==='writing')markSeen();return before.apply(this,arguments)}}

/* ✏️ Edit Map N: the teacher changes the questions and the duʿāʾ; an empty box keeps the original */
function editorHTML(w){const c=cfg(w),o=original(w),f=(id,label,v,rows,extra='')=>`<label class="tm-label">${label}<textarea class="tm-in" id="${id}" maxlength="600" rows="${rows}" ${extra}>${esc(v)}</textarea></label>`;
 return `<h3 class="tm-sub">✍️ Question ${MAP_QUIZ_TOTAL} — the student’s reflection</h3><p class="tm-help">Students answer four parts and send them to you like a message (it also arrives in Messages). Read, correct and answer them in the Teacher portal → Maps → Map review. Empty a box to use the original.</p>`
  +f('tmWritePrompt','📖 1 · What did you learn — the task',c.learn,3)+f('tmApplyPrompt','🌱 2 · What will you do — the question',c.apply,2)
  +f('tmDuaAr','🤲 3 · The duʿāʾ — Arabic',c.dua?c.dua.ar:'',2,'dir="rtl" lang="ar"')+f('tmDuaEn','The duʿāʾ — meaning',c.dua?c.dua.en:'',2)+f('tmDuaRef','The duʿāʾ — source',c.dua?c.dua.ref:'',1)+f('tmDuaPrompt','The duʿāʾ — question',c.duaQ,2)
  +`<p class="tm-help">4 · “${esc(PRACTICE_Q)}” — ${PRACTICE.map(esc).join(' / ')}, and how.</p>`}
function readEditor(w){const o=original(w),v=id=>{const el=document.getElementById(id);return el?el.value.trim():''},out={};
 const keep=(key,id,orig)=>{const x=v(id);if(x&&x!==orig)out[key]=x};
 keep('writePrompt','tmWritePrompt',o.learn);keep('applyPrompt','tmApplyPrompt',o.apply);keep('duaPrompt','tmDuaPrompt',o.duaQ);
 const ar=v('tmDuaAr'),en=v('tmDuaEn'),ref=v('tmDuaRef');
 if(ar&&!(o.dua&&ar===o.dua.ar&&en===o.dua.en&&ref===o.dua.ref)){out.duaAr=ar;out.duaEn=en;out.duaRef=ref}
 return out}

document.head.insertAdjacentHTML('beforeend',`<style id="seeraa-writing-style">
.wr-task{text-align:left;background:#fffaf0;border:2px solid var(--gold2);border-left:7px solid var(--gold);border-radius:18px;padding:12px 16px;margin:0 0 14px}
.wr-tag{display:inline-block;font:800 13px Nunito,system-ui,sans-serif;color:#7a5418;background:#fff1cc;border-radius:999px;padding:4px 11px;margin-bottom:6px}
.wr-rule{margin:0;font:600 15px/1.4 Nunito,system-ui,sans-serif;color:#5f513d}
.wr-before{text-align:left;font:600 15px Nunito,system-ui,sans-serif;color:#5f513d;margin:0 0 10px}
.wr-part{text-align:left;background:#fff;border:2px solid #e6dcc6;border-radius:18px;padding:12px 14px;margin:0 0 12px}
.wr-part.wr-need{border-color:var(--coral);box-shadow:0 0 0 4px #e0703a22}
.wr-part h3{display:flex;align-items:center;gap:8px;margin:0 0 6px;font:800 17px Nunito,system-ui,sans-serif;color:var(--navy)}
.wr-n{display:grid;place-items:center;width:26px;height:26px;flex:none;border-radius:50%;background:var(--gold);color:#fff;font:800 14px Nunito,system-ui,sans-serif}
.wr-prompt{font:19px/1.45 'Marcellus',serif;color:var(--navy);margin:0 0 8px}
.wr-need-msg{margin:6px 2px 0;font:700 14px Nunito,system-ui,sans-serif;color:#b5452b}.wr-need-msg:empty{display:none}
.wr-text{display:block;width:100%;box-sizing:border-box;resize:vertical;padding:11px 13px;border:2px solid #cfd9e3;border-radius:14px;background:#fff;color:#2a2a2a;font:17px/1.55 Nunito,system-ui,sans-serif}
#wr-learn{min-height:140px}
.wr-text:focus,.wr-how:focus{outline:none;border-color:var(--sky);box-shadow:0 0 0 4px #3f9fc933}
.wr-text:disabled,.wr-how:disabled{background:#f6f9fb;color:#47515c}
.wr-count{margin:5px 2px 0;font:700 13.5px Nunito,system-ui,sans-serif;color:#7a6a52}.wr-count.ok{color:var(--green)}
.wr-dua{margin:2px 0 10px;padding:10px 13px;border-radius:14px;background:#f3f8f1;border:1px solid #cfe3c8}
.wr-dua-ar{margin:0 0 4px;font:700 24px/1.75 Amiri,'Noto Naskh Arabic','Geeza Pro',serif;color:#1f4f40;text-align:right}
.wr-dua-en{margin:0 0 3px;font:600 15.5px/1.45 Nunito,system-ui,sans-serif;color:#2f3b2a}
.wr-dua small{color:#5f7556;font:600 12.5px Nunito,system-ui,sans-serif}
.wr-choices{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}
.wr-choice{display:flex;align-items:center;gap:8px;padding:10px 13px;border:2px solid #d9cfb9;border-radius:14px;background:#fffdf7;cursor:pointer;font:700 15.5px Nunito,system-ui,sans-serif;color:#3c2f26}
.wr-choice input{width:20px;height:20px;accent-color:var(--green);margin:0}
.wr-choice:has(input:checked){border-color:var(--green);background:#eef7ee}
.wr-how{display:block;width:100%;box-sizing:border-box;padding:10px 13px;border:2px solid #cfd9e3;border-radius:14px;font:16px Nunito,system-ui,sans-serif}
.wr-guest{color:#9a5b23;font:600 14px Nunito,system-ui,sans-serif;text-align:left;margin:0 0 6px}
.wr-reply{text-align:left;background:#fff;border:2px solid #9fd8f2;border-left:7px solid var(--sky);border-radius:18px;padding:12px 15px;margin:0 0 14px}
.wr-reply.again{border-color:#f2c79f;border-left-color:var(--coral)}
.wr-reply.ok{border-color:#a9dcc4;border-left-color:var(--green)}
.wr-reply .who{font:15px Marcellus,serif;color:#1c4a66;margin-bottom:3px}
.wr-reply-state{margin:0 0 4px;font:800 16px Nunito,system-ui,sans-serif;color:var(--navy)}
.wr-reply-note{margin:0;font-size:17px;line-height:1.5;white-space:pre-wrap}
.wr-fix{margin-top:8px}.wr-fix summary{cursor:pointer;font:800 14px Nunito,system-ui,sans-serif;color:var(--blue)}
.wr-fix p{margin:8px 0 0;padding:10px 12px;border-radius:12px;background:#f1f8ee;white-space:pre-wrap;font-size:16px;line-height:1.5}
.wr-mine{text-align:left;background:#fffaf0;border:2px solid #ead9b5;border-radius:16px;padding:11px 14px;margin:0 0 12px}
.wr-mine-part{padding:0 0 9px;margin:0 0 9px;border-bottom:1px dashed #e3d3ae}
.wr-mine-part b{display:block;font:800 14.5px Nunito,system-ui,sans-serif;color:#7a5418}
.wr-mine-q{display:block;font:600 13px/1.4 Nunito,system-ui,sans-serif;color:#8a7a62;margin:2px 0 3px}
.wr-mine-dua{display:block;font:700 19px/1.7 Amiri,'Noto Naskh Arabic',serif;color:#1f4f40;text-align:right}
.wr-mine-part p,.wr-mine-text{margin:0;font-size:16px;line-height:1.5;white-space:pre-wrap;color:#2f2a24}
.wr-mine small{color:#8a7a62}
#writingBox .btn{margin-top:2px}
@media(max-width:560px){.wr-prompt{font-size:17.5px}.wr-part{padding:11px 12px}.wr-choice{flex:1 1 100%}}
</style>`);

window.SeeraaWriting={PROMPTS,REFLECT,MIN,defaultPrompt,promptFor,cfg,editorHTML,readEditor,show:showWriting};
})();
