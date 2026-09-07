'use strict';

// Generates a batch of new NOOR-XXXXX-XXXXX-XXXXX product keys, appends
// their SHA-256 hashes to src/main/licenseKeyHashes.json (the only copy of
// a key that ever ships with the app — see license.js for why), and writes
// the plaintext keys to a local file so they aren't lost.
//
// The plaintext output is NEVER committed to git — only the hashes are.
// After running this, also re-run scripts/gen-seed-sql.js and then apply
// the regenerated cloud/seed_license_keys.sql in Supabase's SQL Editor so
// the new keys actually work.
//
// Usage: node scripts/generate-keys.js [count] [outputFile]

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COUNT = Number(process.argv[2]) || 1000;
const OUTPUT_FILE = process.argv[3] || path.join(__dirname, '..', 'new-product-keys.txt');
const HASHES_FILE = path.join(__dirname, '..', 'src', 'main', 'licenseKeyHashes.json');

// Excludes visually ambiguous characters (0/O, 1/I/L) so a key is easy to
// read back correctly from a screen or printout.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomGroup(length) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return out;
}

function hashOf(canonicalKey) {
  return crypto.createHash('sha256').update(canonicalKey).digest('hex');
}

function main() {
  const existingHashes = new Set(fs.existsSync(HASHES_FILE) ? require(HASHES_FILE) : []);

  const keys = [];
  const newHashes = [];
  while (keys.length < COUNT) {
    const key = `NOOR-${randomGroup(5)}-${randomGroup(5)}-${randomGroup(5)}`;
    const hash = hashOf(key);
    if (existingHashes.has(hash)) continue; // astronomically unlikely, but stay correct
    existingHashes.add(hash);
    keys.push(key);
    newHashes.push(hash);
  }

  fs.writeFileSync(HASHES_FILE, JSON.stringify([...existingHashes].sort(), null, 0));
  fs.writeFileSync(OUTPUT_FILE, keys.join('\n') + '\n');

  console.log(`Generated ${keys.length} new keys.`);
  console.log(`Plaintext keys written to: ${OUTPUT_FILE} (keep this safe — do not commit it)`);
  console.log(`Hashes merged into: ${HASHES_FILE}`);
  console.log('Next: node scripts/gen-seed-sql.js, then run the regenerated cloud/seed_license_keys.sql in Supabase.');
}

main();
