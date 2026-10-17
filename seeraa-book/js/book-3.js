/* Seeraa Quest — Book Three: The Longest Night
   Chapters XIX–XXVII  ·  Maps 19–27  ·  out of Makkah, and the day of Badr */
window.SEERAA_BOOK = {
  id: 3,
  title: 'The Longest Night',
  range: 'Chapters XIX–XXVII',
  chapters: [

/* ========================= XIX ========================= */
{
  title: 'Seventy-Three',
  plate: '',
  sub: 'They slipped away from their sleeping companions one at a time, in the middle of the night, to promise something that would cost them everything.',
  pages: [
    { t:'splash', art:['oasis','day'],
      h:'The best-dressed young man in Makkah',
      p:'**Muṣʿab ibn ʿUmayr** had worn the finest clothes in the city and the best perfume in Arabia, and his mother gave him anything he asked for. When he became Muslim she took all of it away. He chose Allah, and went north to Yathrib with nothing — as its first teacher.' },

    { t:'comic', layout:'trio', panels:[
      { art:['well','day'], cls:'tall',
        sfx:[{w:'THUNK', c:'mid pink', x:'62%', y:'18%', rot:-10}],
        items:[
          { cap:'He was sitting by a well teaching, when **Usayd ibn Ḥuḍayr**, a chief of the Aws, came up fast with his spear.' },
          { say:'Why have you come to fool our weak people? Leave now, if your life means anything to you!', who:'Usayd', kind:'shout', r:true }
        ]},
      { art:['well','sand'],
        items:[
          { say:'Will you sit and listen? If you like it, take it. If you dislike it, we will stop.', who:'Muṣʿab' },
          { say:'…That is fair.', who:'Usayd', r:true },
          { cap:'He planted his spear in the ground and sat down.' }
        ]},
      { art:['oasis','dusk'],
        items:[
          { cap:'He heard it out. Before he said a word, they could see it in his face.' },
          { say:'What do you do, to enter this religion?', who:'Usayd' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['tent','deep'], cls:'hero span',
        sfx:[{w:'ssh', c:'sm pink', x:'72%', y:'16%', rot:8}],
        items:[
          { cap:'The next Ḥajj season, in the middle of the night, they slipped out of their camps one by one and climbed to ʿAqabah. **Seventy-three men and two women.**', night:true },
          { say:'Keep your voices down. If Quraysh find us here, none of us go home.', r:true }
        ]},
      { art:['tent','night'], cls:'short',
        items:[
          { cap:'His uncle **al-ʿAbbās** came too — not yet a Muslim, but wanting to be sure his nephew was being promised something real.', night:true }
        ]}
    ]},

    { t:'prose', kicker:'The Second Pledge', h:'“What do we get, if we keep it?”',
      body:[
        'They promised: to listen and obey in easy times and hard times. To spend in the way of Allah. To call to good and forbid wrong. To speak the truth wherever they were, and to fear nobody’s blame.',
        'And to protect him exactly as they protected their own wives and children.',
        'One of them, **al-ʿAbbās ibn ʿUbādah**, stopped the whole thing before they shook hands.',
        '*“Do you people understand what you are promising? This is war. With everybody. If your wealth is destroyed and your leaders are killed, will you hand him over then? Because if you would, say so now — by Allah, it would be shameful in this world and the next.”*',
        '*“We take him,”* they said, *“even if our wealth is destroyed and our leaders are killed. And what do we get, if we keep it?”*',
        'And he said: **“Paradise.”**',
        '*“Then put out your hand.”*',
        'They chose twelve leaders from among themselves and went back down the hill before dawn, and slept where they had been sleeping, and in the morning nobody knew anything had happened.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['road','dusk'], cls:'tall',
        items:[
          { cap:'**Abū Salamah** was the first Makkan to set out for Madīnah, with his wife **Umm Salamah** and their baby. Her family blocked the road.' },
          { say:'You may go. You will not take our daughter.', r:true }
        ]},
      { art:['desert','blood'],
        sfx:[{w:'NO—', c:'mid pink', x:'12%', y:'18%', rot:-11}],
        items:[
          { cap:'Then his family came. *“If she stays — then our grandson comes with us.”* They pulled the baby out of her arms.' },
          { cap:'In one moment the family was torn three ways: the father went north alone, the mother stayed, the baby went to another clan.' }
        ]},
      { art:['desert','dawn'],
        items:[
          { cap:'Every single morning for almost a year, Umm Salamah walked out to the place where they had taken him from her, and sat there until the evening, and cried. Then went home. Then came back the next day.' },
          { cap:'Eventually one of her relatives could not bear it and made them give her back her son. She crossed the desert to Madīnah with a child on her hip, alone.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'They were told the price first', v:'Nobody was tricked into that pledge. They were warned it meant war with all of Arabia **before** they agreed.' },
        { k:'Two of them were women', v:'**Nusaybah bint Kaʿb** (Umm ʿUmārah) and **Asmāʾ bint ʿAmr** were there that night, and gave their word with everyone else.' },
        { k:'Muṣʿab did it in one year', v:'One young teacher, sent alone. By the time he had been there twelve months, there was hardly a household in the city without a Muslim in it.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Usayd came with a spear and sat down when he was offered a fair deal. What made Muṣʿab’s answer so disarming?',
        'They were told exactly what it would cost before they agreed. Would you rather know the cost first, or not know?',
        'Umm Salamah went back to the same spot every day for a year. What keeps a person going that long?',
        '“And what do we get?” — “Paradise.” Is that enough of an answer for you? Be honest.'
      ],
      ponder:'Seventy-three people promised to defend a man most of them had met twice, against the whole of Arabia, in the dark, for nothing they would see in this life.' },

    { t:'draw', h:'A spear in the ground',
      prompt:'Draw one spear standing upright in the sand beside a well, and two figures sitting down near it in the late sun. The weapon is still there. It is just not in anyone’s hand any more.',
      ghost:'put down, not taken away',
      tips:[
        'The spear should be the tallest thing on the page, straight and dark against the sky.',
        'Sit both figures low and relaxed. The contrast between upright weapon and seated people **is** the story.',
        'Long evening shadows pointing towards the viewer will tie the two together.'
      ],
      bank:['Muṣʿab','Usayd','ʿAqabah','seventy-three','the pledge','Paradise'] },

    { t:'cliff', eyebrow:'In Makkah, the council met…',
      line:'One young man from every clan, striking together, so the blame would be shared and no family could take revenge.',
      next:'Chapter XX · The Empty Bed' }
  ]
},

/* ========================= XX ========================= */
{
  title: 'The Empty Bed',
  plate: 'gold',
  sub: 'They watched the door all night. They were watching the wrong person, and the man they wanted had walked out hours before.',
  pages: [
    { t:'splash', art:['city','night'],
      h:'Quietly, in small groups, mostly at night',
      p:'After the pledge, permission came to move. They left their houses, their businesses and their families, a few at a time, until almost the only Muslims left in Makkah were the Prophet ﷺ, **Abū Bakr**, **ʿAlī**, and those who could not get away.' },

    { t:'comic', layout:'trio', panels:[
      { art:['city','dusk'], cls:'tall',
        items:[
          { say:'Let me go too.', who:'Abū Bakr' },
          { say:'Wait. Perhaps Allah will give you a companion.', who:'The Prophet ﷺ', r:true }
        ]},
      { art:['oasis','sand'],
        items:[
          { cap:'Abū Bakr understood exactly what that meant. He bought two strong camels and fed them carefully for **four months**, and said nothing to anybody.' }
        ]},
      { art:['market','sand'],
        items:[
          { cap:'**Ṣuhayb ar-Rūmī** had come to Makkah poor and worked until he was rich. When he tried to leave, Quraysh surrounded him.' },
          { say:'You came to us with nothing and got rich among us. Now you ride off with it? Never.', r:true }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['market','dusk'], cls:'hero span',
        items:[
          { say:'If I tell you where every coin of it is, will you let me go?', who:'Ṣuhayb' },
          { say:'…Yes.', r:true },
          { cap:'He told them. All of it. And rode out of Makkah with nothing but a camel and a bow.' }
        ]},
      { art:['madinah','dawn'], cls:'short',
        items:[
          { say:'Your trade has made a profit, Abū Yaḥyā! Your trade has made a profit!', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'prose', kicker:'Dār an-Nadwah', h:'A plan that shared the blame',
      body:[
        'Most of the Muslims were in Madīnah now, and Quraysh could see what was coming. They met in their council house, **Dār an-Nadwah**, to settle it once and for all.',
        '*“Lock him in chains.”* — *“No. His followers will come and get him out.”*',
        '*“Then put him out of Makkah.”* — *“No. He will win over some other tribe with that tongue of his, and come back at the head of it.”*',
        'Then Abū Jahl spoke, and the room went quiet, because it was clever.',
        '*“One strong young man from every clan. They strike him all together, at the same moment. Then the blood is spread across every family in Quraysh. Banū Hāshim cannot take revenge on all of us at once — they will have to accept payment, and that will be the end of it.”*',
        'Everyone agreed. They went to the house that night and surrounded the door.',
        'But he had already been told.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['city','night'], cls:'tall',
        items:[
          { cap:'Inside the house, he asked his young cousin to lie down in his bed and wrap himself in the green cloak.', night:true },
          { say:'They will see the cloak and think you are me. Lie down, ʿAlī.', who:'The Prophet ﷺ' },
          { say:'Yes.', who:'ʿAlī', r:true }
        ]},
      { art:['city','deep'],
        items:[
          { cap:'And one more job — stay behind afterwards and give back every single thing people have left here for safekeeping.', night:true },
          { cap:'The men outside, waiting to kill him, still had their valuables inside his house. They had nowhere safer to put them.' }
        ]},
      { art:['desert','night'],
        sfx:[{w:'…', c:'sm gold', x:'20%', y:'20%', rot:0}],
        items:[
          { cap:'He walked out through the middle of them, took a handful of dust, scattered it, and went. Not one of them saw him go.', night:true }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'Ṣuhayb gave away a lifetime of work', v:'Everything he had earned in Makkah, in one sentence, to be allowed to leave. And he was told it was a **profitable trade**.' },
        { k:'ʿAlī was about twenty-two', v:'He lay down in a bed that a dozen armed men were about to attack, and stayed there until morning.' },
        { k:'The trusts were returned', v:'The last thing done in Makkah was handing back property to people who had just tried to murder him. That is why they called him Al-Amīn.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Ṣuhayb traded everything he owned for his faith and was congratulated on the deal. What would be hardest for **you** to give up?',
        'Abū Bakr fed two camels for four months without being told why. What does it mean to prepare for something you only hope is coming?',
        'ʿAlī said one word and lay down. Where does that kind of calm come from?',
        'He gave back the valuables of people who wanted him dead. Why do that, when nobody would have blamed him for keeping them?'
      ],
      ponder:'They thought the problem was one man in one bed. The thing they were actually trying to stop had already left the city on foot.' },

    { t:'draw', h:'The cloak',
      prompt:'Draw the room from the doorway: an empty bed with a green cloak over a shape in it, moonlight across the floor, and the long shadows of several men falling in through the window. Draw no faces at all.',
      ghost:'somebody is in that bed. not who they think.',
      tips:[
        'Shadows of the watchers, not the watchers. A shadow is scarier than the person casting it.',
        'Let the green cloak be the only colour in an otherwise blue-grey picture.',
        'Open the door a crack on the far side, with darkness beyond. That is where he went.'
      ],
      bank:['Dār an-Nadwah','green cloak','ʿAlī','the trusts','dust','hijrah'] },

    { t:'cliff', eyebrow:'Three days later, in a cave on a mountain…',
      line:'A search party stood so close that one of them only had to look down at his own feet.',
      next:'Chapter XXI · Two in the Cave' }
  ]
},

/* ========================= XXI ========================= */
{
  title: 'Two in the Cave',
  plate: 'light',
  sub: 'A hundred camels for either of their heads. And a rider who got close enough to hear the Qurʾān being recited.',
  pages: [
    { t:'splash', art:['cave','night'],
      h:'Thawr',
      p:'They went **south** — the wrong way entirely — and hid three days in a cave on the mountain of Thawr while search parties combed every road north.' },

    { t:'comic', layout:'trio', panels:[
      { art:['cave','deep'], cls:'tall',
        sfx:[{w:'footsteps', c:'sm pink', x:'58%', y:'14%', rot:-8}],
        items:[
          { cap:'On the third day the voices came right up to the mouth of the cave.', night:true },
          { say:'If one of them just looked down at his feet, he would see us.', who:'Abū Bakr', r:true }
        ]},
      { art:['cave','sacred'],
        items:[
          { say:'What do you think, Abū Bakr, of **two**, when Allah is the third of them?', who:'The Prophet ﷺ' },
          { say:'Do not grieve. Allah is with us.', who:'The Prophet ﷺ' }
        ]},
      { art:['mountain','dawn'],
        items:[
          { cap:'The search party turned round and went back down the mountain.' }
        ]}
    ]},

    { t:'prose', kicker:'The Family Who Kept Them Alive', h:'Three jobs, done perfectly',
      body:[
        'Nobody in that cave could have survived three days on their own. Three people kept them there.',
        '**ʿAbdullāh ibn Abī Bakr** spent every day in Makkah among the men hunting his father, listening, saying nothing — then climbed the mountain at night with the day’s news and was back in the city before dawn, so nobody ever missed him.',
        '**ʿĀmir ibn Fuhayrah**, a shepherd, grazed the sheep near the cave every evening so they had fresh milk — and then drove the flock back over ʿAbdullāh’s footprints so the tracks were gone by morning.',
        'And **Asmāʾ bint Abī Bakr** carried the food up. She had nothing to tie the bundle with, so she tore her waist-belt in two — one half for the food, one half for herself. They called her **Dhāt an-Niṭāqayn** ever after: *she of the two belts.*',
        'Quraysh came to her father’s house looking for him. She told them nothing. **Abū Jahl** hit her across the face so hard that her earring flew off.',
        'She still told them nothing.'
      ] },

    { t:'comic', layout:'wide-duo', panels:[
      { art:['road','sand'], cls:'hero span',
        items:[
          { cap:'After three days they came down. The guide, **ʿAbdullāh ibn Urayqiṭ**, was waiting with the camels — not a Muslim, but honest, and he knew the desert better than anyone.' },
          { say:'Not the north road. South first, then west to the coast, then north on the tracks nobody uses. We travel at night.', who:'The guide', r:true }
        ]},
      { art:['desert','sand'], cls:'short',
        items:[
          { cap:'Once, Abū Bakr found a rock with shade under it, swept it, spread a cloth for the Prophet ﷺ to sleep on, and went out to look for water — and came back to find a shepherd had already brought milk, and that his companion was asleep. He sat and guarded him and did not wake him.' }
        ]}
    ]},

    { t:'comic', layout:'trio', panels:[
      { art:['desert','day'], cls:'tall',
        sfx:[{w:'GALLOP', c:'mid pink', x:'10%', y:'16%', rot:-9}],
        items:[
          { cap:'Quraysh announced the reward: **a hundred camels** for either of them. **Surāqah ibn Mālik** heard where they had been seen, and went alone so he would not have to share it.' }
        ]},
      { art:['desert','sand'],
        sfx:[{w:'SSSH—K', c:'big gold', x:'46%', y:'20%', rot:-12}],
        items:[
          { cap:'He got close enough to hear the Qurʾān being recited. The Prophet ﷺ never looked round. Abū Bakr kept turning back.' },
          { cap:'Then his horse’s front legs sank into firm, flat sand up to the knees, and threw him.' }
        ]},
      { art:['desert','dusk'],
        items:[
          { cap:'He got up, remounted, rode in again. It happened again. And again. Until he understood.' },
          { say:'I am Surāqah. Take whatever you want of my supplies — and write me a safe-conduct for the day you come back.', who:'Surāqah', r:true },
          { say:'How will you feel, Surāqah, when you wear the bracelets of Khosrau?', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'He wore them', v:'Years later, in the time of ʿUmar, the treasure of the Persian emperor was brought to Madīnah. ʿUmar called for Surāqah and put the bracelets of Khosrau on his arms in front of everyone.' },
        { k:'Surāqah kept the hunt secret', v:'He had gone alone out of greed — and when he turned back he told everyone else the road was clear, so nobody else followed.' },
        { k:'The Hijrah starts the calendar', v:'Not his birth, not the first revelation — the **Hijrah**. Islamic years are counted from the moment a community got somewhere it could finally build.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        '“What do you think of two, when Allah is the third of them?” When have you been afraid, and what calmed you down?',
        'Three people kept that cave supplied and none of them are famous for anything else. Does a job have to be big to matter?',
        'Asmāʾ was struck and said nothing. What would be hard about keeping a secret like that?',
        'Surāqah came as a hunter and left with a promise. Can someone who starts out against you end up on your side?'
      ],
      ponder:'The most important journey in history was planned like a careful piece of work: a guide who knew the roads, food, milk, news, a wrong turn on purpose, and a decoy in the bed.' },

    { t:'draw', h:'Feet at the mouth of the cave',
      prompt:'Draw the view from **inside** the cave: the opening, bright daylight outside, and a pair of sandalled feet standing right at the entrance. We are in the dark looking out. We are not breathing.',
      ghost:'do not look down',
      tips:[
        'Fill the frame with black and leave only a small bright shape at the opening.',
        'Put the feet right at the bottom edge of that bright shape so they are impossible to miss.',
        'Add one tiny detail inside the dark — a hand on the floor, just catching the light.'
      ],
      bank:['Thawr','Asmāʾ','two belts','ʿĀmir','Surāqah','a hundred camels'] },

    { t:'cliff', eyebrow:'Up north, every morning for days…',
      line:'A whole city walked out to the edge of the lava fields at sunrise to watch an empty road.',
      next:'Chapter XXII · The Road Watchers' }
  ]
},

/* ========================= XXII ========================= */
{
  title: 'The Road Watchers',
  plate: '',
  sub: 'Every chief in the city begged him to stay at their house. He let the camel decide.',
  pages: [
    { t:'splash', art:['tent','sand'],
      h:'Umm Maʿbad’s thin goat',
      p:'They stopped at the tent of an old woman known for feeding travellers — in a year of drought, with nothing to feed them. One goat stood in the corner, too weak to go out with the flock.' },

    { t:'comic', layout:'trio', panels:[
      { art:['tent','sand'], cls:'tall',
        items:[
          { say:'By Allah, if I had anything at all I would give it to you for nothing.', who:'Umm Maʿbad' },
          { say:'May I milk her?', who:'The Prophet ﷺ', r:true },
          { say:'If you can find milk in **that** one, go ahead.', who:'Umm Maʿbad' }
        ]},
      { art:['tent','day'],
        sfx:[{w:'ssss', c:'sm gold', x:'64%', y:'62%', rot:5}],
        items:[
          { cap:'He wiped her udder, said the name of Allah, and milked her — until a large vessel was full.' },
          { cap:'He gave it to Umm Maʿbad first. Then to his companions. Then he drank last. Then he filled it again and left it with her.' }
        ]},
      { art:['desert','dusk'],
        items:[
          { cap:'Her husband came home to find a full vessel of milk in a house with no food.' },
          { say:'Where did this come from?', r:true },
          { say:'A blessed man passed by. Let me describe him to you.', who:'Umm Maʿbad' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['desert','day'], cls:'hero span',
        sfx:[{w:'HE IS HERE!', c:'big pink', x:'8%', y:'14%', rot:-8}],
        items:[
          { cap:'In Madīnah they had been walking out to the lava fields every morning for days to watch the road, and going home only when the sun got too hot.' },
          { cap:'One day, after they had given up and gone in, a Jewish man up on a high fort saw white clothes shimmering in the heat far off, and shouted across the whole city.' }
        ]},
      { art:['madinah','dawn'], cls:'short',
        sfx:[{w:'ALLĀHU AKBAR', c:'mid gold', x:'54%', y:'18%', rot:-5}],
        items:[
          { cap:'They poured out of their houses. He stopped first at **Qubāʾ**, on the edge of the city, and in four days they built the first masjid in Islam.' }
        ]}
    ]},

    { t:'prose', kicker:'Friday', h:'“This camel is under orders”',
      body:[
        'On Friday he left Qubāʾ for the city itself, with Banū an-Najjār, his mother’s people, riding alongside. On the way he stopped in the valley of Banū Sālim and led the first Friday prayer, about a hundred people behind him.',
        'The road into Madīnah was lined on both sides. The girls were up on the rooftops singing:',
        '*“The full moon has risen over us, from the valley of al-Wadāʿ —*',
        '*we owe thanks for as long as anyone calls on Allah.”*',
        'And the chiefs of every clan rode round the camel in their best clothes and their brightest armour, each of them taking hold of her halter in turn:',
        '*“Stay with us, O Messenger of Allah! We have numbers, and wealth, and we can protect you!”*',
        'And he said the same thing to every single one of them, so that nobody could be offended and nobody could be favoured:',
        '*“Let her go. This camel is under orders.”*',
        'She walked on through the city with the whole of Madīnah following her, and knelt on an open piece of ground used for drying dates.',
        'The nearest house belonged to **Abū Ayyūb al-Anṣārī**, and he had already grabbed the luggage and run it inside before anyone could argue.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['madinah','dusk'], cls:'tall',
        items:[
          { cap:'The house had two floors. He took the ground floor, so visitors could reach him easily.' }
        ]},
      { art:['city','night'],
        sfx:[{w:'!!', c:'mid pink', x:'66%', y:'20%', rot:9}],
        items:[
          { cap:'That night Abū Ayyūb woke up with a jolt.', night:true },
          { say:'We are walking around **above his head**. Get up. Move to the corner.', who:'Abū Ayyūb', r:true }
        ]},
      { art:['madinah','dawn'],
        items:[
          { cap:'They spent the whole night pressed into one corner of the room, afraid to walk about. In the morning he begged the Prophet ﷺ to change floors.' },
          { say:'The ground floor is easier for the people who come.', who:'The Prophet ﷺ' },
          { cap:'He begged until he agreed.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'He drank last', v:'Umm Maʿbad first, then his companions, then him. *“The one who pours for people drinks last.”*' },
        { k:'Qubāʾ is still there', v:'The first masjid built in Islam. The Prophet ﷺ used to walk out to it every Saturday, and said two rakʿahs there are like an ʿumrah.' },
        { k:'Yathrib got a new name', v:'From then on it was **al-Madīnah** — *the City*. One place on earth is simply called The City, and everyone knows which.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Umm Maʿbad offered what she did not have before she was asked for anything. What does that tell you about her?',
        'He let the camel decide so that no clan would be insulted. Why was that worth the trouble?',
        'Abū Ayyūb could not sleep because he was on a floor above his guest. When did you last worry that much about a guest?',
        'A whole city walked out to watch an empty road every morning. What are you waiting for that much?'
      ],
      ponder:'He arrived with nothing. No house, no money, no land. And the argument in the street was about who would be allowed to feed him.' },

    { t:'draw', h:'Let her go',
      prompt:'Draw the camel walking down a crowded street with chiefs on either side reaching for her halter, rooftops crowded with people waving — and the camel calmly looking straight ahead, ignoring all of them. Make the **camel** the calmest thing on the page.',
      ghost:'she knows where she is going',
      tips:[
        'Everything around her busy and tilted; the camel upright and still. That contrast carries the whole joke and the whole point.',
        'Crowd the rooftops. People leaning over edges always make a street feel full.',
        'No faces needed. Arms, sleeves, banners and reaching hands do it all.'
      ],
      bank:['Qubāʾ','Abū Ayyūb','the camel','Banū an-Najjār','al-Madīnah','welcome'] },

    { t:'cliff', eyebrow:'And then the work started…',
      line:'Mud bricks, palm trunks, and a man carrying stone alongside everyone else.',
      next:'Chapter XXIII · Brothers' }
  ]
},

/* ========================= XXIII ========================= */
{
  title: 'Brothers',
  plate: 'light',
  sub: '“I will split everything I own with you, right now, in half.” — “May Allah bless it for you. Just show me the market.”',
  pages: [
    { t:'splash', art:['madinah','day'],
      h:'Mud bricks and palm trunks',
      p:'The ground where the camel knelt belonged to two orphan boys, **Sahl and Suhayl**. They offered it as a gift. He refused, and paid them a fair price for it. Then everybody started building.' },

    { t:'comic', layout:'trio', panels:[
      { art:['madinah','sand'], cls:'tall',
        sfx:[{w:'heave', c:'sm gold', x:'60%', y:'18%', rot:-6}],
        items:[
          { cap:'He carried bricks himself, in the line with everyone else, and they sang while they worked:' },
          { say:'O Allah, there is no good except the good of the Hereafter — so forgive the Anṣār and the Muhājirūn!', who:'All of them' }
        ]},
      { art:['madinah','day'],
        items:[
          { cap:'**ʿAmmār ibn Yāsir** carried two bricks at a time, every trip, and would not stop.' },
          { say:'Others carry one and I carry two, so I get double —', who:'ʿAmmār', r:true }
        ]},
      { art:['madinah','dusk'],
        items:[
          { cap:'Walls of mud brick. Pillars of palm trunk. A roof of palm leaves that let the rain through.' },
          { cap:'That building is the reason there is a masjid in your town.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['market','day'], cls:'hero span',
        items:[
          { cap:'Then he paired them: each man from Makkah with a man of Madīnah, as brothers. **ʿAbd ar-Raḥmān ibn ʿAwf** — who had left a fortune behind — was paired with **Saʿd ibn ar-Rabīʿ**, one of the richest men in the city.' },
          { say:'I have the most wealth of any man in Madīnah. I will split it in two, and half of it is yours. Take it.', who:'Saʿd', r:true }
        ]},
      { art:['market','sand'], cls:'short',
        items:[
          { say:'May Allah bless you in your family and your wealth. Just show me the way to the market.', who:'ʿAbd ar-Raḥmān' },
          { cap:'He went and started trading cheese and butter. Before long he was one of the richest men in Madīnah again — on his own.' }
        ]}
    ]},

    { t:'prose', kicker:'One City, Many Peoples', h:'The Charter',
      body:[
        'Madīnah was not one people. There were the **Muhājirūn** from Makkah with nothing, the **Anṣār** of Aws and Khazraj who had been at war with each other for years, several **Jewish tribes**, and plenty of people who had not accepted Islam at all.',
        'So he wrote it down.',
        'The document people call the **Charter of Madīnah** said that the believers were one community who looked after each other, paid debts and ransoms together, and never sheltered a criminal — not even one of their own.',
        'And it said that the Jewish tribes kept their own religion, their own money and their own affairs, and were to be treated fairly; that they and the Muslims would help defend the city together; and that neither side would be wronged for being what they were.',
        'It is one of the oldest written constitutions anyone has found.',
        'And the two tribes who had been killing each other within living memory were now praying in the same row, shoulder to shoulder, with nothing between them.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['madinah','dusk'], cls:'tall',
        items:[
          { cap:'The masjid was built, and nobody knew how to call people to it.' },
          { say:'A bell, like the Christians?', r:true },
          { say:'A horn, like the Jews? A fire on a hill?', r:true }
        ]},
      { art:['nightsky','deep'],
        items:[
          { cap:'Then **ʿAbdullāh ibn Zayd** had a dream, and a man in it taught him some words.', night:true },
          { say:'It is a true dream, in shāʾ Allāh. Teach it to **Bilāl** — his voice is stronger than yours.', who:'The Prophet ﷺ' }
        ]},
      { art:['madinah','dawn'],
        sfx:[{w:'ALLĀHU AKBAR', c:'big gold', x:'8%', y:'14%', rot:-7}],
        items:[
          { cap:'And the voice that had once said nothing but *Aḥad, Aḥad* on the burning sand of Makkah climbed up over Madīnah and called the first adhān.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'He paid the orphans', v:'They offered the land free. He insisted on a price. **Orphans’ property is not a gift anyone gets to accept.**' },
        { k:'ʿAbd ar-Raḥmān took nothing', v:'Offered half a fortune, he asked for directions to the market. Dignity is being able to say no to a kind offer.' },
        { k:'The adhān came from a dream', v:'And the man who dreamed it immediately handed it to someone else with a better voice. He never asked to call it himself.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        '“Just show me the market.” Why might someone turn down free money they genuinely need?',
        'Saʿd offered half of everything he owned to a man he had just met. Could you?',
        'Aws and Khazraj had been at war for years, and ended up in the same row. What actually makes old enemies stop?',
        'ʿAbdullāh ibn Zayd gave his dream away to Bilāl without being asked. When did you last let someone else do something you wanted to do?'
      ],
      ponder:'A community of refugees with nothing, and locals who had been at war with each other, built a city that worked — because they were paired off one by one and told: **this one is now your brother.**' },

    { t:'draw', h:'Two bricks',
      prompt:'Draw a line of people passing mud bricks hand to hand towards a half-built wall, seen from the side — and one person in the middle of the line carrying **two**. Everyone in silhouette. Make it obvious who ʿAmmār is without any label.',
      ghost:'one of them is carrying two',
      tips:[
        'A repeating rhythm of identical shapes makes the odd one out jump off the page.',
        'Tilt the line slightly uphill so the work looks like effort.',
        'Dust in the air, lit by low sun, turns a work scene into a beautiful one.'
      ],
      bank:['Masjid an-Nabawī','ʿAmmār','brotherhood','the Charter','adhān','Bilāl'] },

    { t:'cliff', eyebrow:'Sixteen months later, mid-prayer…',
      line:'A man walked past a masjid during ʿAṣr and called out one sentence — and the entire congregation turned around while still bowing.',
      next:'Chapter XXIV · The Turning' }
  ]
},

/* ========================= XXIV ========================= */
{
  title: 'The Turning',
  plate: 'gold',
  sub: 'A Persian boy who was passed between nineteen owners, a scholar who knew the answer before he asked, and a whole congregation turning around mid-rukūʿ.',
  pages: [
    { t:'splash', art:['madinah','dawn'],
      h:'“That is not the face of a liar”',
      p:'**ʿAbdullāh ibn Salām** was one of the most learned Jewish scholars in Madīnah. He went out with the crowds to see what had arrived. The first words he heard were these.' },

    { t:'comic', layout:'trio', panels:[
      { art:['madinah','day'], cls:'tall',
        items:[
          { say:'O people — spread peace, feed others, keep good ties with your relatives, and pray at night while people are sleeping. You will enter Paradise in peace.', who:'The Prophet ﷺ' },
          { say:'When I looked at his face, I knew it was not the face of a liar.', who:'ʿAbdullāh ibn Salām', r:true }
        ]},
      { art:['city','sand'],
        items:[
          { cap:'He asked three questions only a prophet could answer. He got three answers. He became Muslim on the spot — and then asked for one favour.' },
          { say:'Ask my people about me **before** you tell them. They will slander me if they know first.', who:'ʿAbdullāh ibn Salām' }
        ]},
      { art:['city','dusk'],
        items:[
          { say:'What kind of man is ʿAbdullāh ibn Salām among you?', who:'The Prophet ﷺ' },
          { say:'Our best, and the son of our best. Our most learned, and the son of our most learned.', r:true },
          { say:'And if he became Muslim?', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'prose', kicker:'Salmān’s Long Search', h:'From the fire-temple to the palm trees',
      body:[
        '**Salmān** grew up in Persia, the son of a rich landowner, and his job was to keep the sacred fire of his people burning so it never went out.',
        'One day he passed a church, and stopped, and liked the way they prayed. His father chained him up at home. He escaped, and went north to Shām.',
        'There he served one wise monk after another. Each time one died, he asked: *who should I go to now?* And was sent on.',
        'The last of them, dying, told him something different: *“A prophet is about to appear with the religion of Ibrāhīm. He will go to a land of date palms between two fields of black stone. He will not eat charity but he will accept a gift. And between his shoulders is the seal of prophethood.”*',
        'Salmān paid a caravan of Arabs to take him towards Arabia. On the road they sold him as a **slave**.',
        'He was passed from owner to owner — and ended up, by Allah’s arrangement, working in a palm garden in a town between two fields of black volcanic stone.',
        'When the Prophet ﷺ arrived in that town, Salmān brought food and offered it as **charity**. It was passed to the companions, untouched.',
        'The next day he brought food and said it was a **gift**. He ate from it.',
        'Then Salmān walked round behind him, and he understood what he was doing, and let the cloak fall from his shoulder.',
        'And Salmān saw the seal, and wept, and said it all out loud at last.'
      ] },

    { t:'comic', layout:'wide-duo', panels:[
      { art:['kaaba','sacred'], cls:'hero span',
        items:[
          { cap:'For sixteen or seventeen months they had prayed towards **Jerusalem**. But he loved the Kaʿbah, and used to turn his face up to the sky, hoping.', night:true },
          { say:'We have seen you turning your face about towards the heaven. So turn your face towards **al-Masjid al-Ḥarām**.', who:'Revealed' }
        ]},
      { art:['madinah','day'], cls:'short',
        sfx:[{w:'TURN!', c:'mid pink', x:'10%', y:'20%', rot:-9}],
        items:[
          { cap:'A man who had just prayed with the Prophet ﷺ passed another masjid during ʿAṣr and called the news in through the door. The whole congregation **swung round while still bowing**, and finished the prayer facing the other way.' }
        ]}
    ]},

    { t:'comic', layout:'trio', panels:[
      { art:['nightsky','deep'], cls:'tall',
        items:[
          { cap:'In the second year, something else arrived.', night:true },
          { say:'O you who believe — fasting has been prescribed for you, as it was prescribed for those before you, so that you may have **taqwā**.', who:'Revealed' }
        ]},
      { art:['madinah','dawn'],
        items:[
          { cap:'The first **Ramaḍān**. Up before dawn for suḥūr, nothing at all until sunset, and the whole city learning it together at the same time.' }
        ]},
      { art:['lantern','night'],
        items:[
          { say:'It is not only food and drink. Guard your tongue from lies and from hurting people.', who:'The Prophet ﷺ' },
          { cap:'He was the most generous of people — and in Ramaḍān he was more generous than a sent wind.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'Salmān searched for decades', v:'Persia to Shām to slavery in Arabia. He kept asking the same question his whole life and would not stop until he had the answer.' },
        { k:'The qiblah test', v:'Changing direction sorted out who was following the Messenger and who was just following a habit. Some people could not do it.' },
        { k:'“More generous than a sent wind”', v:'That is how his companions described him in Ramaḍān. A wind does not choose who it reaches.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Salmān was chained up, sold, and passed between owners — and still arrived exactly where he needed to be. What do you make of that?',
        'He distinguished charity from a gift. Why do you think that mattered so much to him?',
        'A whole masjid turned around mid-prayer on one person’s word. Could you change direction that fast if you learned you were wrong?',
        'Fasting is meant to guard the tongue as much as the stomach. Which of those two is harder for you?'
      ],
      ponder:'A Persian fire-keeper, a Jewish scholar, an Abyssinian who had been enslaved, and the sons of Makkan chiefs — all of them praying in the same row, in the same direction, at the same moment.' },

    { t:'draw', h:'Mid-prayer',
      prompt:'Draw a row of people in rukūʿ seen from behind — and the whole row caught **halfway through turning**, some already facing the new direction, some not yet. One ordinary moment, one city changing direction.',
      ghost:'halfway round',
      tips:[
        'Draw the same bent shape several times at slightly different angles. Repetition with variation reads as motion.',
        'Use one strong arrow of light across the floor to show the new direction.',
        'Keep everyone faceless and identical. This is about a whole group, not one person.'
      ],
      bank:['Salmān','the seal','qiblah','Kaʿbah','Ramaḍān','taqwā'] },

    { t:'cliff', eyebrow:'But not everyone in the city meant it…',
      line:'A crown had been made for a man in Madīnah, and the arrival of the Prophet ﷺ meant it was never worn. He never forgot it.',
      next:'Chapter XXV · Two Faces' }
  ]
},

/* ========================= XXV ========================= */
{
  title: 'Two Faces',
  plate: '',
  sub: 'Thirteen years of being told to be patient and not fight back. And then, at last, permission.',
  pages: [
    { t:'splash', art:['madinah','dusk'],
      h:'The crown that was never worn',
      p:'Before any of this, the people of Madīnah had been getting ready to make **ʿAbdullāh ibn Ubayy ibn Salūl** their king. The beads for his crown were already strung. Then the Prophet ﷺ arrived, the city turned, and the crown was never used.' },

    { t:'comic', layout:'trio', panels:[
      { art:['madinah','night'], cls:'tall',
        items:[
          { cap:'After the victory at Badr, when Islam was clearly here to stay, he announced that he was a Muslim too — and so did a group around him.', night:true },
          { cap:'They prayed in the masjid. They sat with the companions. And in private they looked for ways to pull it apart.', night:true }
        ]},
      { art:['city','deep'],
        items:[
          { cap:'The Qurʾān gave them a name: **al-munāfiqūn** — those who show one face and keep another.' }
        ]},
      { art:['madinah','night'],
        items:[
          { say:'If only a righteous man from my companions would guard me tonight.', who:'The Prophet ﷺ' },
          { cap:'Then the sound of weapons outside the tent.', night:true },
          { say:'Who is that?', who:'The Prophet ﷺ', r:true }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['tent','night'], cls:'hero span',
        items:[
          { say:'It is Saʿd ibn Abī Waqqāṣ. I came to guard you.', who:'Saʿd' },
          { cap:'And he slept. For a long time the companions took it in turns, night after night, so he could sleep.', night:true }
        ]},
      { art:['madinah','dawn'], cls:'short',
        items:[
          { say:'Allah will protect you from the people.', who:'Revealed' },
          { cap:'He put his head out of the tent and told them: *“Go home. Allah has protected me.”* And the night watch ended.' }
        ]}
    ]},

    { t:'prose', kicker:'At Last', h:'Permission',
      body:[
        'For thirteen years in Makkah they had been beaten, starved, dragged through streets and driven out of their homes — and every single time, the instruction had been the same: **be patient, do not fight back.**',
        'Even after the Hijrah, Quraysh would not leave it. They took over the houses and the property the Muhājirūn had abandoned. They sent threats north. They wrote to ʿAbdullāh ibn Ubayy telling him to fight the Muslims or be invaded.',
        'When **Saʿd ibn Muʿādh** went to Makkah to make ʿumrah, Abū Jahl stopped him at the Kaʿbah: *“Do I see you walking round Makkah in safety, when you have given shelter to the people who left our religion?”*',
        'And then it came down:',
        '*“Permission is given to those who are fought, because they have been wronged — and indeed Allah is able to give them victory.”*',
        'Thirteen years of being told to hold still. And now they could stand up.'
      ],
      ar:'أُذِنَ لِلَّذِينَ يُقَاتَلُونَ بِأَنَّهُمْ ظُلِمُوا',
      arT:'“Permission is given to those who are fought, because they have been wronged.” (Sūrah al-Ḥajj 22:39)' },

    { t:'comic', layout:'trio', panels:[
      { art:['road','sand'], cls:'tall',
        items:[
          { cap:'In Rajab he gave **ʿAbdullāh ibn Jaḥsh** a sealed letter and twelve men.' },
          { say:'Do not open it until you have travelled for two days.', who:'The Prophet ﷺ', r:true }
        ]},
      { art:['scroll','sand'],
        items:[
          { cap:'Two days out, he opened it. Go to **Nakhlah**, between Makkah and Ṭāʾif, watch for a caravan of Quraysh, and bring back news of what they are planning.' },
          { say:'Anyone who wants to turn back may turn back. I am going on.', who:'ʿAbdullāh ibn Jaḥsh' },
          { cap:'Not one of the twelve turned back.' }
        ]},
      { art:['desert','dusk'],
        items:[
          { cap:'At Nakhlah they met a small caravan on the last day of **Rajab** — one of the sacred months, when fighting was forbidden. They had to decide, with no time, whether it was still Rajab or already Shaʿbān.' },
          { cap:'They attacked. And Makkah had its scandal: *look what the Muslims do in a sacred month.*' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'Nakhlah was corrected', v:'The Prophet ﷺ did not approve of what they did, and the Qurʾān answered Makkah’s outrage directly: fighting in the sacred month is grave — **and driving people from their homes is graver.**' },
        { k:'The night watch ended with one verse', v:'They were doing something good and necessary, and were told to stop, because the protection they were providing was already provided.' },
        { k:'Hypocrisy got its own vocabulary', v:'The Qurʾān names it, describes it and warns about it — because the damage done from inside a community is harder to see than an enemy outside it.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'ʿAbdullāh ibn Ubayy lost a crown he had never worn, and resented it for the rest of his life. What does disappointment do to people?',
        'Thirteen years of being told not to fight back. Why might Allah have required that for so long first?',
        'The twelve men at Nakhlah got it wrong while trying to do right. How should we treat people who make a sincere mistake?',
        'Saʿd turned up to guard without being asked by name. What is one thing you could do this week without waiting to be asked?'
      ],
      ponder:'Patience came first and lasted thirteen years. By the time they were allowed to defend themselves, they had already proved they were not doing it out of temper.' },

    { t:'draw', h:'The sealed letter',
      prompt:'Draw a hand holding a folded, sealed letter at arm’s length in the desert, with a small group of riders waiting behind in silhouette. Two days of not knowing what is inside. Draw the **waiting**.',
      ghost:'not yet',
      tips:[
        'Put the letter dead centre and small. Everything else should be looking at it.',
        'Make the riders a loose cluster behind, all turned the same way.',
        'A hot flat sky with no clouds says “we have been out here a while”.'
      ],
      bank:['munāfiqūn','Saʿd','permission','sealed letter','Nakhlah','Rajab'] },

    { t:'cliff', eyebrow:'Ramaḍān, the second year…',
      line:'Three hundred and thirteen men set out after a caravan — and found an army of a thousand waiting instead.',
      next:'Chapter XXVI · Three Hundred' }
  ]
},

/* ========================= XXVI ========================= */
{
  title: 'Three Hundred',
  plate: 'light',
  sub: 'Two horses, seventy camels, and three men taking turns on each one — including him.',
  pages: [
    { t:'splash', art:['desert','sand'],
      h:'“You are not stronger than me”',
      p:'News came that a huge Quraysh caravan under **Abū Sufyān** was coming back from Shām. He set out with about **three hundred and thirteen** men, **two horses**, and **seventy camels** — so they rode in turns, three to a camel.' },

    { t:'comic', layout:'trio', panels:[
      { art:['road','sand'], cls:'tall',
        items:[
          { cap:'He was sharing a camel with ʿAlī and another man. When his turn to walk came round, they tried to stop him.' },
          { say:'Ride, Messenger of Allah. We will walk your share.', r:true },
          { say:'You are not stronger than me — and I am not less in need of the reward than you.', who:'The Prophet ﷺ' }
        ]},
      { art:['sea','day'],
        items:[
          { cap:'Abū Sufyān got the caravan away along the coast — and sent to Makkah for help anyway.' }
        ]},
      { art:['battlefield','sand'],
        sfx:[{w:'DRUMS', c:'mid pink', x:'58%', y:'16%', rot:-8}],
        items:[
          { cap:'A thousand men marched out of Makkah with singers and drums. The caravan was safe, and they came on anyway.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['well','dusk'], cls:'hero span',
        items:[
          { cap:'The night before, scouts caught some water-carriers of Quraysh near the wells, among them a boy. The Muslims **wanted** him to belong to the rich caravan.' },
          { say:'I carry water for the **army**. Abū Jahl is here. ʿUtbah is here. Umayyah is here.', who:'The boy', r:true },
          { cap:'They beat him for it. When he changed his story and said *“Abū Sufyān is nearby”*, they let him alone.' }
        ]},
      { art:['well','night'], cls:'short',
        items:[
          { cap:'He finished his prayer and came over.', night:true },
          { say:'By the One in whose hand my soul is — you beat him when he told you the **truth**, and left him alone when he **lied** to you.', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'prose', kicker:'The Night Before', h:'Rain, and sleep',
      body:[
        'They camped near the wells, tired and badly outnumbered — one of them for every three of the enemy. And that night two gifts came down.',
        'The first was **rain**. Gentle on their side: it washed them, gave them water, and packed the soft sand under their feet until it was firm enough to walk and fight on. On the enemy’s side of the valley, the same rain turned the ground to mud.',
        'The second was **sleep**. A deep, easy sleep came over men who had every reason to lie awake, and they woke rested.',
        '*“He covered you with sleep as security from Him, and sent down upon you rain from the sky, to purify you with it…”*',
        'And before the two lines met, he went into a small shelter of branches and faced the qiblah and raised his hands.',
        '*“O Allah, fulfil for me what You promised me. O Allah, give me what You promised me.*',
        '*O Allah — if this small band of the people of Islam is destroyed, You will not be worshipped on the earth.”*',
        'He kept calling on Allah with his hands up until his cloak slipped off his shoulders. **Abū Bakr** picked it up, put it back over him, took hold of him from behind and said:',
        '*“Enough, Messenger of Allah. Allah will do for you what He has promised you.”*'
      ] },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'He walked his turn', v:'The leader of the community took his share of walking in the desert because the reward is shared out by effort, and he wanted his.' },
        { k:'A prisoner of war, told he was right', v:'The boy was beaten by Muslims for telling the truth, and the Prophet ﷺ corrected **them**, not him.' },
        { k:'The same rain did two jobs', v:'Firm ground on one side of a valley, mud on the other. Nothing extra was created — the weather just arrived.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'They beat the boy for the truth and spared him for a lie, because the lie was what they wanted to hear. Do you ever do a smaller version of that?',
        'Abū Sufyān escaped with the caravan and Quraysh marched anyway. What does that tell you about what they actually wanted?',
        'Deep sleep on the worst night of their lives. What settles **your** mind when you are frightened?',
        '“If this small band is destroyed…” — he argued for them using Allah’s own promise. What do you say when you really need something?'
      ],
      ponder:'Three hundred and thirteen men, two horses, and a leader who insisted on walking his turn in the sand like everybody else.' },

    { t:'draw', h:'The shelter of branches',
      prompt:'Draw a small rough shelter of branches on a dark hillside, a faint glow inside it, and far below — two armies camped at a distance from each other, just dots of firelight. The smallest thing on the page is deciding the outcome.',
      ghost:'hands raised in the dark',
      tips:[
        'Zoom out far. Making the shelter tiny makes the duʿāʾ feel enormous.',
        'Two separate clusters of campfire dots, with real distance between them.',
        'Light rain, drawn as thin diagonal lines across everything, will tie the whole picture together.'
      ],
      bank:['Badr','three hundred','rain','sleep','duʿāʾ','Abū Bakr'] },

    { t:'cliff', eyebrow:'The seventeenth of Ramaḍān…',
      line:'Three champions stepped out of the Makkan line and called for someone to come and face them.',
      next:'Chapter XXVII · Badr' }
  ]
},

/* ========================= XXVII ========================= */
{
  title: 'Badr',
  plate: 'gold',
  sub: 'Two boys of the Anṣār, standing in the line, whispering to the man between them: “Uncle — which one is Abū Jahl?”',
  pages: [
    { t:'splash', art:['battlefield','blood'],
      h:'The seventeenth of Ramaḍān',
      p:'About three hundred against about a thousand. As the Arabs did, three champions stepped out of the Makkan line — **ʿUtbah**, his brother **Shaybah**, and his son **al-Walīd** — and called for opponents.' },

    { t:'comic', layout:'trio', panels:[
      { art:['battlefield','sand'], cls:'tall',
        items:[
          { cap:'Three young men of the Anṣār came forward. ʿUtbah refused them.' },
          { say:'We have nothing against you. We want men of our own standing, from our own people.', r:true },
          { say:'Stand up, Ḥamzah. Stand up, ʿAlī. Stand up, ʿUbaydah.', who:'The Prophet ﷺ' }
        ]},
      { art:['battlefield','blood'],
        sfx:[{w:'CLANG', c:'big pink', x:'40%', y:'18%', rot:-11}],
        items:[
          { cap:'Ḥamzah and ʿAlī finished theirs quickly, then turned back for ʿUbaydah, who had been badly wounded, and carried him out.' }
        ]},
      { art:['battlefield','storm'],
        items:[
          { cap:'Then the two lines came together, and Allah sent down angels to help the believers.' }
        ]}
    ]},

    { t:'prose', kicker:'Two Boys in the Row', h:'“Uncle — do you know Abū Jahl?”',
      body:[
        '**ʿAbd ar-Raḥmān ibn ʿAwf** was standing in the line and looked to his right and to his left, and on each side of him was a boy of the Anṣār, young enough that he wished he had grown men beside him instead.',
        'Then one of them nudged him and said quietly, so the other would not hear:',
        '*“Uncle — do you know Abū Jahl?”*',
        '*“I do, nephew. What do you want with him?”*',
        '*“I have been told he insults the Messenger of Allah ﷺ. By the One in whose hand is my soul, if I see him I will not leave him until one of us is dead.”*',
        'ʿAbd ar-Raḥmān was still taking this in when the **other** boy nudged him from the other side and asked him exactly the same question.',
        'Neither of them knew about the other.',
        'He pointed. *“That is him.”*',
        'And they went through that whole army like two falcons, and they reached him.',
        'Afterwards the Prophet ﷺ looked at both their swords and said: *“Both of you killed him.”*',
        'They were called **Muʿādh ibn ʿAmr** and **Muʿādh ibn ʿAfrāʾ**. Two boys, from a city that had only heard about Islam three years earlier.'
      ] },

    { t:'comic', layout:'wide-duo', panels:[
      { art:['battlefield','dusk'], cls:'hero span',
        items:[
          { cap:'By the end of the day seventy of the leaders of Quraysh were dead and about seventy were captives — including Abū Jahl, ʿUtbah, Shaybah and Umayyah ibn Khalaf, the man who had once laid Bilāl out on the burning sand.' }
        ]},
      { art:['madinah','night'], cls:'short',
        items:[
          { say:'Treat the captives well.', who:'The Prophet ﷺ' },
          { cap:'One of them said afterwards that the Muslims would give them the bread and eat only dates themselves, because of what they had been told.', night:true }
        ]}
    ]},

    { t:'comic', layout:'trio', panels:[
      { art:['scroll','sand'], cls:'tall',
        items:[
          { cap:'Some captives could not pay a ransom. So a price was set that had never been set before in Arabia:' },
          { say:'Teach ten children of Madīnah to read and write — and you go free.', who:'The Prophet ﷺ', r:true }
        ]},
      { art:['kaaba','dusk'],
        items:[
          { cap:'In Makkah, two men sat by the Kaʿbah talking bitterly. **Ṣafwān ibn Umayyah**, whose father died at Badr, and **ʿUmayr ibn Wahb**, whose son was a captive.' },
          { say:'If I had no debts and no family to feed, I would ride to Madīnah and kill him myself.', who:'ʿUmayr' },
          { say:'Your debts are mine. Your family are mine. Go.', who:'Ṣafwān', r:true }
        ]},
      { art:['madinah','day'],
        sfx:[{w:'!!', c:'mid pink', x:'70%', y:'18%', rot:10}],
        items:[
          { cap:'He poisoned his sword and rode north. ʿUmar saw him arrive armed and dragged him in by the collar.' },
          { say:'Let him go, ʿUmar. Come closer, ʿUmayr. What brings you?', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'prose', kicker:'The Thing Nobody Else Knew', h:'“Now tell me why you really came”',
      body:[
        '*“I came about my son. He is a captive here.”*',
        '*“Then why is there a poisoned sword on your shoulder?”*',
        '*“Swords have brought us nothing but trouble.”*',
        'And then he was told, quietly, what he and Ṣafwān had said to each other by the Kaʿbah — the words, the promise about the debts, the promise about the family. Word for word. With nobody else present.',
        'ʿUmayr stood there.',
        '*“I used to call you a liar when you brought us news from the heavens,”* he said. *“But there was nobody with us that day except me and Ṣafwān. By Allah, nobody could have told you this except Allah.”*',
        'And he became Muslim where he stood.',
        'The companions who had wanted to search him for weapons a minute earlier were delighted. The Prophet ﷺ told them: *“Teach your brother his religion, and recite the Qurʾān to him, and release his prisoner.”*',
        'Back in Makkah, Ṣafwān was telling everybody that good news was coming any day now, and that they should wait for it.',
        'Then a traveller arrived with the news that ʿUmayr had become Muslim.'
      ] },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'Reading as a ransom', v:'The first literacy programme in Islamic history was paid for by prisoners of war. **Teach ten children, and go home.**' },
        { k:'Badr is in the Qurʾān by name', v:'*“Allah had already given you victory at Badr, when you were weak.”* It is the day the Qurʾān calls **al-Furqān** — the day of distinguishing.' },
        { k:'Two of the youngest did the most', v:'The two Muʿādhs were boys standing in a row of grown men, and they had decided what they were going to do before the fighting started.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'The two boys each decided alone, and neither knew about the other. What would **you** be ready to stand up for before anyone asked you?',
        '“Treat the captives well” — about men who had tortured their friends days before. Why give that order?',
        'Teaching children to read bought a man his freedom. What does that tell you about what the community valued?',
        'ʿUmayr changed completely in one conversation. What does it take for someone to admit they were wrong that fast?'
      ],
      ponder:'They set out after a caravan and met an army, and a day that should have ended them became the day the whole of Arabia had to take them seriously.' },

    { t:'draw', h:'Two falcons',
      prompt:'Draw the two boys from behind — small, running into a wall of much larger shapes, with dust kicked up around their feet. Show only the backs of two young heads and a crowd of giants ahead of them.',
      ghost:'both of you killed him',
      tips:[
        'Make the enemy shapes genuinely much bigger. Exaggerate it. Comics do.',
        'Low angle, close to the ground, so we are running with them.',
        'Dust and motion lines going backwards past them will carry the speed.'
      ],
      bank:['Badr','al-Furqān','the two Muʿādhs','Abū Jahl','captives','ʿUmayr'] },

    { t:'cliff', eyebrow:'End of Book Three',
      line:'Makkah buried seventy of its chiefs and swore that next year it would come back with everything it had. It kept that promise.',
      next:'Book Four · The Mountain and the Trench' }
  ]
}

]};
