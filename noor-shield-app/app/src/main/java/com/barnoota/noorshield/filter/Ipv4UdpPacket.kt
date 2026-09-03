package com.barnoota.noorshield.filter

import java.net.InetAddress

/**
 * Hand-rolled IPv4 + UDP header parsing/building, just enough to shuttle DNS
 * packets in and out of the VPN's TUN interface. Only UDP/IPv4 is supported —
 * this app only pulls DNS (UDP/53) traffic into the tunnel (see
 * [BlockVpnService]), everything else bypasses the VPN entirely.
 */
object Ipv4UdpPacket {

    const val PROTOCOL_UDP = 17

    data class Parsed(
        val sourceAddress: InetAddress,
        val destAddress: InetAddress,
        val sourcePort: Int,
        val destPort: Int,
        val payloadOffset: Int,
        val payloadLength: Int,
        val protocol: Int,
    )

    fun parse(buf: ByteArray, length: Int): Parsed? {
        if (length < 20) return null
        val versionAndIhl = buf[0].toInt() and 0xFF
        val version = versionAndIhl shr 4
        if (version != 4) return null
        val ihl = (versionAndIhl and 0x0F) * 4
        if (ihl < 20 || length < ihl + 8) return null
        val protocol = buf[9].toInt() and 0xFF
        val srcAddr = InetAddress.getByAddress(buf.copyOfRange(12, 16))
        val dstAddr = InetAddress.getByAddress(buf.copyOfRange(16, 20))
        if (protocol != PROTOCOL_UDP) {
            return Parsed(srcAddr, dstAddr, 0, 0, ihl, length - ihl, protocol)
        }
        val srcPort = ((buf[ihl].toInt() and 0xFF) shl 8) or (buf[ihl + 1].toInt() and 0xFF)
        val dstPort = ((buf[ihl + 2].toInt() and 0xFF) shl 8) or (buf[ihl + 3].toInt() and 0xFF)
        val udpLen = ((buf[ihl + 4].toInt() and 0xFF) shl 8) or (buf[ihl + 5].toInt() and 0xFF)
        val payloadOffset = ihl + 8
        val payloadLength = (udpLen - 8).coerceAtLeast(0).coerceAtMost(length - payloadOffset)
        return Parsed(srcAddr, dstAddr, srcPort, dstPort, payloadOffset, payloadLength, protocol)
    }

    /** Builds a UDP/IPv4 packet carrying [payload], addressed from [srcAddr]:[srcPort] to [dstAddr]:[dstPort]. */
    fun build(
        srcAddr: InetAddress,
        srcPort: Int,
        dstAddr: InetAddress,
        dstPort: Int,
        payload: ByteArray,
    ): ByteArray {
        val udpLength = 8 + payload.size
        val totalLength = 20 + udpLength
        val packet = ByteArray(totalLength)

        // IPv4 header
        packet[0] = 0x45 // version 4, IHL 5 (20 bytes, no options)
        packet[1] = 0
        packet[2] = ((totalLength shr 8) and 0xFF).toByte()
        packet[3] = (totalLength and 0xFF).toByte()
        packet[4] = 0; packet[5] = 0 // identification
        packet[6] = 0x40.toByte(); packet[7] = 0 // flags: don't fragment
        packet[8] = 64 // TTL
        packet[9] = PROTOCOL_UDP.toByte()
        packet[10] = 0; packet[11] = 0 // header checksum, filled below
        System.arraycopy(srcAddr.address, 0, packet, 12, 4)
        System.arraycopy(dstAddr.address, 0, packet, 16, 4)
        val ipChecksum = checksum(packet, 0, 20)
        packet[10] = ((ipChecksum shr 8) and 0xFF).toByte()
        packet[11] = (ipChecksum and 0xFF).toByte()

        // UDP header
        val u = 20
        packet[u] = ((srcPort shr 8) and 0xFF).toByte()
        packet[u + 1] = (srcPort and 0xFF).toByte()
        packet[u + 2] = ((dstPort shr 8) and 0xFF).toByte()
        packet[u + 3] = (dstPort and 0xFF).toByte()
        packet[u + 4] = ((udpLength shr 8) and 0xFF).toByte()
        packet[u + 5] = (udpLength and 0xFF).toByte()
        packet[u + 6] = 0; packet[u + 7] = 0 // UDP checksum optional over IPv4; leave as 0 (disabled)
        System.arraycopy(payload, 0, packet, u + 8, payload.size)

        return packet
    }

    private fun checksum(buf: ByteArray, offset: Int, length: Int): Int {
        var sum = 0
        var i = offset
        val end = offset + length
        while (i < end - 1) {
            sum += ((buf[i].toInt() and 0xFF) shl 8) or (buf[i + 1].toInt() and 0xFF)
            i += 2
        }
        if (i < end) sum += (buf[i].toInt() and 0xFF) shl 8
        while (sum shr 16 != 0) sum = (sum and 0xFFFF) + (sum shr 16)
        return sum.inv() and 0xFFFF
    }
}
