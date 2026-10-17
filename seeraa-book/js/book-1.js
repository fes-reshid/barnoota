/* Seeraa Quest — Book One: The Light Before Dawn
   Chapters I–IX  ·  Maps 1–9  ·  from the age of idols to the first revelation
   Source spine: Ar-Raheeq al-Makhtum (The Sealed Nectar) */
window.SEERAA_BOOK = {
  id: 1,
  title: 'The Light Before Dawn',
  range: 'Chapters I–IX',
  chapters: [

/* ========================= I ========================= */
{
  title: 'The Lost House',
  plate: '',
  sub: 'A house was built in an empty valley for one reason only. Then the people forgot the reason.',
  pages: [
    { t:'splash', art:['desert','dusk'],
      h:'A land with no king',
      p:'Seas on three sides. Black lava fields, golden dunes, and a few green places where water came out of the ground. No empire ruled the heart of it. In the middle of all that emptiness stood a dry valley called **Makkah** — no farms, no river — and yet people came to it from everywhere.' },

    { t:'comic', layout:'trio', panels:[
      { art:['caravan','sand'], cls:'tall',
        sfx:[{w:'hoof hoof', c:'sm gold', x:'60%', y:'16%', rot:-6}],
        items:[
          { cap:'For months of the year the Arabs moved with their camels, hunting grass and water.' },
          { say:'Keep them together! Water is three days ahead.', who:'A herdsman', r:true }
        ]},
      { art:['tent','night'],
        items:[
          { cap:'At night, a stranger could knock on any tent in Arabia.' },
          { say:'You are a guest. Eat first. We will ask your name after.', who:'The host' }
        ]},
      { art:['market','day'],
        items:[
          { cap:'And every person belonged to a tribe. The tribe was everything.' },
          { say:'My tribe — right or wrong!', kind:'shout', r:true }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['kaaba','sacred'], cls:'hero span',
        sfx:[{w:'wind', c:'sm', x:'8%', y:'12%', rot:-14}],
        items:[
          { cap:'Long before any of them were born, Ibrāhīm and his son Ismāʿīl had laid these stones.', night:true },
          { say:'Our Lord, accept this from us.', who:'Ibrāhīm', r:true }
        ]},
      { art:['market','dusk'], cls:'short',
        items:[
          { cap:'It was built for one reason: that people would worship **Allah alone**.' }
        ]}
    ]},

    { t:'comic', layout:'trio', panels:[
      { art:['road','dawn'], cls:'tall',
        items:[
          { cap:'Hundreds of years later a powerful chief, **ʿAmr ibn Luḥayy**, travelled north to Shām.' },
          { say:'What are those stones you bow to?', who:'ʿAmr' },
          { say:'Our gods. They bring us rain. They bring us victory.', r:true }
        ]},
      { art:['kaaba','dusk'],
        sfx:[{w:'THUD', c:'mid pink', x:'52%', y:'34%', rot:-9}],
        items:[
          { say:'Then I shall bring one home.', who:'ʿAmr', kind:'think' },
          { cap:'He set up an idol called **Hubal** beside the House of Allah.' }
        ]},
      { art:['desert','dusk'],
        items:[
          { cap:'Others followed. Al-Lāt in Ṭāʾif. Al-ʿUzzā near Nakhlah. Manāt by the coast.' },
          { say:'Three hundred and sixty of them. Around the House built for One.', kind:'think', r:true }
        ]}
    ]},

    { t:'prose', kicker:'The Age They Called Ignorance', h:'Al-Jāhiliyyah',
      body:[
        'They were not a small people. They were brave, and they kept their word, and a man would hand his last bowl of food to a stranger shivering at his door. They could hold a thousand lines of poetry in their heads without writing one of them down. Nobody owned them.',
        'And in the same streets, the strong took whatever they liked from the weak. Tribes fought wars that ran on for forty years because of one insult nobody could remember properly. Orphans were robbed of what their fathers left them. Widows were pushed aside.',
        'And when a baby girl was born, some fathers turned their faces away in shame — and a few, in that darkness, buried their daughters in the sand while they were still breathing.',
        'This is the world that was waiting. Not an empty world. A world with good in it and terrible wrong in it, all tangled together, waiting for someone to pull the two apart.'
      ],
      ar:'وَإِذَا الْمَوْءُودَةُ سُئِلَتْ ۝ بِأَيِّ ذَنبٍ قُتِلَتْ',
      arT:'“And when the baby girl buried alive is asked — for what sin was she killed?” (Sūrah at-Takwīr 81:8–9)' },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The direction never changed', v:'Every Muslim alive today still prays towards that same simple building in that same dry valley — the one Ibrāhīm and Ismāʿīl raised with their own hands.' },
        { k:'Idols arrived slowly', v:'Nobody woke up one morning and decided to abandon Allah. It took **hundreds of years** and started with one man liking something he saw on a journey.' },
        { k:'Islam did not erase them', v:'Their courage, their generosity, their loyalty — Islam kept all of it. What it removed was the injustice.' }
      ],
      after:'That is worth thinking about. The danger was never that the truth would be attacked all at once. The danger was that it would be **forgotten one small step at a time**.' },

    { t:'reflect', h:'Pause here',
      qs:[
        'ʿAmr ibn Luḥayy did not set out to ruin anything. He just liked what he saw. What is one small habit that could pull a person slowly away from what they know is right?',
        'The Arabs were generous to guests and cruel to orphans at the same time. How can someone be very good in one way and very wrong in another?',
        'The Kaʿbah was built for a reason, and the building stayed while the reason was forgotten. Can you think of something people still do today, without remembering why?',
        'If you had been standing in Makkah then, seeing three hundred and sixty idols around the House of Allah — what would you have wanted to say?'
      ],
      ponder:'A thing does not have to be destroyed to be lost. It only has to be misunderstood for long enough.' },

    { t:'draw', h:'The House, surrounded',
      prompt:'Draw the Kaʿbah standing in the valley at dusk — plain, square, patient — with the shapes of the idols crowded around it. Do not draw faces. Make the idols **shadows**, and make the House the one thing in your picture that still looks clean.',
      ghost:'the house in the valley',
      tips:[
        'Use only three colours. Flat, no shading — like the comic pages you just read.',
        'Put the light low and behind, so everything in front becomes a silhouette.',
        'Leave the Kaʿbah the simplest shape on the page. Simple reads as **true**.'
      ],
      bank:['valley','dusk','silhouette','three hundred and sixty','stone','forgotten'] },

    { t:'cliff', eyebrow:'Meanwhile, in that same city…',
      line:'A family was already living there. Feeding pilgrims. Digging a lost well. Making a promise that would nearly cost a boy his life.',
      next:'Chapter II · Roots' }
  ]
},

/* ========================= II ========================= */
{
  title: 'Roots',
  plate: 'light',
  sub: 'A name that meant “the one who crumbles bread”. A well that had vanished. And a promise that put a father’s favourite son on the edge of a knife.',
  pages: [
    { t:'splash', art:['city','dawn'],
      h:'The family at the heart of Makkah',
      p:'Muḥammad, son of ʿAbdullāh, son of ʿAbd al-Muṭṭalib, son of Hāshim, son of ʿAbd Manāf, son of Quṣayy — and back, and back, until the line reaches **Ismāʿīl**, the son of Ibrāhīm.' },

    { t:'comic', layout:'trio', panels:[
      { art:['market','sand'], cls:'tall',
        sfx:[{w:'crumble', c:'sm gold', x:'64%', y:'62%', rot:7}],
        items:[
          { cap:'Pilgrim season. Thousands of travellers, and not enough food to go round.' },
          { say:'Bring the bread. All of it. And the broth.', who:'ʿAmr' },
          { say:'There are too many, sir. The loaves will not reach.', r:true }
        ]},
      { art:['market','day'],
        items:[
          { say:'Then I will break every loaf with my own hands until they do.', who:'ʿAmr' }
        ]},
      { art:['city','dusk'],
        items:[
          { cap:'They stopped calling him ʿAmr. They called him **Hāshim** — the one who crumbles bread. The name outlived him by a thousand years.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['well','night'], cls:'hero span',
        sfx:[{w:'DIG', c:'mid pink', x:'22%', y:'24%', rot:-11}],
        items:[
          { cap:'Years later. ʿAbd al-Muṭṭalib wakes from a dream with one instruction: **dig, here**.', night:true },
          { say:'Father, there is nothing here but stone.', r:true },
          { say:'Keep digging.', who:'ʿAbd al-Muṭṭalib' }
        ]},
      { art:['well','sacred'], cls:'short',
        sfx:[{w:'gush', c:'sm', x:'46%', y:'20%', rot:-4}],
        items:[
          { cap:'Swords. Armour. Two deer made of gold. And under all of it — water. **Zamzam**, lost for generations, running again.' }
        ]}
    ]},

    { t:'prose', kicker:'The Promise', h:'A hundred camels',
      body:[
        'While he was digging, ʿAbd al-Muṭṭalib had made a vow. If Allah gave him ten sons who grew to be men, he would sacrifice one of them at the Kaʿbah.',
        'Allah gave him ten sons. And ʿAbd al-Muṭṭalib was not a man who broke his word.',
        'They drew lots. The name that came out was ʿAbdullāh — the youngest, the gentlest, the one he loved best. Quraysh crowded round him. His brothers begged. Abū Ṭālib put himself in the way.',
        'So they drew again — ʿAbdullāh against ten camels. The lot fell on the boy. Twenty camels. The boy. Thirty. The boy. They kept adding, and the lot kept falling on the boy, until the number reached **one hundred camels** — and at last the lot fell on the camels.',
        'A hundred were slaughtered that day, and the meat was left for anyone who wanted it, people and wild animals alike. Nobody was turned away.',
        'ʿAbdullāh lived. He married Āminah. And he died before his son was born.'
      ] },

    { t:'fact', h:'Small things worth noticing',
      facts:[
        { k:'A nickname became a nation', v:'Because one man refused to let pilgrims go hungry, his descendants were called **Banū Hāshim** — the family of the bread-crumbler — ever after.' },
        { k:'Zamzam was not new', v:'It had gushed for baby Ismāʿīl and his mother Hājar long before. It was buried, forgotten, and then given back. Allah can return a blessing that everyone had given up on.' },
        { k:'The gold went back', v:'The gold from the swords and the two deer was not kept. It was beaten into the **door of the Kaʿbah**.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Hāshim could have fed the pilgrims and said nothing. Why do you think people remembered **how** he did it more than **what** he did?',
        'ʿAbd al-Muṭṭalib kept digging when his own son said there was nothing there. When is it right to keep going, and when is it just stubbornness?',
        'A hundred camels for one boy. What does that tell you about how much ʿAbdullāh was loved?',
        'Zamzam was buried on purpose by people who wanted it gone. It came back anyway. Is there anything in your own life you thought was lost for good?'
      ],
      ponder:'He was born into a family famous for feeding strangers and rescuing what was buried. Neither of those was an accident.' },

    { t:'draw', h:'The night they found the water',
      prompt:'Draw the moment the water breaks through — ʿAbd al-Muṭṭalib and his son standing over a dark hole in the ground with light coming **up** out of it instead of down from the sky. Faces in shadow or turned away.',
      ghost:'light from under the ground',
      tips:[
        'Flip the light source. Almost every picture lights from above — light this one from **below**.',
        'Keep the two figures as plain dark shapes. The light is the character here.',
        'Add one small detail that tells the story: the handle of a buried sword, half out of the sand.'
      ],
      bank:['Zamzam','shovel','gold deer','night','gush','a hundred camels'] },

    { t:'cliff', eyebrow:'That same year…',
      line:'A king in the south looked at the crowds walking north to a house he did not own — and decided to pull it down.',
      next:'Chapter III · The Elephant' }
  ]
},

/* ========================= III ========================= */
{
  title: 'The Elephant',
  plate: 'gold',
  sub: 'Sixty thousand soldiers. One enormous elephant. And a city that did not even try to fight.',
  pages: [
    { t:'splash', art:['elephant','dusk'],
      h:'“I will give them something greater”',
      p:'In Yemen ruled a governor named **Abrahah**. Every year he watched the Arabs stream north past his door towards a plain stone cube in a dry valley, and every year it ate at him.' },

    { t:'comic', layout:'trio', panels:[
      { art:['city','day'], cls:'tall',
        items:[
          { cap:'He built a vast church in Ṣanʿāʾ. Marble. Gold. Nothing in Arabia came close to it.' },
          { say:'Now let them come **here**.', who:'Abrahah' },
          { say:'My lord… the pilgrim roads are as busy as ever. They still go north.', r:true }
        ]},
      { art:['city','night'],
        sfx:[{w:'creak', c:'sm pink', x:'70%', y:'22%', rot:9}],
        items:[
          { cap:'One night a man of Kinānah slipped into the great church and fouled its front wall.' }
        ]},
      { art:['storm','storm'],
        sfx:[{w:'RRROAR', c:'big pink', x:'12%', y:'26%', rot:-10}],
        items:[
          { say:'Then I will not leave one stone of that house standing on another!', kind:'shout' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['elephant','sand'], cls:'hero span',
        sfx:[{w:'BOOM  BOOM', c:'mid', x:'56%', y:'14%', rot:-5}],
        items:[
          { cap:'Sixty thousand men came north out of Yemen. At the front walked **Maḥmūd**, the greatest elephant anyone in Arabia had ever seen.' }
        ]},
      { art:['mountain','dusk'], cls:'short',
        items:[
          { cap:'Makkah had no army. Not one that could stand against this. So Quraysh climbed into the hills and watched from the peaks.' }
        ]}
    ]},

    { t:'comic', layout:'trio', panels:[
      { art:['desert','sand'], cls:'tall',
        items:[
          { cap:'Abrahah’s men had seized two hundred camels on the road. They belonged to ʿAbd al-Muṭṭalib. He walked into the enemy camp alone to ask for them back.' },
          { say:'I have come about my camels. Return them to me.', who:'ʿAbd al-Muṭṭalib' },
          { say:'Your camels? I have come to destroy the house your fathers built, and you speak to me of **camels**?', r:true }
        ]},
      { art:['kaaba','dusk'],
        items:[
          { say:'I am the owner of the camels. The House has a Lord who will protect it.', who:'ʿAbd al-Muṭṭalib' }
        ]},
      { art:['mountain','dusk'],
        sfx:[{w:'wind', c:'sm', x:'14%', y:'18%', rot:-12}],
        items:[
          { cap:'He took his camels. He went up into the hills with everyone else. And he waited.' }
        ]}
    ]},

    { t:'comic', layout:'trio', panels:[
      { art:['elephant','sand'], cls:'tall',
        sfx:[{w:'NNNGH', c:'mid gold', x:'58%', y:'58%', rot:6}],
        items:[
          { cap:'Morning. They turned Maḥmūd towards Makkah and ordered him forward.' },
          { say:'Move. MOVE!', kind:'shout', r:true },
          { cap:'The elephant knelt down in the sand and would not get up.' }
        ]},
      { art:['desert','sand'],
        items:[
          { cap:'They turned him south — he stood and walked briskly. North — the same. East — the same.' },
          { say:'Turn him back towards the House.', who:'A captain' }
        ]},
      { art:['elephant','dusk'],
        sfx:[{w:'THUMP', c:'mid pink', x:'30%', y:'30%', rot:-8}],
        items:[
          { cap:'Down he went again. Every single time.' }
        ]}
    ]},

    { t:'prose', kicker:'What Came Next', h:'Birds out of the sea',
      body:[
        'Then the sky over the valley changed.',
        'Flocks of small birds came in from the direction of the sea, flight after flight of them, each bird carrying stones — one in its beak, one in each claw, no bigger than a lentil.',
        'They dropped them on the army below. And that enormous force, with its sixty thousand men and its elephants and its marble church behind it, came apart in a single morning.',
        'Abrahah did not reach the Kaʿbah. He never came near it.',
        'The Arabs did not forget. They did not count years by numbers the way we do — they counted by events. And from that day on, when somebody wanted to say **when** something happened, they said: it was in the Year of the Elephant.',
        'A baby was born in Makkah that year.'
      ],
      ar:'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ',
      arT:'“Have you not seen how your Lord dealt with the companions of the elephant?” (Sūrah al-Fīl 105:1)' },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The whole sūrah is five verses', v:'Sūrah al-Fīl is one of the shortest in the Qurʾān — and many children learn it before they can read. Now you know what every line of it is about.' },
        { k:'The smallest possible army', v:'Not lightning. Not an earthquake. **Birds**, carrying pebbles. The point was not the weapon. The point was Who sent it.' },
        { k:'A calendar made of one day', v:'“The Year of the Elephant” became the fixed point Arabia dated everything from — the way we say a year number.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'ʿAbd al-Muṭṭalib asked about his camels and left the Kaʿbah to Allah. Was that giving up, or was it trust? What is the difference?',
        'Abrahah’s church was more beautiful than the Kaʿbah by far. Why did it not work?',
        'The elephant walked in every direction except one. What do you think that says about who creation really listens to?',
        'If you had been on the hilltop that morning, watching, what would you have been thinking before the birds came?'
      ],
      ponder:'The biggest army in Arabia was stopped by something you could hold in your hand. Size was never the thing that mattered.' },

    { t:'draw', h:'The elephant that knelt',
      prompt:'Draw Maḥmūd kneeling in the sand with the whole army behind him, and the small shape of the Kaʿbah far ahead. Show the moment **before** the birds — all that power, held still by nothing anyone can see.',
      ghost:'the one who would not walk',
      tips:[
        'Put the elephant large and low in the frame, and the Kaʿbah tiny on the horizon. The gap between them **is** the story.',
        'Draw the soldiers as a forest of spear-shapes rather than people.',
        'Leave the top third of the page almost empty. Something is about to come into it.'
      ],
      bank:['Maḥmūd','kneel','sixty thousand','pebble','ababīl','horizon'] },

    { t:'cliff', eyebrow:'Fifty days later, in the same city…',
      line:'A woman named Āminah gave birth to a boy. His father had already been dead for months.',
      next:'Chapter IV · The Orphan' }
  ]
},

/* ========================= IV ========================= */
{
  title: 'The Orphan',
  plate: '',
  sub: 'Every woman in Makkah was offered him. Every single one said no.',
  pages: [
    { t:'splash', art:['star','sacred'],
      h:'A duʿāʾ answered after two thousand years',
      p:'When Ibrāhīm and Ismāʿīl raised the walls of the Kaʿbah they prayed for one thing: *“Our Lord, send among them a messenger from themselves.”* Centuries went by. ʿĪsā told his people a messenger was coming whose name would be **Aḥmad**. And then, in the same valley, in the Year of the Elephant —' },

    { t:'comic', layout:'wide-duo', panels:[
      { art:['city','dawn'], cls:'hero span',
        sfx:[{w:'a child cries', c:'sm gold', x:'58%', y:'18%', rot:-6}],
        items:[
          { cap:'A boy was born to Āminah. His grandfather carried him to the Kaʿbah and named him **Muḥammad** — the praised one.' },
          { say:'Muḥammad? Nobody is called that.', r:true },
          { say:'I want him praised in the heavens and praised on the earth.', who:'ʿAbd al-Muṭṭalib' }
        ]},
      { art:['desert','dusk'], cls:'short',
        items:[
          { cap:'His father ʿAbdullāh had died before he was born. From his first breath, he was an orphan.' }
        ]}
    ]},

    { t:'comic', layout:'trio', panels:[
      { art:['road','sand'], cls:'tall',
        sfx:[{w:'clop… clop…', c:'sm', x:'62%', y:'70%', rot:4}],
        items:[
          { cap:'It was a year of drought. Women of Banū Saʿd rode into Makkah looking for babies to nurse — and for the payment a good family would give.' },
          { say:'This donkey will be the death of me. We are last again.', who:'Ḥalīmah' },
          { say:'And the camel has no milk. Our own son cried all night.', r:true }
        ]},
      { art:['market','sand'],
        items:[
          { cap:'Every woman was offered the same baby. Every one of them refused.' },
          { say:'An orphan? What can an orphan’s family pay?', r:true }
        ]},
      { art:['market','dusk'],
        items:[
          { cap:'By the end, Ḥalīmah was the only one who had found no child at all.' },
          { say:'I will not go home empty-handed. I will take the orphan.', who:'Ḥalīmah' }
        ]}
    ]},

    { t:'prose', kicker:'What Happened On The Way Home', h:'The donkey that overtook everyone',
      body:[
        'She lifted him up, and she said afterwards that everything changed from the moment she did.',
        'Her own baby, who had cried all night from hunger, fed and slept. The old she-camel that gave nothing gave milk that evening — enough for all of them.',
        'And the thin, slow donkey that had been trailing behind the whole caravan on the way in went home so fast on the way out that the other women called ahead to her: *Ḥalīmah — slow down! Is this the same animal you came on?*',
        'It was.',
        'For four years he stayed out in the open desert with Ḥalīmah’s family — clean air, clean Arabic, sheep to follow, a foster-sister called **ash-Shaymāʾ** who carried him about and sang to him.',
        'The women of Makkah had looked at a child with no father and seen nothing worth taking. Ḥalīmah took him because she had no other choice. She spent the rest of her life telling people it was the best thing that ever happened to her.'
      ] },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The name was unusual', v:'**Muḥammad** was a rare name in Arabia. His grandfather chose it on purpose, wanting him praised everywhere.' },
        { k:'Desert fostering was normal', v:'Makkan families sent babies to the open desert for clean air and pure Arabic. What was not normal was anyone taking a child who could not pay.' },
        { k:'Two thousand years is not long to Allah', v:'Ibrāhīm made that duʿāʾ standing on the very ground where it was answered. He never saw the answer. It came anyway.' }
      ],
      after:'When the Prophet ﷺ was later asked how his story began, he said: *“The duʿāʾ of my father Ibrāhīm, and the good news of ʿĪsā.”*' },

    { t:'reflect', h:'Pause here',
      qs:[
        'The other women were not cruel — they were poor, and they needed paying. Why was Ḥalīmah’s choice still different from theirs?',
        'Ḥalīmah took him because she had run out of options, not because she was being noble. Does that make what she did worth less, or not?',
        'Ibrāhīm made a duʿāʾ he never saw answered. Would you keep making a duʿāʾ you might not live to see answered?',
        'What is one thing you could do this week for someone who cannot pay you back in any way at all?'
      ],
      ponder:'Everyone in that market was looking for the child who would bring them something. The one they all walked past was the one who brought everything.' },

    { t:'draw', h:'Last in, first out',
      prompt:'Draw two pictures side by side on one page. **Left:** Ḥalīmah’s thin donkey trailing at the back of a long caravan, head down, dust everywhere. **Right:** the same donkey on the road home, out in front of them all. Change nothing except the speed.',
      ghost:'before  /  after',
      tips:[
        'Use the exact same colours in both halves so the only difference the eye catches is the movement.',
        'Lean everything forward in the second picture — even the dust.',
        'Draw a thin line down the middle to split them, like two comic panels.'
      ],
      bank:['Ḥalīmah','Banū Saʿd','drought','barakah','donkey','overtake'] },

    { t:'cliff', eyebrow:'Out in the desert, four years later…',
      line:'The children came running back to the tents white-faced, shouting that two men in white had taken their brother and opened his chest.',
      next:'Chapter V · The Shepherd' }
  ]
},

/* ========================= V ========================= */
{
  title: 'The Shepherd',
  plate: 'light',
  sub: 'By the time he was eight he had buried his mother and his grandfather. By the time he was ten he was working.',
  pages: [
    { t:'splash', art:['desert','day'],
      h:'“This was Shayṭān’s share of you”',
      p:'He was out with the other children when Jibrīl came. The angel opened his chest, took out his heart, removed a small dark part from it, washed it in a golden basin with **Zamzam water**, and put it back.' },

    { t:'comic', layout:'trio', panels:[
      { art:['tent','sand'], cls:'tall',
        sfx:[{w:'RUN!', c:'mid pink', x:'20%', y:'18%', rot:-13}],
        items:[
          { cap:'The other children sprinted back to the tents.' },
          { say:'Mother! Two men! They took him — they took him and they **opened** him!', kind:'shout' }
        ]},
      { art:['desert','day'],
        items:[
          { cap:'Ḥalīmah ran out and found him standing there. Pale. Completely unhurt.' },
          { say:'What happened to you, my son?', who:'Ḥalīmah', r:true }
        ]},
      { art:['desert','dawn'],
        items:[
          { cap:'Not long after, she took him back to Makkah, to his mother. She had kept him safe as long as she could.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['road','dusk'], cls:'hero span',
        sfx:[{w:'clop  clop', c:'sm', x:'66%', y:'76%', rot:3}],
        items:[
          { cap:'At six, Āminah took him north to **Yathrib** — to see the city where his father was buried, and the family of Banū an-Najjār.', night:true },
          { say:'That is where your father lies. Say salām to him.', who:'Āminah' }
        ]},
      { art:['desert','dusk'], cls:'short',
        items:[
          { cap:'They stayed about a month. On the road home, at a place called **al-Abwāʾ**, his mother fell ill and died. He was six years old, and he was standing beside the grave of the only parent he had ever known.' }
        ]}
    ]},

    { t:'prose', kicker:'Two More Losses', h:'Then his grandfather. Then his uncle.',
      body:[
        'Umm Ayman, the family’s servant who loved him dearly, brought him back to Makkah.',
        'His grandfather ʿAbd al-Muṭṭalib took him in and kept him close — closer than his own sons. He would have a rug spread in the shade of the Kaʿbah for himself alone, and the grown men of the family would not dare sit on it; and the small boy would walk over and sit down right in the middle of it, and his grandfather would not let anyone move him.',
        'Two years later, ʿAbd al-Muṭṭalib died too. The boy was eight.',
        'His uncle **Abū Ṭālib** took him then, and kept him, and protected him for forty years after that — through everything that was coming, right up to the edge of his own grave.',
        'And the boy, who had nothing of his own, went out onto the hills above Makkah and looked after other people’s sheep for a few qirāṭs, so as not to be a burden on a household that was already poor.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['mountain','day'], cls:'tall',
        items:[
          { cap:'Years later, grown men would ask him about it, half expecting him to be embarrassed.' },
          { say:'You? You herded sheep?', r:true },
          { say:'Yes. And there was never a prophet who did not herd sheep.', who:'The Prophet ﷺ' }
        ]},
      { art:['oasis','day'],
        items:[
          { cap:'Sheep scatter. Sheep wander off cliffs. Sheep cannot tell you what is wrong. You count them, and you go back for the one that is missing.' }
        ]},
      { art:['madinah','dusk'],
        items:[
          { cap:'He would need every bit of that. One day he would be responsible for a whole ummah — and he would go back for the missing one then, too.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'Mūsā, Dāwūd, and him', v:'Prophet Mūsā herded sheep for ten years. Prophet Dāwūd was a shepherd before he was a king. It is a pattern, not a coincidence.' },
        { k:'He never forgot al-Abwāʾ', v:'Many years later, as a Prophet, he passed his mother’s grave again — and he wept, and everyone around him wept with him.' },
        { k:'Forty years of protection', v:'Abū Ṭālib was not rich and had many children of his own. He took in his orphaned nephew anyway, and never once handed him over.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'He lost his father, his mother, and his grandfather before he was nine. Why do you think Allah chose that beginning for him?',
        'Looking after sheep was poor work, and he was not ashamed of it. What small or unglamorous job have you done that taught you something?',
        'A shepherd goes back for the one that wandered off, even when ninety-nine are safe. Who in your class or street is the one who gets left behind?',
        'Abū Ṭālib took in a child he did not have to take in. Who has done something like that for you?'
      ],
      ponder:'He was being taught to look after things that cannot look after themselves. He just did not know yet how many of them there would be.' },

    { t:'draw', h:'The hills above Makkah',
      prompt:'Draw a boy’s long shadow on a hillside at the end of the day, with sheep scattered around him and the city small in the valley below. Draw him **from behind**, or as a shadow only — never his face.',
      ghost:'from behind, looking down',
      tips:[
        'Low sun. Long shadows. That is what makes an evening picture feel like evening.',
        'Scatter the sheep unevenly — one or two far off on their own. Those are the interesting ones.',
        'Keep the city tiny. He is above it all, and alone, and that is the whole point.'
      ],
      bank:['qirāṭ','hillside','flock','Makkah below','long shadow','patience'] },

    { t:'cliff', eyebrow:'At twelve, on the road to Shām…',
      line:'A Christian monk who had never once come out to greet a caravan came out, looked at a boy, and took him by the hand.',
      next:'Chapter VI · Al-Amīn' }
  ]
},

/* ========================= VI ========================= */
{
  title: 'Al-Amīn',
  plate: 'gold',
  sub: 'A whole city full of people who agreed on almost nothing agreed on this one thing about him.',
  pages: [
    { t:'splash', art:['caravan','dusk'],
      h:'The monk at Buṣrā',
      p:'Caravans had passed Baḥīrā’s monastery for years and he had never once come out. This time he came out, and laid a meal, and invited them all in.' },

    { t:'comic', layout:'trio', panels:[
      { art:['road','sand'], cls:'tall',
        sfx:[{w:'shhh…', c:'sm gold', x:'66%', y:'20%', rot:-7}],
        items:[
          { cap:'He had watched the caravan come over the ridge — and watched a small cloud move with it, shading one traveller and no one else.' },
          { say:'Come down. All of you. Nobody stays with the camels today.', who:'Baḥīrā' }
        ]},
      { art:['tent','sand'],
        items:[
          { cap:'They came. He went along the line, looking at face after face, and found nothing.' },
          { say:'Is this everyone?', who:'Baḥīrā', r:true },
          { say:'All but the boy. We left him minding the baggage.' }
        ]},
      { art:['desert','dusk'],
        items:[
          { say:'Send for him.', who:'Baḥīrā' },
          { cap:'He took the boy by the hand. *“This is the master of the worlds. Allah will send him as a mercy to all people.”*' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['road','dusk'], cls:'span',
        items:[
          { say:'How can you possibly know that?', who:'Abū Ṭālib' },
          { say:'Because when you came over the hill, every stone and every tree went down in sujūd. They do that for no one but a prophet. Take him home. Guard him.', r:true }
        ]},
      { art:['mountain','night'], cls:'short',
        items:[
          { cap:'Abū Ṭālib turned the caravan round and took his nephew back to Makkah.', night:true }
        ]}
    ]},

    { t:'prose', kicker:'Growing Up Surrounded', h:'Twice, and only twice',
      body:[
        'Makkah was not a quiet place to be young in. There were idols on every corner, drinking, gambling, all-night parties, and nobody thought any of it was strange.',
        'He never bowed to an idol. Not once, in forty years. He disliked even hearing people swear by their names.',
        'He later told his companions that twice in his whole youth he felt the pull of it. Both times he asked another boy to watch his sheep and walked down into the town. Both times he got as far as the edge of a wedding party, sat down to listen to the music — and fell asleep where he sat. He woke with the sun already hot on his face, and the night long over.',
        'Twice. And after the second time, he said, he never went near it again.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['mountain','day'], cls:'tall',
        sfx:[{w:'I HAVE BEEN WRONGED!', c:'mid pink', x:'10%', y:'14%', rot:-9}],
        items:[
          { cap:'A trader from Yemen sold his goods to a powerful Makkan — **al-ʿĀṣ ibn Wāʾil** — who simply refused to pay.' },
          { say:'I asked every clan in this city for help. Not one of them would look at me!', kind:'shout', r:true }
        ]},
      { art:['city','day'],
        items:[
          { cap:'So he climbed a mountain at dawn and shouted his complaint over the rooftops as a poem, until the whole of Makkah had heard it.' }
        ]},
      { art:['market','dusk'],
        items:[
          { cap:'The chiefs met in the house of ʿAbdullāh ibn Judʿān and swore an oath: **whoever is wronged in Makkah, we stand with them — stranger or not, until their right is returned.**' },
          { say:'I was there when they swore it. I would not trade my place in it for a herd of red camels.', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'Ḥilf al-Fuḍūl', v:'The Pact of Fairness. Made before Islam, by men who were not Muslims — and the Prophet ﷺ still praised it years later. **Justice is justice, whoever does it.**' },
        { k:'The name people gave him', v:'**Al-Amīn** — the Trustworthy. Not a title he asked for. Makkah handed it to him, and used it even while they were fighting him.' },
        { k:'They trusted him with their valuables', v:'Right up to the night he left Makkah for good, people were still leaving their money with him for safekeeping — including people who wanted him dead.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'He went towards the party twice and was stopped both times. What stops **you** when you are about to do something you know is wrong?',
        'The man from Yemen was a stranger with no tribe and no power. Why did it matter so much that someone stood up for him?',
        'Al-Amīn was a name given by other people, not claimed. What do you think the people in your life would honestly name you after?',
        'His enemies still trusted him with their money. How is that even possible — and what does it cost to live like that?'
      ],
      ponder:'Before anyone believed a word he said, they already trusted him completely. The reputation came first. It had to.' },

    { t:'draw', h:'The voice from the mountain',
      prompt:'Draw a lone figure on a rock above the sleeping city at dawn, hands cupped round his mouth, and the sound going out over the rooftops. Show the **sound** — rings, lines, something travelling. Below, draw windows beginning to open.',
      ghost:'one voice over a sleeping city',
      tips:[
        'Draw the sound as ripples spreading, the way water does. Comics do this all the time.',
        'The figure should be tiny and the city huge. One small person, a whole city listening.',
        'Open three windows, not thirty. Three is enough to show it is working.'
      ],
      bank:['Ḥilf al-Fuḍūl','dawn','rooftops','a poem','justice','stranger'] },

    { t:'cliff', eyebrow:'A wealthy merchant had been hearing his name…',
      line:'She had turned down the most powerful men in Makkah. Then she sent her servant to watch how this one behaved when he thought nobody was looking.',
      next:'Chapter VII · The Caravan' }
  ]
},

/* ========================= VII ========================= */
{
  title: 'The Caravan',
  plate: '',
  sub: 'She did not ask what he owned. She asked what he was like on the road, when there was nobody to impress.',
  pages: [
    { t:'splash', art:['caravan','dawn'],
      h:'North to Shām, with somebody else’s money',
      p:'**Khadījah bint Khuwaylid** was one of the wealthiest traders in Makkah. She hired men to carry her goods north. She had heard about this one, and offered him more than she gave anybody else — and sent her servant **Maysarah** to travel beside him the whole way.' },

    { t:'comic', layout:'trio', panels:[
      { art:['market','sand'], cls:'tall',
        items:[
          { cap:'He weighed fairly. He told buyers exactly what was wrong with a thing before they asked.' },
          { say:'This one has a flaw along the seam. Look — here. I would not want you to find it at home.', who:'Al-Amīn' },
          { say:'You are losing money telling me that.', r:true }
        ]},
      { art:['market','day'],
        items:[
          { say:'I would rather lose the coin than lose your trust.', who:'Al-Amīn' },
          { cap:'Maysarah watched. Day after day. And wrote nothing down, because he did not need to.' }
        ]},
      { art:['caravan','dusk'],
        sfx:[{w:'home', c:'sm gold', x:'70%', y:'22%', rot:-5}],
        items:[
          { cap:'They came back to Makkah with more profit in her money than she had ever seen from a single journey.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['city','dusk'], cls:'hero span',
        items:[
          { say:'The profit is yours, and the account is complete. Count it.', who:'Al-Amīn' },
          { say:'Never mind the profit, Maysarah. Tell me what he was **like**.', who:'Khadījah', r:true },
          { say:'My lady — I travelled beside him for months. He did not lie once. Not once, about anything, to anyone.', r:true }
        ]},
      { art:['city','night'], cls:'short',
        items:[
          { cap:'Many important men had asked to marry Khadījah. She had said no to every one of them. That evening she sent her friend **Nafīsah** with a question.', night:true }
        ]}
    ]},

    { t:'prose', kicker:'The Marriage', h:'Twenty-five and forty',
      body:[
        'He agreed. His uncles went to speak to her uncle, as was proper. He gave twenty camels as her dowry.',
        'He was twenty-five. She was forty.',
        'For the twenty-five years that she lived, he married nobody else. Not one.',
        'And when the whole city turned against him, when his own tribe starved him in a valley, when he came down from a mountain shaking and frightened of what had just happened to him — it was Khadījah he went to, every single time. She believed him before anyone else on earth did.',
        'Years after she died, he would still talk about her so often that one of his other wives said, half in frustration, *“She was only an old woman, and Allah gave you better.”* And he answered: *“No. By Allah, He did not. She believed in me when the people rejected me. She trusted me when the people called me a liar.”*'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['city','day'], cls:'tall',
        items:[
          { cap:'There was a boy in that household called **Zayd ibn Ḥārithah** — taken far from his family and sold as a slave. He was set free, and loved so openly that Makkah started calling him *Zayd ibn Muḥammad*.' }
        ]},
      { art:['market','sand'],
        items:[
          { cap:'Then one day Zayd’s own family found him. His brother came to take him home.' },
          { say:'Here he is. Ask him. If he chooses you, take him — and I will not ask you for a single coin.', who:'Al-Amīn', r:true }
        ]},
      { art:['city','dusk'],
        sfx:[{w:'…', c:'sm', x:'72%', y:'18%', rot:0}],
        items:[
          { say:'Zayd. Your father. Your uncle. Your own home.', r:true },
          { say:'I am not choosing anyone over this man. I have seen something in him I will not leave.', who:'Zayd' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'She asked about character, not wealth', v:'Khadījah had money. What she did not have, and knew she needed, was somebody she could trust completely.' },
        { k:'Zayd chose a man over his own father', v:'His family had searched for him for years. He looked at them, and stayed. Nobody made him.' },
        { k:'Names matter', v:'Allah later revealed that adopted children must keep their real father’s name — so he became **Zayd ibn Ḥārithah** again. The love did not change. The name was put right.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'He pointed out the flaw in his own goods and lost money for it. When was the last time honesty cost you something?',
        'Maysarah’s report was about manners, not money. If someone travelled beside you for a month, what would they report?',
        'Zayd chose to stay. What must he have been shown, day after day, to make a choice like that?',
        'Khadījah believed him before anyone else did. Who believes **you** when nobody else does — and have you ever told them what it means?'
      ],
      ponder:'He was not chosen for what he owned, or how he looked, or who his family were. He was chosen because of how he behaved when he thought no one was watching.' },

    { t:'draw', h:'The report',
      prompt:'Draw Maysarah telling Khadījah what he saw — but draw it as **three small memory panels** floating above them: the scales weighed level, the flaw pointed out, the goods handed over complete. No faces needed. Just hands, scales, cloth, coins.',
      ghost:'three things he saw',
      tips:[
        'Memory panels work best with wavy edges or a different colour from the main scene.',
        'Hands tell stories brilliantly. A pair of hands holding scales says more than a whole face.',
        'Keep the main scene dark and the memory panels bright.'
      ],
      bank:['Maysarah','scales','Khadījah','Nafīsah','twenty camels','trust'] },

    { t:'cliff', eyebrow:'Then he turned thirty-five, and a flood came…',
      line:'The Kaʿbah had to be rebuilt. And when the time came to lift one black stone back into the wall, the chiefs of Makkah drew their swords over who would have the honour.',
      next:'Chapter VIII · The Cave' }
  ]
},

/* ========================= VIII ========================= */
{
  title: 'The Cave',
  plate: 'light',
  sub: 'Four or five days of argument, and swords nearly drawn. Then someone said: let the next man through the gate decide.',
  pages: [
    { t:'splash', art:['kaaba','dusk'],
      h:'Rebuilt with clean money only',
      p:'A flood tore through Makkah and damaged the old Kaʿbah. Quraysh agreed to rebuild it — and agreed on one condition that surprises people: **not one coin from anything earned dishonestly** would go into the walls.' },

    { t:'comic', layout:'trio', panels:[
      { art:['kaaba','sand'], cls:'tall',
        sfx:[{w:'SHHHK', c:'mid pink', x:'18%', y:'22%', rot:-11}],
        items:[
          { cap:'Each clan built its section. Then they reached the **Black Stone** — and everything stopped.' },
          { say:'My clan will lift it. We have the oldest claim!', kind:'shout' },
          { say:'We will dip our hands in blood before we let you!', r:true }
        ]},
      { art:['city','dusk'],
        items:[
          { cap:'Four days. Five. The building stood open and unfinished while the chiefs circled each other.' }
        ]},
      { art:['gate','dawn'],
        items:[
          { say:'Enough. Let the first man who walks in through that gate tomorrow morning settle it. Whoever Allah sends.', who:'Abū Umayyah' },
          { cap:'They agreed, and they waited, and at dawn a figure came through the gate.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['gate','dawn'], cls:'hero span',
        sfx:[{w:'AL-AMĪN!', c:'big gold', x:'14%', y:'16%', rot:-8}],
        items:[
          { say:'It is **Al-Amīn**! We accept him — all of us!', kind:'shout' },
          { cap:'He heard what the argument was. Then he asked for a cloak, and spread it flat on the ground.' }
        ]},
      { art:['kaaba','day'], cls:'short',
        items:[
          { say:'Lay the stone in the middle of it. Now — the head of each clan, take hold of an edge. Lift together.', who:'Al-Amīn' },
          { cap:'Every clan carried it. Nobody was shamed. He set it into the wall with his own hands.' }
        ]}
    ]},

    { t:'prose', kicker:'A Few Who Were Already Looking', h:'The ḥunafāʾ',
      body:[
        'Not everybody in Makkah was comfortable. A handful of men had quietly decided the idols were nonsense, and were searching for the religion of Ibrāhīm on their own, with nothing to go on.',
        'One was **Zayd ibn ʿAmr ibn Nufayl**. He would stand with his back against the Kaʿbah and say to the crowds: *“O Quraysh — not one of you is on the religion of Ibrāhīm except me.”*',
        'He refused to eat meat slaughtered for idols. *“Allah created the sheep,”* he said. *“Allah sent down the rain for it, and grew the grass out of the earth for it — and then you slaughter it for something other than Allah?”*',
        'He died before the message came. But he had got close enough, alone in the dark, to know which direction to face.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['nightsky','sacred'], cls:'tall',
        items:[
          { cap:'As he came near forty, something began to happen. ʿĀʾishah described it later:', night:true },
          { say:'The first thing that came to him was true dreams. He never saw a dream without it coming true — clear and bright, like the breaking of the dawn.', who:'ʿĀʾishah', r:true }
        ]},
      { art:['mountain','dusk'],
        items:[
          { cap:'Six months of that. And then Allah made him love to be alone.' }
        ]},
      { art:['cave','night'],
        sfx:[{w:'wind', c:'sm', x:'12%', y:'18%', rot:-15}],
        items:[
          { cap:'He would take barley and water and climb **Jabal an-Nūr** — the Mountain of Light — to a cave called **Ḥirāʾ**, about the length of four long steps, and stay there for nights on end.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The cave is tiny', v:'Ḥirāʾ is roughly four yards long. It is a hard climb up a steep mountain, and pilgrims still make it today. He went up carrying his own food.' },
        { k:'He shared it anyway', v:'Even up there, alone, he would invite travellers passing on the mountain to eat with him. The habit did not switch off.' },
        { k:'Clean money only', v:'Quraysh ran short of honest money and had to leave part of the Kaʿbah out — the **Ḥijr Ismāʿīl**, the curved low wall. It is still outside the building today.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'The cloak solution let every clan win. Think of an argument you have seen. What would a cloak have looked like in that situation?',
        'Quraysh worshipped idols — and still refused to build the House with dishonest money. What does that tell you about them?',
        'Zayd ibn ʿAmr stood against a whole city with no book, no prophet, and no friends. Where do you think that courage came from?',
        'He climbed a mountain to be alone and think. Where is **your** quiet place — and when did you last go there without a screen?'
      ],
      ponder:'He was thirty-nine years old, sitting in a cave the size of a small room, troubled by what his people had become. He did not know that the answer was already on its way up the mountain.' },

    { t:'draw', h:'The mouth of Ḥirāʾ',
      prompt:'Draw the inside of the cave looking **out** — a small dark opening with the whole valley of Makkah far below and the stars above. You are sitting where he sat. Draw what he could see. Leave the cave empty.',
      ghost:'looking out from inside',
      tips:[
        'Frame the whole picture with the black edge of the cave mouth. That one shape does all the work.',
        'Make the opening small. Small opening, huge world outside — that is the feeling.',
        'Keep the inside **completely** empty. Emptiness is the point of this page.'
      ],
      bank:['Ḥirāʾ','Jabal an-Nūr','Ramaḍān','barley','alone','forty'] },

    { t:'cliff', eyebrow:'One night in Ramaḍān…',
      line:'Something filled the entrance of the cave and said one word to him. A word he did not know how to obey.',
      next:'Chapter IX · Read!' }
  ]
},

/* ========================= IX ========================= */
{
  title: 'Read!',
  plate: 'gold',
  sub: 'He said he could not. It said it again. And again. And then the first words of the Qurʾān came down into a cave on a mountainside.',
  pages: [
    { t:'splash', art:['revelation','sacred'],
      h:'Iqraʾ',
      p:'Ramaḍān. The fortieth year of his life. Alone in Ḥirāʾ, as he had been for months — and then the cave was not empty any more.' },

    { t:'comic', layout:'stack', panels:[
      { art:['cave','deep'], cls:'hero',
        sfx:[{w:'IQRAʾ', c:'big gold', x:'8%', y:'10%', rot:-7}],
        items:[
          { say:'Read!', who:'Jibrīl', kind:'shout' },
          { say:'I am not one who reads.', who:'The Prophet ﷺ', r:true }
        ]},
      { art:['revelation','deep'], cls:'tall',
        sfx:[{w:'IQRAʾ', c:'mid gold', x:'62%', y:'14%', rot:9}],
        items:[
          { cap:'He was taken and pressed until he could not bear it, and then released.', night:true },
          { say:'Read!', who:'Jibrīl', kind:'shout' },
          { say:'I am not one who reads.', who:'The Prophet ﷺ', r:true }
        ]}
    ]},

    { t:'prose', kicker:'The First Revelation', h:'Five verses, and the world turned over',
      body:[
        'A third time. Pressed again, until his strength was gone. And then:'
      ],
      drop:false,
      ar:'ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ ۝ خَلَقَ ٱلْإِنسَـٰنَ مِنْ عَلَقٍ ۝ ٱقْرَأْ وَرَبُّكَ ٱلْأَكْرَمُ ۝ ٱلَّذِى عَلَّمَ بِٱلْقَلَمِ ۝ عَلَّمَ ٱلْإِنسَـٰنَ مَا لَمْ يَعْلَمْ',
      arT:'“Read, in the name of your Lord who created — created man from a clinging clot. Read, and your Lord is the Most Generous, who taught by the pen, taught man what he did not know.” (Sūrah al-ʿAlaq 96:1–5)' },

    { t:'comic', layout:'trio', panels:[
      { art:['mountain','night'], cls:'tall',
        sfx:[{w:'run', c:'sm pink', x:'20%', y:'20%', rot:-12}],
        items:[
          { cap:'He came down off that mountain in the dark with his heart hammering, and went straight home.', night:true },
          { say:'Cover me! **Cover me!**', who:'The Prophet ﷺ', kind:'shout' }
        ]},
      { art:['city','night'],
        items:[
          { cap:'Khadījah wrapped him in a cloak and sat with him until the shaking stopped. She did not ask a single question until he was ready.' },
          { say:'I was afraid for myself.', who:'The Prophet ﷺ', r:true }
        ]},
      { art:['hands','deep'],
        items:[
          { say:'Never. By Allah, Allah will never disgrace you.', who:'Khadījah' },
          { say:'You keep ties with your family. You carry those who are weak. You give to people who have nothing. You honour your guest. You stand by anyone struck by trouble.', who:'Khadījah' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['city','dusk'], cls:'span',
        items:[
          { cap:'She took him to her cousin **Waraqah ibn Nawfal** — old, blind, a Christian who had read the earlier scriptures and could write in Hebrew.' },
          { say:'Cousin. Listen to what your nephew is telling you.', who:'Khadījah' }
        ]},
      { art:['scroll','sand'], cls:'tall span',
        items:[
          { say:'This is the same angel that Allah sent down to Mūsā. I wish I were young. I wish I were alive on the day your people drive you out.', who:'Waraqah' },
          { say:'Drive me out? Will they really drive me out?', who:'The Prophet ﷺ', r:true },
          { say:'No man has ever brought what you bring without being made an enemy. If I live to see that day, I will stand with you with everything I have.', who:'Waraqah' }
        ]}
    ]},

    { t:'prose', kicker:'The Silence, and the Second Call', h:'“Arise and warn”',
      body:[
        'Then Jibrīl did not come. Not the next night, or the night after, or for some time after that.',
        'He waited. He went back up the mountain. He began to long for it the way you long for someone who has gone quiet on you — and the waiting was its own kind of hard.',
        'And then one day, walking, he heard a voice out of the sky. He looked up, and the same angel from Ḥirāʾ was there, seated on a throne between the sky and the earth, filling the whole horizon.',
        'He ran home. *“Cover me! Cover me!”* — and while he lay wrapped in the cloak, it came down:',
        '*“O you who are wrapped up — arise, and warn! And declare the greatness of your Lord. And purify your clothes. And keep away from idols.”*',
        'That was the end of being left alone with it.',
        'From that moment the revelation came steadily, and would keep coming for twenty-three years. And a man of forty, with no army, no money of his own, and no power in his city, stood up and walked out of his house to tell Makkah that everything it believed was wrong.'
      ] },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The first word was Read', v:'Not *fight*. Not *rule*. Not *build*. The first command of the Qurʾān to all of humanity was **Read** — and the second mentions **the pen**.' },
        { k:'Khadījah did not doubt him for a second', v:'She did not say “are you sure?” She listed his character back to him as evidence. She argued for him using his own life.' },
        { k:'Waraqah warned him on day one', v:'The very first expert to confirm the message also told him, immediately, that it would cost him his home. He knew the price from the beginning.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'He said “I am not one who reads” three times. What does that tell you about where the Qurʾān came from?',
        'Khadījah comforted him by naming the good he had done. Why is that kinder and stronger than just saying “don’t worry”?',
        'Waraqah said no one has ever brought this without being made an enemy. Why would **truth** make people angry?',
        'The first word was *Read*. What would you like to read better, or more, by the time you finish this series?'
      ],
      ponder:'Everything in this book has been the ground being prepared. The orphan, the shepherd, the honest trader, the man they called Trustworthy — all of it was for this one night. The next book is what he did with it.' },

    { t:'draw', h:'The night the words came down',
      prompt:'Draw the cave mouth from outside, far away, as one small bright point on a huge black mountain — and the whole sleeping city below with no idea what has just happened in it. Light in one window only: the house where he is going.',
      ghost:'one light on the mountain',
      tips:[
        'Make the mountain fill most of the page. Big dark shape, tiny light. That is the whole composition.',
        'Stars everywhere, but keep the sky darkest right around the cave so the eye goes there first.',
        'One lit window in the city below. The reader will find it, and it will mean something.'
      ],
      bank:['Ḥirāʾ','Iqraʾ','Jibrīl','al-ʿAlaq','cloak','Khadījah'] },

    { t:'cliff', eyebrow:'End of Book One',
      line:'He had the message. Now he had to carry it — into a city of three hundred and sixty idols, where his own family were the keepers of the keys.',
      next:'Book Two · The First to Believe' }
  ]
}

]};
