'use strict';

const crypto = require('crypto');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../../service/supabaseConfig');

/**
 * Product-key activation, checked against a real Supabase table
 * (license_keys / activate_license_key — see cloud/schema.sql) so a key
 * already claimed by another PC is actually rejected, not just a made-up
 * or mistyped one. Deliberately "check once, then work offline forever":
 * activateKeyOnline() is only ever called at the moment the parent clicks
 * "Activate" — once store.activated is true, the filter keeps enforcing
 * with no further need for internet, matching the rest of the app.
 *
 * Keys are hashed before ever leaving this PC — only the SHA-256 hash is
 * sent, never the plaintext key.
 */

const TRIAL_DAYS = 7;
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Days left in the one-time free trial, counted from the first time the
 * protection service ever ran on this PC (store.firstRunAt) — not from
 * install, so reinstalling the app alone can't be used to keep resetting
 * it. 0 once the trial has run out. Always 0 if firstRunAt isn't set yet
 * (the caller is expected to set it before relying on this).
 */
function trialDaysRemaining(firstRunAt, now = Date.now()) {
  if (!firstRunAt) return 0;
  const remainingMs = TRIAL_MS - (now - firstRunAt);
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

function isTrialActive(firstRunAt, now = Date.now()) {
  return Boolean(firstRunAt) && now - firstRunAt < TRIAL_MS;
}

/**
 * True if an activated key is still within its access window. `expiresAt`
 * is null for a lifetime key (the common case) — always active once
 * activated. A time-limited key (e.g. a 29-day key) carries a real
 * timestamp, set once at activation time (see activate_license_key in
 * schema.sql) and stored locally in store.license.expiresAt, checked here
 * with no further network round trip — same offline-first design as the
 * rest of activation, just no longer "forever" for these keys.
 */
function isLicenseActive(activated, expiresAt, now = Date.now()) {
  if (!activated) return false;
  if (!expiresAt) return true;
  return now < new Date(expiresAt).getTime();
}

/** "NOOR-XXXXX-XXXXX-XXXXX" -> "NOORXXXXXXXXXXXXXXX", tolerant of case/whitespace/missing dashes. */
function normalizeKey(rawInput) {
  return String(rawInput || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** Hashes a key the same way scripts/generate-keys.js did, or null if the format is wrong. */
function hashKey(rawInput) {
  const normalized = normalizeKey(rawInput);
  if (normalized.length !== 19 || !normalized.startsWith('NOOR')) return null;
  const body = normalized.slice(4);
  const canonical = `NOOR-${body.slice(0, 5)}-${body.slice(5, 10)}-${body.slice(10, 15)}`;
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Checks a key against Supabase's activate_license_key function, scoped to
 * this PC's deviceId (see store.js's `license.deviceId`, generated once and
 * reused on every later activation attempt — including reinstalls — so the
 * same PC re-activating its own key never looks like reuse on another PC).
 *
 * Returns { ok: true, expiresAt } on success — expiresAt is null for a
 * lifetime key or an ISO timestamp for a time-limited one (see
 * isLicenseActive) — or { ok: false, reason } where reason is 'invalid'
 * (not a real key), 'already_used' (claimed by a different PC),
 * 'bad_format' (didn't even look like a key), or 'network_error' (couldn't
 * reach Supabase at all).
 */
async function activateKeyOnline(rawInput, deviceId) {
  const hash = hashKey(rawInput);
  if (!hash) return { ok: false, reason: 'bad_format' };

  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/activate_license_key`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_key_hash: hash, p_device_id: deviceId }),
    });
  } catch {
    return { ok: false, reason: 'network_error' };
  }

  if (!res.ok) return { ok: false, reason: 'network_error' };

  const result = JSON.parse(await res.text());
  if (result.status === 'ok') return { ok: true, expiresAt: result.expires_at };
  if (result.status === 'already_used') return { ok: false, reason: 'already_used' };
  return { ok: false, reason: 'invalid' };
}

module.exports = {
  normalizeKey,
  hashKey,
  activateKeyOnline,
  trialDaysRemaining,
  isTrialActive,
  isLicenseActive,
  TRIAL_DAYS,
};
