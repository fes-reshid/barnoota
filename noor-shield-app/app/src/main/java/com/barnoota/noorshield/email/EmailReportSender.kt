package com.barnoota.noorshield.email

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Properties
import javax.mail.Authenticator
import javax.mail.Message
import javax.mail.PasswordAuthentication
import javax.mail.Session
import javax.mail.Transport
import javax.mail.internet.InternetAddress
import javax.mail.internet.MimeBodyPart
import javax.mail.internet.MimeMessage
import javax.mail.internet.MimeMultipart

/**
 * Sends the on-request activity report over SMTP using Jakarta Mail's
 * Android port (`com.sun.mail:android-mail` + `android-activation`) — plain
 * `javax.mail`/`jakarta.mail` doesn't run on Android, which has no built-in
 * `javax.activation`. There is no equivalent to reuse from the PC app
 * (nodemailer is Node-only); this follows the same shape — a plain-text +
 * HTML multipart, the same subject line format — as a from-scratch
 * implementation.
 */
object EmailReportSender {

    suspend fun send(
        settings: SmtpSettings,
        password: String,
        subject: String,
        textBody: String,
        htmlBody: String,
    ) = withContext(Dispatchers.IO) {
        require(settings.host.isNotBlank()) { "Enter an SMTP server address." }
        require(settings.recipient.isNotBlank()) { "Enter a recipient email address." }
        val fromAddress = settings.from.ifBlank { settings.user }
        require(fromAddress.isNotBlank()) { "Set an SMTP username or \"From\" address." }

        val authenticated = settings.user.isNotBlank()
        val props = Properties().apply {
            put("mail.smtp.host", settings.host)
            put("mail.smtp.port", settings.port.toString())
            put("mail.smtp.auth", authenticated.toString())
            if (settings.secure) {
                put("mail.smtp.starttls.enable", "true")
                put("mail.smtp.ssl.trust", settings.host)
            }
        }

        val session = if (authenticated) {
            Session.getInstance(
                props,
                object : Authenticator() {
                    override fun getPasswordAuthentication() = PasswordAuthentication(settings.user, password)
                },
            )
        } else {
            Session.getInstance(props)
        }

        val message = MimeMessage(session).apply {
            setFrom(InternetAddress(fromAddress))
            setRecipients(Message.RecipientType.TO, InternetAddress.parse(settings.recipient))
            setSubject(subject)
        }

        val textPart = MimeBodyPart().apply { setText(textBody, "utf-8") }
        val htmlPart = MimeBodyPart().apply { setContent(htmlBody, "text/html; charset=utf-8") }
        val multipart = MimeMultipart("alternative").apply {
            addBodyPart(textPart)
            addBodyPart(htmlPart)
        }
        message.setContent(multipart)

        Transport.send(message)
    }
}
