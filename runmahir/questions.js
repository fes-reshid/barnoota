/* Run Mahir: local question generator. No accounts or personal data needed. */
(function(root){
'use strict';
const islam=[
{q:'Who is your Lord?',a:'Allah',o:['Allah','The sun','The moon','The sea'],help:'Think about the One who created us and cares for us.',explain:'My Lord is Allah. He created me and all things.'},
{q:'Who is your Prophet?',a:'Muhammad ﷺ',o:['Muhammad ﷺ','A king','A teacher','A traveller'],help:'He is the final Messenger of Allah.',explain:'My Prophet is Muhammad ﷺ. We learn from his kindness and follow his guidance.'},
{q:'What is your religion?',a:'Islam',o:['Islam','A language','A country','A sport'],help:'It teaches us to worship Allah and do good.',explain:'My religion is Islam.'},
{q:'What is our holy book?',a:'The Qur’an',o:['The Qur’an','A storybook','An atlas','A notebook'],help:'Allah revealed it to Prophet Muhammad ﷺ.',explain:'The Qur’an is the word of Allah and a guide for us.'},
{q:'How many daily prayers do Muslims pray?',a:'Five',o:['Five','Two','Three','Seven'],help:'Fajr, Dhuhr, Asr, Maghrib and Isha.',explain:'We pray five obligatory prayers each day.'},
{q:'What do we say before eating?',a:'Bismillah',o:['Bismillah','Good night','Goodbye','See you later'],help:'It means “In the name of Allah”.',explain:'We say Bismillah before eating and eat with our right hand.'},
{q:'What do we say to thank Allah?',a:'Alhamdulillah',o:['Alhamdulillah','Goodbye','Good morning','Please stop'],help:'It means “All praise belongs to Allah”.',explain:'Alhamdulillah! We thank Allah for His blessings.'},
{q:'In which month do Muslims fast?',a:'Ramadan',o:['Ramadan','Shawwal','Safar','Muharram'],help:'It is the month in which the Qur’an was revealed.',explain:'Muslims fast in Ramadan. Young children can learn gently as they grow.'},
{q:'Which city is home to the Ka‘bah?',a:'Makkah',o:['Makkah','Madinah','Melbourne','Cairo'],help:'Muslims face the Ka‘bah when they pray.',explain:'The Ka‘bah is in Makkah. We worship Allah alone.'},
{q:'What do we do before salah?',a:'Make wudu',o:['Make wudu','Play a game','Eat sweets','Go shopping'],help:'We wash in a special way to prepare for prayer.',explain:'Wudu helps us prepare for salah in a state of purity.'},
{q:'How many pillars of Islam are there?',a:'Five',o:['Five','Four','Six','Eight'],help:'Shahadah, salah, zakah, fasting and Hajj.',explain:'There are five pillars of Islam.'},
{q:'How should we treat our parents?',a:'With kindness',o:['With kindness','By shouting','By being rude','By ignoring them'],help:'Speak gently and help them with good things.',explain:'Islam teaches us to be kind and respectful to our parents.'},
{q:'What is the Muslim greeting?',a:'Assalamu alaykum',o:['Assalamu alaykum','Good night','Bismillah','Alhamdulillah'],help:'It is a beautiful prayer for peace.',explain:'Assalamu alaykum means “Peace be upon you”.'},
{q:'Which hand do we use to eat?',a:'The right hand',o:['The right hand','The left hand','Neither hand','Both feet'],help:'Follow the good manners taught by our Prophet ﷺ.',explain:'Our Prophet ﷺ taught us to eat with the right hand.'},
{q:'What should we do when we make a mistake?',a:'Ask Allah to forgive us',o:['Ask Allah to forgive us','Blame everyone','Keep doing it','Be unkind'],help:'Allah loves those who turn back to Him.',explain:'We ask Allah for forgiveness, try to stop the wrong and put things right.'},
{q:'Who was the first human and Prophet?',a:'Adam عليه السلام',o:['Adam عليه السلام','Nuh عليه السلام','Musa عليه السلام','Isa عليه السلام'],help:'Allah created him before all other people.',explain:'Adam عليه السلام was the first human and the first Prophet.'},
{q:'What do we say when planning something?',a:'In sha Allah',o:['In sha Allah','Goodbye','Good night','Thank you'],help:'It means “If Allah wills”.',explain:'We say In sha Allah about what we intend to do in the future.'},
{q:'How should we treat animals?',a:'With care and kindness',o:['With care and kindness','Frighten them','Hurt them','Never give them water'],help:'Animals are also among Allah’s creations.',explain:'Islam teaches us to show mercy to animals and care for them.'},
{q:'What is zakah?',a:'Giving obligatory charity',o:['Giving obligatory charity','A kind of food','A daily prayer','A journey'],help:'It is one of the five pillars of Islam.',explain:'Zakah is obligatory charity for those who meet its conditions. It helps people in need.'},
{q:'What is Hajj?',a:'Pilgrimage to Makkah',o:['Pilgrimage to Makkah','A game','A bedtime story','A type of food'],help:'It is one of the five pillars of Islam.',explain:'Hajj is pilgrimage to Makkah, obligatory once in a lifetime for Muslims who are able.'},
{q:'How many pillars of iman are there?',a:'Six',o:['Six','Five','Three','Ten'],help:'Belief in Allah, His angels, His books, His messengers, the Last Day and divine decree.',explain:'There are six pillars of iman (faith).'},
{q:'Which angel brought revelation to Muhammad ﷺ?',a:'Jibril عليه السلام',o:['Jibril عليه السلام','Mikail عليه السلام','Israfil عليه السلام','A human messenger'],help:'He brought the Qur’an by Allah’s command.',explain:'The angel Jibril عليه السلام brought revelation to Prophet Muhammad ﷺ.'},
{q:'What does tawhid mean?',a:'Worshipping Allah alone',o:['Worshipping Allah alone','Worshipping the sun','Being famous','Collecting treasures'],help:'Allah has no partner.',explain:'Tawhid means affirming Allah’s oneness. We worship Him alone.'},
{q:'What should we do with something we borrow?',a:'Return it to its owner',o:['Return it to its owner','Hide it','Break it','Keep it forever'],help:'A Muslim is trustworthy.',explain:'We take care of things we borrow and return them to their owners.'}
];
const rand=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=rand(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
function math(type,level){level=Number(level);let a,b,n,s,help;const max=level===1?10:level===2?30:100;
if(type==='add'){a=rand(1,max-1);b=rand(1,max-a);n=a+b;s='+';help='Start with '+a+' and count '+b+' more.'}
if(type==='subtract'){a=rand(2,max);b=rand(1,a);n=a-b;s='−';help='Start with '+a+' and take away '+b+'.'}
if(type==='multiply'){a=level===1?[2,5,10][rand(0,2)]:rand(2,12);b=rand(1,level===1?5:12);n=a*b;s='×';help=a+' groups of '+b+'. Count in equal groups.'}
if(type==='divide'){b=level===1?[2,5,10][rand(0,2)]:rand(2,12);n=rand(1,level===1?5:12);a=b*n;s='÷';help='Share '+a+' equally into '+b+' groups. How many in each?'}
const opts=new Set([n]);while(opts.size<4){const candidate=n+rand(-Math.max(4,level*3),Math.max(4,level*3));if(candidate>=0)opts.add(candidate)}
return {q:a+' '+s+' '+b+' = ?',a:String(n),o:shuffle([...opts].map(String)),help,explain:a+' '+s+' '+b+' = '+n+'. Well done!',category:'math',type};}
function question(mode,level,index,adventure){if(mode==='islam'||(mode==='mixed'&&index<2)){let k=(adventure*2+(mode==='islam'?index:index))%islam.length;return {...islam[k],o:shuffle(islam[k].o),category:'islam'}}const type=mode==='mixed'?['add','subtract','multiply','divide'][index-2]:mode;return math(type,level)}
const api={question,math,shuffle,islam};if(typeof module!=='undefined')module.exports=api;root.MahirQuestions=api;
})(typeof window!=='undefined'?window:globalThis);
