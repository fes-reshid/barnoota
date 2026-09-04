'use strict';

const fs = require('fs');
const path = require('path');

/**
 * The set of domains the DNS proxy refuses to resolve: a bundled seed list,
 * whatever the parent has added, and (on PC) a periodically-refreshed public
 * feed (see feedBlocklist.js) for coverage no static list can keep up with.
 * Mirrors the Android DomainBlocklist, including subdomain matching —
 * blocking "example.com" also blocks "cdn.example.com".
 */
class Blocklist {
  constructor(seedDomains, customDomains, feedDomains) {
    this.seed = new Set(seedDomains);
    this.custom = new Set(customDomains);
    this.feed = new Set(feedDomains || []);
  }

  /** True if host, or any parent domain of host, is blocked. */
  isBlocked(host) {
    let candidate = String(host || '').replace(/\.+$/, '').toLowerCase();
    while (candidate.length > 0) {
      if (this.seed.has(candidate) || this.custom.has(candidate) || this.feed.has(candidate)) return true;
      const dot = candidate.indexOf('.');
      if (dot < 0) return false;
      candidate = candidate.slice(dot + 1);
    }
    return false;
  }

  get size() {
    return new Set([...this.seed, ...this.custom, ...this.feed]).size;
  }
}

/**
 * Where the seed list lives. In a packaged build electron-builder copies it
 * into resources/; in development it sits in the repo.
 */
function seedListPath() {
  const packaged = path.join(process.resourcesPath || '', 'blocklist_domains.txt');
  if (process.resourcesPath && fs.existsSync(packaged)) return packaged;
  return path.join(__dirname, '..', '..', 'resources', 'blocklist_domains.txt');
}

function loadSeedDomains() {
  const file = seedListPath();
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    // A missing seed list must not silently mean "block nothing" — say so loudly.
    console.error(`[blocklist] could not read seed list at ${file}: ${err.message}`);
    return [];
  }
  return text
    .split(/\r?\n/)
    .map((line) => line.split('#')[0].trim().toLowerCase())
    .filter((line) => line.length > 0);
}

/** Strips scheme, path, port and a leading "www." — "https://www.Example.com/x" -> "example.com". */
function normalizeDomain(rawInput) {
  let value = String(rawInput || '').trim().toLowerCase();
  const schemeIndex = value.indexOf('://');
  if (schemeIndex >= 0) value = value.slice(schemeIndex + 3);
  value = value.split('/')[0];
  value = value.split(':')[0];
  if (value.startsWith('www.')) value = value.slice(4);
  return value;
}

// Labels of letters/digits/hyphens separated by dots, at least one dot, no leading/trailing hyphen.
const HOSTNAME_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

function isValidDomain(domain) {
  return HOSTNAME_RE.test(domain);
}

module.exports = { Blocklist, loadSeedDomains, normalizeDomain, isValidDomain, seedListPath };
