/* The lesson panel and the progress bar show the map's scene photo, like the header of the
   story card below them (seeraa-living-world.js uses the same SEERAA_SCENES photo and focus).
   The look itself is in seeraa-lesson-look.css. */
(function () {
  'use strict';
  function paint() {
    const scr = document.getElementById('lessonScreen');
    if (!scr || typeof lessons === 'undefined' || typeof current === 'undefined') return;
    const l = lessons[current], wi = Math.max(0, (l && l.world) || 0);
    const S = typeof SEERAA_SCENES !== 'undefined' && SEERAA_SCENES.length ? SEERAA_SCENES[wi % SEERAA_SCENES.length] : null;
    if (!S || !S.asset) { scr.style.removeProperty('--ll-photo'); return; }
    scr.style.setProperty('--ll-photo', `url("assets/scenes/${S.asset}.webp")`);
    scr.style.setProperty('--ll-focus', `${Math.round((S.focus || 0.5) * 100)}% 55%`);
  }
  if (typeof renderLesson === 'function') {
    const before = renderLesson;
    renderLesson = function () { const r = before.apply(this, arguments); try { paint(); } catch (e) { console.warn('lesson look', e); } return r; };
  }
})();
