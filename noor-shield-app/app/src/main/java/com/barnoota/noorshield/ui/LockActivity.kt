package com.barnoota.noorshield.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import com.barnoota.noorshield.settings.ParentActionResult
import com.barnoota.noorshield.settings.ParentAuth
import com.barnoota.noorshield.ui.theme.NoorShieldTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Full-screen "ask your parent" overlay shown while a remote lock_computer
 * command is active — the phone equivalent of
 * noor-shield-pc/src/renderer/lock-overlay.html. Unlocks the moment
 * CloudStore's remoteLockActive flag clears (polled by BlockVpnService's
 * cloud sync loop, or the parent password fallback below).
 *
 * Important honest limitation, unlike the PC app: Android gives a regular
 * (non-device-owner) app no way to block the Home button or the recent-apps
 * switcher the way Windows' Fast-User-Switching block works — a child can
 * always leave this screen via Home. All this screen can do is come back to
 * the front the next time the app (or this activity specifically) is
 * revisited, for as long as the lock is still active. Real enforcement here
 * would need Android's Device Owner / Lock Task mode, which requires the
 * phone to be provisioned as a managed device — out of scope for a regular
 * Play Store install.
 */
class LockActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NoorShieldTheme {
                LockScreen(onUnlocked = { finish() })
            }
        }
    }

    companion object {
        fun show(context: Context) {
            val intent = Intent(context, LockActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            context.startActivity(intent)
        }
    }
}

@Composable
private fun LockScreen(onUnlocked: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    BackHandler(enabled = true) { /* swallow back — see class doc for the real limit here */ }

    // Polls the same flag BlockVpnService's cloud sync loop writes, so this screen also closes
    // itself the moment the parent unlocks from the dashboard/phone app, not just from here.
    LaunchedEffect(Unit) {
        while (true) {
            delay(3_000)
            if (!CloudStore.isRemoteLockActive(context)) {
                onUnlocked()
                return@LaunchedEffect
            }
        }
    }

    var showFallback by remember { mutableStateOf(false) }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Icon(
                Icons.Filled.Security,
                contentDescription = null,
                modifier = Modifier.padding(bottom = 16.dp),
                tint = MaterialTheme.colorScheme.secondary,
            )
            Text("Your parent has locked this phone.", style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)

            Text(
                "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدوٰا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا",
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 20.dp),
            )
            Text(
                "\"And your Lord has decreed that you worship none but Him, and that you be dutiful to your parents.\"",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp),
            )
            Text(
                "Qur'an, Al-Isra 17:23",
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(top = 4.dp),
            )

            Text(
                "Please listen to your parent, and wait patiently until they open it for you — do not " +
                    "pressure or nag them. This screen will disappear on its own the moment they do.",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 24.dp),
            )

            if (!showFallback) {
                TextButton(onClick = { showFallback = true }, modifier = Modifier.padding(top = 16.dp)) {
                    Text("Parent: enter the app password instead")
                }
            } else {
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; error = null },
                    label = { Text("Parent password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                )
                error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 4.dp)) }
                Button(
                    enabled = !busy && password.isNotBlank(),
                    onClick = {
                        busy = true
                        error = null
                        scope.launch {
                            when (val result = ParentAuth.unlock(context, password)) {
                                is ParentActionResult.Ok -> {
                                    CloudStore.setRemoteLockActive(context, false)
                                    onUnlocked()
                                }
                                is ParentActionResult.Failed -> error = result.reason
                            }
                            busy = false
                        }
                    },
                    modifier = Modifier.padding(top = 12.dp),
                ) { Text("Unlock") }
            }
        }
    }
}
