package com.barnoota.noorshield.filter

import android.content.Context
import com.barnoota.noorshield.R
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * Domain-level blocklist used by [BlockVpnService] to reject DNS lookups for
 * known adult-content domains, network-wide, for every app on the device.
 *
 * This is a starting list only. For real-world use, replace/extend
 * res/raw/blocklist_domains.txt with a maintained list such as the
 * "Blocklist Project" or "StevenBlack hosts" adult-content categories,
 * refreshed periodically (e.g. via a WorkManager job that downloads an
 * updated list over HTTPS and re-parses it into this set).
 */
class DomainBlocklist private constructor(private val blocked: Set<String>) {

    /** True if [host] or any parent domain of [host] is on the blocklist. */
    fun isBlocked(host: String): Boolean {
        val normalized = host.trimEnd('.').lowercase()
        var candidate = normalized
        while (true) {
            if (blocked.contains(candidate)) return true
            val dot = candidate.indexOf('.')
            if (dot < 0) return false
            candidate = candidate.substring(dot + 1)
        }
    }

    val size: Int get() = blocked.size

    companion object {
        fun load(context: Context): DomainBlocklist {
            val domains = mutableSetOf<String>()
            context.resources.openRawResource(R.raw.blocklist_domains).use { input ->
                BufferedReader(InputStreamReader(input)).forEachLine { rawLine ->
                    val line = rawLine.substringBefore('#').trim().lowercase()
                    if (line.isNotEmpty()) domains.add(line)
                }
            }
            return DomainBlocklist(domains)
        }
    }
}
