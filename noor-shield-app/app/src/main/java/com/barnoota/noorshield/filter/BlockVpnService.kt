package com.barnoota.noorshield.filter

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import com.barnoota.noorshield.R
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.InetSocketAddress
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

/**
 * Blocks known adult-content domains for the whole device, not just this app.
 *
 * How: it advertises itself as the device's DNS server (via [android.net.VpnService.Builder.addDnsServer])
 * and pulls only packets addressed to that fake DNS server into a local TUN
 * interface. It leaves every other packet (actual web/app traffic) alone —
 * this is a DNS-level filter, not a full packet-forwarding VPN, so it adds
 * no latency to normal browsing and needs no external VPN server.
 *
 * A query for a blocklisted domain gets an NXDOMAIN reply, so the requesting
 * app/browser sees the domain as non-existent. Everything else is forwarded
 * unmodified to a real upstream resolver (Cloudflare's 1.1.1.1 by default).
 *
 * Limitations (see README): apps that hardcode DNS-over-HTTPS to a fixed IP,
 * or that hit blocked content by raw IP address, bypass DNS filtering
 * entirely — this is a real gap, not just a hadith of caution. Pair this
 * with [ScreenGuardAccessibilityService] for on-screen image detection.
 */
class BlockVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private val running = AtomicBoolean(false)

    @Volatile private var blocklist: DomainBlocklist = DomainBlocklist.EMPTY

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_RELOAD) {
            // Domain list changed (user added/removed one) while the filter is already running —
            // swap it in without tearing down the TUN interface, so DNS keeps flowing.
            if (!running.get()) {
                stopSelf()
                return START_NOT_STICKY
            }
            blocklist = DomainBlocklist.load(applicationContext)
            return START_STICKY
        }
        if (running.get()) return START_STICKY
        if (prepare(applicationContext) != null) {
            // The user hasn't granted the VPN permission yet (or revoked it) — don't claim to be
            // protecting the device with a foreground notification when we can't actually filter.
            Log.w(TAG, "VPN permission not granted; not starting the filter")
            stopSelf()
            return START_NOT_STICKY
        }
        blocklist = DomainBlocklist.load(applicationContext)
        startForeground(NOTIFICATION_ID, buildNotification())
        startVpn()
        return START_STICKY
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }

    override fun onRevoke() {
        stopVpn()
        super.onRevoke()
    }

    private fun startVpn() {
        val builder = Builder()
            .setSession(getString(R.string.app_name))
            .addAddress(TUN_ADDRESS, 24)
            .addDnsServer(FAKE_DNS_SERVER)
            .addRoute(FAKE_DNS_SERVER, 32)
            .setBlocking(true)

        vpnInterface = builder.establish() ?: run {
            Log.e(TAG, "Failed to establish VPN interface")
            return
        }
        running.set(true)

        thread(name = "noor-shield-dns-loop") { runPacketLoop() }
    }

    private fun stopVpn() {
        running.set(false)
        vpnInterface?.close()
        vpnInterface = null
    }

    private fun runPacketLoop() {
        val tun = vpnInterface ?: return
        val input = FileInputStream(tun.fileDescriptor)
        val output = FileOutputStream(tun.fileDescriptor)
        val buffer = ByteArray(32_767)
        val upstreamDns = InetAddress.getByName(UPSTREAM_DNS)

        while (running.get()) {
            val length = try {
                input.read(buffer)
            } catch (e: Exception) {
                if (running.get()) Log.w(TAG, "tun read failed: ${e.message}")
                break
            }
            if (length <= 0) continue

            val packet = Ipv4UdpPacket.parse(buffer, length) ?: continue
            if (packet.protocol != Ipv4UdpPacket.PROTOCOL_UDP || packet.destPort != 53) continue

            val dnsPayload = buffer.copyOfRange(packet.payloadOffset, packet.payloadOffset + packet.payloadLength)
            val query = DnsMessage.parseQuestion(dnsPayload, dnsPayload.size)

            val responsePayload: ByteArray = if (query != null && blocklist.isBlocked(query.question)) {
                Log.i(TAG, "Blocked DNS lookup: ${query.question}")
                DnsMessage.buildNxDomainResponse(dnsPayload, dnsPayload.size)
            } else {
                forwardToUpstream(dnsPayload, upstreamDns) ?: continue
            }

            val responsePacket = Ipv4UdpPacket.build(
                srcAddr = packet.destAddress,
                srcPort = 53,
                dstAddr = packet.sourceAddress,
                dstPort = packet.sourcePort,
                payload = responsePayload,
            )
            try {
                output.write(responsePacket)
            } catch (e: Exception) {
                Log.w(TAG, "tun write failed: ${e.message}")
            }
        }
    }

    /** Forwards an unfiltered DNS query to a real resolver, protecting the socket from routing back into the VPN. */
    private fun forwardToUpstream(query: ByteArray, upstream: InetAddress): ByteArray? {
        return try {
            DatagramSocket().use { socket ->
                protect(socket)
                socket.soTimeout = 3_000
                socket.send(DatagramPacket(query, query.size, InetSocketAddress(upstream, 53)))
                val replyBuf = ByteArray(4096)
                val replyPacket = DatagramPacket(replyBuf, replyBuf.size)
                socket.receive(replyPacket)
                replyBuf.copyOf(replyPacket.length)
            }
        } catch (e: Exception) {
            Log.w(TAG, "upstream DNS forward failed: ${e.message}")
            null
        }
    }

    private fun buildNotification(): Notification {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (nm.getNotificationChannel(CHANNEL_ID) == null) {
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, getString(R.string.filter_channel_name), NotificationManager.IMPORTANCE_LOW)
            )
        }
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.filter_notification_title))
            .setContentText(getString(R.string.filter_notification_body))
            .setSmallIcon(R.drawable.ic_shield)
            .setOngoing(true)
            .build()
    }

    companion object {
        private const val TAG = "BlockVpnService"
        private const val CHANNEL_ID = "noor_shield_filter"
        private const val NOTIFICATION_ID = 1001
        private const val TUN_ADDRESS = "10.111.222.1"
        private const val FAKE_DNS_SERVER = "10.111.222.1"
        private const val UPSTREAM_DNS = "1.1.1.1"

        const val ACTION_RELOAD = "com.barnoota.noorshield.action.RELOAD_BLOCKLIST"

        fun start(context: Context) {
            context.startService(Intent(context, BlockVpnService::class.java))
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, BlockVpnService::class.java))
        }

        /** Re-reads the seed + custom blocklist into a service that's already running. No-op if it isn't. */
        fun reload(context: Context) {
            context.startService(Intent(context, BlockVpnService::class.java).setAction(ACTION_RELOAD))
        }
    }
}
