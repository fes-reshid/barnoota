package com.barnoota.noorshield.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.barnoota.noorshield.journal.JournalViewModel
import java.text.DateFormat
import java.util.Date

@Composable
fun JournalScreen() {
    val context = LocalContext.current
    val viewModel: JournalViewModel = viewModel(
        factory = androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.getInstance(
            context.applicationContext as android.app.Application
        ),
    )
    val entries by viewModel.entries.collectAsState(initial = emptyList())
    val totalIstighfar by viewModel.totalIstighfar.collectAsState(initial = 0)

    var note by remember { mutableStateOf("") }
    var count by remember { mutableStateOf("33") }

    LazyColumn(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("A private space between you and Allah", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "Nothing here is uploaded or shared. Use it to log a moment of tawbah and the istighfar you made.",
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                    Text(
                        "Total istighfar logged: $totalIstighfar",
                        style = MaterialTheme.typography.bodyLarge,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it },
                        label = { Text("Note (optional)") },
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    )
                    OutlinedTextField(
                        value = count,
                        onValueChange = { count = it.filter(Char::isDigit) },
                        label = { Text("Istighfar count") },
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    )
                    Button(
                        onClick = {
                            viewModel.logTawbah(note, count.toIntOrNull() ?: 0)
                            note = ""
                        },
                        modifier = Modifier.padding(top = 12.dp),
                    ) {
                        Text("Log tawbah")
                    }
                }
            }
        }

        items(entries) { entry ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text(DateFormat.getDateTimeInstance().format(Date(entry.timestampMs)))
                        if (entry.note.isNotBlank()) Text(entry.note, style = MaterialTheme.typography.bodySmall)
                    }
                    Text("${entry.istighfarCount}x istighfar", style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}
