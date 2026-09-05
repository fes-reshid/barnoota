package com.barnoota.noorshield.journal

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface TawbahDao {
    @Insert
    suspend fun insert(entry: TawbahEntry)

    @Query("SELECT * FROM tawbah_entries ORDER BY timestampMs DESC")
    fun observeAll(): Flow<List<TawbahEntry>>

    @Query("SELECT COALESCE(SUM(istighfarCount), 0) FROM tawbah_entries")
    fun observeTotalIstighfar(): Flow<Int>

    @Query("SELECT COUNT(*) FROM tawbah_entries")
    fun observeEntryCount(): Flow<Int>
}
