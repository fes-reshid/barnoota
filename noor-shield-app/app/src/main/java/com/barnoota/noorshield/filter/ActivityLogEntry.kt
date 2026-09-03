package com.barnoota.noorshield.filter

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * One blocked DNS lookup. Deliberately narrow in scope (see README): this is
 * a record of what the filter caught, not a full browsing history — allowed
 * lookups are never recorded here.
 */
@Entity(tableName = "activity_log")
data class ActivityLogEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val domain: String,
    val timestampMs: Long,
)
