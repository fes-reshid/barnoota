'use strict';

const path = require('path');
const { connect } = require('../../service/pipeTransport');

/**
 * The Electron main process's connection to the always-on protection
 * service. Every call is a fresh connect-call-close round trip rather than
 * one held-open connection: the service can restart independently of the
 * GUI (a crash, a Windows update, a manual `sc stop`/`sc start`), and a
 * short-lived connection means the next call just reconnects instead of
 * needing its own reconnect/backoff logic.
 */

const CONNECT_TIMEOUT_MS = 3000;

async function call(method, params) {
  let client;
  try {
    client = await connect({ timeoutMs: CONNECT_TIMEOUT_MS });
  } catch (err) {
    return {
      ok: false,
      error: 'The Noor Shield protection service is not running.',
      serviceUnreachable: true,
    };
  }
  try {
    return await client.call(method, params);
  } catch (err) {
    return { ok: false, error: err.message, serviceUnreachable: true };
  } finally {
    client.close();
  }
}

async function isReachable() {
  const result = await call('status.get', {});
  return !result.serviceUnreachable;
}

/**
 * Installs and starts the service if it isn't already reachable. Only
 * meaningful on Windows, and only succeeds if the calling process (the
 * Electron GUI) is itself elevated — which the packaged app is
 * (requestedExecutionLevel: requireAdministrator in package.json).
 */
async function ensureRunning() {
  if (await isReachable()) return { ok: true };
  if (process.platform !== 'win32') {
    return { ok: false, error: 'The filter currently supports Windows only.' };
  }

  try {
    // Lazy require: pulls in node-windows, which touches Windows-only APIs
    // at load time.
    const { install } = require(path.join(__dirname, '..', '..', 'service', 'install'));
    await install();
  } catch (err) {
    return {
      ok: false,
      error:
        `Could not install the protection service: ${err.message}. ` +
        'Make sure Noor Shield is running as Administrator.',
    };
  }

  // The service takes a moment to bind its pipe after NET START returns.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (await isReachable()) return { ok: true };
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return { ok: false, error: 'The protection service was installed but has not responded yet.' };
}

/**
 * Fully removes the service. Split from the RPC's 'service.prepareUninstall'
 * (which verifies the parent password and restores DNS, running inside the
 * service itself) because actually deleting the service has to happen from
 * an external, already-elevated process — see service/uninstall.js.
 */
async function uninstallService() {
  if (process.platform !== 'win32') return { ok: true };
  try {
    const { uninstall } = require(path.join(__dirname, '..', '..', 'service', 'uninstall'));
    await uninstall();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Could not remove the protection service: ${err.message}` };
  }
}

module.exports = { call, isReachable, ensureRunning, uninstallService };
