'use strict';

const dgram = require('dgram');
const EventEmitter = require('events');
const { parseQuestion, buildNxDomainResponse } = require('./dnsMessage');

const DNS_PORT = 53;
const LISTEN_ADDRESS = '127.0.0.1';
const DEFAULT_UPSTREAM = '1.1.1.1';
const UPSTREAM_TIMEOUT_MS = 4000;

/**
 * A local DNS resolver that answers NXDOMAIN for blocklisted domains and
 * forwards everything else to a real upstream resolver. Windows' system DNS is
 * pointed at 127.0.0.1 (see systemDns.js), so every app and browser on the
 * machine resolves through here — the desktop equivalent of the Android
 * BlockVpnService.
 *
 * Binding port 53 requires administrator rights; start() rejects with a clear
 * EACCES/EADDRINUSE error otherwise so the UI can explain what to do.
 *
 * Emits: 'blocked' ({ domain }), 'error' (Error), 'listening'
 */
class DnsProxy extends EventEmitter {
  constructor({ blocklist, upstream = DEFAULT_UPSTREAM, upstreamPort = DNS_PORT, listenPort = DNS_PORT }) {
    super();
    this.blocklist = blocklist;
    this.upstream = upstream;
    this.upstreamPort = upstreamPort;
    this.listenPort = listenPort;
    this.server = null;
    this.upstreamSocket = null;
    this.pending = new Map(); // our outbound id -> { clientId, rinfo, timer }
    this.nextOutboundId = 1;
    this.stats = { queries: 0, blocked: 0, forwarded: 0, failed: 0 };
  }

  /** Swap in a new blocklist without dropping the socket, so edits apply live. */
  setBlocklist(blocklist) {
    this.blocklist = blocklist;
  }

  get isRunning() {
    return this.server !== null;
  }

  start() {
    if (this.server) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.upstreamSocket = dgram.createSocket('udp4');
      this.upstreamSocket.on('message', (msg) => this._onUpstreamReply(msg));
      this.upstreamSocket.on('error', (err) => this.emit('error', err));

      const server = dgram.createSocket('udp4');
      server.on('message', (msg, rinfo) => this._onClientQuery(msg, rinfo));
      server.on('error', (err) => {
        // Surface bind failures to the caller rather than as a stray event.
        if (!this.server) {
          this._teardown();
          reject(err);
          return;
        }
        this.emit('error', err);
      });
      server.on('listening', () => {
        this.server = server;
        this.emit('listening');
        resolve();
      });

      server.bind(this.listenPort, LISTEN_ADDRESS);
    });
  }

  async stop() {
    this._teardown();
  }

  _teardown() {
    for (const entry of this.pending.values()) clearTimeout(entry.timer);
    this.pending.clear();
    if (this.server) {
      try {
        this.server.close();
      } catch (_) {
        /* already closed */
      }
      this.server = null;
    }
    if (this.upstreamSocket) {
      try {
        this.upstreamSocket.close();
      } catch (_) {
        /* already closed */
      }
      this.upstreamSocket = null;
    }
  }

  _onClientQuery(msg, rinfo) {
    this.stats.queries += 1;
    const parsed = parseQuestion(msg);

    if (parsed && this.blocklist.isBlocked(parsed.question)) {
      this.stats.blocked += 1;
      this.emit('blocked', { domain: parsed.question });
      const reply = buildNxDomainResponse(msg, parsed);
      this.server.send(reply, rinfo.port, rinfo.address);
      return;
    }

    this._forward(msg, rinfo);
  }

  /**
   * Forwards upstream under our own transaction id and maps the reply back to
   * the client's id — two clients can legitimately pick the same id, so
   * reusing theirs on a shared upstream socket would cross the wires.
   */
  _forward(msg, rinfo) {
    if (!this.upstreamSocket) return;

    const clientId = msg.length >= 2 ? msg.readUInt16BE(0) : 0;
    const outboundId = this.nextOutboundId;
    this.nextOutboundId = (this.nextOutboundId + 1) & 0xffff || 1;

    const outbound = Buffer.from(msg);
    outbound.writeUInt16BE(outboundId, 0);

    const timer = setTimeout(() => {
      this.pending.delete(outboundId);
      this.stats.failed += 1;
    }, UPSTREAM_TIMEOUT_MS);

    this.pending.set(outboundId, { clientId, rinfo, timer });
    this.upstreamSocket.send(outbound, this.upstreamPort, this.upstream, (err) => {
      if (err) {
        clearTimeout(timer);
        this.pending.delete(outboundId);
        this.stats.failed += 1;
        this.emit('error', err);
      }
    });
  }

  _onUpstreamReply(msg) {
    if (msg.length < 2 || !this.server) return;
    const outboundId = msg.readUInt16BE(0);
    const entry = this.pending.get(outboundId);
    if (!entry) return; // late reply after timeout, or not ours

    this.pending.delete(outboundId);
    clearTimeout(entry.timer);

    const reply = Buffer.from(msg);
    reply.writeUInt16BE(entry.clientId, 0);
    this.stats.forwarded += 1;
    this.server.send(reply, entry.rinfo.port, entry.rinfo.address);
  }
}

module.exports = { DnsProxy, DNS_PORT, LISTEN_ADDRESS };
