package com.barnoota.noorshield.reminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.barnoota.noorshield.filter.BlockVpnService
import com.barnoota.noorshield.settings.NoorShieldPreferences

/** Restarts the reminder schedule (and the VPN filter, if the user enabled it) after a reboot. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        ReminderWorker.schedule(context)

        NoorShieldPreferences.isFilterEnabledBlocking(context).let { enabled ->
            if (enabled) BlockVpnService.start(context)
        }
    }
}
