package com.barnoota.noorshield.email

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

/**
 * Encrypted-at-rest storage for the one real credential this app holds: the
 * parent's SMTP password for sending activity reports. Backed by the
 * Android Keystore via EncryptedSharedPreferences — never written to a
 * plaintext file. This is the Android equivalent of the PC app's use of
 * Electron's `safeStorage` for the same purpose.
 */
object SecretStore {
    private const val PREFS_NAME = "noor_shield_secrets"
    private const val KEY_SMTP_PASSWORD = "smtp_password"

    private fun prefs(context: Context): SharedPreferences {
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        return EncryptedSharedPreferences.create(
            PREFS_NAME,
            masterKeyAlias,
            context.applicationContext,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    /** @throws Exception if the Android Keystore is unavailable — callers should show a clear error, not crash. */
    fun saveSmtpPassword(context: Context, password: String) {
        prefs(context).edit().putString(KEY_SMTP_PASSWORD, password).apply()
    }

    fun readSmtpPassword(context: Context): String? = prefs(context).getString(KEY_SMTP_PASSWORD, null)

    fun hasSmtpPassword(context: Context): Boolean = readSmtpPassword(context) != null
}
