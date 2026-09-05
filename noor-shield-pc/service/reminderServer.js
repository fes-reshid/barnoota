'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');
const fs = require('fs');

const certAuthority = require('./certAuthority');
const hadith = require(path.join(__dirname, '..', 'src', 'main', 'hadith'));
const { isWithinSchedule, minutesUntilScheduleEnds, parseHHMM } = require(
  path.join(__dirname, '..', 'src', 'main', 'schedule')
);

const sleepDuas = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'resources', 'sleepDuas.json'), 'utf8'));

/**
 * Serves the "you tried to reach a blocked site" reminder page, on both
 * plain HTTP (port 80) and HTTPS (port 443), bound to 127.0.0.1 only.
 *
 * Nothing reaches this server except connections to a domain the DNS proxy
 * has already decided to block — dnsProxy.js only ever answers 127.0.0.1 for
 * blocked A-record lookups, and every other domain resolves normally
 * through the real upstream. This never sees, decrypts, or forwards traffic
 * for any site that isn't already blocked.
 *
 * For HTTPS, certAuthority.js mints a certificate for whatever hostname the
 * browser's SNI asked for, signed by our locally-trusted CA, so the browser
 * shows a normal page instead of a certificate warning.
 *
 * Two different pages are shown depending on *why* the request was blocked:
 *   - schedule active (bedtime/screen-time window): a calming "sleeping
 *     time" page with adhkar for sleeping from Hisnul Muslim, and the time
 *     the internet will resume.
 *   - ordinary blocklist hit: the ordinary "this site is blocked" page, with
 *     a link to keep learning Islam at diinislaam.com.
 */

const LISTEN_ADDRESS = '127.0.0.1';
const HTTP_PORT = 80;
const HTTPS_PORT = 443;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** "07:00" -> "7:00 AM". Returns null for anything unparsable. */
function formatTime12h(hhmm) {
  const minutesSinceMidnight = parseHHMM(hhmm);
  if (minutesSinceMidnight === null) return null;
  const hours24 = Math.floor(minutesSinceMidnight / 60);
  const minutes = minutesSinceMidnight % 60;
  const period = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

const PAGE_STYLE_BASE = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: "Segoe UI", system-ui, sans-serif; padding: 32px;
  }
  .card {
    max-width: 640px; border-radius: 16px; padding: 40px; text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,.4);
  }
  .icon { font-size: 40px; margin-bottom: 8px; }
  h1 { font-size: 22px; margin: 0 0 6px; }
  .host { font-size: 14px; margin: 0 0 22px; word-break: break-all; }
`;

function renderReminderPage(hostname) {
  const pick = hadith.randomLowerGazeReminder() || hadith.random();
  const safeHost = escapeHtml(hostname || 'this site');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Blocked — Noor Shield</title>
<style>
  ${PAGE_STYLE_BASE}
  body { background: #16241d; color: #f6f5f0; }
  .card { background: #1e332a; border: 1px solid #2a6f5e; }
  .host { color: #c9a24b; }
  .quote {
    text-align: left; background: rgba(0,0,0,.2); border-left: 3px solid #c9a24b;
    border-radius: 6px; padding: 18px 20px; margin: 0 0 14px; line-height: 1.7; font-size: 15px;
  }
  .source { text-align: left; font-size: 13px; color: #8a968e; font-style: italic; margin: 0 0 26px; }
  .note { font-size: 14px; color: #d8d3c4; line-height: 1.6; margin: 0 0 24px; }
  .learn {
    text-align: left; background: rgba(201,162,75,.1); border: 1px solid rgba(201,162,75,.35);
    border-radius: 10px; padding: 16px 20px; margin: 0 0 8px;
  }
  .learn p { margin: 0 0 10px; font-size: 14px; color: #d8d3c4; line-height: 1.6; }
  .learn a {
    display: inline-block; color: #16241d; background: #c9a24b; text-decoration: none;
    font-weight: 600; font-size: 14px; padding: 9px 18px; border-radius: 8px;
  }
  .brand { margin-top: 20px; font-size: 12px; color: #5f7167; letter-spacing: .04em; text-transform: uppercase; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">🛡️</div>
    <h1>This site is blocked</h1>
    <p class="host">${safeHost}</p>
    <p class="quote">${escapeHtml(pick.text)}</p>
    <p class="source">— ${escapeHtml(pick.source)}${pick.grading ? ` · ${escapeHtml(pick.grading)}` : ''}</p>
    <p class="note">
      Turning away from this now is between you and Allah — an act of tawbah He loves. Log it in
      Noor Shield's tawbah journal if you'd like, and make istighfar.
    </p>
    <div class="learn">
      <p>Instead, spend a few minutes learning something about your deen — free lessons in Qur'an, hadith, aqidah, and more.</p>
      <a href="https://diinislaam.com" target="_blank" rel="noopener">Visit diinislaam.com</a>
    </div>
    <p class="brand">Noor Shield</p>
  </div>
</body>
</html>`;
}

function renderSleepPage(hostname, schedule) {
  const safeHost = escapeHtml(hostname || 'this site');
  const resumeTime = schedule ? formatTime12h(schedule.endTime) : null;
  const minutesLeft = schedule ? minutesUntilScheduleEnds(schedule) : null;
  const resumeLine = resumeTime
    ? `Internet resumes at <strong>${escapeHtml(resumeTime)}</strong>${
        typeof minutesLeft === 'number' && minutesLeft > 0
          ? ` <span class="dim">(in about ${Math.ceil(minutesLeft / 60)} hour${Math.ceil(minutesLeft / 60) === 1 ? '' : 's'})</span>`
          : ''
      }`
    : 'Internet will resume in the morning.';

  const duaBlocks = sleepDuas.duas
    .map(
      (d, i) => `
    <div class="dua" data-index="${i}">
      <p class="lang lang-en">${escapeHtml(d.english)}</p>
      <p class="lang lang-ar" dir="rtl">${escapeHtml(d.arabic)}</p>
      <p class="lang lang-om">${escapeHtml(d.oromo)}</p>
    </div>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Sleeping Time — Noor Shield</title>
<style>
  ${PAGE_STYLE_BASE}
  body { background: #0a1a2a; color: #e8eef5; }
  .card { background: #12233a; border: 1px solid #2a5a8f; max-width: 720px; }
  .host { color: #9fc4e8; }
  .resume {
    background: rgba(201,162,75,.12); border: 1px solid rgba(201,162,75,.4); border-radius: 10px;
    padding: 12px 16px; margin: 0 0 22px; font-size: 15px; color: #f6f5f0;
  }
  .resume .dim { color: #a9bdd4; font-size: 13px; }
  .langswitch { display: flex; gap: 6px; justify-content: center; margin: 0 0 18px; }
  .langswitch button {
    all: unset; cursor: pointer; font-size: 13px; font-weight: 600; padding: 7px 16px; border-radius: 999px;
    background: rgba(255,255,255,.06); color: #cfe0f2;
  }
  .langswitch button.active { background: #2a6f5e; color: #fff; }
  .dualist { text-align: left; max-height: 46vh; overflow-y: auto; padding-right: 4px; }
  .dua {
    background: rgba(0,0,0,.18); border-left: 3px solid #4a8fc9; border-radius: 6px;
    padding: 14px 18px; margin: 0 0 10px; line-height: 1.8; font-size: 15px; white-space: pre-line;
  }
  .lang { display: none; margin: 0; }
  .lang.shown { display: block; }
  .lang-ar { font-size: 17px; }
  .title { font-size: 13px; color: #9fc4e8; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 10px; }
  .brand { margin-top: 20px; font-size: 12px; color: #5f7fa0; letter-spacing: .04em; text-transform: uppercase; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">🌙</div>
    <h1>It's sleeping time</h1>
    <p class="host">${safeHost}</p>
    <p class="resume">${resumeLine}</p>
    <p class="title">${escapeHtml(sleepDuas.englishTitle)} · ${escapeHtml(sleepDuas.arabicTitle)} · ${escapeHtml(sleepDuas.oromoTitle)}</p>
    <div class="langswitch">
      <button type="button" data-lang="en" class="active">English</button>
      <button type="button" data-lang="ar">العربية</button>
      <button type="button" data-lang="om">Oromo</button>
    </div>
    <div class="dualist" id="dualist">${duaBlocks}</div>
    <p class="brand">Noor Shield</p>
  </div>
  <script>
    (function () {
      function setLang(lang) {
        document.querySelectorAll('.langswitch button').forEach(function (btn) {
          btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        document.querySelectorAll('.dua').forEach(function (dua) {
          dua.querySelectorAll('.lang').forEach(function (p) {
            p.classList.toggle('shown', p.classList.contains('lang-' + lang));
          });
        });
        try { localStorage.setItem('noorShieldDuaLang', lang); } catch (e) {}
      }
      document.querySelectorAll('.langswitch button').forEach(function (btn) {
        btn.addEventListener('click', function () { setLang(btn.dataset.lang); });
      });
      var saved = 'en';
      try { saved = localStorage.getItem('noorShieldDuaLang') || 'en'; } catch (e) {}
      setLang(saved);
    })();
  </script>
</body>
</html>`;
}

class ReminderServer {
  constructor({ dataDir, caThumbprint, getSchedule }) {
    this.dataDir = dataDir;
    this.caThumbprint = caThumbprint;
    this.getSchedule = typeof getSchedule === 'function' ? getSchedule : () => null;
    this.httpServer = null;
    this.httpsServer = null;
    this.contextCache = new Map(); // hostname -> tls.SecureContext
  }

  get isRunning() {
    return Boolean(this.httpServer || this.httpsServer);
  }

  async _getSecureContext(servername) {
    const hostname = certAuthority.sanitizeHostname(servername);
    if (this.contextCache.has(hostname)) return this.contextCache.get(hostname);
    const { pfx, passphrase } = await certAuthority.getLeafPfx(this.dataDir, this.caThumbprint, hostname);
    const ctx = tls.createSecureContext({ pfx, passphrase });
    this.contextCache.set(hostname, ctx);
    return ctx;
  }

  /** Best-effort: binds whichever of HTTP/HTTPS it can, and reports which succeeded. */
  async start() {
    const requestListener = (req, res) => {
      const host = (req.headers.host || '').split(':')[0];
      const schedule = this.getSchedule();
      const html = isWithinSchedule(schedule) ? renderSleepPage(host, schedule) : renderReminderPage(host);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(html) });
      res.end(html);
    };

    const bindHttp = () =>
      new Promise((resolve) => {
        const server = http.createServer(requestListener);
        server.on('error', (err) => {
          console.error(`[reminderServer] could not bind HTTP port ${HTTP_PORT}: ${err.message}`);
          resolve(false);
        });
        server.listen(HTTP_PORT, LISTEN_ADDRESS, () => {
          this.httpServer = server;
          resolve(true);
        });
      });

    const bindHttps = () =>
      new Promise((resolve) => {
        const server = https.createServer(
          {
            SNICallback: (servername, cb) => {
              this._getSecureContext(servername).then(
                (ctx) => cb(null, ctx),
                (err) => cb(err)
              );
            },
          },
          requestListener
        );
        server.on('error', (err) => {
          console.error(`[reminderServer] could not bind HTTPS port ${HTTPS_PORT}: ${err.message}`);
          resolve(false);
        });
        server.listen(HTTPS_PORT, LISTEN_ADDRESS, () => {
          this.httpsServer = server;
          resolve(true);
        });
      });

    const [httpOk, httpsOk] = await Promise.all([bindHttp(), bindHttps()]);
    return { httpOk, httpsOk };
  }

  async stop() {
    await Promise.all(
      [this.httpServer, this.httpsServer].map(
        (server) =>
          new Promise((resolve) => {
            if (!server) return resolve();
            server.close(() => resolve());
          })
      )
    );
    this.httpServer = null;
    this.httpsServer = null;
    this.contextCache.clear();
  }
}

module.exports = { ReminderServer, renderReminderPage, renderSleepPage, formatTime12h };
