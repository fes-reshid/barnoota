(function(){'use strict';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d'),hero=new Image();hero.src='assets/mahir.webp';
const worlds=[{name:'Sunny Meadow',badge:'✦ SUNNY MEADOW',sky:['#cfe9e4','#f5efd1'],far:'#b4cfa4',hill:'#7fae8d',grass:'#6f9e66',ground:'#d5b58b',accent:'#eac762'},{name:'Golden Dunes',badge:'✦ GOLDEN DUNES',sky:['#f8dfba','#fff0cf'],far:'#efd093',hill:'#dfb078',grass:'#b9a46b',ground:'#d6a76a',accent:'#e8af55'},{name:'Ocean Breeze',badge:'✦ OCEAN BREEZE',sky:['#bfdfed','#e4f5ef'],far:'#88c4c7',hill:'#5aabab',grass:'#70ad89',ground:'#e8d4a4',accent:'#5cb6be'},{name:'Starlight Valley',badge:'☾ STARLIGHT VALLEY',sky:['#303c65','#727d99'],far:'#606e8c',hill:'#4c7678',grass:'#669784',ground:'#ab9f88',accent:'#f2d077'}];
let saved={best:0,adventures:0,stars:0,islamCursor:0};try{saved={...saved,...JSON.parse(localStorage.getItem('runmahir.progress.v1')||'{}')}}catch(e){};
for(const k of Object.keys(saved))if(!Number.isFinite(saved[k])||saved[k]<0)saved[k]=0;
let state='home',previous='run',mode='mixed',level=1,round=0,score=0,totalTime=0,segment=0,distance=0,offset=0,jumpY=0,jumpV=0,objects=[],particles=[],spawn=0,world=worlds[0],question=null,answered=false,sound=true,audio=null,readEnabled='speechSynthesis'in window,last=0,W=1000,H=540,groundY=438,heroX=180,bump=0,flash=0,correctFirst=0,attempts=0,quizCursor=0;
const segmentDuration=11;
let audioMaster=null,stepTimer=0,animationTime=0,nextBlink=2.6,blinkStarted=-10;
try{sound=localStorage.getItem('runmahir.sound.v1')!=='off'}catch(e){}
function soundLabel(){$('soundLabel').textContent=sound?'On':'Off';$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on')}
soundLabel();
function unlockAudio(){if(!sound)return null;try{if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();audioMaster=audio.createGain();audioMaster.connect(audio.destination)}if(audio.state==='suspended')audio.resume();audioMaster.gain.setTargetAtTime(state==='pause'||state==='home'?0:1,audio.currentTime,.015);return audio}catch(e){return null}}
function quietAudio(){if(audioMaster)audioMaster.gain.setTargetAtTime(0,audio.currentTime,.015)}
function runSound(landing=false){const a=unlockAudio();if(!a||state!=='run'||(!landing&&jumpY>0))return;const o=a.createOscillator(),g=a.createGain(),at=a.currentTime;o.type='sine';o.frequency.setValueAtTime(landing?125:155,at);o.frequency.exponentialRampToValueAtTime(55,at+.07);g.gain.setValueAtTime(landing?.13:.075,at);g.gain.exponentialRampToValueAtTime(.001,at+.075);o.connect(g);g.connect(audioMaster);o.start(at);o.stop(at+.08)}
function jumpSound(){const a=unlockAudio();if(!a)return;const at=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.setValueAtTime(230,at);o.frequency.exponentialRampToValueAtTime(920,at+.11);o.frequency.exponentialRampToValueAtTime(430,at+.26);g.gain.setValueAtTime(.001,at);g.gain.linearRampToValueAtTime(.1,at+.012);g.gain.exponentialRampToValueAtTime(.001,at+.28);o.connect(g);g.connect(audioMaster);o.start(at);o.stop(at+.29)}
function persist(){try{localStorage.setItem('runmahir.progress.v1',JSON.stringify(saved))}catch(e){}}
function homeStats(){$('best').textContent=saved.best;$('adventures').textContent=saved.adventures}homeStats();
function tone(freq=600,duration=.09){const a=unlockAudio();if(!a)return;try{const o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(audioMaster);o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.06,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+duration);o.start();o.stop(a.currentTime+duration)}catch(e){}}
$('sound').onclick=()=>{sound=!sound;soundLabel();try{localStorage.setItem('runmahir.sound.v1',sound?'on':'off')}catch(e){}if(sound){unlockAudio();if(state!=='home')tone()}else{quietAudio();if(readEnabled)speechSynthesis.cancel()}};

function resize(){const r=canvas.getBoundingClientRect();if(!r.width)return;const d=Math.min(window.devicePixelRatio||1,2);canvas.width=r.width*d;canvas.height=r.height*d;W=r.width<600?600:1000;H=W*r.height/r.width;groundY=H*.80;heroX=W*(r.width<600?.25:.21);ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0)}window.addEventListener('resize',resize);
function updateHud(){$('score').textContent=score;$('progress').style.width=((round+segment/segmentDuration)/6*100)+'%';$('distance').textContent=Math.floor(distance)+' m';$('checkpointLabel').textContent='Learning stop '+Math.min(round+1,6)+' of 6'}
function setWorld(){world=worlds[(saved.adventures+Math.floor(round/2))%4];$('worldName').textContent=world.name;$('stageBadge').textContent=world.badge}
function begin(){mode=$('mode').value;level=Number($('level').value);round=0;score=0;totalTime=0;stepTimer=0;animationTime=0;nextBlink=2.6;blinkStarted=-10;segment=0;distance=0;offset=0;jumpY=0;jumpV=0;spawn=0;objects=[];particles=[];bump=0;flash=0;correctFirst=0;quizCursor=saved.islamCursor;$('home').hidden=true;$('game').hidden=false;for(const el of ['overlay','pauseOverlay','finishOverlay'])$(el).hidden=true;state='run';setWorld();resize();updateHud();hint('Bismillah! Tap JUMP to collect stars.');$('jump').focus();tone(480)}
$('start').onclick=begin;$('again').onclick=begin;
function stopSpeech(){if(readEnabled)speechSynthesis.cancel()}
function toHome(){state='home';quietAudio();stopSpeech();$('game').hidden=true;$('home').hidden=false;homeStats();$('start').focus()}
$('exit').onclick=toHome;$('pauseHome').onclick=toHome;$('finishHome').onclick=toHome;
function pause(){if(state!=='run'&&state!=='question')return;previous=state;state='pause';quietAudio();stopSpeech();$('pauseOverlay').hidden=false;$('resume').focus()}
function resume(){state=previous;unlockAudio();$('pauseOverlay').hidden=true;(state==='run'?$('jump'):answered?$('continue'):$('answers').querySelector('button')).focus()}
$('pause').onclick=pause;$('resume').onclick=resume;document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
function jump(){if(state!=='run'||jumpY>1)return;jumpV=660;stepTimer=0;jumpSound();hint('Nice jump! Catch those stars.')} $('jump').addEventListener('pointerdown',e=>{e.preventDefault();jump()});canvas.addEventListener('pointerdown',jump);
window.addEventListener('keydown',e=>{if(['Space','ArrowUp'].includes(e.code)&&state==='run'){e.preventDefault();jump()}if(e.code==='Escape'){if(state==='pause')resume();else pause()}});
// Keep keyboard navigation inside the active learning or pause dialog.
document.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const id=state==='pause'?'pauseOverlay':state==='question'?'overlay':state==='finish'?'finishOverlay':null;if(!id)return;const items=[...$(id).querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(x=>!x.hidden);const first=items[0],end=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus()}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus()}});
let hintUntil=0;function hint(text){$('runHint').textContent=text;$('runHint').style.opacity=1;hintUntil=totalTime+3.5}
function ask(){state='question';objects=[];jumpY=0;jumpV=0;answered=false;attempts=0;
question=MahirQuestions.question(mode,level,round,saved.adventures);
if(question.category==='islam'){const item=MahirQuestions.islam[quizCursor%MahirQuestions.islam.length];question={...item,o:MahirQuestions.shuffle(item.o),category:'islam'};quizCursor++}
$('category').textContent=question.category==='islam'?'☾ MY DEEN':'✦ MATHS POWER';$('questionNumber').textContent='LEARNING STOP '+(round+1)+' / 6';$('question').textContent=question.q;$('questionHelp').textContent=question.help;$('feedback').textContent='';$('continue').hidden=true;$('answers').replaceChildren();
question.o.forEach(answer=>{const b=document.createElement('button');b.className='answer';b.textContent=answer;b.onclick=()=>check(answer,b);$('answers').appendChild(b)});$('read').hidden=!readEnabled;$('overlay').hidden=false;$('questionCard').focus();tone(550,.15)}
function check(answer,button){if(answered)return;if(answer!==question.a){attempts++;button.classList.add('wrong');button.disabled=true;$('feedback').textContent='Good try! '+question.help+' Have another go.';tone(280,.1);const next=$('answers').querySelector('button:not(:disabled)');if(next)next.focus();return}answered=true;score+=10;if(attempts===0)correctFirst++;button.classList.add('correct');for(const b of $('answers').children)b.disabled=true;$('feedback').textContent='✓ '+question.explain;$('continue').hidden=false;updateHud();tone(740,.18);setTimeout(()=>tone(960,.15),140);$('continue').focus()}
$('learnNow').onclick=()=>{if(state==='run')ask()};
$('read').onclick=()=>{if(!readEnabled)return;stopSpeech();const u=new SpeechSynthesisUtterance(question.q+' '+question.o.join('. '));u.lang='en-AU';u.rate=.82;speechSynthesis.speak(u)};
$('continue').onclick=()=>{stopSpeech();$('overlay').hidden=true;round++;if(round>=6){finish();return}setWorld();segment=0;spawn=0;objects=[];state='run';updateHud();hint('Well done! Let’s keep exploring.');$('jump').focus()};
function finish(){state='finish';saved.adventures++;saved.best=Math.max(saved.best,score);saved.stars+=score;saved.islamCursor=quizCursor%MahirQuestions.islam.length;persist();$('progress').style.width='100%';$('checkpointLabel').textContent='Adventure complete';$('finishScore').textContent=score;$('finishMessage').textContent='Mahir’s drawing ran '+Math.floor(distance)+' metres, and you completed all 6 learning stops. Keep learning, keep growing!';$('finishOverlay').hidden=false;$('again').focus();tone(800,.18);for(let i=0;i<70;i++)particles.push({x:Math.random()*W,y:Math.random()*H*.5,vx:(Math.random()-.5)*100,vy:-Math.random()*150,life:3,color:['#edb94d','#e88d62','#b4d3a1'][i%3]})}
function puff(x,y,color,count=7){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*170,vy:-30-Math.random()*160,life:.6+Math.random()*.5,color})}
function update(dt){totalTime+=dt;offset+=dt*210;distance+=dt*14;segment+=dt;spawn-=dt;bump=Math.max(0,bump-dt);flash=Math.max(0,flash-dt);if(jumpY>0||jumpV>0){jumpY+=jumpV*dt;jumpV-=1600*dt;if(jumpY<=0){jumpY=0;jumpV=0;runSound(true);stepTimer=0;puff(heroX,groundY,'#f1e2bb',4)}}
if(jumpY===0){stepTimer+=dt;if(stepTimer>=Math.PI/15){stepTimer%=Math.PI/15;runSound()}}
if(spawn<=0&&segment<segmentDuration-1.8){const isLog=Math.random()<.3;objects.push({x:W+55,y:groundY-(isLog?22:(Math.random()<.45?140:70)),kind:isLog?'log':'star',done:false});spawn=1.05+Math.random()*.6}
for(const o of objects){o.x-=dt*(level===3?245:210);if(!o.done&&Math.abs(o.x-heroX)<42){if(o.kind==='star'&&Math.abs(o.y-(groundY-jumpY-70))<70){o.done=true;score++;puff(o.x,o.y,'#f6cb58');tone(850,.06)}else if(o.kind==='log'&&jumpY<48&&bump<=0){o.done=true;bump=1.4;flash=.2;hint('Hop over the next log — you’ve got this!');puff(heroX,groundY,'#eacb9a',8)}}}objects=objects.filter(o=>o.x>-80&&!o.done);$('runHint').style.opacity=totalTime>hintUntil?0:1;updateHud();if(segment>=segmentDuration)ask()}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function star(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.46:r;ctx.lineTo(x+Math.cos(angle)*rr,y+Math.sin(angle)*rr)}ctx.closePath();ctx.fill()}
function cloud(x,y,scale){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ellipse(0,0,54,14,'#ffffffb3');ellipse(-15,-12,24,22,'#ffffffb3');ellipse(15,-18,27,25,'#ffffffb3');ctx.restore()}
function draw(){const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,world.sky[0]);sky.addColorStop(1,world.sky[1]);ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);const sunX=W*.79,sunY=Math.min(H*.2,150);ellipse(sunX,sunY,44,44,world.accent);ellipse(sunX,sunY,58,58,world===worlds[3]?'#ffffff06':'#f9da6a15');if(world===worlds[3]){for(let i=0;i<26;i++){const x=(i*139+43)%W,y=(i*73+35)%(groundY*.7);star(x,y,3,'#f8e7bb')}}else{cloud(((200-offset*.08)%(W+200)+W+200)%(W+200)-100,H*.19,.8);cloud(((670-offset*.06)%(W+200)+W+200)%(W+200)-100,H*.28,1.1);cloud(((1000-offset*.1)%(W+200)+W+200)%(W+200)-100,H*.12,.6)}
for(let layer=0;layer<2;layer++){ctx.fillStyle=layer?world.hill:world.far;ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W+10;x+=10){const y=groundY-60-layer*2-Math.sin((x+offset*(layer?.25:.1))/230+layer*3)*(layer?45:70);ctx.lineTo(x,y)}ctx.lineTo(W,H);ctx.fill()}
// Distant little trees and a peaceful village, drawn with soft shapes.
for(let i=0;i<5;i++){const x=((i*270-offset*.34)%(W+300)+W+300)%(W+300)-100,y=groundY-27;ctx.fillStyle='#547b64';ctx.fillRect(x-4,y-62,8,65);ellipse(x,y-72,24,32,world===worlds[1]?'#819663':'#5d9472');ellipse(x-18,y-66,18,23,'#70a482')}
ctx.fillStyle=world.ground;ctx.fillRect(0,groundY,W,H-groundY);ctx.fillStyle=world.grass;ctx.fillRect(0,groundY-11,W,16);ctx.fillStyle='#fff6d92b';ctx.fillRect(0,groundY+15,W,5);for(let i=0;i<22;i++){const x=((i*67-offset)%(W+100)+W+100)%(W+100)-40;ellipse(x,groundY+38+(i%3)*16,4+i%4,2,'#9d79592b');if(i%4===0){ctx.fillStyle='#edf2bc';ctx.fillRect(x,groundY-18,2,9);ellipse(x+1,groundY-21,4,4,'#fff0b0')}}
for(const o of objects){if(o.kind==='star'){ellipse(o.x+2,o.y+4,19,19,'#af85371c');ellipse(o.x,o.y,18,18,'#ffedab');star(o.x,o.y,13,'#dfa637')}else{ctx.fillStyle='#8f6547';ctx.beginPath();ctx.roundRect(o.x-27,groundY-35,54,35,12);ctx.fill();ellipse(o.x+19,groundY-18,10,16,'#bd9368');ellipse(o.x+19,groundY-18,5,9,'#ddb485');ctx.strokeStyle='#bc9369';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x-22,groundY-23);ctx.lineTo(o.x+4,groundY-27);ctx.stroke()}}
drawHero();for(const p of particles){ctx.globalAlpha=Math.max(0,Math.min(1,p.life));ellipse(p.x,p.y,4,4,p.color)}ctx.globalAlpha=1;if(flash>0){ctx.fillStyle='#fff6dd66';ctx.fillRect(0,0,W,H)}}
// Arm outlines in source-image coordinates keep Mahir’s original crayon marks.
const heroArms=[
 {pivot:[.51,.445],points:[[.015,.325],[.13,.345],[.23,.39],[.30,.405],[.39,.42],[.54,.435],[.55,.465],[.43,.477],[.31,.473],[.29,.515],[.18,.52],[.04,.48]]},
 {pivot:[.665,.468],points:[[.655,.45],[.71,.463],[.75,.447],[.80,.413],[.86,.365],[.92,.365],[.92,.405],[.89,.43],[.97,.411],[.99,.475],[.97,.56],[.89,.572],[.82,.54],[.755,.568],[.70,.54],[.70,.499],[.655,.485]]}
];
function armOutline(arm,w,h){const points=arm.points;ctx.moveTo(points[0][0]*w,points[0][1]*h);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0]*w,points[i][1]*h);ctx.closePath()}
function drawHead(w,h,running){
const px=w*.58,py=h*.425;
ctx.save();ctx.translate(px,py);ctx.rotate((running?Math.sin(animationTime*7)*.045:Math.sin(animationTime*2)*.018)+(jumpY>0?-.06:0));ctx.translate(-px,-py);
ctx.save();ctx.beginPath();ctx.rect(0,0,w,h*.43);ctx.clip();ctx.beginPath();ctx.rect(0,0,w,h);for(const arm of heroArms)armOutline(arm,w,h);ctx.clip('evenodd');ctx.drawImage(hero,0,0,hero.naturalWidth,hero.naturalHeight*.43,0,0,w,h*.43);ctx.restore();
const age=animationTime-blinkStarted,blink=age>=0&&age<.22?Math.sin(age/.22*Math.PI):0;
if(blink>0){ctx.save();ctx.globalAlpha=blink;for(const eye of [[.425,.346,.044,.039],[.562,.325,.047,.047]]){ellipse(eye[0]*w,eye[1]*h,eye[2]*w,eye[3]*h,'#f2ece1');ctx.strokeStyle='#282c31';ctx.lineWidth=Math.max(1.2,w*.012);ctx.lineCap='round';ctx.beginPath();ctx.moveTo((eye[0]-eye[2]*.75)*w,eye[1]*h);ctx.quadraticCurveTo(eye[0]*w,(eye[1]+.018)*h,(eye[0]+eye[2]*.75)*w,eye[1]*h);ctx.stroke()}ctx.restore()}
ctx.restore();
}
function drawHero(){const size=H>900?240:Math.min(192,H*.39),w=size*.77,h=size,x=heroX-w*.5,y=groundY-h-jumpY;ellipse(heroX,groundY+4,45*(1-jumpY/700),8,'#284b4224');if(!hero.complete||!hero.naturalWidth)return;const running=state==='run'&&jumpY===0,t=running?totalTime*15:0,bob=running?Math.abs(Math.sin(t))*5:0;
ctx.save();ctx.translate(x+w*.5,y+h*.58-bob);ctx.rotate(jumpY>0?.12:running?.06:0);
// The original drawing looks left: mirror the whole rig to face the rightward run.
ctx.scale(-1,1);ctx.translate(-w*.5,-h*.58);
const sw=hero.naturalWidth,sh=hero.naturalHeight,split=.61;
// Remove the resting arms from the torso before rendering their swinging poses.
ctx.save();ctx.beginPath();ctx.rect(0,h*.43,w,h*(split-.43));ctx.clip();ctx.beginPath();ctx.rect(0,0,w,h);for(const arm of heroArms)armOutline(arm,w,h);ctx.clip('evenodd');ctx.drawImage(hero,0,0,sw,sh*split,0,0,w,h*split);ctx.restore();
for(let leg=0;leg<2;leg++){ctx.save();const pivotX=w*(leg?.56:.37),pivotY=h*split;ctx.translate(pivotX,pivotY);ctx.rotate(running?Math.sin(t+(leg?Math.PI:0))*.22:jumpY>0?(leg?-.28:.25):0);ctx.drawImage(hero,sw*(leg?.47:0),sh*split,sw*(leg?.53:.47),sh*(1-split),w*(leg?.47:0)-pivotX,0,w*(leg?.53:.47),h*(1-split));ctx.restore()}
drawHead(w,h,running);
for(let i=0;i<heroArms.length;i++){const arm=heroArms[i],px=arm.pivot[0]*w,py=arm.pivot[1]*h;ctx.save();ctx.translate(px,py);ctx.rotate(running?Math.sin(t+(i?Math.PI:0))*.32:jumpY>0?(i?.27:-.27):0);ctx.translate(-px,-py);ctx.beginPath();armOutline(arm,w,h);ctx.clip();ctx.drawImage(hero,0,0,w,h);ctx.restore()}
ctx.restore();if(running){ctx.strokeStyle='#fff9dc90';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-8-i*10,y+h*.5+i*13);ctx.lineTo(x-25-i*14,y+h*.5+i*13);ctx.stroke()}}}

function frame(ts){const dt=Math.min((ts-last)/1000||0,.033);last=ts;if(state!=='home'&&state!=='pause'){animationTime+=dt;if(animationTime>=nextBlink){blinkStarted=animationTime;nextBlink=animationTime+2.7+Math.random()*2}}if(state==='run')update(dt);if(state!=='home'){if(state==='run'||state==='finish'){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=220*dt;p.life-=dt}particles=particles.filter(p=>p.life>0)}draw()}requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();
