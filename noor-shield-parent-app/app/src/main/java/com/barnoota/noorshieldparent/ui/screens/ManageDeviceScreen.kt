package com.barnoota.noorshieldparent.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Divider
import androidx.compose.material3.IconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.barnoota.noorshieldparent.data.DAY_LABELS
import com.barnoota.noorshieldparent.data.DAY_NAMES
import com.barnoota.noorshieldparent.data.DayWindow
import com.barnoota.noorshieldparent.data.Device
import com.barnoota.noorshieldparent.data.isValidDomain
import com.barnoota.noorshieldparent.data.normalizeDomain
import com.barnoota.noorshieldparent.network.SupabaseClient
import kotlinx.coroutines.launch
import org.json.JSONObject

@Composable
fun ManageDeviceScreen(
    supabase: SupabaseClient,
    device: Device,
    onBack: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var statusMessage by remember { mutableStateOf<String?>(null) }

    fun sendQuickCommand(kind: String) {
        scope.launch {
            statusMessage = null
            supabase.sendCommand(device.id, kind)
                .onSuccess { statusMessage = "Sent." }
                .onFailure { statusMessage = it.message ?: "Could not send that command." }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(device.name) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            Text("Quick actions", style = MaterialTheme.typography.titleMedium)
            Row(modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)) {
                Button(onClick = { sendQuickCommand("enforce_sleep_now") }) { Text("Enforce sleep now") }
                OutlinedButton(
                    onClick = { sendQuickCommand("cancel_sleep_now") },
                    modifier = Modifier.padding(start = 8.dp),
                ) { Text("Cancel sleep") }
            }
            Row {
                Button(onClick = { sendQuickCommand("lock_computer") }) { Text("Lock") }
                OutlinedButton(
                    onClick = { sendQuickCommand("unlock_computer") },
                    modifier = Modifier.padding(start = 8.dp),
                ) { Text("Unlock") }
            }
            statusMessage?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 6.dp))
            }

            Divider(modifier = Modifier.padding(vertical = 20.dp))

            BlockedSitesSection(supabase, device)

            Divider(modifier = Modifier.padding(vertical = 20.dp))

            WeeklyBedtimeSection(supabase, device)
        }
    }
}

@Composable
private fun BlockedSitesSection(supabase: SupabaseClient, device: Device) {
    val scope = rememberCoroutineScope()
    val sites = remember { mutableStateListOf<String>() }
    var loading by remember { mutableStateOf(true) }
    var newSite by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    suspend fun reload() {
        loading = true
        supabase.listDeviceDomains(device.id)
            .onSuccess { sites.clear(); sites.addAll(it) }
            .onFailure { error = it.message }
        loading = false
    }

    LaunchedEffect(device.id) { reload() }

    Text("Blocked sites", style = MaterialTheme.typography.titleMedium)
    Text(
        "Subdomains are covered automatically.",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )

    Row(modifier = Modifier.padding(top = 8.dp)) {
        OutlinedTextField(
            value = newSite,
            onValueChange = { newSite = it; error = null },
            label = { Text("example.com") },
            modifier = Modifier.weight(1f),
        )
        Button(
            onClick = {
                val domain = normalizeDomain(newSite)
                if (!isValidDomain(domain)) {
                    error = "Enter a domain, like example.com."
                    return@Button
                }
                scope.launch {
                    val result = supabase.addDeviceDomain(device.id, domain)
                    if (result.isSuccess) {
                        newSite = ""
                        reload()
                    } else {
                        error = result.exceptionOrNull()?.message
                    }
                }
            },
            modifier = Modifier.padding(start = 8.dp).align(androidx.compose.ui.Alignment.CenterVertically),
        ) { Text("Add") }
    }
    error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }

    if (loading) {
        CircularProgressIndicator(modifier = Modifier.padding(top = 8.dp))
    } else if (sites.isEmpty()) {
        Text(
            "No sites added yet.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 8.dp),
        )
    } else {
        Column(modifier = Modifier.padding(top = 4.dp)) {
            sites.forEach { domain ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(domain, modifier = Modifier.align(androidx.compose.ui.Alignment.CenterVertically))
                    IconButton(onClick = {
                        scope.launch {
                            val result = supabase.removeDeviceDomain(device.id, domain)
                            if (result.isSuccess) {
                                reload()
                            } else {
                                error = result.exceptionOrNull()?.message
                            }
                        }
                    }) {
                        Icon(Icons.Default.Delete, contentDescription = "Remove $domain")
                    }
                }
            }
        }
    }
}

@Composable
private fun WeeklyBedtimeSection(supabase: SupabaseClient, device: Device) {
    val scope = rememberCoroutineScope()
    var scheduleEnabled by remember { mutableStateOf(true) }
    val weeknights = setOf(0, 1, 2, 3, 4) // Sun-Thu nights, the nights before a school day, on by default
    val dayWindows = remember {
        mutableStateListOf(*Array(7) { i -> DayWindow(weeknights.contains(i), "21:00", "07:00") })
    }
    var focusedDay by remember { mutableStateOf(0) }
    var message by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    Text("Weekly bedtime", style = MaterialTheme.typography.titleMedium)
    Row(
        modifier = Modifier
            .padding(top = 4.dp)
            .clickable { scheduleEnabled = !scheduleEnabled },
    ) {
        Checkbox(checked = scheduleEnabled, onCheckedChange = { scheduleEnabled = it })
        Text("Enabled", modifier = Modifier.align(androidx.compose.ui.Alignment.CenterVertically))
    }
    Text(
        "Tap a day to block internet on it, and give it its own start/end time — every day can have a different bedtime.",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(top = 4.dp, bottom = 8.dp),
    )

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(bottom = 4.dp)) {
        DAY_LABELS.forEachIndexed { i, label ->
            val window = dayWindows[i]
            val bg = when {
                window.enabled -> MaterialTheme.colorScheme.primary
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
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
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )

    val focusedWindow = dayWindows[focusedDay]
    Row(modifier = Modifier.padding(top = 4.dp)) {
        OutlinedTextField(
            value = focusedWindow.startTime,
            onValueChange = { dayWindows[focusedDay] = focusedWindow.copy(startTime = it) },
            label = { Text("Start (HH:MM)") },
            modifier = Modifier.weight(1f),
        )
        OutlinedTextField(
            value = focusedWindow.endTime,
            onValueChange = { dayWindows[focusedDay] = focusedWindow.copy(endTime = it) },
            label = { Text("End (HH:MM)") },
            modifier = Modifier.weight(1f).padding(start = 8.dp),
        )
    }

    message?.let {
        Text(it, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 6.dp))
    }

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
            val perDay = JSONObject()
            dayWindows.forEachIndexed { i, w ->
                perDay.put(
                    i.toString(),
                    JSONObject().put("enabled", w.enabled).put("startTime", w.startTime).put("endTime", w.endTime),
                )
            }
            val payload = JSONObject().put("enabled", scheduleEnabled).put("perDay", perDay)
            scope.launch {
                supabase.sendCommand(device.id, "set_schedule", payload)
                    .onSuccess { message = "Saved." }
                    .onFailure { message = it.message ?: "Could not save the schedule." }
                busy = false
            }
        },
        modifier = Modifier.padding(top = 12.dp),
    ) { Text("Save weekly bedtime") }
}
