package com.barnoota.noorshield.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.barnoota.noorshield.cloud.CloudStore
import com.barnoota.noorshield.cloud.CloudSync
import com.barnoota.noorshield.cloud.DayWindow
import com.barnoota.noorshield.cloud.Schedule
import com.barnoota.noorshield.license.License
import com.barnoota.noorshield.settings.ParentActionResult
import com.barnoota.noorshield.settings.ParentAuth
import com.barnoota.noorshield.settings.ParentAuthStatus
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val DAY_LABELS = listOf("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa")
private val DAY_NAMES = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")

/**
 * Everything a parent needs to link and manage this phone the same way they
 * manage a paired PC: pairing with the web dashboard / phone companion app,
 * the weekly bedtime schedule, and product-key activation. Gated behind the
 * same parent password as the Activity Log tab (see ParentAuth) — a simple
 * "go set it up there first" message here rather than a second password-
 * setup flow, since the two tabs share the same unlocked/locked state.
 */
@Composable
fun RemoteControlScreen() {
    val context = LocalContext.current
    var status by remember { mutableStateOf<ParentAuthStatus?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) { status = ParentAuth.status(context) }

    Column(modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp)) {
        when (val current = status) {
            null -> Text("Loading…")
            else -> if (!current.unlocked) {
                Text(
                    "Set up or unlock the parent password from the Activity tab first — Remote " +
                        "Control uses the same password.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            } else {
                PairingCard()
                WeeklyBedtimeCard()
                LicenseCard()
            }
        }
    }
}

@Composable
private fun PairingCard() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var deviceId by remember { mutableStateOf<String?>(null) }
    var pendingCode by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    suspend fun refresh() {
        deviceId = CloudStore.deviceId(context)
        pendingCode = CloudStore.pendingPairing(context)?.code
    }
    LaunchedEffect(Unit) { refresh() }

    // While a pairing code is showing, poll for it being claimed — same cadence as the web
    // dashboard's own pairing screen.
    LaunchedEffect(pendingCode) {
        while (pendingCode != null && deviceId == null) {
            delay(4_000)
            if (CloudSync.checkPairingClaimed(context)) refresh() else pendingCode = CloudStore.pendingPairing(context)?.code
        }
    }

    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Text("Remote control", style = MaterialTheme.typography.titleMedium)
            Text(
                "Link this phone to the same account used on the web dashboard or the Noor Shield " +
                    "Parent app, so it can be managed remotely — bedtime, blocked sites, and locking.",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 4.dp, bottom = 8.dp),
            )

            when {
                deviceId != null -> {
                    Text("Paired ✓", style = MaterialTheme.typography.bodyLarge)
                    OutlinedButton(
                        enabled = !busy,
                        onClick = {
                            busy = true
                            scope.launch {
                                CloudSync.unpair(context)
                                refresh()
                                busy = false
                            }
                        },
                        modifier = Modifier.padding(top = 8.dp),
                    ) { Text("Unpair") }
                }
                pendingCode != null -> {
                    Text("Enter this code on the dashboard or phone app:", style = MaterialTheme.typography.bodySmall)
                    Text(
                        pendingCode!!.chunked(3).joinToString("  "),
                        style = MaterialTheme.typography.headlineMedium,
                        modifier = Modifier.padding(vertical = 8.dp),
                    )
                    OutlinedButton(onClick = { scope.launch { CloudSync.cancelPairing(context); refresh() } }) {
                        Text("Cancel")
                    }
                }
                else -> {
                    error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
                    Button(
                        enabled = !busy,
                        onClick = {
                            busy = true
                            error = null
                            scope.launch {
                                val result = CloudSync.startPairing(context)
                                if (result.isSuccess) {
                                    refresh()
                                } else {
                                    error = result.exceptionOrNull()?.message ?: "Could not start pairing."
                                }
                                busy = false
                            }
                        },
                    ) { Text("Pair this phone") }
                }
            }
        }
    }
}

@Composable
private fun WeeklyBedtimeCard() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var scheduleEnabled by remember { mutableStateOf(false) }
    val dayWindows = remember {
        val windows = Array(7) { DayWindow(enabled = false, startTime = "21:00", endTime = "07:00") }
        androidx.compose.runtime.mutableStateListOf(*windows)
    }
    var focusedDay by remember { mutableStateOf(0) }
    var message by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        val schedule = CloudStore.schedule(context)
        scheduleEnabled = schedule.enabled
        for (day in 0..6) {
            schedule.perDay[day]?.let { dayWindows[day] = it }
        }
    }

    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Text("Weekly bedtime", style = MaterialTheme.typography.titleMedium)
            Text(
                "All internet on this phone is blocked during the window — not just filtered sites.",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 4.dp, bottom = 8.dp),
            )
            Row(
                modifier = Modifier.clickable { scheduleEnabled = !scheduleEnabled },
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Checkbox(checked = scheduleEnabled, onCheckedChange = { scheduleEnabled = it })
                Text("Turn on the schedule")
            }
            Text(
                "Tap a day to block internet on it, and give it its own start/end time.",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 4.dp, bottom = 8.dp),
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DAY_LABELS.forEachIndexed { i, label ->
                    val window = dayWindows[i]
                    val bg = if (window.enabled) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                    val fg = if (window.enabled) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    Text(
                        label,
                        textAlign = TextAlign.Center,
                        color = fg,
                        modifier = Modifier
                            .wrapContentWidth()
                            .background(bg, RoundedCornerShape(999.dp))
                            .border(
                                width = if (i == focusedDay) 2.dp else 0.dp,
                                color = MaterialTheme.colorScheme.secondary,
                                shape = RoundedCornerShape(999.dp),
                            )
                            .clickable {
                                dayWindows[i] = if (i == focusedDay) {
                                    window.copy(enabled = !window.enabled)
                                } else {
                                    focusedDay = i
                                    window.copy(enabled = true)
                                }
                            }
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                    )
                }
            }

            Text(
                "Editing ${DAY_NAMES[focusedDay]}'s time.",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 8.dp),
            )
            val focusedWindow = dayWindows[focusedDay]
            Row(modifier = Modifier.padding(top = 4.dp)) {
                OutlinedTextField(
                    value = focusedWindow.startTime,
                    onValueChange = { dayWindows[focusedDay] = focusedWindow.copy(startTime = it) },
                    label = { Text("Start") },
                    modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = focusedWindow.endTime,
                    onValueChange = { dayWindows[focusedDay] = focusedWindow.copy(endTime = it) },
                    label = { Text("End") },
                    modifier = Modifier.weight(1f).padding(start = 8.dp),
                )
            }

            message?.let { Text(it, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp)) }

            Button(
                enabled = !busy,
                onClick = {
                    if (dayWindows.none { it.enabled }) {
                        message = "Tap at least one day to block."
                        return@Button
                    }
                    val timeRe = Regex("^([01]\\d|2[0-3]):[0-5]\\d$")
                    val badDay = dayWindows.firstOrNull {
                        it.enabled && (!timeRe.matches(it.startTime) || !timeRe.matches(it.endTime) || it.startTime == it.endTime)
                    }
                    if (badDay != null) {
                        message = "Enter a valid, different start and end time (HH:MM) for every blocked day."
                        return@Button
                    }
                    busy = true
                    message = null
                    val perDay = mutableMapOf<Int, DayWindow>()
                    dayWindows.forEachIndexed { i, w -> perDay[i] = w }
                    scope.launch {
                        CloudStore.setSchedule(context, Schedule(scheduleEnabled, perDay))
                        message = "Saved."
                        busy = false
                    }
                },
                modifier = Modifier.padding(top = 12.dp),
            ) { Text("Save weekly bedtime") }
        }
    }
}

@Composable
private fun LicenseCard() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var activated by remember { mutableStateOf(false) }
    var trialDaysLeft by remember { mutableStateOf(0) }
    var keyInput by remember { mutableStateOf("") }
    var message by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        activated = CloudStore.isActivated(context)
        val firstRunAt = CloudStore.ensureFirstRunAt(context)
        trialDaysLeft = License.trialDaysRemaining(firstRunAt)
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text("Product key", style = MaterialTheme.typography.titleMedium)
            Text(
                when {
                    activated -> "Activated."
                    trialDaysLeft > 0 -> "Free trial: $trialDaysLeft day${if (trialDaysLeft == 1) "" else "s"} left."
                    else -> "Your free trial has ended. Enter a product key to keep using remote control."
                },
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 4.dp, bottom = 8.dp),
            )
            if (!activated) {
                OutlinedTextField(
                    value = keyInput,
                    onValueChange = { keyInput = it; message = null },
                    label = { Text("NOOR-XXXXX-XXXXX-XXXXX") },
                    modifier = Modifier.fillMaxWidth(),
                )
                message?.let { Text(it, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp)) }
                Button(
                    enabled = !busy && keyInput.isNotBlank(),
                    onClick = {
                        busy = true
                        message = null
                        scope.launch {
                            val deviceId = CloudStore.licenseDeviceId(context)
                            when (License.activateKeyOnline(keyInput, deviceId)) {
                                License.ActivationResult.Ok -> {
                                    CloudStore.setActivated(context, true)
                                    activated = true
                                }
                                License.ActivationResult.BadFormat -> message = "That doesn't look like a valid product key."
                                License.ActivationResult.Invalid -> message = "That key isn't recognized."
                                License.ActivationResult.AlreadyUsed -> message = "That key is already used on another device."
                                License.ActivationResult.NetworkError ->
                                    message = "Couldn't reach the activation server — check your internet connection."
                            }
                            busy = false
                        }
                    },
                    modifier = Modifier.padding(top = 8.dp),
                ) { Text("Activate") }
            }
        }
    }
}
