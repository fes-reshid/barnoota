package com.barnoota.noorshield.journal

import androidx.room.Entity
import androidx.room.PrimaryKey

/** A private, on-device log of a moment of tawbah — never uploaded anywhere. */
@Entity(tableName = "tawbah_entries")
data class TawbahEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestampMs: Long,
    val note: String,
    val istighfarCount: Int,
)
