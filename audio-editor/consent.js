// Audio editor — purpose reminder shown once per browser before the app can be used.
// This script is loaded right after the <dialog id="consentGate"> markup in index.html, before the
// rest of the page's content and scripts, so it can open the dialog before anything is painted.
'use strict';

(() => {
  const KEY = 'ae-consent-v1';
  const gate = document.getElementById('consentGate');
  if (!gate || typeof gate.showModal !== 'function') return; // compat.js shows an unsupported-browser message instead

  let agreed = false;
  try { agreed = localStorage.getItem(KEY) === 'yes'; } catch (e) {}
  if (agreed) return;

  const cb = document.getElementById('consentCheck'), agreeBtn = document.getElementById('consentAgree'), declineBtn = document.getElementById('consentDecline');
  cb.addEventListener('change', () => { agreeBtn.disabled = !cb.checked; });
  agreeBtn.addEventListener('click', () => {
    if (!cb.checked) return;
    try { localStorage.setItem(KEY, 'yes'); } catch (e) {}
    gate.close();
  });
  declineBtn.addEventListener('click', () => { location.href = 'https://diinislaam.com/'; });
  gate.addEventListener('cancel', e => e.preventDefault()); // no closing this one with Escape
  gate.showModal();
})();
