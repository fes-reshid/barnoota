package com.barnoota.noorshield.license

import com.barnoota.noorshield.cloud.CloudConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/**
 * Kotlin port of noor-shield-pc/src/main/license.js: product-key activation
 * checked against the same Supabase table (license_keys /
 * activate_license_key) so a key already claimed by another device is
 * actually rejected. "Check once, then work offline forever" — same as the
 * PC app: activateKeyOnline() only runs when the parent taps "Activate";
 * once activated, the filter keeps enforcing with no further internet need.
 */
object License {
    const val TRIAL_DAYS = 29
    private const val TRIAL_MS = TRIAL_DAYS * 24L * 60 * 60 * 1000

    private val http = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    fun trialDaysRemaining(firstRunAt: Long?, nowMs: Long = System.currentTimeMillis()): Int {
        if (firstRunAt == null) return 0
        val remainingMs = TRIAL_MS - (nowMs - firstRunAt)
        return maxOf(0, Math.ceil(remainingMs / (24.0 * 60 * 60 * 1000)).toInt())
    }

    fun isTrialActive(firstRunAt: Long?, nowMs: Long = System.currentTimeMillis()): Boolean =
        firstRunAt != null && nowMs - firstRunAt < TRIAL_MS

    /**
     * True if an activated key is still within its access window. `expiresAtMs`
     * is null for a lifetime key — always active once activated. A
     * time-limited key (e.g. a 29-day key) carries a real timestamp, set
     * once at activation time (see activate_license_key in schema.sql) and
     * checked here with no further network round trip.
     */
    fun isLicenseActive(activated: Boolean, expiresAtMs: Long?, nowMs: Long = System.currentTimeMillis()): Boolean {
        if (!activated) return false
        if (expiresAtMs == null) return true
        return nowMs < expiresAtMs
    }

    /** "NOOR-XXXXX-XXXXX-XXXXX" -> "NOORXXXXXXXXXXXXXXX", tolerant of case/whitespace/missing dashes. */
    fun normalizeKey(rawInput: String): String = rawInput.uppercase().filter { it.isLetterOrDigit() }

    /** Hashes a key the same way scripts/generate-keys.js did, or null if the format is wrong. */
    fun hashKey(rawInput: String): String? {
        val normalized = normalizeKey(rawInput)
        if (normalized.length != 19 || !normalized.startsWith("NOOR")) return null
        val body = normalized.substring(4)
        val canonical = "NOOR-${body.substring(0, 5)}-${body.substring(5, 10)}-${body.substring(10, 15)}"
        val digest = MessageDigest.getInstance("SHA-256").digest(canonical.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }

    sealed class ActivationResult {
        /** expiresAtMs is null for a lifetime key, or the key's expiry for a time-limited one (e.g. a 29-day key). */
        data class Ok(val expiresAtMs: Long?) : ActivationResult()
        data object BadFormat : ActivationResult()
        data object Invalid : ActivationResult()
        data object AlreadyUsed : ActivationResult()
        data object NetworkError : ActivationResult()
    }

    /**
     * Checks a key against Supabase's activate_license_key function, scoped
     * to this device's license deviceId (CloudStore.licenseDeviceId — reused
     * on every later activation attempt, including reinstalls, so the same
     * device re-activating its own key never looks like reuse on another
     * device).
     */
    suspend fun activateKeyOnline(rawInput: String, deviceId: String): ActivationResult = withContext(Dispatchers.IO) {
        val hash = hashKey(rawInput) ?: return@withContext ActivationResult.BadFormat

        val body = JSONObject().put("p_key_hash", hash).put("p_device_id", deviceId)
        val request = Request.Builder()
            .url("${CloudConfig.URL}/rest/v1/rpc/activate_license_key")
            .addHeader("apikey", CloudConfig.ANON_KEY)
            .addHeader("Authorization", "Bearer ${CloudConfig.ANON_KEY}")
            .post(body.toString().toRequestBody(JSON))
            .build()

        try {
            http.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext ActivationResult.NetworkError
                val text = response.body?.string().orEmpty()
                val json = JSONObject(text)
                when (json.optString("status")) {
                    "ok" -> {
                        val expiresAt = json.optString("expires_at", null)
                        val expiresAtMs = expiresAt?.let { runCatching { java.time.Instant.parse(it).toEpochMilli() }.getOrNull() }
                        ActivationResult.Ok(expiresAtMs)
                    }
                    "already_used" -> ActivationResult.AlreadyUsed
                    else -> ActivationResult.Invalid
                }
            }
        } catch (e: Exception) {
            ActivationResult.NetworkError
        }
    }
}
