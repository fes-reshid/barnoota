'use strict';

const { buildService, isInstalled } = require('./install');

/**
 * Fully removes the Windows service registration: stops it, then deletes the
 * WinSW-generated wrapper/config. Must be called from a process OTHER than
 * the service itself — node-windows' uninstall() stops the service first,
 * which would kill an in-process caller before it could run the rest of the
 * sequence. The Electron GUI (already elevated) is the intended caller; see
 * src/main/serviceClient.js.
 */
function uninstall() {
  return new Promise((resolve, reject) => {
    if (!isInstalled()) {
      resolve();
      return;
    }

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

    svc.once('uninstall', () => settle(resolve, undefined));
    svc.once('alreadyuninstalled', () => settle(resolve, undefined));
    svc.once('error', (err) => settle(reject, err));

    try {
      svc.uninstall();
    } catch (err) {
      settle(reject, err);
    }

    // node-windows' own uninstall() has no timeout of its own; bound it here
    // so a stuck NET STOP can't hang the caller indefinitely.
    setTimeout(() => settle(reject, new Error('Timed out uninstalling the protection service.')), 20000);
  });
}

module.exports = { uninstall };
