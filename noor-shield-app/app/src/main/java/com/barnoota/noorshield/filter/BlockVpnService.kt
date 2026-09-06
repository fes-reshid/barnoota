package com.barnoota.noorshield.filter

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import com.barnoota.noorshield.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
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
    private var networkDnsServers: List<InetAddress> = emptyList()

    @Volatile private var blocklist: DomainBlocklist = DomainBlocklist.EMPTY

    // For writing to the activity log off the packet-forwarding thread. A blocked lookup is
    // relatively rare (compared to the packet loop's hot path), so a plain IO-dispatched
    // coroutine per event is cheap enough — no need for a batching/queueing layer.
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

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
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onRevoke() {
        stopVpn()
        super.onRevoke()
    }

    private fun startVpn() {
        // Read before establish(): once the VPN is up, this device's "active network" DNS
        // servers reported here may reflect the VPN's own virtual DNS server instead of the
        // real WiFi/cellular network's — capturing them now means the network's own resolver
        // (the one thing its own router/carrier is guaranteed to let through) is available as
        // an upstream option, not just the public resolvers in UPSTREAM_DNS_SERVERS.
        networkDnsServers = currentNetworkDnsServers()

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

    /** The DNS servers the underlying network (WiFi/cellular) is actually configured to use. */
    private fun currentNetworkDnsServers(): List<InetAddress> {
        return try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val network = cm.activeNetwork ?: return emptyList()
            val linkProperties = cm.getLinkProperties(network) ?: return emptyList()
            linkProperties.dnsServers.filter { it.hostAddress != FAKE_DNS_SERVER }
        } catch (e: Exception) {
            Log.w(TAG, "could not read the network's own DNS servers: ${e.message}")
            emptyList()
        }
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
        // Some home routers/ISPs firewall or silently drop outbound UDP/53 to
        // anything other than their own resolver — trying only one upstream
        // server means every non-blocked domain fails to resolve on such a
        // network, which looks indistinguishable from "everything is
        // blocked" to whoever's using the app. The network's own DNS server
        // goes first (the one thing its router/carrier is guaranteed to
        // allow), then the public fallbacks for networks that don't hand
        // out a usable resolver.
        val upstreamServers = (networkDnsServers + UPSTREAM_DNS_SERVERS.map { InetAddress.getByName(it) }).distinct()

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
                val domain = query.question
                serviceScope.launch { ActivityLogRepository.record(applicationContext, domain) }
                DnsMessage.buildNxDomainResponse(dnsPayload, dnsPayload.size)
            } else {
                forwardToUpstream(dnsPayload, upstreamServers, query?.question) ?: continue
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

    /**
     * Forwards an unfiltered DNS query to a real resolver, protecting the socket from routing
     * back into the VPN. Tries each of [upstreams] in turn (short timeout each) rather than one
     * fixed server — see the comment on [runPacketLoop] for why.
     */
    private fun forwardToUpstream(query: ByteArray, upstreams: List<InetAddress>, question: String?): ByteArray? {
        for (upstream in upstreams) {
            try {
                DatagramSocket().use { socket ->
                    protect(socket)
                    socket.soTimeout = UPSTREAM_TIMEOUT_MS
                    socket.send(DatagramPacket(query, query.size, InetSocketAddress(upstream, 53)))
                    val replyBuf = ByteArray(4096)
                    val replyPacket = DatagramPacket(replyBuf, replyBuf.size)
                    socket.receive(replyPacket)
                    return replyBuf.copyOf(replyPacket.length)
                }
            } catch (e: Exception) {
                Log.w(TAG, "upstream DNS forward to ${upstream.hostAddress} failed: ${e.message}")
            }
        }
        // Every configured resolver failed for this query — worth its own log line, distinct
        // from "upstream DNS forward failed" above, since seeing this a lot points at the
        // network (a firewall/router blocking DNS-over-UDP entirely) rather than any one server.
        Log.e(TAG, "All upstream DNS servers failed for query${question?.let { " ($it)" } ?: ""}")
        return null
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
        // Cloudflare, then Google, then Quad9 — distinct operators/anycast networks, so a
        // network that blocks one specific provider's resolver likely still lets another
        // through. Kept short: this list is walked serially per query.
        private val UPSTREAM_DNS_SERVERS = listOf("1.1.1.1", "8.8.8.8", "9.9.9.9")
        private const val UPSTREAM_TIMEOUT_MS = 1_500

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
