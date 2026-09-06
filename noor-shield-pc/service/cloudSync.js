'use strict';

const crypto = require('crypto');

/**
 * Remote control: lets a parent enforce bedtime or (later) other commands
 * from a web dashboard, without the PC ever holding a real login of its
 * own. See cloud/schema.sql for the full design rationale and the exact
 * database functions this calls.
 *
 * This PC never authenticates as a Supabase user — it only ever proves it
 * holds `deviceSecret`, a long random token it generated for itself at
 * pairing time and that only this PC and the paired Supabase project know.
 * SUPABASE_URL/SUPABASE_ANON_KEY below are safe to ship in the app: they
 * identify *which* Supabase project to talk to and grant only the same
 * access any anonymous visitor to the pairing page would have — real access
 * control lives in the database functions (SECURITY DEFINER, checking
 * deviceSecret) and in Row Level Security for the parent's logged-in side,
 * not in keeping this key secret.
 *
 * Deliberately minimal for now: only two commands are implemented
 * end-to-end (enforce_sleep_now, cancel_sleep_now). `shutdown` exists in
 * the database schema for later but is intentionally left unimplemented
 * here — proving the lower-stakes command pipe works first, before wiring
 * up anything that can't be undone by just reopening the app.
 */

const SUPABASE_URL = 'https://wjqxbjcmcrjgxnxcowxp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_J-N2ozRX6Rnk1-MI66ORGg_QXG3zJhV';

const PAIRING_POLL_MS = 4_000;
const PAIRING_TIMEOUT_MS = 10 * 60 * 1000; // matches schema.sql's pairing_codes.expires_at
const COMMAND_POLL_MS = 20_000;
const FORCE_SLEEP_DURATION_MS = 8 * 60 * 60 * 1000; // "enforce sleep now" lasts 8 hours

async function callRpc(fnName, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${fnName} failed: ${res.status} ${text}`.trim());
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function generateDeviceSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function generatePairingCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Starts a new pairing attempt: generates (or reuses) this PC's device
 * secret, picks a fresh 6-digit code, registers it with Supabase, and
 * returns the code to show the parent. Safe to call again before the
 * previous code is claimed — it simply replaces the pending code.
 */
async function startPairing(store) {
  const cloud = store.get('cloud') || {};
  const deviceSecret = cloud.deviceSecret || generateDeviceSecret();
  const code = generatePairingCode();

  await callRpc('start_pairing', {
    p_code: code,
    p_device_secret: deviceSecret,
    p_device_name: require('os').hostname() || 'Family PC',
  });

  store.set('cloud', {
    ...cloud,
    deviceSecret,
    pendingPairing: { code, startedAt: Date.now() },
  });

  return { code };
}

function cancelPairing(store) {
  const cloud = store.get('cloud') || {};
  store.set('cloud', { ...cloud, pendingPairing: null });
}

/** One-shot check: has the parent claimed the pending code yet? */
async function checkPairingClaimed(store) {
  const cloud = store.get('cloud') || {};
  const pending = cloud.pendingPairing;
  if (!pending || !cloud.deviceSecret) return false;

  if (Date.now() - pending.startedAt > PAIRING_TIMEOUT_MS) {
    store.set('cloud', { ...cloud, pendingPairing: null });
    return false;
  }

  const deviceId = await callRpc('poll_pairing', {
    p_code: pending.code,
    p_device_secret: cloud.deviceSecret,
  });

  if (!deviceId) return false;

  store.set('cloud', { ...cloud, deviceId, pendingPairing: null });
  return true;
}

function unpair(store) {
  store.set('cloud', { deviceId: null, deviceSecret: null, pendingPairing: null });
  store.set('forceSleepUntil', null);
}

function isForceSleepActive(store) {
  const until = store.get('forceSleepUntil');
  return typeof until === 'number' && until > Date.now();
}

async function applyCommand(store, command) {
  if (command.kind === 'enforce_sleep_now') {
    store.set('forceSleepUntil', Date.now() + FORCE_SLEEP_DURATION_MS);
    return 'done';
  }
  if (command.kind === 'cancel_sleep_now') {
    store.set('forceSleepUntil', null);
    return 'done';
  }
  // 'shutdown' and anything else: not implemented yet, on purpose (see
  // module comment). Marking it failed rather than leaving it pending
  // forever lets the dashboard show an honest state instead of hanging.
  console.error(`[cloudSync] command kind "${command.kind}" is not implemented yet`);
  return 'failed';
}

/** One poll cycle: fetch pending commands (if paired) and apply each. */
async function pollCommandsOnce(store) {
  const cloud = store.get('cloud') || {};
  if (!cloud.deviceId || !cloud.deviceSecret) return;

  let commands;
  try {
    commands = await callRpc('get_pending_commands', {
      p_device_id: cloud.deviceId,
      p_device_secret: cloud.deviceSecret,
    });
  } catch (err) {
    console.error(`[cloudSync] could not fetch commands: ${err.message}`);
    return;
  }

  for (const command of commands || []) {
    const status = await applyCommand(store, command).catch((err) => {
      console.error(`[cloudSync] applying command ${command.id} failed: ${err.message}`);
      return 'failed';
    });
    try {
      await callRpc('complete_command', {
        p_device_id: cloud.deviceId,
        p_device_secret: cloud.deviceSecret,
        p_command_id: command.id,
        p_status: status,
      });
    } catch (err) {
      console.error(`[cloudSync] could not report command ${command.id} status: ${err.message}`);
    }
  }
}

/**
 * Starts the background loops: while a pairing code is pending, polls
 * quickly for it being claimed; once paired, polls (more slowly) for
 * commands. Both are fire-and-forget interval timers, `.unref()`'d so they
 * never keep the process alive on their own — matching the feed-refresh
 * timer pattern already used in filterService.js.
 */
function start(store) {
  const pairingTimer = setInterval(() => {
    const cloud = store.get('cloud') || {};
    if (!cloud.pendingPairing) return;
    checkPairingClaimed(store).catch((err) => console.error(`[cloudSync] pairing check failed: ${err.message}`));
  }, PAIRING_POLL_MS);
  pairingTimer.unref();

  const commandTimer = setInterval(() => {
    pollCommandsOnce(store).catch((err) => console.error(`[cloudSync] command poll failed: ${err.message}`));
  }, COMMAND_POLL_MS);
  commandTimer.unref();
}

module.exports = {
  start,
  startPairing,
  cancelPairing,
  checkPairingClaimed,
  unpair,
  isForceSleepActive,
  pollCommandsOnce, // exported for tests
};
