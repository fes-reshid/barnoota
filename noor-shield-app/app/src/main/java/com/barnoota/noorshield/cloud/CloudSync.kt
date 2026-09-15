package com.barnoota.noorshield.cloud

import android.content.Context
import android.os.Build
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlin.random.Random

/**
 * Kotlin port of noor-shield-pc/service/cloudSync.js: lets a parent enforce
 * bedtime, blocked sites, or lock this device from the same web dashboard
 * or phone app used for the PC — calling the exact same Supabase functions
 * (see cloud/schema.sql), so this device is just another row in `devices`,
 * indistinguishable from a paired PC to the parent-facing side.
 *
 * Five commands are implemented, matching the PC app: enforce_sleep_now,
 * cancel_sleep_now, lock_computer (locks this device, see LockActivity),
 * unlock_computer, set_schedule. `shutdown` exists in the schema but isn't
 * meaningful on a phone and is left unimplemented, same reasoning as the
 * PC app.
 */
object CloudSync {
    private const val TAG = "CloudSync"
    private val http = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()
    private val JSON = "application/json; charset=utf-8".toMediaType()
    private const val DEFAULT_SLEEP_HOURS = 8

    private fun callRpc(fnName: String, body: JSONObject): Any? {
        val request = Request.Builder()
            .url("${CloudConfig.URL}/rest/v1/rpc/$fnName")
            .addHeader("apikey", CloudConfig.ANON_KEY)
            .addHeader("Authorization", "Bearer ${CloudConfig.ANON_KEY}")
            .post(body.toString().toRequestBody(JSON))
            .build()
        http.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw Exception("$fnName failed: ${response.code} $text")
            }
            if (text.isBlank()) return null
            return try {
                JSONArray(text)
            } catch (e: Exception) {
                try {
                    JSONObject(text)
                } catch (e2: Exception) {
                    text.trim('"')
                }
            }
        }
    }

    // ---------------------------------------------------------------
    // Pairing
    // ---------------------------------------------------------------

    /** Starts a new pairing attempt and returns the 6-digit code to show the parent. */
    suspend fun startPairing(context: Context): Result<String> = withContext(Dispatchers.IO) {
        try {
            val deviceSecret = CloudStore.ensureDeviceSecret(context)
            val code = String.format("%06d", Random.nextInt(0, 1_000_000))
            val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}".trim().ifBlank { "Family Phone" }

            callRpc(
                "start_pairing",
                JSONObject().put("p_code", code).put("p_device_secret", deviceSecret).put("p_device_name", deviceName),
            )

            CloudStore.setPendingPairing(context, PendingPairing(code, System.currentTimeMillis()))
            Result.success(code)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun cancelPairing(context: Context) {
        CloudStore.setPendingPairing(context, null)
    }

    /** One-shot check: has the parent claimed the pending code yet? */
    suspend fun checkPairingClaimed(context: Context): Boolean = withContext(Dispatchers.IO) {
        val pending = CloudStore.pendingPairing(context) ?: return@withContext false
        val deviceSecret = CloudStore.deviceSecret(context) ?: return@withContext false

        if (System.currentTimeMillis() - pending.startedAtMs > PAIRING_TIMEOUT_MS) {
            CloudStore.setPendingPairing(context, null)
            return@withContext false
        }

        try {
            val result = callRpc(
                "poll_pairing",
                JSONObject().put("p_code", pending.code).put("p_device_secret", deviceSecret),
            )
            val deviceId = (result as? String)?.takeIf { it.isNotBlank() && it != "null" }
            if (deviceId == null) return@withContext false
            CloudStore.setPaired(context, deviceId)
            true
        } catch (e: Exception) {
            Log.w(TAG, "pairing check failed: ${e.message}")
            false
        }
    }

    /**
     * Clears local pairing state and, best-effort, deletes this device's row
     * from Supabase too — same reasoning as the PC app's unpair(): local
     * state clears either way, so a parent choosing to unpair never stays
     * stuck with a live remote channel just because the network call failed.
     */
    suspend fun unpair(context: Context) = withContext(Dispatchers.IO) {
        val deviceId = CloudStore.deviceId(context)
        val deviceSecret = CloudStore.deviceSecret(context)
        if (deviceId != null && deviceSecret != null) {
            try {
                callRpc(
                    "unpair_device",
                    JSONObject().put("p_device_id", deviceId).put("p_device_secret", deviceSecret),
                )
            } catch (e: Exception) {
                Log.w(TAG, "could not remove device from remote dashboard: ${e.message}")
            }
        }
        CloudStore.clearPairing(context)
        CloudStore.setForceSleepUntil(context, null)
    }

    // ---------------------------------------------------------------
    // Commands
    // ---------------------------------------------------------------

    suspend fun isForceSleepActive(context: Context): Boolean {
        val until = CloudStore.forceSleepUntil(context) ?: return false
        return until > System.currentTimeMillis()
    }

    private suspend fun applyCommand(context: Context, kind: String, payload: JSONObject): String {
        return when (kind) {
            "enforce_sleep_now" -> {
                val hours = if (payload.has("hours")) payload.optInt("hours", DEFAULT_SLEEP_HOURS) else DEFAULT_SLEEP_HOURS
                CloudStore.setForceSleepUntil(context, System.currentTimeMillis() + hours * 60 * 60 * 1000L)
                "done"
            }
            "cancel_sleep_now" -> {
                CloudStore.setForceSleepUntil(context, null)
                "done"
            }
            "lock_computer" -> {
                CloudStore.setRemoteLockActive(context, true)
                "done"
            }
            "unlock_computer" -> {
                CloudStore.setRemoteLockActive(context, false)
                "done"
            }
            "set_schedule" -> {
                val schedule = Schedule.fromJson(payload)
                if (schedule == null || !isValidSchedule(schedule)) {
                    "failed"
                } else {
                    CloudStore.setSchedule(context, schedule)
                    "done"
                }
            }
            else -> {
                Log.w(TAG, "command kind \"$kind\" is not implemented on this platform")
                "failed"
            }
        }
    }

    /** One poll cycle: fetch pending commands (if paired) and apply each. */
    suspend fun pollCommandsOnce(context: Context) = withContext(Dispatchers.IO) {
        val deviceId = CloudStore.deviceId(context) ?: return@withContext
        val deviceSecret = CloudStore.deviceSecret(context) ?: return@withContext

        val commands = try {
            val result = callRpc(
                "get_pending_commands",
                JSONObject().put("p_device_id", deviceId).put("p_device_secret", deviceSecret),
            ) as? JSONArray ?: JSONArray()
            (0 until result.length()).map { result.getJSONObject(it) }
        } catch (e: Exception) {
            Log.w(TAG, "could not fetch commands: ${e.message}")
            return@withContext
        }

        for (command in commands) {
            val id = command.getString("id")
            val kind = command.getString("kind")
            val payload = command.optJSONObject("payload") ?: JSONObject()
            val status = try {
                applyCommand(context, kind, payload)
            } catch (e: Exception) {
                Log.w(TAG, "applying command $id failed: ${e.message}")
                "failed"
            }
            try {
                callRpc(
                    "complete_command",
                    JSONObject()
                        .put("p_device_id", deviceId)
                        .put("p_device_secret", deviceSecret)
                        .put("p_command_id", id)
                        .put("p_status", status),
                )
            } catch (e: Exception) {
                Log.w(TAG, "could not report command $id status: ${e.message}")
            }
        }
    }

    /** One poll cycle: fetch the parent's current site list for this device and store it wholesale. */
    suspend fun pollDeviceDomainsOnce(context: Context) = withContext(Dispatchers.IO) {
        val deviceId = CloudStore.deviceId(context) ?: return@withContext
        val deviceSecret = CloudStore.deviceSecret(context) ?: return@withContext

        try {
            val result = callRpc(
                "get_device_domains",
                JSONObject().put("p_device_id", deviceId).put("p_device_secret", deviceSecret),
            ) as? JSONArray ?: JSONArray()
            val domains = (0 until result.length()).map { result.getString(it) }.toSet()
            CloudStore.setCloudBlockedDomains(context, domains)
        } catch (e: Exception) {
            Log.w(TAG, "could not fetch parent-added sites: ${e.message}")
        }
    }

    /** Pushes a site the parent added from this device's own Add-a-site screen up to Supabase. */
    suspend fun addDeviceDomain(context: Context, domain: String) = withContext(Dispatchers.IO) {
        val deviceId = CloudStore.deviceId(context) ?: return@withContext
        val deviceSecret = CloudStore.deviceSecret(context) ?: return@withContext
        try {
            callRpc(
                "add_device_domain",
                JSONObject().put("p_device_id", deviceId).put("p_device_secret", deviceSecret).put("p_domain", domain),
            )
        } catch (e: Exception) {
            Log.w(TAG, "could not sync added site to remote dashboard: ${e.message}")
        }
    }

    suspend fun removeDeviceDomain(context: Context, domain: String) = withContext(Dispatchers.IO) {
        val deviceId = CloudStore.deviceId(context) ?: return@withContext
        val deviceSecret = CloudStore.deviceSecret(context) ?: return@withContext
        try {
            callRpc(
                "remove_device_domain",
                JSONObject().put("p_device_id", deviceId).put("p_device_secret", deviceSecret).put("p_domain", domain),
            )
        } catch (e: Exception) {
            Log.w(TAG, "could not sync removed site to remote dashboard: ${e.message}")
        }
    }

    private const val PAIRING_TIMEOUT_MS = 10 * 60 * 1000L
}
