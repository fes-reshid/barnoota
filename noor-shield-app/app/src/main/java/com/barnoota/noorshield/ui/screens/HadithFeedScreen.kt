package com.barnoota.noorshield.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import com.barnoota.noorshield.reminders.HadithCategory
import com.barnoota.noorshield.reminders.HadithRepository

private fun categoryLabel(category: HadithCategory): String = when (category) {
    HadithCategory.LOWER_GAZE -> "Lowering the Gaze"
    HadithCategory.TAWBAH -> "Tawbah (Repentance)"
    HadithCategory.ISTIGHFAR -> "Istighfar (Seeking Forgiveness)"
    HadithCategory.AKHIRAH -> "Remembering the Akhirah"
    HadithCategory.PRIVATE_SIN -> "The Danger of Sinning in Private"
}

@Composable
fun HadithFeedScreen() {
    LazyColumn(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(HadithRepository.all) { hadith ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text(categoryLabel(hadith.category), style = MaterialTheme.typography.labelLarge)
                    Text(hadith.text, modifier = Modifier.padding(top = 8.dp))
                    Text(
                        "${hadith.source} (${hadith.grading})",
                        style = MaterialTheme.typography.bodySmall.copy(fontStyle = FontStyle.Italic),
                        modifier = Modifier.padding(top = 8.dp),
                    )
                }
            }
        }
    }
}
