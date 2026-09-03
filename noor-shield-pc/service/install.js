'use strict';

const path = require('path');
const { DISPLAY_NAME, DESCRIPTION } = require('./serviceName');

/**
 * Registers filterService.js as a Windows service using node-windows (which
 * wraps WinSW under the hood). Must be run elevated — node-windows throws
 * synchronously if it isn't (see its `execute()` / PermError).
 *
 * Config choices and why:
 *   - No `logOnAs`: node-windows omits the <serviceaccount> block entirely
 *     when it's absent, which makes Windows default the service to the
 *     LocalSystem account — exactly what's needed to change system-wide DNS
 *     settings without a signed-in user.
 *   - `stopparentfirst: 'yes'` + `stoptimeout`: makes the WinSW wrapper send
 *     our script a 'shutdown' IPC message and wait before killing it, so
 *     filterService.js gets a real chance to restore DNS on stop instead of
 *     being killed mid-write.
 *   - `wait`/`grow`/`maxRestarts`/`maxRetries`: auto-restart-on-crash
 *     backoff. This is a meaningful part of "runs always" — a service that
 *     dies once and stays dead isn't one.
 */
function buildService() {
  if (process.platform !== 'win32') {
    throw new Error('The Noor Shield protection service only runs on Windows.');
  }
  // Required lazily: node-windows' own module touches Windows-only helpers
  // (registry/cmd lookups) at load time that don't exist on other platforms,
  // which would otherwise break `require('./install')` during development
  // or testing on non-Windows machines.
  const { Service } = require('node-windows');

  return new Service({
    name: DISPLAY_NAME,
    description: DESCRIPTION,
    script: path.join(__dirname, 'filterService.js'),
    workingDirectory: path.join(__dirname, '..'),
    nodeOptions: '', // node-windows defaults to the long-removed '--harmony' flag
    wait: 2,
    grow: 0.5,
    maxRestarts: 5,
    maxRetries: 60,
    abortOnError: false,
    stopparentfirst: 'yes',
    stoptimeout: 15,
  });
}

/** True if the service is registered (files exist on disk) — not necessarily running. */
function isInstalled() {
  if (process.platform !== 'win32') return false;
  try {
    return buildService().exists;
  } catch (_) {
    return false;
  }
}

/** Installs the service if needed, then makes sure it's started. Idempotent. */
function install() {
  return new Promise((resolve, reject) => {
    let svc;
    try {
      svc = buildService();
    } catch (err) {
      reject(err);
      return;
    }

    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    if (svc.exists) {
      svc.once('error', (err) => settle(reject, err));
      svc.start();
      // node-windows treats "already started" as a warning, not an emitted
      // event (see daemon.js), so there's nothing further to wait on.
      setTimeout(() => settle(resolve, undefined), 1500);
      return;
    }

    svc.once('invalidinstallation', () =>
      settle(
        reject,
        new Error(
          'A previous Noor Shield service installation looks incomplete. ' +
            'Remove it (see README: Troubleshooting the service) and try again.'
        )
      )
    );
    svc.once('error', (err) => settle(reject, err));
    svc.once('install', () => {
      svc.once('start', () => settle(resolve, undefined));
      svc.start();
      // A slow-but-successful NET START shouldn't hang the caller forever.
      setTimeout(() => settle(resolve, undefined), 6000);
    });

    try {
      svc.install();
    } catch (err) {
      settle(reject, err);
    }
  });
}

module.exports = { install, isInstalled, buildService };
