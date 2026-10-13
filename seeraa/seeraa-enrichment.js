/* Additional Seeraa stops keep the original lesson IDs, accounts and teacher gates. */
(function () {
  'use strict';
  const data = window.SEERAA_ENRICHMENT;
  if (!data) return;
  const esc = escapeHtml;
  const keyFor = id => GAME_KEY + '_extra_' + id;
  const safeUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; } };
  const link = (url, label) => safeUrl(url) ? `<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>` : esc(label);
  const complete = id => !!(profile && profile.seeraaExplored && profile.seeraaExplored[id]);
  const accessible = item => !!item && (teacherMode || worldUnlocked(item.map));
  let activeId = null, returnFocus = null;

  function storyFor(id) {
    const original = data.stories.find(s => s.id === id);
    if (!original) return null;
    const edit = contentEdits[keyFor(id)] || {};
    return Object.assign({}, original, edit, {
      id: original.id, map: original.map,
      story: Array.isArray(edit.story) && edit.story.length ? edit.story : original.story,
      pairs: Array.isArray(edit.pairs) && edit.pairs.length ? edit.pairs : original.pairs,
      question: edit.questions && edit.questions[0] || original.question,
      evidenceCards: original.evidence.map((key, i) => Object.assign({}, data.evidence[key], edit.evidenceCards && edit.evidenceCards[i]))
    });
  }

  function evidenceHTML(cards) {
    return `<div class="se-evidence-grid">${cards.map(e => `<article class="se-evidence">
      <div class="se-evidence-heading">${esc(e.kind)} · ${esc(e.ref)}${e.excerpt ? ' · excerpt' : ''}</div>
      <p class="se-arabic" lang="ar" dir="rtl">${esc(e.ar)}</p>
      <p class="se-meaning"><small>English meaning</small>${esc(e.en)}</p>
      <div class="se-source-link">${link(e.url, 'Read the full source')}</div>
    </article>`).join('')}</div>`;
  }

  // A clearly labelled map reflection alongside each of the 60 original stories.
  const mapEvidence = [
    ['one','intent'], ['orphans','care'], ['trust','honesty'], ['read','learn'], ['faith','six'],
    ['equal','brother'], ['wisdom','gentle'], ['isra','miraj'], ['cave','help'], ['give','five'],
    ['consult','brother'], ['promise','help'], ['peace','gentle'], ['hajj','rights'], ['example','pass']
  ];
  const beforeStory = renderMatn;
  renderMatn = function (lesson) {
    const result = beforeStory.apply(this, arguments);
    const own = contentEdits[GAME_KEY + '_map_evidence_' + lesson.world];
    const cards = mapEvidence[lesson.world].map((key, i) => Object.assign({}, data.evidence[key], own && own.evidenceCards && own.evidenceCards[i]));
    document.querySelector('#stage').insertAdjacentHTML('beforeend', `<details class="se-reflection"><summary>Qur’an &amp; Hadith · reflect on this map</summary>
      <p class="se-source-note">Related guidance for Map ${lesson.world + 1}. English meanings are simplified for young readers. A quotation is labelled when it is an excerpt.</p>${evidenceHTML(cards)}${teacherMode ? '<button type="button" class="ghost" id="seEditMapEvidence">✏ Edit this map’s quotations</button>' : ''}</details>`);
    document.querySelector('#seEditMapEvidence')?.addEventListener('click', () => editMapEvidence(lesson.world, cards));
    return result;
  };

  function updateShelf() {
    const help = document.querySelector('#mapHelp');
    if (!help) return;
    let shelf = document.querySelector('#seExtraStories');
    if (!shelf) { shelf = document.createElement('section'); shelf.id = 'seExtraStories'; }
    const menu = document.querySelector('#mapDrawer .md-list');
    if (menu) menu.after(shelf); else help.after(shelf);
    const stories = data.stories.filter(s => s.map === viewWorld).map(s => storyFor(s.id));
    shelf.innerHTML = `<div class="se-shelf-heading"><b>Explore more · Map ${viewWorld + 1}</b><span>${stories.filter(s => complete(s.id)).length} / 2 explored</span></div><div class="se-shelf-links">${stories.map((s, i) => `<button type="button" data-extra-story="${s.id}" ${accessible(s) ? '' : 'disabled'}><span class="se-book-letter">${complete(s.id) ? '✓' : ['A','B'][i]}</span><span>${esc(s.title)}<small>Story · matching · challenge</small></span></button>`).join('')}</div>`;
    shelf.querySelectorAll('[data-extra-story]').forEach(b => b.onclick = () => openStory(b.dataset.extraStory));
  }

  function placeStops() {
    const svg = document.querySelector('#mapSvg'), L = MAP_GEO;
    if (!svg || !L || !L.road) return;
    svg.querySelectorAll('.se-story-stop').forEach(el => el.remove());
    const nodes = [...svg.querySelectorAll('.node')];
    if (nodes.length !== 4) return;
    const spots = placeAlong(L.road, 8);
    const lessonSlots = [0, 1, 3, 4];
    L.lessons = lessonSlots.map(i => spots[i].p);
    nodes.forEach((node, i) => node.setAttribute('transform', `translate(${L.lessons[i].join(' ')})`));
    L.flash = spots[6].p; L.quiz = spots[7].p; L.quizS = spots[7].s;
    document.querySelector('#roadFlashBtn')?.setAttribute('transform', `translate(${L.flash.join(' ')})`);
    document.querySelector('#roadQuizBtn')?.setAttribute('transform', `translate(${L.quiz.join(' ')})`);
    L.extraStories = [spots[2].p, spots[5].p];
    const stories = data.stories.filter(s => s.map === viewWorld);
    stories.forEach((original, i) => {
      const s = storyFor(original.id), p = L.extraStories[i], done = complete(s.id), allowed = accessible(s);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'se-story-stop' + (done ? ' explored' : '') + (allowed ? '' : ' locked'));
      g.setAttribute('transform', `translate(${p.join(' ')})`); g.setAttribute('role', 'button');
      g.setAttribute('tabindex', allowed ? '0' : '-1'); g.setAttribute('aria-disabled', String(!allowed));
      g.setAttribute('aria-label', `Extra story ${i + 1}: ${s.title}${done ? ', explored' : ''}`);
      g.dataset.storyId = s.id;
      g.innerHTML = `<title>${esc(s.title)}</title><circle r="40" fill="transparent"/><circle class="se-stop-disc" r="28" fill="url(#dustMarker)" stroke="${done ? '#496e45' : '#755832'}" stroke-width="2"/><path d="M-16-12Q-8-15 0-10Q8-15 16-12V8Q8 5 0 10Q-8 5-16 8Z" fill="#f6e7c6" stroke="#7e623e" stroke-width="1.7"/><path d="M0-10V10" stroke="#7e623e"/><text x="0" y="8" text-anchor="middle" font-size="16" font-weight="800" fill="#4b3925">${done ? '✓' : ['A','B'][i]}</text>`;
      const open = () => { if (allowed) openStory(s.id); };
      g.onclick = open; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
      svg.appendChild(g);
    });
    positionPlaceInformation();
    updateShelf();
  }
  const layoutBeforeExtras = layoutMapRoad;
  layoutMapRoad = function () { const result = layoutBeforeExtras.apply(this, arguments); placeStops(); return result; };
  const renderMapBeforeExtraShelf = renderMap;
  renderMap = function () { const result = renderMapBeforeExtraShelf.apply(this, arguments); updateShelf(); return result; };

  function closeStory(restore = true) {
    const dialog = document.querySelector('#seStoryDialog');
    if (!dialog) return;
    stopVoicePlayback();
    if (typeof dialog.close === 'function') dialog.close();
    dialog.remove(); document.body.classList.remove('se-story-open'); activeId = null;
    if (restore && returnFocus && returnFocus.isConnected) returnFocus.focus();
  }

  function openStory(id) {
    const s = storyFor(id);
    if (!accessible(s)) return;
    closeStory(false); cancelAutoOpen(); togglePlaceInformation(false);
    returnFocus = document.activeElement; activeId = id;
    const scene = SEERAA_SCENES[s.map];
    const dialog = document.createElement('dialog'); dialog.id = 'seStoryDialog';
    dialog.setAttribute('aria-labelledby', 'seStoryTitle');
    dialog.style.setProperty('--se-extra-photo', `url("assets/scenes/${scene.asset}.webp")`);
    dialog.innerHTML = `<div class="se-story-card"><header class="se-story-head"><div><div class="se-eyebrow">Map ${s.map + 1} · Extra story</div><p>${esc(s.place)}</p></div><button type="button" id="seCloseStory" aria-label="Close story and return to map">✕</button></header>
      <div class="se-story-body"><h1 id="seStoryTitle">${esc(s.title)}</h1><div class="se-story-intro">Read a little. Think together. Try the challenge.</div>
      <section class="se-story-reading" aria-label="Story">${s.story.map(p => `<p>${esc(p)}</p>`).join('')}</section>
      <div class="se-story-tools"><button type="button" class="ghost" id="seListen">Listen to the story</button>${teacherMode ? '<button type="button" class="ghost" id="seEditStory">✏ Edit this story</button>' : ''}</div>
      <div class="se-think"><p><strong>Ages 7–10 · Talk together</strong>${esc(s.younger)}</p><details><summary>Ages 11–15 · Think deeper</summary><p>${esc(s.older)}</p></details></div>
      <details class="se-reflection" open><summary>Qur’an &amp; authentic Hadith · Arabic and English</summary>${evidenceHTML(s.evidenceCards)}<p class="se-source-note">English meanings are simplified for young readers. Excerpts are part of a longer ayah or hadith.</p></details>
      <section class="se-match-section" aria-labelledby="seMatchHeading"><div class="se-section-number">1</div><h2 id="seMatchHeading">Connect the ideas</h2><p>Choose a word on the left, then its meaning on the right.</p><div class="se-matching"><div class="se-match-words">${s.pairs.map((p, i) => `<button type="button" data-se-word="${i}" aria-pressed="false">${esc(p[0])}</button>`).join('')}</div><div class="se-match-meanings">${shuffled(s.pairs.map((p, i) => ({p, i}))).map(({p, i}) => `<button type="button" data-se-meaning="${i}">${esc(p[1])}</button>`).join('')}</div></div><p id="seMatchFeedback" class="se-feedback" role="status">0 / ${s.pairs.length} matched</p></section>
      <section class="se-check-section" aria-labelledby="seCheckHeading"><div class="se-section-number">2</div><h2 id="seCheckHeading">What did you discover?</h2><p>${esc(s.question.q)}</p><div class="se-check-choices">${shuffled(s.question.choices.map((c, i) => ({c, i}))).map(({c, i}) => `<button type="button" data-se-answer="${i}" disabled>${esc(c)}</button>`).join('')}</div><p id="seCheckFeedback" class="se-feedback" role="status">Finish the matching to try this question.</p></section>
      <footer class="se-story-sources"><strong>Where this learning comes from</strong><p>${link(data.book.url, data.book.title)} · ${esc(data.book.author)}<br>Related chapters: ${esc(s.chapter)}</p><p>Original summaries and classroom activities for ages 7–15. Qur’an and hadith references are linked separately above.${s.extraSources && s.extraSources.length ? '<br>' + s.extraSources.map((url, i) => link(url, 'Supporting narration ' + (i + 1))).join(' · ') : ''}</p></footer>
      <div class="se-story-finish"><p id="seSavedStatus" role="status">${complete(id) ? '✓ You have already explored this story. You can practise again.' : ''}</p><button type="button" class="btn green" id="seBackToMap">Back to map →</button></div></div></div>`;
    document.body.appendChild(dialog); document.body.classList.add('se-story-open');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else { dialog.setAttribute('open', ''); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); }
    dialog.querySelector('#seCloseStory').onclick = dialog.querySelector('#seBackToMap').onclick = () => closeStory();
    dialog.addEventListener('cancel', e => { e.preventDefault(); closeStory(); });
    dialog.querySelector('#seListen').onclick = () => seeraaSay(s.story.join('\n\n'));
    dialog.querySelector('#seEditStory')?.addEventListener('click', () => editStory(id));
    let selected = null; const matched = new Set();
    dialog.querySelectorAll('[data-se-word]').forEach(button => button.onclick = () => {
      selected = +button.dataset.seWord;
      dialog.querySelectorAll('[data-se-word]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      dialog.querySelector('#seMatchFeedback').textContent = 'Now find the meaning of “' + s.pairs[selected][0] + '”.';
    });
    dialog.querySelectorAll('[data-se-meaning]').forEach(button => button.onclick = () => {
      const feedback = dialog.querySelector('#seMatchFeedback');
      if (selected === null) { feedback.textContent = 'First choose a word on the left.'; return; }
      if (+button.dataset.seMeaning !== selected) { feedback.textContent = 'Try another meaning. The story can help you.'; return; }
      matched.add(selected); const word = dialog.querySelector(`[data-se-word="${selected}"]`);
      word.disabled = button.disabled = true; word.classList.add('se-matched'); button.classList.add('se-matched'); word.setAttribute('aria-pressed', 'false'); selected = null;
      feedback.textContent = `${matched.size} / ${s.pairs.length} matched${matched.size === s.pairs.length ? ' · Well done! Try the question below.' : ''}`;
      if (matched.size === s.pairs.length) { dialog.querySelectorAll('[data-se-answer]').forEach(b => b.disabled = false); dialog.querySelector('#seCheckFeedback').textContent = 'Choose the answer that fits the story.'; }
    });
    dialog.querySelectorAll('[data-se-answer]').forEach(button => button.onclick = () => {
      if (matched.size !== s.pairs.length) return;
      const feedback = dialog.querySelector('#seCheckFeedback');
      if (+button.dataset.seAnswer !== s.question.answer) { feedback.textContent = 'Have another look at the story, then try again.'; return; }
      feedback.textContent = 'Yes! You connected the ideas and understood the story.';
      button.classList.add('se-matched'); dialog.querySelectorAll('[data-se-answer]').forEach(b => b.disabled = true);
      if (!profile.seeraaExplored) profile.seeraaExplored = {};
      profile.seeraaExplored[id] = {completedAt: new Date().toISOString()}; save();
      dialog.querySelector('#seSavedStatus').textContent = '✓ Story explored. Your progress is saved.';
      placeStops();
    });
    dialog.querySelector('#seCloseStory').focus();
  }

  function editStory(id) {
    const s = storyFor(id); if (!teacherMode || !s) return;
    closeStory(false);
    const field = (label, id, value, extra = '') => `<label class="tm-lab">${esc(label)}<textarea class="tm-in" id="${id}" ${extra}>${esc(value)}</textarea></label>`;
    openEditor({
      id: keyFor(id), title: 'Edit extra Seeraa story', edited: editedWhen(keyFor(id)),
      fields: field('Story title', 'seEditTitle', s.title) + field('Place / setting', 'seEditPlace', s.place) + field('Story · leave a blank line between paragraphs', 'seEditText', s.story.join('\n\n'), 'style="min-height:230px"') + field('Ages 7–10 question', 'seEditYounger', s.younger) + field('Ages 11–15 question', 'seEditOlder', s.older) +
        '<h3>Matching cards</h3>' + s.pairs.map((p, i) => `<div class="tm-row">${field('Word ' + (i + 1), 'seEditWord' + i, p[0])}${field('Meaning ' + (i + 1), 'seEditMeaning' + i, p[1])}</div>`).join('') +
        '<h3>Qur’an and hadith · verify quotations before saving</h3>' + s.evidenceCards.map((e, i) => `<fieldset><legend>${esc(e.kind)}</legend>${field('Reference', 'seEditRef' + i, e.ref)}${field('Arabic', 'seEditAr' + i, e.ar, 'lang="ar" dir="rtl"')}${field('English meaning', 'seEditEn' + i, e.en)}${field('Full source HTTPS link', 'seEditUrl' + i, e.url)}<label><input type="checkbox" id="seEditExcerpt${i}" ${e.excerpt ? 'checked' : ''}> This is an excerpt</label></fieldset>`).join('') + field('Related book chapters', 'seEditChapter', s.chapter),
      qTitle: 'Understanding question', qNote: 'Select the correct answer. The question opens after matching is complete.', qs: [s.question], qLabel: () => 'Story question',
      readFields: ed => {
        const val = (name, fallback) => ed.querySelector('#' + name).value.trim() || fallback;
        return {
          title: val('seEditTitle', s.title), place: val('seEditPlace', s.place), story: val('seEditText', s.story.join('\n\n')).split(/\n\s*\n/), younger: val('seEditYounger', s.younger), older: val('seEditOlder', s.older), chapter: val('seEditChapter', s.chapter),
          pairs: s.pairs.map((p, i) => [val('seEditWord' + i, p[0]), val('seEditMeaning' + i, p[1])]),
          evidenceCards: s.evidenceCards.map((e, i) => Object.assign({}, e, {ref: val('seEditRef' + i, e.ref), ar: val('seEditAr' + i, e.ar), en: val('seEditEn' + i, e.en), url: safeUrl(val('seEditUrl' + i, e.url)) || e.url, excerpt: ed.querySelector('#seEditExcerpt' + i).checked}))
        };
      },
      after: () => { placeStops(); openStory(id); }
    });
  }

  function editMapEvidence(map, cards) {
    if (!teacherMode) return;
    const id = GAME_KEY + '_map_evidence_' + map;
    const field = (label, name, value, extra = '') => `<label class="tm-lab">${esc(label)}<textarea class="tm-in" id="${name}" ${extra}>${esc(value)}</textarea></label>`;
    openEditor({id, title: `Map ${map + 1} · Qur’an and hadith`, edited: editedWhen(id),
      fields: '<p class="tm-help">These quotations appear with all four original stories on this map. Verify Arabic and English against the linked source before saving.</p>' + cards.map((e, i) => `<fieldset><legend>${esc(e.kind)}</legend>${field('Reference', 'seMapRef' + i, e.ref)}${field('Arabic', 'seMapAr' + i, e.ar, 'lang="ar" dir="rtl"')}${field('English meaning', 'seMapEn' + i, e.en)}${field('Full source HTTPS link', 'seMapUrl' + i, e.url)}<label><input type="checkbox" id="seMapExcerpt${i}" ${e.excerpt ? 'checked' : ''}> This is an excerpt</label></fieldset>`).join(''),
      qs: [], qTitle: '', qLabel: () => '',
      readFields: ed => {const val = (name, fallback) => ed.querySelector('#' + name).value.trim() || fallback; return {evidenceCards: cards.map((e, i) => Object.assign({}, e, {ref: val('seMapRef' + i, e.ref), ar: val('seMapAr' + i, e.ar), en: val('seMapEn' + i, e.en), url: safeUrl(val('seMapUrl' + i, e.url)) || e.url, excerpt: ed.querySelector('#seMapExcerpt' + i).checked}))};},
      after: () => renderLesson()
    });
  }

  document.head.insertAdjacentHTML('beforeend', `<style>
    .se-story-stop{cursor:pointer}.se-story-stop.locked{opacity:.55;cursor:default}.se-story-stop:focus-visible .se-stop-disc,.se-story-stop:hover .se-stop-disc{stroke:#fff5d8;stroke-width:4}.se-story-stop.explored .se-stop-disc{stroke-width:4}
    #seExtraStories{max-width:1040px;margin:12px auto 20px;padding:15px;border:1px solid #dcc7a1;border-radius:18px;background:#fffbf1;color:#493923;font:15px/1.5 Nunito,system-ui}.se-shelf-heading{display:flex;justify-content:space-between;gap:10px;margin-bottom:10px}.se-shelf-heading span{font-size:12px;color:#6b624e}.se-shelf-links{display:grid;grid-template-columns:1fr 1fr;gap:10px}.se-shelf-links button{display:flex;gap:12px;align-items:center;background:#f4ead6;color:#473721;border:1px solid #d9c299;border-radius:12px;padding:13px;text-align:left;font:700 15px/1.4 Nunito,system-ui;cursor:pointer}.se-shelf-links button:disabled{opacity:.5;cursor:default}.se-shelf-links small{display:block;font-weight:400;font-size:12px;margin-top:3px}.se-book-letter{border:1px solid #b69969;border-radius:50%;display:grid;place-items:center;width:34px;height:34px;flex-shrink:0;background:#e9d7b1}
    #seStoryDialog{width:min(900px,calc(100% - 28px));max-height:92dvh;border:1px solid #c8ab7a;border-radius:24px;padding:0;background:#fffaf0;color:#3d3225;box-shadow:0 24px 100px #251e1660;overflow:auto;font:16px/1.7 Nunito,system-ui}#seStoryDialog::backdrop{background:#201b12a8;backdrop-filter:blur(4px)}.se-story-open{overflow:hidden}.se-story-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:25px 32px;background:linear-gradient(90deg,#493721ed,#49372185),var(--se-extra-photo) center 55%/cover;color:#fff7e7}.se-story-head p{margin:4px 0;font-size:14px}.se-eyebrow{font-weight:800;text-transform:uppercase;letter-spacing:.13em;font-size:11px}.se-story-head button{border:1px solid #fff8;background:#fff3;color:white;border-radius:50%;width:42px;height:42px;flex-shrink:0;font-size:20px;cursor:pointer}.se-story-body{padding:28px 36px}.se-story-body h1{font-size:clamp(26px,4vw,37px);line-height:1.2;margin:0 0 10px;color:#503c28}.se-story-intro{color:#7c694c;font-size:14px}.se-story-reading{font-size:18px;line-height:1.85}.se-story-reading p{margin:22px 0}.se-story-tools{display:flex;gap:12px;flex-wrap:wrap}.se-think{padding:14px 20px;margin:24px 0;background:#eef1e5;border-left:4px solid #6a7a53;border-radius:0 12px 12px 0}.se-think strong{display:block;font-size:13px;margin-bottom:6px}.se-think p{margin:8px 0}.se-think summary{font-weight:700;font-size:14px;cursor:pointer}
    .se-reflection{margin:24px 0;padding:18px;border:1px solid #d8c6a9;border-radius:16px;background:#faf5e9;text-align:left}.se-reflection>summary{font:800 16px/1.5 Nunito,system-ui;color:#57442b;cursor:pointer}.se-evidence-grid{display:grid;grid-template-columns:1fr;gap:15px;margin-top:16px}.se-evidence{border:1px solid #e4d8bd;border-radius:12px;padding:19px;background:#fffdf6}.se-evidence-heading{color:#6c5940;font:800 12px/1.5 Nunito,system-ui}.se-arabic{font-family:Amiri,'Noto Naskh Arabic','Traditional Arabic',serif;font-size:clamp(26px,4vw,32px);line-height:2.1;margin:14px 0;color:#3f5239;text-align:right}.se-meaning{font:16px/1.7 Nunito,system-ui;margin:12px 0}.se-meaning small{display:block;color:#7b705e;font-size:11px;text-transform:uppercase;letter-spacing:.06em}.se-source-link a,.se-story-sources a{color:#386342;text-decoration:underline;text-underline-offset:3px}.se-source-link{font-size:12px}.se-source-note{font:12px/1.6 Nunito,system-ui;color:#77664d;margin:12px 0 0}
    .se-match-section,.se-check-section{margin:32px 0;padding-top:26px;border-top:1px solid #deceb0;position:relative}.se-section-number{display:inline-grid;place-items:center;border-radius:50%;width:27px;height:27px;background:#e9d9b8;font-size:13px;font-weight:800}.se-story-body h2{font-size:22px;line-height:1.4;margin:8px 0}.se-matching{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}.se-match-words,.se-match-meanings,.se-check-choices{display:flex;flex-direction:column;gap:9px}.se-matching button,.se-check-choices button{border:1px solid #cbbb9e;border-radius:12px;background:#fffdf7;color:#493923;padding:13px 15px;font:700 15px/1.5 Nunito,system-ui;cursor:pointer;min-height:58px;text-align:left}.se-matching button[aria-pressed="true"]{border:2px solid #775a31;background:#f0dfb9}.se-matching button:focus-visible,.se-check-choices button:focus-visible{outline:3px solid #578875;outline-offset:2px}.se-matched{background:#e4edd9!important;border-color:#7b9969!important;color:#37502e!important;opacity:1!important}.se-check-choices button:disabled:not(.se-matched){opacity:.55;cursor:default}.se-matching button:disabled{cursor:default}.se-feedback{min-height:25px;color:#5a6c3f;font-weight:700;font-size:14px}.se-story-sources{padding:20px 0;border-top:1px solid #deceb0;font-size:12px;line-height:1.7;color:#77674e}.se-story-sources strong{color:#534630}.se-story-sources p{margin:8px 0}.se-story-finish{text-align:center;padding:15px 0 4px}.se-story-finish p{font-weight:700;color:#536b40;font-size:14px}
    @media(max-width:620px){#seStoryDialog{width:calc(100% - 12px);max-height:96dvh;border-radius:17px}.se-story-body{padding:23px 18px}.se-story-head{padding:19px 18px}.se-story-reading{font-size:17px}.se-reflection{padding:12px}.se-evidence{padding:14px}.se-shelf-links{grid-template-columns:1fr}.se-matching{gap:8px}.se-matching button{padding:11px 10px;font-size:14px}.se-shelf-heading{font-size:13px}}
  </style>`);
  window.SeeraaExtraStories = {open: openStory, close: closeStory, edit: editStory, get: storyFor, refresh: placeStops};
  if (document.querySelector('#mapSvg .node')) placeStops();
})();
