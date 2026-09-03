package com.barnoota.noorshield.reminders

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/**
 * Periodically surfaces a Hadith reminder — rotating through lowering the
 * gaze, tawbah, istighfar, and remembrance of the Akhirah — as a
 * notification. Runs independently of the content filter services so
 * reminders keep coming even if the user has (temporarily) disabled
 * filtering.
 */
class ReminderWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        NotificationHelper.showReminder(applicationContext, HadithRepository.random())
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "noor_shield_reminder_worker"

        fun schedule(context: Context, intervalHours: Long = 4) {
            val request = PeriodicWorkRequestBuilder<ReminderWorker>(intervalHours, TimeUnit.HOURS).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request,
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
}
