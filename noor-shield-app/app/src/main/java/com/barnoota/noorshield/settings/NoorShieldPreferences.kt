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
    private val VPN_CONSENT_PROMPTED = booleanPreferencesKey("vpn_consent_prompted")

    /**
     * Defaults to true: Noor Shield is meant to block adult content out of the box, not after a
     * manual opt-in. The one thing that genuinely requires the user to act is Android's own VPN
     * consent dialog (see [hasPromptedVpnConsent]/[setVpnConsentPrompted]) — the OS will not let
     * any app skip that, for any user's protection, including this one's.
     */
    fun observeFilterEnabled(context: Context): Flow<Boolean> =
        context.dataStore.data.map { it[FILTER_ENABLED] ?: true }

    suspend fun setFilterEnabled(context: Context, enabled: Boolean) {
        context.dataStore.edit { it[FILTER_ENABLED] = enabled }
    }

    /** Synchronous read for use from BroadcastReceiver.onReceive (e.g. after BOOT_COMPLETED). */
    fun isFilterEnabledBlocking(context: Context): Boolean =
        runBlocking { observeFilterEnabled(context).first() }

    /** Whether we've already auto-triggered Android's VPN consent dialog once, so we don't nag on every launch. */
    fun observeVpnConsentPrompted(context: Context): Flow<Boolean> =
        context.dataStore.data.map { it[VPN_CONSENT_PROMPTED] ?: false }

    suspend fun setVpnConsentPrompted(context: Context, prompted: Boolean) {
        context.dataStore.edit { it[VPN_CONSENT_PROMPTED] = prompted }
    }
}
