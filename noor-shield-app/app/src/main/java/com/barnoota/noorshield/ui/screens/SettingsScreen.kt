package com.barnoota.noorshield.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen() {
    Column(
        modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("About Noor Shield", style = MaterialTheme.typography.titleLarge)

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text("What this app actually does", style = MaterialTheme.typography.titleSmall)
                Text(
                    "• Blocks a list of known adult-content domains at the DNS level, for every app " +
                        "on this device (not just this app's own browser).\n" +
                        "• On Android 11+, watches the screen for images the on-device classifier " +
                        "flags as explicit and covers them with a reminder instead.\n" +
                        "• Sends periodic Hadith reminders about lowering the gaze, remembering the " +
                        "Akhirah, and the virtue of tawbah and istighfar.\n" +
                        "• Keeps a private, on-device tawbah journal and istighfar counter — nothing " +
                        "is uploaded anywhere.",
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text("Honest limitations", style = MaterialTheme.typography.titleSmall)
                Text(
                    "• No app can guarantee zero explicit content ever. This is one more barrier and " +
                        "reminder, not a substitute for the intention (niyyah) to lower the gaze.\n" +
                        "• The domain blocklist is a starting seed list — expand it with a maintained " +
                        "list for real coverage (see README).\n" +
                        "• The on-screen image detector shipped in this build is a simple placeholder, " +
                        "not a trained model — expect false positives/negatives until it's replaced.\n" +
                        "• Content reached via IP address, some private/incognito DNS setups, or apps " +
                        "using DNS-over-HTTPS to a fixed resolver can bypass the network filter.\n" +
                        "• On Android 8-10 the screen-image detector is unavailable; only the network " +
                        "filter runs there.",
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text("A word of encouragement", style = MaterialTheme.typography.titleSmall)
                Text(
                    "\"Say to the believing men that they should lower their gaze and guard their " +
                        "modesty: that will make for greater purity for them.\" (Qur'an, An-Nur 24:30)\n\n" +
                        "Whatever led you here, the door of tawbah is open. Use the Journal tab whenever " +
                        "you need it.",
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}
