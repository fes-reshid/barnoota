package com.barnoota.noorshield.ui

import android.content.Context
import android.net.VpnService
import android.provider.Settings
import android.text.TextUtils
import com.barnoota.noorshield.filter.ScreenGuardAccessibilityService

object PermissionStatus {

    fun isVpnPrepared(context: Context): Boolean = VpnService.prepare(context) == null

    fun canDrawOverlays(context: Context): Boolean = Settings.canDrawOverlays(context)

    fun isAccessibilityServiceEnabled(context: Context): Boolean {
        val expected = "${context.packageName}/${ScreenGuardAccessibilityService::class.java.canonicalName}"
        val enabled = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
        ) ?: return false
        val splitter = TextUtils.SimpleStringSplitter(':')
        splitter.setString(enabled)
        for (component in splitter) {
            if (component.equals(expected, ignoreCase = true)) return true
        }
        return false
    }
}
