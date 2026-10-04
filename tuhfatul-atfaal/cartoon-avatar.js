/* Shared, editable cartoon child used in the editor, profile and walking map. */
(() => {
  const palettes = {
    hijabColor: AVATAR_COLOURS.shirtColor.concat([['#F4E7CD','Cream'],['#273B4B','Midnight']]),
    hairColor: [['#30231F','Dark brown'],['#171B23','Black'],['#795039','Chestnut'],['#C49352','Golden brown']],
    shoeColor: [['#F3EEE2','Cream'],['#273B4B','Navy'],['#8C5B42','Brown'],['#D58298','Rose']]
  };
  Object.assign(AVATAR_COLOURS, palettes);
  const oldEnsure = ensureAvatarColours;
  ensureAvatarColours = function () {
    oldEnsure();
    for (const key of Object.keys(palettes)) {
      if (!palettes[key].some(([c]) => c === profile[key])) profile[key] = key === 'hijabColor' ? profile.shirtColor : palettes[key][0][0];
    }
  };
  function character(p, extraClass = '') {
    const s=p.skinTone,c=p.shirtColor,t=p.trouserColor,h=p.hijabColor,hair=p.hairColor,shoe=p.shoeColor;
    const hijab=p.avatar==='🧕',braids=p.avatar==='👧',curly=p.avatar==='🧒',turban=p.avatar==='👳';
    const long=p.outfitStyle==='abaya'||p.outfitStyle==='thobe', hem=long?23:p.outfitStyle==='jilbab'?13:8;
    const edge='stroke="#283442" stroke-opacity=".22" stroke-width=".65" stroke-linejoin="round"';
    const legs=[-1,1].map((side)=>`<g class="${side<0?'left':'right'}-leg"><path d="M${side*5} 4 Q${side*7} 16 ${side*6.5} 28" fill="none" stroke="${t}" stroke-width="7.5" stroke-linecap="round"/><path d="M${side*3} 26 L${side*10} 26 Q${side*15} 29 ${side*12} 31 L${side*3} 31Z" fill="${shoe}" ${edge}/><path d="M${side*3} 30 L${side*12} 30" stroke="#fff" stroke-width="1.1"/></g>`).join('');
    const arms=[-1,1].map(side=>`<g class="${side<0?'left':'right'}-arm"><path d="M${side*10} -8 Q${side*16} -1 ${side*16.5} 9" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M${side*15} 7 Q${side*20} 7 ${side*20} 11 Q${side*20} 15 ${side*16} 14 Q${side*13} 13 ${side*14} 10Z" fill="${s}" ${edge}/><path d="M${side*15} 5 L${side*19} 5" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/></g>`).join('');
    const body=`<path d="M-9-11 Q0-14 9-11 Q12-8 12-2 L${long?15:12} ${hem} Q0 ${hem+5} ${long?-15:-12} ${hem} L-12-2 Q-12-8-9-11Z" fill="${c}" ${edge}/><path d="M-8 0 Q-9 12 ${long?-11:-9} ${hem-1} M8 0 Q9 12 ${long?11:9} ${hem-1}" fill="none" stroke="#000" stroke-opacity=".09" stroke-width="1.3"/>${hijab?'':`<path d="M-4-11 Q0-6 4-11" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="1"/><circle cy="-4" r=".7" fill="#fff"/><circle cy="0" r=".7" fill="#fff"/>`}`;
    const scarf=hijab?`<path d="M0-43 C-12-43-17-34-16-23 C-16-15-20-7-19-2 Q-12 5 0 8 Q12 5 19-2 C20-7 16-15 16-23 C17-34 12-43 0-43Z" fill="${h}" ${edge}/><path d="M-13-30 Q-17-16-11-4 Q-5 2 9 4 M12-29 Q15-14 9-5" fill="none" stroke="#000" stroke-opacity=".13" stroke-width="1.2"/><path d="M-10-36 Q-3-42 5-38" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" stroke-linecap="round"/>`:'';
    const backHair=braids?`<path d="M-9-29 Q-15-23-12-10 M9-29 Q15-23 12-10" fill="none" stroke="${hair}" stroke-width="6" stroke-linecap="round"/><path d="M-14-13 L-10-12 M10-12 L14-13" stroke="${c}" stroke-width="2"/>`:'';
    const face=`${hijab?'':`<ellipse cy="-13" rx="3.5" ry="5" fill="${s}"/><ellipse cx="-11" cy="-25" rx="2.2" ry="3.4" fill="${s}"/><ellipse cx="11" cy="-25" rx="2.2" ry="3.4" fill="${s}"/>`}<path d="M-10-29 Q-10-37 0-37 Q10-37 10-29 L9-21 Q7-14 0-13 Q-7-14-9-21Z" fill="${s}" ${edge}/><path d="M-8-30 Q-5-32-2-30 M2-30 Q5-32 8-30" fill="none" stroke="${hair}" stroke-width=".9" stroke-linecap="round"/><ellipse cx="-4.7" cy="-26.5" rx="2.1" ry="2.5" fill="#fff"/><ellipse cx="4.7" cy="-26.5" rx="2.1" ry="2.5" fill="#fff"/><ellipse cx="-4.5" cy="-26.2" rx="1.25" ry="1.8" fill="#30271F"/><ellipse cx="4.5" cy="-26.2" rx="1.25" ry="1.8" fill="#30271F"/><circle cx="-4.9" cy="-27" r=".55" fill="#fff"/><circle cx="4.1" cy="-27" r=".55" fill="#fff"/><path d="M0-25 L-1-22 Q0-21 1-22" fill="none" stroke="#774C38" stroke-opacity=".45" stroke-width=".6"/><ellipse cx="-6.8" cy="-21.7" rx="2.2" ry="1.1" fill="#D67875" opacity=".24"/><ellipse cx="6.8" cy="-21.7" rx="2.2" ry="1.1" fill="#D67875" opacity=".24"/><path d="M-3.4-19.9 Q0-16.1 3.4-19.9 Q0-18.6-3.4-19.9Z" fill="#96594D"/><path d="M-2.5-19.5 Q0-18.5 2.5-19.5" stroke="#fff" stroke-width=".7" fill="none"/>`;
    const topHair=hijab?'':turban?`<path d="M-12-31 Q-14-40 0-41 Q13-40 12-31 Q0-27-12-31Z" fill="${h}" ${edge}/><path d="M-10-36 Q0-29 10-35 M-8-39 Q1-33 10-36" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.1"/>`:curly?`<path d="M-11-26 Q-14-33-9-36 Q-9-42-3-40 Q1-44 5-40 Q12-41 12-35 Q16-31 10-27 L9-32 Q4-29 0-33 Q-5-30-9-31Z" fill="${hair}"/><path d="M-6-37 Q-3-40 0-36 M3-38 Q7-40 8-35" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="1.2"/>`:`<path d="M-11-26 Q-14-39 0-41 Q14-40 11-26 L8-32 Q1-30-3-35 Q-6-31-10-30Z" fill="${hair}"/><path d="M-6-36 Q0-40 7-35" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="1.2"/>`;
    return `<g class="map-person cartoon-child ${extraClass}" aria-hidden="true">${legs}${arms}${body}<g class="avatar-head">${backHair}${scarf}${face}${topHair}</g></g>`;
  }
  mapPersonMarkup=function(extraClass=''){ensureAvatarColours();return character(profile,extraClass)};
  function preview(p, cls=''){return `<svg class="${cls}" viewBox="-24 -47 48 82" aria-hidden="true">${character(p)}</svg>`}
  function refreshBadges(){ensureAvatarColours();['studentAvatar','sideAvatar'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=preview(profile,'child-badge')})}
  const previousStats=syncStats;syncStats=function(){previousStats();refreshBadges()};
  showAvatarPicker=function(){
    ensureAvatarColours();
    const screen=document.querySelector('#avatarScreen .avatar-screen');
    screen.querySelector('h2').textContent='Create your cartoon explorer';
    screen.querySelector('p').textContent='Make a character that feels like you. Tap a style or colour to see it change. Your choices save automatically.';
    const svg=document.getElementById('avatarPreview');svg.setAttribute('viewBox','-27 -48 54 84');svg.innerHTML=character(profile);
    document.getElementById('avatarGrid').innerHTML=HUMAN_AVATARS.map(a=>`<button class="avatar-choice ${a===profile.avatar?'selected':''}" data-avatar="${a}" aria-pressed="${a===profile.avatar}">${preview({...profile,avatar:a})}<small>${AVATAR_HEAD_LABELS[a]}</small></button>`).join('');
    document.getElementById('avatarCustomiser').innerHTML=avatarOutfitGroup()+avatarColourGroup('Skin tone · face and hands','skinTone')+avatarColourGroup('Clothing','shirtColor')+((profile.avatar==='🧕'||profile.avatar==='👳')?avatarColourGroup(profile.avatar==='🧕'?'Hijab':'Turban','hijabColor'):avatarColourGroup('Hair','hairColor'))+avatarColourGroup('Trousers','trouserColor')+avatarColourGroup('Shoes','shoeColor')+'<p class="avatar-saved" role="status">Your explorer is saved as you make changes.</p>';
    screen.querySelectorAll('[data-avatar],[data-outfit],[data-avatar-colour]').forEach(btn=>btn.onclick=()=>{
      const key=btn.dataset.avatar?'avatar':btn.dataset.outfit?'outfitStyle':btn.dataset.avatarColour;
      profile[key]=btn.dataset.avatar||btn.dataset.outfit||btn.dataset.colour;save();showAvatarPicker();refreshBadges();
      const selector=btn.dataset.avatar?'[data-avatar="'+profile.avatar+'"]':btn.dataset.outfit?'[data-outfit="'+profile.outfitStyle+'"]':'[data-avatar-colour="'+key+'"][data-colour="'+profile[key]+'"]';
      screen.querySelector(selector)?.focus({preventScroll:true});
    });
    if(document.getElementById('avatarScreen').classList.contains('hidden'))show('avatarScreen');
  };
  document.getElementById('studentAvatar').onclick=showAvatarPicker;
  document.getElementById('avatarBtn').onclick=showAvatarPicker;
  refreshBadges();
})();
