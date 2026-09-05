package com.barnoota.noorshield.settings

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking

private val Context.dataStore by preferencesDataStore(name = "noor_shield_prefs")

/** User-facing on/off switches, persisted with DataStore so they survive process death and reboot. */
object NoorShieldPreferences {
    private val FILTER_ENABLED = booleanPreferencesKey("filter_enabled")

    fun observeFilterEnabled(context: Context): Flow<Boolean> =
        context.dataStore.data.map { it[FILTER_ENABLED] ?: false }

    suspend fun setFilterEnabled(context: Context, enabled: Boolean) {
        context.dataStore.edit { it[FILTER_ENABLED] = enabled }
    }

    /** Synchronous read for use from BroadcastReceiver.onReceive (e.g. after BOOT_COMPLETED). */
    fun isFilterEnabledBlocking(context: Context): Boolean =
        runBlocking { observeFilterEnabled(context).first() }
}
