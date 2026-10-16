/* Question 15 of every Map Challenge is a writing task. The student reads the
   task, writes at least MIN_WORDS words in their own words, and sends it to the
   teacher; only then do they see their result. Sending earns the 15th point.
   The writing is kept in the student's own progress (profile.mapWritings[map]),
   so the Teacher portal (Maps → Map review) can read it, correct it, add a note,
   and accept it or ask for it again. The teacher's reply shows under the map in
   “From your teacher”. A teacher changes the task itself with ✏️ Edit Map N. */
(function(){
'use strict';
const MIN_WORDS=20,MIN_DIFFERENT=8,MAX_CHARS=4000;
const PROMPTS=[
 'In your own words, tell how the Kaʿbah was built for Allah alone, and how idols came into Makkah. Why did the people need guidance from Allah?',
 'Choose one person from the Prophet’s ﷺ family in this map — Hāshim, ʿAbd al-Muṭṭalib, ʿAbdullāh or Āminah. Write what they did, and one good quality you learned from them.',
 'Tell the story of Abrahah and his elephant army in your own words. What did ʿAbd al-Muṭṭalib mean when he said “The House has a Lord”, and how did Allah protect His House?',
 'Write about the Prophet’s ﷺ blessed birth and his years with Ḥalīmah in the desert. What blessings came to Ḥalīmah’s family while she looked after him?',
 'The Prophet ﷺ lost his mother and his grandfather when he was young, and he worked as a shepherd. Write how Allah took care of him, and what a shepherd learns that helps a leader.',
 'Why did the people of Makkah call the Prophet ﷺ al-Amīn, the Trustworthy One? Write about the Pact of Fairness or another story from this map, and how you can be trustworthy too.',
 'Write about the Prophet’s ﷺ honest trading for Khadījah and what Maysarah told her. Then tell why Zayd chose to stay with the Prophet ﷺ instead of going home.',
 'Retell how the Prophet ﷺ solved the quarrel about the Black Stone so that every tribe was happy. Then write why he liked to go to the Cave of Ḥirāʾ.',
 'Tell what happened in the Cave of Ḥirāʾ when the first verses, “Read!”, came down. How did Khadījah comfort the Prophet ﷺ, and what did Waraqah say?',
 'Who were the first people to believe? Write about one of them — Khadījah, Abū Bakr, ʿAlī or Zayd — and why their faith was so special.',
 'Write about the day the Prophet ﷺ called the people from Mount Ṣafā. What did he ask them, what did he tell them, and how did Abū Ṭālib stand by him?',
 'Bilāl kept saying “Aḥad, Aḥad — One, One” even while he was hurt. Write about Bilāl or the family of Yāsir, and how you can stay firm when something is hard.',
 'Retell the journey across the sea to Abyssinia in your own words. What did Jaʿfar say to the Najāshī, and why did the king protect the Muslims?',
 'Choose Ḥamzah or ʿUmar. Write how he became a Muslim, and how his Islam gave strength to the believers.',
 'Write about the three hard years in the valley. How did the Muslims stay patient, how did the boycott end, and why was the next year called the Year of Sorrow?',
 'At Ṭāʾif the people hurt the Prophet ﷺ, yet he hoped that their children would worship Allah instead of asking for them to be punished. Write the story and what it teaches you about mercy.',
 'Write about the Night Journey and the rising through the heavens in your own words. What gift did Allah give the Muslims that night, and why was Abū Bakr called aṣ-Ṣiddīq?',
 'Choose Ṭufayl, Abū Dharr or the six men from Yathrib. Write how Islam reached their hearts, and what they did next.',
 'Write about Muṣʿab ibn ʿUmayr, the first teacher sent to Yathrib. How did his gentle words help Usayd and Saʿd accept Islam, and what was promised at the Second Pledge?',
 'Write how the believers left Makkah for Madīnah. Choose Ṣuhayb’s “best trade” or ʿAlī sleeping in the Prophet’s ﷺ bed, and tell what it shows about their faith.',
 'Imagine you are near the Cave of Thawr. Write what happened there and on the road to Madīnah — Asmāʾ, the careful plan and Surāqah’s horse. What do you learn about trusting Allah?',
 'Describe the day the Prophet ﷺ arrived in Madīnah. How did the people welcome him, and what happened when everyone asked him to stay with them?',
 'The first things built in Madīnah were the Masjid and the brotherhood between the Muhājirūn and the Anṣār. Write about one of them, and how you can be a good brother or sister to others.',
 'Choose ʿAbdullāh ibn Salām or Salmān al-Fārisī. Write how he searched for the truth and found it. Then write one thing you learned about the new qiblah or the first Ramaḍān.',
 'Write about the dangers Madīnah faced — people with two faces inside and enemies outside. Why did Allah give the believers permission to defend themselves?',
 'Before Badr the Prophet ﷺ asked his companions for advice and made long duʿāʾ in the shelter. Write how Allah helped the believers before the battle.',
 'Write about the Day of Badr in your own words. Then tell how some captives earned their freedom by teaching Muslim children to read and write. Why is that special?',
 'Choose one story from this map — ʿUthmān staying behind, Zaynab’s necklace, or Fāṭimah’s simple wedding — and write what it teaches about family and kindness.',
 'Write about the Battle of Uḥud. What happened when the archers left the hill, and what lesson about obeying the Prophet ﷺ do we learn?',
 'Choose one hero of Uḥud — Umm ʿUmārah, Ḥamzah, Muṣʿab, or the companions who shielded the Prophet ﷺ — and write about their courage.',
 'After Uḥud the believers said “Ḥasbunallāh — Allah is enough for us.” Write what this means, and a time in your own life when you can say it.',
 'Write about the digging of the Trench. Who suggested the idea, how did everyone work and sing together, and what happened at Jābir’s little meal?',
 'Write how the siege of the Trench ended with a wind from Allah. Then tell about Abū Lubābah tying himself to the pillar — what does it teach about turning back to Allah?',
 'This map is about tests of truth, like the lie that was spread about ʿĀʾishah. Write why we must not pass on stories we hear, and how beautiful patience helps.',
 'Write about the Treaty of Ḥudaybiyyah. Some terms seemed unfair, yet Allah called it “a clear victory”. Why? Also write how Umm Salamah’s advice helped.',
 'The Prophet ﷺ sent letters to kings, inviting them to Islam. Write about one letter, or about the questions Heraclius asked Abū Sufyān and what the answers showed.',
 'Choose a story from this map — Khaybar, Jaʿfar coming home, Ṣafiyyah, or Abū Hurayrah and the cup of milk — and write it in your own words with its lesson.',
 'A man raised a sword and asked, “Who will protect you from me?” Write the story and the Prophet’s ﷺ answer. What does it teach about trusting Allah?',
 'Write about the Battle of Muʾtah. Why is Jaʿfar called “Jaʿfar of the Two Wings”, and how did Khālid become the Sword of Allah?',
 'Write how the treaty was broken and how the Prophet ﷺ marched to Makkah. What happened with Ḥāṭib’s letter, and why were many fires lit at Marr aẓ-Ẓahrān?',
 'When the Prophet ﷺ entered Makkah he forgave the people who had hurt him for years. Write about this mercy and one person who was forgiven, like ʿIkrimah.',
 'At Ḥunayn the Muslims were many, but numbers alone did not bring victory. Write the lesson of Ḥunayn, or why the Anṣār wept after the Prophet ﷺ spoke to them.',
 'Write about Kaʿb ibn Mālik, who told the truth even though it was hard. What happened to him, and why is honesty always better?',
 'Many groups came to Madīnah to learn about Islam. Write about Ḍimām’s questions or another visitor — and one question you would ask to learn more about Islam.',
 'Write about the Farewell Pilgrimage and the Prophet’s ﷺ final days. What is one thing from his last sermon that you want to remember all your life?'
];
const esc=s=>typeof escapeHtml==='function'?escapeHtml(String(s==null?'':s)):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const q=s=>document.querySelector(s);
const defaultPrompt=w=>PROMPTS[w]||`Write what you learned on Map ${w+1} in your own words, and one lesson you will use in your life.`;
function promptFor(w){const e=typeof contentEdits!=='undefined'&&typeof mapKey==='function'?contentEdits[mapKey(w)]:null;return(e&&typeof e.writePrompt==='string'&&e.writePrompt.trim())||defaultPrompt(w)}
const words=t=>String(t||'').trim().split(/\s+/).filter(x=>/[\p{L}\p{N}]/u.test(x));
const different=t=>new Set(words(t).map(x=>x.toLowerCase().replace(/[^\p{L}\p{N}]/gu,''))).size;
function list(){if(!Array.isArray(profile.mapWritings))profile.mapWritings=[];return profile.mapWritings}
const mine=w=>list()[w]||null;
/* the teacher has answered this version (a newer send waits for a new answer);
   review.for is the version it answers, so the two devices' clocks never matter */
const answered=x=>!!(x&&x.review&&x.review.at&&(x.review.for?x.review.for===x.at:String(x.review.at)>=String(x.at||'')));
const draftKey=w=>(typeof progressKey==='function'?progressKey():'seeraa')+':writing:'+w;
const getDraft=w=>{try{return localStorage.getItem(draftKey(w))||''}catch(e){return''}};
const setDraft=(w,t)=>{try{if(t)localStorage.setItem(draftKey(w),t);else localStorage.removeItem(draftKey(w))}catch(e){}};
const fmtDate=d=>{const x=new Date(d);return isNaN(x)?'':x.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})};

/* keep the list one place per map */
if(typeof normalizeProfile==='function'){const before=normalizeProfile;normalizeProfile=function(){const d=before.apply(this,arguments);if(d&&typeof d==='object'){const a=Array.isArray(d.mapWritings)?d.mapWritings:[];d.mapWritings=[...a,...Array(worlds.length).fill(null)].slice(0,worlds.length).map(x=>x&&typeof x==='object'&&typeof x.text==='string'?x:null)}return d}}

function reviewHTML(x){
 if(!answered(x))return '';const r=x.review,who=esc(r.by||'Your teacher'),again=r.status==='rewrite';
 return `<div class="wr-reply ${again?'again':'ok'}"><div class="who">${again?'↩️':'✅'} ${who} · ${fmtDate(r.at)}</div><p class="wr-reply-state">${again?'Your teacher asks you to write it again.':'Your teacher accepted your writing. Mā shā’ Allāh!'}</p>${r.note?`<p class="wr-reply-note">${esc(r.note)}</p>`:''}${r.text&&r.text!==x.text?`<details class="wr-fix"><summary>See your teacher’s corrected version</summary><p>${esc(r.text)}</p></details>`:''}</div>`;
}

/* one screen for both: question 15 of the challenge, and “write it again” from the map */
let challengeDone=false,sentWords=0;
function showWriting(mode){
 const w=viewWorld,prev=mine(w),inChallenge=mode==='challenge',task=inChallenge||!prev?promptFor(w):(prev.prompt||promptFor(w));
 const start=getDraft(w)||(prev?prev.text:'');
 const head=inChallenge?`<p class="kicker">Map ${w+1} Certificate Challenge</p><h1>${MAP_QUIZ_TOTAL} Questions</h1><div class="map-quiz-score">🏆 Question ${mapQuizIndex+1}/${MAP_QUIZ_TOTAL} &nbsp; · &nbsp; Score ${mapQuizCorrect}</div><div class="quiz-meta"><span>Score ${MAP_QUIZ_PASS} or more to pass</span><span class="quiz-dots">${Array(MAP_QUIZ_TOTAL).fill(0).map((_,i)=>`<span class="quiz-dot ${i<mapQuizIndex?'done':i===mapQuizIndex?'current':''}"></span>`).join('')}</span></div>`
  :`<p class="kicker">Map ${w+1} · Writing task</p><h1>Write it again</h1>`;
 q('#mapQuizBody').innerHTML=`${head}<div class="wr-task"><span class="wr-tag">✍️ Writing task · your teacher will read it</span><p class="wr-prompt" id="wrPrompt">${esc(task)}</p><p class="wr-rule">Write at least <b>${MIN_WORDS} words</b> in your own words — three or four sentences.</p></div>${prev&&!inChallenge?reviewHTML(prev):''}${prev&&inChallenge?`<p class="wr-before">You sent this before on ${fmtDate(prev.at)}. Read it again, make it better, and send it.</p>`:''}<label class="wr-label" for="wrText">Your answer</label><textarea id="wrText" class="wr-text" maxlength="${MAX_CHARS}" rows="7" placeholder="Start writing here…" spellcheck="true" autocapitalize="sentences">${esc(start)}</textarea><div class="wr-count"><span id="wrCount" aria-live="polite"></span>${typeof cloudUser!=='undefined'&&cloudUser?'':'<span class="wr-guest">Sign in so your teacher can read it — for now it stays on this device.</span>'}</div><div class="feedback" id="wrMsg" aria-live="polite"></div>`;
 q('#mapQuizActions').innerHTML=`<button class="btn green" id="wrSend" disabled>📨 Send to my teacher</button><button class="ghost" id="wrExit">${inChallenge?'Exit to Map':'Back to map'}</button>`;
 const ta=q('#wrText'),send=q('#wrSend'),count=q('#wrCount'),note=q('#wrMsg');
 const update=()=>{const n=words(ta.value).length,ok=n>=MIN_WORDS;count.textContent=ok?`✓ ${n} words — ready to send`:`${n} / ${MIN_WORDS} words`;count.className=ok?'ok':'';send.disabled=!ok;setDraft(w,ta.value.trim()===(prev&&prev.text)?'':ta.value)};
 ta.oninput=()=>{if(note.classList.contains('bad')){note.textContent='';note.className='feedback'}update()};update();
 q('#wrExit').onclick=()=>{renderMap();show('mapScreen')};
 send.onclick=()=>{
  const text=ta.value.trim().replace(/\r/g,''),n=words(text).length,msg=q('#wrMsg');
  if(n<MIN_WORDS){msg.textContent=`Write at least ${MIN_WORDS} words.`;msg.className='feedback bad';return}
  if(different(text)<MIN_DIFFERENT||text.toLowerCase()===task.toLowerCase()){msg.textContent='Use your own words — tell it like you would tell a friend.';msg.className='feedback bad';typeof tryAgainSound==='function'&&tryAgainSound();return}
  const same=prev&&prev.text===text;
  if(same&&!inChallenge&&answered(prev)&&prev.review.status==='rewrite'){msg.textContent='Change your writing first — use your teacher’s note to make it better.';msg.className='feedback bad';typeof tryAgainSound==='function'&&tryAgainSound();return}
  const rec=same?prev:{prompt:task,text,words:n,at:new Date().toISOString(),review:prev&&prev.review||null};
  list()[w]=rec;setDraft(w,'');
  if(inChallenge){mapQuizCorrect++;challengeDone=true;sentWords=n}
  save();if(typeof syncStats==='function')syncStats();if(typeof happySound==='function')happySound();
  ta.readOnly=true;
  msg.innerHTML=same?'📨 Your writing is with your teacher.':`📨 Sent to your teacher!${inChallenge?' +1 point ⭐':' Your teacher will read it again.'}`;msg.className='feedback good';
  const sc=document.querySelector('#mapQuizBody .map-quiz-score');if(sc)sc.innerHTML=`🏆 Question ${mapQuizIndex+1}/${MAP_QUIZ_TOTAL} &nbsp; · &nbsp; Score ${mapQuizCorrect}`;
  q('#mapQuizActions').innerHTML=inChallenge?'<button class="btn green" id="wrResult">See My Result 🏆</button>':'<button class="btn green" id="wrResult">Back to map</button>';
  q('#wrResult').onclick=()=>{if(inChallenge)finishMapQuiz();else{renderMap();show('mapScreen')}};q('#wrResult').focus();
 };
 if(!inChallenge)show('mapQuizScreen');
}

/* question 15 → the writing task (in place of the story match) */
const renderMapQuizBeforeWriting=renderMapQuiz;
renderMapQuiz=function(){if(mapQuizIndex===MAP_QUIZ_TOTAL-1){challengeDone=false;showWriting('challenge');return}return renderMapQuizBeforeWriting.apply(this,arguments)};
const finishMapQuizBeforeWriting=finishMapQuiz;
finishMapQuiz=function(){
 const done=challengeDone;challengeDone=false;const r=finishMapQuizBeforeWriting.apply(this,arguments);if(!done)return r;
 const rec=profile.mapQuizScores[viewWorld];if(rec){rec.writing={words:sentWords,at:new Date().toISOString()};save()}
 const res=document.querySelector('.map-quiz-result');if(res)res.insertAdjacentHTML('beforebegin',`<p class="map-quiz-match">✍️ Question ${MAP_QUIZ_TOTAL} · Writing: sent to your teacher ✓ (+1 point)<br><small>${sentWords} words · your teacher’s reply will appear under this map in “From your teacher”.</small></p>`);
 return r;
};

/* the teacher's reply, under the map in “From your teacher” */
function seen(){if(!profile.mapWritingSeen||typeof profile.mapWritingSeen!=='object')profile.mapWritingSeen={};return profile.mapWritingSeen}
function renderWritingBox(){
 const anchor=q('#teacherNoteBox');if(!anchor)return;let box=q('#writingBox');
 if(!box){anchor.insertAdjacentHTML('afterend','<div id="writingBox"></div>');box=q('#writingBox')}
 const w=viewWorld,x=mine(w);if(!x){box.innerHTML='';return}
 const r=answered(x)?x.review:null,isNew=!!(r&&seen()[w]!==r.at),again=r&&r.status==='rewrite';
 const sum=!r?`Sent ${fmtDate(x.at)} · waiting for your teacher`:again?'Your teacher asks you to write it again':'Accepted by your teacher ✓';
 const body=`<div class="wr-mine"><p class="wr-mine-task">${esc(x.prompt||promptFor(w))}</p><p class="wr-mine-text">${esc(x.text)}</p><small>${x.words||words(x.text).length} words · sent ${fmtDate(x.at)}</small></div>${reviewHTML(x)}${again?'<button type="button" class="btn green" id="wrAgain">✍️ Write it again</button>':''}`;
 box.innerHTML=typeof foldHTML==='function'?foldHTML('writing','✍️','My writing · Map '+(w+1),sum,isNew?(again?'Write again':'New'):'',body):body;
 if(typeof wireFolds==='function')wireFolds(box);
 const b=q('#wrAgain');if(b)b.onclick=()=>showWriting('again');
}
function markSeen(){const x=mine(viewWorld);if(answered(x)&&seen()[viewWorld]!==x.review.at){seen()[viewWorld]=x.review.at;save();renderWritingBox();if(typeof refreshMapMenu==='function')refreshMapMenu()}}
if(typeof renderTeacherQuizzes==='function'){const before=renderTeacherQuizzes;renderTeacherQuizzes=function(){const r=before.apply(this,arguments);renderWritingBox();return r}}
if(typeof onFoldOpened==='function'){const before=onFoldOpened;onFoldOpened=function(id){if(id==='writing')markSeen();return before.apply(this,arguments)}}

document.head.insertAdjacentHTML('beforeend',`<style id="seeraa-writing-style">
.wr-task{text-align:left;background:#fffaf0;border:2px solid var(--gold2);border-left:7px solid var(--gold);border-radius:18px;padding:14px 16px;margin:0 0 14px}
.wr-tag{display:inline-block;font:800 13px Nunito,system-ui,sans-serif;color:#7a5418;background:#fff1cc;border-radius:999px;padding:4px 11px;margin-bottom:8px}
.wr-prompt{font:20px/1.45 'Marcellus',serif;color:var(--navy);margin:0 0 8px}
.wr-rule{margin:0;font:600 15px/1.4 Nunito,system-ui,sans-serif;color:#5f513d}
.wr-before{text-align:left;font:600 15px Nunito,system-ui,sans-serif;color:#5f513d;margin:0 0 10px}
.wr-label{display:block;text-align:left;font:800 15px Nunito,system-ui,sans-serif;color:var(--navy);margin:4px 0 6px}
.wr-text{display:block;width:100%;box-sizing:border-box;min-height:170px;resize:vertical;padding:13px 14px;border:2px solid #cfd9e3;border-radius:16px;background:#fff;color:#2a2a2a;font:17px/1.55 Nunito,system-ui,sans-serif}
.wr-text:focus{outline:none;border-color:var(--sky);box-shadow:0 0 0 4px #3f9fc933}
.wr-text[readonly]{background:#f6f9fb;color:#47515c}
.wr-count{display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px 12px;margin:7px 2px 0;font:700 14px Nunito,system-ui,sans-serif;color:#7a6a52;text-align:left}
.wr-count .ok{color:var(--green)}.wr-count #wrCount.ok{color:var(--green)}
.wr-guest{color:#9a5b23;font-weight:600}
.wr-reply{text-align:left;background:#fff;border:2px solid #9fd8f2;border-left:7px solid var(--sky);border-radius:18px;padding:12px 15px;margin:0 0 14px}
.wr-reply.again{border-color:#f2c79f;border-left-color:var(--coral)}
.wr-reply.ok{border-color:#a9dcc4;border-left-color:var(--green)}
.wr-reply .who{font:15px Marcellus,serif;color:#1c4a66;margin-bottom:3px}
.wr-reply-state{margin:0 0 4px;font:800 16px Nunito,system-ui,sans-serif;color:var(--navy)}
.wr-reply-note{margin:0;font-size:17px;line-height:1.5;white-space:pre-wrap}
.wr-fix{margin-top:8px}.wr-fix summary{cursor:pointer;font:800 14px Nunito,system-ui,sans-serif;color:var(--blue)}
.wr-fix p{margin:8px 0 0;padding:10px 12px;border-radius:12px;background:#f1f8ee;white-space:pre-wrap;font-size:16px;line-height:1.5}
.wr-mine{text-align:left;background:#fffaf0;border:2px solid #ead9b5;border-radius:16px;padding:11px 14px;margin:0 0 12px}
.wr-mine-task{margin:0 0 6px;font:700 14px/1.4 Nunito,system-ui,sans-serif;color:#7a5418}
.wr-mine-text{margin:0 0 6px;font-size:16px;line-height:1.5;white-space:pre-wrap;color:#2f2a24}
.wr-mine small{color:#8a7a62}
#writingBox .btn{margin-top:2px}
@media(max-width:560px){.wr-prompt{font-size:18px}.wr-task{padding:12px 13px}}
</style>`);

window.SeeraaWriting={PROMPTS,MIN_WORDS,defaultPrompt,promptFor,show:showWriting};
})();
