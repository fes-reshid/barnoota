'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const { isValidDomain } = require(path.join(__dirname, '..', 'src', 'main', 'blocklist'));

/**
 * Periodically-refreshed public domain feeds, layered on top of the small
 * bundled seed list (resources/blocklist_domains.txt). No static file
 * shipped with the app can keep up with new sites — this fetches several of
 * The Blocklist Project's actively-maintained lists and caches each parsed
 * result to disk, so:
 *   - a PC with no internet, or where a fetch fails, keeps using whatever
 *     was last cached for that category (or nothing, if it's never
 *     succeeded — the seed list and any still-working categories still
 *     apply regardless)
 *   - each ~raw list is parsed once per fetch, not once per service restart
 *     — the cache is our own compact one-domain-per-line format
 *
 * Deliberately excludes The Blocklist Project's own "malware" list: at
 * ~2.6 million domains it alone would cost this background service roughly
 * 700MB of RAM and a ~70MB daily download — disproportionate for a family
 * PC given "phishing" and "scam" already cover most of the same ground far
 * more cheaply. Real malware *scanning* (files already on the PC) is a
 * different problem entirely, one Windows' built-in Defender already
 * handles — this only ever blocks known-bad domains, the same as
 * everything else here.
 */

const FEEDS = {
  adult: {
    url: 'https://raw.githubusercontent.com/blocklistproject/Lists/master/porn.txt',
    label: 'Adult content',
  },
  phishing: {
    url: 'https://raw.githubusercontent.com/blocklistproject/Lists/master/phishing.txt',
    label: 'Phishing',
  },
  scam: {
    url: 'https://raw.githubusercontent.com/blocklistproject/Lists/master/scam.txt',
    label: 'Scam',
  },
  ads: {
    url: 'https://raw.githubusercontent.com/blocklistproject/Lists/master/ads.txt',
    label: 'Advertising',
  },
  tracking: {
    url: 'https://raw.githubusercontent.com/blocklistproject/Lists/master/tracking.txt',
    label: 'Tracking',
  },
};

// User-facing grouping: which feed keys count toward which toggle in the UI.
// "adult" is always active (this app's core purpose, not something to
// casually switch off); "security" and "ads" are parent-toggleable.
const CATEGORY_GROUPS = {
  adult: ['adult'],
  security: ['phishing', 'scam'],
  ads: ['ads', 'tracking'],
};

const FETCH_TIMEOUT_MS = 30000;
const MAX_REDIRECTS = 3;

function cachePath(dataDir, feedKey) {
  return path.join(dataDir, `feed-${feedKey}.txt`);
}

/** Reads the last successfully-fetched (and parsed) feed from disk, if any. */
function loadCachedFeed(dataDir, feedKey) {
  try {
    const text = fs.readFileSync(cachePath(dataDir, feedKey), 'utf8');
    return text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  } catch (_) {
    return [];
  }
}

function loadAllCachedFeeds(dataDir) {
  const result = {};
  for (const key of Object.keys(FEEDS)) result[key] = loadCachedFeed(dataDir, key);
  return result;
}

function saveCachedFeed(dataDir, feedKey, domains) {
  fs.mkdirSync(dataDir, { recursive: true });
  const target = cachePath(dataDir, feedKey);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, domains.join('\n') + '\n', 'utf8');
  fs.renameSync(tmp, target);
}

/** Parses a hosts-file-format list ("0.0.0.0 domain.tld" per line) into a deduped domain array. */
function parseHostsFormat(text) {
  const seen = new Set();
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:0\.0\.0\.0|127\.0\.0\.1)\s+(\S+)/);
    if (!match) continue;
    const domain = match[1].toLowerCase();
    if (isValidDomain(domain)) seen.add(domain);
  }
  return Array.from(seen);
}

function fetchText(url, redirectsLeft) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: FETCH_TIMEOUT_MS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
        res.resume();
        fetchText(res.headers.location, redirectsLeft - 1).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`Feed server returned HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('Feed fetch timed out')));
    req.on('error', reject);
  });
}

/**
 * Fetches, parses, and caches one named feed. Never throws — a failure (no
 * internet, feed host down, etc.) is expected and unremarkable; the caller
 * keeps using whatever was already loaded for that feed.
 */
async function refreshFeed(dataDir, feedKey) {
  const feed = FEEDS[feedKey];
  if (!feed) return { ok: false, error: `Unknown feed: ${feedKey}` };
  try {
    const text = await fetchText(feed.url, MAX_REDIRECTS);
    const domains = parseHostsFormat(text);
    if (domains.length === 0) throw new Error('Feed fetch returned no valid domains');
    saveCachedFeed(dataDir, feedKey, domains);
    return { ok: true, count: domains.length, domains, fetchedAt: Date.now() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Refreshes every feed, one at a time (not in parallel) — these are large
 * downloads, and there's no reason to hit the feed host with several at
 * once. Returns a { [feedKey]: result } map; a failure for one feed doesn't
 * stop the others from being attempted.
 */
async function refreshAllFeeds(dataDir) {
  const results = {};
  for (const key of Object.keys(FEEDS)) {
    results[key] = await refreshFeed(dataDir, key);
  }
  return results;
}

module.exports = {
  FEEDS,
  CATEGORY_GROUPS,
  loadCachedFeed,
  loadAllCachedFeeds,
  saveCachedFeed,
  parseHostsFormat,
  refreshFeed,
  refreshAllFeeds,
  cachePath,
};
