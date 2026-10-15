/* Qurʾān recitation for Seeraa Quest.
   Every ayah quoted in the course is recited by Mishary Rashid al-ʿAfasy, from the
   Quran.com API (recitation 7): the Learn page verse, the Qurʾān quotes in the stories,
   the Qurʾān & Hadith cards, the du‘ās, the five ayahs of the cave of Ḥirāʾ and the
   Qurʾān speech bubbles in the scenes.
     GET /recitations/7/by_ayah/{s:a}   the ayah's audio file
   Every ayah of the reference is recited whole, even when the course quotes only some of
   its words: "Sūrat al-Anfāl 8:9–10" plays all of ayah 9, then all of ayah 10. A quotation
   that is only part of its ayah says so ("Part of the āyah"), and its button says the whole
   ayah will be recited; the English under each Qurʾān quotation is labelled "Simple meaning". */
(function(){
'use strict';
const API='https://api.quran.com/api/v4',AUDIO='https://verses.quran.com/',RECITER=7,CACHE='seeraa-quran-v1:';
const LABEL='Listen · Mishary al-ʿAfasy',WHOLE='Listen to the whole āyah · Mishary al-ʿAfasy';
const le=(v,n)=>String.fromCharCode(...Array.from({length:n},(_,i)=>v>>8*i&255));
/* 50 ms of silence: playing it inside a tap lets the same <audio> play the recitation once it has loaded (iPhone) */
const SILENT='data:audio/wav;base64,'+btoa('RIFF'+le(436,4)+'WAVEfmt '+le(16,4)+le(1,2)+le(1,2)+le(8000,4)+le(8000,4)+le(1,2)+le(8,2)+'data'+le(400,4)+'\x80'.repeat(400));

/* "Sūrat al-Fīl 105:1–2", "96:1-5", "Qur’an · 20:114" → ['105:1','105:2'] */
function parseRef(s){const m=String(s||'').match(/(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[–—-]\s*(\d{1,3}))?/);if(!m)return null;
 const c=+m[1],a=+m[2],b=m[3]?+m[3]:a;if(c<1||c>114||a<1||b<a||b-a>20)return null;
 return Array.from({length:b-a+1},(_,i)=>c+':'+(a+i))}
/* each quoted ayah's length in letters (Tanzil text without vowel marks, and without the basmala
   before an ayah 1), so a quotation much shorter than its ayahs is known to be part of them */
const LETTERS={"2:8":38,"2:43":29,"2:125":90,"2:127":51,"2:129":69,"2:144":124,"2:153":38,"2:154":41,"2:155":54,"2:156":32,"2:158":72,"2:183":51,"2:185":158,"2:190":48,"2:201":46,"2:207":38,"2:216":82,"2:217":207,"2:238":35,"2:249":204,"2:250":60,"2:256":85,"2:261":84,"2:273":106,"2:285":98,"3:13":98,"3:59":42,"3:64":98,"3:67":47,"3:97":79,"3:103":131,"3:121":43,"3:122":48,"3:123":41,"3:132":25,"3:139":33,"3:144":91,"3:146":71,"3:159":104,"3:167":125,"3:169":44,"3:170":69,"3:173":59,"3:191":80,"3:200":42,"4:1":95,"4:29":74,"4:36":121,"4:58":75,"4:59":103,"4:100":104,"4:102":237,"4:171":170,"5:1":76,"5:2":184,"5:3":238,"5:6":230,"5:8":92,"5:11":87,"5:67":75,"5:83":70,"5:90":63,"5:91":76,"7:31":53,"7:157":187,"7:199":26,"8:9":45,"8:10":56,"8:11":85,"8:12":82,"8:17":76,"8:30":65,"8:38":51,"8:58":42,"8:61":42,"8:63":65,"8:70":80,"9:3":112,"9:7":88,"9:13":75,"9:25":87,"9:40":146,"9:41":58,"9:51":46,"9:60":97,"9:71":114,"9:91":88,"9:92":72,"9:100":101,"9:102":61,"9:107":94,"9:108":73,"9:111":147,"9:118":100,"9:119":29,"11:112":38,"11:114":55,"12:18":62,"12:64":53,"12:87":63,"12:92":39,"14:35":41,"14:40":33,"16:43":46,"16:90":65,"16:91":72,"16:125":79,"17:1":75,"17:23":80,"17:24":41,"17:34":55,"17:81":26,"17:88":62,"20:1":2,"20:2":18,"20:7":25,"20:14":30,"20:114":55,"21:107":19,"22:39":39,"22:40":124,"24:12":48,"24:15":63,"24:22":100,"24:51":67,"25:70":54,"25:74":50,"26:88":16,"26:89":16,"26:214":16,"28:26":34,"28:85":54,"29:65":51,"29:69":39,"30:21":70,"31:14":62,"31:15":93,"33:6":113,"33:9":77,"33:10":61,"33:11":29,"33:21":55,"33:22":64,"33:23":65,"33:26":66,"34:28":41,"36:9":44,"39:18":55,"39:33":28,"39:53":69,"40:60":55,"41:1":2,"41:2":17,"41:3":27,"41:34":59,"41:37":72,"42:38":52,"46:29":65,"47:7":35,"48:1":14,"48:18":74,"48:27":101,"48:28":53,"49:6":60,"49:10":43,"49:11":124,"49:13":72,"53:14":13,"53:15":11,"53:16":15,"54:1":17,"54:2":26,"54:45":19,"55:1":5,"55:2":7,"55:3":7,"55:60":13,"59:2":153,"59:9":114,"60:1":177,"61:2":26,"61:4":39,"61:6":104,"63:8":78,"65:2":113,"65:3":64,"68:4":14,"72:1":36,"72:2":28,"74:1":8,"74:2":6,"74:3":8,"74:4":9,"74:5":9,"76:8":31,"89:27":15,"89:28":18,"93:6":13,"93:9":13,"94:5":11,"94:6":10,"96:1":14,"96:2":12,"96:3":10,"96:4":11,"96:5":14,"98:5":61,"105:1":21,"105:2":18,"105:3":16,"105:4":17,"105:5":14,"106:3":15,"106:4":23,"112:1":9};
const skel=s=>String(s).replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'').replace(/[\u0621\u0623\u0625\u0622\u0671\u0627]/g,'').replace(/\u0624/g,'\u0648').replace(/[\u0626\u0649\u06CC]/g,'\u064A').replace(/\u0629/g,'\u0647').replace(/[^\u0621-\u064A]/g,'');
function isPart(ref,ar){const keys=parseRef(ref);if(!keys||!ar)return false;if(/…|\.\.\./.test(ar))return true;
 let total=0;for(const k of keys){if(!LETTERS[k])return false;total+=LETTERS[k]}return skel(ar).length<total*.9}
const isQuranRef=s=>/^\s*(s[uū]ra|qur)/i.test(s)||/^\s*\d{1,3}\s*:\s*\d{1,3}/.test(s);

function getJSON(url){const ctl=typeof AbortController==='function'?new AbortController():null,tm=setTimeout(()=>ctl&&ctl.abort(),9000);
 return fetch(url,ctl?{signal:ctl.signal}:{}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).finally(()=>clearTimeout(tm))}
const memo=new Map();
/* one ayah's audio file {url}, kept on the device after the first time */
function verse(key){
 if(memo.has(key))return memo.get(key);
 let saved=null;try{saved=JSON.parse(localStorage.getItem(CACHE+key)||'null')}catch(e){}
 const p=saved&&saved.url?Promise.resolve({url:saved.url}):getJSON(`${API}/recitations/${RECITER}/by_ayah/${key}`).then(a=>{
  const files=a&&a.audio_files||[],f=files.find(x=>x.verse_key===key)||files[0];if(!f||!f.url)throw new Error('no recitation for '+key);
  const d={url:/^https?:/.test(f.url)?f.url:/^\/\//.test(f.url)?'https:'+f.url:AUDIO+f.url.replace(/^\/+/,'')};
  try{localStorage.setItem(CACHE+key,JSON.stringify(d))}catch(e){}
  return d});
 memo.set(key,p);p.catch(()=>memo.delete(key));return p}
/* without the API, the same recitation's file for the ayah */
function fileOnly(key){const [c,a]=key.split(':').map(Number);return{url:`${AUDIO}Alafasy/mp3/${String(c).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`}}

/* what to play: every ayah of the reference, each one whole */
function plan(keys){return Promise.all(keys.map(key=>verse(key).catch(()=>fileOnly(key)).then(d=>({key,url:d.url}))))}

/* ---------- the player ---------- */
let player=null,job=null,primed=false,tapped=false;
const audio=()=>player||(player=Object.assign(new Audio(),{preload:'auto'}));
function prime(){const a=audio();try{a.src=SILENT;const p=a.play();if(p&&p.then)p.then(()=>{primed=true;if(a.src===SILENT)a.pause()},()=>{})}catch(e){}}
['pointerdown','keydown','touchend'].forEach(e=>addEventListener(e,()=>{tapped=true;if(!primed&&!job)prime()},{capture:true,passive:true}));
const soundIsOn=()=>typeof soundOn==='undefined'||!!soundOn;

/* (no "recitation" in visible text: seeraa-activities.js rewords it for the old Tajweed screens) */
const STATES={idle:['▶',null],loading:['…','Loading…'],playing:['■','Stop'],error:['!','Could not play — check the internet'],muted:['🔇','Sound is off — turn it on from the map']};
function show(b,s){if(!b)return;b.dataset.state=s;const [ic,tx]=STATES[s];b.querySelector('.sq-ic').textContent=ic;b.querySelector('.sq-tx').textContent=tx||b.dataset.label;
 clearTimeout(b._sqT);if(s==='error'||s==='muted')b._sqT=setTimeout(()=>{if(b.dataset.state===s)show(b,'idle')},3500)}
function mark(key){document.querySelectorAll('.sq-now').forEach(e=>e.classList.remove('sq-now'));if(key)document.querySelectorAll(`[data-sq-key="${key}"]`).forEach(e=>e.classList.add('sq-now'))}
function stop(){const j=job;job=null;if(player)try{player.pause()}catch(e){}if(j){show(j.btn,'idle');mark(null)}}
function clip(p,j){return new Promise((res,rej)=>{const a=audio();let t=0,over=false;
 const end=e=>{if(over)return;over=true;clearInterval(t);a.onended=a.onerror=a.onplaying=null;e?rej(e):res()};
 a.onerror=()=>end(new Error('audio '+p.url));a.onended=()=>end();a.onplaying=()=>{if(job===j)show(j.btn,'playing')};
 t=setInterval(()=>{if(job!==j)return end();if(!j.alive()){stop();end()}},100);
 a.src=p.url;const pr=a.play();if(pr&&pr.catch)pr.catch(err=>end(err))})}
/* recite ayahs, each one whole (a reference or a list of 's:a' keys) */
async function play(ref,o={}){
 const keys=Array.isArray(ref)?ref:parseRef(ref);if(!keys)return false;
 if(typeof stopVoicePlayback==='function')stopVoicePlayback();else{stop();if('speechSynthesis'in window)speechSynthesis.cancel()}
 if(window.SeeraaNasheed&&SeeraaNasheed.playing)SeeraaNasheed.stop();
 const j={btn:o.btn||null,auto:!!o.auto,alive:o.alive||(()=>!o.btn||o.btn.isConnected)};job=j;show(j.btn,'loading');
 try{const parts=await plan(keys);
  for(const p of parts){if(job!==j)return false;mark(p.key);await clip(p,j)}
 }catch(e){if(job===j){job=null;mark(null);show(j.btn,'error');console.warn('Qurʾān recitation',e)}return false}
 if(job===j){job=null;mark(null);show(j.btn,'idle')}return true}
/* a Qurʾān speech bubble in a scene: recite it if nothing else is playing */
function auto(q,alive){
 if(!q||q.k!=='quran'||!tapped||!soundIsOn()||(job&&!job.auto))return false;
 if(typeof activeMediaAudio!=='undefined'&&activeMediaAudio)return false;
 if(('speechSynthesis'in window&&speechSynthesis.speaking)||(window.SeeraaNasheed&&SeeraaNasheed.playing))return false;
 const keys=parseRef(q.key||q.who);if(!keys)return false;
 play(keys,{alive,auto:true});return true}

/* ---------- the buttons ---------- */
function button(ref,o={}){const b=document.createElement('button');b.type='button';b.className='sq-recite'+(o.small?' small':'');
 b.dataset.quranRef=ref;b.dataset.label=o.text||(o.part?WHOLE:LABEL);b.title='Recited by Mishary Rashid al-ʿAfasy · audio from Quran.com';
 b.setAttribute('aria-label',`Listen to ${o.part?'the whole of ':''}${ref}, recited by Mishary al-ʿAfasy`);b.innerHTML='<span class="sq-ic" aria-hidden="true">▶</span><span class="sq-tx"></span>';show(b,'idle');return b}
const row=(b,part)=>{const d=document.createElement('span');d.className='sq-recite-row';d.append(b);if(part)d.append(chip());return d};
const chip=()=>{const c=document.createElement('span');c.className='sq-part';c.textContent='Part of the āyah';c.title='Only part of the āyah is written here. The button recites the whole āyah.';return c};
const text=(el,sel)=>{const x=el.querySelector(sel);return x?x.textContent.trim():''};
const refIn=s=>(String(s).match(/\d{1,3}\s*:\s*\d{1,3}(?:\s*[–—-]\s*\d{1,3})?/)||[''])[0];
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.sq-recite');if(!b)return;e.preventDefault();
 if(job&&job.btn===b){stop();return}
 if(!soundIsOn()){show(b,'muted');return}
 prime();play(b.dataset.quranRef,{btn:b})});

const SEL='.lw-verse.quran,.lw-q,.se-evidence,.seeraa-dua-ar,.hira-ayahs';
function decorate(root){
 /* the Learn page: Mishary instead of the phone's voice */
 root.querySelectorAll('.lw-verse.quran:not([data-sq])').forEach(f=>{f.dataset.sq=1;const ref=text(f,'.lw-verse-ref');if(!parseRef(ref))return;
  const old=f.querySelector('#lwSayAr');if(old)old.hidden=true;const part=isPart(ref,text(f,'.lw-verse-ar')),b=button(ref,{part});
  f.classList.add('sq-quran');(f.querySelector('.lw-verse-say')||f).prepend(b);if(part)b.after(chip())});
 /* the story: each Qurʾān quote (hadith quotes keep their reference only) */
 root.querySelectorAll('.lw-q:not([data-sq])').forEach(q=>{q.dataset.sq=1;const ref=text(q,'.lw-q-ref');if(isQuranRef(ref)&&parseRef(ref)){const part=isPart(ref,text(q,'.lw-q-ar'));q.classList.add('sq-quran');q.append(row(button(ref,{part}),part))}});
 /* the Qurʾān & Hadith cards */
 root.querySelectorAll('.se-evidence:not([data-sq])').forEach(c=>{c.dataset.sq=1;const h=text(c,'.se-evidence-heading'),ref=refIn(h),ar=c.querySelector('.se-arabic');if(/^\s*qur/i.test(h)&&ref&&ar){const part=isPart(ref,ar.textContent);ar.after(row(button(ref,{part}),part&&!/excerpt/i.test(h)))}});
 /* the du‘ā step */
 root.querySelectorAll('.seeraa-dua-ar:not([data-sq])').forEach(p=>{p.dataset.sq=1;const card=p.closest('.matn-card')||p.parentNode,a=card.querySelector('a'),ref=refIn(a?a.textContent:'');if(ref){const part=isPart(ref,p.textContent);p.after(row(button(ref,{part}),part))}});
 /* the five ayahs of the cave of Ḥirāʾ: all five, or one at a time */
 root.querySelectorAll('.hira-ayahs:not([data-sq])').forEach(ol=>{ol.dataset.sq=1;const keys=[];
  ol.querySelectorAll('li').forEach(li=>{const n=li.querySelector('.hira-ayah-number'),key=refIn(n?n.textContent:'');if(!key)return;keys.push(key.replace(/\s/g,''));li.dataset.sqKey=key.replace(/\s/g,'');n.after(button(key,{small:true,text:'Listen'}))});
  if(keys.length>1){const [c,a]=keys[0].split(':'),z=keys[keys.length-1].split(':')[1];ol.before(row(button(`${c}:${a}-${z}`,{text:`Recite all ${keys.length} ayahs · Mishary al-ʿAfasy`})))}});
}
new MutationObserver(recs=>{for(const r of recs)for(const n of r.addedNodes)if(n.nodeType===1&&(n.matches(SEL)||n.querySelector(SEL))){decorate(document);return}}).observe(document.body,{childList:true,subtree:true});
decorate(document);

/* other sounds stop the recitation; leaving a screen stops it too */
if(typeof stopVoicePlayback==='function'){const before=stopVoicePlayback;stopVoicePlayback=function(){stop();return before.apply(this,arguments)}}
if(typeof window.show==='function'){const beforeShow=window.show;window.show=function(){stop();return beforeShow.apply(this,arguments)}}

document.head.insertAdjacentHTML('beforeend',`<style id="sq-style">
.sq-recite{display:inline-flex;align-items:center;gap:7px;min-height:36px;margin:6px 0 2px;padding:6px 14px 6px 8px;border:1px solid #cfa85a;border-radius:999px;background:linear-gradient(180deg,#fffaf0,#f5e4b9);color:#5a3d17;font:800 13px/1.15 Nunito,system-ui,sans-serif;box-shadow:0 1px 4px #5a3d1722;cursor:pointer;text-align:start}
.sq-recite:hover{background:linear-gradient(180deg,#fffdf6,#f8eac7)}
.sq-recite:focus-visible{outline:3px solid #2e6b58;outline-offset:2px}
.sq-ic{display:inline-grid;place-items:center;flex:none;width:24px;height:24px;border-radius:50%;background:#2e6b58;color:#fff;font-size:11px;line-height:1}
.sq-recite[data-state="playing"]{background:linear-gradient(180deg,#eef8ea,#d3eecb);border-color:#8fc283;color:#1f4d3e}
.sq-recite[data-state="playing"] .sq-ic{background:#b8352c;animation:sq-pulse 1.2s ease-in-out infinite}
.sq-recite[data-state="loading"] .sq-ic{background:#a8873f}
.sq-recite[data-state="error"],.sq-recite[data-state="muted"]{border-color:#d9a08f;color:#7a2f22}
.sq-recite.small{min-height:30px;margin:0 0 0 8px;padding:3px 10px 3px 4px;font-size:11.5px;vertical-align:middle}
.sq-recite.small .sq-ic{width:20px;height:20px;font-size:9px}
.sq-recite-row{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin:4px 0 2px}
.sq-part{display:inline-block;padding:2px 9px;border:1px dashed #cfa85a;border-radius:999px;background:#fffdf6;color:#7a5a24;font:700 11.5px/1.5 Nunito,system-ui,sans-serif}
.sq-quran .lw-q-en::before,.sq-quran .lw-verse-en::before{content:'Simple meaning';display:block;margin-bottom:1px;color:#7b705e;font:700 10.5px/1.4 Nunito,system-ui,sans-serif;font-style:normal;text-transform:uppercase;letter-spacing:.06em}
.lw-q .sq-recite-row{margin:2px 0 0}
.lw-verse-say{flex-wrap:wrap;align-items:center}
.lw-verse-say .sq-recite{margin:0;padding:6px 14px 6px 8px;white-space:nowrap}
.hira-ayahs li.sq-now{border-color:#8fc283;background:#f3fbef;box-shadow:0 0 0 3px #cdeec7}
@keyframes sq-pulse{50%{transform:scale(.86)}}
@media (prefers-reduced-motion:reduce){.sq-recite[data-state="playing"] .sq-ic{animation:none}}
</style>`);

window.SeeraaQuran={play,stop,auto,parseRef,plan,verse,get playing(){return!!job}};
})();
