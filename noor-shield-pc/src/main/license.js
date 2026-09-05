'use strict';

const crypto = require('crypto');

/**
 * Product-key activation, checked entirely on-device against a fixed list
 * of hashes shipped with the app (licenseKeyHashes.json — one per issued
 * key, generated once by scripts/generate-keys.js).
 *
 * Be clear about what this is and isn't: with no server to check
 * redemption against, this cannot stop the same key being used on more
 * than one PC, and cannot mark a key "used up" anywhere else. What it does
 * do is reject typos and made-up keys immediately — only a string that
 * hashes to one of the 1000 issued keys will ever pass. Real per-key
 * enforcement (and the ability to revoke a key) would need a small hosted
 * redemption service; this is deliberately not that.
 *
 * Keys are hashed rather than listed directly in the source specifically
 * so decompiling the app doesn't hand over usable keys — recovering a key
 * from its hash alone isn't feasible for a random 75-bit value.
 */

const KEY_HASHES = new Set(require('./licenseKeyHashes.json'));

/** "NOOR-XXXXX-XXXXX-XXXXX" -> "NOORXXXXXXXXXXXXXXX", tolerant of case/whitespace/missing dashes. */
function normalizeKey(rawInput) {
  return String(rawInput || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function isValidKey(rawInput) {
  const normalized = normalizeKey(rawInput);
  if (normalized.length !== 19 || !normalized.startsWith('NOOR')) return false;
  // Reconstruct the canonical dashed form the hashes were computed over.
  const body = normalized.slice(4);
  const canonical = `NOOR-${body.slice(0, 5)}-${body.slice(5, 10)}-${body.slice(10, 15)}`;
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  return KEY_HASHES.has(hash);
}

module.exports = { normalizeKey, isValidKey };
