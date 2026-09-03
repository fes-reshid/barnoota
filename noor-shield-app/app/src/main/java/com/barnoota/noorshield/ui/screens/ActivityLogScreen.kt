package com.barnoota.noorshield.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.barnoota.noorshield.email.EmailReportRepository
import com.barnoota.noorshield.email.EmailSettingsStore
import com.barnoota.noorshield.email.SecretStore
import com.barnoota.noorshield.email.SendReportResult
import com.barnoota.noorshield.email.SmtpSettings
import com.barnoota.noorshield.filter.ActivityLogRepository
import com.barnoota.noorshield.settings.ParentActionResult
import com.barnoota.noorshield.settings.ParentAuth
import com.barnoota.noorshield.settings.ParentAuthStatus
import kotlinx.coroutines.launch
import java.text.DateFormat
import java.util.Date

/**
 * Blocked-attempt log (see README: not a full browsing history) plus the
 * on-request email report — both gated behind the parent password. This is
 * currently the only screen that uses [ParentAuth]; the filter toggle and
 * blocklist edits remain open, unlike the PC app (see README for the scope
 * decision, and how to extend the gate to those later using this same
 * object).
 */
@Composable
fun ActivityLogScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var status by remember { mutableStateOf<ParentAuthStatus?>(null) }

    suspend fun refreshStatus() {
        status = ParentAuth.status(context)
    }

    LaunchedEffect(Unit) { refreshStatus() }

    when (val current = status) {
        null -> Column(Modifier.fillMaxWidth().padding(16.dp)) { Text("Loading…") }
        else -> when {
            !current.configured -> ParentSetupCard(
                onSetup = { password, confirm ->
                    when {
                        password.length < ParentAuth.MIN_PASSWORD_LENGTH ->
                            "Password must be at least ${ParentAuth.MIN_PASSWORD_LENGTH} characters."
                        password != confirm -> "The two passwords do not match."
                        else -> null
                    }
                },
                onSubmit = { password -> ParentAuth.setup(context, password) },
                onDone = { scope.launch { refreshStatus() } },
            )
            !current.unlocked -> ParentUnlockCard(
                lockedOutUntilMs = current.lockedOutUntilMs,
                onUnlock = { password -> ParentAuth.unlock(context, password) },
                onRecover = { key, newPassword -> ParentAuth.resetWithRecoveryKey(context, key, newPassword) },
                onDone = { scope.launch { refreshStatus() } },
            )
            else -> ActivityLogBody()
        }
    }
}

@Composable
private fun ParentSetupCard(
    onSetup: (String, String) -> String?,
    onSubmit: suspend (String) -> com.barnoota.noorshield.settings.ParentSetupResult,
    onDone: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var recoveryKey by remember { mutableStateOf<String?>(null) }
    var acknowledged by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Set the parent password", style = MaterialTheme.typography.titleMedium)
                Text(
                    "This protects the Activity Log and email report settings. Without it, a log " +
                        "of blocked sites could be cleared before you see it.",
                    style = MaterialTheme.typography.bodySmall,
                )
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; error = null },
                    label = { Text("Parent password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = confirm,
                    onValueChange = { confirm = it; error = null },
                    label = { Text("Confirm password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                )
                error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
                Button(onClick = {
                    val validation = onSetup(password, confirm)
                    if (validation != null) {
                        error = validation
                    } else {
                        scope.launch {
                            val result = onSubmit(password)
                            if (result.ok) recoveryKey = result.recoveryKey else error = result.error
                        }
                    }
                }) {
                    Text("Set password")
                }
            }
        }
    }

    recoveryKey?.let { key ->
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Write this recovery key down") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "This is the only time it will be shown. If the parent password is ever " +
                            "forgotten, this key is the only way back in."
                    )
                    Text(key, style = MaterialTheme.typography.titleMedium)
                    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        Checkbox(checked = acknowledged, onCheckedChange = { acknowledged = it })
                        Text("I have written down the recovery key")
                    }
                }
            },
            confirmButton = {
                TextButton(enabled = acknowledged, onClick = { recoveryKey = null; onDone() }) {
                    Text("Continue")
                }
            },
        )
    }
}

@Composable
private fun ParentUnlockCard(
    lockedOutUntilMs: Long,
    onUnlock: suspend (String) -> ParentActionResult,
    onRecover: suspend (String, String) -> com.barnoota.noorshield.settings.ParentSetupResult,
    onDone: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var showRecovery by remember { mutableStateOf(false) }
    var recoveryKeyInput by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var newRecoveryKey by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Locked", style = MaterialTheme.typography.titleMedium)
                Text(
                    "Enter the parent password to view or email the activity log.",
                    style = MaterialTheme.typography.bodySmall,
                )
                if (lockedOutUntilMs > System.currentTimeMillis()) {
                    val minutes = (lockedOutUntilMs - System.currentTimeMillis()) / 60_000 + 1
                    Text(
                        "Too many wrong attempts. Try again in $minutes minute(s).",
                        color = MaterialTheme.colorScheme.error,
                    )
                } else {
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it; error = null },
                        label = { Text("Password") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
                    Button(onClick = {
                        scope.launch {
                            when (val result = onUnlock(password)) {
                                is ParentActionResult.Ok -> onDone()
                                is ParentActionResult.Failed -> error = result.reason
                            }
                        }
                    }) {
                        Text("Unlock")
                    }
                    TextButton(onClick = { showRecovery = !showRecovery }) {
                        Text("Forgot password? Use recovery key")
                    }
                }

                if (showRecovery) {
                    OutlinedTextField(
                        value = recoveryKeyInput,
                        onValueChange = { recoveryKeyInput = it },
                        label = { Text("Recovery key") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = newPassword,
                        onValueChange = { newPassword = it },
                        label = { Text("New parent password") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Button(onClick = {
                        scope.launch {
                            val result = onRecover(recoveryKeyInput, newPassword)
                            if (result.ok) newRecoveryKey = result.recoveryKey else error = result.error
                        }
                    }) {
                        Text("Set new password")
                    }
                }
            }
        }
    }

    newRecoveryKey?.let { key ->
        AlertDialog(
            onDismissRequest = {},
            title = { Text("New recovery key") },
            text = { Text("Your old recovery key no longer works. Write this new one down:\n\n$key") },
            confirmButton = {
                TextButton(onClick = { newRecoveryKey = null; onDone() }) { Text("Continue") }
            },
        )
    }
}

@Composable
private fun ActivityLogBody() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val entries by ActivityLogRepository.observeRecent(context).collectAsState(initial = emptyList())
    val totalCount by ActivityLogRepository.observeCount(context).collectAsState(initial = 0)
    var confirmClear by remember { mutableStateOf(false) }

    var smtp by remember { mutableStateOf(SmtpSettings()) }
    var smtpPassword by remember { mutableStateOf("") }
    var hasSavedPassword by remember { mutableStateOf(false) }
    var saveMessage by remember { mutableStateOf<String?>(null) }
    var sendMessage by remember { mutableStateOf<String?>(null) }
    var sending by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        smtp = EmailSettingsStore.current(context)
        hasSavedPassword = SecretStore.hasSmtpPassword(context)
    }

    LazyColumn(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Blocked attempts ($totalCount)", style = MaterialTheme.typography.titleMedium)
                        TextButton(onClick = { confirmClear = true }) { Text("Clear log") }
                    }
                    Text(
                        "Sites the filter has blocked. Not a full browsing history.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }

        if (entries.isEmpty()) {
            item { Text("No blocked attempts recorded.", modifier = Modifier.padding(horizontal = 4.dp)) }
        } else {
            items(entries) { entry ->
                Card(Modifier.fillMaxWidth()) {
                    Row(
                        Modifier.fillMaxWidth().padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(entry.domain, style = MaterialTheme.typography.bodyMedium)
                        Text(
                            DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)
                                .format(Date(entry.timestampMs)),
                            style = MaterialTheme.typography.bodySmall.copy(fontStyle = FontStyle.Italic),
                        )
                    }
                }
            }
        }

        item {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Email settings", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "Configure an SMTP account once (an app password from your email provider " +
                            "works well). Sending is on request only — nothing is automatic.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    OutlinedTextField(
                        value = smtp.host,
                        onValueChange = { smtp = smtp.copy(host = it) },
                        label = { Text("SMTP server") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = smtp.port.toString(),
                        onValueChange = { smtp = smtp.copy(port = it.filter(Char::isDigit).toIntOrNull() ?: smtp.port) },
                        label = { Text("Port") },
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        Checkbox(checked = smtp.secure, onCheckedChange = { smtp = smtp.copy(secure = it) })
                        Text("Use TLS")
                    }
                    OutlinedTextField(
                        value = smtp.user,
                        onValueChange = { smtp = smtp.copy(user = it) },
                        label = { Text("SMTP username") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = smtpPassword,
                        onValueChange = { smtpPassword = it },
                        label = { Text(if (hasSavedPassword) "SMTP password (saved — leave blank to keep it)" else "SMTP password") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = smtp.from,
                        onValueChange = { smtp = smtp.copy(from = it) },
                        label = { Text("\"From\" address (optional)") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Button(onClick = {
                        scope.launch {
                            val error = EmailReportRepository.saveSettings(
                                context,
                                smtp,
                                smtpPassword.ifBlank { null },
                            )
                            saveMessage = error ?: "Saved."
                            if (error == null) {
                                if (smtpPassword.isNotEmpty()) hasSavedPassword = true
                                smtpPassword = ""
                            }
                        }
                    }) {
                        Text("Save email settings")
                    }
                    saveMessage?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                }
            }
        }

        item {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Send report", style = MaterialTheme.typography.titleMedium)
                    OutlinedTextField(
                        value = smtp.recipient,
                        onValueChange = { smtp = smtp.copy(recipient = it) },
                        label = { Text("Send to") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Button(
                        enabled = !sending,
                        onClick = {
                            sending = true
                            sendMessage = "Sending…"
                            scope.launch {
                                val saveError = EmailReportRepository.saveSettings(context, smtp, null)
                                if (saveError != null) {
                                    sendMessage = saveError
                                    sending = false
                                    return@launch
                                }
                                when (val result = EmailReportRepository.sendReport(context)) {
                                    is SendReportResult.Sent ->
                                        sendMessage = "Sent a report covering ${result.count} blocked attempt(s)."
                                    is SendReportResult.Failed -> sendMessage = result.error
                                }
                                sending = false
                            }
                        },
                    ) {
                        Text("Send report now")
                    }
                    sendMessage?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                }
            }
        }
    }

    if (confirmClear) {
        AlertDialog(
            onDismissRequest = { confirmClear = false },
            title = { Text("Clear the activity log?") },
            text = { Text("This cannot be undone.") },
            confirmButton = {
                TextButton(onClick = {
                    confirmClear = false
                    scope.launch { ActivityLogRepository.clear(context) }
                }) { Text("Clear") }
            },
            dismissButton = { TextButton(onClick = { confirmClear = false }) { Text("Cancel") } },
        )
    }
}
