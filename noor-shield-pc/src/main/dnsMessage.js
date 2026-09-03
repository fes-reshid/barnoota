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

module.exports = { parseQuestion, buildNxDomainResponse };
