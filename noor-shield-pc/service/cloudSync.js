'use strict';

const crypto = require('crypto');
const { exec } = require('child_process');
const { isValidSchedule } = require('../src/main/schedule');

/**
 * Remote control: lets a parent enforce bedtime or (later) other commands
 * from a web dashboard, without the PC ever holding a real login of its
 * own. See cloud/schema.sql for the full design rationale and the exact
 * database functions this calls.
 *
 * This PC never authenticates as a Supabase user — it only ever proves it
 * holds `deviceSecret`, a long random token it generated for itself at
 * pairing time and that only this PC and the paired Supabase project know.
 * SUPABASE_URL/SUPABASE_ANON_KEY (see supabaseConfig.js) are safe to ship in
 * the app: they identify *which* Supabase project to talk to and grant only the same
 * access any anonymous visitor to the pairing page would have — real access
 * control lives in the database functions (SECURITY DEFINER, checking
 * deviceSecret) and in Row Level Security for the parent's logged-in side,
 * not in keeping this key secret.
 *
 * Five commands are implemented end-to-end: enforce_sleep_now,
 * cancel_sleep_now, lock_computer, unlock_computer, set_schedule.
 * `shutdown` exists in the database schema for later but is intentionally
 * left unimplemented here — proving the lower-stakes command pipe works
 * first, before wiring up anything that can't be undone by just reopening
 * the app.
 *
 * Also syncs one more thing besides commands: `device_domains`, sites the
 * parent added for this specific PC from the web dashboard. Polled on the
 * same interval and folded into the local blocklist (see buildBlocklist()
 * in handlers.js) — separate from, and in addition to, whatever the parent
 * has added from the app itself.
 */

const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./supabaseConfig');

const PAIRING_POLL_MS = 4_000;
const PAIRING_TIMEOUT_MS = 10 * 60 * 1000; // matches schema.sql's pairing_codes.expires_at
const COMMAND_POLL_MS = 20_000;
const DEFAULT_SLEEP_HOURS = 8; // used when enforce_sleep_now's payload doesn't specify a duration

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

/**
 * Locks the Windows session immediately — the same effect as Win+L. On its
 * own this only slows a child down for as long as it takes to type their
 * own account's password back in, so lock_computer also sets
 * remoteLockActive (see applyCommand below), which is what actually keeps
 * them out afterwards: the GUI shows a full-screen "ask your parent"
 * overlay for as long as that stays set, regardless of whose Windows
 * session is active.
 */
function lockComputer() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve('failed');
      return;
    }
    exec('rundll32.exe user32.dll,LockWorkStation', (err) => resolve(err ? 'failed' : 'done'));
  });
}

// The overlay only exists inside the Windows session that was running when
// the lock happened — Ctrl+Alt+Del → "Switch User" opens a completely
// different session with no overlay in it at all, since Fast User
// Switching keeps the locked session running in the background rather than
// ending it. Hiding that option (the same registry key Group Policy's
// "Hide entry points for Fast User Switching" sets) while locked closes
// that specific hole; it doesn't touch normal sign-out/sign-in, which ends
// the session and re-evaluates the lock from scratch on next login anyway.
function setFastUserSwitchingBlocked(blocked) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve();
      return;
    }
    const key = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System';
    const cmd = blocked
      ? `reg add "${key}" /v HideFastUserSwitching /t REG_DWORD /d 1 /f`
      : `reg delete "${key}" /v HideFastUserSwitching /f`;
    exec(cmd, (err) => {
      // "delete" on a value that's already gone errors too — not worth
      // surfacing as a real failure either way, just log for troubleshooting.
      if (err) console.error(`[cloudSync] could not ${blocked ? 'hide' : 'restore'} Switch User: ${err.message}`);
      resolve();
    });
  });
}

/** The one place remoteLockActive is ever written, so the Switch User block always tracks it. */
function setRemoteLockActive(store, active) {
  store.set('remoteLockActive', active);
  return setFastUserSwitchingBlocked(active);
}

async function applyCommand(store, command) {
  if (command.kind === 'enforce_sleep_now') {
    const hours = Number(command.payload && command.payload.hours) || DEFAULT_SLEEP_HOURS;
    store.set('forceSleepUntil', Date.now() + hours * 60 * 60 * 1000);
    return 'done';
  }
  if (command.kind === 'cancel_sleep_now') {
    store.set('forceSleepUntil', null);
    return 'done';
  }
  if (command.kind === 'lock_computer') {
    await setRemoteLockActive(store, true);
    return lockComputer();
  }
  if (command.kind === 'unlock_computer') {
    await setRemoteLockActive(store, false);
    return 'done';
  }
  if (command.kind === 'set_schedule') {
    if (!isValidSchedule(command.payload)) return 'failed';
    const { enabled, days, startTime, endTime } = command.payload;
    store.set('schedule', { enabled: Boolean(enabled), days, startTime, endTime });
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
 * One poll cycle: fetch the parent's current site list for this device (if
 * paired) and store it wholesale, replacing whatever was there before.
 * Always the full list rather than a diff — see the function's own comment
 * in schema.sql for why that's what makes removal work with no extra
 * plumbing. `onChange`, when given, runs after the store update so the
 * caller can push the new list into the live blocklist immediately instead
 * of waiting for something else to trigger a rebuild.
 */
async function pollDeviceDomainsOnce(store, onChange) {
  const cloud = store.get('cloud') || {};
  if (!cloud.deviceId || !cloud.deviceSecret) return;

  let domains;
  try {
    domains = await callRpc('get_device_domains', {
      p_device_id: cloud.deviceId,
      p_device_secret: cloud.deviceSecret,
    });
  } catch (err) {
    console.error(`[cloudSync] could not fetch parent-added sites: ${err.message}`);
    return;
  }

  store.set('cloudBlockedDomains', domains || []);
  if (onChange) onChange();
}

/**
 * Starts the background loops: while a pairing code is pending, polls
 * quickly for it being claimed; once paired, polls (more slowly) for
 * commands and the parent's site list. All fire-and-forget interval timers,
 * `.unref()`'d so they never keep the process alive on their own — matching
 * the feed-refresh timer pattern already used in filterService.js.
 *
 * `onBlocklistChange`, if given, is called whenever the synced site list
 * changes so the live DNS proxy's blocklist gets rebuilt right away instead
 * of waiting up to COMMAND_POLL_MS for something else to trigger it.
 */
function start(store, { onBlocklistChange } = {}) {
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

  const domainsTimer = setInterval(() => {
    pollDeviceDomainsOnce(store, onBlocklistChange).catch((err) =>
      console.error(`[cloudSync] site sync failed: ${err.message}`)
    );
  }, COMMAND_POLL_MS);
  domainsTimer.unref();
  // Also run once immediately, so a PC that was already paired before this
  // restart doesn't wait a full interval to pick up sites added meanwhile.
  pollDeviceDomainsOnce(store, onBlocklistChange).catch((err) =>
    console.error(`[cloudSync] initial site sync failed: ${err.message}`)
  );
}

module.exports = {
  start,
  startPairing,
  cancelPairing,
  checkPairingClaimed,
  unpair,
  isForceSleepActive,
  setRemoteLockActive,
  pollCommandsOnce, // exported for tests
  pollDeviceDomainsOnce, // exported for tests
};
