package com.barnoota.noorshield.filter

import androidx.room.Entity
import androidx.room.PrimaryKey

/** A domain the user added themselves, on top of the built-in seed blocklist. */
@Entity(tableName = "custom_blocked_domains")
data class CustomBlockedDomain(
    @PrimaryKey val domain: String,
    val addedAtMs: Long,
)
