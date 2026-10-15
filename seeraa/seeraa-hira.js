/* First-revelation reading panel; scoped to the empty Jabal al-Nur setting. */
(function () {
  'use strict';
  const verses = window.SeeraaLiving.hiraVerses, esc = escapeHtml;
  const inMountain = () => SEERAA_SCENES[viewWorld]?.asset === 'hira-mountain';
  const rows = () => verses.map(q => `<li><span class="hira-ayah-number">96:${q.verse}</span><p lang="ar" dir="rtl" class="hira-ar">${esc(q.ar)}</p><p class="hira-en">${esc(q.en)}</p></li>`).join('');
  const sources = '<p class="hira-source">Simple English meanings. <a href="https://quran.com/96/1-5" target="_blank" rel="noopener noreferrer">Read Al-ʿAlaq 96:1–5 ↗</a> · <a href="https://sunnah.com/bukhari:4953" target="_blank" rel="noopener noreferrer">First-revelation account: Ṣaḥīḥ al-Bukhārī 4953 ↗</a></p><p class="hira-note">The glow is symbolic. This AI-generated illustration is inspired by Jabal al-Nūr; it does not establish the exact appearance or location of the cave entrance.</p>';
  let dialog, focusBack;
  function close() {
    if (!dialog) return;
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    dialog.remove(); dialog = null;
    document.body.classList.remove('hira-reading-open');
    if (focusBack?.isConnected) focusBack.focus();
  }
  function open() {
    close(); focusBack = document.activeElement;
    togglePlaceInformation(false);
    dialog = document.createElement('dialog');
    dialog.className = 'hira-dialog'; dialog.id = 'hiraAyahsDialog';
    dialog.setAttribute('aria-labelledby', 'hiraReadingTitle');
    dialog.innerHTML = `<header class="hira-reading-head"><div><small>The cave of Ḥirāʾ · Jabal al-Nūr</small><h2 id="hiraReadingTitle">The first five ayahs</h2><p>Sūrat al-ʿAlaq · 96:1–5</p></div><button type="button" class="hira-close" aria-label="Close the ayahs">×</button></header><ol class="hira-ayahs">${rows()}</ol>${sources}`;
    document.body.appendChild(dialog); document.body.classList.add('hira-reading-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else {dialog.setAttribute('open', ''); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');}
    dialog.querySelector('.hira-close').onclick = close;
    dialog.addEventListener('cancel', e => {e.preventDefault(); close();});
    dialog.addEventListener('keydown', e => {
      if (e.key === 'Escape') {e.preventDefault(); close(); return;}
      if (e.key === 'Tab') {
        const els = [...dialog.querySelectorAll('button,a[href]')], first = els[0], last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {e.preventDefault(); last.focus();}
        else if (!e.shiftKey && document.activeElement === last) {e.preventDefault(); first.focus();}
      }
    });
    dialog.querySelector('.hira-close').focus();
  }
  function decorateMap() {
    const frame = document.querySelector('#mapScreen .map-frame'); if (!frame) return;
    let b = document.getElementById('hiraReadButton');
    if (inMountain()) {
      if (!b || b.hidden) togglePlaceInformation(false);
      if (!b) {b = document.createElement('button'); b.id = 'hiraReadButton'; b.type = 'button'; b.className = 'hira-read-button'; b.textContent = '📖 Read the first 5 ayahs'; b.onclick = open; frame.appendChild(b);}
      b.hidden = false;
    } else {if (b) b.hidden = true; close();}
  }
  function decorateStory() {
    const l = lessons[current], stage = document.getElementById('stage');
    if (!l || !/^read!$/i.test(l.title) || !stage?.querySelector('.lw-theatre') || stage.querySelector('.hira-full-reading')) return;
    const panel = document.createElement('details'); panel.className = 'hira-full-reading';
    panel.innerHTML = `<summary>Read all five ayahs · Arabic &amp; English</summary><ol class="hira-ayahs">${rows()}</ol>${sources}`;
    stage.querySelector('.lw-theatre').insertAdjacentElement('afterend', panel);
  }
  const beforeLayout = layoutMapRoad;
  layoutMapRoad = function () {const r = beforeLayout.apply(this, arguments); decorateMap(); return r;};
  const beforeLesson = renderLesson;
  renderLesson = function () {const r = beforeLesson.apply(this, arguments); decorateStory(); return r;};
  const beforeShow = show;
  show = function (id) {if (id !== 'mapScreen') close(); return beforeShow.apply(this, arguments);};
  window.SeeraaHira = {open, close};
})();
