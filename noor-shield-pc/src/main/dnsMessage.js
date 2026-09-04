'use strict';

/**
 * Minimal DNS message parsing/building — just enough to read the queried
 * hostname out of a UDP DNS request and to synthesize an NXDOMAIN reply.
 * Deliberately mirrors the Android app's DnsMessage.kt so both platforms
 * behave identically for the same query. Not a general-purpose DNS library.
 */

/** Reads the first question's QNAME from a raw DNS packet. Returns null if unparseable. */
function parseQuestion(buf) {
  if (buf.length < 12) return null;
  const id = buf.readUInt16BE(0);
  const qdCount = buf.readUInt16BE(4);
  if (qdCount < 1) return null;

  let pos = 12;
  const labels = [];
  while (pos < buf.length) {
    const len = buf[pos];
    if (len === 0) {
      pos += 1;
      break;
    }
    // A compression pointer has no business appearing in a question section.
    if ((len & 0xc0) !== 0) return null;
    pos += 1;
    if (pos + len > buf.length) return null;
    labels.push(buf.toString('ascii', pos, pos + len));
    pos += len;
  }
  if (pos + 4 > buf.length) return null;

  return {
    id,
    question: labels.join('.'),
    qType: buf.readUInt16BE(pos),
    qClass: buf.readUInt16BE(pos + 2),
    questionEnd: pos + 4,
  };
}

/**
 * Builds an NXDOMAIN reply so the requesting app treats the blocked domain as
 * non-existent — the same answer the Android filter gives.
 */
function buildNxDomainResponse(request, parsed) {
  const questionSection = request.subarray(12, parsed.questionEnd);
  const header = Buffer.alloc(12);
  header.writeUInt16BE(parsed.id, 0);
  header[2] = 0x81; // QR=1 (response), RD echoed
  header[3] = 0x83; // RA=1, RCODE=3 (NXDOMAIN)
  header.writeUInt16BE(1, 4); // QDCOUNT
  header.writeUInt16BE(0, 6); // ANCOUNT
  header.writeUInt16BE(0, 8); // NSCOUNT
  header.writeUInt16BE(0, 10); // ARCOUNT
  return Buffer.concat([header, questionSection]);
}

/**
 * Builds a reply with a single A record pointing `question` at `ipAddress`
 * (dotted-quad, e.g. "127.0.0.1") — used for blocked domains when the
 * reminder page server (reminderServer.js) is available, so the browser
 * connects to our own page instead of failing outright. Only meaningful for
 * A queries (qType 1); AAAA and anything else still get NXDOMAIN (see
 * buildNxDomainResponse) so a client doesn't try IPv6 first.
 */
function buildARecordResponse(request, parsed, ipAddress) {
  const questionSection = request.subarray(12, parsed.questionEnd);
  const octets = ipAddress.split('.').map((n) => Number(n) & 0xff);

  const header = Buffer.alloc(12);
  header.writeUInt16BE(parsed.id, 0);
  header[2] = 0x81; // QR=1 (response), RD echoed
  header[3] = 0x80; // RA=1, RCODE=0 (NOERROR)
  header.writeUInt16BE(1, 4); // QDCOUNT
  header.writeUInt16BE(1, 6); // ANCOUNT
  header.writeUInt16BE(0, 8); // NSCOUNT
  header.writeUInt16BE(0, 10); // ARCOUNT

  // Answer: name = pointer to the question's name (0xC00C), TYPE=A, CLASS=IN,
  // TTL=0 (never cache — a domain can be un-blocked at any time), RDLENGTH=4,
  // RDATA = the four address octets.
  const answer = Buffer.alloc(16);
  answer.writeUInt16BE(0xc00c, 0);
  answer.writeUInt16BE(1, 2); // TYPE A
  answer.writeUInt16BE(1, 4); // CLASS IN
  answer.writeUInt32BE(0, 6); // TTL
  answer.writeUInt16BE(4, 10); // RDLENGTH
  Buffer.from(octets).copy(answer, 12);

  return Buffer.concat([header, questionSection, answer]);
}

module.exports = { parseQuestion, buildNxDomainResponse, buildARecordResponse };
