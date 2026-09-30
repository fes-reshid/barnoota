// Diin Islaam — "please donate" prompt, shared by the PDF, audio and video editors.
//
// Set DONATE_URL to your Stripe Payment Link (Stripe Dashboard → Payment Links → New →
// "Customers choose what to pay"). Until it is set, nothing is shown.
//
// Each app gets a ♥ Donate button, and after someone saves or exports their work a gentle prompt
// asks them to donate if they are happy with the app. It is shown on the second save, then at most
// once a week, and not for a long while after they donate. Nothing here leaves the browser except
// opening the payment page when they choose to.
(() => {
  'use strict';
  const DONATE_URL = '';
  const url = window.DIIN_DONATE_URL || DONATE_URL;
  if (!url) return;

  const DAY = 86400000;
  const KEY = 'diin-donate-v1';
  const APPS = { '/pdf-tools/': 'PDF Editor', '/audio-editor/': 'Audio Editor', '/video-editing/': 'Video Editor' };
  const appName = Object.entries(APPS).find(([p]) => location.pathname.includes(p))?.[1] || 'app';

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const store = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage blocked: just ask less cleverly */ } };

  const css = `
  .dd-back{border:0;padding:16px;background:transparent;max-width:none;max-height:none;width:100%;height:100%;
    display:flex;align-items:center;justify-content:center;margin:0;inset:0}
  .dd-back:not([open]){display:none}
  .dd-back::backdrop{background:rgba(28,43,70,.45)}
  .dd-box{background:#faf3e0;color:#3c2f26;border:1.5px solid #d3ac5c;border-radius:16px;max-width:420px;width:100%;padding:22px 22px 18px;
    box-shadow:0 18px 50px rgba(0,0,0,.35);font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center}
  .dd-heart{width:52px;height:52px;border-radius:50%;background:#e4efe6;color:#2e6b58;display:flex;align-items:center;justify-content:center;
    font-size:26px;margin:0 auto 10px}
  .dd-box h2{font-family:Marcellus,Georgia,serif;font-weight:400;color:#1c2b46;font-size:21px;margin:0 0 8px}
  .dd-box p{margin:0 0 10px;color:#5b4a36}
  .dd-ar{font-family:Amiri,serif;font-size:19px;color:#a97c25;margin:4px 0 14px !important}
  .dd-row{display:flex;flex-direction:column;gap:8px;margin-top:6px}
  .dd-btn{border:1.5px solid #d3ac5c;background:#fff;color:#3c2f26;border-radius:26px;padding:10px 16px;font:600 15px system-ui,sans-serif;cursor:pointer;text-decoration:none}
  .dd-btn:hover{background:#e4efe6;border-color:#2e6b58}
  .dd-btn.primary{background:#2e6b58;border-color:#2e6b58;color:#fff}
  .dd-btn.primary:hover{background:#1f4f40}
  .dd-small{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .dd-link{border:0;background:none;color:#8a7654;font:13px system-ui,sans-serif;cursor:pointer;padding:4px 6px;text-decoration:underline}
  .dd-fab{font:inherit}`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function openPayment() {
    const s = load(); s.clickedAt = Date.now(); store(s);
    window.open(url, '_blank', 'noopener');
  }

  function show() {
    if (document.querySelector('.dd-back[open]')) return;
    // A native <dialog> opened with showModal() sits above the apps' own dialogs (top layer).
    const back = document.createElement('dialog');
    back.className = 'dd-back'; back.setAttribute('aria-labelledby', 'ddTitle');
    back.innerHTML = `<div class="dd-box">
      <div class="dd-heart" aria-hidden="true">♥</div>
      <h2 id="ddTitle">Happy with the ${appName}?</h2>
      <p>It's free, with no accounts and nothing uploaded. If it helped you, please donate whatever you can to keep this app live on diinislaam.com.</p>
      <p class="dd-ar" lang="ar" dir="rtl">جزاكم الله خيرًا</p>
      <div class="dd-row">
        <button type="button" class="dd-btn primary" data-dd="give">♥ Donate what you can</button>
        <div class="dd-small">
          <button type="button" class="dd-link" data-dd="later">Maybe later</button>
          <button type="button" class="dd-link" data-dd="done">I've already donated</button>
        </div>
      </div></div>`;
    const close = () => { if (back.open) back.close(); back.remove(); };
    back.addEventListener('cancel', e => { e.preventDefault(); close(); }); // Esc
    back.addEventListener('keydown', e => e.stopPropagation()); // keep the app's shortcuts out of it
    back.addEventListener('click', e => {
      const act = e.target.closest('[data-dd]')?.dataset.dd;
      if (e.target === back || act === 'later') close(); // clicking outside the box closes it
      else if (act === 'give') { openPayment(); close(); }
      else if (act === 'done') { const s = load(); s.donatedAt = Date.now(); store(s); close(); }
    });
    document.body.appendChild(back);
    back.showModal();
    back.querySelector('[data-dd=give]').focus();
    const s = load(); s.shownAt = Date.now(); store(s);
  }

  // Called after a save or export. Asks on the second one, then at most weekly; stays quiet for
  // 60 days after someone opens the donation page and 180 days after they say they've donated.
  function saved() {
    const s = load(), now = Date.now();
    s.saves = (s.saves || 0) + 1; store(s);
    if (s.saves < 2) return;
    if (s.donatedAt && now - s.donatedAt < 180 * DAY) return;
    if (s.clickedAt && now - s.clickedAt < 60 * DAY) return;
    if (s.shownAt && now - s.shownAt < 7 * DAY) return;
    setTimeout(show, 1500); // let the save finish and its message show first
  }

  // A ♥ Donate button, placed by each app where it fits its header.
  function button(className, label) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = (className || '') + ' dd-fab'; b.title = 'Support this free app';
    b.textContent = label || '♥ Donate';
    b.addEventListener('click', show);
    return b;
  }

  // The audio and video editors save through ordinary download links; count those clicks.
  // (The PDF editor calls DiinDonate.saved() itself, since it can also save without a link.)
  if (!location.pathname.includes('/pdf-tools/')) {
    document.addEventListener('click', e => {
      const a = e.target && e.target.closest && e.target.closest('a[download]');
      if (a && (a.href || '').startsWith('blob:')) saved();
    }, true);
  }

  // Put the button in each app's header.
  const SPOTS = [
    { path: '/pdf-tools/', sel: 'header.site .head-links', cls: 'back link-btn', before: true },
    { path: '/audio-editor/', sel: 'header.site .head-actions', cls: 'back', before: true },
    { path: '/video-editing/', sel: 'header.topbar #help', cls: 'ghost hide-narrow', beforeEl: true },
  ];
  function mount() {
    const spot = SPOTS.find(x => location.pathname.includes(x.path)); if (!spot) return;
    const at = document.querySelector(spot.sel); if (!at || document.querySelector('.dd-fab')) return;
    const b = button(spot.cls);
    if (spot.beforeEl) at.parentNode.insertBefore(b, at); else at.insertBefore(b, at.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

  window.DiinDonate = { show, saved, button, url };
  document.dispatchEvent(new Event('diin-donate-ready'));
})();
