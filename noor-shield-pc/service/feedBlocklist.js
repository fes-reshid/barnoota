'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const { isValidDomain } = require(path.join(__dirname, '..', 'src', 'main', 'blocklist'));

/**
 * Periodically-refreshed public domain feed, layered on top of the small
 * bundled seed list (resources/blocklist_domains.txt). No static file
 * shipped with the app can keep up with new adult sites — this fetches The
 * Blocklist Project's actively-maintained porn list (~950k domains as of
 * writing) and caches the parsed result to disk, so:
 *   - a PC with no internet, or where the fetch fails, keeps using whatever
 *     was last cached (or just the seed list, if it's never succeeded yet)
 *   - the ~25MB raw feed is parsed once per fetch, not once per service
 *     restart — the cache is our own compact one-domain-per-line format
 */

const FEED_URL = 'https://raw.githubusercontent.com/blocklistproject/Lists/master/porn.txt';
const CACHE_FILENAME = 'feed-domains.txt';
const FETCH_TIMEOUT_MS = 30000;
const MAX_REDIRECTS = 3;

function cachePath(dataDir) {
  return path.join(dataDir, CACHE_FILENAME);
}

/** Reads the last successfully-fetched (and parsed) feed from disk, if any. */
function loadCachedFeed(dataDir) {
  try {
    const text = fs.readFileSync(cachePath(dataDir), 'utf8');
    return text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  } catch (_) {
    return [];
  }
}

function saveCachedFeed(dataDir, domains) {
  fs.mkdirSync(dataDir, { recursive: true });
  const tmp = `${cachePath(dataDir)}.tmp`;
  fs.writeFileSync(tmp, domains.join('\n') + '\n', 'utf8');
  fs.renameSync(tmp, cachePath(dataDir));
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
 * Fetches, parses, and caches the current feed. Never throws — a failure
 * (no internet, feed host down, etc.) is expected and unremarkable; the
 * caller keeps using whatever was already loaded.
 */
async function refreshFeed(dataDir) {
  try {
    const text = await fetchText(FEED_URL, MAX_REDIRECTS);
    const domains = parseHostsFormat(text);
    if (domains.length === 0) throw new Error('Feed fetch returned no valid domains');
    saveCachedFeed(dataDir, domains);
    return { ok: true, count: domains.length, domains, fetchedAt: Date.now() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { FEED_URL, loadCachedFeed, saveCachedFeed, parseHostsFormat, refreshFeed, cachePath };
