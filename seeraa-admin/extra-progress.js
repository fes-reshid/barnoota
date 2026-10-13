/* Read the same stable story IDs saved by the Seeraa student course. */
(function () {
  'use strict';
  const stories = window.SEERAA_ENRICHMENT?.stories || [];
  const escape = text => String(text == null ? '' : text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const done = (profile, id) => {
    const value = profile?.seeraaExplored?.[id];
    return value === true || !!(value && typeof value.completedAt === 'string' && value.completedAt);
  };
  function completedDate(profile, id) {
    const raw = profile?.seeraaExplored?.[id]?.completedAt;
    const date = raw && new Date(raw);
    return date && !isNaN(date.getTime()) ? date.toLocaleDateString(undefined, {day:'numeric',month:'short',year:'numeric'}) : '';
  }
  const count = (profile, map) => stories.filter(s => (map == null || s.map === map) && done(profile, s.id)).length;
  function rows(profile, map) {
    return `<ul class="extra-story-list">${stories.filter(s => s.map === map).map((s, i) => {
      const complete = done(profile, s.id), date = completedDate(profile, s.id);
      return `<li><span class="extra-story-letter" aria-hidden="true">${['A','B'][i]}</span><span class="extra-story-name">${escape(s.title)}</span><span class="extra-story-state ${complete ? 'complete' : ''}">${complete ? '✓ Explored' : 'Not yet'}${complete && date ? `<small>${escape(date)}</small>` : ''}</span></li>`;
    }).join('')}</ul>`;
  }
  function render(container, profile, maps) {
    if (!container) return;
    container.innerHTML = `<div class="extra-progress-head"><h3>Extra Seeraa stories</h3><strong>${count(profile)} / ${stories.length} explored</strong></div><p class="muted">Two extra stories on each map. An explored story means the student completed its matching activity and understanding question. These optional stories have their own progress count.</p>` +
      maps.map((map, i) => `<details class="extra-map"><summary><span>Map ${i + 1} · ${escape(map[0])}</span><b>${count(profile, i)} / 2</b></summary>${rows(profile, i)}</details>`).join('');
  }
  function renderMap(container, profile, map) {
    if (!container) return;
    container.innerHTML = `<details class="extra-map"><summary><span>Extra stories on this map</span><b>${count(profile, map)} / 2</b></summary>${rows(profile, map)}<p class="muted">Additional practice for discussion during your teacher check.</p></details>`;
  }
  function clearMap(profile, map) {
    if (!profile.seeraaExplored) return;
    stories.filter(s => s.map === map).forEach(s => delete profile.seeraaExplored[s.id]);
  }
  function reportHTML(profile) {
    const completed = stories.filter(s => done(profile, s.id));
    return `<h2>Extra Seeraa stories · ${completed.length} / ${stories.length}</h2><p>${completed.length ? completed.map(s => `Map ${s.map + 1}: ${escape(s.title)}`).join(' · ') : 'No extra stories explored yet.'}</p>`;
  }
  document.head.insertAdjacentHTML('beforeend', `<style>
    #seeraa-extra-progress{margin-top:24px;padding:18px;border:1px solid #d9c79e;border-radius:16px;background:#fffbf2}
    .extra-progress-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.extra-progress-head h3{margin:0}.extra-progress-head strong{font:700 14px system-ui;color:#2e6b58}
    .extra-map{margin:8px 0;border:1px solid #e1d4b9;border-radius:10px;background:#fff}.extra-map summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;padding:10px 13px;cursor:pointer;font:14px/1.5 system-ui;color:#3f3528}.extra-map summary:before{content:'▸';color:#927144}.extra-map[open] summary:before{content:'▾'}.extra-map summary span{flex:1}.extra-map summary b{white-space:nowrap;color:#386343}.extra-map>p{margin:10px 14px}.extra-map summary:focus-visible{outline:3px solid #2f97cb;outline-offset:2px;border-radius:10px}
    .extra-story-list{list-style:none;margin:0;padding:0 13px 10px}.extra-story-list li{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #eee5d4;font:14px/1.5 system-ui}.extra-story-letter{display:grid;place-items:center;width:28px;height:28px;flex-shrink:0;border-radius:50%;background:#eee1c7;color:#685032;font-weight:700}.extra-story-name{flex:1}.extra-story-state{font-size:12px;color:#807057;white-space:nowrap;text-align:right}.extra-story-state.complete{color:#2e6b58;font-weight:700}.extra-story-state small{display:block;font-weight:400;font-size:10px;margin-top:3px}
    @media(max-width:600px){#seeraa-extra-progress{padding:12px}.extra-story-list li{gap:7px;font-size:13px}.extra-map summary{font-size:13px}.extra-story-state{font-size:11px}}
  </style>`);
  window.SeeraaTeacherProgress = {count, render, renderMap, clearMap, reportHTML};
})();
