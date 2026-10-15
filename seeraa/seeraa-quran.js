/* Qurʾān recitation for Seeraa Quest.
   Every ayah quoted in the course is recited by Mishary Rashid al-ʿAfasy, from the
   Quran.com API (recitation 7): the Learn page verse, the Qurʾān quotes in the stories,
   the Qurʾān & Hadith cards, the du‘ās, the five ayahs of the cave of Ḥirāʾ and the
   Qurʾān speech bubbles in the scenes.
     GET /recitations/7/by_ayah/{s:a}?fields=segments   the ayah's audio file and each word's timing
     GET /verses/by_key/{s:a}?words=true                 the ayah's words
   When a quotation is only part of an ayah (or runs across ayahs), its first and last words
   are found among the ayah's words, so only the quoted words are recited. */
(function(){
'use strict';
const API='https://api.quran.com/api/v4',AUDIO='https://verses.quran.com/',RECITER=7,CACHE='seeraa-quran-v1:';
const LABEL='Listen · Mishary al-ʿAfasy';
const le=(v,n)=>String.fromCharCode(...Array.from({length:n},(_,i)=>v>>8*i&255));
/* 50 ms of silence: playing it inside a tap lets the same <audio> play the recitation once it has loaded (iPhone) */
const SILENT='data:audio/wav;base64,'+btoa('RIFF'+le(436,4)+'WAVEfmt '+le(16,4)+le(1,2)+le(1,2)+le(8000,4)+le(8000,4)+le(1,2)+le(8,2)+'data'+le(400,4)+'\x80'.repeat(400));

/* "Sūrat al-Fīl 105:1–2", "96:1-5", "Qur’an · 20:114" → ['105:1','105:2'] */
function parseRef(s){const m=String(s||'').match(/(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[–—-]\s*(\d{1,3}))?/);if(!m)return null;
 const c=+m[1],a=+m[2],b=m[3]?+m[3]:a;if(c<1||c>114||a<1||b<a||b-a>20)return null;
 return Array.from({length:b-a+1},(_,i)=>c+':'+(a+i))}
const isQuranRef=s=>/^\s*(s[uū]ra|qur)/i.test(s)||/^\s*\d{1,3}\s*:\s*\d{1,3}/.test(s);

/* compare words by their letters only: no vowel marks, and the hamza, alif and tā’ marbūṭa
   spellings that differ between the course's text and Quran.com's are made the same */
const MARKS=/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const skel=w=>String(w).replace(MARKS,'').replace(/[ءأإآٱا]/g,'').replace(/ؤ/g,'و').replace(/[ئىی]/g,'ي').replace(/ة/g,'ه').replace(/[^ء-ي]/g,'');
const words=s=>String(s).split(/\s+/).map(skel).filter(Boolean);
const sim=(a,b)=>a===b?1:a.length>2&&b.length>2&&(a.startsWith(b)||b.startsWith(a)||a.endsWith(b)||b.endsWith(a))?.5:0;
/* where the quotation Q starts and ends among the ayahs' words W (by its first and last three words) */
function align(Q,W){const n=Q.length,m=W.length;if(!n||!m)return null;const k=Math.min(3,n),need=k===3?1.5:1;
 let st=null;
 for(let o=0;o<k;o++)for(let i=0;i<m;i++){let s=-.3*o;for(let t=0;o+t<n&&t<k&&i+t<m;t++)s+=sim(Q[o+t],W[i+t].t);if(!st||s>st.s+1e-9)st={s,i:Math.max(0,i-o)}}
 if(st.s<need)return null;
 let en=null;const want=st.i+n-1;
 for(let o=0;o<k;o++)for(let j=st.i;j<m;j++){let s=-.3*o;for(let t=0;n-1-o-t>=0&&t<k&&j-t>=st.i;t++)s+=sim(Q[n-1-o-t],W[j-t].t);
  const at=Math.min(m-1,j+o),d=Math.abs(at-want);if(!en||s>en.s+1e-9||(Math.abs(s-en.s)<1e-9&&d<en.d))en={s,j:at,d}}
 if(!en||en.s<need)return null;
 return{start:st.i,end:en.j}}

function getJSON(url){const ctl=typeof AbortController==='function'?new AbortController():null,tm=setTimeout(()=>ctl&&ctl.abort(),9000);
 return fetch(url,ctl?{signal:ctl.signal}:{}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).finally(()=>clearTimeout(tm))}
const memo=new Map();
/* one ayah: {url, seg:[[wordPosition,startMs,endMs]], words:[[position,text]]}, kept on the device after the first time */
function verse(key){
 if(memo.has(key))return memo.get(key);
 let saved=null;try{saved=JSON.parse(localStorage.getItem(CACHE+key)||'null')}catch(e){}
 const p=saved&&saved.url?Promise.resolve(saved):Promise.all([
  getJSON(`${API}/recitations/${RECITER}/by_ayah/${key}?fields=segments`),
  getJSON(`${API}/verses/by_key/${key}?words=true&word_fields=text_imlaei_simple`).catch(()=>null)
 ]).then(([a,v])=>{const files=a&&a.audio_files||[],f=files.find(x=>x.verse_key===key)||files[0];if(!f||!f.url)throw new Error('no recitation for '+key);
  const d={url:/^https?:/.test(f.url)?f.url:/^\/\//.test(f.url)?'https:'+f.url:AUDIO+f.url.replace(/^\/+/,''),
   seg:(f.segments||[]).filter(s=>Array.isArray(s)&&s.length>=3).map(s=>s.length>=4?[s[1],s[2],s[3]]:s),
   words:v&&v.verse&&Array.isArray(v.verse.words)?v.verse.words.filter(w=>w.char_type_name!=='end').map(w=>[w.position,w.text_imlaei_simple||w.text_uthmani||w.text||'']):null};
  if(d.words&&d.seg.length)try{localStorage.setItem(CACHE+key,JSON.stringify(d))}catch(e){}
  return d});
 memo.set(key,p);p.catch(()=>memo.delete(key));return p}
/* without the API, the whole ayah from the same recitation */
function fileOnly(key){const [c,a]=key.split(':').map(Number);return{url:`${AUDIO}Alafasy/mp3/${String(c).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`,seg:[],words:null}}

/* what to play: one part per ayah, the first and last cut to the quoted words */
async function plan(keys,ar){
 const data=await Promise.all(keys.map(k=>verse(k).catch(()=>fileOnly(k))));
 let parts=keys.map((key,i)=>({key,url:data[i].url,from:0,to:0}));
 if(!ar||!data.every(d=>d.words&&d.words.length&&d.seg.length))return parts;
 const W=[];data.forEach((d,vi)=>d.words.forEach(([pos,t])=>words(t).forEach(x=>W.push({vi,pos,t:x}))));
 const m=align(words(ar),W);if(!m)return parts;
 const a=W[m.start],b=W[m.end],da=data[a.vi],db=data[b.vi];
 parts=parts.slice(a.vi,b.vi+1);
 const ia=da.seg.findIndex(s=>s[0]===a.pos),ib=db.seg.findIndex(s=>s[0]===b.pos);
 if(a.pos!==da.words[0][0]&&ia>=0)parts[0].from=Math.max(0,da.seg[ia][1]-50);
 if(b.pos!==db.words[db.words.length-1][0]&&ib>=0){const end=db.seg[ib][2],next=db.seg[ib+1];parts[parts.length-1].to=next?Math.min(end+250,next[1]+20):end+250}
 return parts}

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
function clip(p,j){return new Promise((res,rej)=>{const a=audio(),want=p.from/1000;let t=0,wait=0,over=false,started=false;
 const seek=()=>{if(!want)return true;try{a.currentTime=want}catch(e){}return Math.abs(a.currentTime-want)<.3};
 const retry=()=>{if(seek())go()},quiet=()=>{clearTimeout(wait);a.removeEventListener('progress',retry);a.removeEventListener('canplaythrough',retry)};
 const end=e=>{if(over)return;over=true;clearInterval(t);quiet();a.onended=a.onerror=a.onloadedmetadata=null;e?rej(e):res()};
 const go=()=>{if(started||over)return;started=true;quiet();if(job!==j)return end();const pr=a.play();if(pr&&pr.catch)pr.catch(err=>end(err));show(j.btn,'playing')};
 a.onerror=()=>end(new Error('audio '+p.url));a.onended=()=>end();
 /* start at the first quoted word; a file the browser cannot jump into yet is loaded a little more first */
 a.onloadedmetadata=()=>{a.onloadedmetadata=null;if(job!==j)return end();if(seek())return go();
  a.addEventListener('progress',retry);a.addEventListener('canplaythrough',retry);wait=setTimeout(go,2500)};
 t=setInterval(()=>{if(job!==j)return end();if(!j.alive()){stop();return end()}if(started&&p.to&&a.currentTime*1000>=p.to){a.pause();end()}},40);
 a.src=p.url})}
/* recite ayahs (a reference or a list of 's:a' keys); ar = the quoted Arabic, to recite only those words */
async function play(ref,ar,o={}){
 const keys=Array.isArray(ref)?ref:parseRef(ref);if(!keys)return false;
 if(typeof stopVoicePlayback==='function')stopVoicePlayback();else{stop();if('speechSynthesis'in window)speechSynthesis.cancel()}
 if(window.SeeraaNasheed&&SeeraaNasheed.playing)SeeraaNasheed.stop();
 const j={btn:o.btn||null,auto:!!o.auto,alive:o.alive||(()=>!o.btn||o.btn.isConnected)};job=j;show(j.btn,'loading');
 try{const parts=await plan(keys,ar);
  for(const p of parts){if(job!==j)return false;mark(p.key);await clip(p,j)}
 }catch(e){if(job===j){job=null;mark(null);show(j.btn,'error');console.warn('Qurʾān recitation',e)}return false}
 if(job===j){job=null;mark(null);show(j.btn,'idle')}return true}
/* a Qurʾān speech bubble in a scene: recite it if nothing else is playing */
function auto(q,alive){
 if(!q||q.k!=='quran'||!tapped||!soundIsOn()||(job&&!job.auto))return false;
 if(typeof activeMediaAudio!=='undefined'&&activeMediaAudio)return false;
 if(('speechSynthesis'in window&&speechSynthesis.speaking)||(window.SeeraaNasheed&&SeeraaNasheed.playing))return false;
 const keys=parseRef(q.key||q.who);if(!keys)return false;
 play(keys,q.ar,{alive,auto:true});return true}

/* ---------- the buttons ---------- */
function button(ref,ar,o={}){const b=document.createElement('button');b.type='button';b.className='sq-recite'+(o.small?' small':'');
 b.dataset.quranRef=ref;if(ar)b.dataset.quranAr=ar;b.dataset.label=o.text||LABEL;b.title='Recited by Mishary Rashid al-ʿAfasy · audio from Quran.com';
 b.setAttribute('aria-label',`Listen to ${ref}, recited by Mishary al-ʿAfasy`);b.innerHTML='<span class="sq-ic" aria-hidden="true">▶</span><span class="sq-tx"></span>';show(b,'idle');return b}
const row=b=>{const d=document.createElement('span');d.className='sq-recite-row';d.append(b);return d};
const text=(el,sel)=>{const x=el.querySelector(sel);return x?x.textContent.trim():''};
const refIn=s=>(String(s).match(/\d{1,3}\s*:\s*\d{1,3}(?:\s*[–—-]\s*\d{1,3})?/)||[''])[0];
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.sq-recite');if(!b)return;e.preventDefault();
 if(job&&job.btn===b){stop();return}
 if(!soundIsOn()){show(b,'muted');return}
 prime();play(b.dataset.quranRef,b.dataset.quranAr||'',{btn:b})});

const SEL='.lw-verse.quran,.lw-q,.se-evidence,.seeraa-dua-ar,.hira-ayahs';
function decorate(root){
 /* the Learn page: Mishary instead of the phone's voice */
 root.querySelectorAll('.lw-verse.quran:not([data-sq])').forEach(f=>{f.dataset.sq=1;const ref=text(f,'.lw-verse-ref');if(!parseRef(ref))return;
  const old=f.querySelector('#lwSayAr');if(old)old.hidden=true;(f.querySelector('.lw-verse-say')||f).prepend(button(ref,text(f,'.lw-verse-ar')))});
 /* the story: each Qurʾān quote (hadith quotes keep their reference only) */
 root.querySelectorAll('.lw-q:not([data-sq])').forEach(q=>{q.dataset.sq=1;const ref=text(q,'.lw-q-ref');if(isQuranRef(ref)&&parseRef(ref))q.append(row(button(ref,text(q,'.lw-q-ar'))))});
 /* the Qurʾān & Hadith cards */
 root.querySelectorAll('.se-evidence:not([data-sq])').forEach(c=>{c.dataset.sq=1;const h=text(c,'.se-evidence-heading'),ref=refIn(h),ar=c.querySelector('.se-arabic');if(/^\s*qur/i.test(h)&&ref&&ar)ar.after(row(button(ref,ar.textContent.trim())))});
 /* the du‘ā step */
 root.querySelectorAll('.seeraa-dua-ar:not([data-sq])').forEach(p=>{p.dataset.sq=1;const card=p.closest('.matn-card')||p.parentNode,a=card.querySelector('a'),ref=refIn(a?a.textContent:'');if(ref)p.after(row(button(ref,p.textContent.trim())))});
 /* the five ayahs of the cave of Ḥirāʾ: all five, or one at a time */
 root.querySelectorAll('.hira-ayahs:not([data-sq])').forEach(ol=>{ol.dataset.sq=1;const keys=[];
  ol.querySelectorAll('li').forEach(li=>{const n=li.querySelector('.hira-ayah-number'),key=refIn(n?n.textContent:'');if(!key)return;keys.push(key.replace(/\s/g,''));li.dataset.sqKey=key.replace(/\s/g,'');n.after(button(key,'',{small:true,text:'Listen'}))});
  if(keys.length>1){const [c,a]=keys[0].split(':'),z=keys[keys.length-1].split(':')[1];ol.before(row(button(`${c}:${a}-${z}`,'',{text:`Recite all ${keys.length} ayahs · Mishary al-ʿAfasy`})))}});
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
.sq-recite-row{display:flex;flex-wrap:wrap;margin:4px 0 2px}
.lw-q .sq-recite-row{margin:2px 0 0}
.lw-verse-say{flex-wrap:wrap}
.lw-verse-say .sq-recite{margin:0;padding:6px 14px 6px 8px;white-space:nowrap}
.hira-ayahs li.sq-now{border-color:#8fc283;background:#f3fbef;box-shadow:0 0 0 3px #cdeec7}
@keyframes sq-pulse{50%{transform:scale(.86)}}
@media (prefers-reduced-motion:reduce){.sq-recite[data-state="playing"] .sq-ic{animation:none}}
</style>`);

window.SeeraaQuran={play,stop,auto,parseRef,plan,align,words,verse,get playing(){return!!job}};
})();
