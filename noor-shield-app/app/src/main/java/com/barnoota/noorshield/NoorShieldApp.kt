package com.barnoota.noorshield

import android.app.Application
import com.barnoota.noorshield.reminders.ReminderWorker

class NoorShieldApp : Application() {
    override fun onCreate() {
        super.onCreate()
        ReminderWorker.schedule(this)
    }
}
