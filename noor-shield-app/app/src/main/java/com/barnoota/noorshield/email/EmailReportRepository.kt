package com.barnoota.noorshield.email

import android.content.Context
import com.barnoota.noorshield.filter.ActivityLogRepository
import kotlinx.coroutines.flow.first

sealed class SendReportResult {
    data class Sent(val count: Int) : SendReportResult()
    data class Failed(val error: String) : SendReportResult()
}

/**
 * Orchestrates the on-request email report: gated by [com.barnoota.noorshield.settings.ParentAuth]
 * at the UI layer (see ActivityLogScreen), not here — this object assumes the caller already
 * checked that the parent session is unlocked, same division of responsibility as
 * [com.barnoota.noorshield.filter.BlocklistRepository].
 */
object EmailReportRepository {
    private val EMAIL_REGEX = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")

    /** Returns an error message, or null on success. Blank [password] leaves the saved one untouched. */
    suspend fun saveSettings(context: Context, settings: SmtpSettings, password: String?): String? {
        if (settings.host.isBlank()) return "Enter an SMTP server address."
        if (settings.recipient.isNotBlank() && !EMAIL_REGEX.matches(settings.recipient)) {
            return "That recipient address doesn't look valid."
        }

        EmailSettingsStore.save(context, settings)

        if (!password.isNullOrEmpty()) {
            try {
                SecretStore.saveSmtpPassword(context, password)
            } catch (e: Exception) {
                return "Could not save the password securely: ${e.message}"
            }
        }
        return null
    }

    suspend fun sendReport(context: Context): SendReportResult {
        val settings = EmailSettingsStore.current(context)
        if (settings.host.isBlank()) return SendReportResult.Failed("Set up email settings first.")
        if (settings.recipient.isBlank()) return SendReportResult.Failed("Enter a recipient email address first.")

        val password = try {
            SecretStore.readSmtpPassword(context) ?: ""
        } catch (e: Exception) {
            return SendReportResult.Failed("Could not read the saved password: ${e.message}")
        }

        val entries = ActivityLogRepository.observeRecent(context, limit = 500).first()
        val totalCount = ActivityLogRepository.observeCount(context).first()
        val text = ReportFormatter.buildText(entries, totalCount)
        val html = ReportFormatter.buildHtml(entries, totalCount)
        val subject = "Noor Shield activity report — ${entries.size} blocked attempt${if (entries.size == 1) "" else "s"}"

        return try {
            EmailReportSender.send(settings, password, subject, text, html)
            SendReportResult.Sent(entries.size)
        } catch (e: Exception) {
            SendReportResult.Failed("Could not send the report: ${e.message}")
        }
    }
}
