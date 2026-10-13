/* Staff edits use the existing course-content collection and staff permissions. */
(function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const originals = lessons.map(l => clone(l.seerah));
  const originalDuaFor = seeraaDuaFor;
  const esc = escapeHtml;

  function defaults(l) {
    const x = originals[lessons.indexOf(l)], d = originalDuaFor(l);
    return {
      chapter: x.chapter,
      vocab: clone(x.vocab),
      pairs: [{q: x.picks[0].q, a: x.picks[0].options[0]}, {q: 'Which chapter are we exploring?', a: x.chapter}, {q: 'What lesson can we practise?', a: lessonEditFor(l)?.simple || x.benefit}],
      dua: Object.assign({}, d, {url: 'https://quran.com/' + d.ref.replace(':', '/'), note: 'A Qur’anic du‘a for practising this theme; this does not mean it was said during this Seeraa event.', distractors: SEERAA_DUAS.filter(x => x !== d).map(x => x.meaning)}),
      challenge: {type: x.order && x.order.items.length > 1 ? 'order' : 'facts', prompt: x.order?.prompt || 'Put the story events in order', items: x.order?.items || [], facts: x.tf?.length ? clone(x.tf) : x.picks[0].options.map((answer, i) => ({s: 'Question: ' + x.picks[0].q + '\nSuggested answer: ' + answer, a: i === 0}))}
    };
  }
  function activityFor(l) {
    const base = defaults(l), saved = lessonEditFor(l)?.activities;
    return saved ? Object.assign(base, clone(saved), {dua: Object.assign(base.dua, saved.dua), challenge: Object.assign(base.challenge, saved.challenge)}) : base;
  }
  window.SeeraaContentEditor = {forLesson: activityFor, pairsFor: l => activityFor(l).pairs};
  seeraaDuaFor = l => activityFor(l).dua;

  const applyBefore = applyContentEdits;
  applyContentEdits = function () {
    applyBefore.apply(this, arguments);
    lessons.forEach((l, i) => {
      const a = activityFor(l);
      l.seerah = Object.assign(clone(originals[i]), {chapter: a.chapter, vocab: clone(a.vocab), benefit: lessonEditFor(l)?.simple || originals[i].benefit, order: a.challenge.type === 'order' ? {prompt: a.challenge.prompt, items: clone(a.challenge.items)} : null, tf: clone(a.challenge.facts)});
    });
  };

  const field = (label, id, value, extra = '') => `<label class="tm-label">${esc(label)}<textarea class="tm-in" id="${id}" maxlength="3000" ${extra}>${esc(value || '')}</textarea></label>`;
  function pairRow(kind, values) {
    const vocab = kind === 'vocab';
    return `<div class="sa-row" data-sa-row="${kind}"><label class="tm-label">${vocab ? 'Word' : 'Clue'}<textarea class="tm-in" data-sa-left maxlength="800" ${vocab ? 'dir="auto"' : ''}>${esc(values[0])}</textarea></label><label class="tm-label">${vocab ? 'Meaning' : 'Matching answer'}<textarea class="tm-in" data-sa-right maxlength="1200">${esc(values[1])}</textarea></label><button type="button" class="ghost" data-sa-remove aria-label="Remove this pair">Remove</button></div>`;
  }
  function factRow(fact) {
    return `<div class="sa-fact" data-sa-row="fact"><label class="tm-label">Statement<textarea class="tm-in" data-sa-statement maxlength="1200">${esc(fact.s)}</textarea></label><label class="tm-label">Correct answer<select class="tm-in" data-sa-truth><option value="true" ${fact.a ? 'selected' : ''}>True</option><option value="false" ${fact.a ? '' : 'selected'}>False</option></select></label><button type="button" class="ghost" data-sa-remove>Remove</button></div>`;
  }
  function fields(l) {
    const a = activityFor(l), d = a.dua, c = a.challenge;
    return `<h3 class="tm-sub">Lesson activities</h3><p class="tm-help">Edit the content of each activity below. Changes apply to this lesson for every student.</p>
      ${field('Book chapter / source description', 'saChapter', a.chapter)}
      <details class="sa-section"><summary>Words · vocabulary matching</summary><div id="saVocab">${a.vocab.map(p => pairRow('vocab', p)).join('')}</div><button type="button" class="ghost" data-sa-add="vocab">＋ Add a word pair</button></details>
      <details class="sa-section"><summary>Story Match · clues and answers</summary><div id="saPairs">${a.pairs.map(p => pairRow('pair', [p.q, p.a])).join('')}</div><button type="button" class="ghost" data-sa-add="pair">＋ Add a story pair</button></details>
      <details class="sa-section"><summary>Du‘a · Arabic, meaning and meaning check</summary><p class="tm-help">Check the Arabic, English meaning and reference against the linked source before saving.</p>
        ${field('Du‘a title', 'saDuaTitle', d.title)}${field('Arabic', 'saDuaAr', d.ar, 'lang="ar" dir="rtl"')}${field('Pronunciation', 'saDuaRead', d.read)}${field('English meaning · correct answer', 'saDuaMeaning', d.meaning)}${field('Reference', 'saDuaRef', d.ref)}${field('Full source HTTPS link', 'saDuaUrl', d.url)}${field('Connection to this lesson', 'saDuaTheme', d.theme)}${field('Source note', 'saDuaNote', d.note)}
        ${d.distractors.map((text, i) => field('Meaning check · incorrect answer ' + (i + 1), 'saDuaWrong' + i, text)).join('')}
      </details>
      <details class="sa-section"><summary>Story Challenge · event order or true / false</summary><label class="tm-label">Activity type<select class="tm-in" id="saChallengeType"><option value="order" ${c.type === 'order' ? 'selected' : ''}>Put events in order</option><option value="facts" ${c.type === 'facts' ? 'selected' : ''}>True / false story detective</option></select></label>
        <div id="saOrderFields">${field('Instructions', 'saOrderPrompt', c.prompt)}${field('Events in the correct order · one event per line', 'saOrderItems', c.items.join('\n'), 'style="min-height:160px"')}</div>
        <div id="saFactFields"><div id="saFacts">${c.facts.map(factRow).join('')}</div><button type="button" class="ghost" data-sa-add="fact">＋ Add a statement</button></div>
      </details>`;
  }
  function read(ed) {
    const val = id => ed.querySelector('#' + id).value.trim();
    function required(id, label) { const value = val(id); if (!value) throw new Error(label + ' cannot be blank.'); return value; }
    function pairs(kind, min, name) {
      const rows = [...ed.querySelectorAll(`[data-sa-row="${kind}"]`)];
      if (rows.length < min || rows.length > 12) throw new Error(name + ' needs ' + min + '–12 pairs.');
      return rows.map(row => {
        const p = [row.querySelector('[data-sa-left]').value.trim(), row.querySelector('[data-sa-right]').value.trim()];
        if (p.some(s => !s)) throw new Error('Fill both sides of every ' + name.toLowerCase() + ' pair.');
        return p;
      });
    }
    required('tmTitle', 'Lesson title'); required('tmTrans', 'Story text');
    const url = required('saDuaUrl', 'Du‘a source link');
    try { if (new URL(url).protocol !== 'https:') throw new Error(); } catch (_) { throw new Error('Use a full HTTPS link for the du‘a source.'); }
    const meaning = required('saDuaMeaning', 'Du‘a meaning');
    const distractors = [0, 1, 2].map(i => required('saDuaWrong' + i, 'Meaning-check answer ' + (i + 1)));
    if (new Set([meaning, ...distractors]).size !== 4) throw new Error('Use four different answers for the du‘a meaning check.');
    const type = val('saChallengeType'), items = val('saOrderItems').split('\n').map(s => s.trim()).filter(Boolean);
    const facts = [...ed.querySelectorAll('[data-sa-row="fact"]')].map(row => ({s: row.querySelector('[data-sa-statement]').value.trim(), a: row.querySelector('[data-sa-truth]').value === 'true'}));
    if (type === 'order' && (items.length < 2 || items.length > 12)) throw new Error('Write 2–12 events in the correct order, one per line.');
    if (type === 'facts' && (!facts.length || facts.length > 12 || facts.some(f => !f.s))) throw new Error('Write 1–12 true / false statements and select each correct answer.');
    return {chapter: required('saChapter', 'Chapter / source description'), vocab: pairs('vocab', 1, 'Vocabulary'), pairs: pairs('pair', 2, 'Story matching').map(p => ({q: p[0], a: p[1]})),
      dua: {title: required('saDuaTitle', 'Du‘a title'), ar: required('saDuaAr', 'Arabic du‘a'), read: val('saDuaRead'), meaning, ref: required('saDuaRef', 'Du‘a reference'), url, theme: val('saDuaTheme'), note: val('saDuaNote'), distractors},
      challenge: {type, prompt: type === 'order' ? required('saOrderPrompt', 'Event-order instructions') : val('saOrderPrompt'), items, facts}};
  }
  function wire(ed) {
    const wireRemove = () => ed.querySelectorAll('[data-sa-remove]').forEach(b => b.onclick = () => b.closest('[data-sa-row]').remove());
    ed.querySelectorAll('[data-sa-add]').forEach(b => b.onclick = () => {
      const kind = b.dataset.saAdd, box = ed.querySelector({vocab: '#saVocab', pair: '#saPairs', fact: '#saFacts'}[kind]);
      if (box.children.length >= 12) return;
      box.insertAdjacentHTML('beforeend', kind === 'fact' ? factRow({s: '', a: true}) : pairRow(kind, ['', '']));
      wireRemove(); box.lastElementChild.querySelector('textarea').focus();
    });
    wireRemove();
    const type = ed.querySelector('#saChallengeType'), update = () => {ed.querySelector('#saOrderFields').hidden = type.value !== 'order'; ed.querySelector('#saFactFields').hidden = type.value !== 'facts';};
    type.onchange = update; update();
  }
  const openBefore = openEditor;
  openEditor = function (opts) {
    if (!teacherMode) return;
    const index = lessons.findIndex((l, i) => lessonKey(i) === opts.id);
    if (index < 0) return openBefore(opts);
    const oldRead = opts.readFields;
    openBefore(Object.assign({}, opts, {title: 'Seeraa lesson ' + (index + 1) + ' · story and activities', fields: opts.fields + fields(lessons[index]), readFields: ed => Object.assign(oldRead(ed), {activities: read(ed)})}));
    const ed = document.querySelector('#tmEditor'); if (ed) wire(ed);
  };
  document.head.insertAdjacentHTML('beforeend', `<style>.sa-section{border:1px solid #d8c6a5;border-radius:12px;margin:14px 0;padding:12px}.sa-section>summary{font-weight:800;cursor:pointer;padding:8px}.sa-row,.sa-fact{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 0;border-bottom:1px solid #e7dcc7}.sa-row>button,.sa-fact>button{grid-column:1/-1;justify-self:end}.sa-section textarea{min-height:80px}.sa-section [hidden]{display:none}@media(max-width:560px){.sa-row,.sa-fact{grid-template-columns:1fr}}</style>`);
})();
