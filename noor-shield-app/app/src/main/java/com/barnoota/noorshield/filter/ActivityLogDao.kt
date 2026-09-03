package com.barnoota.noorshield.filter

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ActivityLogDao {
    @Insert
    suspend fun insert(entry: ActivityLogEntry)

    @Query("SELECT * FROM activity_log ORDER BY timestampMs DESC LIMIT :limit")
    fun observeRecent(limit: Int): Flow<List<ActivityLogEntry>>

    @Query("SELECT COUNT(*) FROM activity_log")
    fun observeCount(): Flow<Int>

    @Query("DELETE FROM activity_log")
    suspend fun clear()

    // Keeps the table bounded: after each insert, drop everything past the
    // newest [keep] rows so a phone left running for months doesn't grow
    // this table without limit.
    @Query(
        "DELETE FROM activity_log WHERE id IN " +
            "(SELECT id FROM activity_log ORDER BY timestampMs DESC LIMIT -1 OFFSET :keep)"
    )
    suspend fun trimToNewest(keep: Int)
}
