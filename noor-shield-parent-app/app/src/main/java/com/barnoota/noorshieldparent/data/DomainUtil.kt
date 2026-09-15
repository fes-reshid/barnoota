package com.barnoota.noorshieldparent.data

/**
 * Mirrors noor-shield-pc/cloud/dashboard.html's normalizeDomain/isValidDomain
 * exactly, so a site added here is stored in the same canonical form the
 * PC's own "Add a site" screen or the web dashboard would produce for the
 * same input.
 */
fun normalizeDomain(rawInput: String): String {
    var value = rawInput.trim().lowercase()
    val schemeIndex = value.indexOf("://")
    if (schemeIndex >= 0) value = value.substring(schemeIndex + 3)
    value = value.split("/")[0]
    value = value.split(":")[0]
    if (value.startsWith("www.")) value = value.substring(4)
    return value
}

private val HOSTNAME_RE = Regex("^(?!-)[a-z0-9-]{1,63}(?<!-)(\\.(?!-)[a-z0-9-]{1,63}(?<!-))+$")

fun isValidDomain(domain: String): Boolean = HOSTNAME_RE.matches(domain)
