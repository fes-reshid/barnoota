package com.barnoota.noorshield.filter

import android.content.Context
import com.barnoota.noorshield.journal.AppDatabase
import kotlinx.coroutines.flow.Flow

/**
 * Records blocked attempts for the parent to review — see README for why
 * this is scoped to blocked domains only, not a full browsing history.
 */
object ActivityLogRepository {
    // Bounds the log so a phone left running for months doesn't grow it
    // without limit. Kept identical to the PC app's MAX_ACTIVITY_ENTRIES.
    const val MAX_ENTRIES = 2000

    private fun dao(context: Context) = AppDatabase.get(context).activityLogDao()

    suspend fun record(context: Context, domain: String) {
        val db = dao(context)
        db.insert(ActivityLogEntry(domain = domain, timestampMs = System.currentTimeMillis()))
        db.trimToNewest(MAX_ENTRIES)
    }

    fun observeRecent(context: Context, limit: Int = 500): Flow<List<ActivityLogEntry>> =
        dao(context).observeRecent(limit)

    fun observeCount(context: Context): Flow<Int> = dao(context).observeCount()

    suspend fun clear(context: Context) {
        dao(context).clear()
    }
}
