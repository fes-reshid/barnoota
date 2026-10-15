/* Presentation only: the course, account, map gates and progress keys stay with the course. */
(function () {
  'use strict';
  document.body.classList.add('seeraa-polished');
  const $ = id => document.getElementById(id), esc = escapeHtml;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let preference = false, stopped = false, pauseAt = 0, lastMap = -1, entryTimer;
  try { preference = localStorage.getItem('seeraa-pause-animation') === 'true'; } catch (_) {}
  const paused = () => preference || media.matches;
  window.SeeraaMotion = {paused};
  const places = {
    badr: {name: 'Badr',art: 'badr',photo: 'badr-today',year: '2021',author: 'Prof. Mortel',license: 'CC BY 2.0',licenseURL: 'https://creativecommons.org/licenses/by/2.0/',source: 'https://commons.wikimedia.org/wiki/File:General_view_of_the_battlefield_and_burial_ground_of_Badr,_Saudi_Arabia,_site_of_the_historic_battle_between_the_Prophet_Muhammad_and_the_Quraysh_in_624_(4).jpg',wiki: 'https://en.wikipedia.org/wiki/Battle_of_Badr',alt: 'A present-day view of the Badr area with rocky ground, hills and buildings',look: 'In the illustration, find the wells, palms and open plain. In the photograph, look for hills and signs of modern life. What is different?'},
    'uhud-v2': {name: 'Mount Uḥud',art: 'uhud-v2',photo: 'uhud-today',year: '2019',author: 'Ahmed Abdulbasit (Pakistan)',license: 'CC BY-SA 4.0',licenseURL: 'https://creativecommons.org/licenses/by-sa/4.0/',source: 'https://commons.wikimedia.org/wiki/File:Mount_Uhud_Panorama.jpg',wiki: 'https://en.wikipedia.org/wiki/Mount_Uhud',alt: 'A wide modern panorama of the Mount Uhud area, including hills, roads and the mosque',look: 'Find the mountain ridge and the smaller hill in the illustration. Compare the open ground with the modern panorama. Which buildings and roads belong to the modern photograph?'}
  };
  const here = () => places[SEERAA_SCENES[viewWorld]?.asset];

  function syncMotion() {
    const next = paused(), now = performance.now(), living = window.SeeraaLiving;
    document.body.classList.toggle('seeraa-calm', next);
    if (living && next && !stopped) {
      pauseAt = now;
      for (const th of living.LW.theatres) if (th.pausedT == null) th.pausedT = Math.max(0, (now - th.start) / 1000) % th.cycle;
      cancelAnimationFrame(living.LW.raf); living.LW.raf = 0;
    } else if (living && !next && stopped) {
      living.LW.t0 += now - pauseAt;
      for (const th of living.LW.theatres) { th.start = now - (th.pausedT || 0) * 1000; delete th.pausedT; }
      living.resumeWeather?.();living.run();
    }
    stopped = next;
    const button = $('spMotion');
    if (button) {
      const label = media.matches ? 'Reduced motion' : next ? 'Play animation' : 'Pause animation';
      button.innerHTML = '<span class="sp-control-icon" aria-hidden="true">' + (next ? '▶' : 'Ⅱ') + '</span><span class="sp-control-label">' + label + '</span>';
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(next)); button.disabled = media.matches;
      button.title = media.matches ? 'Your device requests reduced motion.' : 'Pause or resume the scenery and story animations';
    }
  }
  media.addEventListener?.('change', syncMotion);

  function toolbar(frame) {
    let bar = $('spTools');
    if (!bar) {
      bar = document.createElement('div');bar.id = 'spTools';bar.className = 'sp-tools';
      const about = $('placeInfoButton'); if (about) {
        about.innerHTML = '<span class="sp-control-icon sp-info-icon" aria-hidden="true">i</span><span class="sp-control-label">About this place</span>';
        about.setAttribute('aria-label', 'About this place');about.title = 'About this place';bar.appendChild(about);
      }
      bar.insertAdjacentHTML('beforeend', '<button type="button" id="spPlace" class="sp-tool" title="Place today"><span class="sp-control-icon" aria-hidden="true">▧</span><span class="sp-control-label">Place today</span></button><button type="button" id="spMotion" class="sp-tool" aria-pressed="false">Ⅱ Pause animation</button>');
      frame.appendChild(bar);
      $('spPlace').onclick = () => openPlace(here());
      $('spMotion').onclick = () => {preference = !preference;try {localStorage.setItem('seeraa-pause-animation', String(preference));} catch (_) {}syncMotion();};
    }
    const p = here(); $('spPlace').hidden = !p;
    frame.style.setProperty('--sp-mobile-tools-width', p ? '128px' : '84px');
    if (p) $('spPlace').setAttribute('aria-label', 'Explore the illustration and real photograph of ' + p.name);
    syncMotion();
  }

  let returnFocus = null;
  function closePlace() {
    const dialog = $('spPlaceDialog');if (!dialog) return;
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    dialog.remove();document.body.classList.remove('sp-viewer-open');
    if (returnFocus?.isConnected) returnFocus.focus();
    window.SeeraaLiving?.run();
  }
  function openPlace(p) {
    if (!p) return;
    closePlace();returnFocus = document.activeElement === document.body ? $('spPlace') : document.activeElement;togglePlaceInformation(false);
    const dialog = document.createElement('dialog');dialog.id = 'spPlaceDialog';dialog.className = 'sp-place-dialog';dialog.setAttribute('aria-labelledby', 'spPlaceTitle');
    dialog.innerHTML = `<div class="sp-place-head"><div><p class="sp-eyebrow">Discover the landscape</p><h2 id="spPlaceTitle">${esc(p.name)}</h2></div><button type="button" id="spPlaceClose" class="sp-close" aria-label="Close place viewer">×</button></div>
      <div class="sp-place-tabs" role="tablist" aria-label="Place image"><button type="button" id="spTabArt" role="tab" aria-selected="true" aria-controls="spPicture">Illustration</button><button type="button" id="spTabPhoto" role="tab" aria-selected="false" aria-controls="spPicture" tabindex="-1">Place today</button></div>
      <figure id="spPicture" role="tabpanel" aria-labelledby="spTabArt"><div class="sp-image-wrap"><img id="spPlaceImage" src="assets/scenes/${p.art}.webp" alt="Historically inspired illustration of ${esc(p.name)}" width="1536" height="1024"><p id="spPhotoError" hidden>Image unavailable. You can still open the original photograph using the link below.</p></div><figcaption id="spImageCaption">An imagined historical setting for the course. Compare it with a real photograph of the place.</figcaption></figure>
      <div class="sp-place-bottom"><details><summary>Look closely · explore together</summary><p>${esc(p.look)}</p></details><div class="sp-place-links"><a href="${p.wiki}" target="_blank" rel="noopener noreferrer">Read about the place ↗</a><a href="${p.source}" target="_blank" rel="noopener noreferrer">Original photograph ↗</a></div><p class="sp-credit">Photo: ${esc(p.author)} · ${p.year} · <a href="${p.licenseURL}" target="_blank" rel="noopener noreferrer">${p.license}</a>. Resized and converted to WebP. Illustration: AI-generated for this course.</p></div>`;
    document.body.appendChild(dialog);document.body.classList.add('sp-viewer-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();else dialog.setAttribute('open', '');
    $('spPlaceClose').onclick = closePlace;
    dialog.addEventListener('cancel', e => {e.preventDefault();closePlace();});
    dialog.addEventListener('click', e => {if (e.target === dialog) {const r = dialog.getBoundingClientRect();if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closePlace();}});
    const tabs = [$('spTabArt'), $('spTabPhoto')];
    function select(photo) {
      tabs.forEach((b, i) => {const on = i === Number(photo);b.setAttribute('aria-selected', String(on));b.tabIndex = on ? 0 : -1;});
      $('spPicture').setAttribute('aria-labelledby', photo ? 'spTabPhoto' : 'spTabArt');
      const img = $('spPlaceImage');img.src = `assets/${photo ? 'places/' + p.photo : 'scenes/' + p.art}.webp`;
      img.alt = photo ? p.alt : 'Historically inspired illustration of ' + p.name;
      img.hidden = false; img.classList.toggle('sp-panorama', photo && p.art === 'uhud-v2');$('spPhotoError').hidden = true;
      $('spImageCaption').textContent = photo ? `A real photograph of the ${p.name} area, taken in ${p.year}.` : 'An imagined historical setting for the course. Compare it with a real photograph of the place.';
    }
    tabs.forEach((b, i) => {b.onclick = () => select(i === 1);b.onkeydown = e => {if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {e.preventDefault();select(i === 0);tabs[1 - i].focus();}};});
    $('spPlaceImage').onerror = () => {$('spPlaceImage').hidden = true;$('spPhotoError').hidden = false;};
    $('spPlaceClose').focus();
  }

  function decorate() {
    const svg = $('mapSvg'), frame = svg?.closest('.map-frame');if (!frame || !MAP_GEO) return;
    toolbar(frame);
    const p = here(), photo = $('historicalCaption')?.querySelector('.present-day-photo');
    if (p && photo) {
      const credit = photo.querySelector('.photo-credit');credit.textContent = p.author + ' · ' + p.license;credit.href = p.source;
      if (!photo.querySelector('.sp-photo-license')) photo.insertAdjacentHTML('beforeend', `<a class="sp-photo-license" href="${p.licenseURL}" target="_blank" rel="noopener noreferrer">Licence · resized / WebP</a>`);
    } else photo?.querySelector('.sp-photo-license')?.remove();
    if (p && photo?.querySelector('.sp-photo-license')) photo.querySelector('.sp-photo-license').href = p.licenseURL;
    positionPlaceInformation();
    // Existing click handlers still enforce student access and animate the avatar.
    svg.querySelectorAll('.node[data-i]').forEach(node => {
      const l = lessons[Number(node.dataset.i)];node.setAttribute('role', 'button');node.setAttribute('tabindex', '0');
      node.setAttribute('aria-label', `Lesson ${l?.lines || Number(node.dataset.i) + 1}: ${l?.title || 'Explore'}${node.classList.contains('locked') ? ' · locked' : profile.stars[Number(node.dataset.i)] ? ' · completed' : ''}`);
      node.setAttribute('aria-disabled', String(node.classList.contains('locked')));
      node.onkeydown = e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();node.dispatchEvent(new MouseEvent('click', {bubbles:true}));}};
    });
    if (lastMap !== viewWorld) {
      lastMap = viewWorld;frame.classList.remove('sp-arrive');clearTimeout(entryTimer);
      if (!paused()) {void frame.offsetWidth;frame.classList.add('sp-arrive');entryTimer = setTimeout(() => frame.classList.remove('sp-arrive'), 800);}
    }
  }
  const layoutBefore = layoutMapRoad;
  layoutMapRoad = function () {const result = layoutBefore.apply(this, arguments);decorate();return result;};
  const showBefore = show;
  show = function (id) {const result = showBefore.apply(this, arguments);if (id !== 'mapScreen') togglePlaceInformation(false);window.SeeraaLiving?.run();return result;};
  const lessonBefore = renderLesson;
  renderLesson = function () {const result = lessonBefore.apply(this, arguments);const stage = $('stage');stage.classList.remove('sp-read-in');if (!paused()) {void stage.offsetWidth;stage.classList.add('sp-read-in');}return result;};
  const finishBefore = finishLesson;
  finishLesson = function () {
    const first = !profile.stars[current], result = finishBefore.apply(this, arguments);
    if (first && profile.stars[current] && !paused()) {
      document.querySelector('.sp-celebration')?.remove();const burst = document.createElement('div');burst.className = 'sp-celebration';burst.setAttribute('aria-hidden', 'true');
      burst.innerHTML = Array.from({length:14}, (_,i) => `<i style="--sp-x:${Math.round(Math.cos(i * Math.PI / 7) * (65 + i % 3 * 30))}px;--sp-y:${Math.round(Math.sin(i * Math.PI / 7) * (50 + i % 4 * 25))}px;--sp-turn:${i * 45}deg;--sp-delay:${i % 3 * 35}ms">✦</i>`).join('');
      document.body.appendChild(burst);setTimeout(() => burst.remove(), 1400);
    }
    return result;
  };
  syncMotion();
  window.SeeraaMapPolish = {openPlace: () => openPlace(here()), closePlace, refresh: decorate};
})();
