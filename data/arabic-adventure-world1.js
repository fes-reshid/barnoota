/* =====================================================================
 * Arabic Adventure — World 1 curriculum database ("Letter Garden")
 * ---------------------------------------------------------------------
 * Adapted from the learning progression of the source picture book
 * "My First Arabic Book" (Ingilizce Arapca Ogreniyorum 1), IBS
 * Publications / Erkam Publishing. Every letter, word and sourcePages
 * entry below was verified by visually inspecting the corresponding
 * pages of that PDF page-by-page — nothing here is invented. sourcePages
 * gives the PDF's own page index (1 = first page of the file).
 *
 * This file supplies ORIGINAL text, groupings, objectives and activity
 * definitions for the Arabic Adventure game engine (arabic-adventure.html).
 * No text, art or wording is copied from the source book — only the
 * teaching progression (letter order, target word per letter, themed
 * vocabulary sets) is reused, per the project's original-content policy.
 * ===================================================================== */
(function(global){

  var SOURCE_BOOK = 'My First Arabic Book (Ingilizce Arapca Ogreniyorum 1)';

  /* Each letter's vocabulary picture is shown with a matching emoji.
     "tail" (ذيل) has no faithful single emoji, so it uses a small
     original inline-SVG icon instead — see ICONS.tail in the app. */
  var LETTERS = [
    { letter:'ا', name:'أَلِف', translit:'Alif',  word:'أَرْنَبٌ', wordTranslit:'arnabun',   english:'rabbit',   emoji:'🐰', sourcePages:[6,7] },
    { letter:'ب', name:'بَاء',  translit:'Ba',    word:'بَيْتٌ',   wordTranslit:'baitun',    english:'house',    emoji:'🏠', sourcePages:[8,9] },
    { letter:'ت', name:'تَاء',  translit:'Ta',    word:'تُفَّاحَةٌ', wordTranslit:'tuffaahatun', english:'apple',  emoji:'🍎', sourcePages:[10,11] },
    { letter:'ث', name:'ثَاء',  translit:'Tha',   word:'ثَوْبٌ',   wordTranslit:'thaubun',   english:'dress',    emoji:'👗', sourcePages:[12,13] },

    { letter:'ج', name:'جِيم',  translit:'Jeem',  word:'جَمَلٌ',   wordTranslit:'jamalun',   english:'camel',    emoji:'🐪', sourcePages:[16,17] },
    { letter:'ح', name:'حَاء',  translit:'Ha',    word:'حِمَارٌ',  wordTranslit:'himaarun',  english:'donkey',   emoji:'🫏', sourcePages:[18,19] },
    { letter:'خ', name:'خَاء',  translit:'Kha',   word:'خُبْزٌ',   wordTranslit:'khubzun',   english:'bread',    emoji:'🍞', sourcePages:[20,21] },
    { letter:'د', name:'دَال',  translit:'Daal',  word:'دِيكٌ',    wordTranslit:'diikun',    english:'rooster',  emoji:'🐓', sourcePages:[22,23] },

    { letter:'ذ', name:'ذَال',  translit:'Dhaal', word:'ذَيْلٌ',   wordTranslit:'dhailun',   english:'tail',     emoji:'ICON:tail', sourcePages:[26,27] },
    { letter:'ر', name:'رَاء',  translit:'Ra',    word:'رِيشٌ',    wordTranslit:'riishun',   english:'feather',  emoji:'🪶', sourcePages:[28,29] },
    { letter:'ز', name:'زَاي',  translit:'Za',    word:'زَهْرَةٌ', wordTranslit:'zahratun',  english:'flower',   emoji:'🌸', sourcePages:[30,31] },
    { letter:'س', name:'سِين',  translit:'Seen',  word:'سَيَّارَةٌ', wordTranslit:'sayyaratun', english:'car',    emoji:'🚗', sourcePages:[32,33] },

    { letter:'ش', name:'شِين',  translit:'Sheen', word:'شَجَرَةٌ', wordTranslit:'shajaratun', english:'tree',   emoji:'🌳', sourcePages:[36,37] },
    { letter:'ص', name:'صَاد',  translit:'Swaad', word:'صُنْدُوقٌ', wordTranslit:'sunduuqun', english:'box',    emoji:'📦', sourcePages:[38,39] },
    { letter:'ض', name:'ضَاد',  translit:'Dhwaad', word:'ضِفْدَعٌ', wordTranslit:'dhwifdaun', english:'frog',   emoji:'🐸', sourcePages:[40,41] },
    { letter:'ط', name:'طَاء',  translit:'Twaa',  word:'طَائِرٌ',  wordTranslit:'twayrun',   english:'bird',     emoji:'🐦', sourcePages:[42,43] },

    { letter:'ظ', name:'ظَاء',  translit:'Dhwa',  word:'ظَرْفٌ',   wordTranslit:'dhwarfun',  english:'envelope', emoji:'✉️', sourcePages:[46,47] },
    { letter:'ع', name:'عَيْن',  translit:'Ain',   word:'عَيْنٌ',   wordTranslit:'ainun',     english:'eye',      emoji:'👁️', sourcePages:[48,49] },
    { letter:'غ', name:'غَيْن',  translit:'Ghain', word:'غَزَالٌ',  wordTranslit:'ghazaalun', english:'gazelle',  emoji:'🦌', sourcePages:[50,51] },
    { letter:'ف', name:'فَاء',  translit:'Fa',    word:'فَمٌ',     wordTranslit:'famun',     english:'mouth',    emoji:'👄', sourcePages:[52,53] },

    { letter:'ق', name:'قَاف',  translit:'Qaaf',  word:'قَلَمٌ',   wordTranslit:'qalamun',   english:'pen',      emoji:'🖊️', sourcePages:[56,57] },
    { letter:'ك', name:'كَاف',  translit:'Kaaf',  word:'كُرْسِيٌّ', wordTranslit:'kursiyyun', english:'chair',   emoji:'🪑', sourcePages:[58,59] },
    { letter:'ل', name:'لاَم',  translit:'Laam',  word:'لِسَانٌ',  wordTranslit:'lisaanun',  english:'tongue',   emoji:'👅', sourcePages:[60,61] },
    { letter:'م', name:'مِيم',  translit:'Meem',  word:'مَوْزٌ',   wordTranslit:'mawzun',    english:'banana',   emoji:'🍌', sourcePages:[62,63] },
    { letter:'ن', name:'نُون',  translit:'Noon',  word:'نَجْمٌ',   wordTranslit:'najmun',    english:'star',     emoji:'⭐', sourcePages:[64,65] },

    { letter:'و', name:'وَاو',  translit:'Waw',   word:'وَجْهٌ',   wordTranslit:'wajhun',    english:'face',     emoji:'😊', sourcePages:[68,69] },
    { letter:'ه', name:'هَاء',  translit:'Ha',    word:'هِرَّةٌ',  wordTranslit:'hirratun',  english:'cat',      emoji:'🐱', sourcePages:[70,71] },
    { letter:'ي', name:'يَاء',  translit:'Ya',    word:'يَدٌ',     wordTranslit:'yadun',     english:'hand',     emoji:'✋', sourcePages:[74,75] }
  ];

  /* Groups mirror the book's own rhythm: a run of letters, then the
     review / matching pages that immediately follow them in the PDF. */
  var GROUPS = [
    { id:'g1', title:'First Seeds',     icon:'🌱', letters:['ا','ب','ت','ث'],         reviewPages:[14,15], storyAfter:'rabbit_house' },
    { id:'g2', title:'Camel Trail',     icon:'🐪', letters:['ج','ح','خ','د'],         reviewPages:[24,25] },
    { id:'g3', title:'Flower Field',    icon:'🌸', letters:['ذ','ر','ز','س'],         reviewPages:[35],   vocabModule:'classroom' },
    { id:'g4', title:'Tree House',      icon:'🌳', letters:['ش','ص','ض','ط'],         reviewPages:[44,45] },
    { id:'g5', title:'Butterfly Meadow', icon:'🦋', letters:['ظ','ع','غ','ف'],        reviewPages:[54],   vocabModule:'fruits' },
    { id:'g6', title:'Pond Path',       icon:'🐸', letters:['ق','ك','ل','م','ن'],     reviewPages:[67],   vocabModule:'toys' },
    { id:'g7', title:'Sunny Yard',      icon:'🌞', letters:['و','ه','ي'],             reviewPages:[76,77], vocabModule:'body' },
    { id:'g8', title:'Garden Challenge', icon:'🏆', letters:[],                        reviewPages:[90,95], vocabModule:'colours', finalChallenge:true }
  ];

  /* Themed vocabulary modules — bonus mini-lessons that appear between
     letter groups in the book (each is one real page, verified). */
  var VOCAB_MODULES = {
    classroom: { title:'Classroom', sourcePages:[34], words:[
      { word:'طَاوِلَةٌ', translit:'twaawilatun', english:'table',  emoji:'<svg viewBox="0 0 100 100" width="64" height="64"><rect x="15" y="35" width="70" height="10" rx="2" fill="#caa06b" stroke="#8a6a42" stroke-width="2"/><rect x="20" y="45" width="6" height="35" fill="#8a6a42"/><rect x="74" y="45" width="6" height="35" fill="#8a6a42"/></svg>' },
      { word:'سَبُّورَةٌ', translit:'sabburatun',  english:'blackboard', emoji:'🖼️' },
      { word:'كِتَابٌ',   translit:'kitaabun',    english:'book',   emoji:'📖' },
      { word:'قَلَمٌ',    translit:'qalamun',     english:'pen',    emoji:'🖊️' },
      { word:'كُرْسِيٌّ',  translit:'kursiyyun',   english:'chair',  emoji:'🪑' },
      { word:'مَائِدَةٌ',  translit:'maaidatun',   english:'desk',   emoji:'🗄️' }
    ]},
    fruits: { title:'Fruits', sourcePages:[55], words:[
      { word:'مَوْزَةٌ',    translit:'mawzatun',     english:'banana',    emoji:'🍌' },
      { word:'تُفَّاحَةٌ',  translit:'tuffaahatun',  english:'apple',     emoji:'🍎' },
      { word:'عِنَبٌ',     translit:'inabun',       english:'grapes',    emoji:'🍇' },
      { word:'بُرْتُقَالَةٌ', translit:'burtuqaalatun', english:'orange',  emoji:'🍊' },
      { word:'أَنَانَاسٌ',  translit:'anaanaasun',   english:'pineapple', emoji:'🍍' },
      { word:'مَنْجَا',    translit:'manjaa',       english:'mango',     emoji:'🥭' }
    ]},
    toys: { title:'Toys', sourcePages:[66], words:[
      { word:'كُرَةٌ',     translit:'kuratun',     english:'ball',    emoji:'⚽' },
      { word:'قِطَارٌ',    translit:'qitwaarun',   english:'train',   emoji:'🚂' },
      { word:'دُبٌّ',      translit:'dubbun',      english:'teddy bear', emoji:'🧸' },
      { word:'عَرُوسَةٌ',  translit:'aruusa',      english:'doll',    emoji:'🪆' },
      { word:'دَرَّاجَةٌ',  translit:'darraajatun', english:'bicycle', emoji:'🚲' },
      { word:'طَائِرَةٌ',  translit:'twaairatun',  english:'plane',   emoji:'✈️' }
    ]},
    body: { title:'My Body', sourcePages:[78], words:[
      { word:'رِجْلٌ',    translit:'rijlun',   english:'foot',  emoji:'🦶' },
      { word:'رَأْسٌ',    translit:'raasun',   english:'head',  emoji:'🙂' },
      { word:'أُذُنٌ',    translit:'udhunun',  english:'ear',   emoji:'👂' },
      { word:'أَنْفٌ',    translit:'anfun',    english:'nose',  emoji:'👃' },
      { word:'أَسْنَانٌ',  translit:'asnaanun', english:'teeth', emoji:'🦷' },
      { word:'شَعْرٌ',    translit:'sha\'arun', english:'hair',  emoji:'💇' }
    ]},
    colours: { title:'Colours', sourcePages:[83], words:[
      { word:'أَسْوَدُ',  translit:'aswadu',  english:'black',  emoji:'⚫' },
      { word:'أَحْمَرُ',  translit:'ahmaru',  english:'red',    emoji:'🔴' },
      { word:'أَزْرَقُ',  translit:'azraqu',  english:'blue',   emoji:'🔵' },
      { word:'أَبْيَضُ',  translit:'abyadu',  english:'white',  emoji:'⚪' },
      { word:'أَخْضَرُ',  translit:'akhdharu', english:'green', emoji:'🟢' },
      { word:'أَصْفَرُ',  translit:'asfaru',  english:'yellow', emoji:'🟡' }
    ]}
  };

  /* Letters that are easy to visually confuse — used to build harder
     "Find the letter" distractor sets (dots / body-shape look-alikes). */
  var LOOKALIKES = {
    'ب':['ت','ث','ن','ي'], 'ت':['ب','ث','ن'], 'ث':['ب','ت','ن'],
    'ج':['ح','خ'], 'ح':['ج','خ'], 'خ':['ج','ح'],
    'د':['ذ'], 'ذ':['د'],
    'ر':['ز'], 'ز':['ر'],
    'س':['ش'], 'ش':['س'],
    'ص':['ض'], 'ض':['ص'],
    'ط':['ظ'], 'ظ':['ط'],
    'ع':['غ'], 'غ':['ع'],
    'ف':['ق'], 'ق':['ف'],
    'ه':['ح'], 'و':['ر'],
    'ن':['ب','ت','ث'], 'ي':['ب','ت','ث']
  };

  /* Original short stories (not from the source book) built only from
     vocabulary the child has already met, per the project's "stories use
     only learned words" rule. Level A/B per the design: one word per
     picture, then short two-to-three word sentences. */
  var STORIES = {
    rabbit_house: {
      title:'The Rabbit\'s House',
      titleAr:'بَيْتُ الْأَرْنَبِ',
      unlockAfterGroup:'g1',
      pages:[
        { text:'هَذَا أَرْنَبٌ.', words:['هَذَا','أَرْنَبٌ'], emoji:'🐰', question:null },
        { text:'لِلْأَرْنَبِ بَيْتٌ.', words:['لِلْأَرْنَبِ','بَيْتٌ'], emoji:'🏠', question:null },
        { text:'فِي الْبَيْتِ تُفَّاحَةٌ.', words:['فِي','الْبَيْتِ','تُفَّاحَةٌ'], emoji:'🍎', question:null },
        { text:'وَلِلْأَرْنَبِ ثَوْبٌ جَمِيلٌ!', words:['وَلِلْأَرْنَبِ','ثَوْبٌ','جَمِيلٌ'], emoji:'👗',
          question:{ prompt:'Who lives in the house?', options:[
            { emoji:'🐰', correct:true }, { emoji:'🐪', correct:false }, { emoji:'🐱', correct:false }
          ]}
        }
      ]
    }
  };

  global.ARABIC_ADVENTURE_WORLD1 = {
    sourceBook: SOURCE_BOOK,
    letters: LETTERS,
    groups: GROUPS,
    vocabModules: VOCAB_MODULES,
    lookalikes: LOOKALIKES,
    stories: STORIES
  };

})(window);
