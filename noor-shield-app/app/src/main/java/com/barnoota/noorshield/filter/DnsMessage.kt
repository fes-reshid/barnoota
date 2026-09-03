package com.barnoota.noorshield.filter

import java.io.ByteArrayOutputStream

/**
 * Minimal DNS message parsing/building — just enough to read the queried
 * hostname out of a UDP DNS request and to synthesize either a blocked
 * (NXDOMAIN) or passthrough response. Not a general-purpose DNS library.
 */
object DnsMessage {

    data class ParsedQuery(val id: Int, val question: String, val qType: Int, val qClass: Int)

    /** Reads the first question's QNAME from a raw DNS packet, or null if unparseable. */
    fun parseQuestion(packet: ByteArray, length: Int): ParsedQuery? {
        if (length < 12) return null
        val id = ((packet[0].toInt() and 0xFF) shl 8) or (packet[1].toInt() and 0xFF)
        val qdCount = ((packet[4].toInt() and 0xFF) shl 8) or (packet[5].toInt() and 0xFF)
        if (qdCount < 1) return null

        var pos = 12
        val name = StringBuilder()
        while (pos < length) {
            val len = packet[pos].toInt() and 0xFF
            if (len == 0) {
                pos += 1
                break
            }
            if (name.isNotEmpty()) name.append('.')
            pos += 1
            if (pos + len > length) return null
            name.append(String(packet, pos, len, Charsets.US_ASCII))
            pos += len
        }
        if (pos + 4 > length) return null
        val qType = ((packet[pos].toInt() and 0xFF) shl 8) or (packet[pos + 1].toInt() and 0xFF)
        val qClass = ((packet[pos + 2].toInt() and 0xFF) shl 8) or (packet[pos + 3].toInt() and 0xFF)
        return ParsedQuery(id, name.toString(), qType, qClass)
    }

    /** Builds an NXDOMAIN reply so the requesting app treats the blocked domain as non-existent. */
    fun buildNxDomainResponse(originalRequest: ByteArray, requestLength: Int): ByteArray {
        val out = ByteArrayOutputStream()
        // Header: same ID, flags = response + NXDOMAIN (RCODE 3), 1 question, 0 answers
        out.write(originalRequest[0].toInt())
        out.write(originalRequest[1].toInt())
        out.write(0x81) // QR=1, Opcode=0, AA=0, TC=0, RD=1
        out.write(0x83) // RA=1, Z=0, RCODE=3 (NXDOMAIN)
        out.write(originalRequest[4].toInt()) // QDCOUNT hi
        out.write(originalRequest[5].toInt()) // QDCOUNT lo
        out.write(0); out.write(0) // ANCOUNT
        out.write(0); out.write(0) // NSCOUNT
        out.write(0); out.write(0) // ARCOUNT
        // Echo back the original question section verbatim
        out.write(originalRequest, 12, requestLength - 12)
        return out.toByteArray()
    }
}
