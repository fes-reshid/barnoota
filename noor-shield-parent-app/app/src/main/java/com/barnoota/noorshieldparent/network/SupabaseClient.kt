package com.barnoota.noorshieldparent.network

import com.barnoota.noorshieldparent.SupabaseConfig
import com.barnoota.noorshieldparent.data.Device
import com.barnoota.noorshieldparent.data.SessionStore
import com.barnoota.noorshieldparent.data.StoredSession
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

private val JSON = "application/json; charset=utf-8".toMediaType()

/**
 * kotlin.runCatching's block type is a plain () -> T, not suspend () -> T,
 * so it can't call suspend functions (saveSessionFrom, authedRequestBuilder,
 * sessionStore reads) — this is the suspend-aware equivalent used
 * throughout this file instead.
 */
private suspend fun <T> resultOf(block: suspend () -> T): Result<T> =
    try {
        Result.success(block())
    } catch (e: Exception) {
        Result.failure(e)
    }

/**
 * Talks to the same Supabase project the PC app and web dashboard use, via
 * plain REST calls (Auth + PostgREST + RPC) — no Supabase SDK, mirroring
 * how noor-shield-pc/service/cloudSync.js and cloud/dashboard.html do it.
 * A logged-in parent here has the exact same access as a logged-in parent
 * on the web dashboard: Row Level Security on the Supabase side (see
 * cloud/schema.sql) is what actually scopes every call to their own
 * devices, not anything this client enforces itself.
 */
class SupabaseClient(private val sessionStore: SessionStore) {
    private val http = OkHttpClient()

    class ApiException(message: String) : Exception(message)

    // ---------------------------------------------------------------
    // Auth
    // ---------------------------------------------------------------

    /**
     * Creates a new parent account. Returns true if a session came back
     * immediately (email confirmation is off for this project, matching the
     * web dashboard's own sign-up flow) — in that case the caller is
     * already signed in. Returns false if Supabase requires confirming the
     * email first, in which case there's no session yet and the parent
     * needs to check their inbox before signing in.
     */
    suspend fun signUp(email: String, password: String): Result<Boolean> = withContext(Dispatchers.IO) {
        resultOf {
            val body = postAuth("signup", JSONObject().put("email", email).put("password", password))
            if (body.has("access_token")) {
                saveSessionFrom(body)
                true
            } else {
                false
            }
        }
    }

    suspend fun signIn(email: String, password: String): Result<Unit> = withContext(Dispatchers.IO) {
        resultOf {
            val body = postAuth(
                "token?grant_type=password",
                JSONObject().put("email", email).put("password", password),
            )
            saveSessionFrom(body)
        }
    }

    suspend fun signOut() {
        val current = sessionStore.session.first()
        sessionStore.clear()
        if (current != null) {
            resultOf {
                withContext(Dispatchers.IO) {
                    val request = Request.Builder()
                        .url("${SupabaseConfig.URL}/auth/v1/logout")
                        .addHeader("apikey", SupabaseConfig.ANON_KEY)
                        .addHeader("Authorization", "Bearer ${current.accessToken}")
                        .post(ByteArray(0).toRequestBody(null))
                        .build()
                    http.newCall(request).execute().close()
                }
            }
        }
    }

    private fun postAuth(path: String, body: JSONObject): JSONObject {
        val request = Request.Builder()
            .url("${SupabaseConfig.URL}/auth/v1/$path")
            .addHeader("apikey", SupabaseConfig.ANON_KEY)
            .post(body.toString().toRequestBody(JSON))
            .build()
        http.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            val json = if (text.isNotBlank()) JSONObject(text) else JSONObject()
            if (!response.isSuccessful) {
                throw ApiException(errorMessage(json, "Sign-in failed (${response.code})."))
            }
            return json
        }
    }

    private suspend fun saveSessionFrom(body: JSONObject) {
        val accessToken = body.getString("access_token")
        val refreshToken = body.getString("refresh_token")
        val expiresIn = body.optLong("expires_in", 3600)
        val userId = body.getJSONObject("user").getString("id")
        sessionStore.save(
            StoredSession(
                accessToken = accessToken,
                refreshToken = refreshToken,
                expiresAtEpochSec = System.currentTimeMillis() / 1000 + expiresIn,
                userId = userId,
            )
        )
    }

    /** Returns a currently-valid access token, refreshing it first if it's expired or close to it. Null means the parent needs to sign in again. */
    private suspend fun validAccessToken(): String? {
        val current = sessionStore.session.first() ?: return null
        val bufferSec = 60
        if (current.expiresAtEpochSec - System.currentTimeMillis() / 1000 > bufferSec) {
            return current.accessToken
        }
        val refreshed = withContext(Dispatchers.IO) {
            resultOf {
                val body = postAuth(
                    "token?grant_type=refresh_token",
                    JSONObject().put("refresh_token", current.refreshToken),
                )
                saveSessionFrom(body)
                body.getString("access_token")
            }
        }
        val newToken = refreshed.getOrNull()
        if (newToken == null) sessionStore.clear()
        return newToken
    }

    // ---------------------------------------------------------------
    // REST helpers
    // ---------------------------------------------------------------

    /** A Request.Builder pre-loaded with auth headers; the caller sets the URL/method/body and calls .build(). */
    private suspend fun authedRequestBuilder(): Request.Builder {
        val token = validAccessToken() ?: throw ApiException("Please sign in again.")
        return Request.Builder()
            .addHeader("apikey", SupabaseConfig.ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
    }

    private fun errorMessage(json: JSONObject, fallback: String): String {
        return json.optString("message").ifBlank {
            json.optString("error_description").ifBlank {
                json.optString("msg").ifBlank { fallback }
            }
        }
    }

    // ---------------------------------------------------------------
    // Devices
    // ---------------------------------------------------------------

    suspend fun listDevices(): Result<List<Device>> = withContext(Dispatchers.IO) {
        resultOf {
            val url = "${SupabaseConfig.URL}/rest/v1/devices?select=*&order=paired_at.asc".toHttpUrl()
            val request = authedRequestBuilder().url(url).get().build()
            http.newCall(request).execute().use { response ->
                val text = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    throw ApiException(errorMessage(JSONObject(text.ifBlank { "{}" }), "Could not load your devices."))
                }
                val array = JSONArray(text)
                (0 until array.length()).map { i ->
                    val row = array.getJSONObject(i)
                    Device(
                        id = row.getString("id"),
                        name = row.getString("name"),
                        pairedAt = row.getString("paired_at"),
                        lastSeenAt = row.optString("last_seen_at", null),
                    )
                }
            }
        }
    }

    /** Links a PC's pairing code to the signed-in parent's account. Returns the new device id. */
    suspend fun claimPairingCode(code: String, nameOverride: String?): Result<String> =
        withContext(Dispatchers.IO) {
            resultOf {
                val body = JSONObject().put("p_code", code)
                    .put("p_device_name_override", nameOverride ?: JSONObject.NULL)
                val request = authedRequestBuilder()
                    .url("${SupabaseConfig.URL}/rest/v1/rpc/claim_pairing_code")
                    .post(body.toString().toRequestBody(JSON))
                    .build()
                http.newCall(request).execute().use { response ->
                    val text = response.body?.string().orEmpty()
                    if (!response.isSuccessful) {
                        throw ApiException(
                            errorMessage(
                                JSONObject(text.ifBlank { "{}" }),
                                "That code is invalid or has expired.",
                            )
                        )
                    }
                    text.trim('"')
                }
            }
        }

    suspend fun sendCommand(deviceId: String, kind: String, payload: JSONObject = JSONObject()): Result<Unit> =
        withContext(Dispatchers.IO) {
            resultOf {
                val userId = sessionStore.session.first()?.userId
                    ?: throw ApiException("Please sign in again.")
                val body = JSONObject()
                    .put("device_id", deviceId)
                    .put("kind", kind)
                    .put("requested_by", userId)
                    .put("payload", payload)
                val request = authedRequestBuilder()
                    .addHeader("Prefer", "return=minimal")
                    .url("${SupabaseConfig.URL}/rest/v1/commands")
                    .post(body.toString().toRequestBody(JSON))
                    .build()
                http.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        val text = response.body?.string().orEmpty()
                        throw ApiException(
                            errorMessage(JSONObject(text.ifBlank { "{}" }), "Could not send that command.")
                        )
                    }
                }
            }
        }

    // ---------------------------------------------------------------
    // Per-device blocked sites (device_domains)
    // ---------------------------------------------------------------

    suspend fun listDeviceDomains(deviceId: String): Result<List<String>> = withContext(Dispatchers.IO) {
        resultOf {
            val url = "${SupabaseConfig.URL}/rest/v1/device_domains"
                .toHttpUrl().newBuilder()
                .addQueryParameter("device_id", "eq.$deviceId")
                .addQueryParameter("select", "domain")
                .addQueryParameter("order", "added_at.asc")
                .build()
            val request = authedRequestBuilder().url(url).get().build()
            http.newCall(request).execute().use { response ->
                val text = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    throw ApiException(errorMessage(JSONObject(text.ifBlank { "{}" }), "Could not load the site list."))
                }
                val array = JSONArray(text)
                (0 until array.length()).map { array.getJSONObject(it).getString("domain") }
            }
        }
    }

    suspend fun addDeviceDomain(deviceId: String, domain: String): Result<Unit> = withContext(Dispatchers.IO) {
        resultOf {
            val body = JSONObject().put("device_id", deviceId).put("domain", domain)
            val request = authedRequestBuilder()
                .addHeader("Prefer", "return=minimal")
                .url("${SupabaseConfig.URL}/rest/v1/device_domains")
                .post(body.toString().toRequestBody(JSON))
                .build()
            http.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val text = response.body?.string().orEmpty()
                    val message = if (response.code == 409) {
                        "That site is already on the list."
                    } else {
                        errorMessage(JSONObject(text.ifBlank { "{}" }), "Could not add that site.")
                    }
                    throw ApiException(message)
                }
            }
        }
    }

    suspend fun removeDeviceDomain(deviceId: String, domain: String): Result<Unit> = withContext(Dispatchers.IO) {
        resultOf {
            val url = "${SupabaseConfig.URL}/rest/v1/device_domains"
                .toHttpUrl().newBuilder()
                .addQueryParameter("device_id", "eq.$deviceId")
                .addQueryParameter("domain", "eq.$domain")
                .build()
            val request = authedRequestBuilder().url(url).delete().build()
            http.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val text = response.body?.string().orEmpty()
                    throw ApiException(errorMessage(JSONObject(text.ifBlank { "{}" }), "Could not remove that site."))
                }
            }
        }
    }
}
