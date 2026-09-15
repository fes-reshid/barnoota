package com.barnoota.noorshieldparent.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.barnoota.noorshieldparent.data.Device
import com.barnoota.noorshieldparent.network.SupabaseClient
import kotlinx.coroutines.launch

@Composable
fun DeviceListScreen(
    supabase: SupabaseClient,
    onOpenDevice: (Device) -> Unit,
    onSignOut: () -> Unit,
) {
    var devices by remember { mutableStateOf<List<Device>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var showPairing by remember { mutableStateOf(false) }
    var pairingCode by remember { mutableStateOf("") }
    var pairingBusy by remember { mutableStateOf(false) }
    var pairingError by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    suspend fun reload() {
        loading = true
        supabase.listDevices()
            .onSuccess { devices = it; error = null }
            .onFailure { error = it.message ?: "Could not load your devices." }
        loading = false
    }

    LaunchedEffect(Unit) { reload() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Your family's devices") },
                actions = {
                    TextButton(onClick = { scope.launch { supabase.signOut(); onSignOut() } }) {
                        Text("Sign out")
                    }
                },
            )
        },
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            if (loading) {
                CircularProgressIndicator()
            } else {
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

                if (devices.isEmpty() && error == null) {
                    Text(
                        "No PCs paired yet. On the PC, open Noor Shield's Parent Settings and start pairing, then enter the 6-digit code below.",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(bottom = 12.dp),
                    )
                }

                LazyColumn(modifier = Modifier.weight(1f, fill = false)) {
                    items(devices) { device ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            onClick = { onOpenDevice(device) },
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Column {
                                    Text(device.name, style = MaterialTheme.typography.titleMedium)
                                    Text(
                                        "Last checked in ${timeAgo(device.lastSeenAt)}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                Icon(Icons.Default.ChevronRight, contentDescription = null)
                            }
                        }
                    }
                }

                if (showPairing) {
                    OutlinedTextField(
                        value = pairingCode,
                        onValueChange = { pairingCode = it.filter { c -> c.isDigit() }.take(6); pairingError = null },
                        label = { Text("6-digit code from the PC") },
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    )
                    pairingError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    Row(modifier = Modifier.padding(top = 8.dp)) {
                        OutlinedButton(
                            enabled = pairingCode.length == 6 && !pairingBusy,
                            onClick = {
                                pairingBusy = true
                                pairingError = null
                                scope.launch {
                                    val result = supabase.claimPairingCode(pairingCode, null)
                                    if (result.isSuccess) {
                                        showPairing = false
                                        pairingCode = ""
                                        reload()
                                    } else {
                                        pairingError = result.exceptionOrNull()?.message ?: "Could not pair that PC."
                                    }
                                    pairingBusy = false
                                }
                            },
                        ) { Text("Pair") }
                        TextButton(onClick = { showPairing = false; pairingCode = ""; pairingError = null }) {
                            Text("Cancel")
                        }
                    }
                } else {
                    OutlinedButton(
                        onClick = { showPairing = true },
                        modifier = Modifier.padding(top = 12.dp),
                    ) { Text("Pair a new PC") }
                }
            }
        }
    }
}

private fun timeAgo(isoTimestamp: String?): String {
    if (isoTimestamp == null) return "never"
    return try {
        val instant = java.time.Instant.parse(isoTimestamp)
        val minutes = java.time.Duration.between(instant, java.time.Instant.now()).toMinutes()
        when {
            minutes < 1 -> "just now"
            minutes < 60 -> "$minutes min ago"
            minutes < 60 * 24 -> "${minutes / 60} hr ago"
            else -> "${minutes / (60 * 24)} days ago"
        }
    } catch (e: Exception) {
        "unknown"
    }
}
