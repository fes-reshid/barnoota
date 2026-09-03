package com.barnoota.noorshield.journal

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.barnoota.noorshield.filter.ActivityLogDao
import com.barnoota.noorshield.filter.ActivityLogEntry
import com.barnoota.noorshield.filter.CustomBlockedDomain
import com.barnoota.noorshield.filter.CustomBlockedDomainDao

@Database(
    entities = [TawbahEntry::class, CustomBlockedDomain::class, ActivityLogEntry::class],
    version = 3,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun tawbahDao(): TawbahDao
    abstract fun customBlockedDomainDao(): CustomBlockedDomainDao
    abstract fun activityLogDao(): ActivityLogDao

    companion object {
        @Volatile private var instance: AppDatabase? = null

        fun get(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "noor_shield.db",
                )
                    // No released version to migrate from yet; revisit before shipping an update.
                    .fallbackToDestructiveMigration()
                    .build().also { instance = it }
            }
    }
}
