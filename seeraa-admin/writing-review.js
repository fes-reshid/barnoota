/* Question 15 of every Map Challenge is the student's reflection, sent to the
   teacher (seeraa/seeraa-writing.js): what I learned, what I will do, the duʿāʾ I
   learned, and whether I have practised it. It lives in the student's progress as
   profile.mapWritings[map] = {prompt, parts, text, words, at, review}. Here, in Map
   review, the teacher reads it, corrects it, writes a note, and accepts it or
   asks for it again; the portal saves that as review = {status, text, note, by, at, for}. */
(function () {
  'use strict';
  const escape = text => String(text == null ? '' : text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date = iso => { const d = iso && new Date(iso); return d && !isNaN(d) ? d.toLocaleDateString(undefined, {day:'numeric', month:'short', year:'numeric'}) : ''; };
  const writing = (p, i) => { const x = p && Array.isArray(p.mapWritings) ? p.mapWritings[i] : null; return x && typeof x.text === 'string' ? x : null; };
  /* the teacher has answered this version (a newer send waits for a new answer);
     review.for is the version it answers, so the two devices' clocks never matter */
  const answered = x => !!(x && x.review && x.review.at && (x.review.for ? x.review.for === x.at : String(x.review.at) >= String(x.at || '')));
  const needsReading = (p, i) => { const x = writing(p, i); return !!x && !answered(x); };
  const PARTS = {learn: '📖 What I learned', apply: '🌱 What I will do', dua: '🤲 The duʿāʾ I learned', practice: '✅ Have I practised it?'};
  function partsHTML(x) {
    if (!Array.isArray(x.parts)) return '<p>' + escape(x.text) + '</p>';
    return x.parts.map(p => '<div class="wr-part-r"><b>' + escape(PARTS[p.k] || p.k) + '</b><small>' + escape(p.q || '') + '</small>' +
      (p.k === 'dua' && p.dua && p.dua.ar ? '<span class="wr-dua-r" lang="ar" dir="rtl">' + escape(p.dua.ar) + '</span>' : '') +
      '<p>' + escape(p.k === 'practice' ? (p.a || '') + (p.how ? ' — ' + p.how : '') : (p.a || '')) + '</p></div>').join('');
  }
  function normalize(p, count) {
    const a = Array.isArray(p.mapWritings) ? p.mapWritings : [];
    p.mapWritings = [...a, ...Array(count).fill(null)].slice(0, count).map(x => x && typeof x === 'object' && typeof x.text === 'string' ? x : null);
    return p;
  }
  function state(x) {
    if (!x) return ['', 'Not sent yet'];
    if (!answered(x)) return x.review ? ['warn', '✍️ Written again — waiting for you'] : ['warn', '✍️ New — waiting for you'];
    return x.review.status === 'rewrite' ? ['bad', '↩ Asked to write again'] : ['ok', '✓ Accepted'];
  }
  /* challenge column / map buttons */
  function badge(p, i) {
    const x = writing(p, i); if (!x) return '';
    const [cls, label] = state(x);
    return ' <span class="role-badge ' + cls + '" title="Question 15 · reflection">' + (answered(x) ? (x.review.status === 'rewrite' ? '✍️ ↩' : '✍️ ✓') : '✍️ to read') + '</span>';
  }
  const drafts = {};
  /* opts: {key, teacherName, save(status, text, note, sentAt) → Promise} */
  function render(container, p, i, opts) {
    if (!container) return;
    const x = writing(p, i), key = opts && opts.key || String(i);
    if (!x) {
      container.innerHTML = '<section class="wr-review empty"><h3>✍️ Question 15 · Reflection</h3><p class="muted">Not sent yet. At the end of the Map Challenge the student writes what they learned, what they will do, the duʿāʾ they learned, and whether they have practised it — and sends it to you here.</p></section>';
      return;
    }
    const [cls, label] = state(x), r = x.review || null, fresh = answered(x), d = drafts[key] && drafts[key].at === x.at ? drafts[key] : null;
    const fixed = d ? d.text : (fresh && r.text ? r.text : x.text), note = d ? d.note : (fresh ? (r.note || '') : '');
    container.innerHTML = '<section class="wr-review">' +
      '<div class="wr-head"><h3>✍️ Question 15 · Reflection</h3><span class="role-badge ' + cls + '">' + escape(label) + '</span></div>' +
      (Array.isArray(x.parts) ? '' : '<p class="wr-q"><b>Task:</b> ' + escape(x.prompt || '') + '</p>') +
      '<div class="wr-orig"><div class="wr-meta">Student’s answers · ' + escape(String(x.words || x.text.trim().split(/\s+/).length)) + ' words · sent ' + escape(date(x.at)) + (x.messagedAt ? ' · also in Messages' : '') + '</div>' + partsHTML(x) + '</div>' +
      (r && !fresh ? '<p class="wr-last">Your last answer (' + escape(date(r.at)) + '): ' + escape(r.status === 'rewrite' ? 'asked to write again' : 'accepted') + (r.note ? ' — “' + escape(r.note) + '”' : '') + '</p>' : '') +
      '<div class="field"><label for="wr-fix">Corrected version <small class="muted">— edit the text; the student sees your corrections</small></label><textarea id="wr-fix" maxlength="4000">' + escape(fixed) + '</textarea></div>' +
      '<div class="field"><label for="wr-note">Note to the student</label><textarea id="wr-note" maxlength="600" placeholder="e.g. Mā shā’ Allāh, well explained! Next time add who suggested the trench.">' + escape(note) + '</textarea></div>' +
      '<div class="wr-actions"><button class="btn primary" id="wr-accept" type="button">✓ Accept</button><button class="btn ghost" id="wr-again" type="button">↩ Ask to write again</button></div>' +
      '<p class="msg" id="wr-msg" aria-live="polite"></p></section>';
    const fix = container.querySelector('#wr-fix'), nt = container.querySelector('#wr-note'), msg = container.querySelector('#wr-msg');
    const keep = () => { drafts[key] = {at: x.at, text: fix.value, note: nt.value}; };
    fix.oninput = nt.oninput = keep;
    const send = status => {
      const text = fix.value.trim(), n = nt.value.trim();
      if (status === 'rewrite' && !n) { msg.textContent = 'Write a note so the student knows what to change.'; msg.className = 'msg err'; nt.focus(); return; }
      if (!text) { msg.textContent = 'The corrected version is empty — undo your changes or keep the student’s text.'; msg.className = 'msg err'; fix.focus(); return; }
      keep();
      container.querySelectorAll('button').forEach(b => b.disabled = true);
      msg.textContent = 'Saving…'; msg.className = 'msg';
      Promise.resolve(opts.save(status, text === x.text.trim() ? '' : text, n, x.at)).then(ok => { if (ok) delete drafts[key]; })
        .catch(() => {}).finally(() => container.querySelectorAll('button').forEach(b => b.disabled = false));
    };
    container.querySelector('#wr-accept').onclick = () => send('accepted');
    container.querySelector('#wr-again').onclick = () => send('rewrite');
  }
  document.head.insertAdjacentHTML('beforeend', `<style>
    .wr-review{margin:14px 0 16px;padding:14px 16px;border:2px solid #e6cf98;border-left:7px solid #a97c25;border-radius:14px;background:#fffbf2}
    .wr-review.empty{border-left-color:#d3c6a8;background:#fffdf8}
    .wr-review h3{margin:0;font-family:'Marcellus',serif;color:var(--ink-navy,#1c2b46)}
    .wr-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
    .wr-q{margin:0 0 10px;font:15px/1.5 system-ui,sans-serif;color:#4a3f30}
    .wr-orig{background:#fff;border:1px solid #e1d4b9;border-radius:12px;padding:10px 13px;margin-bottom:10px}
    .wr-orig p{margin:4px 0 0;font:16px/1.6 system-ui,sans-serif;white-space:pre-wrap;color:#2f2a24}
    .wr-part-r{padding:8px 0;border-top:1px dashed #e6d7b6}.wr-part-r:first-of-type{border-top:0}
    .wr-part-r b{display:block;font:700 14px system-ui,sans-serif;color:#7a5418}.wr-part-r small{display:block;color:#8a7a62;font:13px/1.4 system-ui,sans-serif;margin:2px 0}
    .wr-dua-r{display:block;font:700 20px/1.7 Amiri,'Noto Naskh Arabic',serif;color:#1f4f40;text-align:right}
    .wr-meta{font:600 12.5px system-ui,sans-serif;color:#8a7a62}
    .wr-last{margin:0 0 10px;font:13.5px/1.5 system-ui,sans-serif;color:#7a5300}
    .wr-review textarea#wr-fix{min-height:130px;font:15px/1.55 system-ui,sans-serif}
    .wr-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:4px}
    .wr-review .msg.err{color:var(--danger,#a3352b)}
  </style>`);
  window.SeeraaWritingReview = {normalize, needsReading, answered, writing, badge, render};
})();
