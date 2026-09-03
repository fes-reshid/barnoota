package com.barnoota.noorshield.email

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.emailSettingsDataStore by preferencesDataStore(name = "noor_shield_email")

/** Non-secret SMTP configuration. The password lives separately in [SecretStore], encrypted. */
data class SmtpSettings(
    val host: String = "",
    val port: Int = 587,
    val secure: Boolean = true,
    val user: String = "",
    val from: String = "",
    val recipient: String = "",
)

object EmailSettingsStore {
    private val HOST = stringPreferencesKey("smtp_host")
    private val PORT = intPreferencesKey("smtp_port")
    private val SECURE = booleanPreferencesKey("smtp_secure")
    private val USER = stringPreferencesKey("smtp_user")
    private val FROM = stringPreferencesKey("smtp_from")
    private val RECIPIENT = stringPreferencesKey("recipient")

    fun observe(context: Context): Flow<SmtpSettings> =
        context.emailSettingsDataStore.data.map { prefs ->
            SmtpSettings(
                host = prefs[HOST] ?: "",
                port = prefs[PORT] ?: 587,
                secure = prefs[SECURE] ?: true,
                user = prefs[USER] ?: "",
                from = prefs[FROM] ?: "",
                recipient = prefs[RECIPIENT] ?: "",
            )
        }

    suspend fun current(context: Context): SmtpSettings = observe(context).first()

    suspend fun save(context: Context, settings: SmtpSettings) {
        context.emailSettingsDataStore.edit { prefs ->
            prefs[HOST] = settings.host
            prefs[PORT] = settings.port
            prefs[SECURE] = settings.secure
            prefs[USER] = settings.user
            prefs[FROM] = settings.from
            prefs[RECIPIENT] = settings.recipient
        }
    }
}
