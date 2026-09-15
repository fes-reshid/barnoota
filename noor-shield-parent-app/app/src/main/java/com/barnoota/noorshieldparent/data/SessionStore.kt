package com.barnoota.noorshieldparent.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "session")

/** What's on disk for a signed-in parent: just enough to re-authenticate REST calls without asking for a password again every launch. */
data class StoredSession(
    val accessToken: String,
    val refreshToken: String,
    val expiresAtEpochSec: Long,
    val userId: String,
)

/**
 * Persists the Supabase Auth session (access/refresh token pair) in
 * DataStore, mirroring what the web dashboard keeps in Supabase JS's own
 * localStorage-backed session — so this app also stays signed in across
 * restarts instead of asking for the parent's password every time.
 */
class SessionStore(private val context: Context) {
    private object Keys {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val EXPIRES_AT = longPreferencesKey("expires_at")
        val USER_ID = stringPreferencesKey("user_id")
    }

    val session: Flow<StoredSession?> = context.dataStore.data.map { prefs ->
        val access = prefs[Keys.ACCESS_TOKEN]
        val refresh = prefs[Keys.REFRESH_TOKEN]
        val userId = prefs[Keys.USER_ID]
        val expiresAt = prefs[Keys.EXPIRES_AT]
        if (access != null && refresh != null && userId != null && expiresAt != null) {
            StoredSession(access, refresh, expiresAt, userId)
        } else {
            null
        }
    }

    suspend fun save(session: StoredSession) {
        context.dataStore.edit { prefs ->
            prefs[Keys.ACCESS_TOKEN] = session.accessToken
            prefs[Keys.REFRESH_TOKEN] = session.refreshToken
            prefs[Keys.EXPIRES_AT] = session.expiresAtEpochSec
            prefs[Keys.USER_ID] = session.userId
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}
