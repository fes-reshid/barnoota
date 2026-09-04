'use strict';

const http = require('http');
const https = require('https');
const tls = require('tls');
const path = require('path');

const certAuthority = require('./certAuthority');
const hadith = require(path.join(__dirname, '..', 'src', 'main', 'hadith'));

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
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #16241d; color: #f6f5f0; font-family: "Segoe UI", system-ui, sans-serif; padding: 32px;
  }
  .card {
    max-width: 620px; background: #1e332a; border: 1px solid #2a6f5e; border-radius: 16px;
    padding: 40px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.4);
  }
  .icon { font-size: 40px; margin-bottom: 8px; }
  h1 { font-size: 22px; margin: 0 0 6px; color: #f6f5f0; }
  .host { font-size: 14px; color: #c9a24b; margin: 0 0 24px; word-break: break-all; }
  .quote {
    text-align: left; background: rgba(0,0,0,.2); border-left: 3px solid #c9a24b;
    border-radius: 6px; padding: 18px 20px; margin: 0 0 14px; line-height: 1.7; font-size: 15px;
  }
  .source { text-align: left; font-size: 13px; color: #8a968e; font-style: italic; margin: 0 0 26px; }
  .note { font-size: 14px; color: #d8d3c4; line-height: 1.6; margin: 0; }
  .brand { margin-top: 28px; font-size: 12px; color: #5f7167; letter-spacing: .04em; text-transform: uppercase; }
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
    <p class="brand">Noor Shield</p>
  </div>
</body>
</html>`;
}

class ReminderServer {
  constructor({ dataDir, caThumbprint }) {
    this.dataDir = dataDir;
    this.caThumbprint = caThumbprint;
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
      const html = renderReminderPage(host);
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

module.exports = { ReminderServer, renderReminderPage };
