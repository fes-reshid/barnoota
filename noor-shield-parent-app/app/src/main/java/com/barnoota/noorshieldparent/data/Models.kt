package com.barnoota.noorshieldparent.data

/** Mirrors a row of public.devices (see noor-shield-pc/cloud/schema.sql). */
data class Device(
    val id: String,
    val name: String,
    val pairedAt: String,
    val lastSeenAt: String?,
)

/** One day's bedtime window — see noor-shield-pc/src/main/schedule.js for the exact matching rules this mirrors. */
data class DayWindow(
    val enabled: Boolean,
    val startTime: String,
    val endTime: String,
)

val DAY_LABELS = listOf("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa")
val DAY_NAMES = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
