const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d');let W=0,H=0,dpr=1;
let state={chapter:0,mode:'menu',travelMode:'run',car:'oasis',runner:'boy',runnerChosen:false,boostCharges:0,boostTime:0,boostNotice:0,spawnCount:0,blueSpawned:0,trailExtension:0,modeChosen:false,brake:0,brakeHeld:false,motion:0,lane:1,targetLane:1,dist:0,stars:0,best:0,objects:[],spawn:0,speed:.39,jump:0,slide:0,stumble:0,last:0,particles:[],sound:true,completedIds:[],transition:0};
const safeNumber=n=>Number.isFinite(n)&&n>=0?n:0;
try{
 const saved=JSON.parse(localStorage.getItem('medina-run-progress-v2')||'null');
 if(saved){
  state.stars=safeNumber(saved.stars);state.best=safeNumber(saved.best);state.boostCharges=Math.floor(safeNumber(saved.boostCharges));
  state.completedIds=Array.isArray(saved.completedIds)?[...new Set(saved.completedIds)].filter(id=>chapters.some(c=>c.id===id)):[];
  const index=chapters.findIndex(c=>c.id===saved.chapterId&&!state.completedIds.includes(c.id));
  const first=chapters.findIndex(c=>!state.completedIds.includes(c.id));state.chapter=index>=0?index:Math.max(0,first);
 }else{
  const legacy=JSON.parse(localStorage.getItem('medina-run-v1')||'{}');
  state.stars=safeNumber(legacy.stars);state.best=safeNumber(legacy.best);
  state.completedIds=['kaaba','night','jerusalem','hijrah','quba','mosque','uhud'].slice(0,Math.min(7,safeNumber(legacy.completed)));
  state.chapter=Math.max(0,chapters.findIndex(c=>!state.completedIds.includes(c.id)));
 }
}catch(e){}
function save(){try{localStorage.setItem('medina-run-progress-v2',JSON.stringify({stars:state.stars,best:state.best,boostCharges:state.boostCharges,completedIds:state.completedIds,chapterId:chapters[state.chapter].id}))}catch(e){}}
const assets={};
for(const name of ['runner','mountain','oasis','girl']){const image=new Image();image.src='assets/'+name+'.webp';assets[name]=image}
function ready(image){return image&&image.complete&&image.naturalWidth>0}
function chapterLength(){return chapters[state.chapter].length+state.trailExtension}
const cars=[
 {id:'oasis',name:'Oasis Coupe',description:'Blue coupe',color:'#2698d0',light:'#8de5fa',dark:'#175779',width:1,height:.89},
 {id:'desert',name:'Desert SUV',description:'Golden explorer',color:'#ecad37',light:'#ffe394',dark:'#986220',width:1.12,height:1.08},
 {id:'mint',name:'Mint Mini',description:'Green city car',color:'#39ae89',light:'#a0f3c8',dark:'#216c58',width:.92,height:.87}
];
try{const prefs=JSON.parse(localStorage.getItem('medina-run-settings-v1')||'{}');if(['run','drive'].includes(prefs.travelMode)){state.travelMode=prefs.travelMode;state.modeChosen=prefs.modeChosen!==false;}if(cars.some(c=>c.id===prefs.car))state.car=prefs.car;if(['boy','girl'].includes(prefs.runner)){state.runner=prefs.runner;state.runnerChosen=prefs.runnerChosen!==false}}catch(e){}
function savePreferences(){try{localStorage.setItem('medina-run-settings-v1',JSON.stringify({travelMode:state.travelMode,car:state.car,modeChosen:state.modeChosen,runner:state.runner,runnerChosen:state.runnerChosen}))}catch(e){}}
function selectedCar(){return cars.find(c=>c.id===state.car)||cars[0]}
function isDriving(){return state.travelMode==='drive'}
function syncBoost(){
 const button=$('boostBtn'),active=state.boostTime>0;
 button.disabled=state.mode!=='running'||active||state.boostCharges===0;
 button.classList.toggle('boosting',active);button.classList.toggle('ready',!active&&state.boostCharges>0);
 $('boostLabel').textContent=active?Math.ceil(state.boostTime)+'s':'BOOST ×'+state.boostCharges;
 $('boostMeter').style.width=(active?state.boostTime/5*100:0)+'%';
 button.setAttribute('aria-label',active?'Boost active: '+Math.ceil(state.boostTime)+' seconds':state.boostCharges?'Use speed boost. '+state.boostCharges+' charges':'Collect a blue star to charge Boost');
}
function activateBoost(){
 if(state.mode!=='running'||state.boostCharges<1||state.boostTime>0)return;
 state.boostCharges--;state.boostTime=5;state.trailExtension=Math.min(420,state.trailExtension+100);state.boostNotice=0;save();syncBoost();audio('good');
}
function runnerImage(){return state.runner==='girl'?assets.girl:assets.runner}
function syncControls(){syncBoost();
 canvas.setAttribute('aria-label',isDriving()?'Three lane driving game':'Three lane running game');
 document.querySelectorAll('[data-action="jump"],[data-action="slide"]').forEach(b=>b.hidden=isDriving());
 document.querySelector('[data-action="brake"]').hidden=!isDriving();
 $('travelBadge').textContent=isDriving()?'DRIVE · '+selectedCar().name:'RUN · '+(state.runner==='girl'?'Character 2':'Character 1');
 $('travelBadge').classList.toggle('driving',isDriving());
}
function resize(){dpr=Math.min(devicePixelRatio||1,2);let r=canvas.getBoundingClientRect();W=r.width;H=r.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();
function audio(type){if(!state.sound)return;try{const ac=audio.ac||(audio.ac=new (window.AudioContext||window.webkitAudioContext)());if(ac.state==='suspended')ac.resume();const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type=type==='bad'?'triangle':'sine';o.frequency.setValueAtTime(type==='bad'?220:620,t);o.frequency.exponentialRampToValueAtTime(type==='bad'?130:940,t+.16);g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+.22)}catch(e){}}
function jumpSound(){
 if(!state.sound)return;
 try{
  const ac=audio.ac||(audio.ac=new(window.AudioContext||window.webkitAudioContext)());
  if(ac.state==='suspended')ac.resume();
  const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();
  o.type='triangle';o.frequency.setValueAtTime(240,t);
  o.frequency.exponentialRampToValueAtTime(570,t+.12);
  o.frequency.exponentialRampToValueAtTime(400,t+.25);
  g.gain.setValueAtTime(.001,t);
  g.gain.exponentialRampToValueAtTime(.11,t+.025);
  g.gain.exponentialRampToValueAtTime(.001,t+.27);
  o.connect(g).connect(ac.destination);o.start(t);o.stop(t+.28);
 }catch(e){}
}
function renderUI(){
 travelSound(0);syncControls();
 $('starCount').textContent='✦ '+state.stars;$('bestCount').textContent='🏆 '+state.best;
 $('chapterNumber').textContent='TRAIL '+(state.chapter+1)+' / '+chapters.length;
 $('chapterName').textContent=chapters[state.chapter].region;
 $('progressFill').style.width=Math.min(100,state.dist/chapterLength()*100)+'%';
 $('soundBtn').textContent=state.sound?'♪':'♪̸';$('soundBtn').setAttribute('aria-pressed',String(state.sound));
 $('pauseBtn').hidden=state.mode!=='running';
 $('journalSummary').textContent='My discoveries · '+state.completedIds.length;
 $('journal').hidden=!['menu','running','paused'].includes(state.mode);
 $('discoveries').innerHTML=chapters.filter(c=>state.completedIds.includes(c.id)).map(c=>`<button data-discovery="${c.id}"><span>✓</span>${c.name}</button>`).join('')||'<p>Your discoveries will appear here after you reach them.</p>';
 document.querySelectorAll('[data-discovery]').forEach(button=>button.onclick=()=>reviewStory(button.dataset.discovery));
}
function show(html,kind=''){$('panel').className='panel '+kind;$('panel').innerHTML=html;$('panel').scrollTop=0;$('overlay').classList.remove('hidden');$('trailMessage').textContent=''}
function hide(){$('overlay').classList.add('hidden')}
function showStart(forcePicker=false){
 const pick=forcePicker||!state.modeChosen||(!isDriving()&&!state.runnerChosen);
 const selection=pick?`<fieldset class="mode-picker"><legend>Choose your journey</legend>
 ${[['run','Run','On foot'],['drive','Drive','Pick a car']].map(([value,title,sub])=>`<label class="mode-option"><input type="radio" name="travelMode" value="${value}" ${state.travelMode===value?'checked':''}><span><strong>${title}</strong><small>${sub}</small></span></label>`).join('')}
 </fieldset><fieldset class="runner-picker" id="runnerPicker" ${isDriving()?'hidden':''}><legend>Choose your character</legend><div class="runner-options">${[['boy','Character 1'],['girl','Character 2']].map(([id,label])=>`<label class="runner-option"><input type="radio" name="runner" value="${id}" ${state.runner===id?'checked':''}><span><span class="runner-portrait ${id}" aria-hidden="true"></span><strong>${label}</strong></span></label>`).join('')}</div></fieldset><fieldset class="car-picker" id="carPicker" ${isDriving()?'':'hidden'}><legend>Choose your car</legend><div class="car-options">
 ${cars.map(c=>`<label class="car-option"><input type="radio" name="car" value="${c.id}" ${state.car===c.id?'checked':''}><span><canvas class="car-preview" data-car="${c.id}" width="180" height="110" aria-hidden="true"></canvas><strong>${c.name}</strong><small>${c.description}</small></span></label>`).join('')}
 </div></fieldset>`:`<div class="current-ride">${isDriving()?'Driving · '+selectedCar().name:'Running · '+(state.runner==='girl'?'Character 2':'Character 1')}</div>`;
 show(`<div class="eyebrow">A JOURNEY OF DISCOVERY</div><h1>Medina <em>Run</em></h1><p class="setup-intro">Follow the trail. A new story waits at every stop.</p><details class="journey-verse"><summary>A verse for the journey</summary><p>With Allah’s name, we learn each day,<br>With thankful hearts, we share the way.<br>We speak with truth, our kindness grows,<br>We help a friend wherever we go.</p><small>Original words for Medina Run</small></details>${selection}<button class="primary" id="startBtn"></button>${pick?'':'<button class="text-button" id="chooseMode">Change mode, character or car</button>'}<small class="control-help" id="controlHelp"></small>`,'setup-panel');
 const refresh=()=>{
  if($('carPicker'))$('carPicker').hidden=!isDriving();if($('runnerPicker'))$('runnerPicker').hidden=isDriving();
  $('startBtn').textContent=state.completedIds.length?'Continue journey ➜':isDriving()?'Start driving ➜':'Start running ➜';
  $('controlHelp').innerHTML=isDriving()?'Swipe ← → to steer · Swipe ↓ to brake<br>Keyboard: ← → or A / D · ↓ or Space to brake':'Swipe ← → to move · ↑ jump · ↓ slide<br>Keyboard: arrow keys or A / D · Space to jump';
  $('controlHelp').innerHTML+='<br>Blue star = 1 boost · Tap BOOST or press B';
  syncControls();
 };
 document.querySelectorAll('[name="travelMode"]').forEach(input=>input.onchange=()=>{state.travelMode=input.value;state.brake=0;state.brakeHeld=false;savePreferences();refresh()});
 document.querySelectorAll('[name="runner"]').forEach(input=>input.onchange=()=>{state.runner=input.value;state.runnerChosen=true;savePreferences();syncControls()});
 document.querySelectorAll('[name="car"]').forEach(input=>input.onchange=()=>{state.car=input.value;savePreferences();syncControls()});
 document.querySelectorAll('[data-car]').forEach(preview=>{const paint=preview.getContext('2d'),car=cars.find(c=>c.id===preview.dataset.car);paint.clearRect(0,0,180,110);paint.save();paint.translate(90,102);paint.scale(.9,.9);drawCar(paint,car,0,false);paint.restore()});
 if($('chooseMode'))$('chooseMode').onclick=()=>showStart(true);
 $('startBtn').onclick=start;refresh();
}
function start(){
 unlockTravelAudio();state.mode='running';state.modeChosen=true;if(!isDriving())state.runnerChosen=true;savePreferences();state.dist=0;state.spawn=0;state.spawnCount=0;state.blueSpawned=0;state.trailExtension=0;state.boostTime=0;state.boostNotice=0;state.speed=isDriving()?.46:.39;
 state.objects=[];state.lane=state.targetLane=1;state.jump=state.slide=state.brake=state.stumble=0;state.brakeHeld=false;state.particles=[];state.transition=1;
 hide();renderUI();save();canvas.focus({preventScroll:true});
}
function sourceLinks(c){return `<div class="story-sources">${c.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener">${s.label} ↗</a>`).join('')}</div>`}
function story(){
 state.mode='story';state.brakeHeld=false;const c=chapters[state.chapter];beginReading('story-'+c.id,c.story.join(' '));
 show(`<div class="eyebrow">NEW DISCOVERY · ${state.chapter+1} / ${chapters.length}</div><div class="story-emblem">✦</div><h2>${c.name}</h2><div class="story-copy">${c.story.map(p=>`<p>${p}</p>`).join('')}</div><div class="takeaway">${c.lesson}</div>${sourceLinks(c)}${readingNote()}<button class="primary" id="storyNext">${c.verses?'Read the first five verses':'Try the activities'} ➜</button>`,'story-panel');
 $('storyNext').onclick=()=>readThen(()=>c.verses?versePage(0):quiz());audio('good');renderUI();
}
function versePage(index){
 state.mode='verses';const c=chapters[state.chapter],v=c.verses[index];beginReading('verse-'+c.id+'-'+index,v.arabic+' '+v.meaning);
 show(`<div class="eyebrow">THE FIRST REVELATION · SURAH AL-‘ALAQ</div><h2>Ayah ${v.n} of 5</h2><div class="verse-progress">${c.verses.map((v,i)=>`<span class="${i<=index?'read':''}"></span>`).join('')}</div><p class="quran-verse" lang="ar" dir="rtl">${v.arabic} <span class="ayah-number">${['١','٢','٣','٤','٥'][index]}</span></p><div class="verse-meaning"><span>SIMPLE EXPLANATION</span><p>${v.meaning}</p></div><a class="verse-source" href="https://quran.com/96/${v.n}" target="_blank" rel="noopener">Qur’an 96:${v.n} ↗</a>${readingNote()}<div class="verse-actions">${index?'<button class="secondary" id="previousAyah">← Previous</button>':''}<button class="primary" id="nextAyah">${index<4?'Next ayah ➜':'Try a question ➜'}</button></div>`,'verse-panel');
 if($('previousAyah'))$('previousAyah').onclick=()=>versePage(index-1);
 $('nextAyah').onclick=()=>readThen(()=>index<4?versePage(index+1):quiz());
}
let reading={key:'',elapsed:0,seconds:0};
function beginReading(key,text){if(reading.key!==key)reading={key,elapsed:0,seconds:Math.max(10,Math.min(45,Math.ceil(text.split(/\s+/).length/3)))};}
function readingTick(dt){if(!document.hidden&&['story','verses'].includes(state.mode)){reading.elapsed+=dt/1000;const hint=$('readingTime');if(hint)hint.textContent=reading.elapsed>=reading.seconds?'Ready when you are.':`Take your time · ${Math.ceil(reading.seconds-reading.elapsed)} seconds to read`;}}
function readThen(callback){if(reading.elapsed<reading.seconds){$('readingAdvice').textContent='That was quick! Please read slowly so you can answer the questions correctly. Take a little more time, then tap Next.';return}callback()}
function readingNote(){return '<p class="reading-time" id="readingTime">Take a moment to read.</p><p class="reading-advice" id="readingAdvice" role="status" aria-live="polite"></p>'}
function shuffled(items){const out=items.map((item,index)=>({item,index}));for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
let exercise={index:0,solved:false,selected:null,matched:[],dragId:null};
function quiz(index=0){
 state.mode='quiz';exercise={index,solved:false,selected:null,matched:[],dragId:null};const c=chapters[state.chapter],a=c.activities[index];
 const title={choice:'Choose an answer',truefalse:'True or false?',drop:'Complete the thought',match:'Find the pairs'}[a.type];
 let content='';
 if(a.type==='match')content=`<p class="activity-help">Tap an item on the left, then its partner on the right.</p><div class="match-board"><div>${a.pairs.map((p,i)=>`<button class="match-card" data-left="${i}">${p[0]}</button>`).join('')}</div><div>${shuffled(a.pairs).map(({item,index:i})=>`<button class="match-card" data-right="${i}">${item[1]}</button>`).join('')}</div></div>`;
 else if(a.type==='drop')content=`<p class="activity-help">Drag an answer into the space. You can also tap an answer, then tap the space.</p><button class="answer-slot" id="answerSlot" aria-label="Place selected answer here">Drop your answer here</button><div class="answer-bank">${shuffled(a.options).map(({item,index:i})=>`<button class="answer-token" draggable="true" data-token="${i}">${item}</button>`).join('')}</div>`;
 else content=`<div class="choices">${shuffled(a.options).map(({item,index:i})=>`<button class="choice" data-choice="${i}">${item}</button>`).join('')}</div>`;
 show(`<div class="eyebrow">ACTIVITY ${index+1} / ${c.activities.length}</div><h2>${title}</h2><p>${a.q}</p>${content}<div class="answer-feedback" id="feedback" role="status" aria-live="polite"></div><button class="text-button" id="readAgain">Read the story again</button><div id="storyRecap" class="story-recap" hidden>${c.story.map(p=>`<p>${p}</p>`).join('')}</div><button class="primary" id="continueJourney" hidden>${index+1<c.activities.length?'Next activity ➜':'Continue journey ➜'}</button>`,'quiz-panel');
 $('readAgain').onclick=()=>{$('storyRecap').hidden=!$('storyRecap').hidden};
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>checkAnswer(+b.dataset.choice,b));
 document.querySelectorAll('[data-left]').forEach(b=>b.onclick=()=>{if(exercise.solved||exercise.matched.includes(+b.dataset.left))return;exercise.selected=+b.dataset.left;document.querySelectorAll('[data-left]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))})});
 document.querySelectorAll('[data-right]').forEach(b=>b.onclick=()=>matchAnswer(+b.dataset.right));
 if(a.type==='drop'){
  const slot=$('answerSlot');slot.onclick=()=>{if(exercise.selected!==null)checkAnswer(exercise.selected,slot);else $('feedback').textContent='Choose an answer first.'};
  slot.ondragover=e=>e.preventDefault();slot.ondrop=e=>{e.preventDefault();if(exercise.dragId!==null)checkAnswer(exercise.dragId,slot);exercise.dragId=null};
  document.querySelectorAll('[data-token]').forEach(b=>{
   const select=()=>{if(exercise.solved)return;exercise.selected=+b.dataset.token;document.querySelectorAll('[data-token]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))})};
   b.onclick=select;b.ondragstart=e=>{select();exercise.dragId=+b.dataset.token;e.dataTransfer.setData('text/plain',b.dataset.token)};b.ondragend=()=>exercise.dragId=null;
   b.onpointerdown=e=>{if(e.pointerType==='mouse'||exercise.solved)return;select();b.setPointerCapture(e.pointerId)};
   b.onpointerup=e=>{if(e.pointerType==='mouse'||exercise.solved)return;const target=document.elementFromPoint(e.clientX,e.clientY);if(target&&target.closest('#answerSlot'))checkAnswer(+b.dataset.token,slot)};
  });
 }
 $('continueJourney').onclick=()=>{if(!exercise.solved)return;if(index+1<c.activities.length)quiz(index+1);else next()};
 renderUI();
}
function checkAnswer(value,button){
 if(exercise.solved)return;const a=chapters[state.chapter].activities[exercise.index];
 if(value===a.answer){if(a.type==='drop')$('answerSlot').textContent=a.options[value];button.classList.add('correct');solveActivity()}
 else{button.classList.add('wrong');$('feedback').textContent='Not quite. Read the story again and have another try.';audio('bad')}
}
function matchAnswer(value){
 if(exercise.solved||exercise.matched.includes(value))return;
 if(exercise.selected===null){$('feedback').textContent='Choose an item on the left first.';return}
 if(value!==exercise.selected){$('feedback').textContent='Those do not match yet. Try another partner.';audio('bad');return}
 exercise.matched.push(value);exercise.selected=null;
 for(const side of ['left','right']){const b=document.querySelector(`[data-${side}="${value}"]`);b.disabled=true;b.classList.remove('selected');b.classList.add('correct');b.setAttribute('aria-label',b.textContent+' — matched')}
 $('feedback').textContent=`${exercise.matched.length} pairs matched!`;audio('good');
 if(exercise.matched.length===chapters[state.chapter].activities[exercise.index].pairs.length)solveActivity();
}
function solveActivity(){
 if(exercise.solved)return;exercise.solved=true;const c=chapters[state.chapter],last=exercise.index===c.activities.length-1;
 document.querySelectorAll('[data-choice],[data-token]').forEach(b=>b.disabled=true);
 $('feedback').textContent='Well done!';if(last){const fresh=!state.completedIds.includes(c.id);if(fresh){state.completedIds.push(c.id);state.stars+=5;state.best=Math.max(state.best,state.stars)}$('feedback').textContent=fresh?'All activities complete! +5 discovery stars':'All activities complete!';save();renderUI()}
 $('continueJourney').hidden=false;audio('good');
}
// Synthesized effects: no external recording or copyrighted music.
let travelAudio=null,footstepClock=0;
function unlockTravelAudio(){
 if(!state.sound)return;try{const ac=audio.ac||(audio.ac=new(window.AudioContext||window.webkitAudioContext)());if(ac.state==='suspended')ac.resume();
 if(!travelAudio){const engine=ac.createOscillator(),gain=ac.createGain(),filter=ac.createBiquadFilter();engine.type='sawtooth';filter.type='lowpass';filter.frequency.value=240;gain.gain.value=0;engine.connect(filter).connect(gain).connect(ac.destination);engine.start();travelAudio={ac,engine,gain}}
 }catch(e){}
}
function travelSound(dt){
 if(!travelAudio)return;const{ac,engine,gain}=travelAudio;const live=state.sound&&state.mode==='running'&&!document.hidden;const driving=live&&isDriving();
 gain.gain.setTargetAtTime(driving?.025:0,ac.currentTime,.06);engine.frequency.setTargetAtTime((state.brakeHeld||state.brake>0?38:52+state.speed*48)*(state.boostTime>0?1.35:1),ac.currentTime,.1);
 if(!live||isDriving()||state.jump||state.slide){footstepClock=0;return}footstepClock+=dt;
 if(footstepClock>(state.boostTime>0?190:300)){footstepClock=0;const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.setValueAtTime(135,ac.currentTime);o.frequency.exponentialRampToValueAtTime(48,ac.currentTime+.07);g.gain.setValueAtTime(.09,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.085);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+.09)}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){travelSound(0);if(state.mode==='running')pause()}});

function next(){
 if(state.chapter===chapters.length-1){
  state.mode='complete';
  show(`<div class="eyebrow">JOURNEY COMPLETE</div><div class="story-emblem">✦</div><h2>A wonderful explorer!</h2><p>You have reached the end of ${chapters.length} story trails and collected ${state.stars} stars.</p><div class="takeaway">Take your new knowledge and kindness into every day.</div><button class="primary" id="again">Explore again ↻</button>`,'story-panel');
  $('again').onclick=()=>{state.chapter=0;start()};renderUI();
 }else{state.chapter++;start()}
}
function reviewStory(id){
 const c=chapters.find(c=>c.id===id);if(!c||!state.completedIds.includes(id))return;
 if(state.mode==='running')pause();
 const returnMode=state.mode;state.mode='review';
 show(`<div class="eyebrow">YOUR DISCOVERY</div><h2>${c.name}</h2><div class="story-copy">${c.story.map(p=>`<p>${p}</p>`).join('')}</div>${c.verses?`<div class="review-verses">${c.verses.map(v=>`<p lang="ar" dir="rtl">${v.arabic}</p><small>${v.meaning}</small>`).join('')}</div>`:''}<div class="takeaway">${c.lesson}</div>${sourceLinks(c)}<button class="primary" id="closeReview">Back to journey ➜</button>`,'story-panel');
 $('closeReview').onclick=()=>{if(returnMode==='paused'){state.mode='running';pause()}else{state.mode='menu';showStart()}renderUI()};
 renderUI();
}
function action(a){
 if(state.mode!=='running')return;
 if(a==='boost'){activateBoost();return}
 if(a==='left')state.targetLane=Math.max(0,state.targetLane-1);
 if(a==='right')state.targetLane=Math.min(2,state.targetLane+1);
 if(isDriving()){if(a==='brake'||a==='slide')state.brake=1.2;return}
 if(a==='jump'&&!state.jump){state.jump=.8;state.slide=0;jumpSound()}
 if(a==='slide'&&!state.slide){state.slide=.65;state.jump=0}
}
const keyActions={b:'boost',B:'boost',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'jump',w:'jump',' ':'jump',ArrowDown:'slide',s:'slide'};
document.addEventListener('keydown',e=>{
 if(state.mode!=='running'){if(e.key==='Escape'&&state.mode==='paused')resume();return}
 if(e.key==='Escape'){e.preventDefault();pause();return}
 if(e.target.matches('button,input,a,select,textarea'))return;
 let a=keyActions[e.key];if(!a)return;e.preventDefault();
 if(isDriving()&&[' ','ArrowDown','s'].includes(e.key)){state.brakeHeld=true;action('brake')}else if(!e.repeat)action(a);
});
document.addEventListener('keyup',e=>{if([' ','ArrowDown','s'].includes(e.key))state.brakeHeld=false});
document.querySelectorAll('[data-action]').forEach(b=>{
 b.onclick=()=>{action(b.dataset.action);if(state.mode==='running')canvas.focus({preventScroll:true})};
 if(b.dataset.action==='brake'){
  b.addEventListener('pointerdown',e=>{if(state.mode==='running'&&isDriving()){state.brakeHeld=true;action('brake');b.setPointerCapture(e.pointerId)}});
  const release=()=>state.brakeHeld=false;
  b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
 }
});
let sx=0,sy=0;
canvas.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
canvas.addEventListener('touchend',e=>{let dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;action(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy<0?'jump':isDriving()?'brake':'slide')},{passive:true});
function resume(){unlockTravelAudio();state.mode='running';hide();renderUI();canvas.focus({preventScroll:true})}
function pause(){
 if(state.mode!=='running')return;
 state.mode='paused';state.brakeHeld=false;
 show(`<div class="eyebrow">TAKE A BREATHER</div><h2>Paused</h2><p>${isDriving()?'Driving the '+selectedCar().name:'Running'} through ${chapters[state.chapter].region}.</p><button class="primary" id="resume">Keep ${isDriving()?'driving':'running'} ➜</button><button class="secondary" id="changeMode">Restart with another mode, character or car</button>`);
 $('resume').onclick=resume;
 $('changeMode').onclick=()=>{state.mode='menu';state.dist=0;state.objects=[];state.jump=state.slide=state.brake=0;showStart(true);renderUI()};renderUI();
}
$('pauseBtn').onclick=pause;
$('soundBtn').onclick=()=>{state.sound=!state.sound;if(state.sound)unlockTravelAudio();travelSound(0);renderUI();if(state.mode==='running')canvas.focus({preventScroll:true})};
addEventListener('blur',()=>{state.brakeHeld=false;if(state.mode==='running')pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode==='running')pause()});
function lerp(a,b,t){return a+(b-a)*t}function poly(pts,color){ctx.fillStyle=color;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill()}function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}function line(x,y,x2,y2,color,w=1){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
function roadProfile(){
 const c=chapters[state.chapter];
 if(c.climb||['hajar','safa','taif','uhud'].includes(c.id))return {kind:'mountain',bend:.18,width:.50,power:1.35,surface:'#a78d72',edge:'#d9bd94'};
 if(c.scene==='mountain')return {kind:'desert',bend:.085,width:.56,power:1.55,surface:'#cd9f61',edge:'#ead098'};
 return {kind:'town',bend:.045,width:.59,power:1.65,surface:'#d4b68d',edge:'#f0d8ad'};
}
function horizon(){const mountain=roadProfile().kind==='mountain';return H*(mountain?.37+Math.sin(state.dist*.012)*.025:.51)}
function skyline(t,c){
 const bg=assets[c.scene],night=!!c.night;
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,night?'#142441':'#78b7d7');sky.addColorStop(.6,night?'#485064':'#eebd77');sky.addColorStop(1,'#ab784c');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 if(ready(bg)){
  // The mountain composition uses only the empty lower valley, below the distant cave.
  const sourceY=c.scene==='mountain'?256:0,sourceH=bg.naturalHeight-sourceY;
  const zoom=1+(c.climb?state.dist/chapterLength()*.16:.018*Math.sin(state.motion*.00006));
  const targetY=c.scene==='mountain'?H*.1:0,targetH=H-targetY;
  const scale=Math.max(W/bg.naturalWidth,targetH/sourceH)*zoom,dw=bg.naturalWidth*scale,dh=sourceH*scale;
  const pan=Math.sin(state.motion*.00008)*Math.min(16,(dw-W)/3);
  ctx.drawImage(bg,0,sourceY,bg.naturalWidth,sourceH,(W-dw)/2+pan,targetY+(targetH-dh)*.48,dw,dh);
  if(c.scene==='mountain'){
   const haze=ctx.createLinearGradient(0,0,0,H*.3);haze.addColorStop(0,night?'#172b47':'#88bbd6');haze.addColorStop(.45,night?'#243955e8':'#e6c6a3e8');haze.addColorStop(1,'#e9bb7f00');ctx.fillStyle=haze;ctx.fillRect(0,0,W,H*.3);
  }
 }
 if(night){ctx.fillStyle='#071b49a6';ctx.fillRect(0,0,W,H);for(let i=0;i<38;i++){const x=(Math.sin(i*23.1)*.5+.5)*W,y=(Math.sin(i*31.7)*.5+.5)*H*.24;ellipse(x,y,i%4===0?1.5:.8,i%4===0?1.5:.8,'#fff4c4b0')}}
 const glow=ctx.createRadialGradient(W*.15,H*.15,0,W*.15,H*.15,W*.7);glow.addColorStop(0,night?'#b5d6ed08':'#ffd89127');glow.addColorStop(1,'#ffffff00');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
}
function project(lane,z){
 const q=Math.max(0,Math.min(1,z)),road=roadProfile(),phase=state.dist*.018+state.chapter*.72;
 const hill=road.kind==='mountain'?H*.035*Math.pow(Math.sin(Math.PI*q),2)*(.5+.5*Math.sin(phase*.65)):0;
 const y=horizon()+(H-horizon())*Math.pow(q,road.power)-hill;
 const half=lerp(W*.016,W*road.width,Math.pow(q,.9));
 const curve=(Math.sin(phase+(1-q)*4.8)-Math.sin(phase))*W*road.bend*Math.pow(1-q,1.3);
 const cx=W*.5+curve;
 return {x:cx+(lane-1)*half*.64,y,scale:.10+Math.pow(q,1.25)*1.65,half};
}
function roadStrip(z1,z2,left,right,color){
 const a=project(1,z1),b=project(1,z2);
 poly([[a.x+a.half*left,a.y],[a.x+a.half*right,a.y],[b.x+b.half*right,b.y],[b.x+b.half*left,b.y]],color);
}
function roadside(){
 const road=roadProfile(),night=!!chapters[state.chapter].night,flow=state.motion*.00018;
 // Recycle scenery from the horizon toward the camera using the road's own motion.
 const pieces=[];
 for(let i=0;i<16;i++){
  const z=(i/16+flow)%1;
  for(const side of [-1,1])pieces.push({i,side,z});
 }
 pieces.sort((a,b)=>a.z-b.z);
 for(const {i,side,z} of pieces){
  if(z<.025)continue;
  const p=project(1,z),variation=Math.sin(i*17.27+side*4.7),s=(.22+Math.pow(z,1.65)*2.5)*Math.min(W/760,1.25);
  const x=p.x+side*p.half*(1.14+(i%3)*.12),y=p.y;
  if(road.kind==='town'){
   const w=(30+(i%4)*7)*s,h=(40+(i%5)*9)*s,depth=9*s;
   ellipse(x,y,w*.65,Math.max(1,4*s),'#3a2d2740');
   poly([[x-w/2,y-h],[x-w/2-side*depth,y-h-4*s],[x-w/2-side*depth,y-4*s],[x-w/2,y]],night?'#5d6170':'#976b49');
   const face=ctx.createLinearGradient(x-w/2,y-h,x+w/2,y);face.addColorStop(0,night?'#777f8b':'#e9bd82');face.addColorStop(1,night?'#525c6a':'#aa784d');
   ctx.fillStyle=face;ctx.fillRect(x-w/2,y-h,w,h);
   poly([[x-w*.55,y-h],[x-w*.55,y-h-5*s],[x+w*.55,y-h-5*s],[x+w*.55,y-h]],night?'#a1a6aa':'#f4d4a0');
   for(let j=0;j<4;j++)ctx.fillRect(x-w*.48+j*w*.29,y-h-9*s,4*s,5*s);
   ctx.fillStyle=night?'#2d3b4a':'#554536';
   for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    const wx=x-w*.27+col*w*.39,wy=y-h*.73+row*h*.28,r=3*s;
    ctx.beginPath();ctx.moveTo(wx-r,wy+7*s);ctx.lineTo(wx-r,wy);ctx.quadraticCurveTo(wx,wy-5*s,wx+r,wy);ctx.lineTo(wx+r,wy+7*s);ctx.closePath();ctx.fill();
   }
   const doorX=x+side*w*.13;ctx.fillRect(doorX-5*s,y-13*s,10*s,13*s);
   if(i%4===0){const tx=x+side*w*.32,tw=6*s,th=h*.4;ctx.fillStyle=night?'#778794':'#c99868';ctx.fillRect(tx-tw/2,y-h-th,tw,th);poly([[tx-tw,y-h-th],[tx,y-h-th-7*s],[tx+tw,y-h-th]],night?'#a1a6aa':'#f0d09c')}
  }else{
   const w=(36+(i%4)*14)*s,h=(24+(i%5)*8)*s;
   ellipse(x,y,w*.6,Math.max(1,3*s),'#3e31293b');
   poly([[x-w*.65,y],[x-w*.49,y-h*.64],[x-w*.23,y-h*.58],[x+variation*w*.13,y-h],[x+w*.43,y-h*.53],[x+w*.65,y]],night?'#4f5966':road.kind==='mountain'?'#8c735e':'#ad835b');
   poly([[x-w*.65,y],[x-w*.49,y-h*.64],[x-w*.23,y-h*.58],[x+variation*w*.13,y-h],[x-w*.08,y-h*.27]],night?'#76818a':'#d2ae82');
   if(road.kind==='mountain'&&i%3===0)poly([[x+w*.16,y-h*.62],[x+w*.43,y-h*.53],[x+w*.65,y],[x+w*.48,y-h*.14]],night?'#394755':'#725f51');
  }
 }
}
function scenery(t){
 const c=chapters[state.chapter],night=!!c.night,road=roadProfile(),mountain=road.kind==='mountain';
 // Each projected strip follows the same bend as stars, obstacles and the player.
 for(let i=0;i<64;i++){
  const z1=i/64,z2=(i+1)/64,a=project(1,z1),b=project(1,z2);
  if(mountain){
   for(const side of [-1,1]){
    const edge=side*1.10,dropA=H*.095*Math.pow(z1,1.4),dropB=H*.095*Math.pow(z2,1.4);
    poly([[a.x+a.half*edge,a.y],[b.x+b.half*edge,b.y],[b.x+b.half*edge+side*b.half*.09,b.y+dropB],[a.x+a.half*edge+side*a.half*.09,a.y+dropA]],side<0?'#725846':'#55463d');
   }
   roadStrip(z1,z2,-1.10,1.10,night?'#58616b':'#94775d');
  }
  roadStrip(z1,z2,-1.03,1.03,night?'#13273b8a':'#573d3155');
  roadStrip(z1,z2,-1,1,night?'#7d7c78':road.surface);
  roadStrip(z1,z2,-1,-.977,night?'#a6adb3':road.edge);roadStrip(z1,z2,.977,1,night?'#a6adb3':road.edge);
 }
 const flow=state.motion*.00018;
 if(road.kind==='town'){
  // Alternating joints give town streets a warm stone-paved surface.
  for(let i=0;i<22;i++){
   const z=(i/22+flow)%1;
   roadStrip(z,Math.min(1,z+.004),-.97,.97,night?'#d2d1c53b':'#82674850');
   for(let j=0;j<6;j++){const x=-.97+(j+(i%2)*.5)*.323;if(x<.96)roadStrip(z,Math.min(1,z+.043),x,Math.min(.97,x+.008),'#7f694a30')}
  }
 }else if(mountain){
  // Irregular rock slabs and a few shoulder boulders replace the city paving.
  for(let i=0;i<30;i++){
   const z=(i/30+flow)%1,p=project(1,z),offset=Math.sin(i*18.3)*.75,x=p.x+p.half*offset;
   const sx=(3+z*13),sy=1+z*4;
   poly([[x-sx,p.y],[x-sx*.6,p.y-sy],[x+sx*.65,p.y-sy*.8],[x+sx,p.y+sy*.25],[x,p.y+sy]],i%2?'#85766565':'#d8c1a359');
   if(i%3===0){const side=i%2?1:-1,bx=p.x+side*p.half*1.11,r=3+z*15;
    poly([[bx-r,p.y],[bx-r*.7,p.y-r*.8],[bx+r*.3,p.y-r],[bx+r,p.y-r*.35],[bx+r*.7,p.y+r*.15]],night?'#596370':'#8b7564');
    poly([[bx-r*.7,p.y-r*.8],[bx+r*.3,p.y-r],[bx,p.y-r*.25],[bx-r,p.y]],night?'#85909b':'#c6aa85');
   }
  }
 }else{
  // Fine sand ripples and two wheel-worn tracks on the desert trail.
  for(let i=0;i<26;i++){
   const z=(i/26+flow)%1,p=project(1,z),x=p.x+Math.sin(i*9.8)*p.half*.85;
   line(x-p.scale*6,p.y,x+p.scale*9,p.y+1,night?'#aaa28d30':'#f5d49b70',Math.max(.5,p.scale));
  }
  for(let i=0;i<48;i++){const z=i/48,next=(i+1)/48;roadStrip(z,next,-.47,-.43,'#8b67421a');roadStrip(z,next,.43,.47,'#8b67421a')}
 }
 // Subtle guide dashes keep the three lanes readable on every surface.
 for(let i=0;i<15;i++){const z=(i/15+flow)%1;for(const edge of [-.326,.326])roadStrip(z,Math.min(1,z+.018),edge-.004,edge+.004,night?'#fff1c650':'#fff0c460')}
 if(c.climb){
  // A small natural opening comes closer as the mountain trail rises.
  const progress=state.dist/chapterLength(),end=project(1,0),size=lerp(15,37,progress);
  ctx.save();ctx.beginPath();ctx.moveTo(end.x-size*2.15,end.y+size*.4);ctx.lineTo(end.x-size*1.5,end.y-size*1.4);ctx.lineTo(end.x-size*.45,end.y-size*2.1);ctx.lineTo(end.x+size*.9,end.y-size*1.95);ctx.lineTo(end.x+size*1.75,end.y-size*.7);ctx.lineTo(end.x+size*2.2,end.y+size*.4);ctx.closePath();ctx.clip();
  if(ready(assets.mountain))ctx.drawImage(assets.mountain,650,280,400,310,end.x-size*2.2,end.y-size*2.15,size*4.4,size*2.6);
  else{ctx.fillStyle='#94735b';ctx.fillRect(end.x-size*2.2,end.y-size*2.15,size*4.4,size*2.6)}
  if(night){ctx.fillStyle='#152d4a66';ctx.fillRect(end.x-size*2.2,end.y-size*2.15,size*4.4,size*2.6)}ctx.restore();
  const dark=ctx.createLinearGradient(end.x-size*.4,end.y-size*1.4,end.x+size*.4,end.y);dark.addColorStop(0,'#101c26');dark.addColorStop(1,'#423e37');
  poly([[end.x-size*.43,end.y+2],[end.x-size*.54,end.y-size*.68],[end.x-size*.15,end.y-size*1.17],[end.x+size*.3,end.y-size*1.26],[end.x+size*.43,end.y-size*.61],[end.x+size*.34,end.y+2]],dark);
  line(end.x-size*.5,end.y-size*.68,end.x-size*.17,end.y-size*1.16,'#e5bc86',2);
 }
 if(c.landmark==='kaaba'){
  const x=W*.29,y=horizon()+8,s=Math.max(.65,Math.min(1.1,W/900));ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ellipse(0,0,55,9,'#40322150');poly([[-41,-68],[12,-79],[42,-61],[-12,-51]],'#252b30');poly([[-41,-68],[-12,-51],[-12,0],[-41,-15]],'#101a20');poly([[-12,-51],[42,-61],[42,-10],[-12,0]],'#212a2d');
  poly([[-41,-53],[-12,-37],[-12,-30],[-41,-46]],'#bc8f46');poly([[-12,-37],[42,-46],[42,-39],[-12,-30]],'#efc166');poly([[20,-30],[29,-32],[29,-10],[20,-9]],'#ca9f4c');ctx.restore();
 }
 roadside();
 const fog=ctx.createLinearGradient(0,horizon()-H*.04,0,horizon()+H*.1);fog.addColorStop(0,'#ffffff00');fog.addColorStop(.3,night?'#b8c3d31a':'#ffe0b337');fog.addColorStop(1,'#ffffff00');ctx.fillStyle=fog;ctx.fillRect(0,horizon()-H*.04,W,H*.14);
}
function objectDraw(o){if(o.collected)return;let p=project(o.lane,o.z),s=p.scale,x=p.x,y=p.y;if(o.type==='star'||o.type==='blueStar'){const blue=o.type==='blueStar';let bob=Math.sin(state.dist*.03+o.z*8)*5*s;ctx.save();ctx.translate(x,y-38*s+bob);ctx.rotate(state.dist*.015);ctx.fillStyle=blue?'#36baff':'#ffda55';ctx.strokeStyle=blue?'#d4f6ff':'#fff4c1';if(blue){ctx.shadowColor='#29baff';ctx.shadowBlur=14*s;}ctx.lineWidth=2*s;ctx.beginPath();for(let j=0;j<10;j++){let a=j*Math.PI/5-Math.PI/2,r=j%2?9*s:19*s;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}else if(o.type==='barrier'){ellipse(x,y,27*s,7*s,'#4c392650');ctx.fillStyle='#435962';ctx.fillRect(x-26*s,y-35*s,5*s,35*s);ctx.fillRect(x+21*s,y-35*s,5*s,35*s);ctx.fillStyle='#f8e6bd';ctx.fillRect(x-28*s,y-36*s,56*s,21*s);for(let i=0;i<3;i++)poly([[x+(-27+i*19)*s,y-36*s],[x+(-14+i*19)*s,y-36*s],[x+(-23+i*19)*s,y-15*s],[x+(-36+i*19)*s,y-15*s]],'#d78240')}else if(o.type==='crate'){ellipse(x,y,23*s,7*s,'#4c392650');ctx.fillStyle='#a06235';ctx.fillRect(x-19*s,y-32*s,38*s,30*s);ctx.strokeStyle='#6b3d25';ctx.lineWidth=3*s;ctx.strokeRect(x-19*s,y-32*s,38*s,30*s);line(x-18*s,y-31*s,x+18*s,y-3*s,'#d9a767',3*s)}else{ctx.fillStyle='#ceb27d';ctx.fillRect(x-26*s,y-55*s,52*s,7*s);ctx.fillRect(x-25*s,y-55*s,5*s,55*s);ctx.fillRect(x+20*s,y-55*s,5*s,55*s);ctx.fillStyle='#416c58';ctx.fillRect(x-21*s,y-53*s,42*s,7*s)}}
// Both player models are viewed from behind, facing the vanishing point.
function drawCar(g,car,steer=0,braking=false){
 const box=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
 const shape=(pts,color)=>{g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill()};
 g.save();g.scale(car.width,car.height);g.rotate(steer*.055);
 g.fillStyle='#14343e55';g.beginPath();g.ellipse(0,-1,48,11,0,0,Math.PI*2);g.fill();
 // Four wheels, the roof and rear window make the direction unmistakable.
 box(-43,-72,11,29,'#17313a');box(32,-72,11,29,'#17313a');
 box(-47,-33,12,31,'#112831');box(35,-33,12,31,'#112831');
 shape([[-29,-94],[29,-94],[42,-66],[44,-11],[-44,-11],[-42,-66]],car.dark);
 shape([[-29,-96],[29,-96],[38,-68],[-38,-68]],car.light);
 shape([[-24,-86],[24,-86],[31,-64],[-31,-64]],'#234959');
 shape([[-22,-84],[-2,-84],[-16,-66],[-28,-66]],'#75c3d2');
 shape([[-38,-62],[38,-62],[44,-31],[40,-8],[-40,-8],[-44,-31]],car.color);
 shape([[-35,-60],[35,-60],[37,-43],[-37,-43]],car.light);
 box(-39,-29,78,20,car.color);box(-38,-11,76,6,car.dark);
 box(-31,-29,17,8,braking?'#ff5e45':'#ba3042');box(14,-29,17,8,braking?'#ff5e45':'#ba3042');
 if(braking){g.shadowColor='#ff6949';g.shadowBlur=14;box(-30,-28,15,6,'#ff8265');box(15,-28,15,6,'#ff8265');g.shadowBlur=0}
 box(-10,-22,20,8,'#f3eed6');box(-36,-9,72,3,'#b5d3d0');
 if(car.id==='desert'){box(-30,-95,5,27,car.dark);box(25,-95,5,27,car.dark);box(-24,-39,48,5,car.dark)}
 if(car.id==='mint'){box(-5,-61,10,19,'#e5fff0');box(-5,-37,10,7,'#e5fff0')}
 g.restore();
}
function character(t){
 const p=project(state.lane,.8),x=p.x,ground=p.y,s=Math.max(.8,Math.min(1.17,W/720));
 if(isDriving()){
  ctx.save();ctx.translate(x,ground+(state.mode==='running'?Math.sin(state.motion*.02)*.7:0));ctx.scale(s*1.05,s*1.05);drawCar(ctx,selectedCar(),state.targetLane-state.lane,state.brake>0||state.brakeHeld);ctx.restore();return;
 }
 const jump=state.jump?Math.sin((.8-state.jump)/.8*Math.PI)*H*.16:0;
 ellipse(x,ground,27*s*(1-jump/H),7*s,'#2c293650');
 const sprite=runnerImage();
 if(ready(sprite)){
  const frameIndex=state.jump?2:Math.floor(state.motion/82)%8,cw=sprite.naturalWidth/4,ch=sprite.naturalHeight/2;
  const height=205*s,width=height*cw/ch;
  ctx.save();ctx.translate(x,ground-jump+5);ctx.rotate((state.targetLane-state.lane)*.025);
  if(state.slide){ctx.scale(1.1,.58);ctx.rotate(-.12)}
  ctx.drawImage(sprite,(frameIndex%4)*cw,Math.floor(frameIndex/4)*ch,cw,ch,-width/2,-height,width,height);
  ctx.restore();return;
 }
 // Fallback rig: hip positions stay fixed while knees and heels travel in depth.
 const phase=state.mode==='running'?state.motion*.012:0;
 ctx.save();ctx.translate(x,ground-jump);ctx.scale(s,s);if(state.slide)ctx.scale(1,.58);ctx.lineCap='round';
 for(const side of [-1,1]){
  const stride=Math.sin(phase+(side<0?0:Math.PI)),hipX=side*10,kneeY=-25-stride*5,footY=-4-Math.max(0,stride)*23;
  line(hipX,-39,hipX,kneeY,'#236066',12);line(hipX,kneeY,hipX,footY,'#20505a',10);
  ellipse(hipX,footY,8,5+Math.max(0,stride)*4,'#81543b');
  line(side*21,-74,side*25,-50+stride*8,'#f4e7cf',10);ellipse(side*25,-47+stride*8,4,5,'#c58a62');
 }
 poly([[-22,-83],[22,-83],[20,-38],[-20,-38]],'#f7ecd7');line(-15,-40,16,-40,'#cfbd99',2);
 if(state.runner==='girl'){ellipse(0,-105,21,23,'#218c91');poly([[-20,-103],[20,-103],[26,-77],[0,-71],[-26,-77]],'#24878b');ctx.restore();return}
 ctx.fillStyle='#c88d67';ctx.fillRect(-7,-94,14,12);ellipse(-17,-104,4,6,'#cd916a');ellipse(17,-104,4,6,'#cd916a');ellipse(0,-105,17,20,'#463025');
 ctx.fillStyle='#eee7d3';ctx.fillRect(-18,-121,36,14);ellipse(0,-121,18,7,'#fff9e7');ctx.restore();
}
function burst(x,y,color='#ffe6a0'){for(let i=0;i<12;i++)state.particles.push({x,y,vx:(Math.random()-.5)*7,vy:(Math.random()-.5)*8,life:1,color})}
function update(dt){
 if(state.mode!=='running')return;
 state.lane=lerp(state.lane,state.targetLane,1-Math.exp(-dt/65));
 state.brake=Math.max(0,state.brake-dt/1000);
 const boostPart=Math.min(dt,state.boostTime*1000);state.boostTime=Math.max(0,state.boostTime-dt/1000);state.boostNotice=Math.max(0,state.boostNotice-dt/1000);
 const braking=isDriving()&&(state.brakeHeld||state.brake>0),boostFactor=1+(dt>0?boostPart/dt:0)*.75,pace=(braking?.4:boostFactor)*(state.stumble>0?.65:1),step=dt*pace;syncBoost();
 state.motion+=step;state.dist+=step*state.speed*.055;state.transition=Math.max(0,state.transition-dt/650);
 const progress=state.dist/chapterLength();$('trailMessage').textContent=state.boostTime>0?'Speed boost · longer trail!':state.boostNotice>0?'Blue star collected — tap BOOST!':state.transition>.15?(roadProfile().kind==='mountain'?'Follow the winding mountain trail':roadProfile().kind==='desert'?'Follow the desert trail':'Follow the stone street'):progress>.88?'A new story is close…':'';
 state.speed=Math.min(isDriving()?.62:.6,state.speed+dt*.000003);state.spawn+=step;
 state.jump=Math.max(0,state.jump-dt/950);state.slide=Math.max(0,state.slide-dt/900);state.stumble=Math.max(0,state.stumble-dt/450);
 const brakeButton=document.querySelector('[data-action="brake"]');brakeButton.classList.toggle('braking',braking);brakeButton.setAttribute('aria-pressed',String(braking));
 if(state.spawn>790){
  state.spawn=0;state.spawnCount++;
  const blueDue=state.blueSpawned<2&&state.dist>=chapters[state.chapter].length*[.22,.58][state.blueSpawned];
  const roll=Math.random(),lane=blueDue?state.targetLane:Math.floor(Math.random()*3),type=blueDue?'blueStar':roll<.62?'star':isDriving()?'barrier':Math.random()<.65?'crate':'arch';
  if(blueDue){state.blueSpawned++;state.trailExtension=Math.min(420,state.trailExtension+80)}
  state.objects.push({lane,type,z:0,hit:false});
  if(Math.random()<.36)state.objects.push({lane:(lane+1+Math.floor(Math.random()*2))%3,type:'star',z:-.15,hit:false});
 }
 for(const o of state.objects){
  o.z+=step*.00044*(state.speed/.39);
  if(o.z>.8&&!o.hit){
   o.hit=true;
   if(Math.abs(state.lane-o.lane)<.43){
    if(o.type==='blueStar'){o.collected=true;state.boostCharges++;state.boostNotice=2;const pickup=project(o.lane,.8);burst(pickup.x,pickup.y-38*pickup.scale,'#60d7ff');audio('good');save();syncBoost()}
    else if(o.type==='star'){o.collected=true;state.stars++;state.best=Math.max(state.best,state.stars);const pickup=project(o.lane,.8);burst(pickup.x,pickup.y-38*pickup.scale);audio('good');save()}
    else if(isDriving()||(o.type==='crate'&&!state.jump)||(o.type==='arch'&&!state.slide)){
     state.stumble=.6;state.stars=Math.max(0,state.stars-2);audio('bad');save();
    }
   }
  }
 }
 state.objects=state.objects.filter(o=>!o.collected&&o.z<1.08);
 if(state.dist>=chapterLength()){story();renderUI()}
 $('progressFill').style.width=Math.min(100,state.dist/chapterLength()*100)+'%';$('starCount').textContent='✦ '+state.stars;$('bestCount').textContent='🏆 '+state.best;
}
function frame(time){
 const dt=Math.min(40,time-(state.last||time));state.last=time;readingTick(dt);update(dt);travelSound(dt);
 ctx.clearRect(0,0,W,H);skyline(state.motion,chapters[state.chapter]);scenery(state.motion);
 state.objects.filter(o=>o.z<=.8).sort((a,b)=>a.z-b.z).forEach(objectDraw);
 if(state.boostTime>0){
  const player=project(state.lane,.8);ctx.save();ctx.globalAlpha=.38;
  for(let i=0;i<8;i++){const z=(i/8+state.motion*.001)%1,side=i%2?1:-1;const x=player.x+side*(30+z*W*.2);line(x,player.y+z*H*.16,x+side*8,player.y+z*H*.16+14+z*22,'#9ce8ff',1+z*2)}ctx.restore();
 }
 character(state.motion);
 state.objects.filter(o=>o.z>.8).sort((a,b)=>a.z-b.z).forEach(objectDraw);
 for(const p of state.particles){ellipse(p.x,p.y,3*p.life,3*p.life,p.color||'#ffe6a0');if(state.mode==='running'){p.x+=p.vx;p.y+=p.vy;p.life-=.035}}
 state.particles=state.particles.filter(p=>p.life>0);
 if(state.stumble){ctx.fillStyle=`rgba(255,225,185,${state.stumble*.24})`;ctx.fillRect(0,0,W,H)}
 const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#052f3e35');shade.addColorStop(.18,'#052f3e00');shade.addColorStop(.78,'#052f3e00');shade.addColorStop(1,'#052f3e55');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
 requestAnimationFrame(frame);
}
renderUI();showStart();requestAnimationFrame(frame);
