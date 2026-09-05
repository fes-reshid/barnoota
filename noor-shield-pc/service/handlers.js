'use strict';

const path = require('path');
const systemDns = require(path.join(__dirname, '..', 'src', 'main', 'systemDns'));
const { Blocklist, normalizeDomain, isValidDomain } = require(path.join(__dirname, '..', 'src', 'main', 'blocklist'));
const feedBlocklist = require('./feedBlocklist');
const certAuthority = require('./certAuthority');
const { isValidKey, trialDaysRemaining, isTrialActive } = require(path.join(
  __dirname,
  '..',
  'src',
  'main',
  'license'
));
const { isValidSchedule, isWithinSchedule, minutesUntilScheduleEnds } = require(path.join(
  __dirname,
  '..',
  'src',
  'main',
  'schedule'
));

// Bounds the log so a machine left running for months doesn't grow it
// without limit. Oldest entries drop off first.
const MAX_ACTIVITY_ENTRIES = 2000;

/**
 * Records one blocked attempt. Called from filterService.js's DnsProxy
 * 'blocked' listener — kept here, not inline there, so the cap/shape logic
 * has one home and is covered by the same tests as everything else in this
 * file.
 */
function appendActivity(store, domain, reason) {
  const log = store.get('activityLog') || [];
  log.unshift({
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    domain,
    reason: reason || 'blocklist', // 'blocklist' or 'schedule'
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

  // Raw per-feed domain arrays (adult, phishing, scam, ads, tracking — see
  // feedBlocklist.FEEDS), mutated in place as each one refreshes. Starts
  // from whatever was cached from the last successful fetch of each
  // (possibly none, on a fresh install that's never been online).
  const feedsByKey = { ...(ctx.feedDomains || {}) };
  const feedMetaByKey = {};
  for (const key of Object.keys(feedBlocklist.FEEDS)) {
    feedMetaByKey[key] = { fetchedAt: null, count: (feedsByKey[key] || []).length, lastError: null };
  }

  function categoriesEnabled() {
    return { security: true, ads: true, ...store.get('filterCategories') };
  }

  // The single array Blocklist actually matches against — everything from
  // "adult" (always on: this app's core purpose) plus whichever
  // parent-toggleable groups (security, ads) are currently enabled.
  // Recomputed whenever a feed refreshes or a toggle changes, not on every
  // isBlocked() check — these arrays can be hundreds of thousands of
  // entries long.
  let mergedFeedDomains = [];

  function recomputeMergedFeed() {
    const enabled = categoriesEnabled();
    const activeKeys = new Set(feedBlocklist.CATEGORY_GROUPS.adult);
    if (enabled.security) for (const k of feedBlocklist.CATEGORY_GROUPS.security) activeKeys.add(k);
    if (enabled.ads) for (const k of feedBlocklist.CATEGORY_GROUPS.ads) activeKeys.add(k);

    const merged = new Set();
    for (const key of activeKeys) {
      for (const domain of feedsByKey[key] || []) merged.add(domain);
    }
    mergedFeedDomains = Array.from(merged);
  }
  recomputeMergedFeed();

  /** Summarizes one user-facing group (adult/security/ads) for status.get/blocklist.list. */
  function groupSummary(groupKey) {
    let count = 0;
    let fetchedAt = null;
    let lastError = null;
    for (const key of feedBlocklist.CATEGORY_GROUPS[groupKey]) {
      count += (feedsByKey[key] || []).length;
      const meta = feedMetaByKey[key];
      if (!meta) continue;
      if (meta.fetchedAt && (!fetchedAt || meta.fetchedAt > fetchedAt)) fetchedAt = meta.fetchedAt;
      if (meta.lastError) lastError = meta.lastError;
    }
    return { count, fetchedAt, lastError };
  }

  function feedCategoriesSummary() {
    const enabled = categoriesEnabled();
    return {
      adult: { ...groupSummary('adult'), enabled: true, toggleable: false },
      security: { ...groupSummary('security'), enabled: enabled.security, toggleable: true },
      ads: { ...groupSummary('ads'), enabled: enabled.ads, toggleable: true },
    };
  }

  function scheduleStatus() {
    const schedule = store.get('schedule');
    return {
      ...schedule,
      active: isWithinSchedule(schedule),
      minutesRemaining: minutesUntilScheduleEnds(schedule),
    };
  }

  function buildBlocklist() {
    const custom = (store.get('customDomains') || []).map((entry) => entry.domain);
    return new Blocklist(seedDomains, custom, mergedFeedDomains);
  }

  function refreshBlocklist() {
    const proxy = ctx.getProxy();
    if (proxy) proxy.setBlocklist(buildBlocklist());
  }

  /**
   * Fetches one named feed and, on success, folds it into the live
   * blocklist immediately (if its group is currently enabled). Safe to call
   * anytime (startup, on a timer, or by request) — a failure just leaves
   * that feed's cached domains and metadata as they were.
   */
  async function refreshFeedFromRemote(feedKey) {
    const result = await feedBlocklist.refreshFeed(ctx.dataDir, feedKey);
    if (result.ok) {
      feedsByKey[feedKey] = result.domains;
      feedMetaByKey[feedKey] = { fetchedAt: result.fetchedAt, count: result.count, lastError: null };
      recomputeMergedFeed();
      refreshBlocklist();
    } else {
      feedMetaByKey[feedKey] = { ...feedMetaByKey[feedKey], lastError: result.error };
    }
    return result;
  }

  /** Refreshes every feed, one at a time — see feedBlocklist.refreshAllFeeds for why. */
  async function refreshAllFeedsFromRemote() {
    const results = {};
    for (const key of Object.keys(feedBlocklist.FEEDS)) {
      results[key] = await refreshFeedFromRemote(key);
    }
    return results;
  }

  async function startFilter() {
    if (!store.get('activated') && !isTrialActive(store.get('firstRunAt'))) {
      return {
        ok: false,
        error: 'Your free trial has ended. Enter your product key (see the About tab) to keep protection on.',
      };
    }
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
        feedCount: mergedFeedDomains.length,
        feedCategories: feedCategoriesSummary(),
        reminderPageAvailable: Boolean(ctx.reminderPageAvailable),
        schedule: scheduleStatus(),
        activated: Boolean(store.get('activated')),
        trialDaysRemaining: trialDaysRemaining(store.get('firstRunAt')),
        parent: parentAuth.status(),
        serviceVersion: ctx.version || null,
      };
    },

    // The custom (parent-added) domain list is only included when unlocked
    // — seeing exactly what's specifically blocked could itself help a
    // child probe for gaps. seedCount/feedCount/feedCategories stay visible
    // either way: they're just totals, not a list to check against.
    'blocklist.list': async () => ({
      ok: true,
      custom: parentAuth.isUnlocked() ? store.get('customDomains') || [] : [],
      customHidden: !parentAuth.isUnlocked(),
      seedCount: seedDomains.length,
      feedCount: mergedFeedDomains.length,
      feedCategories: feedCategoriesSummary(),
    }),

    // Not parent-gated: this only pulls in public lists, the same ones
    // anyone could download themselves — nothing it does requires the
    // parent password, unlike anything that actually changes what's
    // protected in a way a child could exploit.
    //
    // Deliberately doesn't await the fetches: the pipe's own call timeout
    // (a few seconds — see pipeTransport.js) is far shorter than these
    // downloads can take, so waiting here would report "timed out" over an
    // attempt that's actually still running. Firing it in the background
    // and returning immediately lets the next status/blocklist.list poll
    // (the renderer already polls every few seconds) pick up the result.
    'blocklist.refreshFeed': async () => {
      refreshAllFeedsFromRemote().catch(() => {});
      return { ok: true, started: true };
    },

    // Toggling ad/tracker or malware/phishing blocking off — never adult
    // content, that's this app's whole purpose and isn't exposed here.
    'blocklist.setCategory': parentOnly(({ category, enabled }) => {
      if (category !== 'security' && category !== 'ads') {
        return { ok: false, error: 'Unknown category.' };
      }
      store.set('filterCategories', { ...categoriesEnabled(), [category]: Boolean(enabled) });
      recomputeMergedFeed();
      refreshBlocklist();
      return { ok: true };
    }),

    // A recurring full-internet-off window (bedtime/screen-time). Enforced
    // live by DnsProxy on every query (see isScheduleActive in
    // filterService.js) — nothing here needs to start/stop the DNS proxy or
    // touch Windows' DNS settings, since the schedule only changes what a
    // query already flowing through the proxy gets answered with.
    'schedule.set': parentOnly(({ enabled, days, startTime, endTime }) => {
      const candidate = { enabled: Boolean(enabled), days, startTime, endTime };
      if (candidate.enabled && !isValidSchedule(candidate)) {
        return {
          ok: false,
          error: 'Pick at least one day and two different times before turning the schedule on.',
        };
      }
      store.set('schedule', candidate);
      return { ok: true };
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

    // Not parent-gated — there is no parent password yet the first time this
    // runs (activation happens before parent setup). Deliberately separate
    // from parentAuth: a product key activates the app; it never resets or
    // substitutes for the parent password, which has its own one-time
    // recovery key for that (see parentAuth.js).
    'license.activate': async ({ key }) => {
      if (store.get('activated')) return { ok: true, alreadyActivated: true };
      if (!isValidKey(key)) {
        return { ok: false, error: 'That product key isn\'t recognized. Double-check it and try again.' };
      }
      store.set('activated', true);
      return { ok: true };
    },

    'parent.status': async () => ({
      ok: true,
      activated: Boolean(store.get('activated')),
      trialDaysRemaining: trialDaysRemaining(store.get('firstRunAt')),
      ...parentAuth.status(),
    }),
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
    // just the part that has to happen here: verify the parent password,
    // put DNS back, and remove the local certificate authority (see
    // certAuthority.js) from Windows' trust store — leaving that behind
    // after protection is otherwise gone would be a stray, unexplained
    // trusted root cert, which is exactly the kind of thing that should
    // never outlive the app that installed it.
    'service.prepareUninstall': parentOnly(async () => {
      await stopFilter();
      await certAuthority.removeCa(ctx.dataDir).catch(() => {});
      return { ok: true };
    }),
  };

  // Exposed unwrapped for the service's own startup reconciliation and its
  // periodic feed-refresh timer, neither of which is a request going through
  // the RPC/parentOnly() path.
  return { rpc, startFilter, stopFilter, refreshAllFeedsFromRemote };
}

module.exports = { createHandlers, appendActivity, MAX_ACTIVITY_ENTRIES };
