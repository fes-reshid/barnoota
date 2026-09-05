package com.barnoota.noorshield.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.IconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
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
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import com.barnoota.noorshield.filter.AddDomainResult
import com.barnoota.noorshield.filter.BlocklistRepository
import com.barnoota.noorshield.filter.CustomBlockedDomain
import kotlinx.coroutines.launch

/**
 * Lets the user type in a website to block on top of the built-in seed list — for anything
 * personal experience turns up that Noor Shield doesn't already cover. Entries take effect
 * immediately: if the filter is currently on, [BlocklistRepository] tells the running VPN
 * service to reload without dropping the connection.
 */
@Composable
fun BlocklistScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var input by remember { mutableStateOf("") }
    var message by remember { mutableStateOf<String?>(null) }
    var customDomains by remember { mutableStateOf<List<CustomBlockedDomain>>(emptyList()) }

    LaunchedEffect(Unit) {
        BlocklistRepository.observeCustomDomains(context).collect { customDomains = it }
    }

    fun submit() {
        val toAdd = input
        scope.launch {
            when (val result = BlocklistRepository.addDomain(context, toAdd)) {
                is AddDomainResult.Added -> {
                    message = "Blocked \"${BlocklistRepository.normalize(toAdd)}\"."
                    input = ""
                }
                is AddDomainResult.AlreadyBlocked -> message = "That site is already blocked."
                is AddDomainResult.Invalid -> message = result.reason
            }
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Block a website", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "Add a site you've come across that isn't already blocked — a domain like " +
                            "\"example.com\" is enough, the whole site and its subdomains are covered.",
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                    OutlinedTextField(
                        value = input,
                        onValueChange = {
                            input = it
                            message = null
                        },
                        label = { Text("Website address") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Uri,
                            imeAction = ImeAction.Done,
                        ),
                        keyboardActions = KeyboardActions(onDone = { submit() }),
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    )
                    Button(onClick = ::submit, modifier = Modifier.padding(top = 8.dp)) {
                        Text("Add to blocklist")
                    }
                    message?.let {
                        Text(
                            it,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 8.dp),
                        )
                    }
                }
            }
        }

        item {
            Text(
                if (customDomains.isEmpty()) "No custom sites added yet" else "Sites you've added (${customDomains.size})",
                style = MaterialTheme.typography.titleSmall,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        items(customDomains, key = { it.domain }) { entry ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(entry.domain, modifier = Modifier.weight(1f).padding(vertical = 12.dp))
                    IconButton(onClick = { scope.launch { BlocklistRepository.removeDomain(context, entry) } }) {
                        Icon(Icons.Filled.Delete, contentDescription = "Remove ${entry.domain}")
                    }
                }
            }
        }

        item {
            Text(
                "Adding a site here does not remove it from the internet for anyone else — it only " +
                    "stops it from resolving on this device while Noor Shield's filter is on.",
                style = MaterialTheme.typography.bodySmall.copy(fontStyle = FontStyle.Italic),
                modifier = Modifier.padding(top = 8.dp),
            )
        }
    }
}
