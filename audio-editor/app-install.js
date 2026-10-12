// Audio editor — install as an app and offline support.
'use strict';
(() => {
  const V = (document.currentScript && new URL(document.currentScript.src).searchParams.get('v')) || 'dev';
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js?v=' + V).catch(e => console.warn('Offline support unavailable', e));
  }
  let deferred = null;
  const btn = document.createElement('button');
  btn.className = 'back'; btn.type = 'button'; btn.id = 'installBtn'; btn.hidden = true;
  btn.textContent = '⤓ Install app'; btn.title = 'Install the editor as an app — it then opens from your home screen or desktop and works offline';
  document.querySelector('.head-actions').prepend(btn);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; btn.hidden = false; });
  window.addEventListener('appinstalled', () => { btn.hidden = true; deferred = null; toast('Installed — you can now open the Audio Editor from your home screen or desktop.'); });
  async function install() {
    if (deferred) { deferred.prompt(); const r = await deferred.userChoice; deferred = null; btn.hidden = r.outcome === 'accepted'; return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    toast(ios ? 'On iPhone/iPad: tap the Share button in Safari, then “Add to Home Screen”.'
      : window.matchMedia('(display-mode: standalone)').matches ? 'The editor is already installed.'
      : 'Use your browser’s menu (⋮) → “Install app” or “Add to Home screen”.');
  }
  btn.addEventListener('click', install);
  const help = MENUS.find(m => m.label === 'Help').items;
  help.splice(help.length - 1, 0, { label: 'Install as an App…', run: install });
  // Files opened from the operating system ("Open with…") once installed.
  if ('launchQueue' in window) launchQueue.setConsumer(async p => { for (const h of p.files || []) loadFile(await h.getFile()); });
})();
