package com.barnoota.noorshield.email

import com.barnoota.noorshield.filter.ActivityLogEntry
import java.text.DateFormat
import java.util.Date

/**
 * Formats the activity report — a list of blocked domains, with timestamps —
 * for the on-request email. Mirrors the shape of the PC app's
 * emailReport.js buildReportText/buildReportHtml, though this is a fresh
 * implementation: there's no shared runtime between a Kotlin app and a
 * Node.js one to actually share code with.
 */
object ReportFormatter {
    fun buildText(entries: List<ActivityLogEntry>, totalCount: Int = entries.size): String {
        if (entries.isEmpty()) {
            return "Noor Shield: no blocked attempts recorded since the log was last cleared."
        }
        val df = DateFormat.getDateTimeInstance()
        val lines = entries.joinToString("\n") { "${df.format(Date(it.timestampMs))}  —  ${it.domain}" }
        val header = if (totalCount > entries.size) {
            "Noor Shield blocked $totalCount attempt(s); showing the most recent ${entries.size}:"
        } else {
            "Noor Shield blocked ${entries.size} attempt(s):"
        }
        return "$header\n\n$lines"
    }

    fun buildHtml(entries: List<ActivityLogEntry>, totalCount: Int = entries.size): String {
        if (entries.isEmpty()) {
            return "<p>No blocked attempts recorded since the log was last cleared.</p>"
        }
        val df = DateFormat.getDateTimeInstance()
        val header = if (totalCount > entries.size) {
            "Blocked $totalCount attempt(s); showing the most recent ${entries.size}:"
        } else {
            "Blocked ${entries.size} attempt(s):"
        }
        val rows = entries.joinToString("") { entry ->
            "<tr><td style=\"padding:4px 12px 4px 0;white-space:nowrap;color:#4B5A52;\">" +
                "${escapeHtml(df.format(Date(entry.timestampMs)))}</td>" +
                "<td style=\"padding:4px 0;font-family:monospace;\">${escapeHtml(entry.domain)}</td></tr>"
        }
        return "<p style=\"font-family:sans-serif;color:#16241D;\">${escapeHtml(header)}</p>" +
            "<table style=\"border-collapse:collapse;font-size:0.9em;\">$rows</table>"
    }

    private fun escapeHtml(value: String): String = value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
}
