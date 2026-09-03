package com.barnoota.noorshield.journal

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

class JournalViewModel(application: Application) : AndroidViewModel(application) {
    private val dao = AppDatabase.get(application).tawbahDao()

    val entries = dao.observeAll()
    val totalIstighfar = dao.observeTotalIstighfar()
    val entryCount = dao.observeEntryCount()

    fun logTawbah(note: String, istighfarCount: Int) {
        viewModelScope.launch {
            dao.insert(
                TawbahEntry(
                    timestampMs = System.currentTimeMillis(),
                    note = note,
                    istighfarCount = istighfarCount,
                )
            )
        }
    }
}
