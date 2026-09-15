package com.barnoota.noorshield.cloud

import org.json.JSONObject
import java.util.Calendar

/**
 * Kotlin port of noor-shield-pc/src/main/schedule.js — kept behaviorally
 * identical (including the crossing-midnight math) so a schedule set from
 * the PC app, the web dashboard, or this phone app is interpreted exactly
 * the same way everywhere, and so a set_schedule command sent from any of
 * them (payload: {enabled, perDay: {"0": {enabled,startTime,endTime}, ...}})
 * works here unchanged.
 */
data class DayWindow(val enabled: Boolean, val startTime: String, val endTime: String)

data class Schedule(val enabled: Boolean, val perDay: Map<Int, DayWindow>) {
    fun toJson(): JSONObject {
        val perDayJson = JSONObject()
        perDay.forEach { (day, window) ->
            perDayJson.put(
                day.toString(),
                JSONObject().put("enabled", window.enabled).put("startTime", window.startTime).put("endTime", window.endTime),
            )
        }
        return JSONObject().put("enabled", enabled).put("perDay", perDayJson)
    }

    companion object {
        val EMPTY = Schedule(enabled = false, perDay = emptyMap())

        fun fromJson(json: JSONObject): Schedule? {
            return try {
                val enabled = json.getBoolean("enabled")
                val perDayJson = json.getJSONObject("perDay")
                val perDay = mutableMapOf<Int, DayWindow>()
                perDayJson.keys().forEach { key ->
                    val day = key.toIntOrNull() ?: return@forEach
                    val w = perDayJson.getJSONObject(key)
                    perDay[day] = DayWindow(
                        enabled = w.getBoolean("enabled"),
                        startTime = w.getString("startTime"),
                        endTime = w.getString("endTime"),
                    )
                }
                Schedule(enabled, perDay)
            } catch (e: Exception) {
                null
            }
        }
    }
}

private fun parseHHMM(value: String?): Int? {
    val match = Regex("^(\\d{1,2}):(\\d{2})$").find(value ?: return null) ?: return null
    val hours = match.groupValues[1].toIntOrNull() ?: return null
    val minutes = match.groupValues[2].toIntOrNull() ?: return null
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
    return hours * 60 + minutes
}

private fun isValidDayWindow(window: DayWindow?): Boolean {
    if (window == null) return false
    if (!window.enabled) return true
    val start = parseHHMM(window.startTime)
    val end = parseHHMM(window.endTime)
    return start != null && end != null && start != end
}

fun isValidSchedule(schedule: Schedule?): Boolean {
    if (schedule == null || schedule.perDay.isEmpty()) return false
    return schedule.perDay.all { (day, window) -> day in 0..6 && isValidDayWindow(window) }
}

/** True if `now` falls inside one of the schedule's enabled per-day windows. */
fun isWithinSchedule(schedule: Schedule?, now: Calendar = Calendar.getInstance()): Boolean {
    if (schedule == null || !schedule.enabled || !isValidSchedule(schedule)) return false

    // Calendar.DAY_OF_WEEK is 1=Sunday..7=Saturday; our days are 0=Sunday..6=Saturday.
    val today = now.get(Calendar.DAY_OF_WEEK) - 1
    val yesterday = (today + 6) % 7
    val minutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)

    val todayWindow = schedule.perDay[today]
    if (todayWindow != null && todayWindow.enabled) {
        val start = parseHHMM(todayWindow.startTime)
        val end = parseHHMM(todayWindow.endTime)
        if (start != null && end != null) {
            if (start < end) {
                if (minutes >= start && minutes < end) return true
            } else if (minutes >= start) {
                return true
            }
        }
    }

    val yesterdayWindow = schedule.perDay[yesterday]
    if (yesterdayWindow != null && yesterdayWindow.enabled) {
        val start = parseHHMM(yesterdayWindow.startTime)
        val end = parseHHMM(yesterdayWindow.endTime)
        if (start != null && end != null && start >= end && minutes < end) return true
    }

    return false
}

/** For status display: minutes until the current active window ends, if one is active. */
fun minutesUntilScheduleEnds(schedule: Schedule?, now: Calendar = Calendar.getInstance()): Int? {
    if (!isWithinSchedule(schedule, now)) return null
    val today = now.get(Calendar.DAY_OF_WEEK) - 1
    val yesterday = (today + 6) % 7
    val minutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)

    val todayWindow = schedule!!.perDay[today]
    if (todayWindow != null && todayWindow.enabled) {
        val start = parseHHMM(todayWindow.startTime)
        val end = parseHHMM(todayWindow.endTime)
        if (start != null && end != null) {
            if (start < end && minutes >= start && minutes < end) return end - minutes
            if (start >= end && minutes >= start) return 24 * 60 - minutes + end
        }
    }

    val yesterdayWindow = schedule.perDay[yesterday]
    if (yesterdayWindow != null && yesterdayWindow.enabled) {
        val start = parseHHMM(yesterdayWindow.startTime)
        val end = parseHHMM(yesterdayWindow.endTime)
        if (start != null && end != null && start >= end && minutes < end) return end - minutes
    }

    return null
}
