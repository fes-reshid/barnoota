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
  if (agreed) return; // asked once per browser: already agreed here before, so skip straight to the app

  const view = document.getElementById('consentView'), cancelled = document.getElementById('consentCancelled');
  const cb = document.getElementById('consentCheck'), agreeBtn = document.getElementById('consentAgree'), declineBtn = document.getElementById('consentDecline'), reconsiderBtn = document.getElementById('consentReconsider');

  cb.addEventListener('change', () => { agreeBtn.disabled = !cb.checked; });
  agreeBtn.addEventListener('click', () => {
    if (!cb.checked) return;
    try { localStorage.setItem(KEY, 'yes'); } catch (e) {}
    gate.close();
  });
  // Not agreeing cancels using the tool — it does not send them anywhere, it just stays closed.
  declineBtn.addEventListener('click', () => {
    view.hidden = true; cancelled.hidden = false;
    cancelled.querySelector('h1').focus();
    try { window.close(); } catch (e) {} // best effort: per spec this succeeds for a script-opened tab, or one with a single history entry (a fresh visit) — otherwise it quietly does nothing, which is why the message above is the real fallback
  });
  reconsiderBtn.addEventListener('click', () => { cancelled.hidden = true; view.hidden = false; document.getElementById('consentTitle').focus(); });
  gate.addEventListener('cancel', e => e.preventDefault()); // no closing this one with Escape
  gate.showModal();
})();
