package com.barnoota.noorshield.ui.screens

import android.content.Intent
import android.net.Uri
import android.net.VpnService
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.barnoota.noorshield.filter.BlockVpnService
import com.barnoota.noorshield.settings.NoorShieldPreferences
import com.barnoota.noorshield.ui.PermissionStatus
import kotlinx.coroutines.launch

private data class ProtectionStep(val title: String, val detail: String, val granted: Boolean, val action: () -> Unit)

@Composable
fun DashboardScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var filterEnabled by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        NoorShieldPreferences.observeFilterEnabled(context).collect { filterEnabled = it }
    }
    var vpnPrepared by remember { mutableStateOf(PermissionStatus.isVpnPrepared(context)) }
    var overlayGranted by remember { mutableStateOf(PermissionStatus.canDrawOverlays(context)) }
    var accessibilityGranted by remember { mutableStateOf(PermissionStatus.isAccessibilityServiceEnabled(context)) }

    // Settings toggles for accessibility/overlay happen in the system Settings app, outside our
    // process, so re-check them whenever the user comes back to this screen.
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                vpnPrepared = PermissionStatus.isVpnPrepared(context)
                overlayGranted = PermissionStatus.canDrawOverlays(context)
                accessibilityGranted = PermissionStatus.isAccessibilityServiceEnabled(context)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val vpnLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        vpnPrepared = PermissionStatus.isVpnPrepared(context)
        if (vpnPrepared) {
            BlockVpnService.start(context)
            scope.launch { NoorShieldPreferences.setFilterEnabled(context, true) }
            filterEnabled = true
        }
    }

    LazyColumn(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Protection", style = androidx.compose.material3.MaterialTheme.typography.titleLarge)
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(if (filterEnabled) "Active" else "Off")
                        Switch(
                            checked = filterEnabled,
                            onCheckedChange = { checked ->
                                if (checked) {
                                    val intent = VpnService.prepare(context)
                                    if (intent != null) vpnLauncher.launch(intent) else {
                                        BlockVpnService.start(context)
                                        scope.launch { NoorShieldPreferences.setFilterEnabled(context, true) }
                                        filterEnabled = true
                                    }
                                } else {
                                    BlockVpnService.stop(context)
                                    scope.launch { NoorShieldPreferences.setFilterEnabled(context, false) }
                                    filterEnabled = false
                                }
                            },
                        )
                    }
                }
            }
        }

        item {
            Text(
                "Setup checklist",
                style = androidx.compose.material3.MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 8.dp),
            )
        }

        val steps = listOf(
            ProtectionStep(
                title = "Network filter (blocks known adult sites for the whole phone)",
                detail = "Requires the Android VPN permission. No traffic leaves your device — this VPN never leaves the phone.",
                granted = vpnPrepared,
                action = {
                    val intent = VpnService.prepare(context)
                    if (intent != null) vpnLauncher.launch(intent)
                },
            ),
            ProtectionStep(
                title = "Screen guard (blurs explicit images in any app)",
                detail = "Requires enabling the Accessibility Service for Noor Shield.",
                granted = accessibilityGranted,
                action = { context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) },
            ),
            ProtectionStep(
                title = "Display over other apps (needed to show the blur/reminder screen)",
                detail = "Requires the overlay permission.",
                granted = overlayGranted,
                action = {
                    context.startActivity(
                        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
                    )
                },
            ),
        )

        items(steps) { step ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(
                        imageVector = if (step.granted) Icons.Filled.CheckCircle else Icons.Filled.Warning,
                        contentDescription = null,
                        tint = if (step.granted) Color(0xFF2E7D32) else Color(0xFFB26A00),
                        modifier = Modifier.size(28.dp),
                    )
                    Column(Modifier.weight(1f)) {
                        Text(step.title, style = androidx.compose.material3.MaterialTheme.typography.bodyLarge)
                        Text(step.detail, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
                        if (!step.granted) {
                            Button(onClick = step.action, modifier = Modifier.padding(top = 8.dp)) {
                                Text("Enable")
                            }
                        }
                    }
                }
            }
        }
    }
}
