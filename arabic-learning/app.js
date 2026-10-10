(function () {
  'use strict';
  const {WORLDS,STAGES,LESSONS,ALPHABET} = window.ARABIC_COURSE;
  const GAME_KEY='arabic-speaking', STORAGE='diinislaam-arabic-speaking-v1';
  const ACTIVITIES=['Discover','Listen','Match','Build a sentence','Meaning','Read a story','Speak aloud','Role-play','Checkpoint'];
  const AVATARS=['🌟','🦉','🦊','🐼','🦁','🐧','🦋','🐨','🐬','🌙'];
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim().toLowerCase();
  const strip=s=>String(s).replace(/[\u064B-\u065F\u0670]/g,'');
  const shuffle=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
  const dateKey=()=>new Date().toLocaleDateString('en-CA');
  const ar=(s,cls='')=>'<span lang="ar" dir="rtl" class="arabic '+cls+'">'+esc(s)+'</span>';
  const button=(text,action,cls='primary',extra='')=>'<button class="'+cls+'" data-action="'+action+'" '+extra+'>'+text+'</button>';
  const icon=n=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({
    map:'<path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/>',
    worlds:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
    book:'<path d="M12 5v16M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2Z"/>',
    play:'<rect x="3" y="5" width="18" height="14" rx="4"/><path d="M7 10v5M4.5 12.5h5M16 11h.01M19 14h.01"/>',
    chart:'<path d="M4 3v17h17M8 16v-4M13 16V8M18 16V5"/>',
    sound:'<path d="m11 4-5 4H3v8h3l5 4V4ZM15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14"/>',
    mute:'<path d="m11 4-5 4H3v8h3l5 4V4ZM16 9l5 6M21 9l-5 6"/>',
    cloud:'<path d="M6 18a4 4 0 0 1-.5-8 7 7 0 0 1 13-1 4.5 4.5 0 0 1-.5 9H6Z"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    back:'<path d="m15 5-7 7 7 7"/>',
    check:'<path d="m5 12 4 4 10-10"/>'
  }[n]||'')+'</svg>';
  let user=null,profile=fresh(),route='journey',viewWorld=0,cloudReady=false,authBusy=false,authWired=false;
  let syncState='local',syncTimer=null,saveQueue=Promise.resolve(),toastTimer=null,soundOn=true;
  let lessonSession=null,activityCleanup=null,currentAudio=null,currentUtterance=null;
  let activeStream=null,activeRecorder=null,recognizer=null,recordingUrl=null,recordTimer=null;
  let libraryTab='words',libraryQuery='',libraryWorld='all',practiceWorld=0,flashIndex=0,flashBack=false;
  let placement=null,initialAuthDone=false;
  const audioIndex={};
  Object.entries(window.ARABIC_ADVENTURE_AUDIO_MANIFEST?.ar||{}).forEach(([t,src])=>{audioIndex[norm(t)]='../'+src.replace(/^\/+/,'');});
  ALPHABET.forEach(l=>{if(audioIndex[norm(l[0])])audioIndex[norm(l[1])]=audioIndex[norm(l[0])];});
  function fresh(name='Explorer'){return {version:1,name,avatar:'🌟',done:{},activity:{},practice:{},daily:{},startAt:0,updatedAt:0,preferences:{roman:true,translation:true,fullScreenMap:false}};}
  function normaliseProfile(raw,name){
    const p=fresh(name);
    if(!raw||typeof raw!=='object')return p;
    p.name=name||String(raw.name||'Explorer').slice(0,40);
    p.avatar=AVATARS.includes(raw.avatar)?raw.avatar:'🌟';
    for(const field of ['done','activity','practice','daily'])if(raw[field]&&typeof raw[field]==='object'&&!Array.isArray(raw[field]))p[field]=raw[field];
    p.startAt=Math.min(138,Math.max(0,Math.floor(Number(raw.startAt)||0)));
    p.updatedAt=Number(raw.updatedAt)||0;
    if(raw.preferences&&typeof raw.preferences==='object')p.preferences={roman:raw.preferences.roman!==false,translation:raw.preferences.translation!==false,fullScreenMap:raw.preferences.fullScreenMap===true};
    Object.keys(p.done).forEach(k=>{if(!LESSONS[Number(k)-1]||!p.done[k]||typeof p.done[k]!=='object')delete p.done[k];});
    return p;
  }
  function localKey(){return STORAGE+'-'+(user?user.uid:'guest');}
  function readLocal(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
  function mergeProfiles(remote,local,name){
    const a=normaliseProfile(remote,name),b=normaliseProfile(local,name);
    if(!remote)return b;if(!local)return a;
    const newer=a.updatedAt>=b.updatedAt?a:b,older=newer===a?b:a;
    const p=normaliseProfile(newer,name);
    p.done={...older.done,...newer.done};
    Object.keys(p.done).forEach(id=>{const x=a.done[id],y=b.done[id];if(x&&y)p.done[id]=(Number(x.stars)||0)>=(Number(y.stars)||0)?x:y;});
    p.activity={...older.activity,...newer.activity};
    p.practice={...older.practice,...newer.practice};
    p.daily={...older.daily,...newer.daily};
    return p;
  }
  function xp(){return Object.values(profile.done).reduce((a,d)=>a+50+Math.min(3,Number(d.stars)||0)*10,0);}
  function completed(){return Object.keys(profile.done).length;}
  function totalStars(){return Object.values(profile.done).reduce((a,d)=>a+Math.min(3,Number(d.stars)||0),0);}
  function nextLesson(){for(let i=profile.startAt;i<LESSONS.length;i++)if(!profile.done[i+1])return LESSONS[i];return LESSONS[LESSONS.length-1];}
  function canStart(id){return id<=nextLesson().id||!!profile.done[id];}
  function worldDone(i){return WORLDS[i].lessons.filter(l=>profile.done[l.id]).length;}
  function streak(){
    let n=0,d=new Date();if(!profile.daily[dateKey()])d.setDate(d.getDate()-1);
    for(let i=0;i<730;i++){if(!profile.daily[d.toLocaleDateString('en-CA')])break;n++;d.setDate(d.getDate()-1);}return n;
  }
  function dailyMark(kind){
    const k=dateKey(),old=profile.daily[k]||{lessons:0,practice:0};
    profile.daily[k]={...old,[kind]:(Number(old[kind])||0)+1};
    // Keep compact records so every student's Firestore document stays bounded.
    const keys=Object.keys(profile.daily).sort();keys.slice(0,Math.max(0,keys.length-370)).forEach(k=>delete profile.daily[k]);
  }
  function save(immediate=false){
    profile.updatedAt=Date.now();
    try{localStorage.setItem(localKey(),JSON.stringify(profile));}catch{toast('Device storage is full. Keep this tab open; signed-in progress can still sync.');}
    if(user&&window.KidsCloud){
      syncState='pending';clearTimeout(syncTimer);
      if(immediate)syncNow();else syncTimer=setTimeout(syncNow,750);
    }else syncState='local';
    updateStats();
  }
  function syncNow(){
    if(!user||!window.KidsCloud)return;
    const snapshot=JSON.parse(JSON.stringify(profile)),uid=user.uid;
    saveQueue=saveQueue.catch(()=>{}).then(async()=>{
      if(!user||user.uid!==uid)return;
      try{await window.KidsCloud.saveProgress(GAME_KEY,snapshot);if(user&&user.uid===uid){syncState=profile.updatedAt===snapshot.updatedAt?'saved':'pending';updateStats();}}
      catch{if(user&&user.uid===uid){syncState='error';updateStats();}}
    });
  }
  function updateStats(){
    $('#xpStat').textContent=xp();$('#streakStat').textContent=streak();$('#profileName').textContent=profile.name;
    $('#profileAvatar').textContent=profile.avatar;$('#accountButton').textContent=user?'My account':'Sign in';
    $('#accountStatus').textContent=user?(syncState==='saved'?'Progress saved':syncState==='error'?'Saved here · sync pending':syncState==='pending'?'Saving your progress…':'Connected account'):'Practice on this device';
    $('#soundButton').innerHTML=icon(soundOn?'sound':'mute');
    $('#soundButton').setAttribute('aria-label',soundOn?'Turn sound off':'Turn sound on');
    document.querySelectorAll('[data-sync]').forEach(el=>{
      el.className='sync-note '+(syncState==='error'?'error':syncState==='pending'?'pending':'');
      el.textContent=syncState==='saved'?'☁ Progress saved':syncState==='pending'?'Saving…':syncState==='error'?'Saved here · retry sync':'Saved on this device';
    });
  }
  function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500);}
  function cheer(){
    if(!soundOn)return;
    try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const a=new C();[523.25,659.25,783.99].forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.05,a.currentTime+i*.09);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+i*.09+.2);o.start(a.currentTime+i*.09);o.stop(a.currentTime+i*.09+.22);});setTimeout(()=>a.close().catch(()=>{}),700);}catch{}
  }
  function stopAudio(){if(currentAudio){currentAudio.pause();currentAudio=null;}if('speechSynthesis'in window)window.speechSynthesis.cancel();currentUtterance=null;}
  async function speak(text,rate=.82,fail){
    if(!soundOn){toast('Turn sound on to listen.');if(fail)fail();return false;}
    stopAudio();
    const path=audioIndex[norm(text)];
    if(path){
      const a=new Audio(path);currentAudio=a;a.playbackRate=rate<.7?.8:1;
      try{await a.play();return true;}catch{}
    }
    if(!('speechSynthesis'in window)){toast('Audio is not available in this browser. Use the written model and practise with a parent or teacher.');if(fail)fail();return false;}
    const voices=window.speechSynthesis.getVoices(),voice=voices.find(v=>/^ar(-|_)/i.test(v.lang))||voices.find(v=>v.lang==='ar');
    if(!voice){toast('No Arabic voice is available on this device. Arabic recordings still work for many letter and word cards.');if(fail)fail();return false;}
    const utterance=new SpeechSynthesisUtterance(String(text));utterance.lang=voice.lang;utterance.voice=voice;utterance.rate=rate;currentUtterance=utterance;
    utterance.onerror=e=>{if(e.error!=='canceled'&&e.error!=='interrupted'){toast('The voice could not play. Try again or use the written model.');if(fail)fail();}};
    speechSynthesis.speak(utterance);return true;
  }
  function renderNav(){
    const links=[['journey','map','Journey'],['worlds','worlds','Worlds'],['library','book','Library'],['practice','play','Practice'],['progress','chart','Progress']];
    $('#navigation').innerHTML=links.map(([r,i,t])=>'<button class="nav-button '+(route===r?'active':'')+'" data-action="navigate" data-route="'+r+'" '+(route===r?'aria-current="page"':'')+'>'+icon(i)+'<span>'+t+'</span></button>').join('');
    $('#breadcrumb').textContent=route==='lesson'?'World '+(lessonSession.world+1)+' · Lesson '+lessonSession.lesson.id:links.find(x=>x[0]===route)?.[2]||'Arabic Adventure';
  }
  function changeRoute(r){
    cleanActivity();stopMedia();stopAudio();lessonSession=null;route=r;render();window.scrollTo({top:0,behavior:'instant'});
  }
  function render(){
    document.body.classList.toggle('map-fullscreen-mode',route==='journey'&&!!profile.preferences.fullScreenMap);
    renderNav();updateStats();
    if(route==='journey')renderJourney();else if(route==='worlds')renderWorlds();else if(route==='library')renderLibrary();else if(route==='practice')renderPractice();else if(route==='progress')renderProgress();else if(route==='lesson')renderLesson();
  }
  function heading(title,sub,tag){
    return '<div class="page-heading"><div><div class="eyebrow">DIIN ISLAAM · ARABIC ADVENTURE</div><h1>'+esc(title)+'</h1>'+(sub?'<p class="intro-text">'+esc(sub)+'</p>':'')+'</div>'+(tag?'<span class="pill">'+esc(tag)+'</span>':'')+'</div>';
  }
  function stageTabs(){return '<div class="stage-tabs" aria-label="Course stages">'+STAGES.map((s,i)=>'<button class="stage-tab '+(Math.floor(viewWorld/4)===i?'active':'')+'" data-action="stage" data-stage="'+i+'"><span>'+s.icon+'</span>'+esc(s.name)+'</button>').join('')+'</div>';}
  function artStyle(stage){return '--bg-x:'+([0,50,100][stage%3])+'%;--bg-y:'+(stage<3?0:100)+'%;';}
  function renderJourney(){
    const w=WORLDS[viewWorld],next=nextLesson(),active=w.lessons.find(l=>!profile.done[l.id]&&canStart(l.id))||w.lessons[0],done=worldDone(viewWorld);
    const coords=[[22,75],[53,66],[77,51],[53,37],[23,29],[52,13]];
    const path='M220 750 C250 625 420 700 530 660 S790 640 770 510 S430 475 530 370 S160 420 230 290 S345 130 520 130';
    const nodes=w.lessons.map((l,j)=>{
      const d=profile.done[l.id],current=!d&&canStart(l.id)&&l.id===next.id,locked=!canStart(l.id);
      return '<button class="lesson-node '+(d?'complete':current?'current':locked?'locked':'')+'" style="left:'+coords[j][0]+'%;top:'+coords[j][1]+'%" data-action="open-lesson" data-lesson="'+l.id+'" aria-label="Lesson '+l.id+': '+esc(l.title)+(d?', completed':locked?', preview':', start')+'"><span class="node-circle">'+(d?'✓':locked?icon('lock'):j+1)+'</span><span class="node-label">'+esc(l.title)+'</span>'+(d?'<span class="node-stars">'+'★'.repeat(Number(d.stars)||1)+'</span>':'')+'</button>';
    }).join('');
    const stage=STAGES[w.stage],allDone=completed()===LESSONS.length;
    $('#main').innerHTML=heading('Your next little adventure',user?'Welcome back, '+profile.name+'. Let’s make Arabic part of your day.':'Learn a little. Play a little. Say something new.','24 worlds · 144 lessons')+stageTabs()+
      '<div class="world-layout"><div><section class="journey-panel"><div class="map-heading"><div><div class="label">World '+w.id+' / 24 · '+esc(stage.label)+'</div><h2>'+esc(w.title)+'</h2><div>'+ar(w.arabic)+'</div></div><div class="map-step"><button data-action="previous-world" aria-label="Previous world" '+(viewWorld===0?'disabled':'')+'>‹</button><button data-action="next-world" aria-label="Next world" '+(viewWorld===23?'disabled':'')+'>›</button><button class="map-expand" data-action="toggle-map-fullscreen" aria-label="Open journey map full screen" title="Open full screen">⛶ <span>Full screen</span></button></div></div><div class="map" style="'+artStyle(w.stage)+'"><button class="map-exit" data-action="exit-map-fullscreen">← Return to course</button><span class="map-flag">'+w.icon+' '+(done===6?'World complete':!canStart(w.lessons[0].id)?'Explore this world':'Your speaking journey')+'</span><svg class="map-path" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path class="path-shadow" d="'+path+'"/><path class="path-core" d="'+path+'"/></svg>'+nodes+'</div><div class="map-footer"><span>'+done+' of 6 lessons complete</span><span>9 activities in every lesson</span></div><div class="progress-track"><div class="progress-fill" style="width:'+(done/6*100)+'%"></div></div></section><div class="under-map">'+button('World guide','world-guide','text-button')+'<span data-sync></span>'+button('Choose a starting point','placement','text-button')+'</div></div>'+
      '<div class="side-stack"><section class="card next-card"><div class="eyebrow">'+(allDone?'JOURNEY COMPLETE':done===6?'REVISIT A FAVOURITE':'YOUR NEXT LESSON')+'</div><div class="big-icon">'+(viewWorld===0?'🔤':w.icon)+'</div><h3>'+esc(active.title)+'</h3><p>'+esc(w.goal)+'</p><div class="activity-chips"><span>Listen</span><span>Play</span><span>Speak</span></div>'+button(profile.activity[active.id]&&!profile.done[active.id]?'Continue lesson':canStart(active.id)?'Start this lesson':'Preview this lesson','open-lesson','primary','data-lesson="'+active.id+'"')+'<p class="small" style="margin-top:12px">About '+(w.stage>3?'15–20':'10–15')+' minutes · Work at your pace</p></section><section class="card daily-card"><h3>☀️ A little every day</h3><p>Your goal: one lesson and one speaking practice.</p><div class="goal-track"><div style="width:'+Math.min(100,((profile.daily[dateKey()]?.lessons||0)+(profile.daily[dateKey()]?.practice||0))/2*100)+'%"></div></div><small>'+((profile.daily[dateKey()]?.lessons||0)>0?'Lesson complete':'One lesson to explore')+' · '+((profile.daily[dateKey()]?.practice||0)>0?'Speaking practised':'A voice to use')+'</small></section><button class="card mini-card" data-action="navigate" data-route="practice"><span>🎤</span><span><b>Speaking studio</b><small>Practise with your own voice</small></span></button></div></div>';
    document.body.classList.toggle('map-fullscreen-mode',!!profile.preferences.fullScreenMap);
    updateStats();
  }
  function renderWorlds(){
    $('#main').innerHTML=heading('A whole world of Arabic','Start with sounds. Grow into stories, discussions and your own voice.','144 original lessons')+
      STAGES.map((s,i)=>'<section><div class="section-title"><span>'+s.icon+'</span><div><h2>'+esc(s.name)+'</h2><small>'+esc(s.goal)+'</small></div></div><div class="world-catalog">'+WORLDS.filter(w=>w.stage===i).map(w=>'<button class="card world-card" data-action="select-world" data-world="'+(w.id-1)+'"><div class="world-art" style="'+artStyle(i)+'"><span class="world-number">WORLD '+w.id+'</span></div><div class="world-card-content"><h3>'+esc(w.title)+'</h3><p>'+esc(w.goal)+'</p><div class="progress-track"><div class="progress-fill" style="width:'+(worldDone(w.id-1)/6*100)+'%"></div></div><div class="world-foot"><span>'+worldDone(w.id-1)+'/6 complete</span><span>'+(canStart(w.lessons[0].id)?'Explore':'Preview available')+'</span></div></div></button>').join('')+'</div></section>').join('');
  }
  function worldGuide(){
    const w=WORLDS[viewWorld];
    openModal('World '+w.id+' · '+w.title,'<p class="muted">'+esc(w.goal)+'</p><div class="instruction">'+esc(w.guide)+'</div><h3>Six learning stops</h3><ol class="guide-list">'+w.lessons.map(l=>'<li><b>'+esc(l.title)+'</b><br><span class="muted small">'+esc(l.note)+'</span></li>').join('')+'</ol>'+button('Go to the first lesson','open-lesson','primary','data-lesson="'+w.lessons[0].id+'"'));
  }
  function openLesson(id,allowPreview=false){
    const l=LESSONS[id-1];if(!l)return;
    if(!canStart(id)&&!allowPreview){
      openModal('Explore '+l.title,'<p class="muted">This stop comes later in your journey. You can preview all its activities now, or continue your next lesson to earn progress in order.</p><div class="instruction">'+esc(l.note)+'</div><div class="button-row">'+button('Preview the lesson','preview-lesson','secondary','data-lesson="'+id+'"')+button('Continue my journey','continue-journey')+'</div>');return;
    }
    closeModal();cleanActivity();stopMedia();stopAudio();
    const saved=profile.activity[id],step=profile.done[id]?0:Math.min(8,Math.max(0,Number(saved?.step)||0));
    lessonSession={lesson:l,world:l.world,step,preview:!canStart(id),passed:false,attempts:Number(saved?.attempts)||0,started:Date.now(),quizScore:0};
    route='lesson';viewWorld=l.world;render();window.scrollTo({top:0,behavior:'instant'});
  }
  function cleanActivity(){if(activityCleanup){activityCleanup();activityCleanup=null;}}
  function renderLesson(){
    if(!lessonSession)return;
    cleanActivity();stopAudio();stopMedia();
    const s=lessonSession,l=s.lesson,step=s.step;s.passed=false;
    $('#main').innerHTML='<div class="lesson-header">'+button(icon('back'),'leave-lesson','icon-button','aria-label="Back to the map"')+'<div class="progress-track"><div class="progress-fill" style="width:'+(step/9*100)+'%"></div></div><span class="lesson-counter">'+(step+1)+' / 9</span></div><div class="lesson-layout"><nav class="activity-rail" aria-label="Lesson activities">'+ACTIVITIES.map((n,i)=>'<button class="activity-tab '+(i===step?'active':i<step?'done':'')+'" data-action="activity-step" data-step="'+i+'" '+(i>step?'disabled':'')+'><span>'+(i<step?'✓':i+1)+'</span><span class="activity-label">'+esc(n)+'</span></button>').join('')+'</nav><section class="card activity-card"><div class="activity-top"><div class="eyebrow">WORLD '+(l.world+1)+' · LESSON '+l.id+(s.preview?' · PREVIEW':'')+'</div><h2 id="activityTitle"></h2><p id="activityInstruction"></p></div><div class="activity-body" id="activityBody"></div><div class="activity-bottom"><div class="feedback" id="feedback" role="status" aria-live="polite"></div><button class="primary" id="activityNext" data-action="next-activity" disabled>Continue</button></div></section></div>';
    renderNav();
    const methods=[discoverActivity,listeningActivity,matchingActivity,builderActivity,meaningActivity,storyActivity,speakingActivity,roleplayActivity,quizActivity];
    methods[step]();
  }
  function setActivity(title,instruction,body){$('#activityTitle').textContent=title;$('#activityInstruction').textContent=instruction;$('#activityBody').innerHTML=body;}
  function feedback(message,kind=''){$('#feedback').textContent=message;$('#feedback').className='feedback '+kind;}
  function pass(message='Well done. Keep going!'){lessonSession.passed=true;$('#activityNext').disabled=false;feedback(message,'good');}
  function miss(message='Have another look and try again.'){lessonSession.attempts++;feedback(message,'bad');}
  function phraseModel(l,options={}){
    const roman=(options.forceRoman||profile.preferences.roman)&&WORLDS[l.world].stage<4;
    return '<div class="model-phrase">'+ar(l.ar,'ar-lg')+(options.translation!==false?'<div class="translation">'+esc(l.en)+'</div>':'')+(roman?'<div class="roman">'+esc(l.roman)+'</div>':'')+'<div class="phrase-tools">'+button('🔊 Listen','speak-text','', 'data-text="'+esc(l.ar)+'"')+button('🐢 Slowly','speak-text','','data-text="'+esc(l.ar)+'" data-rate=".6"')+'</div></div>';
  }
  function discoverActivity(){
    const l=lessonSession.lesson,w=WORLDS[l.world],words=Array.from({length:3},(_,i)=>w.words[(l.order+i)%w.words.length]);
    setActivity('Meet your new words','Listen, look at the meaning, then say the model aloud.',phraseModel(l)+'<div class="instruction">'+esc(l.note)+'</div><div class="word-row">'+words.map(wordCard).join('')+'</div>');
    pass('Read the tip and try saying the model before continuing.');
  }
  function wordCard(w){return '<button class="word-card" data-action="speak-text" data-text="'+esc(w.ar)+'" aria-label="Listen to '+esc(w.en)+'"><span class="word-icon">'+esc(w.icon)+'</span>'+ar(w.ar)+'<small>'+esc(w.en)+'</small></button>';}
  function listeningActivity(){
    const l=lessonSession.lesson,w=WORLDS[l.world],target=w.stage>2?{ar:l.ar,en:l.en}:w.words[l.order%w.words.length];
    const alternatives=w.stage>2?w.lessons.filter(x=>x.id!==l.id).map(x=>({ar:x.ar,en:x.en})):w.words.filter(x=>x.ar!==target.ar);
    const choices=shuffle([target,...shuffle(alternatives).slice(0,3)]);let ready=false;
    setActivity('What did you hear?','Tap the speaker, then choose the meaning. You can listen as often as you like.',
      '<button class="listen-orb" id="listenModel" aria-label="Play the Arabic listening model">🔊</button><div id="listeningFallback" class="hidden"><p class="small muted">Audio is unavailable here. Read the same model, then match its meaning.</p>'+ar(target.ar,'ar-lg')+'</div><div class="choices">'+choices.map((c,i)=>'<button class="choice" data-listen="'+i+'" disabled>'+esc(c.en)+'</button>').join('')+'</div>'+button('Show the written model','listen-hint','text-button'));
    const reveal=()=>{$('#listeningFallback').classList.remove('hidden');ready=true;document.querySelectorAll('[data-listen]').forEach(b=>b.disabled=false);};
    $('#listenModel').onclick=async()=>{await speak(target.ar,.8,reveal);ready=true;document.querySelectorAll('[data-listen]').forEach(b=>b.disabled=false);};
    $('[data-action="listen-hint"]').onclick=reveal;
    document.querySelectorAll('[data-listen]').forEach(b=>b.onclick=()=>{
      if(!ready||lessonSession.passed)return;
      const c=choices[Number(b.dataset.listen)];if(c.ar===target.ar){b.classList.add('correct');document.querySelectorAll('[data-listen]').forEach(x=>x.disabled=true);pass('You matched the Arabic to its meaning.');cheer();}else{b.classList.add('incorrect');miss('Listen again. The model means something else.');}
    });
  }
  function matchingActivity(){
    const l=lessonSession.lesson,w=WORLDS[l.world],words=Array.from({length:4},(_,i)=>w.words[(l.order+i)%w.words.length]);let selected=null,matched=0;
    const left=shuffle(words.map((x,i)=>({word:x,id:i}))),right=shuffle(words.map((x,i)=>({word:x,id:i})));
    setActivity('Find the word partners','Tap an Arabic word, then tap its English meaning.',
      '<div class="matching"><div class="matching-column">'+left.map(x=>'<button class="match-tile arabic" lang="ar" dir="rtl" data-side="ar" data-pair="'+x.id+'">'+esc(x.word.ar)+'</button>').join('')+'</div><div class="matching-column">'+right.map(x=>'<button class="match-tile" data-side="en" data-pair="'+x.id+'">'+esc(x.word.en)+'</button>').join('')+'</div></div>');
    document.querySelectorAll('[data-pair]').forEach(b=>b.onclick=()=>{
      if(b.disabled)return;
      if(!selected||selected.dataset.side===b.dataset.side){if(selected)selected.classList.remove('selected');selected=b;b.classList.add('selected');if(b.dataset.side==='ar')speak(words[Number(b.dataset.pair)].ar);return;}
      if(selected.dataset.pair===b.dataset.pair){for(const x of [selected,b]){x.classList.remove('selected');x.classList.add('matched');x.disabled=true;}selected=null;matched++;cheer();if(matched===4)pass('All four partners found!');else feedback(matched+' of 4 pairs found.','good');}
      else{selected.classList.remove('selected');selected.classList.add('wrong');b.classList.add('wrong');const prev=selected;selected=null;setTimeout(()=>{prev.classList.remove('wrong');b.classList.remove('wrong');},600);miss('Those two are different. Try another partner.');}
    });
  }
  function builderActivity(){
    const l=lessonSession.lesson,correct=l.ar.split(/\s+/),items=shuffle(correct.map((word,id)=>({word,id})));let picked=[];
    setActivity('Build it in Arabic','Tap the tiles in order, starting from the right. Tap a placed tile to return it.',
      '<p>'+esc(l.en)+'</p><div class="sentence-target" id="sentenceTarget" lang="ar" dir="rtl"></div><div class="word-bank" id="wordBank"></div><div class="button-row">'+button('Check my sentence','check-builder','secondary')+button('Start again','clear-builder','text-button')+'</div>');
    const draw=()=>{
      $('#sentenceTarget').innerHTML=picked.map(id=>'<button class="token chosen" data-return="'+id+'">'+esc(correct[id])+'</button>').join('');
      $('#wordBank').innerHTML=items.filter(x=>!picked.includes(x.id)).map(x=>'<button class="token" data-token="'+x.id+'">'+esc(x.word)+'</button>').join('');
      document.querySelectorAll('[data-token]').forEach(b=>b.onclick=()=>{if(lessonSession.passed)return;picked.push(Number(b.dataset.token));draw();});
      document.querySelectorAll('[data-return]').forEach(b=>b.onclick=()=>{if(lessonSession.passed)return;picked=picked.filter(id=>id!==Number(b.dataset.return));draw();});
    };
    $('[data-action="check-builder"]').onclick=()=>{
      if(lessonSession.passed)return;
      if(picked.length===correct.length&&norm(picked.map(i=>correct[i]).join(' '))===norm(l.ar)){pass('A complete Arabic thought. Say it once more.');speak(l.ar);cheer();}
      else miss(picked.length<correct.length?'Use every tile to finish the sentence.':'Look at the Arabic word order and try again.');
    };
    $('[data-action="clear-builder"]').onclick=()=>{if(lessonSession.passed)return;picked=[];draw();feedback('Start on the right, then follow the meaning.');};
    draw();
  }
  function meaningActivity(){
    const l=lessonSession.lesson,w=WORLDS[l.world],choices=shuffle([l.en,...shuffle(w.lessons.filter(x=>x.id!==l.id).map(x=>x.en)).slice(0,3)]);
    setActivity('Understand the whole idea','Read the Arabic and choose the complete meaning.',ar(l.ar,'ar-lg')+'<div class="choices">'+choices.map((c,i)=>'<button class="choice" data-meaning="'+i+'">'+esc(c)+'</button>').join('')+'</div><div class="instruction">'+esc(l.note)+'</div>');
    document.querySelectorAll('[data-meaning]').forEach(b=>b.onclick=()=>{
      if(lessonSession.passed)return;
      if(choices[Number(b.dataset.meaning)]===l.en){b.classList.add('correct');pass('Meaning and words belong together.');cheer();}else{b.classList.add('incorrect');miss('Read the complete idea, including time, person and key details.');}
    });
  }
  function storyActivity(){
    const l=lessonSession.lesson,w=WORLDS[l.world],check=w.checks[l.order],choices=shuffle([check.answer,...check.wrong]);
    setActivity(w.stage>3?'Read between the details':'A little story','Read for meaning. Use the translation only when you need it.',
      '<div class="story-text" lang="ar" dir="rtl" id="storyArabic">'+esc(w.story.ar)+'</div><div class="button-row">'+button('🔊 Listen to the story','speak-text','secondary','data-text="'+esc(w.story.ar)+'"')+button('English meaning','toggle-story','text-button')+button('Vowel marks','toggle-vowels','text-button')+'</div><div id="storyEnglish" class="story-english hidden">'+esc(w.story.en)+'</div><p class="story-question">'+esc(check.q)+'</p><div class="choices">'+choices.map((c,i)=>'<button class="choice" data-story-answer="'+i+'">'+esc(c)+'</button>').join('')+'</div>');
    $('[data-action="toggle-story"]').onclick=()=>$('#storyEnglish').classList.toggle('hidden');
    let vowels=true;$('[data-action="toggle-vowels"]').onclick=()=>{vowels=!vowels;$('#storyArabic').textContent=vowels?w.story.ar:strip(w.story.ar);};
    document.querySelectorAll('[data-story-answer]').forEach(b=>b.onclick=()=>{
      if(lessonSession.passed)return;
      if(choices[Number(b.dataset.storyAnswer)]===check.answer){b.classList.add('correct');pass('You used the story to find the answer.');cheer();}else{b.classList.add('incorrect');miss('Return to the story and look for the detail that answers this question.');}
    });
  }
  function speakingActivity(){
    const l=lessonSession.lesson,w=WORLDS[l.world],duration=[8,10,15,20,30,40][w.stage];
    setActivity('Make it your own voice','Listen to the model. Say it aloud, then adapt it to your own idea.',
      phraseModel(l)+'<div class="instruction">'+esc(l.note)+(w.stage>2?'<br><b>Now speak beyond the model:</b> Answer the question below in your own words. Add a reason or example. Aim for '+(w.stage>3?'60–90':'30–45')+' seconds.':'<br><b>Your turn:</b> Repeat the model, then change one detail. Ask a partner the question below.')+'</div><div class="conversation-bubble">'+ar(l.ask)+'<div class="small muted">'+esc(l.askEn)+'</div></div><div class="speaking-controls"><button class="record-button" id="recordButton">🎙 Record my voice</button><button class="secondary" id="aloudButton">Practise aloud</button>'+((window.SpeechRecognition||window.webkitSpeechRecognition)?'<button class="teal" id="recogniseButton">Check recognised words</button>':'')+'</div><p class="small muted" id="voiceStatus">Recording stays in this tab. Optional speech recognition uses your browser’s speech service; it checks text, not pronunciation.</p><div id="playback"></div><div class="speaking-checks"><label><input type="checkbox" class="speech-check"> I tried the model aloud and understood its meaning.</label><label><input type="checkbox" class="speech-check"> I used my own voice, and tried a change or an extra idea.</label><label><input type="checkbox" class="speech-check"> I listened back or asked a partner for feedback.</label></div>');
    let practised=false,aloudTimer=null;
    function update(){if(practised&&Array.from(document.querySelectorAll('.speech-check')).every(x=>x.checked)){
      if(!lessonSession.passed&&(!lessonSession.preview||lessonSession.practiceMode)){
        const old=profile.practice[l.id];
        if(!old?.at||new Date(old.at).toLocaleDateString('en-CA')!==dateKey())dailyMark('practice');
        profile.practice[l.id]={at:Date.now(),kind:'self-practice'};save();
      }
      pass('Speaking practice completed. Keep using your voice with a real partner.');
    }}
    document.querySelectorAll('.speech-check').forEach(c=>c.onchange=update);
    $('#aloudButton').onclick=()=>{
      const btn=$('#aloudButton');btn.disabled=true;let remain=duration;$('#voiceStatus').textContent='Say the model and your own answer aloud. '+remain+' seconds of practice time.';
      aloudTimer=setInterval(()=>{remain--;if(!$('#voiceStatus')){clearInterval(aloudTimer);return;}$('#voiceStatus').textContent=remain>0?'Practise aloud. '+remain+' seconds…':'Now check the three statements when they are true for you.';
        if(remain<=0){clearInterval(aloudTimer);practised=true;btn.textContent='✓ Aloud practice ready';update();}},1000);
    };
    $('#recordButton').onclick=async()=>{
      if(activeRecorder&&activeRecorder.state==='recording'){activeRecorder.stop();return;}
      if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){$('#voiceStatus').textContent='This browser cannot record. Use Practise aloud and a parent or partner instead.';return;}
      try{
        stopAudio();const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        if(!$('#recordButton')||route!=='lesson'||lessonSession.lesson.id!==l.id||lessonSession.step!==6){stream.getTracks().forEach(t=>t.stop());return;}
        activeStream=stream;const recorder=new MediaRecorder(stream);activeRecorder=recorder;const chunks=[],started=Date.now(),btn=$('#recordButton');
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
        recorder.onstop=()=>{
          stream.getTracks().forEach(t=>t.stop());activeStream=null;clearTimeout(recordTimer);activeRecorder=null;
          if(!$('#playback')||route!=='lesson'||lessonSession.lesson.id!==l.id||lessonSession.step!==6)return;
          if(recordingUrl)URL.revokeObjectURL(recordingUrl);
          recordingUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));
          $('#playback').innerHTML='<audio controls src="'+recordingUrl+'"></audio>';
          btn.textContent='🎙 Record again';btn.classList.remove('recording');
          if(Date.now()-started>=3000){practised=true;$('#voiceStatus').textContent='Listen back, compare with the model, then complete the self-check.';update();}
          else $('#voiceStatus').textContent='Try a little longer so you can hear your full phrase. Practise aloud is also available.';
        };
        recorder.start();btn.textContent='■ Stop recording';btn.classList.add('recording');$('#voiceStatus').textContent='Recording… say your model, then your own answer. Tap Stop when finished.';
        recordTimer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},w.stage>3?180000:90000);
      }catch{if($('#voiceStatus'))$('#voiceStatus').textContent='Microphone access was not granted or is unavailable. You can still use Practise aloud.';}
    };
    if($('#recogniseButton'))$('#recogniseButton').onclick=()=>{
      stopAudio();const R=window.SpeechRecognition||window.webkitSpeechRecognition;recognizer=new R();recognizer.lang='ar-SA';recognizer.interimResults=false;recognizer.maxAlternatives=3;
      recognizer.onresult=e=>{
        if(!$('#voiceStatus'))return;
        const results=Array.from(e.results[0]).map(x=>x.transcript),best=results.find(x=>norm(x)===norm(l.ar))||results[0];
        $('#voiceStatus').textContent='Recognised: '+best+(norm(best)===norm(l.ar)?' · The recognised text matches the model.':' · Text differs from the model. Listen and try again; recognition can make mistakes.');
        practised=true;update();$('#recogniseButton').disabled=false;
      };
      recognizer.onerror=()=>{if($('#voiceStatus'))$('#voiceStatus').textContent='Recognition is unavailable or did not hear clearly. Use recording playback or Practise aloud.';if($('#recogniseButton'))$('#recogniseButton').disabled=false;};
      recognizer.onend=()=>{if($('#recogniseButton'))$('#recogniseButton').disabled=false;};
      try{recognizer.start();$('#recogniseButton').disabled=true;$('#voiceStatus').textContent='Listening for your Arabic model phrase…';}catch{recognizer.onerror();}
    };
    activityCleanup=()=>clearInterval(aloudTimer);
  }
  function stopMedia(){
    clearTimeout(recordTimer);
    if(activeRecorder){activeRecorder.onstop=null;try{if(activeRecorder.state==='recording')activeRecorder.stop();}catch{}activeRecorder=null;}
    if(activeStream){activeStream.getTracks().forEach(t=>t.stop());activeStream=null;}
    if(recognizer){recognizer.onresult=null;recognizer.onend=null;recognizer.onerror=null;try{recognizer.abort();}catch{}recognizer=null;}
    if(recordingUrl){URL.revokeObjectURL(recordingUrl);recordingUrl=null;}
  }
  function roleplayActivity(){
    const l=lessonSession.lesson,w=WORLDS[l.world],options=shuffle([l,...shuffle(w.lessons.filter(x=>x.id!==l.id)).slice(0,2)]);
    setActivity('Your turn in the conversation','Listen to your partner. Choose a response, then speak your own version.',
      '<div class="conversation-turn">Partner’s turn</div><div class="conversation-bubble">'+ar(l.ask,'ar-lg')+'<div class="small muted">'+esc(l.askEn)+'</div></div>'+button('🔊 Hear my partner','speak-text','secondary','data-text="'+esc(l.ask)+'"')+'<div class="choices">'+options.map((c,i)=>'<button class="choice" data-reply="'+i+'">'+ar(c.ar)+'<span class="small muted" style="display:block">'+esc(c.en)+'</span></button>').join('')+'</div><div id="roleplayResponse" class="hidden"><div class="instruction">Now say the response without looking. Change one detail, add a reason, or ask a follow-up question. A partner can ask the same question in a different way.</div></div>');
    document.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>{
      if(lessonSession.passed)return;
      if(options[Number(b.dataset.reply)].id===l.id){b.classList.add('correct');$('#roleplayResponse').classList.remove('hidden');pass('A response that fits. Now try it with your own words.');speak(l.ar);cheer();}else{b.classList.add('incorrect');miss('Think about your partner’s question. Which response answers it?');}
    });
  }
  function quizActivity(){
    const l=lessonSession.lesson,w=WORLDS[l.world],story=w.checks[l.order],word=w.words[l.order%w.words.length];
    const questions=[
      {q:'What does this sentence mean?',ar:l.ar,answer:l.en,wrong:shuffle(w.lessons.filter(x=>x.id!==l.id).map(x=>x.en)).slice(0,2)},
      {q:'Choose the Arabic word for: '+word.en,answer:word.ar,wrong:shuffle(w.words.filter(x=>x.ar!==word.ar).map(x=>x.ar)).slice(0,2),arabicChoices:true},
      {q:l.askEn,ar:l.ask,answer:l.ar,wrong:shuffle(w.lessons.filter(x=>x.id!==l.id).map(x=>x.ar)).slice(0,2),arabicChoices:true},
      {q:story.q,story:w.story.ar,answer:story.answer,wrong:story.wrong},
      {q:'Which sentence expresses: '+l.en,answer:l.ar,wrong:shuffle(w.lessons.filter(x=>x.id!==l.id).map(x=>x.ar)).slice(0,2),arabicChoices:true}
    ];
    let index=0,score=0,answered=false,results=[];
    function draw(){
      const q=questions[index],choices=shuffle([q.answer,...q.wrong]);answered=false;
      setActivity('Your lesson checkpoint','Answer five questions. Four correct answers unlock the next lesson.',
        '<div class="quiz-dots">'+questions.map((_,i)=>'<span class="'+(i===index?'current':i<index?'passed':'')+'">'+(i+1)+'</span>').join('')+'</div><p class="story-question">'+esc(q.q)+'</p>'+(q.ar?ar(q.ar,'ar-lg'):'')+(q.story?'<details><summary class="text-button">Read the story again</summary><div class="story-text" lang="ar" dir="rtl">'+esc(q.story)+'</div></details>':'')+'<div class="choices">'+choices.map((c,i)=>'<button class="choice '+(q.arabicChoices?'arabic':'')+'" '+(q.arabicChoices?'lang="ar" dir="rtl"':'')+' data-quiz="'+i+'">'+esc(c)+'</button>').join('')+'</div><div id="quizExplanation" class="hidden"></div>');
      $('#activityNext').textContent='Continue';$('#activityNext').disabled=true;$('#activityNext').onclick=e=>{
        e.stopPropagation();
        if(!answered)return;index++;
        if(index<questions.length){feedback('');draw();}
        else finish();
      };
      document.querySelectorAll('[data-quiz]').forEach(b=>b.onclick=()=>{
        if(answered)return;answered=true;const good=choices[Number(b.dataset.quiz)]===q.answer;results.push(good);if(good){score++;b.classList.add('correct');feedback('That’s right.','good');cheer();}
        else{b.classList.add('incorrect');feedback('Review the answer, then continue.','bad');$('#quizExplanation').classList.remove('hidden');$('#quizExplanation').innerHTML='<div class="instruction"><b>Answer:</b> '+(q.arabicChoices?ar(q.answer):esc(q.answer))+'</div>';document.querySelectorAll('[data-quiz]').forEach(x=>{if(choices[Number(x.dataset.quiz)]===q.answer)x.classList.add('correct');});}
        document.querySelectorAll('[data-quiz]').forEach(x=>x.disabled=true);$('#activityNext').disabled=false;$('#activityNext').textContent=index===4?'See my result':'Next question';
      });
    }
    function finish(){
      lessonSession.quizScore=score;$('#activityNext').onclick=null;
      setActivity(score>=4?'Checkpoint passed!':'A little more practice',score+' out of 5 correct. '+(score>=4?'Your next step is ready.':'You need at least 4. Review the model and try again.'),
        '<div style="font-size:74px;margin:15px">'+(score>=4?'🏆':'🌱')+'</div>'+phraseModel(l)+'<p class="muted">'+(score>=4?'You listened, built meaning, read and used your voice.':'Mistakes help you see what to practise. Your earlier activities are saved.')+'</p>');
      if(score>=4){lessonSession.passed=true;$('#activityNext').disabled=false;$('#activityNext').textContent='Finish lesson';feedback('Ready to celebrate.','good');}
      else{$('#activityNext').disabled=true;$('#activityBody').innerHTML+=button('Try the checkpoint again','retry-checkpoint','primary');feedback('Take your time. You can do this.');}
    }
    activityCleanup=()=>{if($('#activityNext'))$('#activityNext').onclick=null;};draw();
  }
  function nextActivity(){
    const s=lessonSession;if(!s||!s.passed)return;
    if(s.step===8){finishLesson();return;}
    s.step++;if(!s.preview&&!profile.done[s.lesson.id]){profile.activity[s.lesson.id]={step:s.step,attempts:s.attempts,at:Date.now()};save();}
    renderLesson();window.scrollTo({top:0,behavior:'instant'});
  }
  function finishLesson(){
    const s=lessonSession,l=s.lesson;cleanActivity();stopMedia();stopAudio();
    if(s.quizScore<4)return;
    const stars=s.quizScore===5?3:2,old=profile.done[l.id],first=!old;
    if(!s.preview){
      profile.done[l.id]={stars:Math.max(stars,Number(old?.stars)||0),score:Math.max(s.quizScore,Number(old?.score)||0),at:Date.now(),speakingPractised:true};
      profile.activity[l.id]={step:0,attempts:0,at:Date.now()};
      if(first)dailyMark('lessons');
      save(true);
    }
    const next=nextLesson();cheer();confetti();
    $('#main').innerHTML='<section class="card reward"><div class="eyebrow">'+(s.preview?'PREVIEW COMPLETE':'YOU USED YOUR ARABIC')+'</div><div class="trophy">'+(s.preview?'🌍':'🏆')+'</div><div class="stars">'+'★'.repeat(stars)+'</div><h1>'+esc(l.title)+'<br>'+ (s.preview?'explored!':'complete!')+'</h1><p>'+(s.preview?'You explored a later lesson. Return to your next journey stop to earn progress in order.':'Keep the new phrase alive: say it to someone today.')+'</p><div class="reward-xp">'+(s.preview?'Preview · no course credit':first?'+'+(50+stars*10)+' XP · '+stars+' stars':'Practice refreshed · best score kept')+'</div><div class="button-row">'+button('Back to my map','back-map','secondary')+button(completed()===LESSONS.length?'See my progress':'Continue my journey','continue-journey')+'</div></section>';
    updateStats();
  }
  function confetti(){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    for(let i=0;i<35;i++){const p=document.createElement('i');p.className='confetti';p.style.left=Math.random()*100+'vw';p.style.background=['#ffce53','#7152c6','#1aa49b','#f3807c'][i%4];p.style.animationDelay=Math.random()*.5+'s';document.body.appendChild(p);setTimeout(()=>p.remove(),3300);}
  }
  function allWords(){
    const seen=new Set(),words=[];
    WORLDS.forEach(w=>w.words.forEach(x=>{const key=norm(x.ar)+'|'+x.en;if(!seen.has(key)){seen.add(key);words.push({...x,world:w.id-1});}}));return words;
  }
  function renderLibrary(){
    $('#main').innerHTML=heading('Your Arabic library','Keep useful words, letter shapes and stories close by.','Read · hear · revisit')+'<div class="library-tabs">'+[['words','Word collection'],['alphabet','Arabic alphabet'],['stories','Story shelf']].map(([id,t])=>button(esc(t),'library-tab','library-tab '+(libraryTab===id?'active':''),'data-tab="'+id+'"')).join('')+'</div><div id="libraryContent"></div>';
    if(libraryTab==='alphabet')$('#libraryContent').innerHTML='<p class="muted" style="margin-bottom:17px">All 28 letters. Tap a letter to hear its name, see its shapes and trace it.</p><div class="alphabet-grid">'+ALPHABET.map((l,i)=>'<button class="alphabet-tile" data-action="letter" data-letter="'+i+'">'+ar(l[0],'letter')+'<small>'+esc(l[2])+'</small></button>').join('')+'</div><div class="instruction"><b>Extra signs:</b> Hamzah ء is a consonant. ة is taa marbuta, ى is alif maqsura, and لا is a combination of ل and ا. These are not extra letters in the 28-letter alphabet. ا د ذ ر ز و do not join to the letter that follows them.</div>';
    else if(libraryTab==='stories')$('#libraryContent').innerHTML='<div class="world-catalog">'+WORLDS.map(w=>'<button class="card world-card" data-action="story-book" data-world="'+(w.id-1)+'"><div class="world-art" style="'+artStyle(w.stage)+'"><span class="world-number">'+w.icon+' STORY '+w.id+'</span></div><div class="world-card-content"><h3>'+esc(w.title)+'</h3><p>'+esc(STAGES[w.stage].label)+'</p><div class="world-foot"><span>Arabic + English</span><span>Read & listen</span></div></div></button>').join('')+'</div>';
    else{
      $('#libraryContent').innerHTML='<input class="search" id="wordSearch" type="search" placeholder="Search in Arabic or English" aria-label="Search word collection" value="'+esc(libraryQuery)+'"><div class="word-grid" id="wordResults"></div>';
      const filter=()=>{const list=allWords().filter(x=>norm(x.ar+' '+x.en+' '+x.roman).includes(norm(libraryQuery)));$('#wordResults').innerHTML=list.length?list.map(wordCard).join(''):'<p class="empty">No words found. Try another spelling.</p>';};
      $('#wordSearch').oninput=e=>{libraryQuery=e.target.value;filter();};filter();
    }
  }
  function openLetter(i){
    const l=ALPHABET[i];
    openModal(l[2]+' · Letter shapes','<div style="text-align:center">'+ar(l[0],'ar-xl')+'<div>'+button('🔊 Hear the letter name','speak-text','secondary','data-text="'+esc(l[1])+'"')+'</div><div class="letter-forms">'+[2,3,4,5].slice(1).map((index,j)=>'<div>'+ar(l[index])+'<small>'+['Initial','Medial','Final'][j]+'</small></div>').join('')+'</div><p class="small muted">Trace over the large letter. This is freehand practice; it is not automatically graded.</p><div class="trace-board"><span class="trace-letter" lang="ar">'+esc(l[0])+'</span><canvas id="traceCanvas" aria-label="Letter tracing canvas"></canvas></div>'+button('Clear my strokes','clear-trace','text-button')+'</div>');
    speak(l[1]);requestAnimationFrame(()=>{
      const canvas=$('#traceCanvas');if(!canvas)return;
      const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;
      const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.strokeStyle='#6750bf';ctx.lineWidth=9;ctx.lineCap='round';ctx.lineJoin='round';let drawing=false;
      canvas.onpointerdown=e=>{drawing=true;canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect();ctx.beginPath();ctx.moveTo(e.clientX-r.left,e.clientY-r.top);};
      canvas.onpointermove=e=>{if(!drawing)return;const r=canvas.getBoundingClientRect();ctx.lineTo(e.clientX-r.left,e.clientY-r.top);ctx.stroke();};
      canvas.onpointerup=canvas.onpointercancel=()=>drawing=false;
      $('[data-action="clear-trace"]').onclick=()=>ctx.clearRect(0,0,rect.width,rect.height);
    });
  }
  function openStory(i){
    const w=WORLDS[i];
    openModal(w.title,'<div class="story-text" lang="ar" dir="rtl">'+esc(w.story.ar)+'</div><div class="button-row">'+button('🔊 Listen','speak-text','secondary','data-text="'+esc(w.story.ar)+'"')+'</div><details style="margin-top:15px"><summary class="text-button">English meaning</summary><p class="story-english">'+esc(w.story.en)+'</p></details><div class="instruction"><b>Tell it back:</b> Who is it about? What happened? Why? Retell it in your own Arabic, then change one detail.</div>'+button('Explore its world','select-world','primary','data-world="'+i+'"'));
  }
  function renderPractice(){
    $('#main').innerHTML=heading('A little practice playground','Revisit a world. Strengthen your memory. Use your voice.','Practice at your pace')+
      '<div class="card" style="margin-bottom:23px"><label for="practiceWorld"><b>Choose your practice world</b></label><select id="practiceWorld" class="search" style="margin:11px 0 0">'+WORLDS.map((w,i)=>'<option value="'+i+'" '+(practiceWorld===i?'selected':'')+'>'+w.id+'. '+esc(w.title)+'</option>').join('')+'</select></div><div class="practice-layout">'+[
        ['🃏','Flip & remember','Turn an Arabic word over to discover its meaning. Mark the words you want to practise again.','flashcards','Open flashcards'],
        ['🎤','Speaking studio','Listen to a question, record your answer and compare it with the model.','studio','Use my voice'],
        ['🧩','Word partners','Match Arabic words with English meanings, with fresh positions every time.','practice-match','Play a matching game'],
        ['🔤','Letter workshop','Explore the 28 letters, connected shapes and freehand tracing.','alphabet-practice','Practise my letters'],
        ['📖','Story corner','Read a short original story and retell it without looking.','practice-story','Read a story'],
        ['🧭','Starting-point check','Answer a short written skills check to choose a suitable course entry point.','placement','Check my starting point']
      ].map(([i,t,p,a,b])=>'<button class="card practice-card" data-action="'+a+'"><div class="big-icon">'+i+'</div><h3>'+t+'</h3><p>'+p+'</p><span class="small">'+b+'</span></button>').join('')+'</div>';
    $('#practiceWorld').onchange=e=>practiceWorld=Number(e.target.value);
  }
  function showFlashcards(){
    const words=WORLDS[practiceWorld].words,word=words[flashIndex%words.length];
    openModal('Flip & remember · '+WORLDS[practiceWorld].title,'<div class="small muted" style="text-align:center">Card '+(flashIndex%words.length+1)+' of '+words.length+'</div><button class="flashcard '+(flashBack?'flipped':'')+'" data-action="flip-card" aria-label="Flip flashcard">'+(flashBack?'<span class="meaning">'+esc(word.en)+'</span><span class="roman" style="color:#d9fffa">'+esc(word.roman)+'</span>':ar(word.ar))+'<small>Tap to flip</small></button><div class="button-row">'+button('🔊 Listen','speak-text','secondary','data-text="'+esc(word.ar)+'"')+button('Practise again','review-word','teal')+button('Next card','next-card','primary')+'</div>');
  }
  function speakingStudio(){
    const w=WORLDS[practiceWorld];openModal('Speaking studio','<p class="muted">Choose a question. You will enter its speaking activity and can return to the studio afterwards.</p><div class="review-list" style="margin-top:17px">'+w.lessons.map(l=>'<button class="choice" data-action="studio-lesson" data-lesson="'+l.id+'">'+ar(l.ask)+'<span class="small muted" style="display:block">'+esc(l.askEn)+'</span></button>').join('')+'</div>');
  }
  function renderProgress(){
    const done=completed(),speaking=Object.keys(profile.practice).filter(k=>/^\d+$/.test(k)).length;
    $('#main').innerHTML=heading('Look how far you’ve come','Small steps become a voice you can use.','Your own learning record')+
      '<div class="progress-stats">'+[['Lessons complete',done+'/144'],['Speaking practices',speaking],['Stars collected',totalStars()],['Day streak',streak()]].map(([t,n])=>'<div class="card progress-stat"><span class="number">'+n+'</span><small>'+t+'</small></div>').join('')+'</div><div class="world-layout"><div><div class="section-title"><span>🗺️</span><h2>Your world progress</h2></div><div class="progress-worlds">'+WORLDS.map((w,i)=>'<button class="card progress-world" data-action="select-world" data-world="'+i+'"><span>'+w.icon+'</span><div><h3>'+w.id+'. '+esc(w.title)+'</h3><small>'+worldDone(i)+' of 6 lessons · '+esc(STAGES[w.stage].name)+'</small><div class="progress-track"><div class="progress-fill" style="width:'+worldDone(i)/6*100+'%"></div></div></div><span class="percent">'+Math.round(worldDone(i)/6*100)+'%</span></button>').join('')+'</div></div><div class="side-stack"><div class="card"><h3>☁ Your saved progress</h3><p class="small muted" style="margin:10px 0">'+(user?'Your course uses the same Diin Islaam student account as Tuhfatul Atfaal. Sign in on another device to continue.':'Sign in with your existing Tuhfatul Atfaal account for progress across devices. Guest practice stays on this device.')+'</p><p data-sync></p><div class="button-row" style="margin-top:12px">'+button(user?'Retry sync':'Sign in','sync-or-login','secondary')+'</div></div><div class="card"><h3>🏅 Stage certificates</h3><p class="small muted" style="margin:9px 0 14px">Finish every lesson in a stage to print a course completion certificate.</p>'+STAGES.map((s,i)=>'<div class="review-line"><span class="small">'+s.icon+' '+esc(s.name)+'</span>'+button(stageComplete(i)?'Print':'Locked','certificate','text-button','data-stage="'+i+'" '+(stageComplete(i)?'':'disabled'))+'</div>').join('')+'</div><div class="card"><h3>This week’s practice</h3><div class="chart-row">'+weekChart()+'</div></div></div></div><section class="card" style="margin-top:23px"><h2>For parents & teachers</h2><p class="small muted" style="margin-top:9px">Lesson stars reflect checkpoint answers. Speaking ticks record the learner’s self-practice. Use a real, unscripted conversation to assess speaking. Course stages describe learning goals, not certified proficiency.</p><table class="rubric"><thead><tr><th>Look for</th><th>Ask the learner to show it</th></tr></thead><tbody><tr><td>Clear meaning</td><td>Answer a fresh question so a listener can understand the main message.</td></tr><tr><td>Vocabulary & accuracy</td><td>Use new words and suitable verb forms; repair a mistake without abandoning the message.</td></tr><tr><td>Interaction</td><td>Ask a follow-up question, respond to a change, and request clarification.</td></tr><tr><td>Connected speech</td><td>Move from short sentences to a story, explanation or supported opinion.</td></tr><tr><td>Pronunciation</td><td>Check sounds and rhythm with an Arabic-speaking teacher; recordings and recognised text are practice aids.</td></tr></tbody></table></section>';
    updateStats();
  }
  function weekChart(){
    const a=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const p=profile.daily[d.toLocaleDateString('en-CA')]||{},n=(Number(p.lessons)||0)+(Number(p.practice)||0);a.push({day:d.toLocaleDateString('en',{weekday:'short'}),n,today:i===0});}
    const max=Math.max(3,...a.map(x=>x.n));return a.map(x=>'<div class="chart-col '+(x.today?'today':'')+'" aria-label="'+x.day+': '+x.n+' activities"><div class="chart-bar" style="height:'+Math.max(4,x.n/max*95)+'px"></div>'+x.day+'</div>').join('');
  }
  function stageComplete(i){return WORLDS.filter(w=>w.stage===i).every(w=>worldDone(w.id-1)===6);}
  function certificate(i){
    if(!stageComplete(i))return;
    closeModal();route='progress';renderNav();
    $('#main').innerHTML='<div class="certificate"><div class="cert-icon">🏅</div><div class="eyebrow">DIIN ISLAAM · ARABIC ADVENTURE</div><h2>Certificate of completion</h2>'+ar('شَهَادَةُ إِتْمَامٍ')+'<p>This celebrates</p><div class="cert-name">'+esc(profile.name)+'</div><p>for completing all 24 lessons in</p><h2>'+esc(STAGES[i].name)+'</h2><p>'+esc(STAGES[i].label)+'</p><p style="margin-top:21px">'+new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})+'</p><p class="small" style="margin-top:17px">Course completion and practice · No external proficiency qualification</p></div><div class="button-row">'+button('Print certificate','print','primary')+button('Back to progress','navigate','secondary','data-route="progress"')+'</div>';
  }
  const PLACEMENT=[
    {q:'Which letter is baa?',a:'ب',wrong:['ت','ج'],ar:true},
    {q:'Which syllable has the sound “bi”?',a:'بِ',wrong:['بَ','بُ'],ar:true},
    {q:'What does مَرْحَبًا mean?',a:'Hello',wrong:['Goodnight','A house']},
    {q:'Choose “This is my mother.”',a:'هٰذِهِ أُمِّي',wrong:['هٰذَا أَبِي','عِنْدِي قَلَمٌ'],ar:true},
    {q:'What does لَا أَفْهَمُ mean?',a:'I do not understand',wrong:['I have a pen','I want a ticket']},
    {q:'Which phrase asks the price?',a:'كَمْ سِعْرُ هٰذَا؟',wrong:['أَيْنَ الْمَكْتَبَةُ؟','مَا اِسْمُكَ؟'],ar:true},
    {q:'What does ذَهَبْتُ mean?',a:'I went',wrong:['I go','We will go']},
    {q:'Choose “The village is quieter than the city.”',a:'الْقَرْيَةُ أَهْدَأُ مِنَ الْمَدِينَةِ',wrong:['الْقَرْيَةُ مُزْدَحِمَةٌ','أَنَا فِي الْمَدِينَةِ'],ar:true},
    {q:'What does لِأَنَّ signal?',a:'A reason',wrong:['A greeting','A price']},
    {q:'Which phrase acknowledges a contrasting point?',a:'مَعَ ذٰلِكَ',wrong:['إِلَى اللِّقَاءِ','كَمِ السَّاعَةُ؟'],ar:true},
    {q:'What does قَدْ يُقَلِّلُ mean here?',a:'It may reduce',wrong:['It definitely increased','It never changes']},
    {q:'Which is the most cautious evidence claim?',a:'نَحْتَاجُ إِلَى مَزِيدٍ مِنَ الْأَدِلَّةِ',wrong:['هٰذَا صَحِيحٌ دَائِمًا','لَا نَحْتَاجُ إِلَى أَيِّ دَلِيلٍ'],ar:true}
  ];
  function placementIntro(){openModal('Find your starting point','<p class="muted">Twelve short questions check written recognition and understanding. They do not test spontaneous speaking or certify a level.</p><div class="instruction">If you are new to Arabic, start with World 1. If you already know some Arabic, use this check to choose a starting point. Earlier lessons remain available for practice; skipped lessons earn no stars or certificates.</div><div class="button-row">'+button('Start at the beginning','start-beginning','secondary')+button('Try the skills check','placement-start')+'</div>');}
  function placementQuestion(){
    if(placement.index>=PLACEMENT.length){
      const scores=placement.results;let band=0;
      for(let b=0;b<6;b++){if(scores[b*2]&&scores[b*2+1])band=b+1;else break;}
      const worlds=[0,2,4,8,12,16,20];placement.recommended=worlds[band];
      const w=WORLDS[placement.recommended];
      openModal('A suggested starting point','<div style="font-size:55px;text-align:center">'+w.icon+'</div><h3 style="text-align:center">World '+w.id+' · '+esc(w.title)+'</h3><p class="muted" style="margin:15px 0">You answered '+scores.filter(Boolean).length+' of 12 questions correctly. This suggestion uses the early skills you demonstrated in sequence. Try an earlier world if speaking feels difficult.</p><div class="placement-banner">This changes your starting point. It does not mark any skipped lessons complete or award their certificates.</div><div class="button-row" style="margin-top:20px">'+button('Keep my current journey','close-modal','secondary')+button('Use this starting point','placement-accept')+'</div>');return;
    }
    const q=PLACEMENT[placement.index],choices=shuffle([q.a,...q.wrong]);
    openModal('Starting-point check · '+(placement.index+1)+'/12','<div class="progress-track"><div class="progress-fill" style="width:'+placement.index/12*100+'%"></div></div><p class="placement-question">'+esc(q.q)+'</p><div class="choices">'+choices.map((c,i)=>'<button class="choice '+(q.ar?'arabic':'')+'" '+(q.ar?'lang="ar" dir="rtl"':'')+' data-placement="'+i+'">'+esc(c)+'</button>').join('')+'</div><p class="small muted">Choose your best answer. You can revisit any early world afterwards.</p>');
    document.querySelectorAll('[data-placement]').forEach(b=>b.onclick=()=>{placement.results.push(choices[Number(b.dataset.placement)]===q.a);placement.index++;placementQuestion();});
  }
  function openModal(title,html){
    $('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;if(!$('#modal').open)$('#modal').showModal();
  }
  function closeModal(){if($('#modal').open)$('#modal').close();}
  function loginModal(){
    if(user){accountModal();return;}
    openModal('Welcome, Arabic explorer','<div class="modal-note">Use the same username and password as Tuhfatul Atfaal, Seeraa Quest and the Qur’an Tracker. Your Arabic speaking progress has its own saved record.</div><form id="loginForm" class="auth-form"><label for="loginUsername">Username<input id="loginUsername" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="40" required></label><label for="loginPassword">Password<input id="loginPassword" name="password" type="password" autocomplete="current-password" minlength="6" maxlength="100" required></label><p id="authStatus" class="auth-status" role="status" aria-live="polite">'+(cloudReady?'':'Connecting to your account service…')+'</p><button class="primary" type="submit" id="loginSubmit" '+(!cloudReady?'disabled':'')+'>Sign in & continue</button></form><div class="auth-actions">'+button('Forgot my password','forgot-password','text-button')+button('Keep practising here','close-modal','text-button')+'</div><p class="small muted" style="margin-top:16px">Need an account? Ask your parent or Diin Islaam teacher. Your existing account can be used here without joining a new Tajweed batch.</p>');
    $('#loginForm').onsubmit=async e=>{
      e.preventDefault();if(authBusy||!window.KidsCloud)return;
      authBusy=true;$('#loginSubmit').disabled=true;$('#authStatus').textContent='Signing in…';
      try{const data=await window.KidsCloud.studentLogin($('#loginUsername').value.trim(),$('#loginPassword').value);applyAccount(data);closeModal();toast('Welcome back. Your Arabic progress is ready.');}
      catch(err){if($('#authStatus'))$('#authStatus').textContent=friendlyAuth(err);}
      finally{authBusy=false;if($('#loginSubmit'))$('#loginSubmit').disabled=!cloudReady;}
    };
  }
  function friendlyAuth(err){
    const c=String(err?.code||'');
    if(/invalid-credential|wrong-password|user-not-found/.test(c))return 'That username or password is not correct. Check both and try again.';
    if(c.includes('too-many-requests'))return 'Too many attempts. Please wait a little and try again.';
    if(c.includes('network'))return 'Cannot reach the account service. Check your connection and try again.';
    if(c==='app/account-disabled')return 'This account has been disabled. Please speak to your teacher.';
    return 'Sign-in could not finish. Please try again or ask your teacher for help.';
  }
  async function forgotPassword(){
    if(!window.KidsCloud||authBusy)return;const name=$('#loginUsername')?.value.trim(),status=$('#authStatus');
    if(!name){if(status)status.textContent='Enter your username first, then choose Forgot my password.';return;}
    authBusy=true;if(status)status.textContent='Requesting the reset email…';
    try{await window.KidsCloud.studentForgotPassword(name);if(status){status.classList.add('good');status.textContent='Reset email requested. Ask your parent or teacher to check the email linked to your account.';}}
    catch(err){if(status)status.textContent=err?.code==='app/no-email-on-file'?'No recovery email is linked. Ask your teacher to help reset your password.':friendlyAuth(err);}
    finally{authBusy=false;}
  }
  function applyAccount(data){
    if(!data)return;
    const same=user?.uid===data.uid;
    cleanActivity();stopMedia();stopAudio();user=data;
    const local=readLocal(localKey()),remote=data.progress?.[GAME_KEY],name=data.fullName||data.displayName||data.username||'Explorer';
    profile=mergeProfiles(remote,local,name);syncState='saved';initialAuthDone=true;viewWorld=nextLesson().world;
    // Guest practice never silently overwrites an existing student record.
    if(!same||route==='lesson'){route='journey';lessonSession=null;}
    save();render();
  }
  function wireCloud(){
    if(authWired||!window.KidsCloud)return;authWired=true;cloudReady=true;
    if($('#loginSubmit'))$('#loginSubmit').disabled=false;if($('#authStatus'))$('#authStatus').textContent='';
    window.KidsCloud.onStudentAuth(data=>{
      if(data)applyAccount(data);
      else if(user){cleanActivity();stopMedia();stopAudio();user=null;profile=normaliseProfile(readLocal(STORAGE+'-guest'),'Explorer');syncState='local';route='journey';viewWorld=nextLesson().world;render();}
      initialAuthDone=true;
    });
  }
  function accountModal(){
    openModal('Your learning account','<div class="modal-note"><b>'+esc(profile.name)+'</b><br>'+esc(user?.username||'Guest explorer')+'<br>'+(user?'Same Diin Islaam account · Arabic speaking progress':'Practice is saved on this device')+'</div><h3>Choose your explorer</h3><div class="avatar-options">'+AVATARS.map(a=>button(a,'avatar','', 'data-avatar="'+a+'" aria-label="Choose '+a+'"')).join('')+'</div><div class="speaking-checks"><label><input type="checkbox" id="romanPreference" '+(profile.preferences.roman?'checked':'')+'> Show transliteration in beginner lessons</label><label><input type="checkbox" id="fullScreenMapPreference" '+(profile.preferences.fullScreenMap?'checked':'')+'> Open the journey map full screen</label></div><div class="button-row">'+button(soundOn?'Turn sound off':'Turn sound on','toggle-sound','secondary')+(user?button('Sign out','logout','secondary'):button('Sign in','login','primary'))+'</div>');
    $('#romanPreference').onchange=e=>{profile.preferences.roman=e.target.checked;save();};
    $('#fullScreenMapPreference').onchange=e=>{profile.preferences.fullScreenMap=e.target.checked;save();document.body.classList.toggle('map-fullscreen-mode',e.target.checked&&route==='journey');};
  }
  function guideModal(){
    openModal('A little Arabic, every day','<ol class="guide-list"><li><b>Begin with a world.</b> Each of the six stops has nine activities. Completed activities are saved so you can continue later.</li><li><b>Listen and say it.</b> Read the short teaching tip. Use the normal and slow audio models.</li><li><b>Build meaning.</b> Match, order words, read a story and respond to a partner.</li><li><b>Use your voice.</b> Record and listen back, or practise aloud. Then try your own idea with a real partner.</li><li><b>Pass the checkpoint.</b> Get at least four of five answers correct to move on. You can retry and review.</li><li><b>Sign in to continue elsewhere.</b> Use your Tuhfatul Atfaal username and password. Watch the saved-progress status.</li></ol><div class="instruction">Many letter and word cards use existing hosted Arabic recordings. Longer models use your device’s Arabic voice. If your device has no Arabic voice, use the written models with a parent or teacher. A microphone is optional.</div>');
  }
  function researchModal(){
    openModal('The learning approach','<div class="details-list"><div><h3>Small, explicit learning steps</h3><p>Original Arabic lessons use a journey map, demonstration, guided practice, feedback and rewards, inspired by the public Reading Eggs learning flow.</p></div><div><h3>Meaningful speaking from the start</h3><p>The progression moves from sounds and short exchanges to narration, explanations, supported opinions and extended presentations. CEFR and ACTFL guidance informed the planning; this course is not endorsed by either organisation and does not assign a certified proficiency level.</p></div><div><h3>Arabic for broad understanding</h3><p>The course teaches Modern Standard Arabic with English support. Regional everyday dialects vary. Beginner transliteration is a temporary aid; advanced practice focuses on Arabic.</p></div><div><h3>Real conversations matter</h3><p>Self-practice, text recognition and checkpoint scores serve different purposes. An Arabic-speaking teacher or partner should assess spontaneous interaction, sound accuracy and fluency.</p></div></div><div class="source-links"><a href="https://readingeggs.helpjuice.com/en_US/4-begin-with-the-lessons" target="_blank" rel="noopener">Reading Eggs: lesson flow and map progression</a><a href="https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions" target="_blank" rel="noopener">Council of Europe: CEFR Companion Volume</a><a href="https://www.actfl.org/proficiency-guidelines-overview" target="_blank" rel="noopener">ACTFL: proficiency guidance overview</a><a href="https://learning.aljazeera.net/en" target="_blank" rel="noopener">Al Jazeera Learning Arabic: further reading</a></div>');
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const a=b.dataset.action;
    if(a==='navigate'){closeModal();changeRoute(b.dataset.route);}
    else if(a==='toggle-map-fullscreen'){document.body.classList.add('map-fullscreen-mode');}
    else if(a==='exit-map-fullscreen'){document.body.classList.remove('map-fullscreen-mode');}
    else if(a==='stage'){viewWorld=Number(b.dataset.stage)*4;renderJourney();}
    else if(a==='select-world'){closeModal();viewWorld=Number(b.dataset.world);changeRoute('journey');}
    else if(a==='previous-world'){viewWorld=Math.max(0,viewWorld-1);renderJourney();}
    else if(a==='next-world'){viewWorld=Math.min(23,viewWorld+1);renderJourney();}
    else if(a==='world-guide')worldGuide();
    else if(a==='open-lesson')openLesson(Number(b.dataset.lesson));
    else if(a==='preview-lesson')openLesson(Number(b.dataset.lesson),true);
    else if(a==='continue-journey'){closeModal();if(completed()===144)changeRoute('progress');else openLesson(nextLesson().id);}
    else if(a==='next-activity'){if(!$('#activityNext').onclick)nextActivity();}
    else if(a==='retry-checkpoint')renderLesson();
    else if(a==='activity-step'){const i=Number(b.dataset.step);if(lessonSession&&i<=lessonSession.step){lessonSession.step=i;renderLesson();}}
    else if(a==='leave-lesson'||a==='back-map'){viewWorld=lessonSession?.world??viewWorld;changeRoute('journey');}
    else if(a==='speak-text')speak(b.dataset.text,Number(b.dataset.rate)||.82);
    else if(a==='library-tab'){libraryTab=b.dataset.tab;renderLibrary();}
    else if(a==='letter')openLetter(Number(b.dataset.letter));
    else if(a==='story-book')openStory(Number(b.dataset.world));
    else if(a==='flashcards'){flashIndex=0;flashBack=false;showFlashcards();}
    else if(a==='flip-card'){flashBack=!flashBack;showFlashcards();}
    else if(a==='next-card'){flashIndex++;flashBack=false;showFlashcards();}
    else if(a==='review-word'){const w=WORLDS[practiceWorld].words[flashIndex%WORLDS[practiceWorld].words.length];profile.practice['word-'+norm(w.ar)]={at:Date.now()};save();toast('Added to your practice record. Say it again tomorrow.');flashIndex++;flashBack=false;showFlashcards();}
    else if(a==='studio')speakingStudio();
    else if(a==='studio-lesson'){const id=Number(b.dataset.lesson);openLesson(id,true);lessonSession.preview=true;lessonSession.practiceMode=true;lessonSession.step=6;renderLesson();}
    else if(a==='practice-match'){const l=WORLDS[practiceWorld].lessons[0];openLesson(l.id,true);lessonSession.preview=true;lessonSession.step=2;renderLesson();}
    else if(a==='alphabet-practice'){libraryTab='alphabet';changeRoute('library');}
    else if(a==='practice-story')openStory(practiceWorld);
    else if(a==='certificate')certificate(Number(b.dataset.stage));
    else if(a==='print')window.print();
    else if(a==='placement')placementIntro();
    else if(a==='placement-start'){placement={index:0,results:[],recommended:0};placementQuestion();}
    else if(a==='placement-accept'){if(!placement)return;profile.startAt=placement.recommended*6;save(true);closeModal();viewWorld=placement.recommended;changeRoute('journey');toast('Your new starting point is ready. Earlier worlds remain available.');}
    else if(a==='start-beginning'){closeModal();viewWorld=0;changeRoute('journey');}
    else if(a==='close-modal')closeModal();
    else if(a==='forgot-password')forgotPassword();
    else if(a==='login'){closeModal();loginModal();}
    else if(a==='logout'){if(window.KidsCloud){await saveQueue.catch(()=>{});try{await window.KidsCloud.studentLogout();closeModal();toast('Signed out. Your account progress is saved.');}catch{toast('Could not sign out. Try again.');}}}
    else if(a==='avatar'){profile.avatar=b.dataset.avatar;save();accountModal();}
    else if(a==='toggle-sound'){soundOn=!soundOn;if(!soundOn)stopAudio();try{localStorage.setItem(STORAGE+'-sound',String(soundOn));}catch{}updateStats();accountModal();}
    else if(a==='sync-or-login'){if(user){syncNow();toast('Trying to save your progress again.');}else loginModal();}
  });
  $('#closeModal').onclick=closeModal;$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
  $('#accountButton').onclick=loginModal;$('#profileButton').onclick=accountModal;$('#guideButton').onclick=guideModal;$('#researchButton').onclick=researchModal;
  $('#soundButton').onclick=()=>{soundOn=!soundOn;if(!soundOn)stopAudio();try{localStorage.setItem(STORAGE+'-sound',String(soundOn));}catch{}updateStats();};
  window.addEventListener('kidscloud-ready',wireCloud);
  window.addEventListener('online',()=>{if(user)syncNow();});
  window.addEventListener('pagehide',()=>{clearTimeout(syncTimer);if(user&&syncState!=='saved')syncNow();stopMedia();stopAudio();});
  profile=normaliseProfile(readLocal(STORAGE+'-guest'),'Explorer');viewWorld=nextLesson().world;
  try{soundOn=localStorage.getItem(STORAGE+'-sound')!=='false';}catch{}
  render();if(window.KidsCloud)wireCloud();
  setTimeout(()=>{if(!cloudReady&&$('#authStatus'))$('#authStatus').textContent='The account service could not load. Check your connection and reopen Sign in. Guest practice is available.';},12000);
})();
