/* Seeraa event scenes: Badr, Uḥud, Ḥudaybiyyah, the Opening of Makkah, the Madinah welcome,
   Zamzam, the Black Stone, the first revelation, Abyssinia, building the masjid, the Trench
   and the Farewell Pilgrimage.
   Each scene plays along the dusty road of its map (figures shrink with
   distance, a short caption at the bottom) and again, with fuller captions,
   at the top of its lesson story. Fighting is shown gently — raised swords,
   shields and clouds of dust, never injuries.
   The Prophet ﷺ is never drawn: at Badr his shelter has a soft light above it,
   and his camel al-Qaṣwāʾ walks without a rider under a light. */
(function(){
'use strict';
const SL=window.SeeraaLiving;if(!SL)return;
const {LW,run,reduced,clamp,lerp,ease,SKIN,camelSvg,personSvg,kaabaSvg,roadAt,roadDir,depthAt,mapShowing,SCENES}=SL;
const NS='http://www.w3.org/2000/svg',f1=x=>x.toFixed(1),f3=x=>x.toFixed(3);
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
let uid=0;

/* ---------- figures (facing right, feet at 0,0) ---------- */
const LEG=(x1,y1,x2,y2,cls,col,w)=>`<line class="lw-leg ${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
const flagCloth=c=>`<line x1="0" y1="0" x2="0" y2="-34" stroke="#5b4026" stroke-width="1.8"/><path class="lwX-cloth" d="M0-34 Q9-37 17-33 Q12-28 17-23 Q9-26 0-23Z" fill="${c}" stroke="#00000040" stroke-width=".6"/>`;
function warriorSvg(o){
 const m=o.side==='m',i=o.i||0,tunic=m?['#efe6d2','#e2d6bd','#f3ede0','#d9c9a8'][i%4]:['#8a2f28','#6d3a2e','#7a3b2b','#5a2c3a'][i%4],skin=SKIN[(i+(m?0:1))%SKIN.length];
 const head=m?`<circle cx="0" cy="-42" r="5.6" fill="${skin}"/><path d="M-7-41 Q-7-51 0-51 Q7-51 7-43 L8-38 Q4-40 2-42 L-1-42 Q-4-40-8-38Z" fill="${['#f4efe2','#e8e2d0','#d9cdb4'][i%3]}"/>`
  :`<circle cx="0" cy="-42" r="5.6" fill="${skin}"/><path d="M-7-42 Q0-54 7-42Z" fill="#8f979e" stroke="#545b62" stroke-width=".8"/><line x1="0" y1="-52" x2="0" y2="-56" stroke="#545b62" stroke-width="1.4"/>`;
 let arm;
 if(o.weapon==='bow')arm=`<line x1="5" y1="-32" x2="12" y2="-31" stroke="${tunic}" stroke-width="4" stroke-linecap="round"/><path d="M13-44 Q22-30 13-17" stroke="#6b4b2b" fill="none" stroke-width="1.8"/><line x1="13" y1="-44" x2="13" y2="-17" stroke="#efe3c4" stroke-width=".7"/>`;
 else if(o.weapon==='spear')arm=`<line x1="5" y1="-32" x2="9" y2="-22" stroke="${tunic}" stroke-width="4" stroke-linecap="round"/><line x1="12" y1="-58" x2="7" y2="2" stroke="#6b4b2b" stroke-width="1.8"/><path d="M12-58 l2.2-6.5 l1.6 6.5Z" fill="#c4cad0"/>`;
 else if(o.weapon==='flag')arm=`<line x1="5" y1="-32" x2="9" y2="-24" stroke="${tunic}" stroke-width="4" stroke-linecap="round"/><g transform="translate(10 -6)">${flagCloth(o.flag||'#fff')}</g>`;
 else arm=`<line x1="5" y1="-32" x2="10" y2="-23" stroke="${tunic}" stroke-width="4" stroke-linecap="round"/><line x1="10" y1="-23" x2="18" y2="-42" stroke="#d3d9de" stroke-width="2.2" stroke-linecap="round"/><line x1="7.5" y1="-26" x2="12.5" y2="-21" stroke="#6b4b2b" stroke-width="2"/>`;
 const shield=o.weapon==='bow'||o.weapon==='flag'?'':`<ellipse cx="-7" cy="-25" rx="5.2" ry="7.6" fill="${m?'#8b6b3e':'#5d646b'}" stroke="#3d2b17" stroke-width="1"/><circle cx="-7" cy="-25" r="1.4" fill="${m?'#d9b56a':'#a8b0b7'}"/>`;
 return `<g>${LEG(-3,-15,-4,0,'a','#3f3021',2.6)}${LEG(3,-15,4,0,'b','#3f3021',2.6)}</g><path d="M-8-13 L-6-36 Q0-39 6-36 L8-13Z" fill="${tunic}" stroke="#00000030" stroke-width=".8"/><path d="M-7-21 h14" stroke="${m?'#8b6b3e':'#3a2a20'}" stroke-width="1.6"/>${head}${shield}<g class="lwX-arm">${arm}</g>`;
}
function horsemanSvg(o){
 const m=o.side==='m',i=o.i||0,coat=['#7a4e2d','#4a3426','#9a7048','#2f2a26','#c9c1b4'][i%5],tunic=m?['#efe6d2','#e2d6bd'][i%2]:['#8a2f28','#5a2c3a'][i%2],skin=SKIN[(i+2)%SKIN.length];
 const head=m?`<path d="M-6-68 Q-6-77 1-77 Q8-77 8-70 L9-64 Q5-66 3-69 L0-69 Q-3-67-7-64Z" fill="#f1ecdf"/>`:`<path d="M-5-70 Q1-81 7-70Z" fill="#8f979e" stroke="#545b62" stroke-width=".8"/>`;
 const gear=o.flag?`<g transform="translate(9 -50)">${flagCloth(o.flag)}</g>`:`<line x1="24" y1="-82" x2="-4" y2="-40" stroke="#6b4b2b" stroke-width="1.8"/><path d="M24-82 l1.4-6.6 l2.8 5.4Z" fill="#c4cad0"/>`;
 return `<g>${LEG(-15,-25,-17,0,'a','#3b2617',4)}${LEG(-9,-25,-8,0,'b','#3b2617',4)}${LEG(12,-25,13,0,'b','#3b2617',4)}${LEG(18,-25,20,0,'a','#3b2617',4)}</g>`
  +`<path d="M-23-35q-9 4-7 15" stroke="#2a1a10" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M-24-31 Q-22-43 -5-43 L14-43 Q23-43 25-35 L23-27 Q0-23-21-25Z" fill="${coat}"/><path d="M16-41 L26-57 Q30-63 37-59 L41-53 Q39-50 35-51 L29-45 L23-34Z" fill="${coat}"/><path d="M18-43 L28-59" stroke="#2a1a10" stroke-width="3.2" stroke-linecap="round"/><circle cx="35" cy="-56" r="1.2" fill="#1d120a"/>`
  +`<path d="M-7-42 L-5-62 Q1-65 7-62 L9-42Z" fill="${tunic}"/><circle cx="1" cy="-69" r="5.5" fill="${skin}"/>${head}${gear}`;
}
function pilgrimSvg(i){const skin=SKIN[i%SKIN.length];
 return `<g>${LEG(-2.5,-14,-3,0,'a','#3f3021',2.4)}${LEG(2.5,-14,3,0,'b','#3f3021',2.4)}</g><path d="M-8-12 L-7-27 L7-27 L8-12Z" fill="#fbf9f3" stroke="#00000026" stroke-width=".8"/><path d="M-7-27 L-6-37 Q0-40 6-37 L7-27Z" fill="#f4f1e8" stroke="#00000026" stroke-width=".8"/><path d="M-6-37 L7-27" stroke="#ddd6c6" stroke-width="1.4"/><circle cx="0" cy="-42" r="5.4" fill="${skin}"/><path d="M-5.4-43 Q0-49 5.4-43 Q3-46 0-46 Q-3-46-5.4-43Z" fill="#2c221b"/><g class="lwX-arm"><line x1="5" y1="-32" x2="9" y2="-20" stroke="${skin}" stroke-width="3.4" stroke-linecap="round"/></g>`}
const GARLAND=`<path d="M31-50 Q34-41 38-47" stroke="#e05a4a" stroke-width="2.6" fill="none" stroke-dasharray="2.4 1.6"/>`;
const camelLegsStroke=html=>html.replace(/class="lw-leg ([ab])"/g,'class="lw-leg $1" stroke="#9c7445" stroke-width="4.2" stroke-linecap="round"');
const camel=o=>`<g class="lwX-cbody">${camelLegsStroke(camelSvg(o))}${o.garland?GARLAND:''}</g>`;
function riderCamelSvg(o){return `<g class="lwX-cbody">${camelLegsStroke(camelSvg(o))}<g transform="translate(-1 -44)"><path d="M-6 0 L-4-18 Q1-21 6-18 L8 0Z" fill="${o.robe||'#4a3b35'}"/><circle cx="1" cy="-24" r="5" fill="${o.skin||SKIN[2]}"/><path d="M-5-24 Q-5-31 1-31 Q7-31 6-25 L7-20 Q4-22 3-24Z" fill="${o.wrap||'#e8e2d0'}"/></g></g>`}
function lightSvg(){const id='lwXG'+(++uid);return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset=".5" stop-color="#ffe9a0" stop-opacity=".45"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs><ellipse cx="0" cy="-15" rx="80" ry="48" fill="url(#${id})"/><g stroke="#fff3b8" stroke-width="3" stroke-linecap="round" opacity=".75">${[...Array(10)].map((_,i)=>{const a=i*Math.PI/5;return `<line x1="${f1(Math.cos(a)*15)}" y1="${f1(-15+Math.sin(a)*15)}" x2="${f1(Math.cos(a)*28)}" y2="${f1(-15+Math.sin(a)*28)}"/>`}).join('')}</g><circle cx="0" cy="-15" r="10" fill="#fffbe6"/>`}
const DUST=`<circle r="11" fill="#e8d3a6" opacity=".75"/><circle cx="13" cy="-5" r="9" fill="#eddcb6" opacity=".7"/><circle cx="-12" cy="-4" r="8" fill="#e0c690" opacity=".7"/><circle cx="3" cy="-12" r="8" fill="#f1e3c3" opacity=".65"/>`;
const SPARK=`<path d="M0-7 L1.6-1.6 L7 0 L1.6 1.6 L0 7 L-1.6 1.6 L-7 0 L-1.6-1.6Z" fill="#fff8d8" stroke="#f3c64b" stroke-width=".8"/>`;
const WELL=`<ellipse cx="0" cy="0" rx="17" ry="6" fill="#00000030"/><path d="M-16-1 V-10 A16 6 0 0 0 16-10 V-1 A16 6 0 0 1-16-1Z" fill="#a88d68" stroke="#5c4a35" stroke-width="1"/><ellipse cy="-10" rx="16" ry="6" fill="#8d7656" stroke="#5c4a35" stroke-width="1"/><ellipse class="lwX-water" cy="-10" rx="11" ry="3.6" fill="#2c3a44"/>`;
const ARISH=`<line x1="-17" y1="0" x2="-17" y2="-30" stroke="#6b4b2b" stroke-width="2.6"/><line x1="17" y1="0" x2="17" y2="-30" stroke="#6b4b2b" stroke-width="2.6"/><path d="M-24-29 L24-29 L19-38 L-19-38Z" fill="#6f8e45" stroke="#4d6a2c" stroke-width="1"/><path d="M-20-35 l6 6 M-10-37 l5 8 M0-37 l4 8 M10-36 l5 7" stroke="#9fbf6a" stroke-width="1.4"/>`;
const tentSvg=c=>`<path d="M-22 0 L0-26 L22 0Z" fill="${c}" stroke="#00000030" stroke-width="1"/><path d="M0-26 L-5 0 L5 0Z" fill="#00000026"/><line x1="0" y1="-26" x2="0" y2="-31" stroke="#6b4b2b" stroke-width="1.6"/>`;
const TREE=`<path d="M-2 0 Q-1-14 -1-22 Q-5-29 -12-34 M-1-22 Q3-30 8-37" stroke="#5b4026" stroke-width="3.4" fill="none" stroke-linecap="round"/><ellipse cx="-2" cy="-40" rx="36" ry="10" fill="#6d8a3e"/><ellipse cx="-10" cy="-45" rx="20" ry="7" fill="#80a04a"/><ellipse cx="10" cy="-44" rx="16" ry="6" fill="#789945"/>`;
const MOUND=`<path d="M-70 0 Q-50-30 -10-38 Q30-40 55-22 Q68-10 72 0Z" fill="#c7a271" stroke="#9c7a4e" stroke-width="1.2"/><path d="M-40-20 Q0-34 40-24" stroke="#e1c08e" stroke-width="3" fill="none" opacity=".7"/>`;
const SCROLL=`<g class="lwX-paper"><rect x="-24" y="-15" width="48" height="30" rx="2" fill="#f7ebcd" stroke="#a8875a" stroke-width="1"/><path d="M-17-7 h30 M-17-1 h34 M-17 5 h22" stroke="#8a6d45" stroke-width="1.4"/><circle cx="15" cy="7" r="4.2" fill="#9b2f2a"/></g><rect x="-27" y="-17" width="5" height="34" rx="2.5" fill="#d8bf8c" stroke="#a8875a"/><rect class="lwX-roll" x="22" y="-17" width="5" height="34" rx="2.5" fill="#d8bf8c" stroke="#a8875a"/>`;
const DOVE=`<path class="lwX-wing" d="M-12 0 Q-5-11 0 0 Q5-11 12 0" stroke="#fdfdfb" fill="none" stroke-width="3" stroke-linecap="round"/><ellipse cx="0" cy="1" rx="7" ry="3.6" fill="#fdfdfb"/><circle cx="6.5" cy="-.5" r="2.4" fill="#fdfdfb"/><path d="M8.5 0 l3 1-3 .8Z" fill="#e2a33b"/>`;
const IDOL=`<rect x="-6" y="-4" width="12" height="4" fill="#6f675d"/><rect x="-4" y="-22" width="8" height="18" rx="2" fill="#8d8478" stroke="#5a5248" stroke-width=".9"/><circle cy="-25.5" r="4.4" fill="#968d81" stroke="#5a5248" stroke-width=".9"/>`;
const ADHAN=`<g class="lwX-arcs" fill="none" stroke="#fff6d8" stroke-width="2.4" stroke-linecap="round"><path d="M-54-14 Q-62-4-54 6"/><path d="M54-14 Q62-4 54 6"/></g><rect x="-46" y="-24" width="92" height="30" rx="12" fill="#fffaf0" stroke="#d6b36a" stroke-width="1.4"/><path d="M-6 6 L0 14 L6 6Z" fill="#fffaf0" stroke="#d6b36a" stroke-width="1.4"/><text x="0" y="-3" text-anchor="middle" font-family="Amiri,'Noto Naskh Arabic','Geeza Pro',serif" font-size="17" fill="#6b4a1f">اللّٰهُ أَكْبَر</text>`;

/* ---------- where things go: the map road, or a straight road in the story picture ---------- */
function mapCtx(L,P){
 const R=L.street||L.road,len=R[R.length-1][2],wide=L.W>L.H,floor=L.H*(wide?.068:.05),cap=Math.min(L.W*.13,L.H*(wide?.092:.085));
 const near=y=>clamp(depthAt(y,P,1),.35,1.6);
 return{story:false,W:L.W,H:L.H,asset:typeof SEERAA_SCENES!=='undefined'?SEERAA_SCENES[viewWorld]?.asset:null,
  at:f=>roadAt(R,f*len),dir:(f,prev)=>roadDir(R,f*len,prev),
  k:(y,h,big=1)=>clamp(depthAt(y,P,1)*h,floor*big,cap*big)/h,
  side:(f,d)=>{const a=roadAt(R,f*len-8),b=roadAt(R,f*len+8),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,p=roadAt(R,f*len),kk=near(p[1])*Math.max(1,L.H/900);return[clamp(p[0]-dy/l*d*kk,L.W*.1,L.W*.9),clamp(p[1]+dx/l*d*kk,L.H*.16,L.H*.93)]},
  pic:(u,v)=>[P.x+u*P.w,P.y+v*P.h],
  step:f=>{const p=roadAt(R,f*len);return clamp(depthAt(p[1],P,1)*56,floor,cap)*.62/len}};
}
function storyCtx(){const y0=232,x0=30,len=540;
 return{story:true,W:600,H:260,
  at:f=>[x0+f*len,y0],dir:()=>1,k:(y,h,big=1)=>Math.min(1.6,74*big/h),
  side:(f,d)=>[x0+f*len+d*.12,y0-Math.abs(d)*.34],pic:()=>null,step:()=>40/len};
}
const put=(el,p,k,d=1)=>el.setAttribute('transform',`translate(${f1(p[0])} ${f1(p[1])}) scale(${f3(k*d)} ${f3(k)})`);
const mix=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];
function mk(g,html,o={}){const el=document.createElementNS(NS,'g');el.setAttribute('class','lwX-m');el.innerHTML=html;g.appendChild(el);return Object.assign({el,legs:[...el.querySelectorAll('.lw-leg')],arm:el.querySelector('.lwX-arm'),h:56,big:1},o)}
function stride(m,t,on,speed=8,amp=16){const a=on?Math.sin(t*speed+(m.ph||0))*amp:0;m.legs.forEach((l,i)=>l.setAttribute('transform',`rotate(${f1(i%2?a:-a)} ${l.getAttribute('x1')} ${l.getAttribute('y1')})`))}
const swing=(m,a)=>m.arm&&m.arm.setAttribute('transform',`rotate(${f1(a)} 5 -32)`);
const show=(m,on)=>m.el.setAttribute('opacity',typeof on==='number'?f3(on):on?'1':'0');
function army(g,list,side){return list.map((x,i)=>x==='h'||(typeof x==='object'&&x.h)?mk(g,horsemanSvg({side,i,flag:x.flag}),{h:84,big:1.35,horse:1,ph:i}):x==='c'?mk(g,camel({load:1,saddle:'#7a2f2a'}),{h:60,big:1.1,camel:1,ph:i}):mk(g,warriorSvg({side,i,weapon:x.w||x,flag:x.flag}),{ph:i*.7}))}

/* ---------- Badr ---------- */
const BADR={
 re:/^the day of badr$/i,story:/^the day of badr$/i,cycle:32,still:18,
 label:'Animated scene: the small Muslim army at the wells of Badr meets the larger army of Quraysh, which runs away',
 caps:[[0,'Ramaḍān, year 2: about 313 Muslims, with only 70 camels and 2 horses, reach the wells of Badr.','313 Muslims reach the wells of Badr'],[5.5,'The army of Quraysh — about a thousand, with many horses — comes down the valley.','Quraysh come with about 1,000'],[10.5,'The night before, Allah sent rain and calm sleep, and the Prophet ﷺ spent the whole night in prayer.','Rain, calm sleep and a night of duʿāʾ'],[15,'The armies meet. The believers stand firm together, and Allah sends His help.','The believers stand firm — Allah helps them'],[22.5,'The army of Quraysh breaks and runs. Allah gave the believers victory at Badr.','Quraysh run away — victory at Badr']],
 bg:()=>{const id='lwXs'+(++uid);return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb7c9"/><stop offset=".6" stop-color="#e9dcc0"/><stop offset="1" stop-color="#efd9a8"/></linearGradient></defs><rect width="600" height="260" fill="url(#${id})"/><path d="M0 168 L70 128 L130 150 L210 112 L290 150 L370 118 L450 152 L530 120 L600 140 L600 260 L0 260Z" fill="#c9a06a"/><path d="M0 196 Q150 176 300 194 T600 188 L600 260 L0 260Z" fill="#dcb67e"/><rect y="216" width="600" height="44" fill="#e5c48d"/>`},
 build(g,c){
  const arish=mk(g,ARISH),glow=mk(g,lightSvg()),wells=[mk(g,WELL),mk(g,WELL)];
  const Q=army(g,['spear',{w:'flag',flag:'#a3272b'},'sword','h','sword','spear',{w:'flag',flag:'#7a1f22'},'h','sword','spear','h','sword'],'q');
  const M=army(g,['sword','spear',{w:'flag',flag:'#f8f6ee'},'sword','bow','spear',{w:'flag',flag:'#1f1f1f'},'sword','c'],'m');
  const dust=[...Array(5)].map(()=>mk(g,DUST)),sparks=[...Array(6)].map(()=>mk(g,SPARK));const dQ=[],dM=[];
  return t=>{
   g.setAttribute('opacity',f3(t<.8?t/.8:t>29?clamp(1-(t-29)/1.8,0,1):1));
   const pa=c.side(.12,64),ka=c.k(pa[1],38,1.2);put(arish.el,pa,ka);put(glow.el,[pa[0],pa[1]-40*ka],ka*.6);show(glow,.7+.3*Math.sin(t*2));
   [[.23,46],[.28,-48]].forEach(([f,d],i)=>{const p=c.side(f,d);put(wells[i].el,p,c.k(p[1],20,.7))});
   const mF=t<6?lerp(.02,.30,ease(t/6)):t<15?.30:t<16.2?lerp(.30,.36,seg(t,15,16.2)):t<22.5?.36:lerp(.36,.44,ease(seg(t,22.5,27)));
   const qF=t<5?1.1:t<12?lerp(.98,.50,ease(seg(t,5,12))):t<15?.50:t<16.2?lerp(.50,.42,seg(t,15,16.2)):t<22.5?.42:lerp(.42,1.1,ease(seg(t,22.5,28)));
   const fight=t>=16.2&&t<22.5,mWalk=t<6||(t>=15&&t<16.2)||(t>=22.5&&t<27),qWalk=(t>=5&&t<12)||(t>=15&&t<16.2)||t>=22.5,flee=t>=22.5;
   const sm=c.step(mF),sq=c.step(qF);
   M.forEach((m,j)=>{const f=mF-Math.floor(j/2)*sm,p=c.side(f,j%2?13:-13),d=dM[j]=c.dir(f,dM[j]);put(m.el,p,c.k(p[1],m.h,m.big),d);show(m,f>-.005);stride(m,t,mWalk,m.camel?5:8);
    swing(m,fight&&j<5&&m.arm&&!/flag/.test(m.arm.innerHTML)?-35+Math.sin(t*9+j)*45:t>=23&&j===2||t>=23&&j===6?-18:0)});
   Q.forEach((m,j)=>{const f=qF+Math.floor(j/2)*sq,p=c.side(f,j%2?13:-13),d0=dQ[j]=c.dir(f,dQ[j]);put(m.el,p,c.k(p[1],m.h,m.big),flee?d0:-d0);show(m,f<1.04?(t>25.5?1-seg(t,25.5,28):1):0);stride(m,t,qWalk,m.horse?(flee?15:10):(flee?13:8),m.horse?22:16);
    swing(m,fight&&j<5?-35+Math.sin(t*9.5+j*1.3)*45:0)});
   const mid=c.at((mF+qF)/2),kd=c.k(mid[1],40);
   dust.forEach((x,i)=>{const on=fight||t>=22.5&&t<24.5;put(x.el,[mid[0]+Math.sin(i*2.1+t*1.3)*26*kd,mid[1]-(8+i*7)*kd],kd*(1+.25*Math.sin(t*3+i)));show(x,on?.85*(t<24.5&&t>=22.5?1-seg(t,22.5,24.5):1):0)});
   sparks.forEach((x,i)=>{const on=fight&&((t*5+i*.37)%1)<.32;put(x.el,[mid[0]+Math.sin(i*3.7+Math.floor(t*5))*22*kd,mid[1]-(26+((i*13)%20))*kd],kd*.9);show(x,on)});
  };
 }
};

/* ---------- Uḥud ---------- */
const UHUD={
 re:/^the battle of uḥud$/i,story:/^the battle of uḥud$/i,cycle:34,still:16,
 label:'Animated scene: the archers on the hill at Uḥud leave their place, horsemen ride round behind, and the believers gather on the mountain',
 caps:[[0,'Year 3: about 700 Muslims stand with Mount Uḥud behind them. Quraysh come with 3,000.','700 Muslims at Mount Uḥud'],[4.5,'Fifty archers stand on a small hill: “Do not leave this place until I send for you.”','The archers: “Do not leave the hill!”'],[11,'The battle begins, and the army of Quraysh starts to run away.','Quraysh begin to run away'],[15.5,'Most of the archers think it is over, and they leave the hill…','Most archers leave the hill…'],[19,'…so horsemen ride around the hill and attack the Muslims from behind.','…horsemen attack from behind'],[25,'The believers gather on the mountain. Uḥud taught them how important it is to obey.','The believers gather on the mountain']],
 bg:()=>{const id='lwXs'+(++uid);return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c3d6"/><stop offset=".6" stop-color="#ecdcc0"/><stop offset="1" stop-color="#efd6a4"/></linearGradient></defs><rect width="600" height="260" fill="url(#${id})"/><path d="M30 214 L120 104 L180 128 L270 54 L350 110 L420 84 L520 160 L580 214Z" fill="#a8653f"/><path d="M270 54 L300 92 L330 84 L350 110 L310 120 L280 100Z" fill="#8f5233"/><path d="M120 104 L150 140 L180 128Z" fill="#8f5233"/><rect y="214" width="600" height="46" fill="#e2c08a"/>`},
 build(g,c){
  const mp=c.side(.47,-90),mound=mk(g,MOUND),km0=c.k(mp[1],56)*1.25;mp[0]=clamp(mp[0],72*km0+c.W*.02,c.W-72*km0-c.W*.02);
  const H=[0,1,2,3].map(i=>mk(g,horsemanSvg({side:'q',i:i+1}),{h:84,big:1.35,horse:1,ph:i}));
  const Q=army(g,['spear',{w:'flag',flag:'#a3272b'},'sword','spear','sword','h','spear','sword','h','sword'],'q');
  const A=[0,1,2,3,4].map(i=>mk(g,warriorSvg({side:'m',i,weapon:'bow'}),{ph:i}));
  const M=army(g,['sword','spear',{w:'flag',flag:'#1f1f1f'},'sword','spear','sword',{w:'flag',flag:'#f8f6ee'},'spear','sword','sword'],'m');
  const dust=[...Array(5)].map(()=>mk(g,DUST)),sparks=[...Array(5)].map(()=>mk(g,SPARK));const dM=[],dQ=[];
  const AL=[[-40,-24],[-18,-34],[4,-37],[26,-31],[46,-20]];
  return t=>{
   g.setAttribute('opacity',f3(t<.8?t/.8:t>31?clamp(1-(t-31)/1.8,0,1):1));
   const km=c.k(mp[1],56)*1.25;put(mound.el,mp,km);
   const mF=t<5?lerp(.02,.34,ease(t/5)):t<11?.34:t<12.2?lerp(.34,.40,seg(t,11,12.2)):t<13.5?.40:t<16?lerp(.40,.55,ease(seg(t,13.5,16))):.55;
   const qF=t<2.5?1.1:t<9?lerp(1.02,.52,ease(seg(t,2.5,9))):t<11?.52:t<12.2?lerp(.52,.44,seg(t,11,12.2)):t<13.5?.44:lerp(.44,1.1,ease(seg(t,13.5,17)));
   const clash1=t>=12.2&&t<13.5,clash2=t>=22&&t<25,toMount=seg(t,25,28.5),turned=t>=21;
   const sm=c.step(mF),sq=c.step(qF);
   M.forEach((m,j)=>{const f=mF-Math.floor(j/2)*sm,pr=c.side(f,j%2?13:-13),tg=c.story?c.side(.44+(j%5)*.035,130+Math.floor(j/5)*34):c.side(.8+(j%5)*.014,60+Math.floor(j/5)*24),p=toMount>0?mix(pr,tg,ease(toMount)):pr,d0=dM[j]=c.dir(f,dM[j]);
    put(m.el,p,c.k(p[1],m.h,m.big),turned&&toMount<1?-d0:d0);stride(m,t,t<5||(t>=11&&t<12.2)||(t>=13.5&&t<16)||(t>=25&&t<28.5),8);
    swing(m,(clash1&&j<4)||(clash2&&j>=6)?-35+Math.sin(t*9+j)*45:0)});
   Q.forEach((m,j)=>{const f=qF+Math.floor(j/2)*sq,p=c.side(f,j%2?13:-13),d0=dQ[j]=c.dir(f,dQ[j]),flee=t>=13.5;put(m.el,p,c.k(p[1],m.h,m.big),flee?d0:-d0);show(m,f<1.04?1:0);stride(m,t,(t>=2.5&&t<9)||(t>=11&&t<12.2)||flee,flee?13:8);swing(m,clash1&&j<4?-35+Math.sin(t*9.5+j)*45:0)});
   A.forEach((m,i)=>{const home=[mp[0]+AL[i][0]*km,mp[1]+AL[i][1]*km],road=c.side(.6+i*.02,i%2?10:-10),stays=i===2;let p=home,walk=false;
    if(!stays){const down=seg(t,15.5,18.5);p=mix(home,road,ease(down));walk=down>0&&down<1;if(toMount>0){p=mix(road,c.story?c.side(.6+i*.03,150):c.side(.84+i*.012,95),ease(toMount));walk=toMount<1}}
    put(m.el,p,c.k(p[1],56),stays||t<15.5?-1:1);stride(m,t,walk,8);swing(m,t>=11&&t<14?Math.sin(t*6+i)*14:0)});
   const way=[[c.side(.66,-230),18],[c.side(.47,-200),19.6],[c.side(.34,-80),21],[c.at(.42),22.2]];
   H.forEach((m,i)=>{const tt=t-i*.3;let p=way[0][0],d=-1;
    if(tt<way[0][1])show(m,0);else{show(m,tt>28?1-seg(tt,28,29.5):1);
     if(tt<way[3][1]){for(let w=0;w<3;w++)if(tt<way[w+1][1]){const a=way[w],b=way[w+1],u=seg(tt,a[1],b[1]);p=mix(a[0],b[0],u);d=b[0][0]>=a[0][0]?1:-1;break}}
     else if(tt<25.5){p=c.at(.42+.05*seg(tt,22.2,25.5));d=c.dir(.44)}
     else{const u=ease(seg(tt,25.5,29));p=mix(c.at(.47),way[0][0],u);d=way[0][0][0]>=c.at(.47)[0]?1:-1}}
    put(m.el,p,c.k(p[1],m.h,m.big),d);stride(m,t,tt>=way[0][1]&&tt<29,15,22)});
   const mid=t<20?c.at((mF+qF)/2):c.at(.47),kd=c.k(mid[1],40),on=clash1||clash2;
   dust.forEach((x,i)=>{put(x.el,[mid[0]+Math.sin(i*2.1+t*1.3)*26*kd,mid[1]-(8+i*7)*kd],kd*(1+.25*Math.sin(t*3+i)));show(x,on?.85:0)});
   sparks.forEach((x,i)=>{put(x.el,[mid[0]+Math.sin(i*3.7+Math.floor(t*5))*22*kd,mid[1]-(26+((i*13)%20))*kd],kd*.9);show(x,on&&((t*5+i*.37)%1)<.32)});
  };
 }
};

/* ---------- Ḥudaybiyyah ---------- */
const HUDAYBIYYAH={
 re:/^the treaty of ḥudaybiyyah$/i,story:/^(the pledge under the tree|the treaty of ḥudaybiyyah)$/i,cycle:34,still:24,
 label:'Animated scene: pilgrims in white at Ḥudaybiyyah, the kneeling camel, water rising in the well, the pledge under the tree and the treaty scroll',
 caps:[[0,'Year 6: about 1,400 Muslims in white iḥrām set out for ʿUmrah, with camels for sacrifice.','1,400 pilgrims set out for ʿUmrah'],[5,'At Ḥudaybiyyah the Prophet’s camel, al-Qaṣwāʾ, kneels and will not go on.','Al-Qaṣwāʾ kneels at Ḥudaybiyyah'],[9,'Water is short — then, by Allah’s blessing, water rises in the well for everyone.','Water rises in the well'],[13,'Under a tree, the companions pledge to stand together: Bayʿat ar-Riḍwān.','The pledge under the tree'],[19,'Suhayl ibn ʿAmr comes from Quraysh, and a treaty of peace is written.','Suhayl comes — a treaty is written'],[26,'Ten years of peace. Allah calls it “a clear victory”.','Peace — “a clear victory”']],
 bg:()=>{const id='lwXs'+(++uid);return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9d0dd"/><stop offset=".6" stop-color="#f0e2c4"/><stop offset="1" stop-color="#efd9ab"/></linearGradient></defs><rect width="600" height="260" fill="url(#${id})"/><path d="M0 176 L90 140 L170 162 L260 132 L350 160 L450 136 L540 158 L600 148 L600 260 L0 260Z" fill="#cfae7a"/><rect y="214" width="600" height="46" fill="#e6c995"/>`},
 build(g,c){
  const tents=[[.16,-64,'#f4efe2'],[.2,74,'#efe7d3'],[.25,96,'#f7f3ea']].map(x=>({f:x[0],d:x[1],m:mk(g,tentSvg(x[2]))}));
  const tree=mk(g,TREE),well=mk(g,WELL),water=well.el.querySelector('.lwX-water'),drops=[0,1,2,3].map(()=>mk(g,'<circle r="2.4" fill="#7cc4e8"/>'));
  const D=[0,1,2].map(i=>mk(g,riderCamelSvg({saddle:['#3b3433','#5a2c3a','#4a3b35'][i],robe:['#2f2a26','#5a2c3a','#4a3b35'][i],wrap:['#e8e2d0','#d9cdb4','#f4efe2'][i],skin:SKIN[(i+1)%4]}),{h:84,big:1.2,camel:1,ph:i}));
  const P=[0,1,2,3,4,5,6].map(i=>mk(g,pilgrimSvg(i),{ph:i*.6}));
  const C=[0,1].map(i=>mk(g,camel({garland:1,saddle:'#e8dcc0',color:['#c79a63','#b98b55'][i]}),{h:60,big:1.1,camel:1,ph:i}));
  const Qs=mk(g,camel({saddle:'#2f5c7a',color:'#cfa36b'}),{h:60,big:1.15,camel:1}),qGlow=mk(g,lightSvg());
  const scroll=mk(g,SCROLL),paper=scroll.el.querySelector('.lwX-paper'),roll=scroll.el.querySelector('.lwX-roll'),dove=mk(g,DOVE),wing=dove.el.querySelector('.lwX-wing');
  const qBody=Qs.el.querySelector('.lwX-cbody');const dP=[],dD=[];
  const TP=[[-40,8],[-22,14],[0,17],[22,14],[40,8]];
  return t=>{
   g.setAttribute('opacity',f3(t<.8?t/.8:t>31?clamp(1-(t-31)/1.8,0,1):1));
   tents.forEach(x=>{const p=c.side(x.f,x.d);put(x.m.el,p,c.k(p[1],26,.75));show(x.m,seg(t,5,6.5))});
   const tp=c.side(.40,96),kt=c.k(tp[1],56)*1.15;put(tree.el,tp,kt);
   const wp=c.side(.27,-50),kw=c.k(wp[1],20,.7);put(well.el,wp,kw);
   const wr=seg(t,9,11.5);water.setAttribute('fill',wr>0?'#5fb0d8':'#2c3a44');water.setAttribute('ry',f1(3.6+wr*1.2));water.setAttribute('cy',f1(-10-wr*1.5));
   drops.forEach((x,i)=>{const u=((t-9)*1.6+i*.25)%1;put(x.el,[wp[0]+(i-1.5)*6*kw,wp[1]-(14+Math.sin(u*Math.PI)*16)*kw],kw);show(x,t>=9.2&&t<12.5)});
   const hF=t<5?lerp(.02,.30,ease(t/5)):.30,st=c.step(hF);
   const qp=c.at(hF),dq=c.dir(hF),kq=c.k(qp[1],60,1.15),kn=seg(t,5,6.2);put(Qs.el,qp,kq,dq);
   qBody.setAttribute('transform',`translate(0 ${f1(17*kn)})`);Qs.legs.forEach(l=>{l.setAttribute('transform',kn>0?`scale(1 ${f3(1-.65*kn)})`:'');l.style.transformOrigin=`${l.getAttribute('x1')}px ${l.getAttribute('y1')}px`});
   if(kn===0)stride(Qs,t,t<5,5,12);put(qGlow.el,[qp[0],qp[1]-(66-17*kn)*kq],kq*.65);show(qGlow,.8+.2*Math.sin(t*2.2));
   P.forEach((m,j)=>{const f=hF-(j+1)*st*.9,pr=c.side(f,j%2?12:-12);let p=pr,walk=t<5;
    if(j<5){const u=seg(t,13,15.5),tg=[tp[0]+TP[j][0]*kt,tp[1]+TP[j][1]*kt];p=mix(pr,tg,ease(u));walk=walk||(u>0&&u<1)}
    const d=dP[j]=c.dir(f,dP[j]);put(m.el,p,c.k(p[1],56),j<5&&t>=13?(p[0]<tp[0]?1:-1):d);stride(m,t,walk,8);
    swing(m,j<5?-150*(seg(t,15.5,16.3)-seg(t,18.5,19.3)):0)});
   C.forEach((m,j)=>{const f=hF-(8+j*1.4)*st*.9,p=c.side(f,j?14:-14);put(m.el,p,c.k(p[1],m.h,m.big),c.dir(f));stride(m,t,t<5,5,12)});
   const dF=t<19?1.1:t<23?lerp(1.06,.52,ease(seg(t,19,23))):t<26.5?.52:lerp(.52,1.1,ease(seg(t,26.5,30)));
   D.forEach((m,j)=>{const f=dF+j*c.step(dF)*1.3,p=c.side(f,j%2?12:-12),d0=dD[j]=c.dir(f,dD[j]);put(m.el,p,c.k(p[1],m.h,m.big),t>=26.5?d0:-d0);show(m,f<1.04?1:0);stride(m,t,(t>=19&&t<23)||t>=26.5,5,12)});
   const sp=c.at(.46),ks=c.k(sp[1],40)*.9,un=seg(t,23,25);put(scroll.el,[sp[0],sp[1]-70*ks],ks);show(scroll,t>=23&&t<31?1:0);
   paper.setAttribute('transform',`translate(-24 0) scale(${f3(Math.max(.02,un))} 1) translate(24 0)`);roll.setAttribute('transform',`translate(${f1(-46*(1-un))} 0)`);
   const du=seg(t,26.5,31);put(dove.el,[lerp(-30,c.W+30,du),c.H*(.22-.08*du)+Math.sin(t*3)*6],Math.max(.8,c.k(c.H*.4,30)));show(dove,du>0&&du<1);wing.setAttribute('transform',`scale(1 ${f3(.35+.65*Math.abs(Math.sin(t*12)))})`);
  };
 }
};

/* ---------- The Opening of Makkah ---------- */
const FATH={
 re:/^return to makkah$/i,story:/^(return to makkah|mercy in makkah)$/i,cycle:36,still:17,
 label:'Animated scene: ten thousand Muslims march into Makkah with banners, the idols around the Kaʿbah fall and the adhān is called',
 caps:[[0,'Ramaḍān, year 8: ten thousand Muslims march towards Makkah with their banners.','10,000 Muslims march to Makkah'],[6.5,'The Prophet ﷺ enters Makkah and offers prayers of thanks to Allah. There is hardly any fighting.','Makkah opens with hardly any fighting'],[12.5,'Around the Kaʿbah stand 360 idols. “Truth has come, and falsehood has vanished.”','“Truth has come, falsehood has vanished”'],[19.5,'The idols have fallen. Bilāl calls the adhān from the roof of the Kaʿbah.','The adhān from the Kaʿbah'],[25.5,'“Go, you are free.” The people of Makkah are forgiven, and many accept Islam.','“Go, you are free”']],
 bg:()=>{const id='lwXs'+(++uid);return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3c68d"/><stop offset=".6" stop-color="#fbe2b6"/><stop offset="1" stop-color="#f1d6a2"/></linearGradient></defs><rect width="600" height="260" fill="url(#${id})"/><path d="M0 150 L60 104 L120 132 L190 84 L260 128 L330 96 L400 134 L470 92 L540 126 L600 108 L600 260 L0 260Z" fill="#b98a5e"/>${[[40,176,46,30],[96,170,40,36],[150,180,44,26],[330,174,42,32],[380,168,48,38],[600-120,172,40,34]].map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#d9b98a" stroke="#a8875a" stroke-width="1"/><rect x="${x+w*.4}" y="${y+h*.45}" width="${w*.2}" height="${h*.55}" fill="#8a6440"/>`).join('')}<rect y="214" width="600" height="46" fill="#e6c995"/>`},
 build(g,c){
  let kp=c.pic(.795,.29),kh=0,own=null;
  if(kp&&kp[0]>c.W*.06&&kp[0]<c.W*.94&&kp[1]>c.H*.1&&kp[1]<c.H*.8){kh=(.29-.17)*(c.pic(0,1)[1]-c.pic(0,0)[1])}else kp=null;
  if(!kp){own=mk(g,kaabaSvg());kp=c.side(.9,c.story?150:80)}
  const kk=own?c.k(kp[1],66)*(c.story?1.15:1.25):0;if(own){put(own.el,kp,kk);kh=66*kk}
  const IP=own?[-1.25,-1,-.75,-.5,.5,.75,1,1.25,-1.45,1.45].map((x,i)=>[kp[0]+x*38*kk,kp[1]+(i%2?4:9)*kk]):[[.70,.315],[.735,.322],[.77,.326],[.82,.326],[.855,.322],[.89,.315],[.92,.305],[.675,.305],[.945,.295],[.72,.297]].map(([u,v])=>c.pic(u,v));
  const ik=kh*.36/30,idols=IP.map(()=>mk(g,IDOL)),puffs=IP.map(()=>mk(g,DUST));
  const people=[0,1,2,3].map(i=>mk(g,personSvg({woman:i%2,robe:['#e9dcc2','#3b3433','#b98a5a','#4a3b35'][i],wrap:['#f4efe2','#4a3b35','#e8e2d0','#2f3438'][i],skin:SKIN[i%4]}),{ph:i}));
  people.forEach(m=>m.el.querySelectorAll('.lw-leg').forEach(l=>{l.setAttribute('stroke','#3f3021');l.setAttribute('stroke-width','2.4');l.setAttribute('stroke-linecap','round')}));
  const plan=[{h:1,flag:'#f8f6ee'},'sword','spear','c',{h:1,flag:'#1f1f1f'},'sword',{w:'flag',flag:'#2e6b58'},'Q','spear','sword',{h:1},'sword','c',{w:'flag',flag:'#f8f6ee'},'spear',{h:1,flag:'#2e6b58'}];
  let glow=null;
  const col=plan.map((x,i)=>{if(x==='Q'){const m=mk(g,camel({saddle:'#2f5c7a',color:'#cfa36b'}),{h:60,big:1.15,camel:1,qaswa:1});glow=mk(g,lightSvg());return m}
   return typeof x==='object'&&x.h?mk(g,horsemanSvg({side:'m',i,flag:x.flag}),{h:84,big:1.3,horse:1,ph:i}):x==='c'?mk(g,camel({load:1,saddle:'#7a2f2a'}),{h:60,big:1.1,camel:1,ph:i}):mk(g,warriorSvg({side:'m',i,weapon:x.w||x,flag:x.flag}),{ph:i*.7})});
  const adhan=mk(g,ADHAN),arcs=adhan.el.querySelector('.lwX-arcs'),doves=[0,1,2].map(()=>mk(g,DOVE));const dirs=[];
  return t=>{
   g.setAttribute('opacity',f3(t<.8?t/.8:t>33?clamp(1-(t-33)/1.8,0,1):1));
   const head=t<15?lerp(-.02,.78,seg(t,0,15)):lerp(.78,.84,ease(seg(t,15,20))),walk=t<20;
   col.forEach((m,j)=>{const f=head-j*c.step(Math.max(.05,head-j*.04))*1.05,p=c.side(f,j%2?11:-11),d=dirs[j]=c.dir(Math.max(0,f),dirs[j]),k=c.k(p[1],m.h,m.big);put(m.el,p,k,d);show(m,f>-.004);stride(m,t,walk,m.horse?9:m.camel?5:8,m.horse?18:m.camel?12:16);
    if(m.qaswa&&glow){put(glow.el,[p[0],p[1]-68*k],k*.65);show(glow,f>-.004?.8+.2*Math.sin(t*2.2):0)}});
   IP.forEach((p,i)=>{const t0=13+i*.6,u=seg(t,t0,t0+.5);idols[i].el.setAttribute('transform',`translate(${f1(p[0])} ${f1(p[1])}) scale(${f3(ik)}) rotate(${f1(u*82*(i%2?1:-1))})`);show(idols[i],t<t0+.4?1:1-seg(t,t0+.4,t0+1.1));
    const pu=seg(t,t0+.3,t0+1.4);put(puffs[i].el,[p[0],p[1]-6*ik],ik*.9*(.6+pu));show(puffs[i],pu>0&&pu<1?.8*(1-pu):0)});
   const au=seg(t,19.6,20.6),ao=1-seg(t,25,26),ak=clamp(kh/66*.7,.6,.95);put(adhan.el,[kp[0],kp[1]-kh-(14+6*au)*ak],ak);show(adhan,t>=19.6&&t<26?au*ao:0);arcs.setAttribute('transform',`scale(${f3(1+.18*((t*1.5)%1))})`);arcs.setAttribute('opacity',f3(1-((t*1.5)%1)));
   people.forEach((m,i)=>{const u=seg(t,25.5,29),f=lerp(.99,.9-i*.012,ease(u)),p=c.side(f,i%2?16:-16),d=-c.dir(f);put(m.el,p,c.k(p[1],56),d);show(m,t>=25.5?Math.min(1,u*3):0);stride(m,t,u>0&&u<1,7,14)});
   doves.forEach((m,i)=>{const u=seg(t,26+i*.7,31+i*.7);put(m.el,[lerp(c.W+30,-30,u),c.H*(.18+i*.05)+Math.sin(t*3+i)*6],Math.max(.8,c.k(c.H*.4,30)));show(m,u>0&&u<1);m.el.querySelector('.lwX-wing').setAttribute('transform',`scale(1 ${f3(.35+.65*Math.abs(Math.sin(t*12+i)))})`)});
  };
 }
};


/* ---------- Arriving in Madīnah, with the welcome nasheed ---------- */
const HOUSE=`<rect x="-26" y="-44" width="52" height="44" fill="#d9b98a" stroke="#a8875a" stroke-width="1.2"/><rect x="-26" y="-50" width="52" height="7" fill="#c9a676" stroke="#a8875a" stroke-width="1"/><rect x="-6" y="-24" width="12" height="24" fill="#7a5532"/><rect x="-19" y="-38" width="8" height="7" fill="#5d4128"/><rect x="11" y="-38" width="8" height="7" fill="#5d4128"/>`;
const DAF=`<circle cx="12" cy="-34" r="6.5" fill="#efd9a8" stroke="#7a5a33" stroke-width="1.8"/><circle cx="7" cy="-34" r="1" fill="#b98a3a"/><circle cx="17" cy="-34" r="1" fill="#b98a3a"/>`;
const FROND=`<path d="M11-26 L18-60" stroke="#5f7d34" stroke-width="1.8"/><path d="M18-60 q-9 4-12 10 M18-56 q8 2 11 9 M17-51 q-8 3-10 9 M17-47 q7 2 9 8" stroke="#6f9a3e" stroke-width="2" fill="none" stroke-linecap="round"/>`;
function welcomerSvg(i,kind){
 const woman=kind==='daf'||kind==='woman',robe=woman?['#3b3433','#5b4636','#2f3438','#6a3d4f'][i%4]:['#e9dcc2','#d8c3a0','#f2ece0','#b98a5a'][i%4],wrap=woman?['#4a3b35','#7a4f5a','#3b4a5a'][i%3]:['#f4efe2','#e8e2d0','#d9cdb4'][i%3];
 return personSvg({woman,robe,wrap,skin:SKIN[i%4]}).replace(/class="lw-leg ([ab])"/g,'class="lw-leg $1" stroke="#3f3021" stroke-width="2.4" stroke-linecap="round"').replace(/<line class="lw-arm"[^>]*\/>/,'')
  +`<g class="lwX-arm"><line x1="5" y1="-32" x2="10" y2="-26" stroke="${robe}" stroke-width="3.6" stroke-linecap="round"/>${kind==='daf'?DAF:kind==='frond'?FROND:''}</g>`;
}
const MADINAH={
 re:/^welcome to madīnah$/i,story:/^(welcome to madīnah|the house of abū ayyūb)$/i,cycle:30,still:13,nasheed:true,
 label:'Animated scene: the people of Madīnah line the road to welcome the Prophet’s camel, which kneels where his Masjid will be built',
 caps:[[0,'For days the people of Madīnah have waited on the road every morning for the Prophet ﷺ.','Madīnah waits on the road'],[4.5,'He arrives! Shouts of “Allāhu Akbar” ring out, and the girls of Madīnah chant verses of welcome.','Madīnah welcomes him'],[11,'Everyone calls out: “Stay with us, O Messenger of Allah!” He answers: “This camel is commanded by Allah — wherever it stops will be my home.”','“This camel is commanded by Allah”'],[20,'The camel kneels where the Prophet’s Masjid will be built, and Abū Ayyūb takes him into his home.','The camel kneels — Abū Ayyūb’s home']],
 bg:()=>{const id='lwXs'+(++uid);return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd6e4"/><stop offset=".6" stop-color="#eef0dc"/><stop offset="1" stop-color="#e9d7aa"/></linearGradient></defs><rect width="600" height="260" fill="url(#${id})"/><path d="M0 170 L80 150 L170 164 L260 146 L360 166 L460 150 L600 162 L600 260 L0 260Z" fill="#b9a27a"/>${[40,110,190,420,500,560].map((x,i)=>`<g transform="translate(${x} ${178+(i%2)*6})"><path d="M0 0 L2-38" stroke="#7a5a33" stroke-width="3"/><path d="M2-38 q-16 2-22 12 M2-38 q14-2 21 10 M2-38 q-6-12-18-14 M2-38 q8-12 19-12" stroke="#5f8a3a" stroke-width="4" fill="none" stroke-linecap="round"/></g>`).join('')}<rect y="214" width="600" height="46" fill="#e6cf9c"/>`},
 build(g,c){
  const hp=c.side(.82,c.story?110:62),house=mk(g,HOUSE);
  const kinds=['man','daf','frond','woman','daf','man','frond','daf','woman','man','frond','daf'];
  const crowd=kinds.map((kind,i)=>{const f=.22+i*.055,d=(i%2?1:-1)*(c.story?(i%4<2?60:96):26),child=kind==='daf'||kind==='frond';return Object.assign(mk(g,welcomerSvg(i,kind),{ph:i}),{f,d,child,kind})});
  const cam2=mk(g,camel({saddle:'#7a2f2a',color:'#c4955d'}),{h:60,big:1.1,camel:1}),Qs=mk(g,camel({saddle:'#2f5c7a',color:'#cfa36b'}),{h:60,big:1.15,camel:1}),glow=mk(g,lightSvg()),qBody=Qs.el.querySelector('.lwX-cbody');
  const dirs=[];
  return t=>{
   g.setAttribute('opacity',f3(t<.8?t/.8:t>27?clamp(1-(t-27)/1.8,0,1):1));
   put(house.el,hp,c.k(hp[1],50,1.3));
   const qf=t<20?lerp(.02,.76,seg(t,2,20)):.76,kn=seg(t,20,21.2),qp=c.at(qf),dq=dirs[0]=c.dir(qf,dirs[0]),kq=c.k(qp[1],60,1.15);
   put(Qs.el,qp,kq,dq);show(Qs,t>=2);qBody.setAttribute('transform',`translate(0 ${f1(17*kn)})`);Qs.legs.forEach(l=>{l.setAttribute('transform',kn>0?`scale(1 ${f3(1-.65*kn)})`:'');l.style.transformOrigin=`${l.getAttribute('x1')}px ${l.getAttribute('y1')}px`});
   if(kn===0)stride(Qs,t,t>=2&&t<20,5,12);put(glow.el,[qp[0],qp[1]-(66-17*kn)*kq],kq*.65);show(glow,t>=2?.8+.2*Math.sin(t*2.2):0);
   const f2=Math.max(0,qf-c.step(qf)*1.6),p2=c.at(f2);put(cam2.el,p2,c.k(p2[1],60,1.1),dirs[1]=c.dir(f2,dirs[1]));show(cam2,t>=2&&f2>.005);stride(cam2,t,t>=2&&t<20.5,5,12);
   crowd.forEach((m,i)=>{const near=clamp(1-Math.abs(qf-m.f)/.06,0,1)*(t<20?1:0),cheer=t>=21?1:0,base=c.side(m.f,m.d),road=c.side(m.f,m.d*.55),p=mix(base,road,near*.8);
    const bob=m.child?Math.abs(Math.sin(t*5+i))*3:0,k=c.k(p[1],56)*(m.child?.78:1);put(m.el,[p[0],p[1]-bob*k],k,(qp[0]>=p[0]?1:-1));
    stride(m,t,near>.05&&near<.95,7,10);
    swing(m,m.kind==='daf'?-60+Math.sin(t*(t>=4.5?10:4)+i)*22:m.kind==='frond'?-40+Math.sin(t*4+i)*30:-(110*Math.max(near,cheer))+Math.sin(t*6+i)*(near||cheer?14:0))});
  };
 }
};

/* The welcome nasheed “Ṭalaʿa l-badru ʿalaynā”: a recording (assets/audio/tala3al.mp3), played only
   when someone taps the button. The words are shown while it plays. */
const NASHEED_LINES=[
 ['طَلَعَ الْبَدْرُ عَلَيْنَا','Ṭalaʿa l-badru ʿalaynā','The full moon has risen over us','ṭa la ʿal bad ru ʿa lay nā',[62,65,67,69,69,67,65,67]],
 ['مِنْ ثَنِيَّاتِ الْوَدَاعْ','min thaniyyāti l-wadāʿ','from the hills of al-Wadāʿ','min tha niy yā til wa dāʿ',[69,69,70,69,67,65,64]],
 ['وَجَبَ الشُّكْرُ عَلَيْنَا','Wajaba sh-shukru ʿalaynā','Giving thanks is our duty','wa ja bash shuk ru ʿa lay nā',[62,65,67,69,69,67,65,67]],
 ['مَا دَعَا لِلّٰهِ دَاعْ','mā daʿā lillāhi dāʿ','as long as anyone calls to Allah','mā da ʿā lil lā hi dāʿ',[69,67,65,64,65,64,62]],
 ['أَيُّهَا الْمَبْعُوثُ فِينَا','Ayyuha l-mabʿūthu fīnā','O you who were sent to us','ay yu hal mab ʿū thu fī nā',[69,69,72,70,69,67,65,69]],
 ['جِئْتَ بِالْأَمْرِ الْمُطَاعْ','jiʾta bil-amri l-muṭāʿ','you came with a command to be obeyed','ji ʾta bil am ril mu ṭāʿ',[67,65,64,65,67,64,62]]];
const Nasheed=(()=>{
 let audio=null,cur=null,watch=0;
 function stop(){if(!cur)return;const c=cur;cur=null;clearInterval(watch);try{audio.pause();audio.currentTime=0}catch(e){}if(c.onEnd)c.onEnd()}
 function play(onLine,onEnd,stillHere){
  stop();audio=audio||Object.assign(new Audio('assets/audio/tala3al.mp3'),{preload:'none'});
  const c={onEnd};cur=c;
  audio.onended=()=>{if(cur===c)stop()};audio.onerror=()=>{if(cur===c)stop()};audio.onplaying=()=>{if(cur===c&&onLine)onLine(0)};
  try{audio.currentTime=0}catch(e){}
  const pr=audio.play();if(pr&&pr.catch)pr.catch(()=>{if(cur===c)stop()});
  watch=setInterval(()=>{if(stillHere&&!stillHere())stop()},400);return true;
 }
 return{play,stop,get playing(){return!!cur}};
})();
function lyricHTML(){const l=NASHEED_LINES[0];return `<span class="lw-ly-ar" lang="ar" dir="rtl">${l[0]}</span><span class="lw-ly-tr">${l[1]}</span><span class="lw-ly-en">${l[2]}</span>`}
function nasheedButton(host,lyricBox,stillHere){
 const b=document.createElement('button');b.type='button';b.className='lw-nasheed-btn';
 const idle=()=>{b.textContent='🔊 Welcome nasheed';b.setAttribute('aria-pressed','false');lyricBox.classList.remove('on')};idle();
 b.onclick=e=>{e.stopPropagation();if(Nasheed.playing){Nasheed.stop();return}
  if(Nasheed.play(i=>{lyricBox.innerHTML=lyricHTML(i);lyricBox.classList.add('on')},idle,()=>b.isConnected&&b.offsetParent!==null)){b.textContent='⏹ Stop nasheed';b.setAttribute('aria-pressed','true');lyricBox.innerHTML='<span class="lw-ly-tr">♪ …</span>';lyricBox.classList.add('on')}};
 host.appendChild(b);return b;
}
function mapNasheed(){const frame=document.getElementById('mapSvg')?.closest('.map-frame');if(!frame)return;
 Nasheed.stop();frame.querySelectorAll('.lw-nasheed-btn,.lw-lyrics').forEach(x=>x.remove());
 const box=document.createElement('div');box.className='lw-lyrics';box.setAttribute('aria-live','polite');frame.appendChild(box);nasheedButton(frame,box)}
/* ---------- more Seerah moments (each with Arabic-first speech where the words are reported) ---------- */
const pingpong=x=>{const m=((x%2)+2)%2;return m<1?m:2-m};
const fadeIO=(t,end)=>f3(t<.8?t/.8:t>end?clamp(1-(t-end)/1.8,0,1):1);
function plainBg(c1,c2,c3,hill,ground,extra=''){const id='lwXs'+(++uid);return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".6" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient></defs><rect width="600" height="260" fill="url(#${id})"/><path d="M0 168 L70 128 L130 150 L210 112 L290 150 L370 118 L450 152 L530 120 L600 140 L600 260 L0 260Z" fill="${hill}"/><path d="M0 196 Q150 176 300 194 T600 188 L600 260 L0 260Z" fill="${ground}"/><rect y="216" width="600" height="44" fill="${ground}"/>${extra}`}
function workerSvg(o){const i=o.i||0,tunic=o.tunic||['#efe6d2','#d9c9a8','#c9b28a','#e2d6bd','#b98a5a'][i%5],skin=SKIN[i%SKIN.length],wrap=['#f4efe2','#e8e2d0','#d9cdb4','#7c5236'][i%4],woman=o.woman;
 let tool;
 if(o.tool==='pick')tool=`<line x1="5" y1="-32" x2="12" y2="-40" stroke="${tunic}" stroke-width="4" stroke-linecap="round"/><line x1="12" y1="-40" x2="16" y2="-14" stroke="#6b4b2b" stroke-width="2.2" stroke-linecap="round"/><path d="M8-15 Q16-20 25-13" stroke="#7d848e" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
 else if(o.tool==='brick')tool=`<line x1="5" y1="-32" x2="10" y2="-25" stroke="${tunic}" stroke-width="4" stroke-linecap="round"/><g class="lwX-load"><rect x="5" y="-31" width="14" height="8" rx="1.5" fill="#b0784a" stroke="#6e4528" stroke-width="1"/><path d="M12-31 v8" stroke="#6e4528" stroke-width=".7"/></g>`;
 else if(o.tool==='basket')tool=`<line x1="5" y1="-32" x2="5" y2="-50" stroke="${tunic}" stroke-width="4" stroke-linecap="round"/><g class="lwX-load"><path d="M-9-58 h18 l-3 8 h-12Z" fill="#a0743f" stroke="#6d4a26" stroke-width="1"/><path d="M-7-58 q7-6 14 0" fill="#9c7a52"/></g>`;
 else if(o.tool==='jug')tool=`<line x1="5" y1="-32" x2="9" y2="-21" stroke="${tunic}" stroke-width="4" stroke-linecap="round"/><path d="M7-23 q-5 0-5 7 q0 6 7 6 q7 0 7-6 q0-7-5-7 v-3 h-4Z" fill="#b5643a" stroke="#6e3a1f" stroke-width="1"/>`;
 else if(o.tool==='gift')tool=`<line x1="5" y1="-32" x2="9" y2="-24" stroke="${tunic}" stroke-width="4" stroke-linecap="round"/><g class="lwX-load"><rect x="3" y="-31" width="17" height="11" rx="2" fill="#8a5a2b" stroke="#4d3015" stroke-width="1"/><path d="M3-26 h17 M11-31 v11" stroke="#e4b85a" stroke-width="1.4"/></g>`;
 else tool=`<line x1="5" y1="-32" x2="9" y2="-20" stroke="${woman?['#3b3433','#4a3b35','#5b4636'][i%3]:tunic}" stroke-width="4" stroke-linecap="round"/>`;
 return `<g>${LEG(-3,-15,-4,0,'a','#3f3021',2.6)}${LEG(3,-15,4,0,'b','#3f3021',2.6)}</g><path d="M-8-${woman?4:13} L-6-36 Q0-39 6-36 L${woman?9:8}-${woman?4:13}Z" fill="${woman?['#3b3433','#4a3b35','#5b4636'][i%3]:tunic}" stroke="#00000030" stroke-width=".8"/>`
  +(woman?`<path d="M-7-36 Q-8-50 0-50 Q8-50 7-36 Q8-30 0-31 Q-8-30-7-36Z" fill="${['#3b3433','#4a3b35','#2f3438'][i%3]}"/><circle cx="2.5" cy="-42" r="3.6" fill="${skin}"/>`
         :`<circle cx="0" cy="-42" r="5.6" fill="${skin}"/><path d="M-7-41 Q-7-51 0-51 Q7-51 7-43 L8-38 Q4-40 2-42 L-1-42 Q-4-40-8-38Z" fill="${wrap}"/>`)
  +`<g class="lwX-arm">${tool}</g>`}
const KING=`<path d="M-15 0 V-46 Q-15-54-7-54 H7 Q15-54 15-46 V0Z" fill="#c9a43a" stroke="#8a6d1f" stroke-width="1.2"/><path d="M-12-2 V-44 H12 V-2Z" fill="#7a2f5a"/><path d="M-8-4 L-6-30 Q0-34 6-30 L8-4Z" fill="#f2ead8"/><path d="M-9-24 h18" stroke="#c9a43a" stroke-width="2"/><circle cx="0" cy="-37" r="5.8" fill="${SKIN[2]}"/><path d="M-6-41 L-6-47 -3-44 0-49 3-44 6-47 6-41Z" fill="#e4b85a" stroke="#9a7220" stroke-width=".6"/>`;
const TEAR=`<ellipse rx="1.6" ry="2.4" fill="#8fd0ff" stroke="#3d7fb0" stroke-width=".5"/>`;
const CLOAK=`<path d="M-30-3 Q0 4 30-3 L28 5 Q0 11-28 5Z" fill="#9b2f2a" stroke="#5e1b18" stroke-width="1"/><path d="M-26 1 Q0 7 26 1" stroke="#e4b85a" stroke-width="1.2" fill="none"/>`;
const STONE=`<ellipse cx="0" cy="-5" rx="9" ry="6.5" fill="#1d1a1a" stroke="#000" stroke-width=".8"/><ellipse cx="-3" cy="-7" rx="3" ry="1.6" fill="#fff" opacity=".18"/>`;
const PILE=`<path d="M-22 0 L-18-7 H18 L22 0Z" fill="#a46c40"/><path d="M-16-7 L-13-13 H13 L16-7Z" fill="#b0784a"/><path d="M-10-13 L-8-18 H8 L10-13Z" fill="#a46c40"/><path d="M-18-7 H18 M-13-13 H13 M-6-7 V0 M6-7 V0 M0-13 V-7" stroke="#6e4528" stroke-width=".8"/>`;
const EARTH=`<path d="M-24 0 Q-14-16 0-18 Q14-16 24 0Z" fill="#b8925f" stroke="#8a6a3f" stroke-width="1"/>`;
const SPRAY=[...Array(9)].map((_,i)=>`<circle class="lwX-drop" data-d="${i}" r="2.6" fill="#7fc6ef" stroke="#3d86b8" stroke-width=".6"/>`).join('');
const WIND=[...Array(7)].map((_,i)=>`<path class="lwX-gust" d="M0 0 q40-8 80 0 t80 0" stroke="#fff" stroke-opacity=".75" stroke-width="2.2" fill="none" stroke-linecap="round"/>`).join('');
function depthSort(g,list,top){if(!list.length)return;list._n=(list._n||0)+1;if(list._n%4!==1)return;[...list].filter(m=>m.y!=null).sort((a,b)=>a.y-b.y).forEach(m=>g.appendChild(m.el));(top||[]).forEach(m=>g.appendChild(m.el))}
const place=(m,p,k,d=1)=>{m.x=p[0];m.y=p[1];put(m.el,p,k,d)};
const headOf=(m,p,k,h=62)=>[p[0],p[1]-h*k];
const Q={
 amin:{who:'The people of Quraysh · Ar-Raheeq al-Makhtūm',k:'people',ar:'هَذَا الْأَمِينُ، رَضِينَا',en:'Al-Amīn, the trustworthy one, has come — we are content with his decision!'},
 alaq1:{who:'The first words of the Qurʾān · 96:1',k:'quran',ar:'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',en:'Read in the name of your Lord who created.'},
 alaq3:{who:'Sūrat al-ʿAlaq 96:3–4',k:'quran',ar:'اقْرَأْ وَرَبُّكَ الْأَكْرَمُ ۝ الَّذِي عَلَّمَ بِالْقَلَمِ',en:'Read, and your Lord is the Most Generous, who taught by the pen.'},
 jafar:{who:'Jaʿfar ibn Abī Ṭālib · Aḥmad 1740',k:'sahabi',ar:'أَيُّهَا الْمَلِكُ، كُنَّا قَوْمًا أَهْلَ جَاهِلِيَّةٍ… حَتَّى بَعَثَ اللَّهُ إِلَيْنَا رَسُولًا مِنَّا',en:'O King, we were a people of ignorance… until Allah sent us a Messenger from among us.'},
 najashi:{who:'The Najāshī, king of Abyssinia · Aḥmad 1740',k:'king',ar:'اذْهَبُوا فَأَنْتُمْ سُيُومٌ بِأَرْضِي',en:'Go — you are safe in my land.'},
 masjid:{who:'The Prophet ﷺ, building with them · al-Bukhārī 428',k:'nabi',ar:'اللَّهُمَّ لَا خَيْرَ إِلَّا خَيْرُ الْآخِرَهْ، فَاغْفِرْ لِلْأَنْصَارِ وَالْمُهَاجِرَهْ',en:'O Allah, there is no good except the good of the Hereafter, so forgive the Anṣār and the Muhājirūn.'},
 trench1:{who:'The Prophet ﷺ · al-Bukhārī 2834',k:'nabi',ar:'اللَّهُمَّ إِنَّ الْعَيْشَ عَيْشُ الْآخِرَهْ، فَاغْفِرْ لِلْأَنْصَارِ وَالْمُهَاجِرَهْ',en:'O Allah, the real life is the life of the Hereafter, so forgive the Anṣār and the Muhājirūn.'},
 trench2:{who:'The companions replied · al-Bukhārī 2834',k:'people',ar:'نَحْنُ الَّذِينَ بَايَعُوا مُحَمَّدَا، عَلَى الْجِهَادِ مَا بَقِينَا أَبَدَا',en:'We are the ones who pledged to Muhammad ﷺ to strive for as long as we live!'},
 ask:{who:'The Prophet ﷺ at ʿArafah · Muslim 1218',k:'nabi',ar:'وَأَنْتُمْ تُسْأَلُونَ عَنِّي، فَمَا أَنْتُمْ قَائِلُونَ؟',en:'You will be asked about me. What will you say?'},
 witness:{who:'The pilgrims · Muslim 1218',k:'people',ar:'نَشْهَدُ أَنَّكَ قَدْ بَلَّغْتَ وَأَدَّيْتَ وَنَصَحْتَ',en:'We bear witness that you conveyed the message, fulfilled it and gave sincere advice.'},
 ishhad:{who:'The Prophet ﷺ · Muslim 1218',k:'nabi',ar:'اللَّهُمَّ اشْهَدْ، اللَّهُمَّ اشْهَدْ',en:'O Allah, be witness! O Allah, be witness!'},
 akmaltu:{who:'Revealed at ʿArafah · al-Māʾidah 5:3',k:'quran',ar:'الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ',en:'Today I have perfected your religion for you.'}
};
const sayIn=(t,list)=>{for(const [a,b,q,at] of list)if(t>=a&&t<b)return{say:[q,at[0],at[1]]};return null};

/* ---------- Zamzam (Map 2) ---------- */
const ZAMZAM={
 re:/zamzam/i,story:/zamzam/i,cycle:26,still:12,
 label:'Animated scene: ʿAbd al-Muṭṭalib digs where his dream showed him, finds what Jurhum had buried, and Zamzam water flows again',
 caps:[[0,'In a dream, ʿAbd al-Muṭṭalib is ordered to dig Zamzam in a particular place — the well that Jurhum had filled in when they left Makkah.','A dream: dig Zamzam!'],[3.5,'He digs in the place shown to him, near the Kaʿbah.','Digging where the dream showed'],[10,'He finds what Jurhum had buried there: swords, armour and two deer made of gold.','The old well appears!'],[14,'Zamzam water gushes again, and giving it to the pilgrims becomes a tradition.','Zamzam flows again']],
 bg:()=>plainBg('#f6c98a','#fbe4b8','#f3d9a6','#c9a06a','#e2c08a',`<g transform="translate(540 216)">${kaabaSvg()}</g>`),
 build(g,c){
  const spot=c.side(.6,c.story?0:34),mound=mk(g,EARTH),well=mk(g,WELL),spray=mk(g,SPRAY);
  const D=[mk(g,workerSvg({i:0,tool:'pick'}),{ph:0}),mk(g,workerSvg({i:3,tool:'pick'}),{ph:1.6})];
  const V=[0,1,2,3,4].map(i=>mk(g,workerSvg({i:i+1,woman:i%2===0,tool:'jug'}),{ph:i*.9}));
  const drops=[...spray.el.querySelectorAll('.lwX-drop')],all=[...D,...V];
  return t=>{
   g.setAttribute('opacity',fadeIO(t,23.5));
   const ks=c.k(spot[1],56);
   place(mound,[spot[0]+30*ks,spot[1]+2*ks],ks*(.35+.65*seg(t,3.5,10)));show(mound,1);
   place(well,[spot[0],spot[1]+1],c.k(spot[1],20,.9));show(well,seg(t,9.6,10.6));
   put(spray.el,[spot[0],spot[1]-10*ks],ks);show(spray,t>10.4&&t<15?1:0);
   drops.forEach((d,i)=>{const ph=((t*1.6+i/9)%1),a=(i/9-.5)*1.6;d.setAttribute('cx',f1(Math.sin(a)*26*ph));d.setAttribute('cy',f1(-38*ph*(1-ph)*2.2+ph*6))});
   D.forEach((m,j)=>{const home=[spot[0]+(j?-20:20)*ks,spot[1]+(j?-3:4)*ks],from=c.side(.18,j?-14:14),w=seg(t,0,3.4),p=mix(from,home,ease(w));
    place(m,p,c.k(p[1],m.h),t<3.4?(home[0]>=from[0]?1:-1):(j?1:-1));stride(m,t,t<3.4);swing(m,t>=3.6&&t<9.8?Math.sin(t*5+m.ph)*38-10:0)});
   V.forEach((m,j)=>{const to=c.side(.6-.05*(j+1),(j%2?-1:1)*(16+j*5)),from=c.side(.02,(j%2?-1:1)*10),w=seg(t,13+j*.6,18+j*.6),p=mix(from,to,ease(w));
    place(m,p,c.k(p[1],m.h),to[0]>=from[0]?1:-1);show(m,t>13+j*.6?1:0);stride(m,t,w>0&&w<1)});
   depthSort(g,all,[spray]);
   return null; /* no words are quoted here: Ar-Raheeq al-Makhtūm tells this event without them */
  };
 }
};

/* ---------- The Black Stone (Map 8) ---------- */
const BLACKSTONE={
 re:/^the black stone$/i,story:/^the black stone$/i,cycle:27,still:15,
 label:'Animated scene: the tribes argue over the Black Stone, then four leaders lift it together on a cloak and it is put back in the Kaʿbah',
 caps:[[0,'Quraysh rebuild the Kaʿbah. Who will have the honour of putting the Black Stone back?','Who will place the Black Stone?'],[3.5,'The tribes argue. They agree: the first man through the gate will decide.','The tribes argue'],[7,'The first to come is Muhammad ﷺ, the one they call al-Amīn.','“This is al-Amīn!”'],[11,'He puts the stone on a cloak, and a leader from each tribe holds a corner.','Every tribe holds the cloak'],[16.5,'Together they carry it, and he puts the stone in its place with his own hands. Everyone is happy.','The stone is back in its place']],
 bg:()=>plainBg('#f6c98a','#fbe4b8','#f3d9a6','#c9a06a','#e2c08a',`<g transform="translate(520 216)">${kaabaSvg()}</g>`),
 build(g,c){
  let K=c.story?[488,182]:c.pic(.752,.31);if(!c.story&&(!K||K[0]<c.W*.05||K[0]>c.W*.95||K[1]<c.H*.14))K=c.side(.95,-20);
  const C0=c.story?c.at(.42):c.at(.5),cloak=mk(g,CLOAK),stone=mk(g,STONE),glow=mk(g,lightSvg());
  const tribes=['#7a2f2a','#2f5c7a','#5c6b3c','#6a3d7a'],LDR=tribes.map((col,i)=>mk(g,workerSvg({i:i+1,tunic:col}),{ph:i}));
  const corner=[[-26,-5],[26,-5],[-22,5],[22,5]];
  return t=>{
   g.setAttribute('opacity',fadeIO(t,24.5));
   const carry=ease(seg(t,13.5,17)),Kfront=mix(C0,K,.82),ctr=mix(C0,Kfront,carry),k=c.k(ctr[1],56),lift=seg(t,11,12.6)*(1-seg(t,19.5,20.8));
   const cl=[ctr[0],ctr[1]-(4+16*lift)*k];place(cloak,cl,k);
   LDR.forEach((m,i)=>{const p=[ctr[0]+corner[i][0]*k,ctr[1]+corner[i][1]*k];place(m,p,c.k(p[1],m.h),i%2?-1:1);stride(m,t,t>=13.5&&t<17);
    const argue=t<6.6?Math.sin(t*6+i*1.7)*30-20:0;swing(m,lift>0?-100*lift:argue)});
   const up=ease(seg(t,17.2,19.2)),sp=mix([cl[0],cl[1]-2*k],[K[0],K[1]-26*k],up);place(stone,sp,k*(1-.25*up));
   const lp=t<6?c.side(.06,-30):t<9?mix(c.side(.06,-30),[C0[0]-40*k,C0[1]],ease(seg(t,6,9))):mix([C0[0]-40*k,C0[1]],[K[0]-30*k,K[1]],carry*.8+up*.2);
   put(glow.el,[lp[0],lp[1]-30*k],k*.62);show(glow,t>5.6?.85+.15*Math.sin(t*2.2):0);
   depthSort(g,[...LDR,cloak],[stone,glow]);
   return sayIn(t,[[7.4,10.8,Q.amin,headOf(LDR[0],[ctr[0]+corner[0][0]*k,ctr[1]+corner[0][1]*k],k)]]);
  };
 }
};

/* ---------- The first revelation, the cave of Ḥirāʾ (Map 9) ---------- */
// All five ayahs of the first revelation: Qurʾān 96:1–5; Ṣaḥīḥ al-Bukhārī 4953.
const HIRA_AYAHS=[
 {ar:'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',en:'Read in the name of your Lord, the Creator.'},
 {ar:'خَلَقَ الْإِنْسَانَ مِنْ عَلَقٍ',en:'He made the human being from a clinging clot.'},
 {ar:'اقْرَأْ وَرَبُّكَ الْأَكْرَمُ',en:'Read! Your Lord is supremely generous.'},
 {ar:'الَّذِي عَلَّمَ بِالْقَلَمِ',en:'He taught through the pen.'},
 {ar:'عَلَّمَ الْإِنْسَانَ مَا لَمْ يَعْلَمْ',en:'He taught the human being what they did not know.'}
].map((q,i)=>({...q,k:'quran',who:'The first revelation · Al-ʿAlaq 96:'+(i+1),verse:i+1}));
SL.hiraVerses=HIRA_AYAHS;
const HIRA={
 re:/^read!$/i,story:/^read!$/i,cycle:58,still:8,
 label:'Jabal al-Nūr and the cave of Ḥirāʾ: symbolic light and the five ayahs of the first revelation, with no people depicted',
 caps:[[0,'The first revelation came in the cave of Ḥirāʾ on Jabal al-Nūr, outside Makkah.','Ḥirāʾ · Jabal al-Nūr'],[4,'Read all five ayahs of the first revelation: Al-ʿAlaq 96:1–5.','The first revelation · 96:1–5'],[54,'The glow is a symbolic teaching effect. The mountain scene is an illustration inspired by the real landscape.','Symbolic light · illustrated setting']],
 bg:()=>'<image href="assets/scenes/hira-mountain.webp" width="600" height="400" y="-8" preserveAspectRatio="none"/>',
 build(g,c){
  const P=c.story?[.579*600,.285*400-8]:c.pic(.579,.285),glow=mk(g,lightSvg()),sp=[...Array(6)].map(()=>mk(g,SPARK));
  g.classList.add('hira-cave-light');g.dataset.caveX=P[0];g.dataset.caveY=P[1];
  return t=>{
   const k=c.story?.9:Math.min(c.W,c.H)/620,bright=.82+.10*Math.sin(t*.8);
   g.setAttribute('opacity','1');
   put(glow.el,[P[0],P[1]+15*k*.6],k*(.6+.04*Math.sin(t)));show(glow,bright);
   sp.forEach((s,i)=>{const a=t*.25+i*Math.PI/3,r=(24+3*Math.sin(t+i))*k;put(s.el,[P[0]+Math.cos(a)*r,P[1]+Math.sin(a)*r*.6],k*.4);show(s,.35+.2*Math.sin(t+i))});
   return c.story?sayIn(t,HIRA_AYAHS.map((q,i)=>[4+i*10,14+i*10,q,[P[0],P[1]-22*k]])):null;
  };
 }
};

/* ---------- Abyssinia: the just king (Map 13) ---------- */
const NAJASHI={
 re:/^the just king$/i,story:/^(gifts from makkah|the just king)$/i,cycle:27,still:16,
 label:'Animated scene: the Muslims before the Najāshī, king of Abyssinia; Jaʿfar speaks, the king protects them and the gifts are sent back',
 caps:[[0,'Quraysh send two men with valuable gifts to the Najāshī: “Send these Muslims back to us!”','Gifts from Makkah'],[6,'The king calls the Muslims to speak for themselves. Jaʿfar ibn Abī Ṭālib speaks for them.','Jaʿfar speaks'],[12.4,'Jaʿfar recites from Sūrat Maryam. The king weeps until his beard is wet.','The king weeps at Sūrat Maryam'],[15,'The king protects them, and the gifts are sent back.','“You are safe in my land”']],
 bg:()=>plainBg('#9fcbe0','#e6efd0','#cfe0a8','#8fae6a','#b9c98a'),
 build(g,c){
  const T=c.story?[520,216]:c.side(.9,-26),king=mk(g,KING,{h:56}),guards=[0,1].map(i=>mk(g,warriorSvg({side:'m',i:i+2,weapon:'spear'}))),tears=[0,1,2].map(()=>mk(g,TEAR));
  const E=[0,1].map(i=>mk(g,workerSvg({i:i+2,tunic:['#8a2f28','#5a2c3a'][i],tool:'gift'}),{ph:i}));
  const M=[...Array(8)].map((_,i)=>mk(g,workerSvg({i,woman:i%3===2}),{ph:i*.8}));
  return t=>{
   g.setAttribute('opacity',fadeIO(t,24.5));
   const kk=c.k(T[1],56);place(king,T,kk*1.1,-1);
   guards.forEach((m,i)=>{const p=[T[0]+(i?28:-28)*kk,T[1]+(i?2:-2)*kk];place(m,p,c.k(p[1],m.h),-1)});
   tears.forEach((m,i)=>{const ph=(t*1.2+i/3)%1,on=t>=12.6&&t<15.4;put(m.el,[T[0]-3*kk,T[1]-(38-14*ph)*kk*1.1],kk*1.1);show(m,on?1-ph:0)});
   E.forEach((m,i)=>{const stand=c.story?[T[0]-(56+i*26),T[1]]:c.side(.8-i*.04,i?-14:14),away=c.side(.18,i?-12:12),w=ease(seg(t,18.6,23.5)),p=mix(stand,away,w);
    place(m,p,c.k(p[1],m.h),t<18.6?1:-1);stride(m,t,w>0&&w<1)});
   M.forEach((m,i)=>{const row=Math.floor(i/2),to=c.story?[T[0]-120-row*30-(i%2)*12,T[1]]:c.side(.66-row*.045,(i%2?-1:1)*(10+row*3)),from=c.side(-.02,(i%2?-1:1)*8),w=ease(seg(t,1+i*.35,7+i*.35)),p=mix(from,to,w);
    place(m,p,c.k(p[1],m.h),1);show(m,t>1+i*.35?1:0);stride(m,t,w>0&&w<1)});
   depthSort(g,[king,...guards,...E,...M],tears);
   const j0=c.story?[T[0]-120,T[1]]:c.side(.66,10),kj=c.k(j0[1],56);
   return sayIn(t,[[8,12.4,Q.jafar,headOf(M[0],j0,kj)],[15.2,18.6,Q.najashi,[T[0],T[1]-62*kk*1.1]]]);
  };
 }
};

/* ---------- Building the masjid in Madīnah (Map 23) ---------- */
const MASJID={
 re:/^the masjid and the bond$/i,story:/^the masjid and the bond$/i,cycle:24,still:11,
 label:'Animated scene: the Muhājirūn and Anṣār carry mud bricks together and build the masjid in Madīnah',
 caps:[[0,'In Madīnah, the first thing the Prophet ﷺ built was a masjid, on land bought from two orphan boys.','Building the masjid'],[4.5,'Everyone helped. Muhājirūn and Anṣār carried mud bricks together, and the Prophet ﷺ carried bricks with them.','Everyone carries bricks'],[13.5,'Palm trunks became the pillars and palm leaves the roof. The masjid became the heart of Madīnah.','Palm-trunk pillars, a palm-leaf roof']],
 bg:()=>plainBg('#a9d3ee','#f0e4c8','#ead3a2','#b99a6a','#e2c896'),
 build(g,c){
  const S=c.story?[440,216]:c.side(.7,30),B=c.story?[110,216]:c.side(.32,-28),pile=mk(g,PILE),wall=mk(g,''),glow=mk(g,lightSvg());
  const C=[...Array(7)].map((_,i)=>mk(g,workerSvg({i:i+1,tool:'brick'}),{ph:i*.53}));
  return t=>{
   g.setAttribute('opacity',fadeIO(t,21.5));
   const ks=c.k(S[1],56),hgt=4+18*seg(t,2,14),pil=seg(t,12.5,14),roof=seg(t,14,15.6);
   wall.el.innerHTML=`<rect x="-62" y="${-hgt}" width="124" height="${hgt}" fill="#b98656" stroke="#7a5230" stroke-width="1"/>${[...Array(Math.floor(hgt/5))].map((_,r)=>`<path d="M-62 ${-5*(r+1)} H62" stroke="#7a5230" stroke-width=".6"/>`).join('')}${pil?[-48,-16,16,48].map(x=>`<rect x="${x-3}" y="${-24-26*pil}" width="6" height="${26*pil}" fill="#7a5a36"/>`).join(''):''}${roof?`<path d="M-66 ${-50+2*(1-roof)} Q0 ${-58} 66 ${-50} L66 -45 L-66 -45Z" fill="#6f8e45" opacity="${f3(roof)}"/><path d="M-60-50 l8 6 M-40-52 l7 7 M-20-53 l7 7 M0-53 l7 7 M20-52 l7 7 M40-51 l7 6" stroke="#9fbf6a" stroke-width="1.6" opacity="${f3(roof)}"/>`:''}`;
   put(wall.el,S,ks);put(pile.el,B,c.k(B[1],56));
   C.forEach((m,i)=>{const u=pingpong(t*.22+m.ph),going=Math.floor((((t*.22+m.ph)%2)+2)%2)===0,lat=(i%2?-1:1)*(6+i*3),a=c.story?[B[0]+30,B[1]]:c.side(.34,lat),b=c.story?[S[0]-80,S[1]]:c.side(.66,lat),p=mix(a,b,ease(u));
    place(m,p,c.k(p[1],m.h),(going?1:-1)*(b[0]>=a[0]?1:-1));stride(m,t,true,7);const ld=m.el.querySelector('.lwX-load');if(ld)ld.setAttribute('opacity',going?'1':'0')});
   const lp=[S[0]-70*ks,S[1]-34*ks+Math.sin(t*1.4)*3*ks];put(glow.el,lp,ks*.62);show(glow,.8+.2*Math.sin(t*2.1));
   depthSort(g,[pile,wall,...C],[glow]);
   return sayIn(t,[[7.5,12.5,Q.masjid,[lp[0],lp[1]-26*ks]]]);
  };
 }
};

/* Picture coordinates keep both armies on their own bank when the map resizes. */
function buildPaintedTrench(g,c){
 const diggers=Array.from({length:6},(_,i)=>mk(g,workerSvg({i,tool:'pick'}),{ph:i*.8}));
 const carriers=Array.from({length:3},(_,i)=>mk(g,workerSvg({i:i+6,tool:'basket'}),{ph:i*.7}));
 const enemy=army(g,['spear','h',{w:'flag',flag:'#a3272b'},'sword','h','spear'],'q');
 const tents=[0,1,2].map(i=>mk(g,tentSvg(['#c9b28a','#a8875a','#d9c39a'][i])));
 const gust=mk(g,WIND),heap=mk(g,EARTH);
 // The image's long trench runs just above v=.33. People stay on either bank.
 const scale=()=>Math.max(.25,Math.min(c.W*.052,c.H*.042)/56);
 return t=>{
  g.setAttribute('opacity',fadeIO(t,25.5));const k=scale(),dig=t>=2&&t<12.6;
  diggers.forEach((m,i)=>{const p=c.pic(.37+i*.075,.348);place(m,p,k,i%2?1:-1);swing(m,dig?Math.sin(t*5+m.ph)*40-12:0);stride(m,t,false)});
  const hp=c.pic(.57,.39);place(heap,hp,k*(.4+.6*seg(t,3,12)));
  carriers.forEach((m,i)=>{const u=pingpong(t*.25+m.ph),p=mix(c.pic(.46+i*.07,.35),hp,ease(u));place(m,p,k,Math.floor((((t*.25+m.ph)%2)+2)%2)===0?1:-1);stride(m,t,t<13);show(m,t<18)});
  const arrive=ease(seg(t,13,16.5)),leave=ease(seg(t,20,25));
  enemy.forEach((m,i)=>{const stop=c.pic(.35+i*.075,.247-(i%2)*.018),from=c.pic(.89+i*.014,.18),p=leave>0?mix(stop,from,leave):mix(from,stop,arrive);place(m,p,k*.8,leave>0?1:-1);stride(m,t,(arrive>0&&arrive<1)||(leave>0&&leave<1));show(m,t>13?(leave>.8?1-(leave-.8)*5:1):0)});
  tents.forEach((m,i)=>{const at=c.pic(.43+i*.12,.211),blow=ease(seg(t,18.8+i*.2,21.5+i*.2)),p=[at[0]+blow*c.W*.25,at[1]-blow*30*k];place(m,p,k*.9);m.el.setAttribute('transform',m.el.getAttribute('transform')+` rotate(${f1(blow*70)})`);show(m,t>15?1-blow:0)});
  const windAt=c.pic(.25+((t*.17)% .65),.25);put(gust.el,windAt,k*1.7);show(gust,t>18.5&&t<23?.8:0);
  depthSort(g,[heap,...diggers,...carriers,...enemy,...tents],[gust]);
  return sayIn(t,[[4.6,8.4,Q.trench1,c.pic(.57,.29)],[8.6,12.6,Q.trench2,c.pic(.57,.29)]]);
 };
}

/* ---------- The Trench (Map 32) ---------- */
const TRENCH={
 re:/^the trench$/i,story:/^(the trench|the wind that ended the siege)$/i,cycle:28,still:10,
 label:'Animated scene: the believers dig the trench and sing, the army cannot cross, and a wind sends it home',
 caps:[[0,'Year 5: an army of 10,000 is coming to Madīnah. Salmān al-Fārisī suggests digging a trench.','Salmān’s idea: a trench'],[4,'Everyone digs, cold and hungry — and they sing as they work.','Everyone digs and sings'],[13,'The enemy army arrives, and the trench stops it.','The trench stops the army'],[18.5,'After weeks, Allah sends a cold, strong wind. Their tents and fires blow away, and they go home.','A wind from Allah ends the siege']],
 bg:()=>plainBg('#b8c8d6','#ece2cc','#e8d2a2','#b48e64','#dcc08e'),
 build(g,c){
  if(!c.story&&c.asset==='trench')return buildPaintedTrench(g,c);
  const f0=c.story?.5:.55,T0=c.at(f0),band=mk(g,''),heap=mk(g,EARTH),glow=mk(g,lightSvg()),gust=mk(g,WIND);
  const D=[...Array(5)].map((_,i)=>mk(g,workerSvg({i,tool:'pick'}),{ph:i*1.3})),K=[...Array(3)].map((_,i)=>mk(g,workerSvg({i:i+5,tool:'basket'}),{ph:i*.6}));
  const E=army(g,['spear','h',{w:'flag',flag:'#a3272b'},'sword','h','spear'],'q'),tents=[0,1,2].map(i=>mk(g,tentSvg(['#c9b28a','#a8875a','#d9c39a'][i])));
  const dir=(()=>{const a=c.at(f0-.02),b=c.at(f0+.02),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return[dx/l,dy/l]})(),nrm=[-dir[1],dir[0]];
  return t=>{
   g.setAttribute('opacity',fadeIO(t,25.5));
   const k=c.k(T0[1],56),len=(c.story?230:170*k)*seg(t,2,11),wdt=(c.story?6:9*k);
   const P=(s,w)=>c.story?[T0[0]+s,T0[1]+w]:[T0[0]+nrm[0]*s+dir[0]*w*.5,T0[1]+nrm[1]*s*.28+Math.abs(dir[1])*w*.5];
   if(len>1){const q=c.story?[[T0[0]-len,T0[1]-wdt],[T0[0]+len,T0[1]-wdt],[T0[0]+len,T0[1]+wdt],[T0[0]-len,T0[1]+wdt]]:[P(-len,-wdt),P(len,-wdt),P(len,wdt),P(-len,wdt)];band.el.innerHTML=`<path d="M${q.map(p=>f1(p[0])+' '+f1(p[1])).join(' L')}Z" fill="#4a3624" stroke="#2c1f14" stroke-width="1.5"/>`}else band.el.innerHTML='';
   const hp=c.story?[T0[0]-150,T0[1]]:c.side(f0-.12,-34);place(heap,hp,c.k(hp[1],56)*(.4+.6*seg(t,3,12)));
   const keep=t<13,dig=t>=2&&t<12.6;
   D.forEach((m,i)=>{const s=(i-2)*(c.story?44:36*k),p=c.story?[T0[0]+s-6,T0[1]-wdt-1]:(()=>{const b=P(s,-wdt*2.2);return[b[0],b[1]]})();place(m,p,c.k(p[1],m.h),i%2?1:-1);swing(m,dig?Math.sin(t*5+m.ph)*40-12:0);stride(m,t,false)});
   K.forEach((m,i)=>{const u=pingpong(t*.25+m.ph),a=c.story?[T0[0]-40-i*16,T0[1]]:c.side(f0-.03,(i-1)*22),b=hp,p=mix(a,b,ease(u));place(m,p,c.k(p[1],m.h),(Math.floor((((t*.25+m.ph)%2)+2)%2)===0?1:-1)*(b[0]>=a[0]?1:-1));stride(m,t,keep);show(m,t<18?1:0)});
   const wind=seg(t,18.5,20),leave=ease(seg(t,20,25));
   E.forEach((m,i)=>{const row=Math.floor(i/2),stop=c.story?[T0[0]+60+row*44+(i%2)*18,T0[1]]:c.side(f0+.08+row*.05,(i%2?-1:1)*14),from=c.story?[640+i*30,T0[1]]:c.side(1.08,(i%2?-1:1)*10),arrive=ease(seg(t,13,16.5)),p=leave>0?mix(stop,from,leave):mix(from,stop,arrive);
    place(m,p,c.k(p[1],m.h,m.big),leave>0?1:-1);stride(m,t,(arrive>0&&arrive<1)||(leave>0&&leave<1),m.horse?10:8,m.horse?22:16);show(m,t>13?(leave>.8?1-(leave-.8)*5:1):0)});
   tents.forEach((m,i)=>{const at=c.story?[T0[0]+130+i*50,T0[1]-4]:c.side(f0+.2+i*.06,(i-1)*40),blow=ease(seg(t,18.8+i*.2,21.5+i*.2)),p=[at[0]+blow*(c.story?260:c.W*.25),at[1]-blow*30*k];place(m,p,c.k(at[1],30)*(1-.3*blow));m.el.setAttribute('transform',m.el.getAttribute('transform')+` rotate(${f1(blow*70)})`);show(m,t>15?1-blow:0)});
   const gp=c.story?[60,150]:[c.W*.15,T0[1]-60*k];put(gust.el,[gp[0]+((t*260)%(c.story?400:c.W*.7)),gp[1]],c.story?1:k*1.4);show(gust,wind>0&&t<23?.8:0);
   const lp=[T0[0]-nrm[0]*0-40*(c.story?1:k),T0[1]-(c.story?70:62*k)];put(glow.el,lp,(c.story?1:k)*.6);show(glow,t<18?.8+.2*Math.sin(t*2):0);
   depthSort(g,[heap,...D,...K,...E,...tents],[glow,gust]);
   const d0=D[0].y!=null?[D[0].x,D[0].y]:T0;
   return sayIn(t,[[4.6,8.4,Q.trench1,[lp[0],lp[1]-20*(c.story?1:k)]],[8.6,12.6,Q.trench2,[d0[0],d0[1]-62*k]]]);
  };
 }
};

/* ---------- The Farewell Pilgrimage (Map 45) ---------- */
const FAREWELL={
 re:/^the farewell pilgrimage$/i,story:/^the farewell pilgrimage$/i,cycle:27,still:13.5,
 label:'Animated scene: the pilgrims at ʿArafah answer the Prophet ﷺ, who is shown only as a light above his camel',
 caps:[[0,'Year 10: more than 100,000 Muslims come to Ḥajj with the Prophet ﷺ.','100,000 pilgrims at Ḥajj'],[6,'At ʿArafah he speaks to them from his camel, al-Qaṣwāʾ.','The sermon at ʿArafah'],[19.5,'That day Allah revealed: “Today I have perfected your religion for you.”','“Today I have perfected your religion”']],
 bg:()=>plainBg('#f3c58c','#fbe6c0','#f0d6a2','#c79a62','#e6c890',`<path d="M380 216 Q430 150 480 150 Q530 150 560 216Z" fill="#b38a5a"/>`),
 build(g,c){
  const A=c.story?[470,216]:c.side(.86,-20),cam=mk(g,camel({saddle:'#9b2f2a'}),{h:60,big:1.1,camel:1}),glow=mk(g,lightSvg());
  const Pg=[...Array(16)].map((_,i)=>mk(g,pilgrimSvg(i),{ph:i*.7}));
  return t=>{
   g.setAttribute('opacity',fadeIO(t,24.5));
   const ka=c.k(A[1],60,1.1);place(cam,A,ka,-1);stride(cam,t,false);
   const lp=[A[0],A[1]-80*ka];put(glow.el,lp,ka*.7);show(glow,.85+.15*Math.sin(t*2));
   Pg.forEach((m,i)=>{const row=Math.floor(i/4),col=i%4,to=c.story?[A[0]-90-row*42-col*9,A[1]-(col%2)*5]:c.side(.74-row*.05,(col-1.5)*16),from=c.side(-.02,(col-1.5)*8),w=ease(seg(t,i*.25,5+i*.25)),p=mix(from,to,w);
    place(m,p,c.k(p[1],m.h),to[0]>=from[0]?1:-1);stride(m,t,w>0&&w<1);show(m,t>i*.25?1:0);swing(m,t>=12&&t<16?-60-Math.sin(t*4+i)*20:0)});
   depthSort(g,[cam,...Pg],[glow]);
   const cr=c.story?[A[0]-150,A[1]]:c.side(.66,0),kc=c.k(cr[1],56);
   return sayIn(t,[[8,11.8,Q.ask,[lp[0],lp[1]-24*ka]],[12,15.8,Q.witness,[cr[0],cr[1]-62*kc]],[16,19.2,Q.ishhad,[lp[0],lp[1]-24*ka]],[19.6,24,Q.akmaltu,[lp[0],lp[1]-24*ka]]]);
  };
 }
};

/* ---------- register: one engine for the map road and for the story picture ---------- */
function mapCaption(){const frame=document.getElementById('mapSvg')?.closest('.map-frame');if(!frame)return null;let el=frame.querySelector('.lw-scene-cap');if(!el){el=document.createElement('div');el.className='lw-scene-cap';el.setAttribute('aria-hidden','true');frame.appendChild(el)}
 /* sit at the bottom corner away from the entry door (and above the arrow buttons on phones) */
 const G=typeof MAP_GEO!=='undefined'&&MAP_GEO,fw=frame.clientWidth||innerWidth,doorX=G&&G.entry?G.entry[0]*fw/G.W:0,tall=frame.classList.contains('tall');
 Object.assign(el.style,doorX>fw/2?{left:'12px',right:'auto',bottom:'calc(14px + env(safe-area-inset-bottom,0px))',transform:'none'}:{left:'auto',right:'12px',bottom:tall?'calc(70px + env(safe-area-inset-bottom,0px))':'calc(14px + env(safe-area-inset-bottom,0px))',transform:'none'});
 return el}
function theatre(g,ctx,sc,capEl){
 const play=sc.build(g,ctx);let last=-1,say=null,heardNow=null;const heard=new Set();
 /* a scene's play(t) may return {say:[quote,x,y]} (picture coordinates): a speech bubble over the picture */
 function bubble(r){const svg=g.ownerSVGElement;if(!svg||!SL.sayBox)return;
  if(!say){const host=ctx.story?svg.closest('.lw-theatre'):svg.closest('.map-frame');if(!host)return;say=SL.sayBox(host,ctx.story?48:64)}
  if(!r||!r.say){say.set(null);return}
  const [q,x,y]=r.say,rc=svg.getBoundingClientRect(),hr=say.el.parentNode.getBoundingClientRect(),vb=svg.viewBox&&svg.viewBox.baseVal,k=rc.width/((vb&&vb.width)||ctx.W);say.set(q,rc.left-hr.left+x*k,rc.top-hr.top+y*k)}
 const visible=ctx.story?()=>!document.hidden&&!!g.ownerSVGElement&&g.ownerSVGElement.getBoundingClientRect().width>0:mapShowing;
 /* a Qurʾān bubble is recited (Mishary al-ʿAfasy, seeraa-quran.js) the first time it appears */
 function recite(r){const q=r&&r.say&&r.say[0];if(q===heardNow)return;heardNow=q;if(q&&q.k==='quran'&&!heard.has(q)&&window.SeeraaQuran&&SeeraaQuran.auto(q,visible))heard.add(q)}
 return{svg:g,cycle:sc.cycle,still:sc.still,start:performance.now(),visible,
  tick(t){const r=play(t);if(r||say)bubble(r);recite(r);if(capEl){let n=0;sc.caps.forEach((x,i)=>{if(t>=x[0])n=i});if(n!==last){last=n;capEl.textContent=sc.caps[n][ctx.story?1:2]}}}};
}
[MADINAH,BADR,UHUD,HUDAYBIYYAH,FATH,ZAMZAM,BLACKSTONE,HIRA,NAJASHI,MASJID,TRENCH,FAREWELL].forEach(sc=>SCENES.push({re:sc.re,story:sc.story,label:sc.label,
 road:(g,L,P)=>{const th=theatre(g,mapCtx(L,P),sc,mapCaption());if(sc.nasheed)mapNasheed();return th},
 make:(svg,full,cap)=>{svg.innerHTML=sc.bg();const g=document.createElementNS(NS,'g');svg.appendChild(g);const th=theatre(g,storyCtx(),sc,cap);
  const fig=svg.parentNode;if(sc.nasheed&&fig&&!fig.querySelector('.lw-nasheed-btn')){const box=document.createElement('div');box.className='lw-lyrics inline';box.setAttribute('aria-live','polite');fig.appendChild(box);nasheedButton(fig,box)}
  if(reduced()){th.tick(sc.still);th.pausedT=sc.still}LW.theatres.add(th);run();return th}}));
window.SeeraaNasheed=Nasheed;

document.head.insertAdjacentHTML('beforeend',`<style id="lwx-style">
.lw-scene-cap{position:absolute;left:50%;bottom:calc(12px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:5;width:max-content;max-width:min(400px,calc(50% - 24px));box-sizing:border-box;padding:6px 12px;border-radius:12px;background:rgba(255,249,232,.94);border:1px solid #e3c995;color:#4d3928;font:800 12.5px/1.35 Nunito,system-ui,sans-serif;text-align:center;box-shadow:0 2px 10px #38271630;pointer-events:none}
.lw-scene-cap:empty{display:none}
.lw-nasheed-btn{position:absolute;z-index:6;left:12px;top:118px;border:1px solid #d9b56a;background:linear-gradient(180deg,#fff8e6,#f6e2b4);color:#5a3d17;border-radius:999px;padding:7px 13px;font:800 13px/1 Nunito,system-ui,sans-serif;box-shadow:0 2px 8px #38271630;cursor:pointer}
.lw-nasheed-btn[aria-pressed="true"]{background:linear-gradient(180deg,#e9f6e5,#cdeec7);border-color:#9cc98f}
.lw-lyrics{position:absolute;z-index:5;left:50%;bottom:calc(64px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(460px,calc(100% - 24px));box-sizing:border-box;padding:10px 14px;border-radius:16px;background:rgba(36,28,20,.78);color:#fff8e6;text-align:center;display:none;flex-direction:column;gap:2px;pointer-events:none;box-shadow:0 4px 18px #0006}
.lw-lyrics.on{display:flex}
.lw-ly-ar{font:700 26px/1.5 Amiri,'Noto Naskh Arabic','Geeza Pro',serif;color:#ffe9a8}
.lw-ly-tr{font:800 14px/1.35 Nunito,system-ui,sans-serif}
.lw-ly-en{font:600 13px/1.35 Nunito,system-ui,sans-serif;opacity:.85}
.lw-theatre .lw-nasheed-btn{position:absolute;top:12px;left:12px}
.lw-theatre .lw-lyrics.inline{position:static;transform:none;width:auto;margin:0 12px 12px;background:#3a2d20;border-radius:12px}
.lwX-cloth{transform-box:fill-box;transform-origin:0 50%;animation:lwxFlag 1.1s ease-in-out infinite alternate}
@keyframes lwxFlag{from{transform:skewY(-7deg)}to{transform:skewY(6deg) scaleX(.9)}}
@media(prefers-reduced-motion:reduce){.lwX-cloth{animation:none}}
</style>`);
SL.repaint();
})();
