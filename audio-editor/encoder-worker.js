// Background encoder for the audio editor: MP3 (lamejs) and FLAC, so long files
// don't freeze the page. Messages: { id, kind: 'mp3' | 'flac', ch: [Float32Array], sr, kbps?, tags? }.
'use strict';

let lameLoaded = false;
function toInt16(c, a, b) {
  const r = new Int16Array(b - a);
  for (let i = a; i < b; i++) { let v = c[i]; v = v < -1 ? -1 : v > 1 ? 1 : v; r[i - a] = v < 0 ? v * 0x8000 : v * 0x7fff; }
  return r;
}

function encodeMp3(id, ch, sr, kbps) {
  if (!lameLoaded) { importScripts('lame.min.js'); lameLoaded = true; }
  const enc = new lamejs.Mp3Encoder(ch.length, sr, kbps || 192);
  const n = ch[0].length, BLOCK = 1152 * 64, parts = [];
  let last = 0;
  for (let a = 0; a < n; a += BLOCK) {
    const b = Math.min(n, a + BLOCK);
    const l = toInt16(ch[0], a, b), r = ch.length > 1 ? toInt16(ch[1], a, b) : null;
    const d = r ? enc.encodeBuffer(l, r) : enc.encodeBuffer(l);
    if (d.length) parts.push(new Uint8Array(d));
    const p = Math.floor(b / n * 20);
    if (p !== last) { last = p; postMessage({ id, progress: b / n }); }
  }
  const tail = enc.flush();
  if (tail.length) parts.push(new Uint8Array(tail));
  return concat(parts);
}

function concat(parts) {
  const out = new Uint8Array(parts.reduce((t, p) => t + p.length, 0));
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

// ---------- FLAC (16-bit, fixed predictors + partitioned Rice coding) ----------
class BitWriter {
  constructor(cap) { this.buf = new Uint8Array(cap); this.pos = 0; this.acc = 0; this.n = 0; }
  grow(k) { if (this.pos + k > this.buf.length) { const b = new Uint8Array(Math.max(this.buf.length * 2, this.pos + k + 4096)); b.set(this.buf); this.buf = b; } }
  bits(v, n) { // write the low n bits of v (n ≤ 32), most significant first
    while (n > 0) {
      const take = Math.min(n, 8 - this.n), shift = n - take;
      this.acc = (this.acc << take) | ((v >>> shift) & ((1 << take) - 1));
      this.n += take; n -= take;
      if (this.n === 8) { this.grow(1); this.buf[this.pos++] = this.acc; this.acc = 0; this.n = 0; }
    }
  }
  zeros(q) { while (q > 24) { this.bits(0, 24); q -= 24; } if (q) this.bits(0, q); }
  align() { if (this.n) this.bits(0, 8 - this.n); }
  bytes() { return this.buf.subarray(0, this.pos); }
}
const CRC8 = new Uint8Array(256), CRC16 = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
  let c = i; for (let k = 0; k < 8; k++) c = c & 0x80 ? ((c << 1) ^ 0x07) & 0xff : (c << 1) & 0xff; CRC8[i] = c;
  let d = i << 8; for (let k = 0; k < 8; k++) d = d & 0x8000 ? ((d << 1) ^ 0x8005) & 0xffff : (d << 1) & 0xffff; CRC16[i] = d;
}
const crc8 = (b, a, e) => { let c = 0; for (let i = a; i < e; i++) c = CRC8[c ^ b[i]]; return c; };
const crc16 = (b, a, e) => { let c = 0; for (let i = a; i < e; i++) c = ((c << 8) ^ CRC16[(c >> 8) ^ b[i]]) & 0xffff; return c; };

function residual(x, order) {
  const n = x.length, e = new Int32Array(n - order);
  for (let i = order; i < n; i++) {
    const v = order === 0 ? x[i] : order === 1 ? x[i] - x[i - 1] : order === 2 ? x[i] - 2 * x[i - 1] + x[i - 2]
      : order === 3 ? x[i] - 3 * x[i - 1] + 3 * x[i - 2] - x[i - 3] : x[i] - 4 * x[i - 1] + 6 * x[i - 2] - 4 * x[i - 3] + x[i - 4];
    e[i - order] = v;
  }
  return e;
}
// Best Rice parameter for zig-zagged values u[a..b), and its cost in bits.
function riceBest(u, a, b) {
  let best = Infinity, bk = 0;
  for (let k = 0; k <= 14; k++) {
    let bits = (b - a) * (k + 1);
    for (let i = a; i < b; i++) bits += u[i] >>> k;
    if (bits < best) { best = bits; bk = k; }
  }
  return [bk, best];
}
function writeSubframe(bw, x) {
  const n = x.length;
  let constant = true; for (let i = 1; i < n; i++) if (x[i] !== x[0]) { constant = false; break; }
  if (constant) { bw.bits(0, 1); bw.bits(0, 6); bw.bits(0, 1); bw.bits(x[0] & 0xffff, 16); return; }
  // Pick the fixed predictor order (0–4) with the smallest residual.
  let order = 0, bestSum = Infinity, e = null;
  for (let o = 0; o <= Math.min(4, n - 1); o++) {
    const r = residual(x, o); let s = 0; for (let i = 4 - o; i < r.length; i++) s += Math.abs(r[i]);
    if (s < bestSum) { bestSum = s; order = o; e = r; }
  }
  const u = new Uint32Array(e.length); for (let i = 0; i < e.length; i++) u[i] = e[i] >= 0 ? e[i] * 2 : -e[i] * 2 - 1;
  // Pick the partition order (0–6) with the fewest bits.
  let bestPo = 0, bestBits = Infinity, bestKs = null;
  for (let po = 0; po <= 6; po++) {
    const parts = 1 << po; if (n % parts || (n >> po) <= order) break;
    const ks = []; let bits = 0;
    for (let p = 0; p < parts; p++) {
      const a = p === 0 ? 0 : p * (n >> po) - order, b = (p + 1) * (n >> po) - order;
      const [k, c] = riceBest(u, a, b); ks.push(k); bits += c + 4;
    }
    if (bits < bestBits) { bestBits = bits; bestPo = po; bestKs = ks; }
  }
  bw.bits(0, 1); bw.bits(0b001000 | order, 6); bw.bits(0, 1);
  for (let i = 0; i < order; i++) bw.bits(x[i] & 0xffff, 16);
  bw.bits(0, 2); bw.bits(bestPo, 4);
  const parts = 1 << bestPo;
  for (let p = 0; p < parts; p++) {
    const a = p === 0 ? 0 : p * (n >> bestPo) - order, b = (p + 1) * (n >> bestPo) - order, k = bestKs[p];
    bw.bits(k, 4);
    for (let i = a; i < b; i++) { bw.zeros(u[i] >>> k); bw.bits(1, 1); if (k) bw.bits(u[i] & ((1 << k) - 1), k); }
  }
}
function utf8Num(bw, v) { // FLAC's UTF-8-style frame number
  if (v < 0x80) { bw.bits(v, 8); return; }
  let bytes = v < 0x800 ? 2 : v < 0x10000 ? 3 : v < 0x200000 ? 4 : v < 0x4000000 ? 5 : 6;
  const lead = (0xff00 >> bytes) & 0xff;
  bw.bits(lead | (v >>> (6 * (bytes - 1))), 8);
  for (let i = bytes - 2; i >= 0; i--) bw.bits(0x80 | ((v >>> (6 * i)) & 0x3f), 8);
}
function vorbisComment(tags) {
  const enc = new TextEncoder(), vendor = enc.encode('Diin Islaam audio editor'), items = [];
  const map = { title: 'TITLE', artist: 'ARTIST', album: 'ALBUM', year: 'DATE', genre: 'GENRE', comment: 'COMMENT' };
  for (const k in map) if (tags && tags[k]) items.push(enc.encode(map[k] + '=' + tags[k]));
  const len = 8 + vendor.length + items.reduce((t, i) => t + 4 + i.length, 0), out = new Uint8Array(len), dv = new DataView(out.buffer);
  let o = 0; dv.setUint32(o, vendor.length, true); o += 4; out.set(vendor, o); o += vendor.length;
  dv.setUint32(o, items.length, true); o += 4;
  for (const i of items) { dv.setUint32(o, i.length, true); o += 4; out.set(i, o); o += i.length; }
  return out;
}
function pictureBlock(cover) {
  const enc = new TextEncoder(), mime = enc.encode(cover.mime || 'image/jpeg'), data = cover.data;
  const out = new Uint8Array(32 + mime.length + data.length), dv = new DataView(out.buffer);
  let o = 0; dv.setUint32(o, 3); o += 4; dv.setUint32(o, mime.length); o += 4; out.set(mime, o); o += mime.length;
  dv.setUint32(o, 0); o += 4; o += 16; // description length 0; width, height, depth, colours unknown
  dv.setUint32(o, data.length); o += 4; out.set(data, o);
  return out;
}
function encodeFlac(id, ch, sr, tags) {
  const nch = ch.length, n = ch[0].length, BS = 4096;
  const ints = ch.map(c => { const r = new Int32Array(n); for (let i = 0; i < n; i++) { let v = c[i]; v = v < -1 ? -1 : v > 1 ? 1 : v; r[i] = Math.round(v < 0 ? v * 32768 : v * 32767); } return r; });
  const bw = new BitWriter(Math.max(1024, n * nch));
  bw.bits(0x664c6143, 32); // "fLaC"
  const blocks = [];
  const si = new BitWriter(34);
  si.bits(BS, 16); si.bits(BS, 16); si.bits(0, 24); si.bits(0, 24);
  si.bits(sr, 20); si.bits(nch - 1, 3); si.bits(15, 5);
  si.bits(Math.floor(n / 2 ** 32), 4); si.bits(n >>> 0, 32);
  for (let i = 0; i < 4; i++) si.bits(0, 32); // MD5 unknown
  blocks.push([0, si.bytes()]);
  blocks.push([4, vorbisComment(tags)]);
  if (tags && tags.cover) blocks.push([6, pictureBlock(tags.cover)]);
  blocks.forEach(([type, data], i) => { bw.bits(i === blocks.length - 1 ? 1 : 0, 1); bw.bits(type, 7); bw.bits(data.length, 24); for (const b of data) bw.bits(b, 8); });
  let frame = 0, last = 0;
  for (let a = 0; a < n; a += BS, frame++) {
    const bs = Math.min(BS, n - a), start = bw.pos;
    bw.bits(0xfff8, 16);           // sync + fixed block size
    bw.bits(0b0111, 4);            // block size: 16-bit value at the end of the header
    bw.bits(0b0000, 4);            // sample rate: from STREAMINFO
    bw.bits(nch - 1, 4);           // independent channels
    bw.bits(0b100, 3); bw.bits(0, 1); // 16 bits per sample
    utf8Num(bw, frame);
    bw.bits(bs - 1, 16);
    bw.bits(crc8(bw.buf, start, bw.pos), 8);
    for (const c of ints) writeSubframe(bw, c.subarray(a, a + bs));
    bw.align();
    bw.bits(crc16(bw.buf, start, bw.pos), 16);
    const p = Math.floor((a + bs) / n * 20);
    if (p !== last) { last = p; postMessage({ id, progress: (a + bs) / n }); }
  }
  return bw.bytes().slice();
}

self.onmessage = e => {
  const { id, kind, ch, sr, kbps, tags } = e.data;
  try {
    const out = kind === 'mp3' ? encodeMp3(id, ch, sr, kbps) : encodeFlac(id, ch, sr, tags);
    postMessage({ id, out }, [out.buffer]);
  } catch (err) { postMessage({ id, error: String(err && err.message || err) }); }
};
