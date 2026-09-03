package com.barnoota.noorshield.filter

import android.content.Context
import com.barnoota.noorshield.journal.AppDatabase
import com.barnoota.noorshield.settings.NoorShieldPreferences
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import java.util.regex.Pattern

sealed class AddDomainResult {
    data object Added : AddDomainResult()
    data object AlreadyBlocked : AddDomainResult()
    data class Invalid(val reason: String) : AddDomainResult()
}

/**
 * Lets the user extend the built-in seed blocklist (res/raw/blocklist_domains.txt) with their
 * own domains — sites they've personally run into that aren't covered yet. Backed by Room so
 * entries survive restarts; [BlockVpnService] re-reads the combined list every time it starts.
 */
object BlocklistRepository {

    // A relaxed hostname check: labels of letters/digits/hyphens separated by dots, at least one dot.
    private val HOSTNAME_PATTERN = Pattern.compile(
        "^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$"
    )

    private fun dao(context: Context) = AppDatabase.get(context).customBlockedDomainDao()

    fun observeCustomDomains(context: Context): Flow<List<CustomBlockedDomain>> =
        dao(context).observeAll()

    /** Strips a scheme, path, port, and leading "www." so "https://www.Example.com/page" -> "example.com". */
    fun normalize(rawInput: String): String {
        var value = rawInput.trim().lowercase()
        value = value.substringAfter("://")
        value = value.substringBefore('/')
        value = value.substringBefore(':')
        if (value.startsWith("www.")) value = value.removePrefix("www.")
        return value
    }

    suspend fun addDomain(context: Context, rawInput: String): AddDomainResult {
        val domain = normalize(rawInput)
        if (domain.isEmpty()) return AddDomainResult.Invalid("Enter a website address.")
        if (!HOSTNAME_PATTERN.matcher(domain).matches()) {
            return AddDomainResult.Invalid("That doesn't look like a valid website (e.g. example.com).")
        }

        if (DomainBlocklist.load(context).isBlocked(domain)) {
            return AddDomainResult.AlreadyBlocked
        }

        dao(context).insert(CustomBlockedDomain(domain = domain, addedAtMs = System.currentTimeMillis()))
        restartFilterIfActive(context)
        return AddDomainResult.Added
    }

    suspend fun removeDomain(context: Context, entry: CustomBlockedDomain) {
        dao(context).delete(entry)
        restartFilterIfActive(context)
    }

    /** Tells an already-running filter service to pick up the edit immediately. */
    private suspend fun restartFilterIfActive(context: Context) {
        if (NoorShieldPreferences.observeFilterEnabled(context).first()) {
            BlockVpnService.reload(context)
        }
    }
}
