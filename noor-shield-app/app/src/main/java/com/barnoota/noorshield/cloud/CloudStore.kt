package com.barnoota.noorshield.cloud

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import java.util.UUID

private val Context.cloudDataStore by preferencesDataStore(name = "noor_shield_cloud")

data class PendingPairing(val code: String, val startedAtMs: Long)

/**
 * Persists everything remote-control-related — pairing state, the schedule,
 * the parent-added-remotely site list, a remote-issued sleep override, and
 * license/trial state — the same shape and roles as
 * noor-shield-pc/src/main/store.js's `cloud`/`schedule`/`cloudBlockedDomains`/
 * `forceSleepUntil`/`license`/`firstRunAt`/`activated` fields.
 */
object CloudStore {
    private object Keys {
        val DEVICE_SECRET = stringPreferencesKey("device_secret")
        val DEVICE_ID = stringPreferencesKey("device_id")
        val PENDING_CODE = stringPreferencesKey("pending_pairing_code")
        val PENDING_STARTED_AT = longPreferencesKey("pending_pairing_started_at")
        val FORCE_SLEEP_UNTIL = longPreferencesKey("force_sleep_until")
        val REMOTE_LOCK_ACTIVE = booleanPreferencesKey("remote_lock_active")
        val CLOUD_BLOCKED_DOMAINS = stringSetPreferencesKey("cloud_blocked_domains")
        val SCHEDULE_JSON = stringPreferencesKey("schedule_json")
        val LICENSE_DEVICE_ID = stringPreferencesKey("license_device_id")
        val ACTIVATED = booleanPreferencesKey("activated")
        val FIRST_RUN_AT = longPreferencesKey("first_run_at")
    }

    // ---- pairing / device identity ----

    suspend fun deviceSecret(context: Context): String? = context.cloudDataStore.data.first()[Keys.DEVICE_SECRET]
    suspend fun deviceId(context: Context): String? = context.cloudDataStore.data.first()[Keys.DEVICE_ID]

    fun observeDeviceId(context: Context): Flow<String?> = context.cloudDataStore.data.map { it[Keys.DEVICE_ID] }

    suspend fun ensureDeviceSecret(context: Context): String {
        val existing = deviceSecret(context)
        if (existing != null) return existing
        val fresh = UUID.randomUUID().toString() + UUID.randomUUID().toString()
        context.cloudDataStore.edit { it[Keys.DEVICE_SECRET] = fresh }
        return fresh
    }

    suspend fun setPendingPairing(context: Context, pending: PendingPairing?) {
        context.cloudDataStore.edit { prefs ->
            if (pending == null) {
                prefs.remove(Keys.PENDING_CODE)
                prefs.remove(Keys.PENDING_STARTED_AT)
            } else {
                prefs[Keys.PENDING_CODE] = pending.code
                prefs[Keys.PENDING_STARTED_AT] = pending.startedAtMs
            }
        }
    }

    suspend fun pendingPairing(context: Context): PendingPairing? {
        val prefs = context.cloudDataStore.data.first()
        val code = prefs[Keys.PENDING_CODE] ?: return null
        val startedAt = prefs[Keys.PENDING_STARTED_AT] ?: return null
        return PendingPairing(code, startedAt)
    }

    suspend fun setPaired(context: Context, deviceId: String) {
        context.cloudDataStore.edit { prefs ->
            prefs[Keys.DEVICE_ID] = deviceId
            prefs.remove(Keys.PENDING_CODE)
            prefs.remove(Keys.PENDING_STARTED_AT)
        }
    }

    /** Clears local pairing state only — CloudSync.unpair() also tells Supabase, see there. */
    suspend fun clearPairing(context: Context) {
        context.cloudDataStore.edit { prefs ->
            prefs.remove(Keys.DEVICE_SECRET)
            prefs.remove(Keys.DEVICE_ID)
            prefs.remove(Keys.PENDING_CODE)
            prefs.remove(Keys.PENDING_STARTED_AT)
            prefs.remove(Keys.FORCE_SLEEP_UNTIL)
        }
    }

    // ---- remote-enforced sleep / lock ----

    suspend fun forceSleepUntil(context: Context): Long? = context.cloudDataStore.data.first()[Keys.FORCE_SLEEP_UNTIL]

    suspend fun setForceSleepUntil(context: Context, untilMs: Long?) {
        context.cloudDataStore.edit { prefs ->
            if (untilMs == null) prefs.remove(Keys.FORCE_SLEEP_UNTIL) else prefs[Keys.FORCE_SLEEP_UNTIL] = untilMs
        }
    }

    fun observeRemoteLockActive(context: Context): Flow<Boolean> =
        context.cloudDataStore.data.map { it[Keys.REMOTE_LOCK_ACTIVE] ?: false }

    suspend fun isRemoteLockActive(context: Context): Boolean =
        context.cloudDataStore.data.first()[Keys.REMOTE_LOCK_ACTIVE] ?: false

    suspend fun setRemoteLockActive(context: Context, active: Boolean) {
        context.cloudDataStore.edit { it[Keys.REMOTE_LOCK_ACTIVE] = active }
    }

    // ---- parent-added-remotely blocked sites ----

    suspend fun cloudBlockedDomains(context: Context): Set<String> =
        context.cloudDataStore.data.first()[Keys.CLOUD_BLOCKED_DOMAINS] ?: emptySet()

    fun observeCloudBlockedDomains(context: Context): Flow<Set<String>> =
        context.cloudDataStore.data.map { it[Keys.CLOUD_BLOCKED_DOMAINS] ?: emptySet() }

    suspend fun setCloudBlockedDomains(context: Context, domains: Set<String>) {
        context.cloudDataStore.edit { it[Keys.CLOUD_BLOCKED_DOMAINS] = domains }
    }

    // ---- schedule ----

    fun observeSchedule(context: Context): Flow<Schedule> =
        context.cloudDataStore.data.map { prefs ->
            prefs[Keys.SCHEDULE_JSON]?.let { Schedule.fromJson(JSONObject(it)) } ?: Schedule.EMPTY
        }

    suspend fun schedule(context: Context): Schedule = observeSchedule(context).first()

    suspend fun setSchedule(context: Context, schedule: Schedule) {
        context.cloudDataStore.edit { it[Keys.SCHEDULE_JSON] = schedule.toJson().toString() }
    }

    // ---- licensing / trial (see license/License.kt) ----

    suspend fun licenseDeviceId(context: Context): String {
        val existing = context.cloudDataStore.data.first()[Keys.LICENSE_DEVICE_ID]
        if (existing != null) return existing
        val fresh = UUID.randomUUID().toString()
        context.cloudDataStore.edit { it[Keys.LICENSE_DEVICE_ID] = fresh }
        return fresh
    }

    fun observeActivated(context: Context): Flow<Boolean> =
        context.cloudDataStore.data.map { it[Keys.ACTIVATED] ?: false }

    suspend fun isActivated(context: Context): Boolean = context.cloudDataStore.data.first()[Keys.ACTIVATED] ?: false

    suspend fun setActivated(context: Context, activated: Boolean) {
        context.cloudDataStore.edit { it[Keys.ACTIVATED] = activated }
    }

    suspend fun ensureFirstRunAt(context: Context): Long {
        val existing = context.cloudDataStore.data.first()[Keys.FIRST_RUN_AT]
        if (existing != null) return existing
        val now = System.currentTimeMillis()
        context.cloudDataStore.edit { it[Keys.FIRST_RUN_AT] = now }
        return now
    }

    fun observeFirstRunAt(context: Context): Flow<Long?> = context.cloudDataStore.data.map { it[Keys.FIRST_RUN_AT] }

    /** Synchronous read for use off a Compose/coroutine context. */
    fun isRemoteLockActiveBlocking(context: Context): Boolean = runBlocking { isRemoteLockActive(context) }
}
