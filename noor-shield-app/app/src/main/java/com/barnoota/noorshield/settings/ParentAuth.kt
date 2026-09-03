package com.barnoota.noorshield.settings

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

private val Context.parentAuthDataStore by preferencesDataStore(name = "noor_shield_parent")

data class ParentAuthStatus(
    val configured: Boolean,
    val unlocked: Boolean,
    val lockedOutUntilMs: Long,
    val attemptsRemaining: Int,
)

sealed class ParentActionResult {
    data object Ok : ParentActionResult()
    data class Failed(val reason: String) : ParentActionResult()
}

/** [recoveryKey] is non-null only on success — it's the one time it's ever readable in the clear. */
data class ParentSetupResult(val recoveryKey: String?, val error: String?) {
    val ok: Boolean get() = error == null
}

/**
 * The parent password gate for Noor Shield's Activity Log and email report
 * settings — the two things on this app that reveal what the child has been
 * doing. Mirrors the PC app's `parentAuth.js` design (setup + one-time
 * recovery key + timed lockout + a timed unlock session) but hashes with
 * PBKDF2WithHmacSHA256 instead of scrypt: that's what's built into the
 * standard Java/Android crypto providers with no new dependency, since
 * scrypt has no first-party implementation on Android.
 *
 * The unlock session is a plain in-memory singleton (this object), which is
 * correct here in a way it wasn't on PC: the PC app splits into a GUI
 * process and a separate always-on service process specifically so
 * protection survives the GUI closing, so the two needed to agree over IPC.
 * Every Android component (Compose UI, BlockVpnService,
 * ScreenGuardAccessibilityService) runs in the same app process already and
 * can share this one source of truth directly — no IPC needed.
 *
 * Scope note: unlike the PC app, this gate currently protects only the
 * Activity Log and email settings, not the filter toggle or blocklist edits
 * (see README) — extending it to those would reuse this same object.
 */
object ParentAuth {
    private val SALT = stringPreferencesKey("parent_salt")
    private val HASH = stringPreferencesKey("parent_hash")
    private val RECOVERY_SALT = stringPreferencesKey("recovery_salt")
    private val RECOVERY_HASH = stringPreferencesKey("recovery_hash")
    private val FAILED_COUNT = intPreferencesKey("failed_unlock_count")
    private val LOCKED_UNTIL_MS = longPreferencesKey("locked_until_ms")

    private const val PBKDF2_ITERATIONS = 120_000
    private const val KEY_LENGTH_BITS = 256
    private const val MAX_FAILED_ATTEMPTS = 5
    private const val LOCKOUT_MS = 5 * 60 * 1000L
    private const val UNLOCK_WINDOW_MS = 10 * 60 * 1000L
    const val MIN_PASSWORD_LENGTH = 6

    @Volatile private var unlockedUntilMs: Long = 0L

    private fun hash(secret: String, saltHex: String): ByteArray {
        val spec = PBEKeySpec(secret.toCharArray(), hexToBytes(saltHex), PBKDF2_ITERATIONS, KEY_LENGTH_BITS)
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        return factory.generateSecret(spec).encoded
    }

    private fun newSaltHex(): String {
        val bytes = ByteArray(16)
        SecureRandom().nextBytes(bytes)
        return bytesToHex(bytes)
    }

    private fun bytesToHex(bytes: ByteArray): String = bytes.joinToString("") { "%02x".format(it) }

    private fun hexToBytes(hex: String): ByteArray =
        ByteArray(hex.length / 2) { i ->
            ((Character.digit(hex[i * 2], 16) shl 4) + Character.digit(hex[i * 2 + 1], 16)).toByte()
        }

    /** Human-transcribable recovery key: 4 groups of 5 chars, no ambiguous letters. */
    private fun generateRecoveryKey(): String {
        val alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no I, O, 0, 1
        val random = SecureRandom()
        return (0 until 4).joinToString("-") {
            (0 until 5).map { alphabet[random.nextInt(alphabet.length)] }.joinToString("")
        }
    }

    suspend fun isConfigured(context: Context): Boolean {
        val prefs = context.parentAuthDataStore.data.first()
        return prefs[HASH] != null && prefs[SALT] != null
    }

    /** Before a password is ever set, nothing is locked — otherwise a fresh install would be unusable. */
    suspend fun isUnlocked(context: Context): Boolean =
        if (isConfigured(context)) System.currentTimeMillis() < unlockedUntilMs else true

    suspend fun status(context: Context): ParentAuthStatus {
        val prefs = context.parentAuthDataStore.data.first()
        val lockedUntil = prefs[LOCKED_UNTIL_MS] ?: 0L
        val failedCount = prefs[FAILED_COUNT] ?: 0
        return ParentAuthStatus(
            configured = prefs[HASH] != null && prefs[SALT] != null,
            unlocked = isUnlocked(context),
            lockedOutUntilMs = if (lockedUntil > System.currentTimeMillis()) lockedUntil else 0L,
            attemptsRemaining = (MAX_FAILED_ATTEMPTS - failedCount).coerceAtLeast(0),
        )
    }

    /** First-run setup. Refuses to silently overwrite an existing password. */
    suspend fun setup(context: Context, password: String): ParentSetupResult {
        if (isConfigured(context)) {
            return ParentSetupResult(null, "A parent password is already set. Use \"Change password\" instead.")
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            return ParentSetupResult(null, "Password must be at least $MIN_PASSWORD_LENGTH characters.")
        }

        val recoveryKey = generateRecoveryKey()
        val salt = newSaltHex()
        val recoverySalt = newSaltHex()

        context.parentAuthDataStore.edit { prefs ->
            prefs[SALT] = salt
            prefs[HASH] = bytesToHex(hash(password, salt))
            prefs[RECOVERY_SALT] = recoverySalt
            prefs[RECOVERY_HASH] = bytesToHex(hash(recoveryKey, recoverySalt))
        }
        touch()
        return ParentSetupResult(recoveryKey, null)
    }

    suspend fun unlock(context: Context, password: String): ParentActionResult {
        if (!isConfigured(context)) {
            touch()
            return ParentActionResult.Ok
        }

        val prefs = context.parentAuthDataStore.data.first()
        val lockedUntil = prefs[LOCKED_UNTIL_MS] ?: 0L
        val now = System.currentTimeMillis()
        if (lockedUntil > now) {
            val minutes = (lockedUntil - now) / 60_000 + 1
            return ParentActionResult.Failed("Too many wrong attempts. Try again in $minutes minute(s).")
        }

        val salt = prefs[SALT] ?: return ParentActionResult.Failed("No parent password is set.")
        val expected = hexToBytes(prefs[HASH] ?: "")
        val attempt = hash(password, salt)

        if (!MessageDigest.isEqual(attempt, expected)) {
            val count = (prefs[FAILED_COUNT] ?: 0) + 1
            val newLockedUntil = if (count >= MAX_FAILED_ATTEMPTS) now + LOCKOUT_MS else 0L
            context.parentAuthDataStore.edit {
                it[FAILED_COUNT] = if (newLockedUntil > 0) 0 else count
                it[LOCKED_UNTIL_MS] = newLockedUntil
            }
            return ParentActionResult.Failed(
                if (newLockedUntil > 0) {
                    "Too many wrong attempts. Locked for 5 minutes."
                } else {
                    "Wrong password. ${MAX_FAILED_ATTEMPTS - count} attempt(s) left."
                }
            )
        }

        context.parentAuthDataStore.edit {
            it[FAILED_COUNT] = 0
            it[LOCKED_UNTIL_MS] = 0L
        }
        touch()
        return ParentActionResult.Ok
    }

    /** Extends the unlock window — call on each successful parent action. */
    fun touch() {
        unlockedUntilMs = System.currentTimeMillis() + UNLOCK_WINDOW_MS
    }

    fun lock() {
        unlockedUntilMs = 0L
    }

    suspend fun changePassword(context: Context, currentPassword: String, newPassword: String): ParentActionResult {
        if (!isConfigured(context)) {
            val result = setup(context, newPassword)
            return if (result.ok) ParentActionResult.Ok else ParentActionResult.Failed(result.error!!)
        }

        val verified = unlock(context, currentPassword)
        if (verified is ParentActionResult.Failed) return verified

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return ParentActionResult.Failed("Password must be at least $MIN_PASSWORD_LENGTH characters.")
        }

        val salt = newSaltHex()
        context.parentAuthDataStore.edit {
            it[SALT] = salt
            it[HASH] = bytesToHex(hash(newPassword, salt))
        }
        touch()
        return ParentActionResult.Ok
    }

    /** Forgot-password path: the recovery key issued at setup sets a new password and rotates itself. */
    suspend fun resetWithRecoveryKey(context: Context, recoveryKey: String, newPassword: String): ParentSetupResult {
        if (!isConfigured(context)) return ParentSetupResult(null, "No parent password is set yet.")
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return ParentSetupResult(null, "Password must be at least $MIN_PASSWORD_LENGTH characters.")
        }

        val prefs = context.parentAuthDataStore.data.first()
        val recoverySalt = prefs[RECOVERY_SALT] ?: return ParentSetupResult(null, "No recovery key was ever issued.")
        val expected = hexToBytes(prefs[RECOVERY_HASH] ?: "")
        val attempt = hash(recoveryKey.trim().uppercase(), recoverySalt)
        if (!MessageDigest.isEqual(attempt, expected)) {
            return ParentSetupResult(null, "That recovery key is not correct.")
        }

        // Burn the used key and issue a fresh one, so a leaked slip of paper doesn't stay valid forever.
        val newRecoveryKey = generateRecoveryKey()
        val salt = newSaltHex()
        val newRecoverySalt = newSaltHex()
        context.parentAuthDataStore.edit {
            it[SALT] = salt
            it[HASH] = bytesToHex(hash(newPassword, salt))
            it[RECOVERY_SALT] = newRecoverySalt
            it[RECOVERY_HASH] = bytesToHex(hash(newRecoveryKey, newRecoverySalt))
            it[FAILED_COUNT] = 0
            it[LOCKED_UNTIL_MS] = 0L
        }
        touch()
        return ParentSetupResult(newRecoveryKey, null)
    }
}
