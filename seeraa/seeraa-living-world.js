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
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
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
 makkah:{roads:[[[.62,.99],[.56,.72],[.49,.54],[.43,.43]],[[.97,.36],[.80,.335],[.62,.32],[.47,.30]],[[.30,.64],[.45,.62],[.60,.66]]],hills:[[[.47,.14],[.55,.12],[.62,.15]],[[.80,.09],[.88,.07],[.95,.10]],[[.05,.13],[.12,.12]]],dusty:1},
 hira:{roads:[[[.68,.99],[.60,.74],[.52,.56],[.53,.44],[.60,.33]],[[.08,.43],[.20,.45],[.30,.47]]],hills:[[[.62,.27],[.70,.24],[.77,.27]],[[.40,.33],[.46,.30]],[[.84,.22],[.90,.25]]],dusty:1},
 madinah:{roads:[[[.72,.99],[.60,.72],[.47,.48],[.36,.33]],[[.62,.36],[.75,.355],[.88,.36]]],hills:[[[.20,.09],[.30,.08]],[[.62,.10],[.70,.11]],[[.88,.09],[.95,.10]]]},
 taif:{roads:[[[.56,.99],[.52,.76],[.56,.56],[.59,.42]],[[.22,.74],[.30,.72],[.36,.74]]],hills:[[[.74,.14],[.80,.12]],[[.30,.12],[.38,.11]],[[.92,.20],[.97,.18]]]},
 abyssinia:{roads:[[[.62,.99],[.56,.74],[.49,.52],[.52,.42]],[[.62,.40],[.70,.40],[.76,.42]]],hills:[[[.38,.26],[.47,.24]],[[.20,.22],[.28,.20]],[[.86,.14],[.92,.13]]]},
 hijrah:{roads:[[[.88,.99],[.70,.74],[.60,.55],[.62,.40],[.70,.30]],[[.38,.21],[.60,.20],[.84,.19]],[[.16,.30],[.28,.40],[.40,.47]]],hills:[[[.22,.28],[.30,.26]],[[.40,.10],[.48,.09]],[[.76,.11],[.84,.10]]],dusty:1},
 uhud:{roads:[[[.72,.99],[.58,.70],[.46,.44],[.40,.35]],[[.44,.33],[.58,.31],[.72,.30]]],hills:[[[.74,.29],[.82,.32]],[[.48,.12],[.56,.10],[.64,.13]],[[.86,.15],[.93,.17]]],dusty:1},
 tabuk:{roads:[[[.58,.99],[.50,.70],[.44,.47],[.46,.37]],[[.26,.31],[.40,.30],[.58,.29]]],hills:[[[.86,.12],[.92,.10]],[[.30,.15],[.38,.13]],[[.06,.14],[.12,.12]]],dusty:1}
};
/* What walks on each of the 31 maps. */
const MAP_LIFE=[
 {road:['cl','p','w','cl','p'],hill:['g','g','g'],birds:3},            // 1 Arabia: traders' caravan
 {road:['p','w','p','c','g'],hill:['g','g'],birds:2},                  // 2 The Prophet's family
 {road:['p','w','g'],hill:['g','g'],birds:2},                          // 3 Year of the Elephant (the army has its own scene)
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
const ROBES=['#e9dcc2','#d8c3a0','#b98a5a','#8e5a3a','#f2ece0','#c9b28a','#a7764f'],WRAPS=['#f4efe2','#d9cdb4','#b2493b','#e8e2d0','#7c5236'],ABAYAS=['#3b3433','#4a3b35','#5b4636','#2f3438'];
function figureFor(kind,i){
 if(kind==='p')return{h:personSvg({robe:ROBES[i%ROBES.length],wrap:WRAPS[(i*3)%WRAPS.length],skin:SKIN[i%SKIN.length],load:['bundle','basket','staff',''][i%4]}),k:1,speed:16};
 if(kind==='w')return{h:personSvg({woman:1,robe:ABAYAS[i%ABAYAS.length],wrap:ABAYAS[(i+1)%ABAYAS.length],skin:SKIN[(i+1)%SKIN.length],load:i%2?'basket':''}),k:.96,speed:14};
 if(kind==='c'||kind==='cl')return{h:camelSvg({load:kind==='cl',saddle:['#9b2f2a','#2f5c7a','#6a3d7a','#9a6a1f'][i%4],color:['#c79a63','#b98b55','#d2a874'][i%3]}),k:1.15,speed:12};
 if(kind==='s')return{h:goatSvg({sheep:1,color:['#f2ede2','#e7dfcf'][i%2],dark:'#4a3b2c'}),k:.75,speed:9};
 return{h:goatSvg({color:['#e8e1d2','#6b4f3a','#2f2a26','#b58a5c'][i%4],dark:'#4f3d2b'}),k:.75,speed:7};
}

/* ---------- the animation engine (one loop for everything) ---------- */
const LW={figs:[],theatres:new Set(),raf:0,t0:performance.now(),gustTimer:0};
function polyLen(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L}
function polyAt(pts,s){for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(s<=l||i===pts.length-1){const t=l?clamp(s/l,0,1):0;return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,b[0]-a[0]]}s-=l}return pts[pts.length-1].concat([1])}
function tick(now){
 LW.raf=0;
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
function run(){if(!LW.raf)LW.raf=requestAnimationFrame(tick)}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)run()});

/* ---------- living map ---------- */
function photoBox(svg){const img=svg.querySelector('.history-photo');if(!img)return null;return{x:+img.getAttribute('x'),y:+img.getAttribute('y'),w:+img.getAttribute('width'),h:+img.getAttribute('height')}}
function paintLife(){
 const svg=document.getElementById('mapSvg');if(!svg||typeof SEERAA_SCENES==='undefined')return;
 svg.querySelectorAll('.lw-life').forEach(g=>g.remove());LW.figs=LW.figs.filter(f=>f.el.isConnected&&f.el.closest('#mapSvg')!==svg);
 const P=photoBox(svg),S=SEERAA_SCENES[((viewWorld%SEERAA_SCENES.length)+SEERAA_SCENES.length)%SEERAA_SCENES.length],lanes=LANES[S.asset],life=MAP_LIFE[((viewWorld%MAP_LIFE.length)+MAP_LIFE.length)%MAP_LIFE.length];if(!P||!lanes||!life)return;
 const L=typeof MAP_GEO!=='undefined'&&MAP_GEO,R=L&&Array.isArray(L.road)&&L.road.length>1?L.road:null;let html='';const plan=[];
 const toMap=([u,v])=>[P.x+u*P.w,P.y+v*P.h],onScreen=pts=>!L||pts.some(([x,y])=>x>0&&x<L.W&&y>0&&y<L.H);
 /* people and animals walk on the painted street itself, both ways, keeping to either side */
 life.road.forEach((kind,i)=>{const a=.04+((i*.17)%.42),b=Math.min(.97,a+.42+((i*.11)%.15)),off=(i%2?1:-1)*(7+(i%3)*6);
  const pts=R?streetLane(R,a,b,off,P):lanes.roads[i%lanes.roads.length].map(toMap);plan.push({kind,pts,i})});
 life.hill.forEach((kind,i)=>{const pts=lanes.hills[i%lanes.hills.length].map(toMap);if(onScreen(pts))plan.push({kind,pts,i:i+7,hill:1})});
 plan.forEach((f,n)=>{const F=figureFor(f.kind,f.i);html+=`<g class="lw-fig lw-k-${f.kind}" data-n="${n}">${F.h}</g>`;f.F=F});
 for(let b=0;b<life.birds;b++)html+=`<g class="lw-bird" data-b="${b}">${birdSvg()}</g>`;
 const scene=svg.querySelector('.history-scene');if(!scene)return;
 scene.insertAdjacentHTML('afterend',`<g class="lw-life" aria-hidden="true" pointer-events="none">${html}</g>`);
 const g=svg.querySelector('.lw-life');
 plan.forEach((f,n)=>{const el=g.querySelector(`[data-n="${n}"]`),len=polyLen(f.pts);LW.figs.push({el,pts:f.pts,len,P,k:f.F.k,min:f.hill?.42*Math.max(P.w/1536,.6):0,speed:f.F.speed*(f.hill?.35:1)*P.w/1536*(.85+(n%3)*.12),off:(n*0.37%1)*len*2});if(reduced()){const p=polyAt(f.pts,len*((n*.29)%1)),v=clamp((p[1]-P.y)/P.h,0,1),sc=(0.1+0.95*Math.pow(clamp((v-.08)/.85,0,1),1.15))*P.w/1536*f.F.k;el.setAttribute('transform',`translate(${p[0]} ${p[1]}) scale(${sc})`)}});
 /* birds glide across the sky */
 for(let b=0;b<life.birds;b++){const el=g.querySelector(`[data-b="${b}"]`),y=P.y+P.h*(.04+b*.03),x0=P.x-40,x1=P.x+P.w+40;LW.figs.push({el,pts:b%2?[[x1,y],[x0,y+20]]:[[x0,y],[x1,y+15]],len:P.w+80,P:{x:P.x,y:P.y-P.h*2,w:P.w,h:P.h*3},k:1.1,speed:55*P.w/1536,off:b*P.w*.6})}
 paintMood(svg,P,S.mood||'');
 const frame=svg.closest('.map-frame');if(frame)frame.classList.toggle('lw-dusty',!!lanes.dusty);
 scheduleGust(frame,!!lanes.dusty);run();
}
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
 w.innerHTML=h;w.classList.remove('go');void w.offsetWidth;w.classList.add('go');
}

/* ---------- the Year of the Elephant ---------- */
const ELEPHANT_CAPTIONS=[[0,'Abrahah marches towards Makkah with a great army and an elephant, to destroy the Kaʿbah.'],[8,'The elephant kneels down. It will not walk towards the Kaʿbah.'],[9.6,'Allah sends flocks of birds — ṭayran abābīl — each carrying small stones.'],[12.6,'The stones strike the army, and it is left like straw that has been eaten. (Sūrat al-Fīl, 105)'],[16.5,'Allah protected His House. The Prophet Muhammad ﷺ was born in this same year.']];
function soldierSvg(i){const tunic=['#7a4b2b','#5c6b3c','#6d3a2e','#4f5b6a'][i%4];return `<g class="lw-legs"><line class="lw-leg a" x1="-3" y1="-16" x2="-4" y2="0"/><line class="lw-leg b" x1="3" y1="-16" x2="4" y2="0"/></g><path d="M-8-14 L-6-36 Q0-39 6-36 L8-14Z" fill="${tunic}"/><circle cx="0" cy="-42" r="6" fill="${SKIN[i%SKIN.length]}"/><path d="M-7-43 Q0-53 7-43Z" fill="#9aa1a8" stroke="#5d646b" stroke-width=".8"/><line x1="9" y1="-48" x2="13" y2="2" stroke="#6b4b2b" stroke-width="1.8"/><path d="M10.5-53 l2.5 6 -4 0Z" fill="#b8bec4"/><ellipse cx="-7" cy="-25" rx="5" ry="7" fill="#8a5a2b" stroke="#4d3015" stroke-width="1"/>`}
function elephantSvg(){return `<g class="lwE-back"><rect x="-27" y="-24" width="11" height="24" rx="3" fill="#858c96"/><rect x="-13" y="-24" width="11" height="24" rx="3" fill="#7d848e"/></g>`
 +`<g class="lwE-front"><rect x="9" y="-24" width="11" height="24" rx="3" fill="#858c96"/><rect x="22" y="-24" width="11" height="24" rx="3" fill="#7d848e"/></g>`
 +`<path d="M-34-40 q-7 6-5 15" stroke="#6d747e" fill="none" stroke-width="2.5"/>`
 +`<ellipse cx="0" cy="-44" rx="38" ry="25" fill="#959ca6"/><circle cx="36" cy="-52" r="17" fill="#959ca6"/><ellipse cx="27" cy="-52" rx="10" ry="14" fill="#7f8690"/>`
 +`<path d="M49-52 Q58-40 54-26 Q53-20 58-18" stroke="#959ca6" fill="none" stroke-width="8" stroke-linecap="round"/><path d="M45-40 q8 2 11 -3" stroke="#fff8e8" fill="none" stroke-width="3" stroke-linecap="round"/><circle cx="41" cy="-57" r="1.6" fill="#2b2b2b"/>`
 +`<path d="M-18-66 Q0-76 18-66 L16-54 L-16-54Z" fill="#9b2f2a"/><path d="M-18-66 Q0-76 18-66" stroke="#e4b85a" fill="none" stroke-width="2"/>`
 +`<g class="lwE-king"><path d="M-6-66 L-4-88 Q0-91 4-88 L6-66Z" fill="#5a2f6e"/><circle cx="0" cy="-94" r="6" fill="${SKIN[1]}"/><path d="M-6-99 L-6-104 -3-101 0-106 3-101 6-104 6-99Z" fill="#e4b85a" stroke="#9a7220" stroke-width=".6"/></g>`}
function kaabaSvg(){return `<path d="M-38 0 L-38-56 L0-66 L38-56 L38 0 L0 8Z" fill="#1f1f22"/><path d="M0-66 L38-56 L38 0 L0 8Z" fill="#2c2c30"/><path d="M-38-44 L0-53 L38-44 L38-38 L0-47 L-38-38Z" fill="#c9a43a"/><rect x="-6" y="-22" width="12" height="22" fill="#b38d2a" opacity=".85"/>`}
/* Builds the scene into an <svg> with viewBox 0 0 600 260. full: sky, hills and the Kaʿbah behind. */
function elephantTheatre(svg,full,captionEl){
 const soldiers=[-160,-122,-86,78,112];let h='';
 if(full)h+=`<defs><linearGradient id="lwSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c98a"/><stop offset=".6" stop-color="#fbe4b8"/><stop offset="1" stop-color="#f3d9a6"/></linearGradient></defs><rect width="600" height="260" fill="url(#lwSky)"/><circle cx="110" cy="70" r="28" fill="#fff1c4" opacity=".9"/><path d="M0 170 L60 120 L110 150 L170 95 L240 150 L300 112 L360 150 L430 100 L500 140 L560 110 L600 130 L600 260 L0 260Z" fill="#c9a06a"/><path d="M0 190 L80 160 L160 185 L250 158 L340 186 L430 165 L520 184 L600 170 L600 260 L0 260Z" fill="#d9b27a"/><rect y="214" width="600" height="46" fill="#e2c08a"/><g transform="translate(535 216)">${kaabaSvg()}</g>`;
 else h+=`<ellipse cx="300" cy="218" rx="260" ry="14" fill="#5b4126" opacity=".16"/>`;
 h+=`<g class="lwE-army">`+soldiers.map((x,i)=>i<3?`<g transform="translate(${x+300} 216)"><g class="lwE-s" data-s="${i}">${soldierSvg(i)}</g></g>`:'').join('')
  +`<g transform="translate(300 216)"><g class="lwE-el">${elephantSvg()}</g></g>`
  +soldiers.map((x,i)=>i>=3?`<g transform="translate(${x+300} 216)"><g class="lwE-s" data-s="${i}">${soldierSvg(i)}</g></g>`:'').join('')+`</g>`;
 const birds=[...soldiers,0].map((x,i)=>({hx:x+300+(i%2?6:-6),hy:58+(i%3)*14,sx:620+i*40,sy:-20-i*12,ex:-60-i*30,ey:-40-i*10}));
 h+=birds.map((b,i)=>`<circle class="lwE-stone" data-b="${i}" r="3.6" fill="#7a6650" stroke="#3d3022" stroke-width="1"/>`).join('');
 h+=birds.map((b,i)=>`<g class="lwE-bird" data-b="${i}"><path class="lwE-wing" d="M-12 0Q-6-9 0 0Q6-9 12 0" stroke="#3a2c20" fill="none" stroke-width="3" stroke-linecap="round"/><ellipse cx="0" cy="1" rx="4" ry="2.6" fill="#4a3826"/></g>`).join('');
 svg.innerHTML=h;
 const army=svg.querySelector('.lwE-army'),el=svg.querySelector('.lwE-el'),front=svg.querySelector('.lwE-front'),king=svg.querySelector('.lwE-king'),S=[...svg.querySelectorAll('.lwE-s')],B=[...svg.querySelectorAll('.lwE-bird')],ST=[...svg.querySelectorAll('.lwE-stone')],legs=[...svg.querySelectorAll('.lwE-army .lw-leg')];
 let lastCap=-1;
 const th={svg,cycle:24,start:performance.now(),visible:()=>!document.hidden&&svg.getBoundingClientRect().width>0,
  tick(t){
   const walk=t<8,ax=walk?lerp(-300,0,ease(t/8)):0,aOp=t<.6?t/.6:t>21?clamp(1-(t-21)/2,0,1):1;
   army.setAttribute('transform',`translate(${ax.toFixed(1)} 0)`);army.setAttribute('opacity',aOp.toFixed(2));
   const swing=walk?Math.sin(t*9)*16:0;legs.forEach((l,i)=>{const x=+l.getAttribute('x1'),y=+l.getAttribute('y1');l.setAttribute('transform',`rotate(${(i%2?swing:-swing).toFixed(1)} ${x} ${y})`)});
   const k=clamp((t-8)/1.2,0,1);el.setAttribute('transform',`rotate(${(k*9).toFixed(2)} -27 0)`);{const sc=1-.4*k;front.setAttribute('transform',`translate(0 ${(-24*(1-sc)).toFixed(2)}) scale(1 ${sc.toFixed(3)})`)}
   S.forEach((s,i)=>{const f=clamp((t-13-i*.12)/1.1,0,1),o=1-clamp((t-14.4-i*.12)/1.6,0,1);s.setAttribute('transform',`rotate(${(f*84*(i<3?-1:1)).toFixed(1)} 0 0)`);s.setAttribute('opacity',o.toFixed(2))});
   {const f=clamp((t-13.3)/1.1,0,1),o=1-clamp((t-14.6)/1.6,0,1);king.setAttribute('transform',`rotate(${(-f*70).toFixed(1)} 0 -66)`);king.setAttribute('opacity',o.toFixed(2))}
   birds.forEach((b,i)=>{const fin=ease(clamp((t-9-i*.15)/2.8,0,1)),fout=ease(clamp((t-15.2-i*.1)/2.6,0,1));let x=lerp(b.sx,b.hx,fin),y=lerp(b.sy,b.hy,fin);if(fout>0){x=lerp(b.hx,b.ex,fout);y=lerp(b.hy,b.ey,fout)}const on=t>8.8&&t<18.5;B[i].setAttribute('transform',`translate(${x.toFixed(1)} ${(y+Math.sin(t*6+i)*3).toFixed(1)}) scale(${fout>0?-1:-1} 1)`);B[i].setAttribute('opacity',on?1:0);B[i].querySelector('.lwE-wing').setAttribute('transform',`scale(1 ${(0.35+0.65*Math.abs(Math.sin(t*14+i))).toFixed(2)})`);
    const d=clamp((t-12-i*.12)/1.1,0,1),stoneOn=t>11.6+i*.12&&d<1;ST[i].setAttribute('cx',b.hx.toFixed(1));ST[i].setAttribute('cy',(t<12+i*.12?b.hy+4:lerp(b.hy+4,198,d*d)).toFixed(1));ST[i].setAttribute('opacity',stoneOn?1:0)});
   if(captionEl){let c=0;ELEPHANT_CAPTIONS.forEach((x,i)=>{if(t>=x[0])c=i});if(c!==lastCap){lastCap=c;captionEl.textContent=ELEPHANT_CAPTIONS[c][1]}}
  }};
 if(reduced())th.tick(16.6);else{LW.theatres.add(th);run()}
 return th;
}
/* ---------- the Hijrah: Surāqah and the two camels ---------- */
/* Only the two camels of the Prophet ﷺ and Abū Bakr are shown — no riders —
   with a soft light above them. Surāqah ibn Mālik rides a horse, as the
   sources describe; its legs sink into the sand and he turns back. */
const HIJRAH_CAPTIONS=[[0,'The Prophet ﷺ and Abū Bakr travel towards Madinah. Allah’s protection is with them.'],[2.6,'Surāqah ibn Mālik rides fast on his horse, hoping to catch them for a reward.'],[8,'As he comes close, his horse’s legs sink into the sand.'],[11.4,'Surāqah understands they are protected. He asks for safety and turns back.'],[15.5,'He even sends other searchers away. Allah protected His Messenger ﷺ on the Hijrah.']];
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
 const pairX=t=>lerp(190,470,clamp(t/18,0,1)),stopX=pairX(8)-150;
 const th={svg,cycle:22,start:performance.now(),visible:()=>!document.hidden&&svg.getBoundingClientRect().width>0,
  tick(t){
   const pOp=t<.6?t/.6:t>19.5?clamp(1-(t-19.5)/2,0,1):1;
   pair.setAttribute('transform',`translate(${pairX(t).toFixed(1)} 0)`);pair.setAttribute('opacity',pOp.toFixed(2));swingLegs(camelLegs,Math.sin(t*5)*12);
   light.setAttribute('opacity',(0.82+0.18*Math.sin(t*2.2)).toFixed(2));
   let hx,dir=1,gallop=0;
   if(t<2)hx=-120;else if(t<8){hx=lerp(-120,stopX,ease((t-2)/6));gallop=1}else if(t<12.4){hx=stopX;dir=t<11.4?1:-1}else{hx=lerp(stopX,-160,ease(clamp((t-12.4)/4,0,1)));dir=-1;gallop=t<16.4?1:0}
   const sink=t>=8&&t<11.4?Math.min(1,(t-8)/.6)*(t>10.6?1-(t-10.6)/.8:1):0;
   horse.setAttribute('transform',`translate(${hx.toFixed(1)} ${(216+sink*9).toFixed(1)})`);flip.setAttribute('transform',`scale(${dir} 1)`);
   front.setAttribute('transform',`scale(1 ${(1-.5*sink).toFixed(3)})`);rider.setAttribute('transform',`rotate(${(sink*14).toFixed(1)} 0 -42)`);
   swingLegs(horseLegs,gallop?Math.sin(t*16)*24:0);
   const dustOn=gallop||sink>0;dust.setAttribute('transform',`translate(${(hx+(dir>0?-24:24)).toFixed(1)} 214) scale(${dustOn?1:.01})`);dust.setAttribute('opacity',dustOn?'.8':'0');
   horse.setAttribute('opacity',t<2||t>17?'0':'1');
   if(captionEl){let c=0;HIJRAH_CAPTIONS.forEach((x,i)=>{if(t>=x[0])c=i});if(c!==lastCap){lastCap=c;captionEl.textContent=HIJRAH_CAPTIONS[c][1]}}
  }};
 if(reduced())th.tick(9);else{LW.theatres.add(th);run()}
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
function elephantRoad(g,L,P){
 const R=L.road,len=R[R.length-1][2],crew=[{o:2.2,s:0},{o:1.35,s:1},{o:0,e:1},{o:-1.35,s:2},{o:-2.1,s:3},{o:-2.85,s:0}];
 g.innerHTML=crew.map((c,i)=>`<g class="lwR-m" data-m="${i}"><g class="lwR-body">${c.e?elephantSvg():soldierSvg(c.s)}</g></g>`).join('')
  +crew.map((c,i)=>`<circle class="lwR-stone" r="3.4" fill="#7a6650" stroke="#3d3022" stroke-width="1" opacity="0"/>`).join('')
  +crew.map((c,i)=>`<g class="lwR-bird" opacity="0">${ROAD_BIRD}</g>`).join('');
 const M=[...g.querySelectorAll('.lwR-m')],body=M.map(m=>m.querySelector('.lwR-body')),ST=[...g.querySelectorAll('.lwR-stone')],B=[...g.querySelectorAll('.lwR-bird')],legs=[...g.querySelectorAll('.lw-leg')],front=g.querySelector('.lwE-front'),king=g.querySelector('.lwE-king'),dirs=[];
 const s0=len*.07,s1=len*.42;
 const th={svg:g,cycle:30,start:performance.now(),visible:mapShowing,
  tick(t){
   const centre=lerp(s0,s1,ease(clamp(t/13,0,1))),cp=roadAt(R,centre),step=96*depthAt(cp[1],P,1,L.H*.095/100);
   g.setAttribute('opacity',(t<.8?t/.8:t>23?clamp(1-(t-23)/1.6,0,1):1).toFixed(2));
   swingAll(legs,t<13?Math.sin(t*8)*16:0);
   crew.forEach((c,i)=>{const s=centre+c.o*step,p=roadAt(R,s),d=dirs[i]=roadDir(R,s,dirs[i]),k=Math.min(depthAt(p[1],P,c.e?1.1:.95,c.e?L.H*.105/100:L.H*.075/55),c.e?L.W*.24/100:L.W*.15/55);c.p=p;c.k=k;
    M[i].setAttribute('transform',`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) scale(${(k*d).toFixed(3)} ${k.toFixed(3)})`);
    if(c.e){const q=clamp((t-13)/1.2,0,1);body[i].setAttribute('transform',`rotate(${(q*9).toFixed(2)} -27 0)`);const sc=1-.4*q;front.setAttribute('transform',`translate(0 ${(-24*(1-sc)).toFixed(2)}) scale(1 ${sc.toFixed(3)})`)}
    else{const f=clamp((t-18.6-i*.1)/1.1,0,1),o=1-clamp((t-19.6-i*.1)/1.4,0,1);body[i].setAttribute('transform',`rotate(${(-f*84).toFixed(1)})`);body[i].setAttribute('opacity',o.toFixed(2))}
    const hx=p[0],hy=p[1]-(c.e?128:84)*k,fin=ease(clamp((t-14.5-i*.15)/2.8,0,1)),fout=ease(clamp((t-20.4-i*.1)/2.6,0,1));
    let x=lerp(p[0]+L.W*.75,hx,fin),y=lerp(-50-i*14,hy,fin);if(fout>0){x=lerp(hx,p[0]-L.W*.8,fout);y=lerp(hy,-60-i*12,fout)}
    const bk=Math.max(k*1.1,.6);B[i].setAttribute('transform',`translate(${x.toFixed(1)} ${(y+Math.sin(t*6+i)*3).toFixed(1)}) scale(${bk.toFixed(3)})`);B[i].setAttribute('opacity',t>14.3&&t<23.5?'1':'0');
    B[i].querySelector('.lwR-wing').setAttribute('transform',`scale(1 ${(0.35+0.65*Math.abs(Math.sin(t*14+i))).toFixed(2)})`);
    const dd=clamp((t-17.5-i*.12)/1.1,0,1);ST[i].setAttribute('cx',hx.toFixed(1));ST[i].setAttribute('cy',lerp(hy+4,p[1]-22*k,dd*dd).toFixed(1));ST[i].setAttribute('r',Math.max(2.2,3.6*bk).toFixed(1));ST[i].setAttribute('opacity',t>17.4+i*.12&&dd<1?'1':'0');
   });
   const kf=clamp((t-18.9)/1.1,0,1);king.setAttribute('transform',`rotate(${(-kf*70).toFixed(1)} 0 -66)`);king.setAttribute('opacity',(1-clamp((t-19.9)/1.5,0,1)).toFixed(2));
  }};
 return th;
}
/* The Hijrah: two camels (no riders) with a light above them; Surāqah gallops up the road behind them, sinks and turns back. */
function hijrahRoad(g,L,P){
 const R=L.road,len=R[R.length-1][2];
 g.innerHTML=`<defs><radialGradient id="lwGlowR"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset=".5" stop-color="#ffe9a0" stop-opacity=".45"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs>`
  +`<g class="lwR-light"><ellipse cx="0" cy="0" rx="96" ry="58" fill="url(#lwGlowR)"/><g stroke="#fff3b8" stroke-width="3" stroke-linecap="round" opacity=".75">${[...Array(10)].map((_,i)=>{const a=i*Math.PI/5;return `<line x1="${(Math.cos(a)*18).toFixed(1)}" y1="${(-18+Math.sin(a)*18).toFixed(1)}" x2="${(Math.cos(a)*34).toFixed(1)}" y2="${(-18+Math.sin(a)*34).toFixed(1)}"/>`}).join('')}</g><circle cx="0" cy="-18" r="12" fill="#fffbe6"/></g>`
  +`<g class="lwR-m"><g class="lwR-body">${camelSvg({saddle:'#7a2f2a',color:'#c4955d'})}</g></g><g class="lwR-m"><g class="lwR-body">${camelSvg({saddle:'#2f5c7a',color:'#cfa36b'})}</g></g>`
  +`<g class="lwR-dust" opacity="0"><circle r="10" fill="#e8cf9e" opacity=".7"/><circle cx="14" cy="-4" r="8" fill="#ead6ab" opacity=".6"/><circle cx="-12" cy="-3" r="7" fill="#e3c792" opacity=".6"/></g><g class="lwR-horse" opacity="0"><g class="lwR-body">${horseSvg()}</g></g>`;
 const M=[...g.querySelectorAll(':scope > .lwR-m')],light=g.querySelector('.lwR-light'),horse=g.querySelector('.lwR-horse'),hb=horse.querySelector('.lwR-body'),front=g.querySelector('.lwH-front'),rider=g.querySelector('.lwH-rider'),dust=g.querySelector('.lwR-dust');
 const camelLegs=M.flatMap(m=>[...m.querySelectorAll('.lw-leg')]),horseLegs=[...horse.querySelectorAll('.lw-leg')],dirs=[];
 g.querySelectorAll('.lw-leg').forEach(l=>{const h=!!l.closest('.lwR-horse');l.setAttribute('stroke',h?'#5e3b21':'#9c7445');l.setAttribute('stroke-width',h?'4':'4.2');l.setAttribute('stroke-linecap','round')});
 const pairS=t=>lerp(len*.12,len*.72,clamp(t/22,0,1)),stepAt=s=>92*depthAt(roadAt(R,s)[1],P,1,L.H*.085/60),catchS=pairS(10)-2.6*stepAt(pairS(10));
 const th={svg:g,cycle:26,start:performance.now(),visible:mapShowing,
  tick(t){
   g.setAttribute('opacity',(t<.8?t/.8:t>23?clamp(1-(t-23)/1.8,0,1):1).toFixed(2));
   const ps=pairS(t),step=stepAt(ps),pts=[];
   [0,-1.25].forEach((o,i)=>{const s=ps+o*step,p=roadAt(R,s),d=dirs[i]=roadDir(R,s,dirs[i]),k=Math.min(depthAt(p[1],P,1.1,L.H*.085/60),L.W*.17/60);pts.push([p,k]);M[i].setAttribute('transform',`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) scale(${(k*d).toFixed(3)} ${k.toFixed(3)})`)});
   swingAll(camelLegs,Math.sin(t*5)*12);
   const mx=(pts[0][0][0]+pts[1][0][0])/2,my=Math.min(pts[0][0][1],pts[1][0][1]),lk=(pts[0][1]+pts[1][1])/2;
   light.setAttribute('transform',`translate(${mx.toFixed(1)} ${(my-88*lk).toFixed(1)}) scale(${(lk*.8).toFixed(3)})`);light.setAttribute('opacity',(0.82+0.18*Math.sin(t*2.2)).toFixed(2));
   let hs,dir=null,gallop=0;
   if(t<3)hs=len*.01;else if(t<10){hs=lerp(len*.01,catchS,ease((t-3)/7));gallop=1}else if(t<13.4){hs=catchS}else{hs=lerp(catchS,len*.0,ease(clamp((t-13.4)/4.6,0,1)));gallop=t<18?1:0}
   const hp=roadAt(R,hs),hk=Math.min(depthAt(hp[1],P,1.1,L.H*.1/80),L.W*.2/80);dir=roadDir(R,hs,dirs[2]);dirs[2]=dir;if(t>=12.4)dir=-dir;
   const sink=t>=10&&t<13.4?Math.min(1,(t-10)/.6)*(t>12.6?1-(t-12.6)/.8:1):0;
   horse.setAttribute('transform',`translate(${hp[0].toFixed(1)} ${(hp[1]+sink*9*hk).toFixed(1)}) scale(${(hk*dir).toFixed(3)} ${hk.toFixed(3)})`);horse.setAttribute('opacity',t<3||t>18.5?'0':'1');
   front.setAttribute('transform',`scale(1 ${(1-.5*sink).toFixed(3)})`);rider.setAttribute('transform',`rotate(${(sink*14).toFixed(1)} 0 -42)`);
   swingAll(horseLegs,gallop?Math.sin(t*16)*24:0);
   const dustOn=(gallop||sink>0)&&t>=3&&t<=18.5;dust.setAttribute('transform',`translate(${(hp[0]-dir*24*hk).toFixed(1)} ${(hp[1]-2).toFixed(1)}) scale(${(dustOn?hk:.01).toFixed(3)})`);dust.setAttribute('opacity',dustOn?'.8':'0');
  }};
 return th;
}
/* which lessons each scene belongs to: story = lessons that play it above the story; road = the map that shows it on the road */
const SCENES=[
 {re:/year of the elephant/i,road:elephantRoad,make:(svg,full,cap)=>elephantTheatre(svg,full,cap),label:"Animated scene: Abrahah's army and the elephant, the birds and the stones"},
 {re:/cave of thawr|surāqah|suraqah/i,road:hijrahRoad,make:(svg,full,cap)=>hijrahTheatre(svg,full,cap),label:'Animated scene: the two camels of the Hijrah with a light above them, and Surāqah on his horse'}
];
function lessonIndexFor(re){return typeof lessons!=='undefined'?lessons.findIndex(l=>re.test(String(l.title||''))):-1}
function paintElephantSpot(){
 const svg=document.getElementById('mapSvg'),L=typeof MAP_GEO!=='undefined'&&MAP_GEO;if(!svg||!L)return;
 svg.querySelectorAll('.lw-elephant-spot,.lw-road-scene').forEach(x=>x.remove());document.querySelectorAll('.lw-scene-cap,.lw-nasheed-btn,.lw-lyrics').forEach(x=>x.remove());if(window.SeeraaNasheed)window.SeeraaNasheed.stop();
 if(!Array.isArray(L.road)||L.road.length<2)return;const P=photoBox(svg);if(!P)return;
 SCENES.forEach(sc=>{
  const gi=lessonIndexFor(sc.re);if(gi<0||lessons[gi].world!==viewWorld)return;
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','lw-road-scene');g.setAttribute('aria-hidden','true');g.setAttribute('pointer-events','none');
  (svg.querySelector('.historical-dust-road')||svg.querySelector('.lw-life')||svg.querySelector('.history-scene')).insertAdjacentElement('afterend',g);
  const th=sc.road(g,L,P);if(reduced())th.tick(th.still??6);else{LW.theatres.add(th);run()}
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
.lw-life .lw-fig{filter:drop-shadow(0 2px 1.5px rgba(40,25,10,.35))}
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
@media(prefers-reduced-motion:reduce){.lw-life .lw-fig .lw-leg,.lw-life .lw-wing,.lesson-side .side-step.current,.lw-mood .lw-star{animation:none}.lw-wind,.lw-rain{display:none}}
</style>`);
/* shared with seeraa-event-scenes.js (Badr, Uḥud, Ḥudaybiyyah, the Opening of Makkah) */
window.SeeraaLiving={LW,run,reduced,clamp,lerp,ease,SKIN,personSvg,camelSvg,goatSvg,soldierSvg,horseSvg,kaabaSvg,roadAt,roadDir,depthAt,mapShowing,photoBox,swingAll,SCENES,repaint:()=>{try{paintElephantSpot()}catch(e){console.warn('living map',e)}}};
})();
