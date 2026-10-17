/* Seeraa Quest — Book One · print interior content
   Spine: the 9 maps / 36 stories of the Seeraa Quest course (Ar-Raheeq al-Makhtum).
   Art: one illustration per story, cropped and graded differently in every panel. */
window.BOOK1 = {

words1: [
 ['جَزِيرَة','peninsula'],['قَبِيلَة','tribe'],['صَحْرَاء','desert'],
 ['الْكَعْبَة','the Kaʿbah'],['إِبْرَاهِيم','Ibrāhīm'],['بَيْت','house'],
 ['التَّوْحِيد','Allah is One'],['صَنَم','idol'],['الْحَجّ','pilgrimage'],
 ['جَاهِلِيَّة','age of ignorance'],['ظُلْم','injustice'],['كَرَم','generosity'],
 ['نَسَب','family line'],['قُرَيْش','Quraysh'],['بَنُو هَاشِم','Banū Hāshim'],
 ['خُبْز','bread'],['الشِّتَاء','winter'],['الصَّيْف','summer'],
 ['بِئْر','well'],['مَاء','water'],['رُؤْيَا','a true dream'],
 ['أَب','father'],['أُمّ','mother'],['قَافِلَة','caravan'],
 ['جَيْش','army'],['فِيل','elephant'],['رَبّ','Lord']
],
words2: [
 ['جَبَل','mountain'],['وَادٍ','valley'],['طَاعَة','obedience'],
 ['أَبَابِيل','birds in flocks'],['حِجَارَة','stones'],['دُعَاء','supplication'],
 ['بُشْرَى','good news'],['نُور','light'],['مُحَمَّد','the praised one'],
 ['مَوْلِد','birth'],['يَتِيم','orphan'],['بَرَكَة','blessing'],
 ['حَلِيب','milk'],['بَادِيَة','open desert'],['رَضَاعَة','nursing'],
 ['فَصِيح','pure Arabic'],['قَلْب','heart'],['مَلَك','angel'],
 ['طَاهِر','pure'],['سَفَر','journey'],['قَبْر','grave'],
 ['حُزْن','sadness'],['جَدّ','grandfather'],['عَمّ','uncle'],
 ['رَاعِي','shepherd'],['الْأَمِين','the Trustworthy'],['اِقْرَأْ','Read!']
],

maps: [
/* ===================== MAP 1 ===================== */
{
 n:1, title:'Arabia Before Islam', colour:'#4b2a86',
 kick:'Where it all begins',
 hook:'A house was built in an empty valley for one reason only.\nThen the people forgot the reason.',
 stories:[
 { n:1, title:'Arabia Before Islam', kick:'The land and its people', layout:'a', art:'m1-s1',
   panels:[
    { t:'day', z:'cover', px:'34%', py:'46%',
      sfx:[{w:'hoof  hoof', c:'gold md', x:'63%', y:'7%', rot:-6}],
      items:[{cap:'Seas on three sides. Golden dunes, black lava fields, and a few green places where water came out of the ground.'},
             {say:'Keep them together! Water is three days ahead.', who:'A herdsman', r:true}]},
    { t:'gold', z:'auto 185%', px:'8%', py:'52%',
      items:[{say:'Three days? My camel will not last three hours.', who:'His son'},
             {cap:'No king ruled here. No empire. Your **tribe** was your whole protection.'}]},
    { t:'dusk', z:'auto 170%', px:'88%', py:'58%',
      items:[{cap:'And in the middle of all that emptiness stood **Makkah** — a dry valley with no farms and no river.'},
             {say:'So why does everybody come here?', who:'A traveller', r:true}]}
   ],
   treasure:'Islam did not arrive in an empty world. It arrived in a world that had good in it and terrible wrong in it, all tangled together.' },

 { n:2, title:'The House of Allah', kick:'The Kaʿbah', layout:'b', art:'m1-s2',
   panels:[
    { t:'gold', z:'auto 150%', px:'32%', py:'40%',
      sfx:[{w:'THUNK', c:'pink lg', x:'8%', y:'6%', rot:-9}],
      items:[{cap:'Long, long ago, Allah told **Ibrāhīm** and his son **Ismāʿīl** to raise a simple house of stone in a dry valley.'},
             {say:'Higher, my son. Pass me that one.', who:'Ibrāhīm'},
             {say:'Our Lord, accept this from us.', who:'Ibrāhīm and Ismāʿīl', r:true}]},
    { t:'day', z:'auto 200%', px:'72%', py:'30%',
      items:[{cap:'No gold. No statues. Just stone — built for **one** reason: that people would worship Allah alone.'}]},
    { t:'drama', z:'auto 230%', px:'18%', py:'70%',
      items:[{say:'And every single one of us still turns towards it, five times a day.', who:'Today', r:true}]}
   ],
   treasure:'Our masjids and our prayers are for Allah alone — never for anyone or anything else.' },

 { n:3, title:'How the Idols Came', kick:'The truth covered over', layout:'c', art:'m1-s3',
   panels:[
    { t:'day', z:'cover', px:'22%', py:'44%',
      items:[{cap:'For hundreds of years after Ibrāhīm, the people of Makkah worshipped Allah alone, exactly as he had taught them.'}]},
    { t:'dusk', z:'auto 165%', px:'62%', py:'48%',
      sfx:[{w:'…', c:'gold sm', x:'47%', y:'10%', rot:0}],
      items:[{cap:'Then a powerful chief called **ʿAmr ibn Luḥayy** travelled north to Shām, and saw something he had never seen.'},
             {say:'What are those stones your people bow to?', who:'ʿAmr'},
             {say:'Our gods. They bring us rain. They bring us victory.', r:true}]},
    { t:'drama', z:'auto 190%', px:'84%', py:'52%',
      sfx:[{w:'THUD', c:'pink md', x:'10%', y:'8%', rot:-8}],
      items:[{say:'Then I shall take one home with me.', who:'ʿAmr'},
             {cap:'He set up an idol called **Hubal** beside the House of Allah. Other tribes copied him. By the time the Prophet ﷺ was born there were **three hundred and sixty**.'}]}
   ],
   treasure:'Nobody woke up one morning and decided to leave Allah. It took hundreds of years — and it started with one man liking something he saw on a journey.' },

 { n:4, title:'A Society in Need of Guidance', kick:'Good hearts, serious wrongs', layout:'d', art:'m1-s4',
   panels:[
    { t:'day', z:'auto 160%', px:'14%', py:'48%',
      items:[{cap:'They were brave. They kept their promises. A man would hand his last bowl of food to a shivering stranger.'}]},
    { t:'gold', z:'auto 205%', px:'46%', py:'38%',
      sfx:[{w:'clink', c:'gold sm', x:'60%', y:'8%', rot:7}],
      items:[{say:'Weigh it again. And this time, weigh it honestly.', who:'A buyer', r:true}]},
    { t:'drama', z:'auto 180%', px:'80%', py:'56%',
      items:[{cap:'And in the same streets, the strong simply took from the weak. Orphans were robbed of what their fathers left them.'}]},
    { t:'sil', z:'auto 230%', px:'30%', py:'64%',
      items:[{cap:'They called that time **al-Jāhiliyyah** — the age of ignorance.', night:true},
             {say:'We were a people of ignorance.', who:'Jaʿfar, years later', r:true}]}
   ],
   treasure:'Islam did not throw away who the Arabs were. It kept their courage and their generosity — and it removed the injustice.',
   cliff:{ eyebrow:'Meanwhile, in that same city…', line:'One family was already there — feeding pilgrims, digging up a well everyone had given up on, and making a promise that nearly cost a boy his life.' } }
 ],
 quest:{
  qs:[ {q:'What surrounds the Arabian Peninsula on three sides?', o:['Seas','Forests','Snowy mountains']},
       {q:'Who built the Kaʿbah?', o:['Ibrāhīm and his son Ismāʿīl','The kings of Yemen','The people of Madīnah']},
       {q:'Who first brought an idol to the Kaʿbah?', o:['ʿAmr ibn Luḥayy','Abrahah','Ismāʿīl']},
       {q:'What is the time before Islam called?', o:['Al-Jāhiliyyah','Al-Hijrah','Al-Fatḥ']} ],
  think:'ʿAmr ibn Luḥayy was not trying to ruin anything. He just liked what he saw. What is one small habit that could pull a person slowly away from what they know is right?',
  draw:'Draw the Kaʿbah at dusk with the shapes of the idols crowded around it. Make the idols shadows — and make the House the one clean thing on your page.' }
},

/* ===================== MAP 2 ===================== */
{
 n:2, title:'The Prophet’s Family', colour:'#1d4a6e',
 kick:'Roots',
 hook:'A name that meant “the one who breaks bread”.\nA well that had vanished. And a hundred camels.',
 stories:[
 { n:1, title:'The Line of Ibrāhīm', kick:'An honoured family', layout:'a', art:'m2-s1',
   panels:[
    { t:'night', z:'cover', px:'50%', py:'42%',
      sfx:[{w:'. . .', c:'gold sm', x:'80%', y:'10%', rot:0}],
      items:[{cap:'Muḥammad ﷺ, son of ʿAbdullāh, son of ʿAbd al-Muṭṭalib, son of Hāshim — and back, and back, until the line reaches **Ismāʿīl**.', night:true}]},
    { t:'drama', z:'auto 190%', px:'28%', py:'54%',
      items:[{say:'Allah chose Kinānah from the children of Ismāʿīl, and Quraysh from Kinānah, and Banū Hāshim from Quraysh — and me from Banū Hāshim.', who:'The Prophet ﷺ'}]},
    { t:'gold', z:'auto 210%', px:'76%', py:'44%',
      items:[{cap:'A noble family. But it was never his family that people honoured him for. It was his **character**.'}]}
   ],
   treasure:'Where you come from is a gift. What you do with it is the test.' },

 { n:2, title:'Hāshim, Who Shared Bread', kick:'Feeding the pilgrims', layout:'c', art:'m2-s2',
   panels:[
    { t:'day', z:'cover', px:'38%', py:'42%',
      sfx:[{w:'crumble', c:'gold md', x:'66%', y:'9%', rot:6}],
      items:[{cap:'Pilgrim season in Makkah. Thousands of travellers arriving — and nowhere near enough food.'},
             {say:'Bring out the bread. All of it. And the broth.', who:'Hāshim', r:true}]},
    { t:'gold', z:'auto 180%', px:'18%', py:'52%',
      items:[{say:'Sir, there are too many of them. The loaves will not reach.', who:'A servant'},
             {say:'Then I will break every loaf with my own hands until they do.', who:'Hāshim', r:true}]},
    { t:'dusk', z:'auto 225%', px:'82%', py:'46%',
      items:[{cap:'They stopped calling him by his real name. They called him **Hāshim** — the one who breaks bread. It stayed with him for ever. His family are called Banū Hāshim to this day.'}]}
   ],
   treasure:'He could have fed them and said nothing. People remembered **how** he did it longer than they remembered what he gave.' },

 { n:3, title:'ʿAbd al-Muṭṭalib Finds Zamzam', kick:'A lost blessing returns', layout:'b', art:'m2-s3',
   panels:[
    { t:'night', z:'auto 155%', px:'36%', py:'44%',
      sfx:[{w:'DIG', c:'pink lg', x:'8%', y:'7%', rot:-10}],
      items:[{cap:'Zamzam had once gushed for baby Ismāʿīl. Then a tribe filled it in, levelled the ground — and in time nobody alive knew where it had been.', night:true},
             {say:'Father, there is nothing down here but stone.', who:'His son', r:true},
             {say:'Keep digging.', who:'ʿAbd al-Muṭṭalib'}]},
    { t:'drama', z:'auto 215%', px:'52%', py:'30%',
      items:[{cap:'He had been told where, in a dream. So he dug.'}]},
    { t:'gold', z:'auto 185%', px:'60%', py:'68%',
      sfx:[{w:'gush', c:'gold md', x:'54%', y:'6%', rot:-5}],
      items:[{cap:'Buried swords. Armour. Two deer made of gold. And under all of it — **water**.'}]}
   ],
   treasure:'Allah can give back a blessing that everybody had given up on. And a blessing is for sharing: Zamzam went straight to the pilgrims.' },

 { n:4, title:'ʿAbdullāh and Āminah', kick:'A promise and a hundred camels', layout:'d', art:'m2-s4',
   panels:[
    { t:'dusk', z:'auto 165%', px:'20%', py:'46%',
      items:[{cap:'While he was digging, ʿAbd al-Muṭṭalib had made a vow: if Allah gave him ten sons who grew to be men, he would sacrifice one of them.'}]},
    { t:'drama', z:'auto 200%', px:'48%', py:'40%',
      sfx:[{w:'NO—', c:'pink md', x:'10%', y:'8%', rot:-9}],
      items:[{cap:'Allah gave him ten sons. They drew lots. The name that came out was **ʿAbdullāh** — the youngest. The one he loved best.'},
             {say:'Not him. Draw again!', who:'His brothers', r:true}]},
    { t:'gold', z:'auto 230%', px:'74%', py:'52%',
      items:[{cap:'So they drew ʿAbdullāh against ten camels. The lot fell on the boy. Twenty. The boy. Thirty. The boy.'},
             {say:'Again. Add ten more.', who:'ʿAbd al-Muṭṭalib'}]},
    { t:'day', z:'auto 190%', px:'90%', py:'58%',
      sfx:[{w:'ONE HUNDRED', c:'gold md', x:'6%', y:'7%', rot:-5}],
      items:[{cap:'At **a hundred camels**, the lot fell on the camels. Every one was slaughtered, and the meat left out for anyone who wanted it — people and wild animals alike.'}]}
   ],
   treasure:'ʿAbdullāh lived. He married Āminah. And he died before his son was ever born.',
   cliff:{ eyebrow:'That same year, far to the south…', line:'A king looked north at the crowds walking to a house he did not own — and decided to pull it down.' } }
 ],
 quest:{
  qs:[ {q:'Whose line does the Prophet’s family go back to?', o:['Ismāʿīl, son of Ibrāhīm','The kings of Persia','The tribe of Thaqīf']},
       {q:'Why was Hāshim given that name?', o:['He crumbled bread for the pilgrims','He built a well','He led an army']},
       {q:'Who had filled in the well of Zamzam?', o:['The tribe of Jurhum','Quraysh','Abrahah']},
       {q:'How many camels saved ʿAbdullāh?', o:['One hundred','Ten','Forty']} ],
  think:'ʿAbd al-Muṭṭalib kept digging when his own son told him there was nothing there. When is that the right thing to do — and when is it just stubbornness?',
  draw:'Draw the moment the water breaks through — but light the picture from **below**, out of the hole in the ground, instead of from the sky.' }
},

/* ===================== MAP 3 ===================== */
{
 n:3, title:'The Year of the Elephant', colour:'#7a2143',
 kick:'The year everything changed',
 hook:'Sixty thousand soldiers. One enormous elephant.\nAnd a city that did not even try to fight.',
 stories:[
 { n:1, title:'Abrahah’s Plan', kick:'Jealousy builds a church', layout:'b', art:'m3-s1',
   panels:[
    { t:'day', z:'auto 150%', px:'26%', py:'42%',
      items:[{cap:'In Yemen ruled a proud governor named **Abrahah**. Every year he watched the Arabs stream north past his door, towards a plain stone cube in a dry valley.'},
             {say:'I will build them something greater. Marble. Gold. Then let them come **here**.', who:'Abrahah'}]},
    { t:'dusk', z:'auto 205%', px:'62%', py:'36%',
      items:[{say:'My lord… the pilgrim road is as busy as ever. They still go north.', r:true}]},
    { t:'drama', z:'auto 195%', px:'88%', py:'58%',
      sfx:[{w:'RRROAR', c:'pink lg', x:'8%', y:'8%', rot:-10}],
      items:[{say:'Then I will not leave one stone of that house standing on another!', who:'Abrahah', shout:true}]}
   ],
   treasure:'Jealousy pushes people to do things pride will not let them undo. Be glad when somebody else is blessed.' },

 { n:2, title:'“The House Has a Lord”', kick:'Trust, when nothing else is left', layout:'a', art:'m3-s2',
   panels:[
    { t:'dusk', z:'cover', px:'40%', py:'44%',
      sfx:[{w:'BOOM  BOOM', c:'gold md', x:'66%', y:'7%', rot:-5}],
      items:[{cap:'Sixty thousand men came north. Makkah had no army that could stand in front of that for a single minute.'}]},
    { t:'drama', z:'auto 190%', px:'16%', py:'48%',
      items:[{cap:'Abrahah’s men had seized two hundred camels on the road. They belonged to **ʿAbd al-Muṭṭalib**. He walked into the enemy camp alone to ask for them back.'},
             {say:'I have come about my camels. Return them.', who:'ʿAbd al-Muṭṭalib'}]},
    { t:'sil', z:'auto 215%', px:'80%', py:'54%',
      items:[{say:'Your **camels**? I have come to destroy the house your fathers built, and you talk to me about camels?', r:true},
             {say:'I am the owner of the camels. The House has a Lord who will protect it.', who:'ʿAbd al-Muṭṭalib'}]}
   ],
   treasure:'When something is far beyond your power, you hand it to the One whose power it is. That is not giving up. That is knowing who owns what.' },

 { n:3, title:'The Elephant Who Would Not Walk', kick:'Every creature obeys Allah', layout:'c', art:'m3-s3',
   panels:[
    { t:'day', z:'cover', px:'30%', py:'46%',
      sfx:[{w:'NNNGH', c:'gold md', x:'62%', y:'8%', rot:7}],
      items:[{cap:'Morning. They turned the great elephant **Maḥmūd** towards Makkah and ordered him forward.'},
             {say:'Move. MOVE!', r:true, shout:true}]},
    { t:'dusk', z:'auto 180%', px:'64%', py:'52%',
      items:[{cap:'He knelt down in the sand and would not get up.'},
             {say:'Turn him south.', who:'A captain'},
             {cap:'South — he stood and walked briskly. North — the same. East — the same.'}]},
    { t:'drama', z:'auto 235%', px:'14%', py:'60%',
      sfx:[{w:'THUMP', c:'pink md', x:'70%', y:'10%', rot:-8}],
      items:[{cap:'And every single time they turned him back towards the House, down he went again.'}]}
   ],
   treasure:'Sixty thousand soldiers could not make one animal take one step in a direction Allah had not allowed.' },

 { n:4, title:'The Year of the Elephant', kick:'Birds out of the sea', layout:'e', art:'m3-s4',
   panels:[
    { t:'drama', z:'cover', px:'50%', py:'40%',
      sfx:[{w:'ABĀBĪL', c:'gold xl', x:'6%', y:'5%', rot:-7},
           {w:'tk tk tk', c:'pink sm', x:'62%', y:'30%', rot:9}],
      items:[{cap:'Then the sky over the valley changed.'},
             {cap:'Flocks of small birds came in from the direction of the sea — flight after flight of them, each bird carrying stones no bigger than a lentil.'},
             {say:'What **is** that?', r:true, shout:true},
             {cap:'They dropped them. And the greatest army in Arabia came apart in a single morning. Abrahah never came near the Kaʿbah.'}]}
   ],
   treasure:'Not lightning. Not an earthquake. Birds, carrying pebbles. The weapon was never the point — the One who sent it was.',
   cliff:{ eyebrow:'Fifty days later, in that same city…', line:'A woman named Āminah gave birth to a boy. His father had already been dead for months.' } }
 ],
 quest:{
  qs:[ {q:'Why did Abrahah build his great church?', o:['To turn the pilgrims away from the Kaʿbah','To thank Allah','To store grain']},
       {q:'What did ʿAbd al-Muṭṭalib ask Abrahah for?', o:['His camels','Gold','An army']},
       {q:'Which way would the elephant not walk?', o:['Towards the Kaʿbah','Towards the sea','Towards Yemen']},
       {q:'What did Allah send against the army?', o:['Flocks of birds with stones','A flood','A sandstorm']} ],
  think:'ʿAbd al-Muṭṭalib asked only about his camels and left the Kaʿbah to Allah. Was that giving up, or was that trust? What is the difference?',
  draw:'Draw the elephant kneeling in the sand with the whole army behind him — and the tiny shape of the Kaʿbah far ahead. Leave the top third of your page almost empty. Something is about to come into it.' }
},

/* ===================== MAP 4 ===================== */
{
 n:4, title:'A Blessed Birth', colour:'#5a2d91',
 kick:'The answer arrives',
 hook:'Every woman in Makkah was offered him.\nEvery single one of them said no.',
 stories:[
 { n:1, title:'Good News Before His Birth', kick:'A duʿāʾ answered centuries later', layout:'b', art:'m4-s1',
   panels:[
    { t:'gold', z:'auto 150%', px:'34%', py:'44%',
      items:[{cap:'When Ibrāhīm and Ismāʿīl raised these walls, they prayed for one thing.'},
             {say:'Our Lord, send among them a messenger from themselves, who will recite Your verses and teach them the Book and wisdom.', who:'Ibrāhīm'}]},
    { t:'day', z:'auto 200%', px:'70%', py:'34%',
      items:[{cap:'**ʿĪsā** told his people the same thing, centuries later: *a messenger is coming after me, whose name is Aḥmad.*'}]},
    { t:'drama', z:'auto 225%', px:'10%', py:'62%',
      items:[{say:'My story? The duʿāʾ of my father Ibrāhīm, and the good news of ʿĪsā.', who:'The Prophet ﷺ', r:true}]}
   ],
   treasure:'Ibrāhīm stood on the very ground where that duʿāʾ was answered. He never saw the answer. It came anyway.' },

 { n:2, title:'A Blessed Birth', kick:'The praised one', layout:'a', art:'m4-s2',
   panels:[
    { t:'night', z:'cover', px:'44%', py:'46%',
      sfx:[{w:'a child cries', c:'gold md', x:'62%', y:'8%', rot:-6}],
      items:[{cap:'In the Year of the Elephant, in Makkah, a boy was born to **Āminah**.', night:true}]},
    { t:'gold', z:'auto 185%', px:'18%', py:'40%',
      items:[{say:'What will you name him?', r:true},
             {say:'Muḥammad.', who:'ʿAbd al-Muṭṭalib'},
             {say:'Muḥammad? Nobody is called that.', r:true}]},
    { t:'drama', z:'auto 210%', px:'78%', py:'56%',
      items:[{say:'I want him praised in the heavens, and praised on the earth.', who:'ʿAbd al-Muṭṭalib'},
             {cap:'His father ʿAbdullāh had died before he was born. From his first breath, he was an **orphan**.'}]}
   ],
   treasure:'He began life without a father — and Allah surrounded him with people who would love and guard him his whole life.' },

 { n:3, title:'Ḥalīmah’s Blessed Journey', kick:'The woman who took the orphan', layout:'c', art:'m4-s3',
   panels:[
    { t:'day', z:'cover', px:'26%', py:'48%',
      sfx:[{w:'clop… clop…', c:'gold sm', x:'66%', y:'9%', rot:4}],
      items:[{cap:'A year of drought. Women of Banū Saʿd rode into Makkah looking for babies to nurse — and for what a good family would pay.'},
             {say:'This donkey will be the death of me. We are last again.', who:'Ḥalīmah'}]},
    { t:'dusk', z:'auto 175%', px:'56%', py:'52%',
      items:[{cap:'Every one of them was offered the same baby. Every one refused.'},
             {say:'An orphan? And what can an orphan’s family pay?', r:true}]},
    { t:'gold', z:'auto 215%', px:'88%', py:'44%',
      items:[{say:'I will not go home empty-handed. I will take the orphan.', who:'Ḥalīmah'},
             {cap:'Her thin, slow donkey went home so fast that the other women called ahead to her: *“Ḥalīmah — slow down! Is that the same animal?”* It was.'}]}
   ],
   treasure:'They were all looking for the child who would bring them something. The one they walked past was the one who brought everything.' },

 { n:4, title:'Out in the Desert', kick:'Four years of blessing', layout:'d', art:'m4-s4',
   panels:[
    { t:'day', z:'auto 160%', px:'16%', py:'46%',
      items:[{cap:'Makkan families sent their babies out to the open desert — clean air, clean Arabic, and room to run.'}]},
    { t:'gold', z:'auto 200%', px:'44%', py:'40%',
      items:[{say:'The camel gives milk again. Every evening. Since the day you brought him.', who:'Her husband', r:true}]},
    { t:'day', z:'auto 185%', px:'72%', py:'56%',
      sfx:[{w:'laughter', c:'gold sm', x:'8%', y:'8%', rot:-6}],
      items:[{cap:'He had foster brothers and sisters out there — among them **ash-Shaymāʾ**, who carried him about and sang to him.'}]},
    { t:'dusk', z:'auto 225%', px:'92%', py:'50%',
      items:[{cap:'He stayed with them until he was four or five years old. Ḥalīmah spent the rest of her life saying it was the best thing that ever happened to her family.'}]}
   ],
   treasure:'Kindness to one child, who could not pay her back with anything, changed a whole household.',
   cliff:{ eyebrow:'Out in that desert, one ordinary afternoon…', line:'The children came running back to the tents white-faced, shouting that two men in white had taken their brother and opened his chest.' } }
 ],
 quest:{
  qs:[ {q:'Who made duʿāʾ for a messenger to be sent?', o:['Ibrāhīm and Ismāʿīl','Abrahah','Hāshim']},
       {q:'In which city was he born?', o:['Makkah','Yathrib','Ṭāʾif']},
       {q:'Why did the other women refuse him?', o:['He was an orphan','He was ill','He was too old']},
       {q:'Who took him out to the desert?', o:['Ḥalīmah as-Saʿdiyyah','Āminah','Ash-Shaymāʾ']} ],
  think:'The other women were not cruel — they were poor and they needed paying. So why was Ḥalīmah’s choice still different from theirs?',
  draw:'Draw two pictures side by side: Ḥalīmah’s thin donkey trailing at the **back** of the caravan on the way in, and the same donkey out in **front** on the way home. Change nothing except the speed.' }
},

/* ===================== MAP 5 ===================== */
{
 n:5, title:'Growing Up in Makkah', colour:'#1f5a7a',
 kick:'The shepherd years',
 hook:'By the time he was eight he had buried his mother\nand his grandfather. By ten, he was working.',
 stories:[
 { n:1, title:'The Washing of the Heart', kick:'A heart made pure', layout:'b', art:'m5-s1',
   panels:[
    { t:'day', z:'auto 155%', px:'40%', py:'42%',
      sfx:[{w:'RUN!', c:'pink md', x:'8%', y:'7%', rot:-12}],
      items:[{cap:'He was about four, out with the other children, when the Angel **Jibrīl** came to him.'},
             {say:'Mother! Two men — they took him, and they **opened** him!', shout:true}]},
    { t:'gold', z:'auto 210%', px:'52%', py:'34%',
      items:[{cap:'Jibrīl took out his heart, removed a small dark part from it, and said: *“This was Shayṭān’s share of you.”*'}]},
    { t:'drama', z:'auto 190%', px:'86%', py:'60%',
      items:[{cap:'Then he washed it in a golden basin with **Zamzam water**, and put it back.'},
             {say:'What happened to you, my son?', who:'Ḥalīmah', r:true}]}
   ],
   treasure:'Allah gave His Prophet a pure heart. We can ask Allah to purify ours too — and we should, every single day.' },

 { n:2, title:'A Journey to Yathrib', kick:'The road to al-Abwāʾ', layout:'c', art:'m5-s2',
   panels:[
    { t:'dusk', z:'cover', px:'36%', py:'46%',
      sfx:[{w:'clop  clop', c:'gold sm', x:'68%', y:'9%', rot:3}],
      items:[{cap:'At six, his mother took him north to **Yathrib** — the city where his father was buried, and where their relatives lived.'}]},
    { t:'night', z:'auto 180%', px:'62%', py:'50%',
      items:[{say:'That is where your father lies. Say salām to him.', who:'Āminah', night:true}]},
    { t:'sil', z:'auto 230%', px:'14%', py:'58%',
      items:[{cap:'On the road home, at a place called **al-Abwāʾ**, his mother fell ill and died.'},
             {cap:'He was six years old, standing beside the grave of the only parent he had ever known.', night:true}]}
   ],
   treasure:'Years later, as a Prophet, he passed that grave again — and he wept, and everybody around him wept with him.' },

 { n:3, title:'Cared For and Loved', kick:'Grandfather, then uncle', layout:'a', art:'m5-s3',
   panels:[
    { t:'gold', z:'cover', px:'42%', py:'44%',
      items:[{cap:'His grandfather **ʿAbd al-Muṭṭalib** took him in and kept him closer than his own sons.'},
             {say:'Leave the boy. Nobody moves him off that rug.', who:'ʿAbd al-Muṭṭalib', r:true}]},
    { t:'dusk', z:'auto 195%', px:'18%', py:'52%',
      items:[{cap:'Two years later, his grandfather died too. He was eight.'}]},
    { t:'drama', z:'auto 215%', px:'82%', py:'48%',
      items:[{cap:'Then his uncle **Abū Ṭālib** took him in — and protected him for the next forty years, right to the edge of his own grave.'}]}
   ],
   treasure:'He never forgot a single one of them. He spoke about his mother, his grandfather and his uncle with love for the rest of his life.' },

 { n:4, title:'The Young Shepherd', kick:'Patience on the hills', layout:'d', art:'m5-s4',
   panels:[
    { t:'day', z:'auto 150%', px:'20%', py:'44%',
      items:[{cap:'He had nothing of his own. So he went out onto the hills above Makkah and looked after other people’s sheep for a few small coins.'}]},
    { t:'gold', z:'auto 200%', px:'48%', py:'38%',
      items:[{say:'**You** herded sheep?', r:true},
             {say:'Yes. And there was never a prophet who did not herd sheep.', who:'The Prophet ﷺ'}]},
    { t:'day', z:'auto 185%', px:'74%', py:'54%',
      sfx:[{w:'baaa', c:'gold sm', x:'10%', y:'8%', rot:5}],
      items:[{cap:'Sheep scatter. Sheep wander off cliffs. Sheep cannot tell you what is wrong. You count them — and you go back for the one that is missing.'}]},
    { t:'dusk', z:'auto 230%', px:'92%', py:'58%',
      items:[{cap:'One day he would be responsible for a whole ummah. And he would go back for the missing one then, too.'}]}
   ],
   treasure:'A small, humble job can be the exact training you need for something enormous you cannot see coming.',
   cliff:{ eyebrow:'At twelve, on the road north to Shām…', line:'A Christian monk who had never once come out to greet a caravan came out, walked down the line, and took a boy by the hand.' } }
 ],
 quest:{
  qs:[ {q:'Which angel came to him as a child?', o:['Jibrīl','Isrāfīl','Mīkāʾīl']},
       {q:'How old was he when his mother died?', o:['Six years old','Ten years old','Two years old']},
       {q:'Who took care of him after his grandfather?', o:['His uncle Abū Ṭālib','Ḥalīmah','Waraqah']},
       {q:'What work did he do as a boy?', o:['He looked after sheep','He built houses','He sailed ships']} ],
  think:'He lost his father, his mother and his grandfather before he was nine. Why do you think Allah chose that beginning for him?',
  draw:'Draw a boy’s long shadow on a hillside at the end of the day, sheep scattered around him, and Makkah tiny in the valley below. Draw him from **behind** — never his face.' }
},

/* ===================== MAP 6 ===================== */
{
 n:6, title:'A Young Man of Honour', colour:'#3f4663',
 kick:'Al-Amīn',
 hook:'A whole city that agreed on almost nothing\nagreed on this one thing about him.',
 stories:[
 { n:1, title:'The Monk Baḥīrā', kick:'Recognised on the road', layout:'b', art:'m6-s1',
   panels:[
    { t:'dusk', z:'auto 150%', px:'30%', py:'44%',
      sfx:[{w:'shhh…', c:'gold md', x:'8%', y:'7%', rot:-7}],
      items:[{cap:'Caravans had passed **Baḥīrā’s** monastery for years. He had never once come out. This time he came out, and laid a meal, and called them all in.'},
             {say:'Come down. All of you. Nobody stays with the camels today.', who:'Baḥīrā'}]},
    { t:'gold', z:'auto 205%', px:'66%', py:'38%',
      items:[{say:'Is this everybody?', who:'Baḥīrā', r:true},
             {say:'All but the boy. We left him minding the baggage.', r:true}]},
    { t:'drama', z:'auto 190%', px:'88%', py:'58%',
      items:[{say:'Send for him.', who:'Baḥīrā'},
             {cap:'He took the boy by the hand. *“This is the master of the worlds. Allah will send him as a mercy to all people. Take him home — and guard him.”*'}]}
   ],
   treasure:'People with real knowledge recognise the truth the moment they see it. Baḥīrā had read the old scriptures, and he knew.' },

 { n:2, title:'Protected by Allah', kick:'Twice, and only twice', layout:'c', art:'m6-s2',
   panels:[
    { t:'night', z:'cover', px:'38%', py:'46%',
      items:[{cap:'Makkah was not a quiet place to be young in. Idols on every corner, drinking, gambling, all-night parties — and nobody thought any of it strange.', night:true}]},
    { t:'drama', z:'auto 185%', px:'64%', py:'42%',
      items:[{cap:'He never bowed to an idol. Not once, in forty years. He told his companions that only **twice** in his whole youth did he feel the pull of it.'},
             {say:'Watch my sheep tonight. I am going down into the town.', who:'The young Al-Amīn', r:true}]},
    { t:'gold', z:'auto 220%', px:'10%', py:'60%',
      sfx:[{w:'zzz', c:'gold sm', x:'72%', y:'10%', rot:7}],
      items:[{cap:'Both times he reached the edge of a wedding party, sat down to listen to the music — and fell asleep where he sat. Both times he woke with the sun already hot on his face.'}]}
   ],
   treasure:'Stay away from the places and the habits that harm the heart — and ask Allah to keep you away from them too.' },

 { n:3, title:'The Pact of Fairness', kick:'Ḥilf al-Fuḍūl', layout:'a', art:'m6-s3',
   panels:[
    { t:'day', z:'cover', px:'44%', py:'44%',
      sfx:[{w:'I HAVE BEEN WRONGED!', c:'pink md', x:'6%', y:'6%', rot:-8}],
      items:[{cap:'A trader from Yemen sold his goods to a powerful Makkan, who simply refused to pay. He asked every clan in the city for help. Not one of them looked at him.'}]},
    { t:'gold', z:'auto 200%', px:'20%', py:'50%',
      items:[{cap:'So he climbed a mountain at dawn and shouted his complaint over the rooftops as a **poem**, until all of Makkah had heard it.'}]},
    { t:'drama', z:'auto 215%', px:'84%', py:'52%',
      items:[{cap:'The chiefs met and swore an oath: **whoever is wronged in Makkah, we stand with them — stranger or not — until their right is returned.**'},
             {say:'I was there when they swore it. I would not trade my place in it for a herd of red camels.', who:'The Prophet ﷺ', r:true}]}
   ],
   treasure:'Those men were not Muslims, and he praised what they did for the rest of his life. Justice is justice, whoever does it.' },

 { n:4, title:'The Trustworthy One', kick:'A name the city gave him', layout:'d', art:'m6-s4',
   panels:[
    { t:'gold', z:'auto 160%', px:'18%', py:'44%',
      items:[{cap:'He never lied. He never cheated. He never once broke a promise.'}]},
    { t:'day', z:'auto 205%', px:'46%', py:'38%',
      sfx:[{w:'clink', c:'gold sm', x:'62%', y:'8%', rot:6}],
      items:[{say:'Hold this for me until I come back. There is nowhere safer in Makkah.', r:true}]},
    { t:'dusk', z:'auto 190%', px:'74%', py:'54%',
      items:[{cap:'So they gave him a name, and it stuck: **Al-Amīn** — the Trustworthy. He never asked for it. The city handed it to him.'}]},
    { t:'drama', z:'auto 230%', px:'94%', py:'48%',
      items:[{cap:'Years later, when that same city wanted him dead, they were **still** leaving their valuables with him. They had nowhere better to put them.'}]}
   ],
   treasure:'Before anybody believed a word he said, they already trusted him completely. The good name came first. It had to.',
   cliff:{ eyebrow:'A wealthy merchant had been hearing his name…', line:'She had turned down the most powerful men in Makkah. Then she sent her servant to travel beside this one — and watch how he behaved when he thought nobody was looking.' } }
 ],
 quest:{
  qs:[ {q:'Who took him on the journey to Shām?', o:['His uncle Abū Ṭālib','Khadījah','Zayd']},
       {q:'Did he ever bow to an idol?', o:['No, never','Once, as a child','Only at festivals']},
       {q:'Why was Ḥilf al-Fuḍūl sworn?', o:['A powerful man refused to pay a stranger','To start a war','To choose a king']},
       {q:'What name did Makkah give him?', o:['Al-Amīn, the Trustworthy','Al-Fāris','Al-Ḥākim']} ],
  think:'He went towards that party twice, and was stopped both times. What stops **you**, when you are about to do something you know is wrong?',
  draw:'Draw a lone figure on a rock above the sleeping city at dawn, hands cupped round his mouth. Show the **sound** travelling out over the rooftops — and open three windows below, not thirty.' }
},

/* ===================== MAP 7 ===================== */
{
 n:7, title:'Trade and Marriage', colour:'#6e1f46',
 kick:'The caravan north',
 hook:'She did not ask what he owned.\nShe asked what he was like on the road.',
 stories:[
 { n:1, title:'The Honest Trader', kick:'Weighing it true', layout:'a', art:'m7-s1',
   panels:[
    { t:'day', z:'cover', px:'36%', py:'46%',
      sfx:[{w:'market day', c:'gold sm', x:'68%', y:'8%', rot:-4}],
      items:[{cap:'Quraysh were traders. Their caravans went north to Shām in the summer and south to Yemen in the winter.'}]},
    { t:'gold', z:'auto 195%', px:'16%', py:'50%',
      items:[{say:'This one has a flaw along the seam. Here — look. I would not want you to find it at home.', who:'Al-Amīn'},
             {say:'You are losing money by telling me that.', r:true}]},
    { t:'dusk', z:'auto 215%', px:'86%', py:'44%',
      items:[{say:'I would rather lose the coin than lose your trust.', who:'Al-Amīn'},
             {cap:'His name spread so far that people who had never worked with him wanted him to trade for them.'}]}
   ],
   treasure:'Being fair in small things — a weight, a price, a seam in the cloth — matters to Allah more than most people think.' },

 { n:2, title:'Maysarah’s Report', kick:'Watched for a whole journey', layout:'b', art:'m7-s2',
   panels:[
    { t:'gold', z:'auto 155%', px:'32%', py:'42%',
      items:[{cap:'**Khadījah bint Khuwaylid** was one of the wealthiest traders in Makkah. She offered him a better share than she gave anybody — and sent her servant **Maysarah** with him.'},
             {say:'Travel beside him. Every day. And tell me exactly what you see.', who:'Khadījah'}]},
    { t:'day', z:'auto 205%', px:'68%', py:'36%',
      items:[{cap:'They came back with more profit in her money than she had ever seen from one journey.'}]},
    { t:'drama', z:'auto 190%', px:'90%', py:'58%',
      items:[{say:'Never mind the profit, Maysarah. Tell me what he was **like**.', who:'Khadījah', r:true},
             {say:'My lady — I travelled beside him for months. He did not lie once. Not once, about anything, to anyone.', who:'Maysarah'}]}
   ],
   treasure:'Good manners when nobody is checking are the only ones that tell you who a person really is.' },

 { n:3, title:'Khadījah', kick:'A marriage of character', layout:'c', art:'m7-s3',
   panels:[
    { t:'gold', z:'cover', px:'34%', py:'44%',
      items:[{cap:'Many important men had asked to marry Khadījah. She had said no to every one of them.'}]},
    { t:'day', z:'auto 185%', px:'62%', py:'48%',
      items:[{cap:'That evening she sent her friend **Nafīsah** with a question. He agreed. His uncles went to speak to her uncle, as was proper, and he gave twenty camels as her dowry.'}]},
    { t:'drama', z:'auto 225%', px:'12%', py:'56%',
      items:[{cap:'He was twenty-five. She was forty. For the twenty-five years she lived, he married nobody else.'},
             {say:'She believed in me when the people rejected me. She trusted me when they called me a liar.', who:'The Prophet ﷺ', r:true}]}
   ],
   treasure:'She chose him for his character, not his wealth or his family. It turned out to be the best decision anybody in Makkah made that year.' },

 { n:4, title:'Zayd Chooses to Stay', kick:'A boy who would not leave', layout:'d', art:'m7-s4',
   panels:[
    { t:'dusk', z:'auto 160%', px:'20%', py:'46%',
      items:[{cap:'There was a boy in that household called **Zayd ibn Ḥārithah** — taken far from his family and sold as a slave. He was set free, and loved so openly that Makkah began calling him *Zayd ibn Muḥammad*.'}]},
    { t:'day', z:'auto 200%', px:'48%', py:'40%',
      sfx:[{w:'at last!', c:'gold sm', x:'8%', y:'8%', rot:-6}],
      items:[{cap:'Then one day his own family found him. His brother came to take him home.'}]},
    { t:'gold', z:'auto 190%', px:'74%', py:'54%',
      items:[{say:'Here he is. Ask him. If he chooses you, take him — and I will not ask you for a single coin.', who:'Al-Amīn', r:true}]},
    { t:'drama', z:'auto 235%', px:'94%', py:'50%',
      items:[{say:'Zayd. Your father. Your uncle. Your own home.', r:true},
             {say:'I am not choosing anyone over this man. I have seen something in him I will not leave.', who:'Zayd'}]}
   ],
   treasure:'He was given a free choice and a clear road home, and he stayed. Good character wins hearts that nothing else can reach.',
   cliff:{ eyebrow:'Then he turned thirty-five, and a flood came…', line:'The Kaʿbah had to be rebuilt. And when the time came to lift one black stone back into the wall, the chiefs of Makkah very nearly drew their swords over it.' } }
 ],
 quest:{
  qs:[ {q:'Where did the summer caravan go?', o:['North to Shām','South to Yemen','East to Persia']},
       {q:'Who watched him on the journey?', o:['Her servant Maysarah','His uncle','Zayd']},
       {q:'What did Khadījah ask about first?', o:['His character','His family','His money']},
       {q:'What did Makkah call Zayd?', o:['Zayd ibn Muḥammad','Zayd al-Amīn','Zayd of Shām']} ],
  think:'He pointed out the flaw in his own goods and lost money for it. When was the last time being honest cost **you** something?',
  draw:'Draw Maysarah reporting back — but draw it as three small memory panels floating above him: the scales weighed level, the flaw pointed out, the goods handed over complete. Hands only. No faces needed.' }
},

/* ===================== MAP 8 ===================== */
{
 n:8, title:'Before the Message', colour:'#2c1259',
 kick:'The cave on the mountain',
 hook:'Four days of argument and swords half drawn.\nThen somebody said: let the next man through the gate decide.',
 stories:[
 { n:1, title:'The Black Stone', kick:'A cloak and four corners', layout:'a', art:'m8-s1',
   panels:[
    { t:'drama', z:'cover', px:'40%', py:'44%',
      sfx:[{w:'SHHHK', c:'pink md', x:'8%', y:'7%', rot:-10}],
      items:[{cap:'A flood damaged the Kaʿbah, and Quraysh rebuilt it — using only money that had been earned honestly. Then they reached the **Black Stone**, and everything stopped.'},
             {say:'My clan lifts it. We have the oldest claim!', shout:true, r:true}]},
    { t:'dusk', z:'auto 195%', px:'18%', py:'52%',
      items:[{cap:'Four days. Five. The building stood open and unfinished while the chiefs circled each other.'},
             {say:'Let the first man who walks in through that gate tomorrow decide it.', who:'Abū Umayyah'}]},
    { t:'gold', z:'auto 215%', px:'84%', py:'46%',
      sfx:[{w:'AL-AMĪN!', c:'gold md', x:'6%', y:'8%', rot:-7}],
      items:[{say:'Lay the stone in the middle of this cloak. Now — each clan takes an edge. **Lift together.**', who:'Al-Amīn'},
             {cap:'Every clan carried it. Nobody was shamed. He set it into the wall with his own hands.'}]}
   ],
   treasure:'A wise answer does not pick a winner. It makes a way for everybody to keep their honour — and the job gets done.' },

 { n:2, title:'Seekers of the Truth', kick:'The ḥunafāʾ', layout:'c', art:'m8-s2',
   panels:[
    { t:'dusk', z:'cover', px:'34%', py:'46%',
      items:[{cap:'A handful of men in Makkah had quietly decided the idols were nonsense, and were looking for the religion of Ibrāhīm on their own, with nothing to go on.'}]},
    { t:'drama', z:'auto 190%', px:'62%', py:'42%',
      items:[{say:'O Quraysh — not one of you is on the religion of Ibrāhīm except me.', who:'Zayd ibn ʿAmr', r:true}]},
    { t:'sil', z:'auto 225%', px:'14%', py:'58%',
      items:[{say:'Allah created the sheep. Allah sent down the rain for it, and grew the grass out of the earth for it. And then you slaughter it for something **other** than Allah?', who:'Zayd ibn ʿAmr', night:true}]}
   ],
   treasure:'He died before the message came. But alone, in the dark, with no book and no prophet, he had worked out which direction to face.' },

 { n:3, title:'Dreams Like the Dawn', kick:'Six months of true dreams', layout:'b', art:'m8-s3',
   panels:[
    { t:'night', z:'auto 155%', px:'36%', py:'44%',
      items:[{cap:'As he came near forty, something new began.', night:true},
             {say:'The first thing that came to him was true dreams. He never saw a dream without it coming true — clear and bright, like the breaking of the dawn.', who:'ʿĀʾishah'}]},
    { t:'gold', z:'auto 205%', px:'68%', py:'36%',
      items:[{cap:'Six months of that. And then Allah made him **love to be alone**.'}]},
    { t:'drama', z:'auto 230%', px:'90%', py:'58%',
      items:[{cap:'He would take barley and water, and climb.'}]}
   ],
   treasure:'Quiet time, away from noise, thinking about Allah and about what He has made — it softens the heart. Nothing else does it the same way.' },

 { n:4, title:'The Cave of Ḥirāʾ', kick:'Jabal an-Nūr', layout:'e', art:'m8-s4',
   panels:[
    { t:'night', z:'cover', px:'50%', py:'42%',
      sfx:[{w:'wind', c:'gold md', x:'7%', y:'6%', rot:-14},
           {w:'…', c:'pink sm', x:'78%', y:'62%', rot:0}],
      items:[{cap:'A small cave called **Ḥirāʾ**, high on the Mountain of Light, about two miles from Makkah. Four long steps from end to end.', night:true},
             {cap:'He stayed there for nights at a time, especially in Ramaḍān, worshipping Allah and thinking about the One who made the stars above him and the desert below.', night:true},
             {say:'There is a traveller on the path. Call him up — there is enough food for two.', who:'The Prophet ﷺ'},
             {cap:'He was thirty-nine years old, troubled by what his people had become — and he had no idea that the answer was already on its way up that mountain.', night:true}]}
   ],
   treasure:'Even alone on a mountain with barely any food, he was still inviting strangers to eat. Good character does not switch off when nobody is watching.',
   cliff:{ eyebrow:'And then, one night in Ramaḍān…', line:'Something filled the entrance of the cave and said one word to him — a word he did not know how to obey.' } }
 ],
 quest:{
  qs:[ {q:'What were the chiefs arguing about?', o:['Who would lift the Black Stone','Who would be king','Who owned the well']},
       {q:'What did he spread on the ground?', o:['A cloak','A carpet','A sheet of gold']},
       {q:'What were the seekers of truth called?', o:['The ḥunafāʾ','The Quraysh','The Anṣār']},
       {q:'What came to him for six months before the revelation?', o:['True dreams','Letters','Visitors']} ],
  think:'He climbed a mountain just to be quiet and think. Where is **your** quiet place — and when did you last go there without a screen in your hand?',
  draw:'Draw the inside of the cave looking **out** — a small dark opening, the valley far below, stars above. You are sitting where he sat. Leave the cave completely empty.' }
},

/* ===================== MAP 9 ===================== */
{
 n:9, title:'The First Revelation', colour:'#13294b',
 kick:'Iqraʾ',
 hook:'He said he could not. It said it again.\nAnd again. And then the Qurʾān began.',
 stories:[
 { n:1, title:'Read!', kick:'The night in the cave', layout:'e', art:'m9-s1',
   panels:[
    { t:'gold', z:'cover', px:'50%', py:'46%',
      sfx:[{w:'IQRAʾ', c:'gold xl', x:'6%', y:'5%', rot:-7},
           {w:'IQRAʾ', c:'pink lg', x:'62%', y:'26%', rot:9}],
      items:[{cap:'Ramaḍān. The fortieth year of his life. Alone in Ḥirāʾ — and then the cave was not empty any more.'},
             {say:'Read!', who:'Jibrīl', shout:true},
             {say:'I am not one who reads.', who:'The Prophet ﷺ', r:true},
             {cap:'He was held and pressed until he could not bear it, and released. Twice more. And then:'},
             {say:'Read, in the name of your Lord who created — created man from a clinging clot. Read, and your Lord is the Most Generous, who taught by the pen, taught man what he did not know.', who:'Sūrah al-ʿAlaq 96:1–5'}]}
   ],
   treasure:'The very first command of the Qurʾān to all of humanity was **Read** — and the second line mentions the pen.' },

 { n:2, title:'Comfort from Khadījah', kick:'“Allah will never disgrace you”', layout:'a', art:'m9-s2',
   panels:[
    { t:'night', z:'cover', px:'40%', py:'44%',
      sfx:[{w:'run', c:'pink md', x:'8%', y:'7%', rot:-12}],
      items:[{cap:'He came down off that mountain in the dark with his heart hammering, and went straight home.', night:true},
             {say:'Cover me! **Cover me!**', who:'The Prophet ﷺ', shout:true}]},
    { t:'gold', z:'auto 195%', px:'20%', py:'50%',
      items:[{cap:'She wrapped him in a cloak and sat with him until the shaking stopped, and asked him nothing at all until he was ready.'},
             {say:'I was afraid for myself.', who:'The Prophet ﷺ', r:true}]},
    { t:'drama', z:'auto 215%', px:'86%', py:'48%',
      items:[{say:'Never. By Allah, Allah will never disgrace you. You keep ties with your family. You carry those who are weak. You give to people who have nothing. You honour your guest. You stand by anyone struck by trouble.', who:'Khadījah'}]}
   ],
   treasure:'She did not say “don’t worry”. She listed his own good back to him as evidence. That is how you comfort somebody properly.' },

 { n:3, title:'Waraqah’s Words', kick:'The old man who knew', layout:'b', art:'m9-s3',
   panels:[
    { t:'gold', z:'auto 155%', px:'34%', py:'42%',
      items:[{cap:'She took him to her cousin **Waraqah ibn Nawfal** — old, blind, a Christian who had read the earlier scriptures and could write in Hebrew.'},
             {say:'Cousin. Listen to what your nephew is telling you.', who:'Khadījah'}]},
    { t:'drama', z:'auto 205%', px:'66%', py:'36%',
      items:[{say:'This is the same angel Allah sent down to Mūsā. I wish I were young. I wish I were alive on the day your people drive you out.', who:'Waraqah'}]},
    { t:'dusk', z:'auto 230%', px:'92%', py:'58%',
      items:[{say:'Drive me out? Will they really drive me out?', who:'The Prophet ﷺ', r:true},
             {say:'No man has ever brought what you bring without being made an enemy. If I live to see that day, I will stand with you with everything I have.', who:'Waraqah'}]}
   ],
   treasure:'The very first expert to confirm the message also told him, on day one, exactly what it was going to cost him. He knew the price from the beginning.' },

 { n:4, title:'“Arise and Warn”', kick:'The waiting, and the call', layout:'c', art:'m9-s4',
   panels:[
    { t:'night', z:'cover', px:'36%', py:'46%',
      items:[{cap:'Then Jibrīl did not come. Not the next night, or the night after. He waited, and he went back up the mountain, and the waiting was its own kind of hard.', night:true}]},
    { t:'drama', z:'auto 185%', px:'64%', py:'42%',
      sfx:[{w:'. . .', c:'gold md', x:'10%', y:'8%', rot:0}],
      items:[{cap:'And then one day, walking, he heard a voice out of the sky — and looked up, and the same angel from Ḥirāʾ filled the whole horizon.'},
             {say:'Cover me! Cover me!', who:'The Prophet ﷺ', r:true, shout:true}]},
    { t:'gold', z:'auto 215%', px:'88%', py:'52%',
      items:[{say:'O you who are wrapped up — **arise, and warn!** Declare the greatness of your Lord. Keep your clothes pure. And keep away from idols.', who:'Sūrah al-Muddaththir'},
             {cap:'That was the end of being left alone with it. The revelation would now keep coming for **twenty-three years**.'}]}
   ],
   treasure:'Everything in this book was the ground being prepared. The orphan, the shepherd, the honest trader, the man they called Trustworthy — all of it was for this.',
   cliff:{ eyebrow:'And now the hard part begins…', line:'He had the message. Now he had to carry it — into a city of three hundred and sixty idols, where his own family held the keys.' } }
 ],
 quest:{
  qs:[ {q:'Which angel came to him in the cave?', o:['Jibrīl','Isrāfīl','Mīkāʾīl']},
       {q:'What was the first word revealed?', o:['Read','Fight','Build']},
       {q:'Who was Waraqah ibn Nawfal?', o:['Khadījah’s cousin, who knew the earlier scriptures','A leader of Ṭāʾif','A trader from Yemen']},
       {q:'What happened after the first revelation?', o:['Revelation paused for a while','Jibrīl came every hour','He left Makkah']} ],
  think:'He said “I am not one who reads” three times. What does that tell you about where the Qurʾān actually came from?',
  draw:'Draw the cave mouth from far away — one small bright point on a huge black mountain, and the whole sleeping city below with no idea what has just happened. Light **one** window in the city.' }
}
]};
