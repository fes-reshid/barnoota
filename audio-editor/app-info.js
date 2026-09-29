// Audio editor — the About dialog (Help ▸ About) and a one-time "this works best on a computer"
// notice for phone screens. Loaded after save-extras.js (for EDITOR_VERSION) and editor-ui.js.
'use strict';

/* ---------- About ---------- */
const aboutDlg = document.createElement('dialog');
aboutDlg.className = 'dlg'; aboutDlg.id = 'aboutDlg'; aboutDlg.setAttribute('aria-labelledby', 'aboutTitle');
aboutDlg.innerHTML = `<h1 id="aboutTitle" style="font-family:'Marcellus'; font-weight:400; color:var(--ink-navy); font-size:20px; margin:0 0 10px">Audio Editor — Diin Islaam</h1>
  <div style="font-family:var(--ui); font-size:14px; line-height:1.6; color:var(--ink-brown)">
    <p style="margin:0 0 8px">Built by <strong>Feysel Reshid</strong>.</p>
    <p style="margin:0 0 8px">Version <span id="aboutVersion">—</span></p>
    <p style="margin:0 0 8px">Everything happens on your device. Your audio is never uploaded.</p>
    <p style="margin:0">Questions, or something to report? <a href="mailto:fesbackups@gmail.com">fesbackups@gmail.com</a></p>
  </div>
  <div class="actions"><span style="flex:1"></span><button class="btn primary" id="aboutClose" type="button">Close</button></div>`;
document.body.appendChild(aboutDlg);
$('aboutVersion').textContent = (typeof EDITOR_VERSION !== 'undefined' && EDITOR_VERSION) || '—';
$('aboutClose').onclick = () => aboutDlg.close();
function showAbout() { aboutDlg.showModal(); }

/* ---------- "This works best on a computer" notice for phones (shown once, never blocks) ---------- */
const MOBILE_NOTICE_KEY = 'ae-mobile-notice-v1';
const isPhoneScreen = () => !!(window.matchMedia && matchMedia('(pointer: coarse) and (max-width: 820px)').matches);
const mobileNoticeDlg = document.createElement('dialog');
mobileNoticeDlg.className = 'dlg'; mobileNoticeDlg.id = 'mobileNotice'; mobileNoticeDlg.setAttribute('aria-labelledby', 'mobileNoticeTitle');
mobileNoticeDlg.innerHTML = `<h1 id="mobileNoticeTitle" style="font-family:'Marcellus'; font-weight:400; color:var(--ink-navy); font-size:19px; margin:0 0 10px">This works best on a computer</h1>
  <div style="font-family:var(--ui); font-size:14px; line-height:1.6; color:var(--ink-brown)">
    <p style="margin:0 0 8px">This is a full audio editor with a lot of tools, and it was built for a mouse, a keyboard and a bigger screen. For the easiest experience, open this page on a computer instead.</p>
    <p style="margin:0">You can still use it here — recording, trimming, effects and saving all work on a phone — but some panels are smaller and a few tools are easier to miss.</p>
  </div>
  <div class="actions"><span style="flex:1"></span><button class="btn primary" id="mobileNoticeOk" type="button">Continue on This Phone</button></div>`;
document.body.appendChild(mobileNoticeDlg);
$('mobileNoticeOk').onclick = () => mobileNoticeDlg.close();
mobileNoticeDlg.addEventListener('close', () => { try { localStorage.setItem(MOBILE_NOTICE_KEY, 'yes'); } catch (e) {} });
function maybeShowMobileNotice() {
  try {
    if (localStorage.getItem(MOBILE_NOTICE_KEY) === 'yes') return;
    if (localStorage.getItem('ae-hg-blocked') === 'yes') return; // the block screen already covers everything
  } catch (e) {}
  if (isPhoneScreen() && typeof mobileNoticeDlg.showModal === 'function') mobileNoticeDlg.showModal();
}
{
  let agreed = false;
  try { agreed = localStorage.getItem('ae-consent-v1') === 'yes'; } catch (e) {}
  const consentGate = document.getElementById('consentGate');
  if (agreed) maybeShowMobileNotice();
  else if (consentGate) consentGate.addEventListener('close', maybeShowMobileNotice, { once: true });
}

/* ---------- Menu ---------- */
(() => {
  const help = MENUS.find(m => m.label === 'Help').items, about = help.find(it => it.label === 'About');
  if (about) about.run = showAbout;
})();
