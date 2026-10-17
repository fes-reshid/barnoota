/* Seeraa Quest — Book Two: The Years of Fire
   Chapters X–XVIII  ·  Maps 10–18  ·  the first believers, and a city that turned on them */
window.SEERAA_BOOK = {
  id: 2,
  title: 'The Years of Fire',
  range: 'Chapters X–XVIII',
  chapters: [

/* ========================= X ========================= */
{
  title: 'The Forty',
  plate: '',
  sub: 'For three years nobody shouted anything. They just slipped away into the valleys to pray, one at a time, where no one could see.',
  pages: [
    { t:'splash', art:['mountain','dawn'],
      h:'Two rakʿahs in the morning, two in the evening',
      p:'Jibrīl taught him how to make **wuḍūʾ**, and the prayer began. The first people on earth to pray it beside him were his wife **Khadījah**, the freed boy **Zayd**, and his young cousin **ʿAlī** — who had lived in his house since he was small.' },

    { t:'comic', layout:'trio', panels:[
      { art:['mountain','day'], cls:'tall',
        items:[
          { cap:'They prayed up in the folds of the hills, out of sight of the city.' },
          { say:'What is this religion of yours, nephew?', who:'Abū Ṭālib' },
          { say:'It is the religion of Allah, of His angels, and of Ibrāhīm. He sent me to call people to it — and you have the best right to it, uncle.', r:true }
        ]},
      { art:['city','day'],
        items:[
          { say:'I cannot leave the religion of my fathers. But — carry on. By Allah, nobody will reach you while I am alive.', who:'Abū Ṭālib' }
        ]},
      { art:['market','sand'],
        items:[
          { cap:'And then it spread the quietest way there is: one friend at a time.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['market','day'], cls:'hero span',
        items:[
          { cap:'**Abū Bakr** was a merchant everybody liked to sit with. He knew every family in Arabia and never raised his voice.' },
          { say:'He says there is one God, and he is the Messenger of Allah.', r:true },
          { say:'Then it is true. Take me to him.', who:'Abū Bakr' }
        ]},
      { art:['city','dusk'], cls:'short',
        items:[
          { cap:'He did not ask for a single proof. He had known the man for forty years. That was his proof.' }
        ]}
    ]},

    { t:'prose', kicker:'One Man’s Friends', h:'Five of the ten',
      body:[
        'Abū Bakr went quietly to the people who trusted him, one by one, in their own houses.',
        'Through him came **ʿUthmān ibn ʿAffān**. And **az-Zubayr ibn al-ʿAwwām**. And **ʿAbd ar-Raḥmān ibn ʿAwf**. And **Saʿd ibn Abī Waqqāṣ**. And **Ṭalḥah ibn ʿUbaydillāh**.',
        'Five of the ten companions later given the good news of Paradise came to Islam through one man — and that man never once stood on a hill and shouted. He just talked to his friends.',
        'For about three years it went on like that. The sūrahs that came down in those years were short and beautiful, and they worked on the heart: remember Paradise, remember the Fire, clean out what is inside you.',
        'By the end of it there were more than forty of them, from families all over Quraysh, bound together like brothers and sisters — and the city still had very little idea.',
        'When it got dangerous, they met in the house of a young man called **al-Arqam**, on the hill of Ṣafā. It was a good house for it. Nobody would have guessed.'
      ] },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The first Muslim was a woman', v:'**Khadījah**. Before Abū Bakr, before ʿAlī, before anyone. She believed on the first night.' },
        { k:'The second was a child', v:'**ʿAlī** was around ten years old. He is counted among the very first people on earth to pray this prayer.' },
        { k:'Al-Arqam was young too', v:'He was about sixteen when he offered his house. Being young did not make him useless. It made him unsuspected.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Abū Bakr believed with no proof except the man’s character. Who do you trust that completely — and what did they do to earn it?',
        'He brought people to Islam by talking to his own friends. What is something good you could pass on that way, without any announcement?',
        'Al-Arqam gave up the safety of his own house. What is the most useful thing you own that someone else could use?',
        'Three years of quiet work before anything was said out loud. Why might the slow start have mattered?'
      ],
      ponder:'Forty people. No building, no money, no protection. Every single one of them brought in by somebody who already knew them.' },

    { t:'draw', h:'The house on Ṣafā',
      prompt:'Draw the house of al-Arqam from the outside at night — one ordinary door in an ordinary street, a thin line of warm light underneath it, and a figure arriving alone with a hood up. Nobody would look twice.',
      ghost:'one lit door',
      tips:[
        'Make everything else on the street completely dark. One strip of light is all you need.',
        'Keep the figure small and off to one side, mid-step, as if you caught them.',
        'The picture should feel like a **secret**, not like a scene.'
      ],
      bank:['al-Arqam','Ṣafā','in secret','forty','wuḍūʾ','two rakʿahs'] },

    { t:'cliff', eyebrow:'Then the order came…',
      line:'“And warn your nearest relatives.” The quiet years were over.',
      next:'Chapter XI · Ṣafā' }
  ]
},

/* ========================= XI ========================= */
{
  title: 'Ṣafā',
  plate: 'gold',
  sub: 'He asked them a question first. They answered it honestly — and then refused to accept what it meant.',
  pages: [
    { t:'splash', art:['city','dusk'],
      h:'Forty-five men, and an uncle who would not let him speak',
      p:'He gathered Banū Hāshim and Banū al-Muṭṭalib. Before he could start, **Abū Lahab** cut across him: *“Your people cannot stand against all the Arabs. I have never seen a man bring more harm on his own family than you!”* He said nothing at all that day. Then he invited them back.' },

    { t:'comic', layout:'trio', panels:[
      { art:['city','sand'], cls:'tall',
        items:[
          { cap:'The second time, he stood up.' },
          { say:'A guide never lies to his people. By Allah, besides whom there is no god — I am the Messenger of Allah to you, and to all people.', who:'The Prophet ﷺ' }
        ]},
      { art:['mountain','day'],
        sfx:[{w:'YĀ ṢABĀḤĀH!', c:'mid pink', x:'8%', y:'16%', rot:-10}],
        items:[
          { cap:'Then he climbed **Ṣafā** and called the clans by name, one after another, until the whole of Quraysh was standing below him.' }
        ]},
      { art:['market','day'],
        items:[
          { say:'If I told you horsemen were in the valley, about to attack you — would you believe me?', who:'The Prophet ﷺ' },
          { say:'Yes. We have never known you to tell a lie.', kind:'shout', r:true }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['city','blood'], cls:'hero span',
        sfx:[{w:'PERISH!', c:'big pink', x:'10%', y:'14%', rot:-9}],
        items:[
          { say:'Then I am a warner to you, before a severe punishment comes.', who:'The Prophet ﷺ' },
          { say:'May you perish for the rest of the day! Is **this** why you gathered us?', who:'Abū Lahab', kind:'shout', r:true }
        ]},
      { art:['scroll','sand'], cls:'short',
        items:[
          { cap:'Allah answered him in words that are still recited today: *“Perish the hands of Abū Lahab, and perish he.”* From that morning, the call was public — and so was the war against it.' }
        ]}
    ]},

    { t:'prose', kicker:'A Meeting Before Ḥajj', h:'What shall we tell the pilgrims?',
      body:[
        'Ḥajj was coming. Arabs from everywhere would pour into Makkah — and they might hear the Qurʾān for themselves.',
        'So the chiefs met at the house of **al-Walīd ibn al-Mughīrah**, an old and clever man, to agree on one story. One story, told by everyone, so it would stick.',
        '*“We will say he is a fortune-teller.”* — *“No. His words are nothing like a fortune-teller’s mumbling.”*',
        '*“Then we say he is mad.”* — *“He is not mad. We have seen madness. This is not it.”*',
        '*“A poet, then.”* — *“We know every kind of poetry there is. This is not poetry.”*',
        '*“A magician.”* — *“He does none of the things magicians do.”*',
        'And then al-Walīd said the thing none of them wanted said out loud: *“His speech is sweet. Its root is deep and its branches are heavy with fruit. Whatever you say about it, people will know you are lying.”*',
        'They went with **magician** in the end, because they had to say something.',
        'They had just spent an evening proving to each other that it was true, and then agreed on a lie anyway.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['city','dusk'], cls:'tall',
        items:[
          { cap:'The chiefs went to Abū Ṭālib again and again. The last time, they threatened the old man himself.' },
          { say:'Nephew… do not put on me a burden I cannot carry.', who:'Abū Ṭālib', r:true }
        ]},
      { art:['desert','dusk'],
        items:[
          { say:'Uncle — by Allah, if they put the sun in my right hand and the moon in my left to make me leave this, I would not leave it. Until Allah makes it succeed, or I die trying.', who:'The Prophet ﷺ' }
        ]},
      { art:['city','dawn'],
        items:[
          { cap:'He turned to walk away. His uncle called him back.' },
          { say:'Go, nephew. Say what you like. By Allah, I will never hand you over to them.', who:'Abū Ṭālib' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'They admitted it in private', v:'Al-Walīd’s meeting is one of the strongest things in the Seerah: his worst enemies examined the Qurʾān properly and could not find one honest thing to call it.' },
        { k:'“We have never known you to lie”', v:'A whole city said that out loud, in public, about the man they were about to spend thirteen years fighting.' },
        { k:'Abū Ṭālib never became Muslim', v:'He protected his nephew for forty years and died on the religion of his fathers. Love and guidance are not the same thing — and only Allah gives the second one.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'They agreed he had never lied, and then refused to believe him. What makes a person argue against something they know is true?',
        'Al-Walīd knew exactly what the Qurʾān was. What do you think stopped him?',
        '“The sun in my right hand and the moon in my left.” What is the biggest thing anyone could offer you to make you drop something you know is right?',
        'Abū Ṭālib chose to protect someone whose beliefs he did not share. What does that cost a person?'
      ],
      ponder:'The evidence was never the problem. Everyone in that room had the evidence. What they did not have was the willingness.' },

    { t:'draw', h:'The hill and the crowd',
      prompt:'Draw the view **from behind** the crowd at the foot of Ṣafā, looking up — a sea of heads and shoulders in silhouette, the rock of the hill above them, and nobody on it. Leave the top of the hill empty and lit.',
      ghost:'looking up from the crowd',
      tips:[
        'Pack the bottom third with overlapping dark shapes. Crowds are made of **overlap**, not detail.',
        'The empty lit space at the top is the loudest part of the picture. Trust it.',
        'One raised hand somewhere in the crowd will make the whole thing feel alive.'
      ],
      bank:['Ṣafā','Quraysh','warner','Abū Lahab','al-Walīd','a lie they agreed on'] },

    { t:'cliff', eyebrow:'And then it stopped being words…',
      line:'A man was laid on the burning sand with a stone on his chest, and told he could end it with one sentence.',
      next:'Chapter XII · One. One.' }
  ]
},

/* ========================= XII ========================= */
{
  title: 'One. One.',
  plate: 'light',
  sub: 'They wanted him to say two names. He had one word left in him, and he would not spend it on anything else.',
  pages: [
    { t:'splash', art:['desert','blood'],
      h:'Aḥad… Aḥad…',
      p:'**Bilāl ibn Rabāḥ** was enslaved in the house of Umayyah ibn Khalaf, one of the fiercest enemies Islam had. When Umayyah found out Bilāl had believed, he took him out into the midday sun.' },

    { t:'comic', layout:'trio', panels:[
      { art:['desert','blood'], cls:'tall',
        sfx:[{w:'AḤAD', c:'big gold', x:'54%', y:'16%', rot:-7}],
        items:[
          { cap:'A rope round his neck. Dragged through the streets by boys. Left without water. Laid on sand hot enough to burn, with a rock on his chest.' },
          { say:'Say their names! Say al-Lāt and al-ʿUzzā and I will let you up!', kind:'shout' }
        ]},
      { art:['desert','sand'],
        items:[
          { say:'Aḥad… Aḥad…', who:'Bilāl' },
          { cap:'**One. One.** It was the only word he had left, and he would not spend it on anything else.' }
        ]},
      { art:['market','dusk'],
        items:[
          { cap:'Abū Bakr passed by and could not walk on. He bought Bilāl, and he set him free.' },
          { say:'Take him. Whatever you want for him. Take it.', who:'Abū Bakr', r:true }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['desert','blood'], cls:'hero span',
        items:[
          { cap:'**Yāsir**, his wife **Sumayyah** and their son **ʿAmmār** were among the first Muslims — and they were poor, with no powerful tribe behind them. There was nobody to stop what was done to them.' },
          { say:'Be patient, family of Yāsir. Your meeting place is **Paradise**.', who:'The Prophet ﷺ', r:true }
        ]},
      { art:['desert','dusk'], cls:'short',
        items:[
          { cap:'Yāsir died of what was done to him. Sumayyah never gave up her faith, and Abū Jahl himself took her life — the first of this ummah to die for saying that Allah is One.' }
        ]}
    ]},

    { t:'comic', layout:'trio', panels:[
      { art:['kaaba','sand'], cls:'tall',
        items:[
          { cap:'**Khabbāb** the blacksmith had been made to lie on burning coals. One day he came to the Prophet ﷺ, resting in the shade of the Kaʿbah with his cloak folded under his head.' },
          { say:'Will you not ask Allah to help us? Will you not make duʿāʾ for us?', who:'Khabbāb', r:true }
        ]},
      { art:['kaaba','dusk'],
        items:[
          { cap:'He sat up. His face had gone red.' },
          { say:'Men before you were sawn in two and combed with iron down to the bone, and it did not turn them from their religion.', who:'The Prophet ﷺ' }
        ]},
      { art:['road','dawn'],
        items:[
          { say:'By Allah, Allah will complete this matter — until a rider can travel from Ṣanʿāʾ to Ḥaḍramawt fearing nobody but Allah. But you are being hasty.', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'prose', kicker:'In Front of Everyone', h:'What ʿAbdullāh ibn Masʿūd saw',
      body:[
        'He kept praying at the Kaʿbah where anyone could see him, which Quraysh could not stand.',
        'One day, while he was praying beside the House, Abū Jahl and his friends sat nearby and one of them said: *“Which of you will fetch the insides of that slaughtered camel and drop it on his back when he goes down in sujūd?”*',
        'The worst of them, **ʿUqbah ibn Abī Muʿayṭ**, went and got it. And when the Prophet ﷺ went down into sujūd, he dropped it between his shoulders.',
        'They laughed until they were falling against each other.',
        'He stayed in sujūd. He did not lift his head.',
        '**ʿAbdullāh ibn Masʿūd** was standing there watching, and said afterwards: *“I was looking on, and I could not do anything.”*',
        'Then a girl came running. His daughter **Fāṭimah** — still a child — pushed into the middle of those men, pulled the filth off her father’s back, and turned and told them exactly what she thought of them.',
        'Nobody laughed at her.'
      ] },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'Bilāl later called the adhān', v:'The man dragged through those streets stood on the roof of the Kaʿbah itself, years later, and called Makkah to prayer.' },
        { k:'Sumayyah is remembered by name', v:'An enslaved, elderly woman with no tribe and no power. Fourteen hundred years later the whole ummah still knows her name — and nobody remembers what her killer owned.' },
        { k:'The promise was kept exactly', v:'Khabbāb lived long enough to see Arabia safe, just as he had been told he would.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Bilāl could have said the words and said them without meaning it. Why do you think he would not, even for a moment?',
        '“You are being hasty.” Why is waiting sometimes harder than suffering?',
        'ʿAbdullāh ibn Masʿūd watched and could do nothing, and never forgot it. Have you ever seen something wrong and felt too small to stop it?',
        'Fāṭimah was a child and she went in anyway. Where does that kind of courage come from?'
      ],
      ponder:'None of them were rescued. They were promised Paradise, and told to be patient, and that was all. And they stayed.' },

    { t:'draw', h:'One word',
      prompt:'Draw Bilāl’s hand only — open on hot sand, fingers slack, nothing else around it — and one word written in the sky above in your biggest, boldest hand-lettering: **AḤAD**. No face. No crowd. Just a hand and a word.',
      ghost:'a hand, and one word',
      tips:[
        'Make the sand pale and bleached and the hand dark. Heat is **contrast**.',
        'Letter the word yourself, by hand, bigger than feels sensible. Then go bigger.',
        'Leave the rest of the page completely empty. The emptiness is the heat.'
      ],
      bank:['Aḥad','Bilāl','Sumayyah','Khabbāb','patience','One'] },

    { t:'cliff', eyebrow:'“Allah’s earth is spacious”…',
      line:'On a dark night in Rajab, sixteen people slipped out of Makkah towards the coast, where two boats happened to be sailing.',
      next:'Chapter XIII · The Just King' }
  ]
},

/* ========================= XIII ========================= */
{
  title: 'The Just King',
  plate: '',
  sub: 'Two clever men, a pile of gifts, and a king who insisted on hearing the other side first.',
  pages: [
    { t:'splash', art:['sea','sea'],
      h:'Across the Red Sea',
      p:'In the fifth year, Makkah had become too dangerous for the Muslims who had nobody to protect them. The Prophet ﷺ knew of a ruler in **Abyssinia** — the **Najāshī** — in whose land nobody was wronged. About twelve men and four women went, among them **ʿUthmān** and the Prophet’s daughter **Ruqayyah**.' },

    { t:'comic', layout:'trio', panels:[
      { art:['sea','night'], cls:'tall',
        sfx:[{w:'splash', c:'sm', x:'14%', y:'72%', rot:-6}],
        items:[
          { cap:'They reached the coast in the dark. Two boats happened to be leaving for Abyssinia that night.', night:true },
          { say:'Quraysh are behind us. How far behind?', r:true }
        ]},
      { art:['sea','dawn'],
        items:[
          { cap:'Quraysh rode down to the shore and arrived to find an empty beach and open water.' }
        ]},
      { art:['city','day'],
        items:[
          { cap:'So they tried something else. Two of the cleverest men in Makkah — **ʿAmr ibn al-ʿĀṣ** and **ʿAbdullāh ibn Abī Rabīʿah** — went after them, loaded with gifts.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['fort','sand'], cls:'hero span',
        items:[
          { cap:'They gave a present to every adviser at the court before they went anywhere near the king.' },
          { say:'Some foolish young people have abandoned our religion. When we ask the king for them, tell him to hand them over — **without listening to them**.', who:'ʿAmr' },
          { say:'Agreed.', r:true }
        ]},
      { art:['fort','day'], cls:'short',
        items:[
          { say:'Send them back with these two, O King.', r:true },
          { say:'No. Not until I have heard them myself. I will not judge people I have not listened to.', who:'The Najāshī' }
        ]}
    ]},

    { t:'prose', kicker:'Jaʿfar Speaks', h:'“We were a people of ignorance”',
      body:[
        'The Muslims were called in. The bishops sat round the king with their books open. The Muslims chose **Jaʿfar ibn Abī Ṭālib** to speak for them.',
        '*“What is this religion that has made you leave your people?”* asked the king.',
        'And Jaʿfar answered:',
        '*“O King — we were a people of ignorance. We worshipped idols. We ate dead animals. We did shameful things. We cut off our relatives and treated our neighbours badly, and the strong among us ate the weak.*',
        '*Then Allah sent us a messenger from among ourselves, whose family we know, and whose honesty and trustworthiness we know. He called us to worship Allah alone, to speak the truth, to keep what is entrusted to us, to be good to our relatives and our neighbours, and to stop every shameful thing.*',
        '*So we believed him. And for that, our people came after us.”*',
        'The king asked him to recite something of what had come from Allah. Jaʿfar recited the opening of **Sūrah Maryam**.',
        'The Najāshī wept until his beard was wet. His bishops wept until their books were wet.',
        '*“This and what ʿĪsā brought come out of the same lamp,”* he said. *“Go. You are safe in my land.”*'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['fort','dusk'], cls:'tall',
        items:[
          { cap:'ʿAmr was not finished. He came back the next day with a sharper knife.' },
          { say:'Ask them what they say about **ʿĪsā, son of Maryam**. They say something terrible about him.', who:'ʿAmr', r:true }
        ]},
      { art:['fort','sand'],
        items:[
          { cap:'The Muslims talked it over that night. The king was a Christian. The whole court was Christian. And they decided:' },
          { say:'We say what Allah has said. Whatever happens.', r:true }
        ]},
      { art:['fort','dawn'],
        sfx:[{w:'snap', c:'sm pink', x:'66%', y:'24%', rot:8}],
        items:[
          { say:'He is the servant of Allah, and His messenger, and His spirit, and His word, which He gave to Maryam the pure.', who:'Jaʿfar' },
          { cap:'The Najāshī bent down, picked a small stick off the ground, and held it up. *“By Allah, ʿĪsā is not more than what you have said — by the length of this stick.”*' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The first hijrah was to a Christian king', v:'Not to allies, not to relatives — to a just ruler of another religion. **Justice was the qualification.**' },
        { k:'They told the truth when a lie was safer', v:'One softer sentence about ʿĪsā and they would have been comfortable. They would not shade it by one word.' },
        { k:'The gifts went home with them', v:'ʿAmr and his companion had to carry their presents back to Makkah. The Najāshī returned every one.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        '“I will not judge people I have not listened to.” How often do people decide about someone before hearing them?',
        'Jaʿfar began by admitting what his own people used to be like. Why was starting there so powerful?',
        'They told the exact truth to a court that might have thrown them out for it. When is it hardest to be precise about what you believe?',
        'The Najāshī changed his mind in public, in front of advisers he had just paid attention to. What does that take?'
      ],
      ponder:'They did not win because they were clever. They won because the other side would not finish a sentence honestly, and they would.' },

    { t:'draw', h:'The stick',
      prompt:'Draw the king’s hand holding up one small stick — close, filling the frame — with the whole court blurred and silhouetted far behind. One tiny object, deciding everything.',
      ghost:'not longer than this',
      tips:[
        'Zoom in further than feels comfortable. Comics love a sudden close-up after a big scene.',
        'Keep the background to vague dark shapes so the eye has nowhere else to go.',
        'Put the light behind the hand so the stick has a glowing edge.'
      ],
      bank:['Najāshī','Jaʿfar','Sūrah Maryam','ʿĪsā','a stick','safety'] },

    { t:'cliff', eyebrow:'Back in Makkah, a hunter came home…',
      line:'He heard what had been done to his nephew that afternoon, and he walked straight to the Kaʿbah with his bow still in his hand.',
      next:'Chapter XIV · Two Swords' }
  ]
},

/* ========================= XIV ========================= */
{
  title: 'Two Swords',
  plate: 'gold',
  sub: 'One came in because he was angry. One came in with a sword, meaning to end it. Both of them stayed.',
  pages: [
    { t:'splash', art:['city','dusk'],
      h:'Ḥamzah comes back from hunting',
      p:'Abū Jahl had found the Prophet ﷺ sitting near Ṣafā and insulted him until he ran out of insults — and then picked up a stone and struck him on the head until it bled. He said nothing back. But a servant woman had seen all of it.' },

    { t:'comic', layout:'trio', panels:[
      { art:['city','dusk'], cls:'tall',
        items:[
          { cap:'That evening **Ḥamzah** came in from hunting, bow over his shoulder — one of the strongest men in Quraysh.' },
          { say:'Abū Jahl did what? To **him**? Where is he sitting?', who:'Ḥamzah', r:true }
        ]},
      { art:['kaaba','blood'],
        sfx:[{w:'CRACK', c:'big pink', x:'40%', y:'20%', rot:-11}],
        items:[
          { cap:'He walked to the Kaʿbah, where Abū Jahl sat among the chiefs, and struck him with the bow.' },
          { say:'You insult him? I am on his religion. I say what he says. Return it to me if you can!', who:'Ḥamzah', kind:'shout' }
        ]},
      { art:['city','night'],
        items:[
          { cap:'He had said it in temper. Afterwards he was troubled by that — so he went and asked, and this time he meant it. Quraysh understood what they had lost.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['city','blood'], cls:'hero span',
        sfx:[{w:'shhk', c:'mid pink', x:'12%', y:'16%', rot:-8}],
        items:[
          { cap:'**ʿUmar ibn al-Khaṭṭāb** set out one morning with his sword to end the whole thing.' },
          { say:'Before you do that — look at your own house. Your sister Fāṭimah and her husband have become Muslim.', r:true },
          { say:'**What?**', who:'ʿUmar', kind:'shout' }
        ]},
      { art:['city','sand'], cls:'short',
        items:[
          { cap:'Inside the house, Khabbāb was reciting Sūrah Ṭā-Hā to them. He heard ʿUmar coming and hid.' }
        ]}
    ]},

    { t:'prose', kicker:'In His Sister’s House', h:'“Give me that page”',
      body:[
        'He burst in and struck his sister’s husband. His sister came between them, and he struck her too, and her face bled.',
        'And she stood there with blood on her face and said: *“Yes. We are Muslims. We believe in Allah and His Messenger. Do what you like.”*',
        'Something went out of him then. He looked at his sister, and he was ashamed.',
        '*“Give me that page you were reading.”*',
        '*“You are unclean. Go and wash first.”*',
        'And **ʿUmar ibn al-Khaṭṭāb** — who had walked out of his house that morning to kill a man — got up and washed, and came back, and took the page, and read it.',
        'Then he went to find the Prophet ﷺ, with the sword still on him. The companions were afraid when they saw him at the door.',
        'He came in and said it, and Makkah heard them say **Allāhu akbar** from the house of al-Arqam so loudly that the whole city knew something had changed.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['city','day'], cls:'tall',
        items:[
          { cap:'The chiefs were worried now. **ʿUtbah ibn Rabīʿah** offered to go and settle it with an offer.' },
          { say:'If you want wealth, we will make you the richest of us. If you want honour, we will make you our leader. If you want to be king — we will make you king. And if this is an illness, we will pay for the best doctor in Arabia.', who:'ʿUtbah', r:true }
        ]},
      { art:['city','sand'],
        items:[
          { say:'Have you finished, Abū al-Walīd?', who:'The Prophet ﷺ' },
          { say:'I have finished.', r:true },
          { say:'Then listen to me.', who:'The Prophet ﷺ' }
        ]},
      { art:['revelation','sacred'],
        items:[
          { cap:'He recited **Sūrah Fuṣṣilat**. ʿUtbah went quiet, put his hands behind his back and leaned on them, and listened to the end — then got up and walked away without a word.' },
          { say:'By Allah, I have heard something I have never heard in my life. Leave the man alone.', who:'ʿUtbah' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['nightsky','deep'], cls:'hero span',
        sfx:[{w:'— — —', c:'mid gold', x:'44%', y:'18%', rot:0}],
        items:[
          { cap:'They kept demanding a sign. One clear night, under a full moon, they demanded it again.', night:true },
          { cap:'And the moon split in two — one half above the mountain, one half the other side of it, with Ḥirāʾ standing between them.', night:true },
          { say:'**Bear witness.**', who:'The Prophet ﷺ' }
        ]},
      { art:['city','night'], cls:'short',
        items:[
          { say:'Magic. He has bewitched us. Ask the travellers coming in — magic cannot reach **them**.', r:true },
          { cap:'The travellers came in and said they had seen it too.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'ʿUmar was brought in by a page', v:'Not a debate, not a miracle. A few lines of Sūrah Ṭā-Hā on a piece of paper, and his sister refusing to back down.' },
        { k:'ʿUtbah’s offer tells you the price', v:'Money, leadership, kingship, doctors — everything Makkah had. He turned down all of it and recited a sūrah instead.' },
        { k:'The moon split is in the Qurʾān', v:'Sūrah al-Qamar opens with it: *“The Hour has drawn near, and the moon has split.”*' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'ʿUmar’s sister stood her ground with blood on her face. Why did that reach him when nothing else had?',
        'He washed before touching the page — before he believed any of it. Why do you think he did that?',
        'They were shown exactly the sign they asked for, and called it magic. Would any sign have been enough for them?',
        'ʿUtbah heard the truth, told everyone to leave the man alone, and still did not accept it. Why is that so sad?'
      ],
      ponder:'They asked for a sign for years. They got one. And it changed nothing — because a sign cannot make a person willing.' },

    { t:'draw', h:'Two halves',
      prompt:'Draw the mountain of Ḥirāʾ as a black shape against a night sky, with the two halves of the moon on either side of it, and the rooftops of Makkah below — and three or four tiny figures on those roofs, pointing. Show the **pointing**, not the faces.',
      ghost:'one moon, two halves',
      tips:[
        'Put the two halves at slightly different heights. Perfect symmetry would look fake.',
        'Silver-white moon, deep blue-black sky, nothing else bright. Two colours only.',
        'The tiny pointing figures turn a picture of the sky into a picture of a **moment**.'
      ],
      bank:['Ḥamzah','ʿUmar','Ṭā-Hā','ʿUtbah','the moon','bear witness'] },

    { t:'cliff', eyebrow:'So they tried starvation…',
      line:'A paper was written and hung inside the Kaʿbah: do not buy from them, do not sell to them, do not speak to them — until they hand him over.',
      next:'Chapter XV · The Valley' }
  ]
},

/* ========================= XV ========================= */
{
  title: 'The Valley',
  plate: 'light',
  sub: 'Three years in a gap between two cliffs, eating leaves, with the sound of hungry children carrying out over the rocks.',
  pages: [
    { t:'splash', art:['valley','deep'],
      h:'The Shiʿb of Abū Ṭālib',
      p:'Nobody was to buy from Banū Hāshim or Banū al-Muṭṭalib. Nobody was to sell to them, marry into them, visit them, or speak to them. It was written down and hung **inside the Kaʿbah** — until they handed him over to be killed.' },

    { t:'comic', layout:'trio', panels:[
      { art:['valley','night'], cls:'tall',
        items:[
          { cap:'Abū Ṭālib led both families into a narrow valley at the edge of Makkah. They stayed there three years.', night:true },
          { say:'There is nothing left to boil.', r:true },
          { say:'Then we boil the leaves again.', r:true }
        ]},
      { art:['valley','dusk'],
        sfx:[{w:'crying', c:'sm pink', x:'58%', y:'20%', rot:-7}],
        items:[
          { cap:'They ate tree leaves, and the skins of animals. People outside the valley could hear the children.' }
        ]},
      { art:['city','night'],
        items:[
          { cap:'And some of those people were not Muslims, and could not sleep.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['road','night'], cls:'hero span',
        sfx:[{w:'ssh!', c:'sm pink', x:'70%', y:'18%', rot:9}],
        items:[
          { cap:'**Ḥakīm ibn Ḥizām**, Khadījah’s nephew, took wheat to his aunt in the dark — and Abū Jahl caught him at the mouth of the valley.', night:true },
          { say:'Taking food to Banū Hāshim? I will shame you in front of all Makkah —', who:'Abū Jahl', r:true },
          { say:'Leave him. It is his own aunt and his own money. Let him pass.', who:'Abū al-Bakhtarī' }
        ]},
      { art:['valley','night'], cls:'short',
        items:[
          { cap:'**Hishām ibn ʿAmr** used to load a camel at night, bring it to the edge of the valley, slap it and send it in alone. Then walk home.', night:true }
        ]}
    ]},

    { t:'prose', kicker:'How It Ended', h:'The termites',
      body:[
        'In the end a few men in Makkah decided they had had enough of it.',
        'Hishām ibn ʿAmr went to **Zuhayr ibn Abī Umayyah**: *“Are you happy to eat what you like and wear what you like while your own relatives are dying up there?”* Together they brought in **al-Muṭʿim ibn ʿAdī**, Abū al-Bakhtarī and Zamʿah ibn al-Aswad.',
        'Next morning at the Kaʿbah, Zuhayr stood up in front of everyone: *“O people of Makkah — shall we eat and drink while Banū Hāshim are dying? By Allah, I am not sitting down until this unjust paper is torn to pieces.”*',
        'And at that moment Abū Ṭālib arrived with the strangest news anybody had brought to that square.',
        '*“My nephew says Allah has sent termites to your paper. They have eaten every word of it — except the name of Allah.”*',
        '*“If he is lying, we hand him over. If he is telling the truth, you end this.”*',
        'They went and took the paper down out of the Kaʿbah.',
        'It had been eaten away to nothing. The only words left on it were the name of Allah.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['city','dusk'], cls:'tall',
        items:[
          { cap:'Six months after the valley opened, Abū Ṭālib fell ill. Forty years of protection were ending.' },
          { say:'Uncle — say **Lā ilāha illā Allāh**. One sentence, and I will plead for you with it before Allah.', who:'The Prophet ﷺ', r:true }
        ]},
      { art:['city','night'],
        items:[
          { say:'Are you turning away from the religion of your father, Abū Ṭālib?', who:'Abū Jahl' },
          { cap:'He died on the religion of his fathers, with his nephew beside him.' }
        ]},
      { art:['city','blood'],
        items:[
          { cap:'Two months later, **Khadījah** passed away. Twenty-five years. The first person on earth to believe him.' },
          { say:'She believed in me when nobody else did.', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'They called it ʿĀm al-Ḥuzn', v:'**The Year of Sorrow** — the year he lost his protector and his wife within a few weeks of each other.' },
        { k:'The men who broke the boycott were not Muslims', v:'Hishām, Zuhayr, al-Muṭʿim, Abū al-Bakhtarī, Zamʿah. They did it because it was wrong, and that was reason enough.' },
        { k:'Only one name survived', v:'Every term of that cruel document was eaten away. The name of Allah was the only thing the termites left.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Hishām sent food in by camel at night and told nobody. Why might someone do good and hide it?',
        'Zuhayr stood up in front of the whole of Makkah. What makes one person finally say “enough” when everyone else stays quiet?',
        'Abū Ṭālib protected him for forty years and still did not believe. What does this tell you about who gives guidance?',
        'Losing two people in one year nearly broke him, and he kept going. Who do you lean on — and have you told them?'
      ],
      ponder:'Three years of hunger did not end because the Muslims won an argument. It ended because a handful of people who disagreed with them could not live with what was being done.' },

    { t:'draw', h:'The camel that went in alone',
      prompt:'Draw a loaded camel walking into the dark mouth of the valley by itself at night, and a man’s back already turning away down the road. He never sees it arrive. He never gets thanked.',
      ghost:'nobody sees this',
      tips:[
        'Two shapes going in opposite directions — that tension is the whole picture.',
        'Light the valley mouth faintly from inside so we know someone is in there.',
        'Do not show his face. A back says more here than a face would.'
      ],
      bank:['Shiʿb','boycott','termites','Hishām','Year of Sorrow','leaves'] },

    { t:'cliff', eyebrow:'With no protector left, he walked sixty kilometres…',
      line:'He went to Ṭāʾif to ask them to listen. They lined the road and threw stones until blood ran into his sandals.',
      next:'Chapter XVI · Stones' }
  ]
},

/* ========================= XVI ========================= */
{
  title: 'Stones',
  plate: '',
  sub: 'He said afterwards it was the hardest day of his life — and the duʿāʾ he made at the end of it does not contain one word against them.',
  pages: [
    { t:'splash', art:['mountain','blood'],
      h:'Ten days, and nobody listened',
      p:'Sixty kilometres over the mountains, with **Zayd ibn Ḥārithah**. He spoke to the three brothers who ran the city. One of them said: *“Could Allah find nobody else to send?”* Then they set the boys and the servants of the town on him.' },

    { t:'comic', layout:'trio', panels:[
      { art:['mountain','blood'], cls:'tall',
        sfx:[{w:'THK  THK', c:'mid pink', x:'58%', y:'16%', rot:-9}],
        items:[
          { cap:'They lined both sides of the road out of the city and threw stones until blood ran down both his legs.' },
          { cap:'Zayd put his own body in the way and was struck on the head.' }
        ]},
      { art:['oasis','dusk'],
        items:[
          { cap:'They stopped at the wall of a vineyard outside the town, and he sat down against it.' }
        ]},
      { art:['hands','dusk'],
        items:[
          { say:'O Allah — to You alone I complain of my weakness, of how little I can do, and of how small I am before people.', who:'The Prophet ﷺ' },
          { say:'If You are not angry with me, then I do not care about anything else.', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['oasis','day'], cls:'hero span',
        items:[
          { cap:'The vineyard belonged to two Makkans, ʿUtbah and Shaybah. They watched, and felt sorry for him, and sent their servant out with a plate of grapes.' },
          { say:'Bismillāh.', who:'The Prophet ﷺ' },
          { say:'People in this land do not say that.', who:'ʿAddās', r:true }
        ]},
      { art:['oasis','sand'], cls:'short',
        items:[
          { say:'Where are you from, ʿAddās?', who:'The Prophet ﷺ' },
          { say:'Nīnawā.', who:'ʿAddās', r:true },
          { say:'The town of the righteous man **Yūnus ibn Mattā**.', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'prose', kicker:'On The Road Home', h:'Listeners he could not see',
      body:[
        'ʿAddās stared at him. *“How do you know Yūnus? Nobody here even knows the name.”* And he was told about Yūnus, prophet to prophet — and he bent down and kissed the head and the hands and the feet of a man sitting bleeding against a wall, who had just been chased out of the city.',
        'On the way back they stopped at a place called **Nakhlah**. He had been rejected by Ṭāʾif, and he did not know what Makkah would do when he reached it.',
        'In the night he stood up and prayed, and recited the Qurʾān out loud, the way he always did.',
        'He did not know he had an audience.',
        'A group of **jinn** were passing — creatures Allah made from smokeless fire, that we cannot see. They stopped. One of them said to the others: *“Be quiet and listen.”*',
        'And when he finished, they went back to their own people and said: *“We have heard an amazing Qurʾān. It guides to what is right, and we believe in it.”*',
        'He had been turned away by a whole city that day, and had no idea that an entirely different creation had just accepted the message in the dark behind him.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['cave','night'], cls:'tall',
        items:[
          { cap:'He could not simply walk back into Makkah. Abū Ṭālib was gone, and the chiefs were waiting.', night:true },
          { say:'How can you go back in, when they drove you out?', who:'Zayd', r:true },
          { say:'Allah will make a way out. He will help His religion and His Prophet.', who:'The Prophet ﷺ' }
        ]},
      { art:['city','dawn'],
        items:[
          { cap:'From the cave of Ḥirāʾ he sent word to chiefs of Makkah, asking for protection. Two refused.' }
        ]},
      { art:['gate','dawn'],
        items:[
          { cap:'The third was **al-Muṭʿim ibn ʿAdī** — not a Muslim, but one of the men who had torn up the boycott.' },
          { say:'He is under my protection. Arm your sons.', who:'al-Muṭʿim' },
          { cap:'He walked his own sons into the Sanctuary with their swords drawn, and stood there while the Prophet ﷺ made ṭawāf, and nobody moved.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The duʿāʾ of Ṭāʾif', v:'Read it again. After the worst day of his life, there is **not one word** asking for anything bad to happen to them.' },
        { k:'He refused the mountains', v:'An angel offered to crush Ṭāʾif between two mountains. He said no — and asked instead that Allah bring believers out of their children. **Ṭāʾif is Muslim today.**' },
        { k:'Al-Muṭʿim was never a Muslim', v:'The Prophet ﷺ remembered that favour for the rest of his life. Years later at Badr he said that if al-Muṭʿim had been alive and asked him for the prisoners, he would have given them to him.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Offered revenge on the people who had just stoned him, he asked for their children to be guided instead. Could you do that?',
        '“If You are not angry with me, I do not care about anything else.” What does that sentence tell you about what he was actually afraid of?',
        'The jinn listened while a whole city would not. Does doing the right thing always get the response it deserves?',
        'Al-Muṭʿim protected a man whose religion he rejected, because he had given his word. What is your word worth?'
      ],
      ponder:'The worst day he ever had, and the only thing he asked for was that Allah should not be angry with him. Everything else — the stones, the blood, the laughing — he could carry.' },

    { t:'draw', h:'The road out of Ṭāʾif',
      prompt:'Draw the road from above, looking down: two small figures walking away, a line of hostile shapes on both sides behind them, and ahead — nothing but open empty road. Do not draw a single face.',
      ghost:'two small figures, going on',
      tips:[
        'A bird’s-eye view makes people look small and alone. That is exactly what you want here.',
        'Make the crowd shapes identical and faceless. Identical is frightening.',
        'Give them a long empty road ahead. That emptiness is hope, not despair.'
      ],
      bank:['Ṭāʾif','ʿAddās','Yūnus','grapes','Nakhlah','al-Muṭʿim'] },

    { t:'cliff', eyebrow:'And then, one night…',
      line:'A white animal was brought to him whose every stride reached as far as it could see.',
      next:'Chapter XVII · Burāq' }
  ]
},

/* ========================= XVII ========================= */
{
  title: 'Burāq',
  plate: 'gold',
  sub: 'Makkah to Jerusalem to the seventh heaven and back — and he was home before the night was over.',
  pages: [
    { t:'splash', art:['ascent','sacred'],
      h:'Al-Isrāʾ wa al-Miʿrāj',
      p:'After the hardest year of his life, Jibrīl came to him in Makkah. He was brought **al-Burāq** — white, a little larger than a donkey, smaller than a mule, and each of its strides landed as far away as it could see.' },

    { t:'comic', layout:'trio', panels:[
      { art:['nightsky','deep'], cls:'tall',
        sfx:[{w:'WHUMM', c:'big gold', x:'10%', y:'14%', rot:-8}],
        items:[
          { cap:'From **al-Masjid al-Ḥarām** to **al-Masjid al-Aqṣā** — a journey that took caravans a month — in part of one night.', night:true }
        ]},
      { art:['gate','sacred'],
        items:[
          { cap:'At the gate he tied al-Burāq to the ring where the prophets before him used to tie their animals.' }
        ]},
      { art:['kaaba','sacred'],
        items:[
          { cap:'Inside, the prophets were gathered and waiting. He led **all of them** in prayer.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['ascent','deep'], cls:'hero span',
        items:[
          { cap:'Then he was taken up. At each heaven a gate, and the same question:', night:true },
          { say:'Who is with you?', r:true },
          { say:'Muḥammad.  —  Has he been sent for?  —  Yes.  —  **Then welcome to him.**', who:'The gatekeepers' }
        ]},
      { art:['star','sacred'], cls:'short',
        items:[
          { cap:'**Ādam** in the first. **ʿĪsā and Yaḥyā** in the second. **Yūsuf** in the third. **Idrīs** in the fourth. **Hārūn** in the fifth. **Mūsā** in the sixth. And **Ibrāhīm** in the seventh, resting his back against al-Bayt al-Maʿmūr — where seventy thousand angels enter every day, and never come back again.' }
        ]}
    ]},

    { t:'prose', kicker:'The Gift', h:'Fifty, and then five',
      body:[
        'Beyond the seventh heaven, at the highest point of the journey, he was given something to take home for everyone who would ever follow him: **the prayer.**',
        'Fifty prayers, every day and night.',
        'On the way down he passed **Mūsā**.',
        '*“What did your Lord command for your people?”*',
        '*“Fifty prayers.”*',
        '*“Your people will not manage that. I know — I tested the Children of Isrāʾīl before you. Go back and ask your Lord to make it lighter.”*',
        'He went back. It was reduced. He came down, and Mūsā sent him back again. And again. And again — until it was **five**.',
        'And Mūsā said, *“Go back once more. Even five will be hard for them.”*',
        'And he said: *“I have gone back to my Lord until I feel too shy to ask again.”*',
        'Five prayers in the day. The reward of fifty.',
        'And that is why, when you stand up to pray, you are holding the only act of worship that was not sent down to the earth — it was given to him **up there**, and carried back.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['city','dawn'], cls:'tall',
        items:[
          { cap:'In the morning he told Makkah where he had been. Abū Jahl could hardly believe his luck.' },
          { say:'Everyone — come! Tell them what you just told me!', who:'Abū Jahl', kind:'shout', r:true }
        ]},
      { art:['market','day'],
        sfx:[{w:'clap clap', c:'sm pink', x:'62%', y:'20%', rot:7}],
        items:[
          { cap:'They clapped their hands and laughed. Some of the weaker believers began to waver.' },
          { say:'Your friend says he went to Jerusalem and came back in **one night**!', r:true }
        ]},
      { art:['city','sand'],
        items:[
          { say:'Did he really say that?', who:'Abū Bakr' },
          { say:'He did!', r:true },
          { say:'Then it is true. I believe him about news from the heavens that reaches him morning and evening. Why would I doubt him about this?', who:'Abū Bakr' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'He was given it after his worst year', v:'The Night Journey came right after the Year of Sorrow and Ṭāʾif. The comfort came after the hardship, not instead of it.' },
        { k:'That is how Abū Bakr got his name', v:'From that morning he was **aṣ-Ṣiddīq** — the one who confirms the truth. He earned it by believing without needing to check.' },
        { k:'He described Jerusalem stone by stone', v:'They questioned him about a city he had seen once as a child. He described it until the people who traded there said: *“By Allah, he is right.”*' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Mūsā kept sending him back to ask for less, out of concern for people he would never meet. What does that show about the prophets?',
        'Abū Bakr did not need proof because of everything that came before. How is trust actually built?',
        'The prayer is the one gift brought down from above the seventh heaven. Does that change how you think about standing up for ṣalāh?',
        'The hardest year of his life was followed by the greatest night. What might that mean for a hard year of your own?'
      ],
      ponder:'He came back from the seventh heaven carrying one thing for us. Not treasure. Not a weapon. A conversation we are allowed to have with Allah five times a day.' },

    { t:'draw', h:'The stride',
      prompt:'Draw al-Burāq in mid-stride across a night sky — but draw only the **motion**: streaks of light, the curve of a path, the land dropping away far below, one single hoofprint of light left behind on a hilltop. Draw no rider.',
      ghost:'as far as it could see',
      tips:[
        'Speed in comics is lines, not shapes. Long curved streaks, all travelling the same way.',
        'Put the horizon low and curved, so you feel the height.',
        'No rider. Leave that space empty and bright — it will be the strongest part of the drawing.'
      ],
      bank:['al-Burāq','al-Aqṣā','seven heavens','Mūsā','five prayers','aṣ-Ṣiddīq'] },

    { t:'cliff', eyebrow:'And at the next Ḥajj season…',
      line:'Six strangers from a city up north sat listening in the dark at ʿAqabah — and they had heard a prophet was due.',
      next:'Chapter XVIII · Yathrib' }
  ]
},

/* ========================= XVIII ========================= */
{
  title: 'Yathrib',
  plate: 'light',
  sub: 'Makkah had refused him for ten years. The answer, when it came, came from three hundred miles away.',
  pages: [
    { t:'splash', art:['lantern','night'],
      h:'Among the tents at Minā',
      p:'Every Ḥajj season he walked between the tents of the visiting tribes, one by one, asking them to listen. Most sent him away. He kept walking.' },

    { t:'comic', layout:'trio', panels:[
      { art:['market','day'], cls:'tall',
        items:[
          { cap:'**Ṭufayl ibn ʿAmr** was a famous poet and chief of the tribe of Daws. Quraysh got to him the moment he arrived.' },
          { say:'Do not listen to him. His words split families. Do not let a single sentence reach you.', r:true },
          { cap:'He was warned so thoroughly that he pushed **cotton into his ears** before going to the Kaʿbah.' }
        ]},
      { art:['kaaba','sand'],
        items:[
          { cap:'And standing there with his ears stopped, a little of the Qurʾān reached him anyway. And it was beautiful.' },
          { say:'I am a grown man. I know good speech from bad. Let me hear it properly.', who:'Ṭufayl', r:true }
        ]},
      { art:['road','dusk'],
        items:[
          { cap:'He followed him home, heard it all, and became Muslim — then went back to his tribe and spent years calling them. Daws came to Islam in the end. All of them.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['kaaba','night'], cls:'hero span',
        items:[
          { cap:'**Abū Dharr** of Ghifār heard a rumour and came to Makkah to check it himself. He knew nobody, was afraid to ask, and stayed in the Sanctuary for days drinking only **Zamzam**.', night:true },
          { say:'You have been here three nights. Who are you looking for?', who:'ʿAlī', r:true },
          { say:'Promise me you will keep it quiet.', who:'Abū Dharr' }
        ]},
      { art:['kaaba','dawn'], cls:'short',
        sfx:[{w:'LĀ ILĀHA ILLĀ ALLĀH!', c:'mid pink', x:'8%', y:'18%', rot:-7}],
        items:[
          { cap:'He believed — and then walked straight out into the middle of Quraysh and announced it at the top of his voice. They beat him unconscious. He did it again the next day.' }
        ]}
    ]},

    { t:'prose', kicker:'Six Men in the Dark', h:'“Let us not let them reach him first”',
      body:[
        'One night at **ʿAqabah**, near Minā, he came across a small group talking quietly.',
        '*“Who are you?”*',
        '*“From the Khazraj. Of Yathrib.”*',
        'He sat down with them, recited the Qurʾān, and called them to Allah.',
        'And the six of them looked at each other — because in Yathrib they lived alongside Jewish tribes who told them, often, and usually in an argument: **a prophet is coming soon, and when he does we will follow him and finish you.**',
        'One of them whispered what all of them were thinking: *“This is the prophet they keep threatening us with. Let us not let them get to him first.”*',
        'All six accepted Islam that night.',
        'And they went home to a city that had been tearing itself apart in a civil war for years — and started talking.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['tent','night'], cls:'tall',
        items:[
          { cap:'One year later, twelve men came back to ʿAqabah — five of the six, and seven new believers.', night:true }
        ]},
      { art:['tent','deep'],
        items:[
          { cap:'And there they made a promise, hand in hand, in the dark:' },
          { say:'That we will worship nothing besides Allah. That we will not steal. That we will not do what is shameful. That we will not harm our children. That we will not spread lies about one another. And that we will not disobey you in what is right.', who:'The twelve' }
        ]},
      { art:['madinah','dawn'],
        items:[
          { say:'Whoever keeps this promise — his reward is with Allah.', who:'The Prophet ﷺ' },
          { cap:'He sent one young teacher home with them: **Muṣʿab ibn ʿUmayr**. One man, one city, one year.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'Ṭufayl blocked his ears and still heard', v:'Quraysh had warned him so hard that they made him curious. Trying to stop something can be the thing that spreads it.' },
        { k:'Muṣʿab was the first teacher sent anywhere', v:'A young man from the richest family in Makkah, who had given it all up. Within a year, almost every household in Yathrib had someone Muslim in it.' },
        { k:'Yathrib was ready because it was broken', v:'Two great tribes, Aws and Khazraj, had been at war for years and were exhausted. A city that has run out of answers listens properly.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Ṭufayl put cotton in his ears so he would not have to judge for himself. Have you ever avoided hearing something because you were scared it might be right?',
        'The six men believed partly because they did not want a rival group getting there first. Can a mixed-up reason still lead somewhere good?',
        'Twelve people made a promise in the dark with nobody watching. What makes a promise binding when no one can check?',
        'One young teacher changed a whole city in a year. What could one person change where you live?'
      ],
      ponder:'He had walked those tents for ten years and been sent away every time. He kept walking anyway — and the night it finally worked, it was six strangers in the dark.' },

    { t:'draw', h:'Twelve hands',
      prompt:'Draw only hands — twelve of them, reaching in from the edges of the page into the middle, overlapping, in the dark, with one small lamp underneath lighting them from below. No faces, no bodies. Just the promise.',
      ghost:'a promise in the dark',
      tips:[
        'Hands from every edge pointing inwards pulls the eye to the centre and holds it.',
        'Light from below makes everything dramatic. Strong highlights on top of the hands, deep shadow underneath.',
        'Make no two hands the same size. Different sizes read as different people.'
      ],
      bank:['ʿAqabah','Khazraj','the pledge','Muṣʿab','Yathrib','twelve'] },

    { t:'cliff', eyebrow:'End of Book Two',
      line:'The next year, seventy-three of them came. And this time the promise they made was one that meant war.',
      next:'Book Three · The Longest Night' }
  ]
}

]};
