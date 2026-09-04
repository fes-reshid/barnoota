'use strict';

const { execSync, spawn } = require('child_process');

/**
 * `net session` only succeeds for an elevated process — no admin-only
 * Windows API is simpler to shell out to for a yes/no answer.
 */
function isElevated() {
  if (process.platform !== 'win32') return true;
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Re-launches this same executable with a UAC prompt, then leaves quitting
 * the current (unelevated) instance to the caller. Uses PowerShell's
 * Start-Process -Verb RunAs because Electron has no built-in "relaunch
 * elevated" — app.relaunch() re-execs without asking for elevation at all.
 */
function relaunchElevated() {
  const exe = process.execPath;
  const args = process.argv.slice(1);
  const argList = args.length
    ? `-ArgumentList ${args.map((a) => `'${String(a).replace(/'/g, "''")}'`).join(',')}`
    : '';
  const command = `Start-Process -FilePath '${exe.replace(/'/g, "''")}' ${argList} -Verb RunAs`;
  spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'hidden', '-Command', command], {
    detached: true,
    stdio: 'ignore',
  }).unref();
}

module.exports = { isElevated, relaunchElevated };
