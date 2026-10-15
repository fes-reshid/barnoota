/* Seeraa living world.
   1. Living maps: people, camels, goats and sheep walk the roads of each
      painted scene (smaller far away), goats wander on the mountains, birds
      cross the sky and gusts of sand blow over the desert maps. Each map has
      its own mix. Figures sit behind the stops and never catch taps.
   2. Story scenes beside their lesson's stop and at the top of its story:
      the Year of the Elephant (Sūrat al-Fīl) on Map 1, and the Hijrah on
      Map 9 — the two camels with a light above them (no riders shown) and
      Surāqah on his horse, whose legs sink into the sand.
   3. The lesson story looks like the Extra story panel, and the lesson steps
      look like game tiles.
   The Prophet ﷺ and Abū Bakr are never drawn — only their camels. */
(function(){
const reduced=()=>window.SeeraaMotion?window.SeeraaMotion.paused():matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?2*t*t:1-Math.pow(2-2*t,2)/2;

/* ---------- figures (facing right, feet at 0,0) ---------- */
const SKIN=['#c68e5f','#a9714b','#8d5a3b','#d7a57a'];
function personSvg(o){
 const robe=o.robe||'#e9dcc2',wrap=o.wrap||'#f4efe2',skin=o.skin||SKIN[0],woman=o.woman;
 const load=o.load==='basket'?'<path d="M-6-52h12l-2 6h-8z" fill="#a0743f" stroke="#6d4a26" stroke-width=".8"/>':o.load==='bundle'?'<rect x="-13" y="-36" width="8" height="13" rx="3" fill="#9b7a54"/>':o.load==='staff'?'<line x1="10" y1="-40" x2="14" y2="0" stroke="#6d4a26" stroke-width="2"/>':'';
 return `<g class="lw-legs"><line class="lw-leg a" x1="-2.5" y1="-15" x2="-3" y2="0"/><line class="lw-leg b" x1="2.5" y1="-15" x2="3" y2="0"/></g>`
  +`<path d="M-8-${woman?5:12} L-6-35 Q0-38 6-35 L${woman?9:8}-${woman?5:12} Z" fill="${robe}" stroke="#00000022" stroke-width=".8"/>`
  +`<line class="lw-arm" x1="5" y1="-31" x2="9" y2="-19" stroke="${robe}" stroke-width="4" stroke-linecap="round"/>`
  +(woman?`<path d="M-7-36 Q-8-50 0-50 Q8-50 7-36 Q8-30 0-31 Q-8-30-7-36Z" fill="${wrap}"/><circle cx="2.5" cy="-42" r="3.6" fill="${skin}"/>`
         :`<circle cx="0" cy="-42" r="5.6" fill="${skin}"/><path d="M-7-41 Q-7-50 0-50 Q7-50 7-43 L8-37 Q4-39 2-42 L-1-42 Q-4-40-8-37Z" fill="${wrap}"/><path d="M-7-44 Q0-47 7-44" stroke="#00000030" fill="none" stroke-width="1.2"/>`)
  +load;
}
function camelSvg(o){
 const c=o.color||'#c79a63',d=o.dark||'#9c7445',saddle=o.saddle||'#9b2f2a';
 const bags=o.load?`<rect x="-16" y="-44" width="9" height="13" rx="2" fill="#7c5a37" stroke="#4f3820" stroke-width=".8"/><rect x="7" y="-44" width="9" height="13" rx="2" fill="#866041" stroke="#4f3820" stroke-width=".8"/>`:'';
 return `<g class="lw-legs"><line class="lw-leg a" x1="-15" y1="-27" x2="-16" y2="0"/><line class="lw-leg b" x1="-9" y1="-27" x2="-8" y2="0"/><line class="lw-leg b" x1="12" y1="-27" x2="11" y2="0"/><line class="lw-leg a" x1="18" y1="-27" x2="19" y2="0"/></g>`
  +`<path d="M-24-32q-5 4-3 11" stroke="${d}" fill="none" stroke-width="2"/>`
  +`<path d="M-25-29 Q-24-45-10-46 Q-3-60 6-47 Q15-45 20-35 L23-31 Q10-24-21-25Z" fill="${c}" stroke="${d}" stroke-width=".8"/>`
  +`<path d="M17-35 Q29-38 30-52 Q31-60 37-59 L42-56 Q44-52 39-52 Q35-51 35-45 Q33-31 22-28Z" fill="${c}" stroke="${d}" stroke-width=".8"/>`
  +`<circle cx="38" cy="-56" r=".9" fill="#3a2a1a"/>`
  +`<path d="M-11-45 Q-2-55 9-46 L8-39 Q-1-42-10-39Z" fill="${saddle}"/><path d="M-11-45 Q-2-55 9-46" stroke="#e4b85a" fill="none" stroke-width="1.2"/>`+bags;
}
function goatSvg(o){
 const c=o.color||'#e8e1d2',d=o.dark||'#7d6a52',sheep=o.sheep;
 return `<g class="lw-legs"><line class="lw-leg a" x1="-6" y1="-8" x2="-6.5" y2="0"/><line class="lw-leg b" x1="-3" y1="-8" x2="-2.5" y2="0"/><line class="lw-leg b" x1="4" y1="-8" x2="3.5" y2="0"/><line class="lw-leg a" x1="7" y1="-8" x2="7.5" y2="0"/></g>`
  +(sheep?`<path d="M-10-10 q-1-6 4-7 q3-4 7-1 q5-2 7 3 q4 3 0 7 q-3 3-8 2 q-6 2-10-4Z" fill="${c}" stroke="#00000025" stroke-width=".7"/><path d="M8-12 l6-3 q2 2 0 6 l-5 1Z" fill="${d}"/>`
         :`<ellipse cx="0" cy="-11" rx="9.5" ry="5" fill="${c}" stroke="#00000025" stroke-width=".7"/><path d="M7-13 L13-18 Q15.5-16 14.5-12 L9-9Z" fill="${c}" stroke="#00000025" stroke-width=".7"/><path d="M12-18q-2-5-6-6" stroke="${d}" fill="none" stroke-width="1.4"/><path d="M-9-13l-3-3" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`);
}
function birdSvg(){return `<path class="lw-wing" d="M-9 0Q-4-6 0 0Q4-6 9 0" stroke="#3b2f25" fill="none" stroke-width="1.8" stroke-linecap="round"/>`}

/* ---------- where things walk, per painted scene (fractions of the picture) ---------- */
/* Each lane: points along a road or slope. Kinds: p person, w woman, c camel,
   cl camel with goods, g goat, s sheep. */
const LANES={
 badr:{roads:[[[.04,1],[.10,.88],[.17,.79],[.29,.72],[.46,.68],[.62,.64],[.75,.59],[.79,.54],[.77,.50],[.73,.46],[.78,.425],[.835,.40]],[[.08,.66],[.26,.66],[.44,.62]],[[.35,.80],[.50,.78],[.62,.74]]],
  yards:[[.40,.72],[.60,.70],[.30,.64],[.70,.56]],hills:[[[.16,.25],[.22,.22]],[[.48,.24],[.58,.23]]],dusty:1},
 'uhud-v2':{roads:[[[.08,1],[.15,.88],[.24,.80],[.29,.72],[.40,.66],[.49,.63],[.52,.58],[.65,.54],[.79,.515],[.91,.485]],[[.15,.55],[.26,.56],[.37,.57]],[[.25,.68],[.40,.71],[.55,.72]]],
  yards:[[.30,.70],[.50,.72],[.45,.55],[.65,.60]],hills:[[[.73,.40],[.81,.36],[.86,.43]],[[.45,.18],[.53,.15]]],dusty:1},
 makkah:{roads:[[[.62,1],[.60,.88],[.565,.78],[.545,.70],[.57,.62],[.60,.56],[.635,.50],[.66,.445],[.69,.39],[.72,.345]],[[.41,.67],[.47,.64],[.56,.65]],[[.95,.33],[.80,.35],[.66,.34]],[[.40,.64],[.36,.56],[.29,.45],[.24,.33]],[[.50,.96],[.60,.94],[.68,.92]]],
  yards:[[.66,.86],[.47,.64],[.88,.35],[.63,.44],[.28,.42]],hills:[[[.47,.14],[.55,.12],[.62,.15]],[[.80,.09],[.88,.07],[.95,.10]],[[.05,.13],[.12,.12]]],dusty:1,kaaba:[.794,.292,.082,.03,.722,.866,.17],
  ridges:[[.03,.12],[.07,.135],[.11,.145],[.24,.14],[.28,.13],[.33,.125],[.37,.135],[.44,.165],[.50,.14],[.53,.13],[.56,.12],[.59,.115],[.62,.125],[.52,.155],[.57,.15],[.61,.155],[.65,.14],[.67,.15],[.70,.105],[.73,.095],[.76,.09],[.79,.085],[.82,.09],[.86,.095],[.89,.11],[.92,.12]]},
 hira:{roads:[[[.72,1],[.70,.86],[.65,.75],[.56,.65],[.50,.56],[.49,.48],[.50,.42],[.55,.36],[.59,.31],[.61,.26]],[[.26,.63],[.36,.66],[.48,.67],[.58,.66]],[[.60,.95],[.75,.92],[.90,.93]]],
  yards:[[.82,.86],[.40,.66],[.62,.72],[.52,.50]],hills:[[[.62,.27],[.70,.24],[.77,.27]],[[.40,.33],[.46,.30]],[[.84,.22],[.90,.25]]],dusty:1},
 madinah:{roads:[[[.70,1],[.62,.88],[.585,.76],[.565,.64],[.54,.55],[.47,.47],[.42,.41],[.37,.35],[.33,.30]],[[.50,.47],[.60,.46],[.70,.45]],[[.80,.97],[.72,.86],[.66,.76]]],
  yards:[[.74,.92],[.52,.52],[.62,.47],[.38,.38],[.62,.70]],hills:[[[.20,.09],[.30,.08]],[[.62,.10],[.70,.11]],[[.88,.09],[.95,.10]]]},
 taif:{roads:[[[.62,1],[.58,.90],[.53,.80],[.50,.70],[.50,.60],[.54,.50],[.57,.45],[.555,.40],[.555,.35]],[[.47,.90],[.52,.78],[.45,.66]]],
  yards:[[.56,.86],[.48,.66],[.55,.52]],hills:[[[.74,.14],[.80,.12]],[[.30,.12],[.38,.11]],[[.92,.20],[.97,.18]]]},
 abyssinia:{roads:[[[.57,1],[.56,.90],[.53,.80],[.47,.70],[.46,.60],[.48,.50],[.47,.45],[.47,.41]],[[.40,.78],[.48,.76],[.62,.78]]],
  yards:[[.50,.86],[.44,.62],[.60,.74]],hills:[[[.38,.26],[.47,.24]],[[.20,.22],[.28,.20]],[[.86,.14],[.92,.13]]]},
 hijrah:{roads:[[[.65,1],[.62,.86],[.59,.75],[.57,.65],[.54,.57],[.47,.50],[.39,.44],[.31,.38],[.24,.32],[.19,.28]],[[.57,.65],[.55,.57],[.60,.52],[.66,.48],[.67,.44],[.62,.40],[.57,.37],[.54,.34]],[[.40,.88],[.45,.86],[.62,.88],[.80,.92]]],
  yards:[[.70,.82],[.47,.72],[.33,.40],[.52,.48],[.75,.93]],hills:[[[.22,.28],[.30,.26]],[[.40,.10],[.48,.09]],[[.76,.11],[.84,.10]]],dusty:1},
 uhud:{roads:[[[.55,1],[.55,.86],[.545,.75],[.56,.66],[.60,.57],[.625,.52],[.60,.49],[.53,.455],[.44,.42],[.37,.39],[.35,.35],[.34,.32]],[[.40,.63],[.48,.64],[.62,.66]],[[.40,.90],[.52,.93],[.66,.90]]],
  yards:[[.45,.80],[.62,.60],[.40,.50],[.66,.88]],hills:[[[.74,.29],[.82,.32]],[[.48,.12],[.56,.10],[.64,.13]],[[.86,.15],[.93,.17]]],dusty:1},
 tabuk:{roads:[[[.50,1],[.52,.86],[.53,.75],[.49,.65],[.45,.56],[.435,.48],[.45,.42],[.48,.38],[.49,.35]],[[.40,.78],[.50,.74],[.60,.73]],[[.40,.93],[.55,.95],[.68,.92]]],
  yards:[[.47,.82],[.62,.68],[.46,.56],[.58,.90]],hills:[[[.86,.12],[.92,.10]],[[.30,.15],[.38,.13]],[[.06,.14],[.12,.12]]],dusty:1}
};
/* What walks on each of the 31 maps. */
const MAP_LIFE=[
 {road:['cl','p','w','cl','p'],hill:['g','g','g'],birds:3},            // 1 Arabia: traders' caravan
 {road:['p','w','p','c','g'],hill:['g','g'],birds:2},                  // 2 The Prophet's family
 {road:['g'],hill:['g','g'],birds:2},                                  // 3 Year of the Elephant: the people watch from the mountains, the army has its own scene
 {road:['p','w','w','p','c'],hill:['g','g'],birds:3},                  // 4 A blessed birth
 {road:['s','s','w','s','s','g','p'],hill:['g','g','g'],birds:2},      // 5 Desert of Banū Saʿd: flocks
 {road:['cl','cl','p','cl','c'],hill:['g','g'],birds:2},               // 6 The caravan road to Shām
 {road:['cl','p','w','p','cl','w'],hill:['g'],birds:2},                // 7 Trade and marriage: market
 {road:['p','w','p','c'],hill:['g','g'],birds:3},                      // 8 Before the message
 {road:['p','g','g','w'],hill:['g','g','g','g'],birds:4},              // 9 Ḥirāʾ: goats on the mountain
 {road:['p','w','p'],hill:['g','g'],birds:2},                          // 10 The first believers
 {road:['p','w','p','p','c'],hill:['g','g'],birds:2},                  // 11 The call in the open
 {road:['p','p','w'],hill:['g'],birds:1},                              // 12 The burning plain
 {road:['p','w','p','c'],hill:['g','g'],birds:3},                      // 13 Abyssinia
 {road:['p','w','p','w','p'],hill:['g','g'],birds:3},                  // 14 Around the Kaʿbah
 {road:['p','w'],hill:['g','g'],birds:1},                              // 15 The boycott valley
 {road:['p','w','s','s','p'],hill:['g','g','g'],birds:3},              // 16 Ṭāʾif: gardens and flocks
 {road:['p'],hill:[],birds:0},                                         // 17 Night Journey
 {road:['p','w','p','c','cl','p'],hill:['g','g'],birds:2},             // 18 Minā at Ḥajj
 {road:['p','p'],hill:['g'],birds:0},                                  // 19 ʿAqabah at night
 {road:['p','c'],hill:[],birds:0},                                     // 20 Leaving Makkah at night
 {road:['p','g','g'],hill:['g','g'],birds:2},                          // 21 Hijrah (its two camels have their own scene)
 {road:['g','w'],hill:['g','g'],birds:3},                          // 22 Qubāʾ and Madīnah (the welcome has its own scene)
 {road:['p','w','cl','p','w'],hill:['g'],birds:3},                     // 23 The masjid and the market
 {road:['p','w','s','s','p'],hill:['g','g'],birds:4},                  // 24 Palm gardens
 {road:['c'],hill:['g'],birds:2},                                  // 25 Badr (the battle has its own scene)
 {road:['c'],hill:['g','g','g'],birds:2},                          // 26 Uḥud (the battle has its own scene)
 {road:['p','p','w','c','s'],hill:['g','g'],birds:2},                  // 27 The Trench
 {road:['g'],hill:['g','g'],birds:2},                              // 28 Ḥudaybiyyah (the camp has its own scene)
 {road:['p','cl','p','c','g'],hill:['g','g'],birds:2},                 // 29 Khaybar
 {road:['w'],hill:['g','g'],birds:3},                              // 30 Makkah opens its gates (the march has its own scene)
 {road:['p','w','p','c','g'],hill:['g','g'],birds:3}                   // 31 The final years
];
/* More life on each map: extra people, small herds (g goats, s sheep, h hens) and people walking
   around the Kaʿbah (ṭawāf) on the Makkah maps where it can be seen. */
const MAP_MORE=[
 {crowd:4,herd:'g3 h3'},{crowd:6,herd:'g2 h4',tawaf:20},{crowd:0,herd:'g2',watch:30},{crowd:5,herd:'g3 h5',tawaf:12},
 {crowd:3,herd:'s6 g4 h3'},{crowd:4,herd:'g2 h3'},{crowd:8,herd:'h4 g2',tawaf:12},{crowd:6,herd:'g2 h3',tawaf:8},
 {crowd:3,herd:'g4 h3'},{crowd:5,herd:'h4 g2',tawaf:12},{crowd:7,herd:'g2 h3',tawaf:12},{crowd:4,herd:'g2',tawaf:10},
 {crowd:6,herd:'g3 h5 s3'},{crowd:7,herd:'h3 g2',tawaf:26},{crowd:2,herd:'g2'},{crowd:5,herd:'s5 g3 h4'},
 {crowd:1,herd:'',tawaf:6},{crowd:8,herd:'s4 g3'},{crowd:2,herd:'g2'},{crowd:1,herd:'',tawaf:5},
 {crowd:2,herd:'g3 s3'},{crowd:4,herd:'h5 g3 s3'},{crowd:8,herd:'h5 g2'},{crowd:5,herd:'s5 g3 h5'},
 {crowd:0,herd:'g2'},{crowd:0,herd:'g3'},{crowd:4,herd:'h3 g2'},{crowd:2,herd:'g3 s3'},
 {crowd:5,herd:'g3 h4 s3'},{crowd:2,herd:'g2'},{crowd:6,herd:'h4 g3 s3'}
];
function henSvg(o){const c=o.color||'#c2622d',d=o.dark||'#7a3b1f';
 return `<g class="lw-legs"><line class="lw-leg a" x1="-1.5" y1="-4" x2="-2" y2="0"/><line class="lw-leg b" x1="1.5" y1="-4" x2="2" y2="0"/></g>`
  +`<path d="M-6-9Q-11-15-9-19Q-5-14-3-11Z" fill="${d}"/><path d="M-7-8Q-7-14 0-14Q6-14 7-9Q6-3 0-3Q-6-3-7-8Z" fill="${c}" stroke="#00000022" stroke-width=".6"/><path d="M-3-9Q0-6 3-9" stroke="${d}" fill="none" stroke-width="1"/>`
  +`<g class="lw-peck"><circle cx="6" cy="-15" r="3" fill="${c}"/><path d="M4.5-18q1-2 2.2-.4q1-1.6 2 .2l-.4 1.2z" fill="#d8322a"/><path d="M8.7-15.5l3 1-3 1z" fill="#e8b23a"/><circle cx="6.8" cy="-15.6" r=".7" fill="#222"/><path d="M7-13q.5 2-.5 2.6" stroke="#d8322a" fill="none" stroke-width="1.2"/></g>`}
const ROBES=['#e9dcc2','#d8c3a0','#b98a5a','#8e5a3a','#f2ece0','#c9b28a','#a7764f'],WRAPS=['#f4efe2','#d9cdb4','#b2493b','#e8e2d0','#7c5236'],ABAYAS=['#3b3433','#4a3b35','#5b4636','#2f3438'];
function figureFor(kind,i){
 if(kind==='p')return{h:personSvg({robe:ROBES[i%ROBES.length],wrap:WRAPS[(i*3)%WRAPS.length],skin:SKIN[i%SKIN.length],load:['bundle','basket','staff',''][i%4]}),k:1,speed:16};
 if(kind==='w')return{h:personSvg({woman:1,robe:ABAYAS[i%ABAYAS.length],wrap:ABAYAS[(i+1)%ABAYAS.length],skin:SKIN[(i+1)%SKIN.length],load:i%2?'basket':''}),k:.96,speed:14};
 if(kind==='c'||kind==='cl')return{h:camelSvg({load:kind==='cl',saddle:['#9b2f2a','#2f5c7a','#6a3d7a','#9a6a1f'][i%4],color:['#c79a63','#b98b55','#d2a874'][i%3]}),k:1.15,speed:12};
 if(kind==='h')return{h:henSvg({color:['#c2622d','#f1ece2','#8a4a22','#d9a056'][i%4],dark:['#7a3b1f','#c9bfae','#4f2a14','#8a5a22'][i%4]}),k:.8,speed:5};
 if(kind==='s')return{h:goatSvg({sheep:1,color:['#f2ede2','#e7dfcf'][i%2],dark:'#4a3b2c'}),k:.75,speed:9};
 return{h:goatSvg({color:['#e8e1d2','#6b4f3a','#2f2a26','#b58a5c'][i%4],dark:'#4f3d2b'}),k:.75,speed:7};
}

/* ---------- the animation engine (one loop for everything) ---------- */
const LW={figs:[],theatres:new Set(),raf:0,t0:performance.now(),gustTimer:0,birdTimer:0};
/* ---------- sounds of the maps (synthesised, so nothing to download) ----------
   They start after the first tap (browsers allow sound only after one), follow the app's
   sound switch and stop with "Pause animation". */
const SFX=(()=>{
 let ac=null,out=null,nb=null,unlocked=false;
 function ctx(){if(!ac){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;ac=new AC();out=ac.createGain();out.gain.value=.6;const comp=ac.createDynamicsCompressor();out.connect(comp);comp.connect(ac.destination)}if(ac.state==='suspended')ac.resume().catch(()=>{});return ac}
 const unlock=()=>{unlocked=true;ctx()};['pointerdown','touchend','keydown'].forEach(e=>addEventListener(e,unlock,{capture:true,passive:true}));
 const ok=()=>unlocked&&!!ac&&ac.state==='running'&&(typeof soundOn==='undefined'||soundOn)&&!reduced()&&!document.hidden;
 function noise(){if(!nb){nb=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}const n=ac.createBufferSource();n.buffer=nb;n.loop=true;return n}
 function env(g,t,a,peak,hold,rel){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);g.gain.setValueAtTime(Math.max(.0002,peak),t+a+hold);g.gain.exponentialRampToValueAtTime(.0001,t+a+hold+rel)}
 /* a brassy, rasping blare that rises and falls; pitch < 1 sounds lower and tired */
 function trumpet(vol=1,pitch=1,dur=1.3){if(!ok())return;const t=ac.currentTime+.02,g=ac.createGain(),bp=ac.createBiquadFilter(),hp=ac.createBiquadFilter(),sh=ac.createWaveShaper(),lfo=ac.createOscillator(),lg=ac.createGain(),curve=new Float32Array(256);
  for(let i=0;i<256;i++)curve[i]=Math.tanh(3*(i/128-1));sh.curve=curve;bp.type='bandpass';bp.frequency.value=1150*pitch;bp.Q.value=.8;hp.type='highpass';hp.frequency.value=240;lfo.frequency.value=29;lg.gain.value=24*pitch;lfo.connect(lg);
  [0,9].forEach(det=>{const o=ac.createOscillator(),f=o.frequency;o.type='sawtooth';o.detune.value=det;f.setValueAtTime(320*pitch,t);f.exponentialRampToValueAtTime(780*pitch,t+.17);f.linearRampToValueAtTime(700*pitch,t+dur*.6);f.exponentialRampToValueAtTime(500*pitch,t+dur);lg.connect(f);o.connect(sh);o.start(t);o.stop(t+dur+.1)});
  sh.connect(hp);hp.connect(bp);bp.connect(g);g.connect(out);env(g,t,.06,.45*vol,dur*.55,dur*.4);
  const n=noise(),nf=ac.createBiquadFilter(),ng=ac.createGain();nf.type='bandpass';nf.frequency.value=2500;nf.Q.value=1.1;n.connect(nf);nf.connect(ng);ng.connect(out);env(ng,t,.05,.1*vol,dur*.5,dur*.4);n.start(t);n.stop(t+dur+.1);lfo.start(t);lfo.stop(t+dur+.1)}
 function chirp(t,f0,f1,d,v){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(out);o.start(t);o.stop(t+d+.02)}
 /* n little birds singing over `spread` seconds */
 function birds(n=4,spread=1.2,vol=.5){if(!ok())return;const t0=ac.currentTime+.03;for(let i=0;i<n;i++){const t=t0+Math.random()*spread,f=2500+Math.random()*1900,up=Math.random()<.5,notes=1+Math.floor(Math.random()*3);for(let j=0;j<notes;j++){const tt=t+j*(.07+Math.random()*.05);up?chirp(tt,f,f*1.45,.065,.11*vol):chirp(tt,f*1.35,f*.8,.075,.11*vol)}}}
 /* many wings beating */
 function flutter(dur=2.5,vol=.5){if(!ok())return;const t=ac.currentTime+.02,n=noise(),lp=ac.createBiquadFilter(),am=ac.createGain(),g=ac.createGain(),lfo=ac.createOscillator(),lg=ac.createGain();lp.type='lowpass';lp.frequency.value=1100;am.gain.value=.5;lfo.type='square';lfo.frequency.value=13;lg.gain.value=.5;lfo.connect(lg);lg.connect(am.gain);n.connect(lp);lp.connect(am);am.connect(g);g.connect(out);env(g,t,.4,.22*vol,dur-.9,.5);n.start(t);n.stop(t+dur+.1);lfo.start(t);lfo.stop(t+dur+.1)}
 function wind(dur=3,vol=.6){if(!ok())return;const t=ac.currentTime+.02,n=noise(),bp=ac.createBiquadFilter(),g=ac.createGain();bp.type='bandpass';bp.Q.value=.6;bp.frequency.setValueAtTime(320,t);bp.frequency.linearRampToValueAtTime(950,t+dur*.45);bp.frequency.linearRampToValueAtTime(380,t+dur);n.connect(bp);bp.connect(g);g.connect(out);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.3*vol,t+dur*.4);g.gain.exponentialRampToValueAtTime(.0001,t+dur);n.start(t,Math.random()*1.5);n.stop(t+dur+.05)}
 /* small stones landing */
 function stones(n=6,spread=1.4,vol=.6){if(!ok())return;const t0=ac.currentTime+.02;for(let i=0;i<n;i++){const t=t0+Math.random()*spread,o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(150+Math.random()*60,t);o.frequency.exponentialRampToValueAtTime(48,t+.16);o.connect(g);g.connect(out);env(g,t,.004,.35*vol,.01,.16);o.start(t);o.stop(t+.22)}}
 return{ok,trumpet,birds,flutter,wind,stones};
})();
/* fire each cue once as an animation's clock passes it (and again on the next loop) */
function cueRunner(list){let last=null;return(t,allowed)=>{if(last===null||t<last)last=t-.0001;for(const [at,fn] of list)if(at>last&&at<=t&&allowed())fn();last=t}}
function polyLen(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L}
function polyAt(pts,s){for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(s<=l||i===pts.length-1){const t=l?clamp(s/l,0,1):0;return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,b[0]-a[0]]}s-=l}return pts[pts.length-1].concat([1])}
function tick(now){
 LW.raf=0;
 if(document.hidden||reduced())return;
 const scr=document.getElementById('mapScreen'),mapOn=scr&&!scr.classList.contains('hidden')&&!document.hidden,t=(now-LW.t0)/1000;
 if(mapOn&&!reduced())LW.figs.forEach(f=>{
  if(!f.el.isConnected)return;
  const span=f.len*2,d=(f.off+t*f.speed)%span,back=d>f.len,s=back?span-d:d,p=polyAt(f.pts,s),dir=(p[2]>=0?1:-1)*(back?-1:1);
  const v=clamp((p[1]-f.P.y)/f.P.h,0,1),sc=Math.max(f.min||0,(0.1+0.95*Math.pow(clamp((v-.08)/.85,0,1),1.15))*f.P.w/1536*f.k);
  f.el.setAttribute('transform',`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) scale(${(sc*dir).toFixed(3)} ${sc.toFixed(3)})`);
 });
 LW.theatres.forEach(th=>{if(!th.svg.isConnected){LW.theatres.delete(th);return}if(th.visible())th.tick(((now-th.start)/1000)%th.cycle)});
 if(LW.figs.length||LW.theatres.size)LW.raf=requestAnimationFrame(tick);
}
function run(){if(!LW.raf&&!document.hidden&&!reduced())LW.raf=requestAnimationFrame(tick)}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)run()});

/* ---------- living map ---------- */
function photoBox(svg){const img=svg.querySelector('.history-photo');if(!img)return null;return{x:+img.getAttribute('x'),y:+img.getAttribute('y'),w:+img.getAttribute('width'),h:+img.getAttribute('height')}}
function paintLife(){
 const svg=document.getElementById('mapSvg');if(!svg||typeof SEERAA_SCENES==='undefined')return;
 svg.querySelectorAll('.lw-life').forEach(g=>g.remove());LW.figs=LW.figs.filter(f=>f.el.isConnected&&f.el.closest('#mapSvg')!==svg);
 const wi=((viewWorld%MAP_LIFE.length)+MAP_LIFE.length)%MAP_LIFE.length,P=photoBox(svg),S=SEERAA_SCENES[((viewWorld%SEERAA_SCENES.length)+SEERAA_SCENES.length)%SEERAA_SCENES.length],lanes=LANES[S.asset],life=MAP_LIFE[wi],more=MAP_MORE[wi]||{};if(!P||S.empty||!lanes||!life)return;
 const L=typeof MAP_GEO!=='undefined'&&MAP_GEO;let html='';const plan=[];
 const toMap=([u,v])=>[P.x+u*P.w,P.y+v*P.h],inView=([x,y])=>!L||(x>-30&&x<L.W+30&&y>L.H*.06&&y<L.H+30),onScreen=pts=>pts.some(inView);
 /* people and animals walk only on the open ground of the painting (streets, squares, paths), both ways */
 const kinds=[...life.road];for(let i=0;i<(more.crowd||0);i++)kinds.push(['p','w','p','p','w','p','w'][i%7]);
 kinds.forEach((kind,i)=>{const lane=lanes.roads[i%lanes.roads.length].map(toMap),a=(i*.29)%.45,b=Math.min(1,a+.5+((i*.17)%.35)),pts=laneSlice(lane,a,b,(i%2?1:-1)*(3+(i%3)*4),P);if(onScreen(pts))plan.push({kind,pts,i})});
 life.hill.forEach((kind,i)=>{const pts=lanes.hills[i%lanes.hills.length].map(toMap);if(onScreen(pts))plan.push({kind,pts,i:i+7,hill:1})});
 /* small herds and hens on the open ground, grazing and pecking */
 const yards=(lanes.yards||[]).map(toMap).filter(inView);
 String(more.herd||'').split(/\s+/).filter(Boolean).forEach((g,gi)=>{const kind=g[0],n=+g.slice(1)||1,y=yards[(gi+wi)%Math.max(1,yards.length)];if(!y)return;
  const k=clamp(depthAt(y[1],P,1),.25,1.6),sp=(kind==='h'?13:17)*k;
  for(let j=0;j<n;j++){const ox=(j-(n-1)/2)*sp+((j*37)%11-5)*k,oy=((j*53)%13-6)*k*1.2,x=y[0]+ox,yy=y[1]+oy,wd=(kind==='h'?14:9)*k;plan.push({kind,pts:[[x-wd,yy],[x+wd*.6,yy-2*k],[x+wd,yy+1.5*k]],i:j+gi*3,herd:1})}});
 plan.forEach((f,n)=>{const F=figureFor(f.kind,f.i);html+=`<g class="lw-fig lw-k-${f.kind}${f.herd?' lw-graze':''}" data-n="${n}">${F.h}</g>`;f.F=F});
 for(let b=0;b<life.birds;b++)html+=`<g class="lw-bird" data-b="${b}">${birdSvg()}</g>`;
 const scene=svg.querySelector('.history-scene');if(!scene)return;
 scene.insertAdjacentHTML('afterend',`<g class="lw-life" aria-hidden="true" pointer-events="none"><g class="lw-tawaf"></g>${html}</g>`);
 const g=svg.querySelector('.lw-life');
 plan.forEach((f,n)=>{const el=g.querySelector(`[data-n="${n}"]`),len=polyLen(f.pts);LW.figs.push({el,pts:f.pts,len,P,k:f.F.k,min:f.hill?.42*Math.max(P.w/1536,.6):0,speed:f.F.speed*(f.hill?.35:f.herd?.22:1)*P.w/1536*(.85+(n%3)*.12),off:(n*0.37%1)*len*2});{const p=polyAt(f.pts,len*((n*.29)%1)),v=clamp((p[1]-P.y)/P.h,0,1),sc=(0.1+0.95*Math.pow(clamp((v-.08)/.85,0,1),1.15))*P.w/1536*f.F.k;el.setAttribute('transform',`translate(${p[0]} ${p[1]}) scale(${sc})`)}});
 /* birds glide across the sky */
 for(let b=0;b<life.birds;b++){const el=g.querySelector(`[data-b="${b}"]`),y=P.y+P.h*(.04+b*.03),x0=P.x-40,x1=P.x+P.w+40;el.setAttribute('transform',`translate(${P.x+P.w*(.25+b*.22)} ${y}) scale(.7)`);LW.figs.push({el,pts:b%2?[[x1,y],[x0,y+20]]:[[x0,y],[x1,y+15]],len:P.w+80,P:{x:P.x,y:P.y-P.h*2,w:P.w,h:P.h*3},k:1.1,speed:55*P.w/1536,off:b*P.w*.6})}
 if(lanes.kaaba&&more.tawaf)tawaf(g.querySelector('.lw-tawaf'),lanes.kaaba,more.tawaf,P,L);
 if(more.watch&&lanes.ridges)watchers(g,lanes.ridges,more.watch,P,L);
 paintMood(svg,P,S.mood||'');
 const frame=svg.closest('.map-frame');if(frame)frame.classList.toggle('lw-dusty',!!lanes.dusty);
 scheduleGust(frame,!!lanes.dusty);scheduleBirdSong(life.birds);run();
}
function scheduleBirdSong(n){clearTimeout(LW.birdTimer);if(!n)return;LW.birdTimer=setTimeout(()=>{if(mapShowing())SFX.birds(2+Math.floor(Math.random()*3),1.4,.45);scheduleBirdSong(n)},8000+Math.random()*11000)}
/* people standing on the mountains, looking down at the town (the Year of the Elephant: Quraysh
   left Makkah for the mountains). Only spots that are on screen and clear of the buttons are used. */
function watchers(g,spots,n,P,L){
 const frame=g.closest('.map-frame'),fw=(frame&&frame.clientWidth)||innerWidth,k=L?fw/L.W:1,midU=.62;
 const fr=frame?frame.getBoundingClientRect():{left:0,top:0},busy=[...document.querySelectorAll('#spTools button,#placeInfoButton,.map-title,.map-menu-btn,#mapMenuBtn,#mapExitDoor,.na-bell,#naBell')].map(e=>e.getBoundingClientRect()).filter(r=>r.width).map(r=>[r.left-fr.left-14,r.top-fr.top-30,r.right-fr.left+14,r.bottom-fr.top+3]);
 const vis=spots.map(([u,v])=>({u,x:P.x+u*P.w,y:P.y+v*P.h})).filter(p=>{const sx=p.x*k,sy=p.y*k;return L&&p.x>L.W*.03&&p.x<L.W*.97&&sy>40&&!busy.some(b=>sx>b[0]&&sx<b[2]&&sy>b[1]&&sy<b[3])});
 if(!vis.length)return;const sc=Math.max(.5*Math.max(P.w/1536,.6),.3);let h='';
 for(let i=0;i<n;i++){const p=vis[i%vis.length],ring=Math.floor(i/vis.length),dx=((i*37)%7-3)*7*sc+(ring%2?9:-9)*sc*ring,dy=((i*53)%5-2)*2*sc,face=p.u<midU?1:-1,woman=i%3===1,point=i%4===0;
  const o={robe:woman?ABAYAS[i%ABAYAS.length]:ROBES[i%ROBES.length],wrap:woman?ABAYAS[(i+1)%ABAYAS.length]:WRAPS[(i*3)%WRAPS.length],skin:SKIN[i%SKIN.length],woman};
  h+=`<g class="lw-watch${point?' lw-pointer':''}" transform="translate(${(p.x+dx).toFixed(1)} ${(p.y+dy).toFixed(1)}) scale(${(sc*face).toFixed(3)} ${sc.toFixed(3)})"><ellipse cx="0" cy="1" rx="9" ry="2.6" fill="#2a1b0e" opacity=".35"/><g class="lw-lean" style="animation-delay:-${(i*.37%3).toFixed(2)}s">${personSvg(o).replace('class="lw-arm"',point?'class="lw-arm" transform="rotate(-118 5 -31)"':'class="lw-arm"')}</g></g>`}
 g.insertAdjacentHTML('afterbegin',`<g class="lw-watchers">${h}</g>`);
}
/* part of a lane (from fraction a to b of its length), shifted a little to one side */
function laneSlice(lane,a,b,off,P){const R=[];let d=0;lane.forEach((p,i)=>{if(i)d+=Math.hypot(p[0]-lane[i-1][0],p[1]-lane[i-1][1]);R.push([p[0],p[1],d])});if(d<1)return lane;return streetLane(R,a,b,off,P)}
/* pilgrims walk around the Kaʿbah, anticlockwise (the Kaʿbah on their left); behind it they are hidden */
function tawaf(g,K,n,P,L){if(!g)return;const [cu,cv,ru,rv,h0,h1]=K,cx=P.x+cu*P.w,cy=P.y+cv*P.h,rx=ru*P.w,ry=rv*P.h,x0=P.x+h0*P.w,x1=P.x+h1*P.w;
 if(L&&(cx<0||cx>L.W||cy<L.H*.04||cy>L.H))return;
 const men=['#f6f3ec','#efe9dc','#f4f1ea'],ppl=[...Array(n)].map((_,i)=>{const woman=i%3===2,o={robe:woman?ABAYAS[i%ABAYAS.length]:men[i%3],wrap:woman?ABAYAS[(i+1)%ABAYAS.length]:(i%2?'#2b2118':'#f6f3ec'),skin:SKIN[i%SKIN.length],woman};return{o,a:i/n*Math.PI*2+((i*7)%5)*.05,r:1+(i%3)*.09,w:Math.PI*2/(44+(i%3)*5)}});
 g.innerHTML=ppl.map(p=>`<g class="lw-fig lw-k-p">${personSvg(p.o)}</g>`).join('');const els=[...g.children];
 const th={svg:g,cycle:3600,start:performance.now()-Math.random()*20000,visible:mapShowing,tick(t){ppl.forEach((p,i)=>{const a=p.a-p.w*t,s=Math.sin(a),x=cx+rx*p.r*Math.cos(a),y=cy+ry*p.r*s,v=clamp((y-P.y)/P.h,0,1),k=(0.1+0.95*Math.pow(clamp((v-.08)/.85,0,1),1.15))*P.w/1536*1.3,hide=s<0&&x>x0&&x<x1;
  els[i].setAttribute('transform',`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(k*(s>=0?1:-1)).toFixed(3)} ${k.toFixed(3)})`);els[i].setAttribute('opacity',hide?'0':'1')})}};
 th.tick(6);if(reduced())th.pausedT=6;LW.theatres.add(th);run()}
/* a walking lane beside the painted street, from fraction a to b of its length, offset to one side */
function streetLane(R,a,b,off,P){const len=R[R.length-1][2],out=[];for(let i=0;i<=24;i++){const s=(a+(b-a)*i/24)*len,p=roadAt(R,s),q=roadAt(R,s+6),r=roadAt(R,s-6),dx=q[0]-r[0],dy=q[1]-r[1],l=Math.hypot(dx,dy)||1,k=clamp(depthAt(p[1],P,1),.3,1.4);out.push([p[0]-dy/l*off*k,p[1]+dx/l*off*k])}return out}
/* light and sky for each map: night (stars and a crescent), dawn, dusk, and passing rain */
function paintMood(svg,P,mood){
 svg.querySelectorAll('.lw-mood').forEach(g=>g.remove());const frame=svg.closest('.map-frame');
 if(frame){['night','dawn','dusk','rain'].forEach(m=>frame.classList.toggle('lw-m-'+m,m===mood));frame.querySelector('.lw-rain')?.remove()}
 clearTimeout(LW.rainTimer);if(!mood)return;
 const scene=svg.querySelector('.history-scene');if(!scene)return;
 const L=typeof MAP_GEO!=='undefined'&&MAP_GEO,W=L?L.W:P.w,H=L?L.H:P.h;let h='';
 if(mood==='night'){
  h+=`<defs><linearGradient id="lwNightSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1430" stop-opacity=".82"/><stop offset=".45" stop-color="#16224a" stop-opacity=".45"/><stop offset="1" stop-color="#1a1f3a" stop-opacity=".18"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#lwNightSky)"/>`;
  let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<46;i++){const x=rnd()*W,y=rnd()*H*.36,r=(.6+rnd()*1.3).toFixed(2);h+=`<circle class="lw-star" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#fffbe8" style="animation-delay:${(rnd()*3).toFixed(2)}s"/>`}
  const mx=W*.78,my=H*.13,mr=Math.max(14,W*.022);
  h+=`<circle cx="${mx}" cy="${my}" r="${mr*2.4}" fill="#fff6c8" opacity=".12"/><circle cx="${mx}" cy="${my}" r="${mr}" fill="#fff4cc"/><circle cx="${mx+mr*.45}" cy="${my-mr*.18}" r="${mr*.9}" fill="#18234a"/>`;
 }
 if(mood==='dawn')h+=`<defs><linearGradient id="lwDawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7a46b" stop-opacity=".42"/><stop offset=".5" stop-color="#ffd7a8" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#lwDawn)"/>`;
 if(mood==='dusk')h+=`<defs><linearGradient id="lwDuskSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a8a" stop-opacity=".42"/><stop offset=".4" stop-color="#e48a5a" stop-opacity=".26"/><stop offset="1" stop-color="#e48a5a" stop-opacity=".06"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#lwDuskSky)"/>`;
 if(mood==='rain')h+=`<rect width="${W}" height="${H}" fill="#5d6f86" opacity=".16"/>`;
 scene.insertAdjacentHTML('afterend',`<g class="lw-mood" aria-hidden="true" pointer-events="none">${h}</g>`);
 if(mood==='rain'&&frame&&!reduced()){const shower=()=>{const scr=document.getElementById('mapScreen');if(!frame.isConnected||!frame.classList.contains('lw-m-rain'))return;
  if(scr&&!scr.classList.contains('hidden')&&!document.hidden){let r=frame.querySelector('.lw-rain');if(!r){frame.insertAdjacentHTML('beforeend','<div class="lw-rain" aria-hidden="true"></div>');r=frame.querySelector('.lw-rain')}
   let d='';for(let i=0;i<70;i++)d+=`<i style="left:${(Math.random()*104-2).toFixed(1)}%;animation-delay:${(Math.random()*1.1).toFixed(2)}s;animation-duration:${(.55+Math.random()*.35).toFixed(2)}s"></i>`;r.innerHTML=d;r.classList.remove('go');void r.offsetWidth;r.classList.add('go')}
  LW.rainTimer=setTimeout(shower,14000+Math.random()*9000)};LW.rainTimer=setTimeout(shower,2500)}
}
/* gusts of wind with blowing sand on the desert maps */
function scheduleGust(frame,on){clearTimeout(LW.gustTimer);if(!frame||!on||reduced())return;LW.gustTimer=setTimeout(()=>{gust(frame);scheduleGust(frame,frame.classList.contains('lw-dusty'))},9000+Math.random()*12000)}
function gust(frame){
 const scr=document.getElementById('mapScreen');if(!frame.isConnected||(scr&&scr.classList.contains('hidden'))||document.hidden)return;
 let w=frame.querySelector('.lw-wind');if(!w){frame.insertAdjacentHTML('beforeend','<div class="lw-wind" aria-hidden="true"></div>');w=frame.querySelector('.lw-wind')}
 let h='';for(let i=0;i<9;i++)h+=`<i style="top:${(18+Math.random()*70).toFixed(1)}%;width:${(14+Math.random()*22).toFixed(0)}%;animation-delay:${(Math.random()*.9).toFixed(2)}s;opacity:${(.25+Math.random()*.35).toFixed(2)}"></i>`;
 for(let i=0;i<26;i++)h+=`<b style="top:${(30+Math.random()*65).toFixed(1)}%;animation-delay:${(Math.random()*1.2).toFixed(2)}s"></b>`;
 w.innerHTML=h;w.classList.remove('go');void w.offsetWidth;w.classList.add('go');SFX.wind(2.8,.55);
}

/* ---------- the Year of the Elephant ---------- */
const ELEPHANT_CAPTIONS=[[0,'Abrahah marches towards Makkah with a great army and elephants, to destroy the Kaʿbah.'],[8,'His great elephant kneels down. It will not walk towards the Kaʿbah.'],[9.6,'Allah sends flocks of birds — ṭayran abābīl — each carrying small stones.'],[12.6,'The stones strike the army, and it is left like straw that has been eaten. (Sūrat al-Fīl, 105)'],[16.5,'Allah protected His House. The Prophet Muhammad ﷺ was born in this same year.']];
function soldierSvg(i,banner){const tunic=['#7a4b2b','#5c6b3c','#6d3a2e','#4f5b6a'][i%4];return `<g class="lw-legs"><line class="lw-leg a" x1="-3" y1="-16" x2="-4" y2="0"/><line class="lw-leg b" x1="3" y1="-16" x2="4" y2="0"/></g><path d="M-8-14 L-6-36 Q0-39 6-36 L8-14Z" fill="${tunic}"/><path d="M-7-22 h14" stroke="#3a2a20" stroke-width="1.6"/><circle cx="0" cy="-42" r="6" fill="${SKIN[i%SKIN.length]}"/><path d="M-7-43 Q0-53 7-43Z" fill="#9aa1a8" stroke="#5d646b" stroke-width=".8"/>`
 +(banner?`<line x1="10" y1="-74" x2="12" y2="2" stroke="#5b4026" stroke-width="2"/><path class="lwE-flag" d="M10-74 Q20-78 29-73 Q23-67 29-61 Q20-65 10-62Z" fill="${banner}" stroke="#00000040" stroke-width=".7"/>`:`<line x1="9" y1="-48" x2="13" y2="2" stroke="#6b4b2b" stroke-width="1.8"/><path d="M10.5-53 l2.5 6 -4 0Z" fill="#b8bec4"/>`)
 +`<ellipse cx="-7" cy="-25" rx="5" ry="7" fill="#8a5a2b" stroke="#4d3015" stroke-width="1"/>`}
/* o.king: Abrahah rides in a canopy (only the lead elephant kneels); otherwise a soldier rides it */
function elephantSvg(o={}){const g=o.grey||['#959ca6','#8c939d','#9aa0a9','#868d97'][(o.i||0)%4],gd=o.dark||'#7f8690',cloth=o.cloth||['#9b2f2a','#2f5c7a','#6a3d7a','#8a5a1f'][(o.i||0)%4];
 return `<g class="lwE-back"><rect x="-27" y="-24" width="11" height="24" rx="3" fill="${gd}"/><rect x="-13" y="-24" width="11" height="24" rx="3" fill="${gd}"/></g>`
 +`<g class="lwE-front"><rect x="9" y="-24" width="11" height="24" rx="3" fill="${g}"/><rect x="22" y="-24" width="11" height="24" rx="3" fill="${gd}"/></g>`
 +`<path d="M-34-40 q-7 6-5 15" stroke="#6d747e" fill="none" stroke-width="2.5"/>`
 +`<ellipse cx="0" cy="-44" rx="38" ry="25" fill="${g}"/><circle cx="36" cy="-52" r="17" fill="${g}"/><ellipse cx="27" cy="-52" rx="10" ry="14" fill="${gd}"/>`
 +`<path d="M49-52 Q58-40 54-26 Q53-20 58-18" stroke="${g}" fill="none" stroke-width="8" stroke-linecap="round"/><path d="M45-40 q8 2 11 -3" stroke="#fff8e8" fill="none" stroke-width="3" stroke-linecap="round"/><circle cx="41" cy="-57" r="1.6" fill="#2b2b2b"/>`
 +`<path d="M-20-66 Q0-77 20-66 L18-50 Q0-46-18-50Z" fill="${cloth}"/><path d="M-20-66 Q0-77 20-66" stroke="#e4b85a" fill="none" stroke-width="2"/><path d="M-17-52 Q0-48 17-52" stroke="#e4b85a" fill="none" stroke-width="1.6" stroke-dasharray="3 2"/>`
 +(o.king?`<g class="lwE-king"><path d="M-14-66 L-14-100 M14-66 L14-100" stroke="#c9a43a" stroke-width="2"/><path d="M-18-100 Q0-112 18-100Z" fill="#7a2f5a"/><path d="M-6-66 L-4-88 Q0-91 4-88 L6-66Z" fill="#5a2f6e"/><circle cx="0" cy="-94" r="6" fill="${SKIN[1]}"/><path d="M-6-99 L-6-104 -3-101 0-106 3-101 6-104 6-99Z" fill="#e4b85a" stroke="#9a7220" stroke-width=".6"/></g>`
  :`<g class="lwE-rider"><path d="M-5-66 L-4-84 Q0-87 4-84 L5-66Z" fill="${['#7a4b2b','#5c6b3c','#6d3a2e'][(o.i||0)%3]}"/><circle cx="0" cy="-90" r="5.4" fill="${SKIN[((o.i||0)+2)%SKIN.length]}"/><path d="M-6-91 Q0-100 6-91Z" fill="#9aa1a8" stroke="#5d646b" stroke-width=".8"/><line x1="6" y1="-104" x2="9" y2="-64" stroke="#6b4b2b" stroke-width="1.8"/><path d="M5.6-109 l2.4 6 -4 0Z" fill="#b8bec4"/></g>`)}
function kaabaSvg(){return `<path d="M-38 0 L-38-56 L0-66 L38-56 L38 0 L0 8Z" fill="#1f1f22"/><path d="M0-66 L38-56 L38 0 L0 8Z" fill="#2c2c30"/><path d="M-38-44 L0-53 L38-44 L38-38 L0-47 L-38-38Z" fill="#c9a43a"/><rect x="-6" y="-22" width="12" height="22" fill="#b38d2a" opacity=".85"/>`}
/* Builds the scene into an <svg> with viewBox 0 0 600 260. full: sky, hills and the Kaʿbah behind.
   The army marches in two ranks (the far rank smaller): soldiers with spears and banners, and four elephants;
   the great elephant in front carries Abrahah and kneels. */
const ARMY_SIDE=[ // x at the end of the march, row 0 = far rank, 1 = near rank
 {x:446,r:0},{x:422,r:0},{x:398,r:0},{x:372,r:0},{x:250,r:0,e:1,i:1},{x:130,r:0,e:1,i:2},{x:56,r:0},{x:32,r:0},{x:8,r:0},
 {x:462,r:1,b:'#a3272b'},{x:436,r:1},{x:410,r:1},{x:320,r:1,e:1,king:1},{x:190,r:1,e:1,i:3},{x:96,r:1},{x:70,r:1,b:'#5a2f6e'},{x:44,r:1},{x:18,r:1}];
function elephantTheatre(svg,full,captionEl){
 let h='';
 if(full)h+=`<defs><linearGradient id="lwSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c98a"/><stop offset=".6" stop-color="#fbe4b8"/><stop offset="1" stop-color="#f3d9a6"/></linearGradient></defs><rect width="600" height="260" fill="url(#lwSky)"/><circle cx="110" cy="70" r="28" fill="#fff1c4" opacity=".9"/><path d="M0 170 L60 120 L110 150 L170 95 L240 150 L300 112 L360 150 L430 100 L500 140 L560 110 L600 130 L600 260 L0 260Z" fill="#c9a06a"/><path d="M0 190 L80 160 L160 185 L250 158 L340 186 L430 165 L520 184 L600 170 L600 260 L0 260Z" fill="#d9b27a"/><rect y="214" width="600" height="46" fill="#e2c08a"/><g transform="translate(540 216)">${kaabaSvg()}</g>`;
 else h+=`<ellipse cx="300" cy="218" rx="280" ry="14" fill="#5b4126" opacity=".16"/>`;
 const rowY=[203,224],rowK=[.7,.92];
 /* the people of Makkah watch from the mountains */
 if(full)h+=`<g class="lwE-watchers">`+[[34,141,1],[48,131,1],[62,121,1],[150,108,1],[164,99,1],[180,101,-1],[194,111,-1],[288,118,1],[302,113,-1],[318,122,-1],[416,107,1],[430,101,-1],[446,108,-1],[462,116,-1],[548,114,-1],[566,113,-1],[582,118,-1]].map(([x,y,f],i)=>`<g transform="translate(${x} ${y}) scale(${.34*f} .34)">${personSvg({robe:i%3===1?ABAYAS[i%ABAYAS.length]:ROBES[i%ROBES.length],wrap:i%3===1?ABAYAS[(i+1)%ABAYAS.length]:WRAPS[i%WRAPS.length],skin:SKIN[i%SKIN.length],woman:i%3===1}).replace('class="lw-arm"',i%4===0?'class="lw-arm" transform="rotate(-118 5 -31)"':'class="lw-arm"')}</g>`).join('')+`</g>`;
 h+=`<g class="lwE-army">`+ARMY_SIDE.map((m,i)=>`<g transform="translate(${m.x} ${rowY[m.r]}) scale(${rowK[m.r]})"><g class="lwE-s${m.e?' lwE-el':''}${m.king?' lwE-lead':''}" data-s="${i}"${m.r?'':' opacity=".92"'}>${m.e?elephantSvg({king:m.king,i:m.i||0}):soldierSvg(i,m.b)}</g></g>`).join('')+`</g>`;
 const birds=ARMY_SIDE.map((m,i)=>({hx:m.x+(m.e?10:0),hy:(m.e?60:96)+(i%3)*10-(m.r?0:14),gy:rowY[m.r]-(m.e?30:18),sx:640+i*34,sy:-20-(i%5)*14,ex:-60-i*22,ey:-40-(i%4)*12}));
 h+=birds.map((b,i)=>`<circle class="lwE-stone" data-b="${i}" r="3.4" fill="#7a6650" stroke="#3d3022" stroke-width="1"/>`).join('');
 h+=birds.map((b,i)=>`<g class="lwE-bird" data-b="${i}"><path class="lwE-wing" d="M-12 0Q-6-9 0 0Q6-9 12 0" stroke="#3a2c20" fill="none" stroke-width="3" stroke-linecap="round"/><ellipse cx="0" cy="1" rx="4" ry="2.6" fill="#4a3826"/></g>`).join('');
 svg.innerHTML=h;
 svg.querySelectorAll('.lwE-army .lw-leg').forEach(l=>{l.setAttribute('stroke','#3f3021');l.setAttribute('stroke-width','2.6');l.setAttribute('stroke-linecap','round')});
 const army=svg.querySelector('.lwE-army'),lead=svg.querySelector('.lwE-lead'),front=lead.querySelector('.lwE-front'),king=lead.querySelector('.lwE-king'),S=[...svg.querySelectorAll('.lwE-s')],B=[...svg.querySelectorAll('.lwE-bird')],ST=[...svg.querySelectorAll('.lwE-stone')],legs=[...svg.querySelectorAll('.lwE-army .lw-leg')];
 svg.querySelectorAll('.lwE-watchers .lw-leg').forEach(l=>{l.setAttribute('stroke','#3f3021');l.setAttribute('stroke-width','2.4')});
 let lastCap=-1;
 const inView=()=>{const r=svg.getBoundingClientRect();return r.width>0&&r.bottom>0&&r.top<innerHeight&&!(window.speechSynthesis&&speechSynthesis.speaking)};
 const sound=cueRunner([[.6,()=>SFX.trumpet(.4,1)],[4.6,()=>SFX.trumpet(.55,1.05)],[8.1,()=>SFX.trumpet(.65,.8,1.6)],[9.1,()=>{SFX.birds(12,3,.6);SFX.flutter(3.2,.55)}],[11.9,()=>SFX.stones(9,1.6,.6)],[14.6,()=>SFX.wind(4.2,.9)],[16.2,()=>SFX.birds(5,2,.45)]]);
 const th={svg,cycle:24,start:performance.now(),visible:()=>!document.hidden&&svg.getBoundingClientRect().width>0,
  tick(t){sound(t,()=>inView()&&SFX.ok());
   const walk=t<8,ax=walk?lerp(-360,0,ease(t/8)):0,aOp=t<.6?t/.6:t>21?clamp(1-(t-21)/2,0,1):1;
   army.setAttribute('transform',`translate(${ax.toFixed(1)} ${walk?(Math.abs(Math.sin(t*4.5))*-1.5).toFixed(2):0})`);army.setAttribute('opacity',aOp.toFixed(2));
   const sw=walk?Math.sin(t*9)*16:0;legs.forEach((l,i)=>{const x=+l.getAttribute('x1'),y=+l.getAttribute('y1');l.setAttribute('transform',`rotate(${(i%2?sw:-sw).toFixed(1)} ${x} ${y})`)});
   const k=clamp((t-8)/1.2,0,1);lead.setAttribute('transform',`rotate(${(k*9).toFixed(2)} -27 0)`);{const sc=1-.4*k;front.setAttribute('transform',`translate(0 ${(-24*(1-sc)).toFixed(2)}) scale(1 ${sc.toFixed(3)})`)}
   S.forEach((el,i)=>{if(el===lead)return;const m=ARMY_SIDE[i],f=clamp((t-13-(i%6)*.12)/1.1,0,1),o=1-clamp((t-14.4-(i%6)*.12)/1.6,0,1);el.setAttribute('transform',m.e?`rotate(${(f*12).toFixed(1)} -27 0)`:`rotate(${(f*84*(i%2?1:-1)).toFixed(1)} 0 0)`);el.setAttribute('opacity',(o*(m.r?1:.92)).toFixed(2))});
   {const f=clamp((t-13.3)/1.1,0,1),o=1-clamp((t-14.6)/1.6,0,1);king.setAttribute('transform',`rotate(${(-f*70).toFixed(1)} 0 -66)`);king.setAttribute('opacity',o.toFixed(2))}
   birds.forEach((b,i)=>{const fin=ease(clamp((t-9-(i%9)*.13)/2.8,0,1)),fout=ease(clamp((t-15.2-(i%9)*.09)/2.6,0,1));let x=lerp(b.sx,b.hx,fin),y=lerp(b.sy,b.hy,fin);if(fout>0){x=lerp(b.hx,b.ex,fout);y=lerp(b.hy,b.ey,fout)}const on=t>8.8&&t<18.5;B[i].setAttribute('transform',`translate(${x.toFixed(1)} ${(y+Math.sin(t*6+i)*3).toFixed(1)}) scale(-.85 .85)`);B[i].setAttribute('opacity',on?1:0);B[i].querySelector('.lwE-wing').setAttribute('transform',`scale(1 ${(0.35+0.65*Math.abs(Math.sin(t*14+i))).toFixed(2)})`);
    const d=clamp((t-12-(i%6)*.12)/1.1,0,1),stoneOn=t>11.6+(i%6)*.12&&d<1;ST[i].setAttribute('cx',b.hx.toFixed(1));ST[i].setAttribute('cy',(t<12+(i%6)*.12?b.hy+4:lerp(b.hy+4,b.gy,d*d)).toFixed(1));ST[i].setAttribute('opacity',stoneOn?1:0)});
   if(captionEl){let c=0;ELEPHANT_CAPTIONS.forEach((x,i)=>{if(t>=x[0])c=i});if(c!==lastCap){lastCap=c;captionEl.textContent=ELEPHANT_CAPTIONS[c][1]}}
  }};
 if(reduced()){th.tick(16.6);th.pausedT=16.6}LW.theatres.add(th);run()
 return th;
}
/* ---------- the Hijrah: Surāqah and the two camels ---------- */
/* Only the two camels of the Prophet ﷺ and Abū Bakr are shown — no riders —
   with a soft light above them. Surāqah ibn Mālik rides a horse, as the
   sources describe; its legs sink into the sand and he turns back. */
const HIJRAH_CAPTIONS=[[0,'The Prophet ﷺ and Abū Bakr travel towards Madinah. Allah’s protection is with them.'],[2.4,'Surāqah ibn Mālik rides fast on his horse, hoping to catch them for a reward.'],[8,'As he comes close, his horse’s legs sink into the sand.'],[10.6,'Surāqah understands they are protected. He asks them to pray for him.'],[13.8,'He rides back and sends the other searchers away. Allah protected His Messenger ﷺ.']];
/* What was said (Ṣaḥīḥ al-Bukhārī 3615 and 3652). Only words are shown: the Prophet ﷺ and Abū Bakr are never drawn. */
const HIJRAH_SAYS=[
 {k:'abubakr',who:'Abū Bakr',ar:'هَذَا الطَّلَبُ قَدْ لَحِقَنَا يَا رَسُولَ اللَّهِ',en:'O Messenger of Allah, the pursuer has caught up with us!'},
 {k:'nabi',who:'The Prophet ﷺ',ar:'لَا تَحْزَنْ، إِنَّ اللَّهَ مَعَنَا',en:'Do not be sad. Allah is with us.'},
 {k:'suraqah',who:'Surāqah',ar:'ادْعُوَا لِي، فَاللَّهُ لَكُمَا أَنْ أَرُدَّ عَنْكُمَا الطَّلَبَ',en:'Pray for me, and by Allah I will turn the searchers away from you.'},
 {k:'suraqah',who:'Surāqah, to the searchers',ar:'قَدْ كَفَيْتُكُمْ مَا هُنَا',en:'I have already searched here for you.'}
];
/* a speech bubble over the picture; x, y is where its tail points, in pixels inside host */
function sayBox(host,minTop){let el=host.querySelector(':scope > .lw-say');if(!el){el=document.createElement('div');el.className='lw-say';el.setAttribute('aria-live','polite');el.innerHTML='<b></b><span class="lw-say-ar" lang="ar" dir="rtl"></span><span class="lw-say-en"></span>';host.appendChild(el)}
 let cur=null,w=0,h=0;
 /* q: a quote {who,ar,en,k}, or an index into HIJRAH_SAYS, or -1/null to hide */
 return{el,set(i,x,y){let q=i==null||i===-1?null:typeof i==='object'?i:HIJRAH_SAYS[i]||null;
  if(q&&(x<-4||x>host.clientWidth+4||y<0||y>host.clientHeight))q=null;
  if(q!==cur){cur=q;el.classList.toggle('on',!!q);if(q){el.dataset.who=q.k||'';el.querySelector('b').textContent=q.who;el.querySelector('.lw-say-ar').textContent=q.ar;el.querySelector('.lw-say-en').textContent=q.en;w=el.offsetWidth;h=el.offsetHeight}}
  if(!q)return;const W=host.clientWidth,left=clamp(x-w/2,6,Math.max(6,W-w-6)),top=Math.max(minTop||4,y-h-14);
  el.style.transform=`translate(${left.toFixed(0)}px,${top.toFixed(0)}px)`;el.style.setProperty('--tail',clamp(x-left,16,w-16).toFixed(0)+'px');el.classList.toggle('below',y-h-14<(minTop||4))}};
}
const sayAt=(t,plan)=>{for(const [a,b,i] of plan)if(t>=a&&t<b)return i;return -1};
function horseSvg(){return `<g class="lwH-legs"><line class="lw-leg a" x1="-15" y1="-25" x2="-17" y2="0"/><line class="lw-leg b" x1="-9" y1="-25" x2="-8" y2="0"/><g class="lwH-front"><line class="lw-leg b" x1="12" y1="-25" x2="13" y2="0"/><line class="lw-leg a" x1="18" y1="-25" x2="20" y2="0"/></g></g>`
 +`<path d="M-23-35q-9 4-7 15" stroke="#3a2416" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M-24-31 Q-22-43 -5-43 L14-43 Q23-43 25-35 L23-27 Q0-23-21-25Z" fill="#7a4e2d"/><path d="M16-41 L26-57 Q30-63 37-59 L41-53 Q39-50 35-51 L29-45 L23-34Z" fill="#7a4e2d"/><path d="M18-43 L28-59" stroke="#3a2416" stroke-width="3.2" stroke-linecap="round"/><circle cx="35" cy="-56" r="1.2" fill="#1d120a"/>`
 +`<g class="lwH-rider"><path d="M-7-42 L-5-62 Q1-65 7-62 L9-42Z" fill="#b2493b"/><line x1="6" y1="-58" x2="14" y2="-48" stroke="#b2493b" stroke-width="4" stroke-linecap="round"/><circle cx="1" cy="-69" r="5.5" fill="${SKIN[1]}"/><path d="M-6-68 Q-6-77 1-77 Q8-77 8-70 L9-64 Q5-66 3-69 L0-69 Q-3-67-7-64Z" fill="#e8e2d0"/><line x1="-8" y1="-80" x2="22" y2="-38" stroke="#6b4b2b" stroke-width="1.8"/></g>`}
function hijrahTheatre(svg,full,captionEl){
 let h=`<defs><radialGradient id="lwGlow${full?'F':'M'}"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset=".5" stop-color="#ffe9a0" stop-opacity=".45"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs>`;
 if(full)h+=`<defs><linearGradient id="lwDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4a7a"/><stop offset=".55" stop-color="#d9927a"/><stop offset="1" stop-color="#f1c48d"/></linearGradient></defs><rect width="600" height="260" fill="url(#lwDusk)"/><circle cx="470" cy="60" r="3" fill="#fff" opacity=".8"/><circle cx="520" cy="38" r="2" fill="#fff" opacity=".7"/><circle cx="380" cy="30" r="2" fill="#fff" opacity=".6"/><path d="M0 160 L70 110 L120 140 L190 96 L250 140 L330 104 L400 146 L470 112 L540 140 L600 118 L600 260 L0 260Z" fill="#8a6a54"/><path d="M0 196 Q120 170 240 192 T480 186 T600 190 L600 260 L0 260Z" fill="#d7ad76"/><rect y="214" width="600" height="46" fill="#e4bd84"/><path d="M28 214 Q20 170 60 160 Q92 164 96 214Z" fill="#6e5546"/><path d="M48 214 Q50 188 64 186 Q76 190 76 214Z" fill="#2c2018"/>`;
 else h+=`<ellipse cx="300" cy="218" rx="270" ry="14" fill="#5b4126" opacity=".16"/>`;
 h+=`<g class="lwH-pair"><g class="lwH-light"><ellipse cx="0" cy="${full?118:126}" rx="96" ry="58" fill="url(#lwGlow${full?'F':'M'})"/><g stroke="#fff3b8" stroke-width="3" stroke-linecap="round" opacity=".7">${[...Array(10)].map((_,i)=>{const a=i*Math.PI/5;return `<line x1="${(Math.cos(a)*18).toFixed(1)}" y1="${((full?100:108)+Math.sin(a)*18).toFixed(1)}" x2="${(Math.cos(a)*34).toFixed(1)}" y2="${((full?100:108)+Math.sin(a)*34).toFixed(1)}"/>`}).join('')}</g><circle cx="0" cy="${full?100:108}" r="12" fill="#fffbe6"/></g><g transform="translate(-38 216)"><g class="lwH-c">${camelSvg({saddle:'#2f5c7a',color:'#cfa36b'})}</g></g><g transform="translate(38 216)"><g class="lwH-c">${camelSvg({saddle:'#7a2f2a',color:'#c4955d'})}</g></g></g>`;
 h+=`<g class="lwH-dust"><circle cx="0" cy="0" r="10" fill="#e8cf9e" opacity=".7"/><circle cx="14" cy="-4" r="8" fill="#ead6ab" opacity=".6"/><circle cx="-12" cy="-3" r="7" fill="#e3c792" opacity=".6"/></g><g class="lwH-horse"><g class="lwH-flip">${horseSvg()}</g></g>`;
 svg.innerHTML=h;
 const pair=svg.querySelector('.lwH-pair'),light=svg.querySelector('.lwH-light'),horse=svg.querySelector('.lwH-horse'),flip=svg.querySelector('.lwH-flip'),front=svg.querySelector('.lwH-front'),rider=svg.querySelector('.lwH-rider'),dust=svg.querySelector('.lwH-dust');
 const camelLegs=[...svg.querySelectorAll('.lwH-c .lw-leg')],horseLegs=[...svg.querySelectorAll('.lwH-horse .lw-leg')];
 svg.querySelectorAll('.lw-leg').forEach(l=>{l.setAttribute('stroke',l.closest('.lwH-horse')?'#5e3b21':'#9c7445');l.setAttribute('stroke-width',l.closest('.lwH-horse')?'4':'4.2');l.setAttribute('stroke-linecap','round')});
 let lastCap=-1;
 const swingLegs=(legs,a)=>legs.forEach((l,i)=>{const x=+l.getAttribute('x1'),y=+l.getAttribute('y1');l.setAttribute('transform',`rotate(${(i%2?a:-a).toFixed(1)} ${x} ${y})`)});
 /* they pause while Surāqah is stuck, then go on */
 const along=t=>t<7.5?t:t<13.5?7.5:t-6,pairX=t=>lerp(190,470,clamp(along(t)/18,0,1)),stopX=pairX(8)-150;
 const host=svg.closest('.lw-theatre'),say=host&&sayBox(host,4),SAY=[[4.6,7.6,0],[7.8,10.4,1],[10.6,13.4,2],[13.9,16.6,3]];
 const th={svg,cycle:26,start:performance.now(),visible:()=>!document.hidden&&svg.getBoundingClientRect().width>0,
  tick(t){
   const pOp=t<.6?t/.6:t>23.5?clamp(1-(t-23.5)/2,0,1):1,px=pairX(t);
   pair.setAttribute('transform',`translate(${px.toFixed(1)} 0)`);pair.setAttribute('opacity',pOp.toFixed(2));swingLegs(camelLegs,t>=7.5&&t<13.5?0:Math.sin(t*5)*12);
   light.setAttribute('opacity',(0.82+0.18*Math.sin(t*2.2)).toFixed(2));
   let hx,dir=1,gallop=0;
   if(t<2)hx=-120;else if(t<8){hx=lerp(-120,stopX,ease((t-2)/6));gallop=1}else if(t<13.8){hx=stopX;dir=t<13.2?1:-1}else{hx=lerp(stopX,-160,ease(clamp((t-13.8)/6,0,1)));dir=-1;gallop=t<19.8?1:0}
   const sink=t>=8&&t<13.8?Math.min(1,(t-8)/.6)*(t>13?1-(t-13)/.8:1):0;
   horse.setAttribute('transform',`translate(${hx.toFixed(1)} ${(216+sink*9).toFixed(1)})`);flip.setAttribute('transform',`scale(${dir} 1)`);
   front.setAttribute('transform',`scale(1 ${(1-.5*sink).toFixed(3)})`);rider.setAttribute('transform',`rotate(${(sink*14).toFixed(1)} 0 -42)`);
   swingLegs(horseLegs,gallop?Math.sin(t*16)*24:0);
   const dustOn=gallop||sink>0;dust.setAttribute('transform',`translate(${(hx+(dir>0?-24:24)).toFixed(1)} 214) scale(${dustOn?1:.01})`);dust.setAttribute('opacity',dustOn?'.8':'0');
   horse.setAttribute('opacity',t<2||t>20?'0':'1');
   if(captionEl){let c=0;HIJRAH_CAPTIONS.forEach((x,i)=>{if(t>=x[0])c=i});if(c!==lastCap){lastCap=c;captionEl.textContent=HIJRAH_CAPTIONS[c][1]}}
   if(say){const i=sayAt(t,SAY);if(i<0)say.set(-1);else{const r=svg.getBoundingClientRect(),hr=host.getBoundingClientRect(),k=r.width/600,ox=r.left-hr.left,oy=r.top-hr.top,[x,y]=i<2?[px,full?82:90]:[hx,140];say.set(i,ox+x*k,oy+y*k)}}
  }};
 if(reduced()){th.tick(11.5);th.pausedT=11.5}LW.theatres.add(th);run()
 return th;
}
/* ---------- the same scenes, walking along the map road ---------- */
/* The road is MAP_GEO.road: samples [x,y,distance]. Figures shrink with depth like the walkers. */
function roadAt(R,s){s=clamp(s,0,R[R.length-1][2]);let lo=0,hi=R.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(R[m][2]<s)lo=m;else hi=m}const a=R[lo],b=R[hi],t=b[2]>a[2]?(s-a[2])/(b[2]-a[2]):0;return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}
function roadDir(R,s,prev){const a=roadAt(R,s-4),b=roadAt(R,s+4),dx=b[0]-a[0];return Math.abs(dx)<.6?(prev||1):dx>0?1:-1}
function depthAt(y,P,k,floor){const v=clamp((y-P.y)/P.h,0,1);return Math.max(floor||0,.36*Math.max(P.w/1536,.6),(0.1+0.95*Math.pow(clamp((v-.08)/.85,0,1),1.15))*P.w/1536)*k}
function mapShowing(){const scr=document.getElementById('mapScreen');return!!scr&&!scr.classList.contains('hidden')&&!document.hidden}
const swingAll=(legs,a)=>legs.forEach((l,i)=>{const x=+l.getAttribute('x1'),y=+l.getAttribute('y1');l.setAttribute('transform',`rotate(${(i%2?a:-a).toFixed(1)} ${x} ${y})`)});
const ROAD_BIRD=`<path class="lwR-wing" d="M-12 0Q-6-9 0 0Q6-9 12 0" stroke="#3a2c20" fill="none" stroke-width="3" stroke-linecap="round"/><ellipse cx="0" cy="1" rx="4" ry="2.6" fill="#4a3826"/>`;
/* Abrahah's army marches up the road, the elephant kneels, the birds come with stones. */
/* The army in ranks on the street, front to back: banners, soldiers, the great elephant with Abrahah,
   three more elephants, more soldiers. a = along the street, l = across it (in soldier heights). */
const ARMY_ROAD=[{a:6.2,l:-.55,b:'#a3272b'},{a:6.2,l:.55,b:'#5a2f6e'},{a:5.5,l:-1},{a:5.5,l:0},{a:5.5,l:1},{a:4.8,l:-1},{a:4.8,l:0},{a:4.8,l:1},
 {a:3.2,l:0,e:1,king:1},{a:1.5,l:-1,e:1,i:1},{a:1.5,l:1,e:1,i:2},{a:-.2,l:0,e:1,i:3},
 {a:-1.7,l:-1},{a:-1.7,l:0},{a:-1.7,l:1},{a:-2.4,l:-1},{a:-2.4,l:0},{a:-2.4,l:1},{a:-3.1,l:-.55},{a:-3.1,l:.55,b:'#a3272b'}];
function elephantRoad(g,L,P){
 const R=L.street||L.road,len=R[R.length-1][2],crew=ARMY_ROAD.map((m,i)=>Object.assign({i},m)).sort((x,y)=>y.a-x.a);
 g.innerHTML=crew.map(c=>`<g class="lwR-m" data-m="${c.i}"><g class="lwR-body">${c.e?elephantSvg({king:c.king,i:c.i}):soldierSvg(c.i,c.b)}</g></g>`).join('')
  +crew.map(()=>`<circle class="lwR-stone" r="3.4" fill="#7a6650" stroke="#3d3022" stroke-width="1" opacity="0"/>`).join('')
  +crew.map(()=>`<g class="lwR-bird" opacity="0">${ROAD_BIRD}</g>`).join('');
 g.querySelectorAll('.lw-leg').forEach(l=>{l.setAttribute('stroke','#3f3021');l.setAttribute('stroke-width','2.6');l.setAttribute('stroke-linecap','round')});
 const M=[...g.querySelectorAll('.lwR-m')],body=M.map(m=>m.querySelector('.lwR-body')),ST=[...g.querySelectorAll('.lwR-stone')],B=[...g.querySelectorAll('.lwR-bird')],legs=[...g.querySelectorAll('.lw-leg')],leadIx=crew.findIndex(c=>c.king),front=M[leadIx].querySelector('.lwE-front'),king=M[leadIx].querySelector('.lwE-king'),dirs=[];
 /* one soldier's height on screen near the middle of the march */
 const hsAt=s=>{const p=roadAt(R,s);return 55*Math.min(depthAt(p[1],P,.95,L.H*.07/55),L.W*.13/55)};
 const hs0=hsAt(len*.3),s1=Math.max(len*.2,Math.min(len*.5,len-6.6*hs0)),s0=Math.max(3.4*hs0,len*.04);
 const sound=cueRunner([[.4,()=>SFX.wind(3,.45)],[1.2,()=>SFX.trumpet(.4,1)],[7,()=>SFX.trumpet(.6,1.05)],[13.1,()=>SFX.trumpet(.7,.8,1.6)],[14.2,()=>{SFX.birds(12,3,.65);SFX.flutter(3.4,.6)}],[16.6,()=>SFX.birds(8,2.4,.55)],[17.5,()=>SFX.stones(10,1.8,.65)],[20.2,()=>SFX.wind(4.6,1)]]);
 const th={svg:g,cycle:30,start:performance.now(),visible:mapShowing,still:16,
  tick(t){sound(t,()=>mapShowing()&&SFX.ok());
   const centre=lerp(s0,s1,ease(clamp(t/13,0,1))),hs=hsAt(centre);
   g.setAttribute('opacity',(t<.8?t/.8:t>23?clamp(1-(t-23)/1.6,0,1):1).toFixed(2));
   swingAll(legs,t<13?Math.sin(t*8)*16:0);
   crew.forEach((c,i)=>{const s=centre+c.a*hs,p0=roadAt(R,s),q0=roadAt(R,s-8),q1=roadAt(R,s+8),dx=q1[0]-q0[0],dy=q1[1]-q0[1],ln=Math.hypot(dx,dy)||1,d=dirs[i]=roadDir(R,s,dirs[i]);
    const p=[p0[0]-dy/ln*c.l*hs*.75,p0[1]+dx/ln*c.l*hs*.35],k=Math.min(depthAt(p[1],P,c.e?1.05:.95,c.e?L.H*.1/100:L.H*.07/55),c.e?L.W*.2/100:L.W*.13/55);c.p=p;c.k=k;
    M[i].setAttribute('transform',`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) scale(${(k*d).toFixed(3)} ${k.toFixed(3)})`);
    if(c.king){const q=clamp((t-13)/1.2,0,1);body[i].setAttribute('transform',`rotate(${(q*9).toFixed(2)} -27 0)`);const sc=1-.4*q;front.setAttribute('transform',`translate(0 ${(-24*(1-sc)).toFixed(2)}) scale(1 ${sc.toFixed(3)})`)}
    else{const f=clamp((t-18.6-(i%7)*.1)/1.1,0,1),o=1-clamp((t-19.6-(i%7)*.1)/1.4,0,1);body[i].setAttribute('transform',c.e?`rotate(${(f*12).toFixed(1)} -27 0)`:`rotate(${(-f*84).toFixed(1)})`);body[i].setAttribute('opacity',o.toFixed(2))}
    const hx=p[0],hy=p[1]-(c.e?128:84)*k,fin=ease(clamp((t-14.5-(i%9)*.13)/2.8,0,1)),fout=ease(clamp((t-20.4-(i%9)*.08)/2.6,0,1));
    let x=lerp(p[0]+L.W*.75,hx,fin),y=lerp(-50-(i%6)*14,hy,fin);if(fout>0){x=lerp(hx,p[0]-L.W*.8,fout);y=lerp(hy,-60-(i%6)*12,fout)}
    const bk=Math.max(k*1.1,.5);B[i].setAttribute('transform',`translate(${x.toFixed(1)} ${(y+Math.sin(t*6+i)*3).toFixed(1)}) scale(${bk.toFixed(3)})`);B[i].setAttribute('opacity',t>14.3&&t<23.5?'1':'0');
    B[i].querySelector('.lwR-wing').setAttribute('transform',`scale(1 ${(0.35+0.65*Math.abs(Math.sin(t*14+i))).toFixed(2)})`);
    const dd=clamp((t-17.5-(i%6)*.12)/1.1,0,1);ST[i].setAttribute('cx',hx.toFixed(1));ST[i].setAttribute('cy',lerp(hy+4,p[1]-22*k,dd*dd).toFixed(1));ST[i].setAttribute('r',Math.max(2,3.4*bk).toFixed(1));ST[i].setAttribute('opacity',t>17.4+(i%6)*.12&&dd<1?'1':'0');
   });
   const kf=clamp((t-18.9)/1.1,0,1);king.setAttribute('transform',`rotate(${(-kf*70).toFixed(1)} 0 -66)`);king.setAttribute('opacity',(1-clamp((t-19.9)/1.5,0,1)).toFixed(2));
  }};
 return th;
}
/* The Hijrah: two camels (no riders) with a light above them; Surāqah gallops up the road behind them, sinks and turns back. */
function hijrahRoad(g,L,P){
 const R=L.street||L.road,len=R[R.length-1][2];
 g.innerHTML=`<defs><radialGradient id="lwGlowR"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset=".5" stop-color="#ffe9a0" stop-opacity=".45"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs>`
  +`<g class="lwR-light"><ellipse cx="0" cy="0" rx="96" ry="58" fill="url(#lwGlowR)"/><g stroke="#fff3b8" stroke-width="3" stroke-linecap="round" opacity=".75">${[...Array(10)].map((_,i)=>{const a=i*Math.PI/5;return `<line x1="${(Math.cos(a)*18).toFixed(1)}" y1="${(-18+Math.sin(a)*18).toFixed(1)}" x2="${(Math.cos(a)*34).toFixed(1)}" y2="${(-18+Math.sin(a)*34).toFixed(1)}"/>`}).join('')}</g><circle cx="0" cy="-18" r="12" fill="#fffbe6"/></g>`
  +`<g class="lwR-m"><g class="lwR-body">${camelSvg({saddle:'#7a2f2a',color:'#c4955d'})}</g></g><g class="lwR-m"><g class="lwR-body">${camelSvg({saddle:'#2f5c7a',color:'#cfa36b'})}</g></g>`
  +`<g class="lwR-dust" opacity="0"><circle r="10" fill="#e8cf9e" opacity=".7"/><circle cx="14" cy="-4" r="8" fill="#ead6ab" opacity=".6"/><circle cx="-12" cy="-3" r="7" fill="#e3c792" opacity=".6"/></g><g class="lwR-horse" opacity="0"><g class="lwR-body">${horseSvg()}</g></g>`;
 const M=[...g.querySelectorAll(':scope > .lwR-m')],light=g.querySelector('.lwR-light'),horse=g.querySelector('.lwR-horse'),hb=horse.querySelector('.lwR-body'),front=g.querySelector('.lwH-front'),rider=g.querySelector('.lwH-rider'),dust=g.querySelector('.lwR-dust');
 const camelLegs=M.flatMap(m=>[...m.querySelectorAll('.lw-leg')]),horseLegs=[...horse.querySelectorAll('.lw-leg')],dirs=[];
 g.querySelectorAll('.lw-leg').forEach(l=>{const h=!!l.closest('.lwR-horse');l.setAttribute('stroke',h?'#5e3b21':'#9c7445');l.setAttribute('stroke-width',h?'4':'4.2');l.setAttribute('stroke-linecap','round')});
 /* the pair pauses while Surāqah is stuck in the sand, then goes on */
 const along=t=>t<9.5?t:t<16?9.5:t-6.5,pairS=t=>lerp(len*.12,len*.72,clamp(along(t)/20,0,1)),stepAt=s=>92*depthAt(roadAt(R,s)[1],P,1,L.H*.085/60),catchS=pairS(10)-2.4*stepAt(pairS(10));
 const frame=g.closest('.map-frame'),say=frame&&sayBox(frame,64),SAY=[[6.2,9.4,0],[9.6,12.4,1],[12.6,15.6,2],[16,19,3]];
 const th={svg:g,cycle:30,start:performance.now(),visible:mapShowing,still:13.5,
  tick(t){
   g.setAttribute('opacity',(t<.8?t/.8:t>27?clamp(1-(t-27)/1.8,0,1):1).toFixed(2));
   const ps=pairS(t),step=stepAt(ps),pts=[],paused=t>=9.5&&t<16;
   [0,-1.25].forEach((o,i)=>{const s=ps+o*step,p=roadAt(R,s),d=dirs[i]=roadDir(R,s,dirs[i]),k=Math.min(depthAt(p[1],P,1.1,L.H*.085/60),L.W*.17/60);pts.push([p,k]);M[i].setAttribute('transform',`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) scale(${(k*d).toFixed(3)} ${k.toFixed(3)})`)});
   swingAll(camelLegs,paused?0:Math.sin(t*5)*12);
   const mx=(pts[0][0][0]+pts[1][0][0])/2,my=Math.min(pts[0][0][1],pts[1][0][1]),lk=(pts[0][1]+pts[1][1])/2,ly=my-88*lk;
   light.setAttribute('transform',`translate(${mx.toFixed(1)} ${ly.toFixed(1)}) scale(${(lk*.8).toFixed(3)})`);light.setAttribute('opacity',(0.82+0.18*Math.sin(t*2.2)).toFixed(2));
   /* Surāqah: a little smaller than the camels */
   let hs,dir=null,gallop=0;
   if(t<3)hs=len*.01;else if(t<10){hs=lerp(len*.01,catchS,ease((t-3)/7));gallop=1}else if(t<15.8){hs=catchS}else{hs=lerp(catchS,len*.0,ease(clamp((t-15.8)/4.6,0,1)));gallop=t<20.4?1:0}
   const hp=roadAt(R,hs),hk=Math.min(depthAt(hp[1],P,.95,L.H*.08/80),L.W*.15/80);dir=roadDir(R,hs,dirs[2]);dirs[2]=dir;if(t>=15.2)dir=-dir;
   const sink=t>=10&&t<15.8?Math.min(1,(t-10)/.6)*(t>15?1-(t-15)/.8:1):0;
   horse.setAttribute('transform',`translate(${hp[0].toFixed(1)} ${(hp[1]+sink*9*hk).toFixed(1)}) scale(${(hk*dir).toFixed(3)} ${hk.toFixed(3)})`);horse.setAttribute('opacity',t<3||t>21.6?'0':'1');
   front.setAttribute('transform',`scale(1 ${(1-.5*sink).toFixed(3)})`);rider.setAttribute('transform',`rotate(${(sink*14).toFixed(1)} 0 -42)`);
   swingAll(horseLegs,gallop?Math.sin(t*16)*24:0);
   const dustOn=(gallop||sink>0)&&t>=3&&t<=21;dust.setAttribute('transform',`translate(${(hp[0]-dir*24*hk).toFixed(1)} ${(hp[1]-2).toFixed(1)}) scale(${(dustOn?hk:.01).toFixed(3)})`);dust.setAttribute('opacity',dustOn?'.8':'0');
   /* speech bubbles: Abū Bakr and the Prophet's ﷺ reply rise from the light; Surāqah's from above his head */
   if(say){const i=t>27?-1:sayAt(t,SAY);if(i<0)say.set(-1);else{const svgEl=g.ownerSVGElement,r=svgEl.getBoundingClientRect(),fr=frame.getBoundingClientRect(),k=r.width/L.W,[x,y]=i<2?[mx,ly-30*lk]:[hp[0],hp[1]-84*hk];say.set(i,r.left-fr.left+x*k,r.top-fr.top+y*k)}}
  }};
 return th;
}
/* which lessons each scene belongs to: story = lessons that play it above the story; road = the map that shows it on the road */
const SCENES=[
 {re:/year of the elephant/i,story:/year of the elephant|elephant who would not walk/i,road:elephantRoad,make:(svg,full,cap)=>elephantTheatre(svg,full,cap),label:"Animated scene: Abrahah's army with its elephants, the birds and the stones"},
 {re:/cave of thawr|surāqah|suraqah/i,road:hijrahRoad,make:(svg,full,cap)=>hijrahTheatre(svg,full,cap),label:'Animated scene: the two camels of the Hijrah with a light above them, and Surāqah on his horse'}
];
function lessonIndexFor(re){return typeof lessons!=='undefined'?lessons.findIndex(l=>re.test(String(l.title||''))):-1}
function paintElephantSpot(){
 const svg=document.getElementById('mapSvg'),L=typeof MAP_GEO!=='undefined'&&MAP_GEO;if(!svg||!L)return;
 svg.querySelectorAll('.lw-elephant-spot,.lw-road-scene').forEach(x=>x.remove());LW.theatres.forEach(th=>{if(!th.svg.isConnected)LW.theatres.delete(th)});document.querySelectorAll('.lw-scene-cap,.lw-nasheed-btn,.lw-lyrics,.map-frame > .lw-say').forEach(x=>x.remove());if(window.SeeraaNasheed)window.SeeraaNasheed.stop();
 if(!Array.isArray(L.road)||L.road.length<2)return;const P=photoBox(svg);if(!P)return;
 SCENES.forEach(sc=>{
  const gi=lessonIndexFor(sc.re);if(gi<0||lessons[gi].world!==viewWorld)return;
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','lw-road-scene');g.setAttribute('aria-hidden','true');g.setAttribute('pointer-events','none');
  (svg.querySelector('.historical-dust-road')||svg.querySelector('.lw-life')||svg.querySelector('.history-scene')).insertAdjacentElement('afterend',g);
  const th=sc.road(g,L,P);if(reduced()){th.pausedT=th.still??6;th.tick(th.pausedT)}LW.theatres.add(th);run()
 });
}

/* ---------- lesson numbers on every stop of the road (a small lock or tick sits on the edge) ---------- */
function numberStops(){
 const svg=document.getElementById('mapSvg');if(!svg||typeof lessons==='undefined')return;
 svg.querySelectorAll('.node').forEach(n=>{const i=Number(n.dataset.i),l=lessons[i],t=n.querySelector('text[y="8"]');if(!l||!t)return;
  const locked=n.classList.contains('locked'),done=typeof profile!=='undefined'&&profile.stars&&profile.stars[i]>0,num=String(l.lines);
  t.textContent=num;t.setAttribute('font-size',num.length>2?'17':'20');t.setAttribute('font-weight','700');
  n.querySelector('.lw-stop-badge')?.remove();
  if(locked||done)n.insertAdjacentHTML('beforeend',`<g class="lw-stop-badge" transform="translate(21 -21)" pointer-events="none"><circle r="11" fill="${done?'#2e6b58':'#6b5a45'}" stroke="#fff" stroke-width="2"/><text y="4.5" text-anchor="middle" font-size="${done?13:10}" fill="#fff">${done?'✓':'🔒'}</text></g>`);
  n.setAttribute('aria-label',`Lesson ${num}: ${l.title}${locked?' (locked)':done?' (done)':''}`)});
 /* the trail turns gold up to the furthest lesson already done */
 const L=typeof MAP_GEO!=='undefined'&&MAP_GEO,gold=svg.querySelector('.trail-done');if(!L||!gold||!Array.isArray(L.road))return;
 let best=0;svg.querySelectorAll('.node').forEach(n=>{const i=Number(n.dataset.i);if(!(profile.stars&&profile.stars[i]>0))return;const m=/translate\(([-\d.]+)[ ,]+([-\d.]+)/.exec(n.getAttribute('transform')||'');if(!m)return;const x=+m[1],y=+m[2];let bs=0,bd=1e9;L.road.forEach(q=>{const d=Math.hypot(q[0]-x,q[1]-y);if(d<bd){bd=d;bs=q[2]}});best=Math.max(best,bs)});
 if(typeof mapQuizPassed==='function'&&mapQuizPassed(viewWorld))best=L.road[L.road.length-1][2];
 gold.setAttribute('stroke-dasharray',`${best.toFixed(1)} 100000`);
}
/* ---------- wire into the map ---------- */
if(typeof layoutMapRoad==='function'){
 const layoutBeforeLiving=layoutMapRoad;
 layoutMapRoad=function(){const r=layoutBeforeLiving.apply(this,arguments);try{paintLife();paintElephantSpot()}catch(e){console.warn('living map',e)}try{numberStops()}catch(e){console.warn('stop numbers',e)}return r};
}

/* ---------- the lesson story, like the Extra story panel ---------- */
function esc(s){return typeof escapeHtml==='function'?escapeHtml(String(s)):String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function storyWithArabic(text,quotes){
 const found=[];quotes.forEach(q=>{const at=String(text).indexOf(q.en);if(at>=0)found.push({at,end:at+q.en.length,q})});
 if(!found.length)return'';found.sort((a,b)=>a.at-b.at);let pos=0,html='';
 found.forEach(f=>{if(f.at<pos)return;let s0=f.at,e0=f.end;if(/[“"]/.test(text[s0-1]||''))s0--;if(/[”"]/.test(text[e0]||''))e0++;
  html+=esc(text.slice(pos,s0))+`<span class="lw-q"><span class="lw-q-ar" lang="ar" dir="rtl">${esc(f.q.ar)}</span><span class="lw-q-en">“${esc(f.q.en)}”</span><span class="lw-q-ref">${esc(f.q.ref)}</span></span>`;pos=e0});
 return html+esc(text.slice(pos));
}
/* ---------- the Learn step: what we learn from the story (not the story again) ---------- */
function renderLearnPage(l){
 const L=l.seerah.learn,v=L.verse,stage=document.getElementById('stage'),edit=typeof lessonEditFor==='function'?lessonEditFor(l):null;
 const notes=edit&&edit.text?(typeof formatExplanation==='function'?formatExplanation(edit.text):esc(edit.text)):'';
 const tryText=typeof simpleExplanationFor==='function'?simpleExplanationFor(l):l.seerah.benefit;
 stage.innerHTML=`<div class="kicker">What we learn · Lesson ${esc(l.lines)}</div><h1 class="lesson-title">${esc(l.title)}</h1>`
  +`<figure class="lw-verse ${v.kind}"><figcaption>${v.kind==='quran'?'📖 From the Qurʾān':'🌿 From the hadith'}</figcaption><p class="lw-verse-ar" lang="ar" dir="rtl">${esc(v.ar)}</p><p class="lw-verse-en">“${esc(v.en)}”</p><p class="lw-verse-ref">${esc(v.ref)}</p><div class="lw-verse-say"><button type="button" class="ghost" id="lwSayAr">🔊 Arabic</button><button type="button" class="ghost" id="lwSayEn">🔊 Meaning</button></div></figure>`
  +`<h2 class="lw-learn-h">3 lessons from this story</h2><ol class="lw-points">${L.points.map((p,i)=>`<li><span class="lw-pt-n" aria-hidden="true">${i+1}</span><span>${esc(p)}</span></li>`).join('')}</ol>`
  +(notes?`<div class="lw-teacher"><h3>👩‍🏫 Notes from your teacher</h3><div>${notes}</div></div>`:'')
  +`<div class="simple-box lw-try"><h3>💡 Try this week</h3><p>${esc(tryText)}</p></div>`
  +`<p class="builder-tip">Ages 7–10: which of the 3 lessons will you practise today?<br>Ages 11–15: explain to someone how the verse or hadith connects to the story.</p>`;
 const say=(t,lang)=>{if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang=lang;u.rate=lang==='ar-SA'?.8:.88;speechSynthesis.speak(u)};
 document.getElementById('lwSayAr').onclick=()=>typeof sayArabic==='function'?sayArabic(v.ar):say(v.ar,'ar-SA');
 document.getElementById('lwSayEn').onclick=()=>say(v.en,'en-AU');
 if(typeof nextButton==='function')nextButton('Match the words →');
}
if(typeof renderExplanation==='function'){
 const renderExplanationBeforeLearn=renderExplanation;
 renderExplanation=function(l){if(l&&l.seerah&&l.seerah.learn){try{return renderLearnPage(l)}catch(e){console.warn('learn page',e)}}return renderExplanationBeforeLearn.apply(this,arguments)};
}
function dressStory(l){
 const stage=document.getElementById('stage');if(!stage||!l)return;const wi=Math.max(0,l.world||0),S=typeof SEERAA_SCENES!=='undefined'?SEERAA_SCENES[wi%SEERAA_SCENES.length]:null;
 stage.classList.add('lw-story');
 const kicker=stage.querySelector('.kicker'),title=stage.querySelector('.lesson-title'),card=stage.querySelector('.matn-card');
 if(kicker)kicker.classList.add('lw-hide');
 const head=document.createElement('header');head.className='lw-head';if(S){head.style.setProperty('--lw-photo',`url("assets/scenes/${S.asset}.webp")`);head.style.setProperty('--lw-focus',`${Math.round(S.focus*100)}% 55%`)}
 head.innerHTML=`<div><p class="lw-eyebrow">Map ${wi+1} · Lesson ${esc(l.lines||'')}</p><p class="lw-place">${esc(S?S.place:(l.seerah&&l.seerah.chapter)||'Seeraa')}</p></div><span class="lw-emblem" aria-hidden="true">${esc((l.seerah&&l.seerah.emoji)||'📜')}</span>`;
 stage.insertBefore(head,stage.firstChild);
 if(title){title.classList.add('lw-title');const intro=document.createElement('p');intro.className='lw-intro';intro.textContent='Read a little. Think together. Then explore the lesson.';title.insertAdjacentElement('afterend',intro)}
 if(card){card.classList.add('lw-reading');const listen=card.querySelector('#storyListen');if(listen)listen.classList.add('lw-listen')}
 /* each Qur'an verse or hadith quoted in the story: Arabic first, then the English */
 const para=card&&card.querySelector('p'),quotes=(l.seerah&&l.seerah.quotes)||[];
 if(para&&quotes.length){const html=storyWithArabic(typeof storyText==='function'?storyText(l):l.translation,quotes);if(html)para.innerHTML=html}
 /* the lesson's scene (Year of the Elephant, the Hijrah) plays above the story */
 const sc=SCENES.find(x=>x.make&&(x.story||x.re).test(String(l.title||'')));
 if(sc&&card){
  const fig=document.createElement('figure');fig.className='lw-theatre';
  fig.innerHTML='<svg viewBox="0 0 600 260" role="img"></svg><figcaption aria-live="polite"></figcaption><button type="button" class="lw-replay">▶ Watch again</button>';fig.querySelector('svg').setAttribute('aria-label',sc.label);
  card.parentNode.insertBefore(fig,card);
  let th=sc.make(fig.querySelector('svg'),true,fig.querySelector('figcaption'));
  fig.querySelector('.lw-replay').onclick=()=>{LW.theatres.delete(th);th=sc.make(fig.querySelector('svg'),true,fig.querySelector('figcaption'));th.start=performance.now()};
 }
 /* talk together, by age */
 const picks=(l.seerah&&Array.isArray(l.seerah.picks)&&l.seerah.picks)||[];
 if(card&&!stage.querySelector('.lw-think')){
  const q1=picks[0]&&picks[0].q?picks[0].q:'Retell what happened in your own words.',q2=picks[1]&&picks[1].q?picks[1].q:'Why does this part of the Seeraa matter?';
  card.insertAdjacentHTML('afterend',`<div class="lw-think"><strong>Ages 7–10 · Talk together</strong><p>${esc(q1)}</p><details><summary>Ages 11–15 · Think deeper</summary><p>${esc(q2)} Which lesson from this story can you practise this week?</p></details></div>`);
 }
}
if(typeof renderMatn==='function'){
 const renderMatnBeforeLiving=renderMatn;
 renderMatn=function(l){const r=renderMatnBeforeLiving.apply(this,arguments);try{dressStory(l)}catch(e){console.warn('story look',e)}return r};
}

/* ---------- styles ---------- */
document.head.insertAdjacentHTML('beforeend',`<style id="lw-style">
.lw-life .lw-leg{stroke:#3f3021;stroke-width:2.4;stroke-linecap:round}
.lw-life .lw-k-c .lw-leg,.lw-life .lw-k-cl .lw-leg{stroke:#9c7445;stroke-width:3.4}
.lw-life .lw-k-g .lw-leg,.lw-life .lw-k-s .lw-leg{stroke:#4f3d2b;stroke-width:1.6}
.lw-life .lw-fig .lw-leg{transform-box:fill-box;transform-origin:50% 0;animation:lwStep .55s ease-in-out infinite alternate}
.lw-life .lw-fig .lw-leg.b{animation-direction:alternate-reverse}
.lw-life .lw-k-c .lw-leg,.lw-life .lw-k-cl .lw-leg{animation-duration:.8s}
.lw-life .lw-fig,.lw-watch{filter:drop-shadow(0 2px 1.5px rgba(40,25,10,.35))}
.lw-watch .lw-lean{animation:lwLean 4.5s ease-in-out infinite alternate}
@keyframes lwLean{from{transform:translateY(0)}to{transform:translateY(-1.5px)}}
.lw-life .lw-k-h .lw-leg{stroke:#d9a33a;stroke-width:1.4}
.lw-life .lw-k-h .lw-peck{transform-box:fill-box;transform-origin:0 100%;animation:lwPeck 1.7s ease-in-out infinite}
@keyframes lwPeck{0%,55%,100%{transform:rotate(0)}65%,80%{transform:rotate(38deg) translate(1px,3px)}}
.lw-life .lw-graze .lw-leg{animation-duration:1.1s}
@keyframes lwStep{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}
.lw-life .lw-wing{transform-box:fill-box;transform-origin:50% 100%;animation:lwFlap .35s ease-in-out infinite alternate}
@keyframes lwFlap{from{transform:scaleY(1)}to{transform:scaleY(.25)}}
.lw-wind{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden}
.lw-rain{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden;opacity:0;transition:opacity 1.2s}
.lw-rain.go{animation:lwShower 9s ease-in-out forwards}
.lw-rain i{position:absolute;top:-12%;width:1.5px;height:7%;background:linear-gradient(180deg,rgba(220,232,245,0),rgba(214,228,244,.85));transform:rotate(12deg);animation:lwDrop .7s linear infinite}
@keyframes lwShower{0%,100%{opacity:0}15%,80%{opacity:.85}}
@keyframes lwDrop{from{transform:translate(0,0) rotate(12deg)}to{transform:translate(-14vh,118vh) rotate(12deg)}}
.lw-mood .lw-star{animation:lwTwinkle 2.6s ease-in-out infinite alternate}
@keyframes lwTwinkle{from{opacity:.35}to{opacity:1}}
.lw-m-night .lw-life .lw-fig,.lw-m-night .lw-road-scene{filter:brightness(.62) saturate(.8)}
.lw-wind i{position:absolute;left:-40%;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(255,240,205,0),rgba(255,236,196,.95),rgba(255,240,205,0));opacity:0}
.lw-wind b{position:absolute;left:-5%;width:3px;height:3px;border-radius:50%;background:#f3dcab;opacity:0}
.lw-wind.go i{animation:lwGust 2.6s ease-in forwards}
.lw-wind.go b{animation:lwSand 2.4s ease-in forwards}
@keyframes lwGust{0%{transform:translateX(0);opacity:0}25%{opacity:1}100%{transform:translateX(320%);opacity:0}}
@keyframes lwSand{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(110vw,-30px);opacity:0}}
.lw-road-scene{will-change:transform}
.lw-road-scene .lwR-horse{filter:drop-shadow(0 0 1.6px rgba(255,250,235,.95)) drop-shadow(0 2px 2px rgba(40,25,10,.45))}
.lw-say{position:absolute;left:0;top:0;z-index:6;max-width:min(300px,72%);box-sizing:border-box;padding:7px 12px 8px;border-radius:14px;background:#fffaf0;border:2px solid #d6b36a;box-shadow:0 3px 12px rgba(56,39,22,.28);color:#3f3021;pointer-events:none;opacity:0;transition:opacity .35s;text-align:center}
.lw-say.on{opacity:1}
.lw-say::after{content:'';position:absolute;left:var(--tail,50%);bottom:-9px;width:14px;height:14px;margin-left:-7px;background:inherit;border:inherit;border-top:0;border-left:0;transform:rotate(45deg);border-radius:0 0 3px 0}
.lw-say.below::after{display:none}
.lw-theatre .lw-replay{z-index:7}
.lw-say b{display:block;font:800 11px/1.2 Nunito,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8a6320;margin-bottom:2px}
.lw-say[data-who="nabi"]{background:#fffbe6;border-color:#e8c45a}
.lw-say[data-who="abubakr"]{background:#f3f8ee;border-color:#9cc08a}.lw-say[data-who="abubakr"] b{color:#3f6b33}
.lw-say[data-who="suraqah"]{background:#fdf1ec;border-color:#c98a6e}.lw-say[data-who="suraqah"] b{color:#9a3f2a}
.lw-say[data-who="quran"]{background:#fffbea;border-color:#e3b93f;box-shadow:0 0 0 4px rgba(255,236,170,.45),0 3px 12px rgba(56,39,22,.28)}.lw-say[data-who="quran"] .lw-say-ar{font-size:21px}
.lw-say[data-who="people"]{background:#eef4fb;border-color:#8fb0d0}.lw-say[data-who="people"] b{color:#2f5a7a}
.lw-say[data-who="sahabi"]{background:#f3f8ee;border-color:#9cc08a}.lw-say[data-who="sahabi"] b{color:#3f6b33}
.lw-say[data-who="king"]{background:#f7f0fb;border-color:#b58fc9}.lw-say[data-who="king"] b{color:#5a2f6e}
.lw-say-ar{display:block;font:700 17px/1.7 Amiri,'Noto Naskh Arabic',serif;color:#3a2814}
.lw-say-en{display:block;font:700 12.5px/1.35 Nunito,system-ui,sans-serif}
@media(max-width:640px){.lw-say{max-width:min(250px,80%);padding:6px 10px}.lw-say-ar{font-size:15px}.lw-say-en{font-size:11.5px}}
@media(max-width:640px){.lw-theatre .lw-say{max-width:78%;padding:4px 8px 5px;border-radius:11px}.lw-theatre .lw-say b{font-size:9px}.lw-theatre .lw-say-ar{font-size:13.5px;line-height:1.55}.lw-theatre .lw-say-en{font-size:10.5px}.lw-theatre .lw-say[data-who="quran"] .lw-say-ar{font-size:15px}}
/* lesson story like the Extra story panel */
#stage.lw-story{padding:0;overflow:hidden;text-align:left}
#stage.lw-story>*:not(.lw-head){margin-left:clamp(16px,4vw,36px);margin-right:clamp(16px,4vw,36px)}
.lw-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:24px clamp(18px,4vw,32px);background:linear-gradient(90deg,#493721ed,#49372185),var(--lw-photo,none) var(--lw-focus,center) /cover;color:#fff7e7;border-radius:inherit;border-bottom-left-radius:0;border-bottom-right-radius:0}
.lw-eyebrow{margin:0 0 4px;font:800 11px/1.4 Nunito,system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase}
.lw-place{margin:0;font:15px/1.4 Nunito,system-ui,sans-serif}
.lw-emblem{flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#fff3;border:1px solid #fff8;font-size:24px}
.lw-hide{display:none!important}
#stage.lw-story .lw-title{margin-top:24px;margin-bottom:6px;font:800 clamp(26px,4vw,37px)/1.2 Nunito,system-ui,sans-serif;color:#503c28;text-align:left}
.lw-intro{margin:0 0 6px;color:#7c694c;font:14px/1.5 Nunito,system-ui,sans-serif}
#stage.lw-story .lw-reading{background:none;border:0;box-shadow:none;padding:0;margin-top:8px}
#stage.lw-story .lw-reading p{font:400 clamp(17px,2.2vw,19px)/1.85 Nunito,system-ui,sans-serif!important;color:#3d3225;margin:16px 0}
#stage.lw-story .lw-listen{background:#fffaf0;color:#3d3225;border:2px solid #d4b26b;border-radius:999px;box-shadow:none;padding:10px 22px;font:16px Marcellus,serif}
#stage.lw-story .lw-listen:hover{background:#fff1d0}
.lw-think{margin:22px 0;padding:14px 20px;background:#eef1e5;border-left:4px solid #6a7a53;border-radius:0 12px 12px 0;font:15px/1.6 Nunito,system-ui,sans-serif;color:#3d3225}
.lw-think strong{display:block;font-size:13px;margin-bottom:4px}
.lw-think p{margin:6px 0}
.lw-think summary{font-weight:700;font-size:14px;cursor:pointer}
#stage.lw-story .source-note{font:12px/1.6 Nunito,system-ui,sans-serif;color:#77664d}
.lw-q{display:block;margin:.8em 0;padding:.7em .95em;border-inline-start:4px solid #d6b36a;background:#fff8e6;border-radius:12px}
.lw-q-ar{display:block;font:700 clamp(20px,4.6vw,26px)/1.9 Amiri,'Noto Naskh Arabic',serif;color:#4b3417;text-align:right;direction:rtl}
.lw-q-en{display:block;font-style:italic}
.lw-q-ref{display:block;margin-top:2px;font:700 12px/1.3 Nunito,system-ui,sans-serif;color:#8a7356}
.lw-verse{margin:14px 0 18px;padding:16px 18px;border:1px solid #e3c995;border-radius:18px;background:linear-gradient(180deg,#fffaf0,#fff1d6);text-align:center;box-shadow:0 3px 0 #e8d3a8}
.lw-verse.hadith{background:linear-gradient(180deg,#f6fbf2,#e6f3dc);border-color:#bcd8a8;box-shadow:0 3px 0 #cfe3bf}
.lw-verse figcaption{font:800 12px/1 Nunito,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8a6320}
.lw-verse.hadith figcaption{color:#3f6b33}
.lw-verse-ar{margin:10px 0 6px;font:700 clamp(23px,5.4vw,32px)/1.9 Amiri,'Noto Naskh Arabic',serif;color:#4b3417;direction:rtl}
.lw-verse-en{margin:0 0 6px;font:700 17px/1.55 Nunito,system-ui,sans-serif;color:#3f3021}
.lw-verse-ref{margin:0;font:700 12.5px/1.3 Nunito,system-ui,sans-serif;color:#8a7356}
.lw-verse-say{display:flex;gap:8px;justify-content:center;margin-top:10px}
.lw-verse-say button{padding:6px 12px;font-size:13px}
.lw-learn-h{margin:6px 0 10px;font:800 19px/1.3 Nunito,system-ui,sans-serif;color:#4a3826}
.lw-points{list-style:none;margin:0 0 16px;padding:0;display:grid;gap:10px}
.lw-points li{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border:1px solid #e6d3ad;border-radius:14px;background:#fffdf7;font:600 16px/1.5 Nunito,system-ui,sans-serif;color:#3f3021;box-shadow:0 2px 0 #eadbbd}
.lw-pt-n{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#2e6b58;color:#fff;font:800 15px/1 Nunito,system-ui,sans-serif}
.lw-teacher{margin:0 0 14px;padding:12px 14px;border:1px dashed #c9a86a;border-radius:14px;background:#fffaf0}
.lw-teacher h3,.lw-try h3{margin:0 0 6px}
.lw-theatre{position:relative;margin:18px 0 6px;border:1px solid #d9c299;border-radius:16px;overflow:hidden;background:#fbe4b8}
.lw-theatre svg{display:block;width:100%;height:auto}
.lw-theatre figcaption{min-height:3.2em;padding:10px 14px;background:#fffaf0;border-top:1px solid #e6d3ad;font:600 15px/1.5 Nunito,system-ui,sans-serif;color:#4a3826}
.lw-replay{position:absolute;top:10px;right:10px;border:1px solid #fff9;border-radius:999px;background:#3d2c1ccc;color:#fff7e7;padding:6px 12px;font:700 13px Nunito,system-ui,sans-serif;cursor:pointer}
/* lesson steps as game tiles */
.lesson-side .side-step{position:relative;gap:10px;min-height:46px;border-radius:16px;border-width:3px;box-shadow:0 3px 0 rgba(0,0,0,.12);transition:transform .15s,box-shadow .15s}
.lesson-side .side-step.can-open:hover{transform:translateY(-2px);box-shadow:0 5px 0 rgba(0,0,0,.14)}
.lesson-side .side-step.can-open:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(0,0,0,.14)}
.lesson-side .side-step.current{background:linear-gradient(180deg,#fff8d9,#ffe9a3);border-color:#ffcf4d;animation:lwGlow 1.8s ease-in-out infinite}
.lesson-side .side-step.done{background:linear-gradient(180deg,#e9f8e5,#cdeec7);border-color:#bfe6b6}
@keyframes lwGlow{0%,100%{box-shadow:0 3px 0 rgba(0,0,0,.12),0 0 0 0 rgba(255,207,77,.0)}50%{box-shadow:0 3px 0 rgba(0,0,0,.12),0 0 0 6px rgba(255,207,77,.35)}}
@media(max-width:640px){.lw-head{padding:18px}.lw-emblem{width:38px;height:38px;font-size:20px}.lw-theatre figcaption{font-size:14px}}
.seeraa-calm .lw-watch .lw-lean{animation:none}
@media(prefers-reduced-motion:reduce){.lw-watch .lw-lean,.lw-life .lw-fig .lw-leg,.lw-life .lw-wing,.lesson-side .side-step.current,.lw-mood .lw-star{animation:none}.lw-wind,.lw-rain{display:none}}
</style>`);
/* shared with seeraa-event-scenes.js (Badr, Uḥud, Ḥudaybiyyah, the Opening of Makkah) */
window.SeeraaLiving={SFX,cueRunner,sayBox,LW,run,reduced,elephantSvg,clamp,lerp,ease,SKIN,personSvg,camelSvg,goatSvg,soldierSvg,horseSvg,kaabaSvg,roadAt,roadDir,depthAt,mapShowing,photoBox,swingAll,SCENES,resumeWeather:()=>{const svg=document.getElementById('mapSvg'),P=svg&&photoBox(svg),S=SEERAA_SCENES[viewWorld];if(P&&S){paintMood(svg,P,S.mood||'');scheduleGust(svg.closest('.map-frame'),!!LANES[S.asset]?.dusty)}},repaint:()=>{try{paintElephantSpot()}catch(e){console.warn('living map',e)}}};
})();
