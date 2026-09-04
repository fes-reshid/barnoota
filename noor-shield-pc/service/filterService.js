'use strict';

const path = require('path');
const fs = require('fs');

const { Store } = require(path.join(__dirname, '..', 'src', 'main', 'store'));
const { ParentAuth } = require(path.join(__dirname, '..', 'src', 'main', 'parentAuth'));
const { DnsProxy } = require(path.join(__dirname, '..', 'src', 'main', 'dnsProxy'));
const systemDns = require(path.join(__dirname, '..', 'src', 'main', 'systemDns'));
const { loadSeedDomains } = require(path.join(__dirname, '..', 'src', 'main', 'blocklist'));
const feedBlocklist = require('./feedBlocklist');
const certAuthority = require('./certAuthority');
const { ReminderServer } = require('./reminderServer');
const { createServer } = require('./pipeTransport');
const { createHandlers, appendActivity } = require('./handlers');

// How often the public feed (see feedBlocklist.js) is re-fetched. New adult
// sites appear constantly, but this is a large (~25MB) download — daily is
// frequent enough to matter and infrequent enough not to be rude to the
// feed's host.
const FEED_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * The process that actually runs "always": installed as a Windows service
 * (see install.js), started at boot under the LocalSystem account, restarted
 * automatically by the WinSW wrapper if it crashes. It survives the Electron
 * GUI closing, the user logging off, and — because it starts before any user
 * session exists — a reboot with nobody signed in yet.
 *
 * Data lives in %ProgramData%\NoorShield rather than a per-user profile,
 * deliberately: LocalSystem has no meaningful "home directory" of its own,
 * and a single parent password protecting the whole PC regardless of which
 * Windows account is logged in is the right model for a family computer.
 *
 * This script is designed to run two ways:
 *   1. As the forked child of node-windows' wrapper.js, which is what
 *      happens once installed as a service (see the `message` handler below
 *      for the 'shutdown' IPC message that path sends on stop).
 *   2. Directly with `node filterService.js`, for local development and for
 *      the tests in this repo — it behaves identically, just without the
 *      Windows Service Control Manager around it.
 */

function dataDir() {
  const base = process.env.ProgramData || process.env.PROGRAMDATA || (process.platform === 'win32' ? 'C:\\ProgramData' : '/tmp');
  return path.join(base, 'NoorShield');
}

function readVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return pkg.version;
  } catch (_) {
    return null;
  }
}

/**
 * Sets up the local CA and the reminder-page HTTP/HTTPS servers, so a
 * blocked site shows a Hadith reminder instead of failing outright. This is
 * deliberately best-effort and independent of the filter's on/off state:
 * it runs once at service startup and stays up for as long as the service
 * does. Nothing reaches it unless the DNS proxy has separately redirected a
 * blocked domain to 127.0.0.1 — which only happens once this setup reports
 * available: true (see DnsProxy's reminderPageAvailable flag) — so a
 * failure here just means blocked sites fall back to the plain NXDOMAIN
 * behavior that existed before this feature, never a reason to stop the
 * service from protecting the PC at all.
 */
async function setupReminderPage() {
  if (process.platform !== 'win32') return { server: null, available: false };
  try {
    const caMeta = await certAuthority.ensureCaInstalled(dataDir());
    const server = new ReminderServer({ dataDir: dataDir(), caThumbprint: caMeta.thumbprint });
    const { httpOk, httpsOk } = await server.start();
    const available = Boolean(httpOk || httpsOk);
    if (!available) {
      console.error('[reminderPage] neither port 80 nor 443 could bind — falling back to NXDOMAIN for blocked sites.');
    } else if (!httpsOk) {
      console.error('[reminderPage] HTTPS port 443 could not bind — blocked HTTPS sites will fail to connect rather than show the reminder page; HTTP still works.');
    }
    return { server, available };
  } catch (err) {
    console.error(`[reminderPage] setup failed, falling back to NXDOMAIN for blocked sites: ${err.message}`);
    return { server: null, available: false };
  }
}

async function main() {
  const store = new Store(dataDir());
  const parentAuth = new ParentAuth(store);
  const seedDomains = loadSeedDomains();
  const feedDomains = feedBlocklist.loadCachedFeed(dataDir());
  const { server: reminderServer, available: reminderPageAvailable } = await setupReminderPage();

  let proxy = null;
  const ctx = {
    store,
    parentAuth,
    seedDomains,
    feedDomains,
    dataDir: dataDir(),
    version: readVersion(),
    getProxy: () => proxy,
    createProxy: (blocklist) => {
      proxy = new DnsProxy({ blocklist, reminderPageAvailable });
      proxy.on('error', (err) => console.error(`[dnsProxy] ${err.message}`));
      // The activity log the parent reviews (and can email themselves a
      // report of) — blocked attempts only, not every site visited.
      proxy.on('blocked', ({ domain }) => appendActivity(store, domain));
      return proxy;
    },
    reminderPageAvailable,
    onStateChange: () => {}, // hook point if a future UI wants push updates
  };

  const { rpc, startFilter, stopFilter, refreshFeedFromRemote } = createHandlers(ctx);

  /**
   * Startup reconciliation resumes the service's own previously-saved
   * intent — it isn't a new request from anyone, so it calls startFilter()/
   * stopFilter() directly rather than through the parent-gated RPC map.
   */
  async function reconcileOnStartup() {
    if (process.platform !== 'win32') return;

    const shouldRun = store.get('filterEnabled');
    let redirected = false;
    try {
      redirected = await systemDns.isRedirected();
    } catch (err) {
      console.error(`[startup] could not read DNS config: ${err.message}`);
      return;
    }

    if (shouldRun) {
      const result = await startFilter();
      if (!result.ok && redirected) {
        await systemDns.restore(store.get('previousDns')).catch(() => {});
        console.error(`[startup] could not start filter: ${result.error}`);
      }
    } else if (redirected) {
      await systemDns.restore(store.get('previousDns')).catch(() => {});
    }
  }

  await reconcileOnStartup();

  const server = await createServer((method, params) => {
    const handler = rpc[method];
    if (!handler) return { ok: false, error: `Unknown method: ${method}` };
    return handler(params);
  });
  console.log(`[filterService] listening (pid ${process.pid}, data dir ${dataDir()})`);

  // Fire-and-forget: never block startup on a large network fetch. A failure
  // here (no internet yet, feed host unreachable) just means the service
  // keeps running on the seed list plus whatever feed snapshot was already
  // cached — never a reason to delay listening on the pipe or fail to start.
  refreshFeedFromRemote().catch((err) => console.error(`[feed] initial refresh failed: ${err.message}`));
  const feedTimer = setInterval(() => {
    refreshFeedFromRemote().catch((err) => console.error(`[feed] refresh failed: ${err.message}`));
  }, FEED_REFRESH_INTERVAL_MS);
  feedTimer.unref(); // never keep the process alive on its own

  let shuttingDown = false;
  async function shutdown(reason) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[filterService] shutting down (${reason})`);
    try {
      server.close();
    } catch (_) {
      /* already closed */
    }
    if (reminderServer) {
      await reminderServer.stop().catch(() => {});
    }
    // Best-effort, bounded: a hung PowerShell call must not block the service
    // from stopping when the SCM asks it to.
    await Promise.race([
      systemDns.restore(store.get('previousDns')).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
    process.exit(0);
  }

  // node-windows' wrapper sends this IPC message when `stopparentfirst` is
  // configured (see install.js) — the graceful path, giving us time to
  // restore DNS before the process is torn down.
  process.on('message', (msg) => {
    if (msg === 'shutdown') shutdown('service stop');
  });
  // Fallback for anything that sends a plain signal instead (including
  // Ctrl+C during local development).
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[filterService] fatal error during startup:', err);
  process.exit(1);
});
