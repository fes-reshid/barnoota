package com.barnoota.noorshield.filter

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface CustomBlockedDomainDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(domain: CustomBlockedDomain)

    @Delete
    suspend fun delete(domain: CustomBlockedDomain)

    @Query("SELECT * FROM custom_blocked_domains ORDER BY addedAtMs DESC")
    fun observeAll(): Flow<List<CustomBlockedDomain>>

    @Query("SELECT domain FROM custom_blocked_domains")
    suspend fun allDomainsOnce(): List<String>
}
