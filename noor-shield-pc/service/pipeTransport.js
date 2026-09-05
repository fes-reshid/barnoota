'use strict';

const net = require('net');
const os = require('os');
const path = require('path');

/**
 * Local RPC between the always-on Windows service (the actual enforcer —
 * DNS proxy, system DNS, parent password) and the Electron GUI (a thin
 * control panel). Framing: newline-delimited JSON, `{ id, method, params }`
 * requests answered by `{ id, ...result }` responses. Nothing here crosses a
 * network boundary — it's local IPC standing in for what a single process
 * used to do, now split so the GUI can close without stopping protection.
 *
 * On Windows this binds a named pipe, which works across the session
 * boundary a LocalSystem service runs in — the GUI runs as the logged-in
 * user, the service does not, and a plain TCP loopback socket would work
 * too, but a named pipe needs no port and can't collide with anything else
 * on the machine. Everywhere else (this repo's Linux dev/test environment)
 * it falls back to a Unix domain socket so the same code path is testable
 * without Windows at all.
 */

const PIPE_NAME = 'NoorShieldControl';

function transportPath() {
  if (process.platform === 'win32') return `\\\\.\\pipe\\${PIPE_NAME}`;
  return path.join(os.tmpdir(), `${PIPE_NAME}.sock`);
}

/**
 * Starts listening. `onRequest(method, params)` should return a plain
 * object (or a Promise of one) to send back; throwing sends `{ error }`.
 */
function createServer(onRequest) {
  const server = net.createServer((socket) => {
    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let newlineIndex;
      // eslint-disable-next-line no-cond-assign
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.trim().length === 0) continue;
        handleLine(socket, line, onRequest);
      }
    });
    socket.on('error', () => {
      /* a client disconnecting mid-write is not our problem */
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    const target = transportPath();
    // A stale Unix socket file from a crashed previous run blocks re-binding;
    // named pipes on Windows don't have this problem (no filesystem entry).
    if (process.platform !== 'win32') {
      try {
        require('fs').unlinkSync(target);
      } catch (_) {
        /* nothing to clean up */
      }
    }
    server.listen(target, () => {
      server.removeListener('error', reject);
      resolve(server);
    });
  });
}

async function handleLine(socket, line, onRequest) {
  let message;
  try {
    message = JSON.parse(line);
  } catch (err) {
    return; // not our protocol; ignore rather than crash the connection
  }

  const { id, method, params } = message;
  let payload;
  try {
    payload = await onRequest(method, params || {});
  } catch (err) {
    payload = { ok: false, error: err.message || String(err) };
  }
  try {
    socket.write(`${JSON.stringify({ id, ...payload })}\n`);
  } catch (_) {
    /* socket already gone */
  }
}

/**
 * Connects as a client. `call(method, params)` returns a Promise of the
 * response body. `close()` ends the connection.
 *
 * `timeoutMs` only bounds the initial connect (the pipe either exists and
 * accepts immediately, or it doesn't — a local IPC handshake has no reason
 * to be slow). Waiting for a *reply* is a separate, much larger budget:
 * some methods (filter.enable/disable in particular) run several sequential
 * PowerShell invocations against real network adapters, each of which can
 * easily take a second or more on real hardware, so reusing the connect
 * timeout there caused genuine successes to be reported as failures to the
 * GUI while the backend kept working anyway.
 */
function connect({ timeoutMs = 3000, callTimeoutMs = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(transportPath());
    const pending = new Map();
    let nextId = 1;
    let buffer = '';
    let settled = false;

    const failAll = (err) => {
      for (const { reject: rej } of pending.values()) rej(err);
      pending.clear();
    };

    const connectTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(new Error('Could not reach the Noor Shield protection service.'));
      }
    }, timeoutMs);

    socket.on('connect', () => {
      settled = true;
      clearTimeout(connectTimer);
      resolve({
        call(method, params) {
          return new Promise((res, rej) => {
            const id = nextId;
            nextId += 1;
            const callTimer = setTimeout(() => {
              pending.delete(id);
              rej(new Error(`Timed out waiting for a reply to "${method}".`));
            }, callTimeoutMs);
            pending.set(id, {
              resolve: (value) => {
                clearTimeout(callTimer);
                res(value);
              },
              reject: (err) => {
                clearTimeout(callTimer);
                rej(err);
              },
            });
            socket.write(`${JSON.stringify({ id, method, params: params || {} })}\n`);
          });
        },
        close() {
          socket.end();
        },
      });
    });

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let newlineIndex;
      // eslint-disable-next-line no-cond-assign
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.trim().length === 0) continue;
        let message;
        try {
          message = JSON.parse(line);
        } catch (_) {
          continue;
        }
        const entry = pending.get(message.id);
        if (entry) {
          pending.delete(message.id);
          const { id, ...rest } = message;
          entry.resolve(rest);
        }
      }
    });

    socket.on('error', (err) => {
      clearTimeout(connectTimer);
      if (!settled) {
        settled = true;
        reject(err);
      } else {
        failAll(err);
      }
    });

    socket.on('close', () => {
      failAll(new Error('Connection to the protection service was closed.'));
    });
  });
}

module.exports = { createServer, connect, transportPath, PIPE_NAME };
