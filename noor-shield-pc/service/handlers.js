'use strict';

const path = require('path');
const systemDns = require(path.join(__dirname, '..', 'src', 'main', 'systemDns'));
const { Blocklist, normalizeDomain, isValidDomain } = require(path.join(__dirname, '..', 'src', 'main', 'blocklist'));

// Bounds the log so a machine left running for months doesn't grow it
// without limit. Oldest entries drop off first.
const MAX_ACTIVITY_ENTRIES = 2000;

/**
 * Records one blocked attempt. Called from filterService.js's DnsProxy
 * 'blocked' listener — kept here, not inline there, so the cap/shape logic
 * has one home and is covered by the same tests as everything else in this
 * file.
 */
function appendActivity(store, domain) {
  const log = store.get('activityLog') || [];
  log.unshift({
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    domain,
    timestampMs: Date.now(),
  });
  if (log.length > MAX_ACTIVITY_ENTRIES) log.length = MAX_ACTIVITY_ENTRIES;
  store.set('activityLog', log);
}

/**
 * The RPC methods the always-on service exposes over the pipe (see
 * pipeTransport.js). This is the actual enforcement logic — the code that
 * used to live directly in the Electron main process before protection was
 * split out into a service that survives the GUI closing.
 *
 * `ctx` is provided by filterService.js:
 *   - store, parentAuth: from src/main/store.js and parentAuth.js, pointed at
 *     the service's own ProgramData location (not the GUI's per-user one)
 *   - seedDomains: the parsed seed blocklist
 *   - getProxy()/setProxy(): the live DnsProxy instance, created lazily
 *   - requestUninstall(): tears down the Windows service registration itself
 *
 * Every mutating method checks parentAuth.isUnlocked() itself — this is the
 * real gate. Nothing on the GUI side is trusted to have already checked.
 */
function createHandlers(ctx) {
  const { store, parentAuth, seedDomains } = ctx;

  function buildBlocklist() {
    const custom = (store.get('customDomains') || []).map((entry) => entry.domain);
    return new Blocklist(seedDomains, custom);
  }

  function refreshBlocklist() {
    const proxy = ctx.getProxy();
    if (proxy) proxy.setBlocklist(buildBlocklist());
  }

  async function startFilter() {
    if (process.platform !== 'win32') {
      return { ok: false, error: 'The filter currently supports Windows only.' };
    }
    if (!(await systemDns.isElevated())) {
      // In practice the service always runs as LocalSystem, which is already
      // elevated — this only trips during local development when the
      // service script is run directly as a normal user.
      return { ok: false, error: 'The protection service is not running with sufficient privileges.' };
    }

    let proxy = ctx.getProxy();
    if (!proxy) {
      proxy = ctx.createProxy(buildBlocklist());
    }

    if (!proxy.isRunning) {
      try {
        await proxy.start();
      } catch (err) {
        const reason =
          err.code === 'EADDRINUSE'
            ? 'Port 53 is already in use — another DNS or filtering program may be running.'
            : err.code === 'EACCES'
              ? 'Windows refused to allow listening on port 53.'
              : err.message;
        return { ok: false, error: `Could not start the local resolver: ${reason}` };
      }
    }

    try {
      const previous = await systemDns.apply();
      const worthSaving = previous.some((a) => (a.serverAddresses || []).some((s) => s !== '127.0.0.1'));
      if (worthSaving || !store.get('previousDns')) store.set('previousDns', previous);
    } catch (err) {
      await proxy.stop();
      return { ok: false, error: `Could not point Windows at the filter: ${err.message}` };
    }

    store.set('filterEnabled', true);
    ctx.onStateChange && ctx.onStateChange();
    return { ok: true };
  }

  async function stopFilter() {
    try {
      await systemDns.restore(store.get('previousDns'));
    } catch (err) {
      console.error(`[filter] DNS restore failed: ${err.message}`);
    }
    const proxy = ctx.getProxy();
    if (proxy) await proxy.stop();
    store.set('filterEnabled', false);
    ctx.onStateChange && ctx.onStateChange();
    return { ok: true };
  }

  /** Wraps a handler so it only runs when the parent session is unlocked — the real gate. */
  function parentOnly(fn) {
    return async (params) => {
      if (!parentAuth.isUnlocked()) {
        return { ok: false, error: 'locked', needsParent: true };
      }
      parentAuth.touch();
      return fn(params);
    };
  }

  const rpc = {
    'status.get': async () => {
      const proxy = ctx.getProxy();
      return {
        ok: true,
        platform: process.platform,
        filterEnabled: Boolean(store.get('filterEnabled')),
        proxyRunning: Boolean(proxy && proxy.isRunning),
        elevated: await systemDns.isElevated(),
        stats: proxy ? proxy.stats : { queries: 0, blocked: 0, forwarded: 0, failed: 0 },
        seedCount: seedDomains.length,
        customCount: (store.get('customDomains') || []).length,
        parent: parentAuth.status(),
        serviceVersion: ctx.version || null,
      };
    },

    'blocklist.list': async () => ({
      ok: true,
      custom: store.get('customDomains') || [],
      seedCount: seedDomains.length,
    }),

    // Blocked attempts only, by design (see README): not a full browsing
    // history. Gated like everything else that reveals what the child has
    // been doing, even though it can't itself change protection.
    'activity.list': parentOnly(async () => ({
      ok: true,
      entries: (store.get('activityLog') || []).slice(0, 500),
      totalCount: (store.get('activityLog') || []).length,
    })),

    'activity.clear': parentOnly(async () => {
      store.set('activityLog', []);
      return { ok: true };
    }),

    'parent.status': async () => ({ ok: true, ...parentAuth.status() }),
    'parent.setup': async ({ password }) => parentAuth.setup(password),
    'parent.unlock': async ({ password }) => parentAuth.unlock(password),
    'parent.lock': async () => {
      parentAuth.lock();
      return { ok: true };
    },
    'parent.changePassword': async ({ currentPassword, newPassword }) =>
      parentAuth.changePassword(currentPassword, newPassword),
    'parent.resetWithRecoveryKey': async ({ recoveryKey, newPassword }) =>
      parentAuth.resetWithRecoveryKey(recoveryKey, newPassword),

    'filter.enable': parentOnly(() => startFilter()),
    'filter.disable': parentOnly(() => stopFilter()),

    'blocklist.add': parentOnly(({ input }) => {
      const domain = normalizeDomain(input);
      if (!domain) return { ok: false, error: 'Enter a website address.' };
      if (!isValidDomain(domain)) {
        return { ok: false, error: 'That doesn\'t look like a valid website (e.g. example.com).' };
      }
      if (buildBlocklist().isBlocked(domain)) {
        return { ok: false, error: 'That site is already blocked.' };
      }
      const custom = store.get('customDomains') || [];
      custom.unshift({ domain, addedAt: Date.now() });
      store.set('customDomains', custom);
      refreshBlocklist();
      return { ok: true, domain };
    }),

    'blocklist.remove': parentOnly(({ domain }) => {
      const custom = (store.get('customDomains') || []).filter((e) => e.domain !== domain);
      store.set('customDomains', custom);
      refreshBlocklist();
      return { ok: true };
    }),

    // Repairs DNS without requiring the parent password: a family whose
    // internet is broken (e.g. after a crash) shouldn't need the parent
    // present just to get back online. It never disables the filter's
    // intent — reconcileOnStartup() resumes protecting on the next start.
    'dns.repair': async () => {
      await systemDns.restore(store.get('previousDns')).catch(() => {});
      return { ok: true };
    },

    // Removing the service registration itself (vs. just turning the filter
    // off) is done by the caller after this returns ok — see serviceClient.js
    // on the Electron side. That process is already elevated and external to
    // this one, which is what node-windows' stop-then-uninstall sequence
    // expects; doing it from inside the very service being torn down is a
    // self-referential mess this deliberately avoids. This handler's job is
    // just the part that has to happen here: verify the parent password and
    // put DNS back before anything is removed.
    'service.prepareUninstall': parentOnly(async () => {
      await stopFilter();
      return { ok: true };
    }),
  };

  // Exposed unwrapped for the service's own startup reconciliation, which
  // resumes a previously-saved intent rather than acting on a new request —
  // it has no parent session to check and shouldn't go through parentOnly().
  return { rpc, startFilter, stopFilter };
}

module.exports = { createHandlers, appendActivity, MAX_ACTIVITY_ENTRIES };
