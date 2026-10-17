/* Seeraa Quest — Book Four: The Mountain and the Trench
   Chapters XXVIII–XXXVI  ·  Maps 28–36  ·  Uḥud, the siege, and a peace nobody understood */
window.SEERAA_BOOK = {
  id: 4,
  title: 'The Mountain and the Trench',
  range: 'Chapters XXVIII–XXXVI',
  chapters: [

/* ========================= XXVIII ========================= */
{
  title: 'The Necklace',
  plate: '',
  sub: 'A daughter in Makkah sent her mother’s wedding necklace to buy back a husband who was fighting on the other side.',
  pages: [
    { t:'splash', art:['madinah','dusk'],
      h:'The reward of a man who was at Badr',
      p:'**ʿUthmān ibn ʿAffān** did not march to Badr. His wife **Ruqayyah**, the Prophet’s daughter, was very ill, and he was asked to stay and nurse her. He was told he would have the reward of a man who was there, and his share of it.' },

    { t:'comic', layout:'trio', panels:[
      { art:['madinah','night'], cls:'tall',
        items:[
          { cap:'He nursed her day and night, and she died.', night:true }
        ]},
      { art:['madinah','dusk'],
        sfx:[{w:'VICTORY!', c:'mid gold', x:'10%', y:'18%', rot:-8}],
        items:[
          { cap:'On the very day they were burying her, **Zayd ibn Ḥārithah** rode into Madīnah shouting the news of Badr.' },
          { cap:'The city got the best news it had ever had and the worst news it had ever had in the same hour.' }
        ]},
      { art:['city','sand'],
        items:[
          { cap:'Among the captives brought back was **Abū al-ʿĀṣ** — the husband of the Prophet’s eldest daughter, **Zaynab**. He had fought on the side of Quraysh. She still loved him.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['scroll','sand'], cls:'hero span',
        items:[
          { cap:'From Makkah, Zaynab sent a ransom to free him — and with it, a necklace.' },
          { cap:'It was the necklace her mother **Khadījah** had given her on her wedding day.' }
        ]},
      { art:['city','dusk'], cls:'short',
        items:[
          { say:'If you think it right — free her captive, and give her back what is hers.', who:'The Prophet ﷺ' },
          { cap:'They did, immediately, all of them. Abū al-ʿĀṣ went home free, with the necklace, and became Muslim some years later — and Zaynab was still his wife.' }
        ]}
    ]},

    { t:'prose', kicker:'Inside The City', h:'“We are the real men”',
      body:[
        'The tribe of **Banū Qaynuqāʿ** lived inside Madīnah and were skilled goldsmiths. They had signed the Charter: live in peace, defend the city together.',
        'After Badr they were angry, and jealous, and said so. The Prophet ﷺ went to their market and gathered them and advised them to think carefully about what they were seeing before it was too late.',
        'And they answered: *“O Muḥammad, do not be fooled because you killed some men of Quraysh who knew nothing about fighting. If you fought **us**, you would find out that we are the real men.”*',
        'Then one of them pinned the dress of a Muslim woman in that market while she sat, so that when she stood, she was exposed. A Muslim killed him for it, and they killed the Muslim.',
        'They had broken the agreement in public. They were besieged for fifteen nights, and then left Madīnah.',
        'The first of three times a tribe inside the city would break its word — and every time, it would start with somebody deciding the Muslims were weaker than they looked.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['madinah','dawn'], cls:'tall',
        items:[
          { cap:'After Badr, **ʿAlī** came — very shyly — to ask to marry **Fāṭimah**.' },
          { say:'Give her something.', who:'The Prophet ﷺ' },
          { say:'I have nothing.', who:'ʿAlī', r:true }
        ]},
      { art:['tent','sand'],
        items:[
          { say:'Where is your armour?', who:'The Prophet ﷺ' },
          { cap:'So he sold his armour, and that was her marriage gift.' }
        ]},
      { art:['tent','dusk'],
        items:[
          { cap:'Their whole home: a blanket, a leather pillow stuffed with palm fibre, a water skin, and a stone hand-mill.' },
          { cap:'She ground the grain herself until her hands blistered. He carried the water. That was the household of the daughter of the Messenger of Allah ﷺ.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'ʿUthmān was called Dhū an-Nūrayn', v:'*The one with two lights.* After Ruqayyah died he married her sister **Umm Kulthūm**. No one else in history married two daughters of a prophet.' },
        { k:'The necklace was given back', v:'They could have kept a perfectly legal ransom. They gave it back because of what it had meant to a woman who had died twelve years earlier.' },
        { k:'Fāṭimah asked for a servant once', v:'She was given something else instead: **tasbīḥ** before sleeping — thirty-three, thirty-three, thirty-four. *“Better for you than a servant.”*' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'ʿUthmān missed the greatest day of his life to sit with someone who was ill. Would you have been able to stay?',
        'They gave back a ransom they were entitled to. When is letting something go stronger than keeping it?',
        'Zaynab loved a husband who fought against her father. Can you love someone and completely disagree with them?',
        'Fāṭimah’s hands blistered from the hand-mill. What does that tell you about how that family actually lived?'
      ],
      ponder:'Victory arrived in the same hour as a funeral. The rest of the Seerah is like that too — joy and grief, carried at the same time, by the same people.' },

    { t:'draw', h:'What arrived from Makkah',
      prompt:'Draw an open hand holding a simple necklace, with the ransom goods stacked and ignored in the background. The valuable things are behind. The thing that stops everyone is the small one.',
      ghost:'her mother’s',
      tips:[
        'Make the necklace plain. Resist drawing jewels — it matters because of who wore it, not what it is worth.',
        'Blur or simplify the background goods so the eye does not stay there.',
        'A single warm light on the hand and cool shadow everywhere else.'
      ],
      bank:['Ruqayyah','Zaynab','Khadījah’s necklace','ransom','Fāṭimah','the hand-mill'] },

    { t:'cliff', eyebrow:'One year later, to the month…',
      line:'Three thousand men came north out of Makkah, and this time they brought their women to sing behind them so that nobody would run.',
      next:'Chapter XXIX · The Hill' }
  ]
},

/* ========================= XXIX ========================= */
{
  title: 'The Hill',
  plate: 'gold',
  sub: '“Do not leave this place. Even if you see birds carrying us away. Not until I send for you.”',
  pages: [
    { t:'splash', art:['mountain','storm'],
      h:'Three thousand, and a dream he did not like',
      p:'His uncle **al-ʿAbbās**, still living in Makkah, sent a secret letter north to warn him. He gathered the companions to ask them. He had seen a dream that worried him, and his own view was to stay inside the city and fight from the streets.' },

    { t:'comic', layout:'trio', panels:[
      { art:['madinah','day'], cls:'tall',
        items:[
          { say:'Let us go out and meet them! Do not keep us behind the walls!', kind:'shout' },
          { cap:'It was mostly the young men who had missed Badr, and who had been aching for a day like this ever since.' }
        ]},
      { art:['madinah','dusk'],
        items:[
          { cap:'He listened to all of it. Then he went into his house and came out wearing his armour.' },
          { say:'We have changed our minds — stay, if you prefer.', r:true },
          { say:'It is not for a prophet, once he has put on his armour, to take it off until Allah judges between him and his enemy.', who:'The Prophet ﷺ' }
        ]},
      { art:['road','sand'],
        sfx:[{w:'wrestle!', c:'sm pink', x:'62%', y:'20%', rot:8}],
        items:[
          { cap:'On the road he checked the army and sent the boys home. **Rāfiʿ ibn Khadīj** was allowed to stay — he was a superb archer.' },
          { say:'I am stronger than Rāfiʿ! I can beat him at wrestling!', who:'Samurah', r:true },
          { cap:'He let them wrestle. Samurah threw him. Samurah stayed too.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['road','storm'], cls:'hero span',
        items:[
          { cap:'Then, the next morning, **ʿAbdullāh ibn Ubayy** turned round and went home — and took about three hundred men with him. A third of the army, gone before anything started.' },
          { say:'He did not take my advice, so why should we get ourselves killed here?', who:'Ibn Ubayy', r:true }
        ]},
      { art:['mountain','sand'], cls:'short',
        items:[
          { cap:'Seven hundred men were left, facing three thousand, at the foot of a mountain called **Uḥud**.' }
        ]}
    ]},

    { t:'prose', kicker:'One Instruction', h:'“Even if you see birds carrying us away”',
      body:[
        'He put **fifty archers** on a small hill behind the Muslim lines, under **ʿAbdullāh ibn Jubayr**, to stop the enemy cavalry coming round the back.',
        'And he gave them an instruction with no room in it at all:',
        '*“Do not leave this place. If you see us winning, do not join us. If you see birds snatching us away — do not come down. Stay here until I send for you.”*',
        'And at first it went well. Better than well. The Quraysh line broke and they ran, and the Muslims went after them, and some of their camp was already being collected.',
        'And the archers on the hill watched the enemy running away, and said to each other: *“The battle is over. There is nothing left to guard. We will lose our share of this.”*',
        'Their commander begged them. He reminded them of exactly what they had been told, word for word.',
        'Forty of them went down anyway.',
        'And **Khālid ibn al-Walīd**, who was not yet a Muslim and was the finest cavalry commander in Arabia, was watching that hill — and the moment it emptied, he took his horsemen round it.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['battlefield','blood'], cls:'tall',
        sfx:[{w:'HE IS KILLED!', c:'big pink', x:'8%', y:'14%', rot:-9}],
        items:[
          { cap:'The Muslims were hit from behind, and in the confusion somebody shouted the worst rumour of the day.' },
          { cap:'Men sat down where they stood with their swords hanging from their hands.' }
        ]},
      { art:['battlefield','storm'],
        items:[
          { say:'Why are you sitting here?', who:'Anas ibn an-Naḍr' },
          { say:'The Messenger of Allah has been killed.', r:true }
        ]},
      { art:['battlefield','dusk'],
        items:[
          { say:'Then what will you do with life after him? Get up and die for what he died for.', who:'Anas ibn an-Naḍr' },
          { say:'I can smell the scent of Paradise, beyond Uḥud.', who:'Anas ibn an-Naḍr' },
          { cap:'They found him afterwards with more than eighty wounds. Only his sister could identify him, by his fingertips.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'He consulted, and followed the majority', v:'His own opinion was to stay in the city. He went with what most of them wanted — and it went badly, and he still did not say *I told you so.*' },
        { k:'The rumour was false', v:'He was alive. He was wounded in the face, and two rings of his helmet had gone into his cheek — but he was alive, and calling them quietly back to himself.' },
        { k:'Khālid became Muslim later', v:'The commander who found the gap on that hill would, within a few years, be fighting on the other side — and became one of the greatest generals in Islamic history.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'The archers were not cowards. They left their posts because they thought it was over. Why is that failure so easy to understand — and so dangerous?',
        'He asked their opinion, and took it, even though he disagreed. What does that cost a leader?',
        'A third of the army walked home. What do you think the remaining seven hundred felt watching them go?',
        'Anas asked, “What will you do with life after him?” What is the thing in your life that you could not imagine living without?'
      ],
      ponder:'One instruction. Clear, repeated, impossible to misunderstand. The day did not turn because the enemy was clever. It turned because forty good men decided the job was finished.' },

    { t:'draw', h:'The empty hill',
      prompt:'Draw the small hill from behind, at the moment it has just emptied — a few abandoned arrows stuck in the ground, one lone figure still standing there, and a line of dust coming around the base of the hill from the right. Draw the dust. We know what is in it.',
      ghost:'ten stayed',
      tips:[
        'Make the hill plain and bare. All the drama is in what is **not** there.',
        'Loose arrows in the ground at odd angles tell the whole story of a hurried departure.',
        'One small dark figure standing. Do not explain him. Just leave him there.'
      ],
      bank:['Uḥud','fifty archers','ʿAbdullāh ibn Jubayr','Khālid','the rumour','Anas'] },

    { t:'cliff', eyebrow:'And in those minutes…',
      line:'A handful of people put their own bodies between him and an army, and one of them was a woman with a sword.',
      next:'Chapter XXX · Shields' }
  ]
},

/* ========================= XXX ========================= */
{
  title: 'Shields',
  plate: 'light',
  sub: 'She had gone out that morning carrying a water-skin for the wounded. She came home with twelve wounds.',
  pages: [
    { t:'splash', art:['battlefield','blood'],
      h:'Umm ʿUmārah',
      p:'**Nusaybah bint Kaʿb** was one of the two women who had given their word at ʿAqabah. She had come to Uḥud to carry water and bind wounds. When the line broke and only a few were left standing around the Prophet ﷺ, she was one of them.' },

    { t:'comic', layout:'trio', panels:[
      { art:['battlefield','storm'], cls:'tall',
        sfx:[{w:'CLANG CLANG', c:'mid pink', x:'54%', y:'16%', rot:-10}],
        items:[
          { cap:'She put down the water-skin, picked up a sword, and went at **Ibn Qamīʾah** — the man who had struck the Prophet ﷺ — again and again.' },
          { cap:'He survived it only because he was wearing two coats of armour.' }
        ]},
      { art:['battlefield','blood'],
        items:[
          { cap:'He cut her across the shoulder — a wound that took a year to heal. She kept fighting.' },
          { say:'I did not care. I did not turn round. I had no thought in my head except him.', who:'Umm ʿUmārah', r:true }
        ]},
      { art:['battlefield','dusk'],
        items:[
          { say:'Wherever I turned, right or left, I saw her fighting in front of me.', who:'The Prophet ﷺ' },
          { say:'The place of Nusaybah bint Kaʿb today is better than the place of so-and-so and so-and-so.', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['battlefield','storm'], cls:'hero span',
        items:[
          { cap:'**Ṭalḥah ibn ʿUbaydillāh** caught arrows and blows on his open hand until the hand was ruined and stayed weak for the rest of his life.' },
          { cap:'**Abū Ṭalḥah** stood in front with his shield up.' },
          { say:'Do not raise your head. Do not. One of their arrows will find you — my chest before yours.', who:'Abū Ṭalḥah', r:true }
        ]},
      { art:['battlefield','blood'], cls:'short',
        items:[
          { cap:'**Saʿd ibn Abī Waqqāṣ** shot arrow after arrow, and was handed them one at a time, with the words every archer wants to hear once in his life: *“Shoot, Saʿd — may my mother and father be ransomed for you.”*' }
        ]}
    ]},

    { t:'prose', kicker:'The Lion of Allah', h:'Waḥshī behind the rock',
      body:[
        '**Ḥamzah** fought that day the way he always fought, and they called him **Asad Allāh** — the Lion of Allah.',
        'A man named **Waḥshī**, who was enslaved, had been promised his freedom if he killed him. He was a thrower of the short spear, and he did not fight — he waited. He hid behind a rock and let the battle go past him, and when the moment came, he threw from a distance.',
        'Ḥamzah fell.',
        'When it was over and the Prophet ﷺ found his uncle, he wept as his companions had never seen him weep.',
        'Not far away lay **Muṣʿab ibn ʿUmayr** — the best-dressed young man in Makkah, the first teacher sent to Yathrib, the man who had brought half that city to Islam in a year. He had carried the flag until he was killed.',
        'When they came to bury him, the only cloth they had was one short cloak. If they covered his head, his feet were bare. If they covered his feet, his head was bare.',
        'They were told: cover his head, and put grass over his feet.',
        'Seventy were killed that day.',
        'And years later, Waḥshī became a Muslim — and the Prophet ﷺ forgave him, and asked him only one thing: *“Keep your face away from me, if you can.”* And Waḥshī spent the rest of his life trying to make up for it.'
      ] },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'Mercy, straight afterwards', v:'After the worst day they had had, the verse that came down was about being **gentle** with the people who had made the mistake: *“So pardon them, ask forgiveness for them, and consult them.”*' },
        { k:'Consult them — again', v:'Those are the same people whose advice had just led to this. And the instruction was to keep asking them.' },
        { k:'Umm ʿUmārah kept going', v:'She fought again at Ḥunayn, and at al-Yamāmah years later, where she lost a hand. She asked to be buried with her sword.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Umm ʿUmārah came to carry water and ended up with twelve wounds. What do you do when a situation asks far more of you than you came prepared for?',
        'Ṭalḥah’s hand never worked properly again. Would you give something permanent for someone else?',
        'Waḥshī was forgiven for killing Ḥamzah. Is there a limit to what should be forgiven? Think carefully before answering.',
        'They were told to be gentle with the archers. What would you have wanted to say to those forty men?'
      ],
      ponder:'The instruction after the disaster was not punishment. It was: forgive them, ask Allah to forgive them, and keep asking their opinion.' },

    { t:'draw', h:'One short cloak',
      prompt:'Draw a figure covered by a cloak that is too short — head covered, bare feet showing at the end — with a few stems of grass laid across the feet. Nothing else on the page. No faces, no crowd.',
      ghost:'cover his head, and put grass on his feet',
      tips:[
        'Keep it almost empty. One shape, one cloth, a few stems of grass.',
        'Make the grass the only green and the only soft thing in the picture.',
        'Do not add tears, slogans or crowds. Let it be quiet. It is stronger quiet.'
      ],
      bank:['Ḥamzah','Muṣʿab','Umm ʿUmārah','Ṭalḥah','seventy','a short cloak'] },

    { t:'cliff', eyebrow:'The very next morning…',
      line:'Wounded men were ordered to get up and march out again after the army that had just beaten them — and every one of them went.',
      next:'Chapter XXXI · Enough for Us' }
  ]
},

/* ========================= XXXI ========================= */
{
  title: 'Enough for Us',
  plate: '',
  sub: 'Abū Sufyān was half a day down the road, already regretting that he had not finished it — and then a rumour reached him.',
  pages: [
    { t:'splash', art:['road','dawn'],
      h:'Ḥamrāʾ al-Asad',
      p:'The day after Uḥud, exhausted and wounded and grieving, they were given an order: **everyone who was at Uḥud yesterday — and only them — march out again.** The wounded got up and went.' },

    { t:'comic', layout:'trio', panels:[
      { art:['road','sand'], cls:'tall',
        items:[
          { cap:'They camped eight miles out, at Ḥamrāʾ al-Asad, and lit enormous fires at night so the whole horizon could see them.' }
        ]},
      { art:['desert','dusk'],
        items:[
          { cap:'A man called **Maʿbad**, of Khuzāʿah, met them — then rode on and found Abū Sufyān, who was busy talking himself into turning round and finishing the job.' },
          { say:'Muḥammad is coming after you with an army I have never seen the like of. They are **burning** with it.', who:'Maʿbad', r:true }
        ]},
      { art:['desert','storm'],
        items:[
          { cap:'Abū Sufyān went home to Makkah.' },
          { say:'Allah is enough for us, and He is the best Disposer of affairs.', who:'The Muslims' }
        ]}
    ]},

    { t:'prose', kicker:'Betrayed Twice', h:'Khubayb, on the wood',
      body:[
        'In the year after Uḥud, tribes came to Madīnah asking for teachers. *“Send us men to teach us Islam and the Qurʾān.”*',
        'Twice, the men who were sent were ambushed and killed.',
        'At a place called **ar-Rajīʿ**, a small group of teachers was surrounded. **Khubayb ibn ʿAdiyy** was captured alive and sold in Makkah to people who wanted revenge for Badr.',
        'They held him in a house for a while before they killed him. The woman of that house said afterwards: *“By Allah, I never saw a better prisoner than Khubayb. By Allah, one day I found him eating from a bunch of grapes in his hand the size of a man’s head — and there was not a single grape in Makkah at that time.”*',
        'Once her small son wandered in and climbed on his lap while he had a blade in his hand, and she froze in the doorway. Khubayb looked at her and said: *“Are you afraid I would kill him? I would never do that.”*',
        'When they took him out to kill him, he asked to pray two rakʿahs first. He prayed them quickly, and said: *“By Allah, if you did not think I was afraid of death, I would have prayed longer.”*',
        'That is where the sunnah of praying two rakʿahs before being killed unjustly comes from. A man invented it, in the last ten minutes of his life, so that nobody could say he was frightened.'
      ] },

    { t:'comic', layout:'wide-duo', panels:[
      { art:['fort','dusk'], cls:'hero span',
        items:[
          { cap:'Compensation was owed to a family, and under the Charter, **Banū an-Naḍīr** were supposed to help pay it. He went to them with Abū Bakr, ʿUmar, ʿAlī and a few others.' },
          { say:'Of course. Sit here by the wall, and we will get it ready.', r:true }
        ]},
      { art:['fort','blood'], cls:'short',
        sfx:[{w:'above!', c:'sm pink', x:'20%', y:'18%', rot:-9}],
        items:[
          { cap:'On the roof, they were getting a millstone into position to drop on his head.' },
          { cap:'He stood up quietly, as if going to do something ordinary, and walked out. Jibrīl had told him.' }
        ]}
    ]},

    { t:'comic', layout:'trio', panels:[
      { art:['madinah','day'], cls:'tall',
        items:[
          { cap:'Before Islam, the Arabs drank **khamr** constantly. Allah did not forbid it in one go.' },
          { cap:'First: its harm is greater than its benefit. Then: do not come to prayer while your mind is clouded. And then, in Madīnah, the last word came down.' }
        ]},
      { art:['market','sand'],
        items:[
          { say:'Khamr, gambling, idols and divining arrows are filth, from the work of Shayṭān — so keep away from them.', who:'Revealed' },
          { say:'**So will you not stop?**', who:'Revealed' }
        ]},
      { art:['city','dusk'],
        sfx:[{w:'SPLASH', c:'mid gold', x:'44%', y:'20%', rot:-7}],
        items:[
          { say:'We have stopped! We have stopped!', who:'ʿUmar', kind:'shout' },
          { cap:'They went out and poured it into the streets of Madīnah. People said the alleys ran with it. Nobody argued, nobody asked for time, nobody finished the cup in their hand.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The march out was the point', v:'They could not have won another battle that day. They went so that Arabia would see them get up — and it worked, without a single blow.' },
        { k:'Khamr was forbidden in stages', v:'Allah changed a deep habit gradually, over years. Big changes in a person usually work the same way.' },
        { k:'“We hear and we obey”', v:'That is the phrase the Qurʾān uses for this moment, and it is the shortest description of what īmān actually looks like in practice.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Wounded men got up and marched the day after a defeat. Where would you find that, if you had to?',
        'Khubayb prayed quickly so nobody could call him afraid. What would you want people to see in you at your worst moment?',
        'They poured away what was in their hands the moment they heard. Is there anything you would drop that fast?',
        'Allah removed khamr in stages, not all at once. What does that suggest about changing a habit of your own?'
      ],
      ponder:'“Ḥasbunā Allāh wa niʿma al-wakīl.” They said it the day after the worst defeat of their lives, walking out wounded to face the same army again.' },

    { t:'draw', h:'The fires at Ḥamrāʾ al-Asad',
      prompt:'Draw a long line of campfires stretching across a dark ridge — far more fires than there are people — with a few bandaged figures sitting among them. The picture is a bluff, and it worked.',
      ghost:'make it look like more',
      tips:[
        'Lots of small glows in a long row. Repetition across the page makes an army out of nothing.',
        'Only two or three figures visible. The gaps do the lying.',
        'Deep blue-black night with hot orange points. Two colours, maximum drama.'
      ],
      bank:['Ḥamrāʾ al-Asad','Ḥasbunā Allāh','Khubayb','ar-Rajīʿ','Banū an-Naḍīr','khamr'] },

    { t:'cliff', eyebrow:'In the fifth year, they came back…',
      line:'Not three thousand this time. **Ten thousand** — every tribe in Arabia that could be persuaded, all at once.',
      next:'Chapter XXXII · The Trench' }
  ]
},

/* ========================= XXXII ========================= */
{
  title: 'The Trench',
  plate: 'gold',
  sub: 'A Persian suggested something no Arab had ever seen. They had about a week to dig it.',
  pages: [
    { t:'splash', art:['trench','storm'],
      h:'Al-Aḥzāb — the Confederates',
      p:'The leaders of Banū an-Naḍīr rode around Arabia putting an alliance together. **Quraysh. Ghaṭafān. And others.** About **ten thousand** men, moving on one city of a few thousand.' },

    { t:'comic', layout:'trio', panels:[
      { art:['madinah','storm'], cls:'tall',
        items:[
          { cap:'He gathered them and asked.' },
          { say:'In Persia, when we feared cavalry, we dug a trench around ourselves. They cannot jump it, and they cannot cross it under fire.', who:'Salmān al-Fārisī', r:true },
          { cap:'No Arab had ever heard of such a thing.' }
        ]},
      { art:['trench','sand'],
        sfx:[{w:'DIG  DIG', c:'mid pink', x:'58%', y:'16%', rot:-9}],
        items:[
          { cap:'Madīnah was shielded by lava fields and palm groves on most sides. Only the north was open. So they dug the north.' },
          { cap:'Every man in the city, including him, with a pick. Forty cubits to each group of ten.' }
        ]},
      { art:['trench','dusk'],
        items:[
          { cap:'It was freezing, and there was no food. He tied a stone against his stomach to dull the hunger. So did they.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['trench','blood'], cls:'hero span',
        sfx:[{w:'KRAK', c:'big gold', x:'8%', y:'14%', rot:-8}],
        items:[
          { cap:'They hit a rock the picks bounced off. He came down into the trench, took the pick, and said **Bismillāh**.' },
          { say:'**Allāhu Akbar!** I have been given the keys of Shām. By Allah, I can see its red palaces from where I stand.', who:'The Prophet ﷺ' }
        ]},
      { art:['trench','sand'], cls:'short',
        sfx:[{w:'KRAK', c:'mid gold', x:'62%', y:'22%', rot:7}],
        items:[
          { say:'**Allāhu Akbar!** The keys of Persia — I can see the white palace of al-Madāʾin.', who:'The Prophet ﷺ' },
          { say:'**Allāhu Akbar!** The keys of Yemen. I can see the gates of Ṣanʿāʾ from here.', who:'The Prophet ﷺ' }
        ]}
    ]},

    { t:'prose', kicker:'Jābir’s Little Meal', h:'One young goat and a handful of barley',
      body:[
        '**Jābir ibn ʿAbdillāh** saw the stone tied against his stomach and could not bear it. He went home at a run.',
        '*“Have we anything? Anything at all?”* His wife had a small young goat and a little barley. They prepared the meat and made the dough, and Jābir went back quietly and said, close to his ear, so nobody else would hear:',
        '*“I have a little food. Please come — and bring one or two others.”*',
        'And the Prophet ﷺ stood up and called across the whole trench:',
        '**“People of the trench! Jābir has made a feast for you! Come!”**',
        'Jābir said afterwards that he wanted the ground to open. There were hundreds of them.',
        '*“Do not take the pot off the fire,”* he was told, *“and do not bake the dough until I come.”*',
        'He came, spat into the dough and into the pot and made duʿāʾ, and told Jābir’s wife to ladle it out and not to lift the pot down.',
        'They came in and ate in groups and went out again, group after group after group, until every one of them had eaten and gone.',
        'And the pot was still bubbling, and the dough was still rising.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['fort','storm'], cls:'tall',
        items:[
          { cap:'Then the worst news of the siege: **Banū Qurayẓah**, inside the city behind the Muslim lines, had torn up their agreement and joined the enemy.' },
          { cap:'Now there was an army in front and an open door behind.' }
        ]},
      { art:['city','blood'],
        items:[
          { say:'When they came at you from above you and from below you, and when eyes grew wide, and hearts reached the throats…', who:'Revealed' }
        ]},
      { art:['fort','night'],
        sfx:[{w:'THUD', c:'mid pink', x:'24%', y:'20%', rot:-11}],
        items:[
          { cap:'In one of the forts where the women and children were sheltering, a man came scouting the walls. **Ṣafiyyah**, the Prophet’s aunt, asked the man with her to deal with him. He said he could not.', night:true },
          { cap:'So she took a tent-pole, went down herself, and struck him with it until he was dead — then told them to go and take his weapons, so the enemy would think the fort was defended.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The idea came from outside Arabia', v:'The thing that saved Madīnah was a Persian engineering trick, suggested by a man who had been enslaved. **Good ideas are taken from wherever they come.**' },
        { k:'He dug too', v:'He carried the earth with them and got as hungry as they did. He did not supervise the trench. He dug it.' },
        { k:'The three strikes came true', v:'Shām, Persia and Yemen. He said it in a frozen ditch, surrounded, with a stone tied to his stomach — and within thirty years all three had come.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Salmān’s foreign idea was taken seriously immediately. When did you last take advice from somebody outside your usual circle?',
        'Jābir meant to feed three people and was made to invite hundreds. How did that feel for him — and what did he learn?',
        'He promised empires from inside a frozen ditch. Is that strange to you, or is that exactly the point?',
        'Ṣafiyyah did the thing nobody else would do. What is one job you have avoided because it should be someone else’s?'
      ],
      ponder:'The siege lasted about a month. The whole time, the city was starving, freezing, surrounded — and the leader of it was telling them about palaces they would one day hold the keys to.' },

    { t:'draw', h:'The strike',
      prompt:'Draw the pick striking the rock from close up, with sparks flying — and in the sparks, very faintly, draw three distant palaces. Make the viewer look twice before they notice them.',
      ghost:'three strikes, three keys',
      tips:[
        'Sparks drawn as sharp white lines radiating from the impact point. Big, confident lines.',
        'Hide the palaces in the sparks at very low contrast. Half-seen is better than obvious.',
        'Keep everything else — the trench, the people — in near-black silhouette.'
      ],
      bank:['al-Khandaq','Salmān','the rock','Jābir’s pot','Banū Qurayẓah','Ṣafiyyah'] },

    { t:'cliff', eyebrow:'And then one freezing night…',
      line:'The wind came. It ripped out their tent pegs, turned over their cooking pots, and by morning there was nobody there at all.',
      next:'Chapter XXXIII · The Wind' }
  ]
},

/* ========================= XXXIII ========================= */
{
  title: 'The Wind',
  plate: 'light',
  sub: 'Ten thousand men went home in the dark because of weather and one man’s well-chosen words.',
  pages: [
    { t:'splash', art:['storm','storm'],
      h:'“And Allah sent against them a wind”',
      p:'A month of siege. Cold, hunger, fear, and an enemy on both sides. Then **Nuʿaym ibn Masʿūd**, who had become Muslim in secret and whom everyone still trusted, went to work.' },

    { t:'comic', layout:'trio', panels:[
      { art:['tent','night'], cls:'tall',
        items:[
          { cap:'He went to Banū Qurayẓah first.', night:true },
          { say:'Quraysh are not from this city. If this goes badly, they go home. You stay. Do not fight until they give you hostages.', who:'Nuʿaym', r:true }
        ]},
      { art:['tent','storm'],
        items:[
          { cap:'Then to Quraysh.' },
          { say:'I have heard Qurayẓah regret it, and plan to ask you for hostages to hand over to Muḥammad. Do not give them a single man.', who:'Nuʿaym' }
        ]},
      { art:['battlefield','storm'],
        items:[
          { cap:'Quraysh sent to Qurayẓah: fight tomorrow. Qurayẓah replied: send hostages first.' },
          { say:'By Allah — Nuʿaym told the truth.', r:true },
          { cap:'The alliance stopped trusting itself overnight.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['storm','storm'], cls:'hero span',
        sfx:[{w:'WHOOOO', c:'big', x:'8%', y:'14%', rot:-10}],
        items:[
          { cap:'And then, on a freezing night, the wind came.' },
          { cap:'It tore out the tent pegs. It turned over the cooking pots. It threw sand into ten thousand faces and did not stop.' }
        ]},
      { art:['desert','dawn'], cls:'short',
        items:[
          { say:'People of Quraysh — our animals are dying, Qurayẓah have gone back on us, and this wind is doing what you can see. **Leave. I am leaving.**', who:'Abū Sufyān' },
          { cap:'In the morning the Muslims looked out across the trench at an empty plain.' }
        ]}
    ]},

    { t:'prose', kicker:'The Same Day', h:'“The angels have not put down theirs”',
      body:[
        'He came home, put down his weapons, and washed.',
        'And Jibrīl came and said: *have you put down your weapons? The angels have not put down theirs.* And pointed towards **Banū Qurayẓah**, who had broken their agreement at the exact moment the city was most vulnerable.',
        'He told the companions: **“Nobody is to pray ʿAṣr except at Banū Qurayẓah.”**',
        'On the road, the time for ʿAṣr began running out, and they split into two groups.',
        'One group said: *“He meant hurry. He did not mean miss the prayer.”* And they prayed on the way.',
        'The other group said: *“He said what he said.”* And they prayed it late, when they arrived.',
        'When it was put to him afterwards, he did not blame either group.',
        'Both had tried to obey. One took the words exactly; one took the meaning. And he left both of them alone — which is why, fourteen hundred years later, Muslim scholars can differ about a question, each with evidence, without either of them being a liar or a fool.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['fort','dusk'], cls:'tall',
        items:[
          { cap:'The forts were surrounded. Qurayẓah asked to speak to **Abū Lubābah** of the Aws, who had been their friend for years.' },
          { say:'Shall we accept Muḥammad’s judgement?', r:true },
          { say:'Yes —', who:'Abū Lubābah' }
        ]},
      { art:['fort','blood'],
        items:[
          { cap:'— and as he said it, he drew his hand across his throat. A warning. He could not help himself.' },
          { say:'By Allah. My feet had not even moved before I knew I had betrayed Allah and His Messenger.', who:'Abū Lubābah', r:true }
        ]},
      { art:['madinah','night'],
        items:[
          { cap:'He did not go back to the Prophet ﷺ. He went to the masjid and tied himself to a pillar and said he would not be untied by anyone but Allah.', night:true },
          { cap:'He stayed there for days. And then forgiveness came down for him, and people ran to tell him — and he still would not be untied until the Prophet ﷺ untied him with his own hands.' }
        ]}
    ]},

    { t:'prose', kicker:'The Judgement', h:'Saʿd ibn Muʿādh',
      body:[
        'Banū Qurayẓah asked that their fate be decided by **Saʿd ibn Muʿādh**, chief of the Aws, who had been their ally for years.',
        'Saʿd had become Muslim in a single afternoon, through Muṣʿab, and that same evening his entire tribe had become Muslim with him. At Badr he had told the Prophet ﷺ: *“If you crossed this sea, we would cross it with you.”*',
        'During the siege an arrow had struck him in the arm and opened a vein. A tent had been put up for him inside the masjid so that he could be visited often.',
        'He had made one duʿāʾ while the arrow was in him: *“O Allah, if any of the war with Quraysh is left, keep me alive for it. And if You have ended the war, then let this wound be the thing that takes me — but do not let me die until my eyes are cooled over Banū Qurayẓah.”*',
        'They carried him in on a donkey to give the judgement. He judged according to the law they themselves held.',
        'And he was told: *“You have judged by the judgement of Allah from above seven heavens.”*',
        'His wound opened again soon after, and he died of it. The Prophet ﷺ said the throne of the Most Merciful shook at the death of Saʿd ibn Muʿādh.'
      ] },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The siege broke without a battle', v:'Ten thousand men, a month of it — and it ended with mistrust and weather. **Al-Aḥzāb** has its own passage in the Qurʾān.' },
        { k:'Both groups were right', v:'The ʿAṣr prayer on that road is where Muslim scholars get their licence to differ sincerely. Neither group was told off.' },
        { k:'Abū Lubābah turned himself in', v:'Nobody saw the gesture but the people he made it to. He convicted himself, in public, and would not accept release until it came from Allah.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Abū Lubābah betrayed a trust with a gesture nobody could have proved. Why did he turn himself in anyway?',
        'Two groups understood one instruction differently and both were accepted. What does that teach about disagreeing with other Muslims?',
        'Nuʿaym won a war with conversations. Can words really be that powerful — for good and for harm?',
        'Saʿd asked to live only long enough to finish one thing. If you could ask for that, what would the one thing be?'
      ],
      ponder:'They had spent a month staring across a ditch at the end of everything. It ended on a windy night, and most of them slept through the moment it broke.' },

    { t:'draw', h:'Morning after the wind',
      prompt:'Draw the view across the empty trench at dawn: churned ground, a broken tent pole, one abandoned cooking pot on its side, scattered pegs — and nobody at all. Draw the **absence** of ten thousand men.',
      ghost:'they have gone',
      tips:[
        'Scatter a handful of left-behind objects. Three or four well-chosen things beat a mess.',
        'Flat early light, long weak shadows, cold colours.',
        'Put the trench across the bottom of the frame so the reader is standing in it, looking out.'
      ],
      bank:['al-Aḥzāb','Nuʿaym','the wind','ʿAṣr','Abū Lubābah','Saʿd ibn Muʿādh'] },

    { t:'cliff', eyebrow:'And in the quiet that followed…',
      line:'A lie was started about the Prophet’s own wife, and the whole of Madīnah repeated it for a month.',
      next:'Chapter XXXIV · Beautiful Patience' }
  ]
},

/* ========================= XXXIV ========================= */
{
  title: 'Beautiful Patience',
  plate: '',
  sub: 'She was fourteen, she was innocent, and she had to wait a month in front of a whole city for Allah to say so.',
  pages: [
    { t:'splash', art:['well','sand'],
      h:'Juwayriyyah',
      p:'News came that **Banū al-Muṣṭaliq** were gathering to attack Madīnah. The Muslims reached them first at a well called al-Muraysīʿ. The fight was short. Among the captives was **Juwayriyyah**, the daughter of their chief.' },

    { t:'comic', layout:'trio', panels:[
      { art:['tent','sand'], cls:'tall',
        items:[
          { say:'I have come to ask for help buying my freedom.', who:'Juwayriyyah' },
          { cap:'He paid it himself — and asked to marry her. She agreed.' }
        ]},
      { art:['tent','dawn'],
        sfx:[{w:'set them free!', c:'sm gold', x:'54%', y:'18%', rot:-6}],
        items:[
          { cap:'When the companions heard that the whole tribe were now **relatives of the Messenger of Allah ﷺ by marriage**, they looked at the captives in their hands and could not keep them.' },
          { cap:'A hundred households were freed in an afternoon.' }
        ]},
      { art:['oasis','day'],
        items:[
          { say:'I do not know a woman who was a greater blessing to her people than she was.', who:'ʿĀʾishah' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['well','dusk'], cls:'hero span',
        sfx:[{w:'O ANṢĀR!  O MUHĀJIRŪN!', c:'mid pink', x:'8%', y:'14%', rot:-8}],
        items:[
          { cap:'On the way home, two men argued over the water at a well, and one struck the other — and instantly each called out to his own group.' },
          { say:'Leave it. It is rotten.', who:'The Prophet ﷺ', r:true }
        ]},
      { art:['tent','storm'], cls:'short',
        items:[
          { say:'When we get back to Madīnah, the more honourable will drive out the more humble.', who:'ʿAbdullāh ibn Ubayy' },
          { cap:'A young boy, **Zayd ibn Arqam**, heard him say it, and reported it — and was called a liar for it, until the Qurʾān confirmed word for word what he had heard.' }
        ]}
    ]},

    { t:'prose', kicker:'The Lost Necklace', h:'A whole army, for a borrowed thing',
      body:[
        'On that journey **ʿĀʾishah** lost a necklace she had borrowed from her sister.',
        'He stopped the entire army so people could look for it.',
        'They were camped where there was no water, and they had none with them, and the time for Fajr was coming. People started complaining to Abū Bakr about his daughter — look what she has done, she has kept the Messenger of Allah and everyone else in a waterless place over a **necklace**.',
        'Abū Bakr came in and scolded her properly. She said the Prophet ﷺ was asleep with his head on her leg while her father told her off, and she did not move, because she did not want to wake him.',
        'And then the verse of **tayammum** came down — that when there is no water, clean earth will do.',
        'And **Usayd ibn Ḥuḍayr** said to her: *“This is not the first blessing that has come to us because of you, family of Abū Bakr.”*',
        'They got up and prayed. And when they lifted the camel she had been riding, the necklace was underneath it the whole time.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['desert','dawn'], cls:'tall',
        items:[
          { cap:'On the same journey she stepped away from camp to look for it again — and came back to find the army gone. They had lifted her covered seat onto the camel without noticing she was not in it.' },
          { say:'They will come back for me. I will sit here.', who:'ʿĀʾishah', r:true }
        ]},
      { art:['desert','sand'],
        items:[
          { cap:'**Ṣafwān**, travelling behind the army, found her, made his camel kneel, and walked the whole way leading it without saying a word to her.' }
        ]},
      { art:['city','blood'],
        sfx:[{w:'whisper whisper', c:'sm pink', x:'56%', y:'18%', rot:7}],
        items:[
          { cap:'And ʿAbdullāh ibn Ubayy saw his chance, and started a story.' },
          { cap:'Madīnah repeated it for a month. Some good people repeated it too.' }
        ]}
    ]},

    { t:'prose', kicker:'A Month', h:'“I will say what Yaʿqūb said”',
      body:[
        'She did not know. She was ill, and noticed only that the kindness she was used to had gone cooler, and could not work out why.',
        'When she found out, she wept for two days and a night without stopping, until she said she felt her liver would burst.',
        'And then he came and asked her about it directly.',
        'And she looked to her father to answer for her, and he said: *“I do not know what to say.”* And to her mother, and her mother said the same.',
        'So this girl of fourteen, with her whole family unable to speak, said this:',
        '*“By Allah, I know you have heard this until it has settled in you and you believe it. If I say I am innocent — and Allah knows I am innocent — you will not believe me. And if I confess to something Allah knows I did not do, you will believe me.*',
        '*By Allah, I find no example for myself and for you except the father of Yūsuf, when he said: **beautiful patience is what I will have, and Allah is the One whose help is sought against what you describe.**”*',
        'And then she turned over and lay down facing the wall.',
        'And before anybody got up from where they were sitting, the revelation came — ten verses of **Sūrah an-Nūr**, declaring her innocence, and still recited in every corner of the earth.',
        'Her mother said: *“Get up and go to him.”*',
        'And she said: *“By Allah, I will not. I praise nobody but Allah.”*'
      ],
      ar:'فَصَبْرٌ جَمِيلٌ ۖ وَاللَّهُ الْمُسْتَعَانُ عَلَىٰ مَا تَصِفُونَ',
      arT:'“So beautiful patience. And Allah is the One whose help is sought against what you describe.” (Sūrah Yūsuf 12:18)' },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'The verses are still recited', v:'Her name is cleared in the Qurʾān, permanently, in a passage every Muslim can read. No apology in history has ever been that complete.' },
        { k:'It came with a law', v:'The same passage set the rule: **four witnesses**, or the accuser is punished. It is why rumour is treated as a serious crime in Islam, not a small sin.' },
        { k:'Abū Bakr forgave', v:'One of the people who had spread it was a poor relative he supported. He swore to stop. Then a verse came — *let them pardon and overlook; do you not love that Allah should forgive you?* — and he restored the payment at once.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'A month of being talked about with no way to defend herself. Have you ever had something untrue said about you? What did it feel like?',
        'Some sincere, good people repeated that rumour. How careful are you about passing on a story you cannot check?',
        'She said “I praise nobody but Allah” when it was over. Why do you think she answered like that?',
        'Abū Bakr restored money to a man who had slandered his own daughter. Could you?'
      ],
      ponder:'Everyone around her went quiet, including the people who loved her most. And the only sentence she could find was one a prophet had said, about his own sons, two thousand years earlier.' },

    { t:'draw', h:'Facing the wall',
      prompt:'Draw a small room from the doorway: a figure lying turned away towards the wall, a shaft of light across the floor, and three silent people seated with nothing to say. Draw the **silence**.',
      ghost:'nobody could speak',
      tips:[
        'Space the three seated figures far apart. Distance between people reads as awkwardness.',
        'One hard shaft of light and lots of soft shadow.',
        'The turned back is the most important shape on the page. Give it room.'
      ],
      bank:['Juwayriyyah','al-Muraysīʿ','tayammum','the necklace','Sūrah an-Nūr','beautiful patience'] },

    { t:'cliff', eyebrow:'In the sixth year, he had a dream…',
      line:'He dreamed he was making ṭawāf around the Kaʿbah. So fourteen hundred unarmed men set out for Makkah.',
      next:'Chapter XXXV · The Tree' }
  ]
},

/* ========================= XXXV ========================= */
{
  title: 'The Tree',
  plate: 'gold',
  sub: 'Every clause of it was against them. ʿUmar could not bear it. And Allah called it a clear victory.',
  pages: [
    { t:'splash', art:['oasis','dawn'],
      h:'Fourteen hundred, in iḥrām',
      p:'They set out for **ʿUmrah** — in iḥrām, with the animals for sacrifice walking with them, carrying nothing but a traveller’s sword in its sheath. Everything about them said: *we have come to worship, not to fight.* Quraysh blocked the road anyway.' },

    { t:'comic', layout:'trio', panels:[
      { art:['well','sand'], cls:'tall',
        items:[
          { cap:'They camped at **Ḥudaybiyyah**, and the water ran out.' },
          { cap:'He took an arrow from his quiver and put it down into the dry well — and the water came up until fourteen hundred men and their animals had drunk.' }
        ]},
      { art:['city','dusk'],
        items:[
          { cap:'He sent **ʿUthmān** into Makkah to explain that they had come in peace.' },
          { cap:'ʿUthmān did not come back. And then a rumour came out of the city that he had been killed.' }
        ]},
      { art:['oasis','deep'],
        sfx:[{w:'to the tree!', c:'mid gold', x:'10%', y:'16%', rot:-8}],
        items:[
          { cap:'He sat down under a tree, put out his hand, and fourteen hundred men came and promised — one by one — that they would not run.' },
          { cap:'It is called **Bayʿat ar-Riḍwān**, the Pledge of Allah’s Pleasure. Allah said He was pleased with the believers when they pledged to you under the tree.' }
        ]}
    ]},

    { t:'prose', kicker:'The Treaty', h:'Rub it out',
      body:[
        'ʿUthmān was alive. And Quraysh, badly rattled by what they had just heard was happening under that tree, sent **Suhayl ibn ʿAmr** to make terms.',
        'ʿAlī started writing. *“In the name of Allah, the Most Gracious, the Most Merciful.”*',
        '*“Stop. We do not know ar-Raḥmān. Write: In Your name, O Allah.”*',
        '*“Write it,”* he said.',
        'ʿAlī wrote: *“This is what Muḥammad, the Messenger of Allah, has agreed…”*',
        '*“Stop. If we believed you were the Messenger of Allah we would not have fought you. Write: Muḥammad, son of ʿAbdullāh.”*',
        'And ʿAlī said: *“By Allah, I will not rub it out.”*',
        'So he asked ʿAlī to show him where the words were — and rubbed them out himself, with his own hand.',
        'Then came the terms. **No ʿUmrah this year** — go home, come back next year for three days. **Ten years of no war.** And: **anyone who comes from Makkah to Muḥammad must be sent back. Anyone who leaves Muḥammad for Makkah will not be returned.**',
        'Every single clause was against them.'
      ] },

    { t:'comic', layout:'trio', panels:[
      { art:['tent','storm'], cls:'tall',
        items:[
          { say:'Are you not the Messenger of Allah?', who:'ʿUmar' },
          { say:'Yes.', who:'The Prophet ﷺ', r:true },
          { say:'Are we not on the truth and they on falsehood? Then why are we giving in about our religion?', who:'ʿUmar' }
        ]},
      { art:['tent','sand'],
        items:[
          { say:'I am the slave of Allah and His Messenger. I will not disobey Him, and He will not abandon me.', who:'The Prophet ﷺ' },
          { cap:'ʿUmar went to Abū Bakr and asked him the same questions, and got the same answers, in almost the same words. He spent the rest of his life doing good deeds to make up for that conversation.' }
        ]},
      { art:['tent','dusk'],
        sfx:[{w:'…nobody moved', c:'sm pink', x:'56%', y:'20%', rot:6}],
        items:[
          { say:'Get up. Sacrifice your animals, and shave your heads.', who:'The Prophet ﷺ' },
          { cap:'Nobody moved. He said it three times. Nobody moved. They were still hoping it would change.' }
        ]}
    ]},

    { t:'comic', layout:'wide-duo', panels:[
      { art:['tent','dawn'], cls:'hero span',
        items:[
          { say:'Go out. Do not say one word to any of them. Sacrifice your animal, and call your barber, and shave your head.', who:'Umm Salamah', r:true },
          { cap:'He went out, said nothing to anybody, and sacrificed his animal.' }
        ]},
      { art:['oasis','day'], cls:'short',
        items:[
          { cap:'And they got up and did it — all of them at once, so quickly that in the rush some of them were nearly shaving each other out of grief.' }
        ]}
    ]},

    { t:'prose', kicker:'On The Road Home', h:'“Is it really a victory?”',
      body:[
        'On the way back, with the army still quiet and miserable, **Sūrah al-Fatḥ** came down.',
        '*“Indeed, We have given you a clear victory.”*',
        '*“O Messenger of Allah — is it really a victory?”* asked ʿUmar.',
        '*“Yes.”*',
        'And this is what the victory turned out to be.',
        'For the first time in nineteen years, there was **peace**. People from Makkah and Madīnah could travel, trade and talk. Arabs who had only ever heard furious rumours about Islam could now walk into Madīnah and look at it themselves — the prayer, the honesty, how people treated each other.',
        'In the two years before Ḥudaybiyyah, a certain number had become Muslim.',
        'In the two years **after** it, more people entered Islam than in the **entire nineteen years** before it.',
        'Khālid ibn al-Walīd came. ʿAmr ibn al-ʿĀṣ came. The best commanders Quraysh had.',
        'ʿUmar understood it eventually. The clause that looked most humiliating — that anyone leaving Makkah must be sent back — was the one that made Quraysh themselves come and beg, within two years, to have it cancelled.'
      ],
      ar:'إِنَّا فَتَحْنَا لَكَ فَتْحًا مُّبِينًا',
      arT:'“Indeed, We have given you a clear victory.” (Sūrah al-Fatḥ 48:1)' },

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'He rubbed out his own title', v:'He let the words *Messenger of Allah* be erased from a page, because the thing he was protecting was bigger than the sentence.' },
        { k:'Umm Salamah’s advice saved the day', v:'Nobody would obey an order. She said: stop ordering, and **do it first**. It worked instantly.' },
        { k:'The tree was later removed', v:'People started visiting the spot and praying there. ʿUmar had the tree cut down, so that nobody would begin worshipping a plant.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Every clause was against them, and it turned out to be the best thing that had happened to them. Has something looked like a loss to you and turned out otherwise?',
        'ʿUmar argued hard, and then obeyed anyway. Is it alright to disagree and still follow?',
        'Umm Salamah’s advice was to lead by doing, not telling. Where could that work for you?',
        'He accepted having his title erased. When is it worth letting go of being recognised?'
      ],
      ponder:'The worst deal they ever signed opened every door they had been pushing at for nineteen years. They just could not see it for another two years.' },

    { t:'draw', h:'The erased words',
      prompt:'Draw a close-up of the treaty page, a hand resting on it, and one line smudged out — with the ghost of the erased words still faintly visible under the smudge. Draw what was rubbed out, very faintly, so the reader can still read it.',
      ghost:'Muḥammad, the Messenger of Allah',
      tips:[
        'Hand-letter the Arabic or English words in rough ink, then smudge one line.',
        'Leave the erased words just readable. That is the entire emotional content.',
        'Keep the paper warm and creased and the ink deep brown-black, not pure black.'
      ],
      bank:['Ḥudaybiyyah','the tree','ar-Riḍwān','Suhayl','al-Fatḥ','ten years'] },

    { t:'cliff', eyebrow:'And while the ink was still wet…',
      line:'A young man came stumbling into the camp in chains — and his own father was the one holding the pen.',
      next:'Chapter XXXVI · Letters to Kings' }
  ]
},

/* ========================= XXXVI ========================= */
{
  title: 'Letters to Kings',
  plate: 'light',
  sub: 'Six riders went out in six directions carrying a silver seal, to emperors who had never heard of the town they came from.',
  pages: [
    { t:'splash', art:['desert','blood'],
      h:'Abū Jandal, in chains',
      p:'While the treaty was still being written, a young man came stumbling into the Muslim camp dragging chains on his feet. It was **Abū Jandal** — the son of **Suhayl ibn ʿAmr**, the man writing the treaty for Quraysh.' },

    { t:'comic', layout:'trio', panels:[
      { art:['desert','blood'], cls:'tall',
        items:[
          { cap:'He had become Muslim. His family had chained him for it. He had escaped and thrown himself in among them.' },
          { say:'This is the first one you give back to me under our agreement.', who:'Suhayl', r:true }
        ]},
      { art:['tent','storm'],
        items:[
          { say:'Let him stay. As a favour to me. Just this one.', who:'The Prophet ﷺ' },
          { say:'Then there is no treaty.', who:'Suhayl', r:true }
        ]},
      { art:['desert','dusk'],
        items:[
          { say:'Be patient, Abū Jandal, and count on the reward. Allah will make a way out for you and for those with you.', who:'The Prophet ﷺ' },
          { cap:'They watched him dragged back towards Makkah. Some of them could not watch.' }
        ]}
    ]},

    { t:'prose', kicker:'By The Sea', h:'The loophole nobody had thought about',
      body:[
        'Not long after, another young Muslim, **Abū Baṣīr**, escaped from Makkah and walked all the way to Madīnah. Quraysh sent two men for him, and the Prophet ﷺ — who had given his word — handed him over.',
        'On the road, Abū Baṣīr got away from his guards. And he worked something out.',
        'If he went back to Madīnah, he would simply be handed over again. So he did not go back. He went to the **seashore** — on the coast road that every Quraysh caravan from Makkah to Shām had to use.',
        'And Abū Jandal heard about it, and escaped, and joined him. And so did another. And another. About seventy of them in the end, living in a camp on the coast that belonged to nobody and answered to no treaty.',
        'And no Quraysh caravan got past them.',
        'Until Quraysh sent a letter to Madīnah — not a demand this time, a **request** — begging the Prophet ﷺ, for the sake of family ties, to take those men into Madīnah where he could control them, and to please, please cancel the clause they had insisted on themselves.',
        'The condition that had looked like the most humiliating in the whole treaty was dropped within two years, at the request of the people who wrote it.'
      ] },

    { t:'comic', layout:'wide-duo', panels:[
      { art:['scroll','sand'], cls:'hero span',
        items:[
          { cap:'With peace at home, he turned outward. Kings would not read an unsealed letter, so a silver ring was made with three lines on it:' },
          { say:'Allāh  /  Rasūl  /  Muḥammad', who:'The seal' },
          { cap:'Read upwards: **Muḥammad, the Messenger of Allah.**' }
        ]},
      { art:['road','dawn'], cls:'short',
        items:[
          { cap:'**Diḥyah al-Kalbī** to Heraclius of Rome. **ʿAbdullāh ibn Ḥudhāfah** to Kisrā of Persia. **Ḥāṭib ibn Abī Baltaʿah** to al-Muqawqis of Egypt. And more, riding out in every direction at once.' }
        ]}
    ]},

    { t:'comic', layout:'trio', panels:[
      { art:['fort','day'], cls:'tall',
        items:[
          { cap:'The letter reached **Heraclius** in Jerusalem. He wanted to know more, and called for any Arabs in the city.' },
          { cap:'By chance, **Abū Sufyān** — still an enemy — was there trading. He was brought in, with his companions placed behind him.' },
          { say:'If he lies to me, tell me.', who:'Heraclius', r:true }
        ]},
      { art:['fort','sand'],
        items:[
          { say:'Is his family noble? — Yes.  Has he ever lied? — Never.  Do his followers increase or decrease? — They increase.  Does anyone leave his religion out of dislike for it? — No.  Has he ever broken an agreement? — No.', who:'The questions' },
          { say:'I would have lied about him, if I had not been ashamed that my companions would report it.', who:'Abū Sufyān', r:true }
        ]},
      { art:['fort','dusk'],
        items:[
          { say:'If what you say is true, he will own the ground beneath my feet. I knew he was coming. I did not know he would be one of you.', who:'Heraclius' },
          { cap:'His commanders made so much noise about it that he backed down, and said he had only been testing their loyalty.' }
        ]}
    ]},

    { t:'fact', h:'Three things to hold on to',
      facts:[
        { k:'Kisrā tore it up', v:'The emperor of Persia ripped the letter to pieces. When he was told, the Prophet ﷺ said: *“May Allah tear up his kingdom.”* Within a few years it was gone.' },
        { k:'Abū Sufyān told the truth against himself', v:'He could have lied about his worst enemy to the emperor of Rome. He did not, because his friends were standing behind him. **People behave better when someone is watching.**' },
        { k:'Abū Baṣīr never came in', v:'He died in that camp by the sea, with the letter from Madīnah — the one finally inviting them in — in his hand.' }
      ] },

    { t:'reflect', h:'Pause here',
      qs:[
        'Abū Jandal was sent back in chains to keep a promise. Was that the right thing? Argue both sides properly before deciding.',
        'The clause that hurt most became the one that won most. What does that suggest about judging a situation too early?',
        'Abū Sufyān told the truth because his friends were listening. Who makes **you** behave better?',
        'Heraclius believed it and backed down anyway. What stops people acting on what they know?'
      ],
      ponder:'A man in a town of mud houses sent letters to the two superpowers of the world, as though it were a perfectly normal thing to do. Within thirty years, one of those empires was gone and the other had lost half its territory.' },

    { t:'draw', h:'The seal',
      prompt:'Draw the silver ring pressed into hot wax on a folded letter, close up — three lines of writing in the seal, one drop of wax still running. Behind it, out of focus, the backs of riders leaving in different directions.',
      ghost:'three lines of silver',
      tips:[
        'A big close-up object in sharp focus with tiny blurred figures behind it is a classic comic trick. Use it.',
        'Make the wax red and everything else brown, grey and sand. One hot colour only.',
        'Riders going different ways — not all one direction. That is the whole point of the page.'
      ],
      bank:['Abū Jandal','Abū Baṣīr','the seal','Heraclius','Kisrā','al-Muqawqis'] },

    { t:'cliff', eyebrow:'End of Book Four',
      line:'There was peace now, and a fortress to the north where the men who had raised ten thousand against him were still planning.',
      next:'Book Five · The Gates Open' }
  ]
}

]};
