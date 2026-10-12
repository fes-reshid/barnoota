// Audio editor — open audio from a web link: File ▸ Open from Link…, the start screen's "From a link"
// button, and links like …/audio-editor/?open=<url>&name=<title> (or ?url=<url>).
// The file is downloaded straight into the browser; the website has to allow that (most direct file
// links on Dropbox, GitHub, archive.org and recitation sites do). Video-site pages are refused politely.
'use strict';

const urlDlg = document.createElement('dialog');
urlDlg.className = 'dlg'; urlDlg.id = 'urlDlg';
urlDlg.style.width = 'min(560px, calc(100vw - 24px))';
urlDlg.innerHTML = `<h2>Open audio from a link</h2>
  <p class="info" style="margin:0 0 12px">Paste a link to an audio file — MP3, WAV, M4A, OGG, FLAC or the sound of a video file. It downloads into this browser and opens in a new tab; nothing is uploaded.</p>
  <form id="urlOpenForm" novalidate>
    <input id="urlOpenIn" type="url" inputmode="url" autocomplete="url" spellcheck="false" placeholder="https://example.com/recitation.mp3" aria-label="Link to an audio file" style="width:100%; min-height:42px; font:inherit; font-size:16px; padding:8px 10px; border:1px solid var(--gold-soft); border-radius:8px; background:var(--surface)">
    <p class="info" id="urlOpenErr" role="alert" style="margin:8px 0 0; color:#a3392b; min-height:1em"></p>
    <p class="hint" style="margin:6px 0 12px">Works with direct file links, and with Dropbox and GitHub share links. Pages on YouTube, TikTok, Instagram, Facebook or SoundCloud can't be opened — those sites don't allow downloading. If a website blocks it, save the file to your device and use <b>Open…</b>.</p>
    <div class="actions"><button class="btn" id="urlOpenCancel" type="button">Cancel</button><button class="btn primary" id="urlOpenGo" type="submit">Open</button></div>
  </form>`;
document.body.appendChild(urlDlg);

const VIDEO_SITES = /(^|\.)(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|soundcloud\.com|spotify\.com|x\.com|twitter\.com|vimeo\.com)$/i;

/** Turns what was pasted into a link the browser can download, or throws a message for the person. */
function audioLink(raw) {
  let text = (raw || '').trim();
  if (!text) throw 'Paste a link to an audio file.';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(text) && !text.startsWith('/')) text = 'https://' + text;
  let u;
  try { u = new URL(text, location.href); } catch (e) { throw 'That doesn\'t look like a web address.'; }
  if (!/^https?:$/.test(u.protocol)) throw 'Only http:// and https:// links can be opened.';
  if (VIDEO_SITES.test(u.hostname)) throw 'Links to pages on ' + u.hostname.replace(/^www\./, '') + ' can\'t be opened — that site doesn\'t allow downloading its audio. Use a recording you own: save the file to your device and open it with Open….';
  // github.com/<user>/<repo>/blob/<ref>/<path> → the raw file
  const gh = u.hostname === 'github.com' && u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
  if (gh) return `https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}`;
  // Dropbox share links: the file itself rather than its preview page
  if (/(^|\.)dropbox\.com$/i.test(u.hostname)) { u.searchParams.delete('dl'); u.searchParams.set('raw', '1'); }
  return u.href;
}

function linkFileName(res, url, given) {
  const dec = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  const cd = res.headers.get('content-disposition') || '';
  let name = given || (cd.match(/filename\*\s*=\s*[^']*'[^']*'([^;]+)/i) || [])[1] || (cd.match(/filename\s*=\s*"?([^";]+)"?/i) || [])[1];
  name = dec(name || new URL(url).pathname.split('/').filter(Boolean).pop() || 'audio').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'audio';
  if (!/\.\w{2,4}$/.test(name)) {
    const t = (res.headers.get('content-type') || '').split(';')[0];
    name += { 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/ogg': '.ogg', 'audio/flac': '.flac', 'audio/mp4': '.m4a', 'audio/aac': '.aac', 'video/mp4': '.mp4', 'audio/webm': '.webm', 'video/webm': '.webm' }[t] || '.mp3';
  }
  return name;
}

/** Downloads `raw` and opens it in a new tab. Returns '' when it worked, or a message saying why not. */
async function openFromUrl(raw, givenName) {
  let url;
  try { url = audioLink(raw); } catch (msg) { return msg; }
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 120000);
  busyText('Downloading…'); busy(true);
  try {
    let res;
    try { res = await fetch(url, { signal: ctrl.signal, credentials: 'omit', redirect: 'follow' }); }
    catch (e) {
      if (e.name === 'AbortError') return 'The download took too long and was stopped.';
      return 'Couldn\'t download that file. The website may not allow other sites to fetch it, or the link may be wrong. Save the file to your device and use Open… instead.';
    }
    if (!res.ok) return `The website answered “${res.status}${res.statusText ? ' ' + res.statusText : ''}”. Check that the link is correct and public.`;
    const type = (res.headers.get('content-type') || '').toLowerCase();
    if (/text\/html/.test(type)) return 'That link leads to a web page, not to the audio file itself. Look for a “download” link and paste that instead.';
    const total = +res.headers.get('content-length') || 0, chunks = [];
    let got = 0;
    if (res.body && res.body.getReader) {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); got += value.length;
        busyText('Downloading… ' + (got / 1048576).toFixed(1) + ' MB' + (total ? ' of ' + (total / 1048576).toFixed(1) + ' MB' : ''));
      }
    } else chunks.push(new Uint8Array(await res.arrayBuffer()));
    const file = new File(chunks, linkFileName(res, url, givenName), { type: type.split(';')[0] || 'audio/mpeg' });
    busy(false); busyText('Working…');
    const before = typeof tabs !== 'undefined' ? tabs.length : 0;
    await loadFile(file, { remember: true });
    if (typeof tabs !== 'undefined' && tabs.length === before) return 'The file was downloaded, but it isn\'t audio this browser can open.';
    return '';
  } finally { clearTimeout(timer); busy(false); busyText('Working…'); }
}

function openUrlDialog() {
  $('urlOpenErr').textContent = '';
  urlDlg.showModal();
  $('urlOpenIn').focus(); $('urlOpenIn').select();
}
$('urlOpenForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('urlOpenErr').textContent = '';
  $('urlOpenGo').disabled = true;
  urlDlg.close();
  const err = await openFromUrl($('urlOpenIn').value);
  $('urlOpenGo').disabled = false;
  if (err) { $('urlOpenErr').textContent = err; urlDlg.showModal(); $('urlOpenIn').focus(); }
  else $('urlOpenIn').value = '';
});
on('urlOpenCancel', () => urlDlg.close());

// Menus and the start screen
(() => {
  const file = MENUS.find(m => m.label === 'File').items;
  file.splice(file.findIndex(it => it && it.label === 'Open File…') + 1, 0, { label: 'Open from Link…', run: openUrlDialog });
  const b = document.createElement('button');
  b.className = 'btn big'; b.id = 'urlBtn2'; b.type = 'button'; b.textContent = '🔗 From a link';
  b.title = 'Open an audio file from a web address';
  b.onclick = openUrlDialog;
  $('openBtn2').after(b);
})();

// …/audio-editor/?open=<url>&name=<title> (or ?url=<url>) opens that recording straight away.
(async () => {
  const qs = new URLSearchParams(location.search), url = qs.get('open') || qs.get('url');
  if (!url) return;
  history.replaceState(null, '', location.pathname); // don't reopen on refresh
  const err = await openFromUrl(url, qs.get('name') || '');
  if (err) { $('urlOpenIn').value = url; $('urlOpenErr').textContent = err; urlDlg.showModal(); }
})();
