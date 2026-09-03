package dev.timeframe.collector.resurrect

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.work.*
import dev.timeframe.collector.usage.UsagePollWorker
import java.util.concurrent.TimeUnit

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            val workManager = WorkManager.getInstance(context)

            // Expedited catch-up
            val catchupRequest = OneTimeWorkRequestBuilder<UsagePollWorker>()
                .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                .build()
            workManager.enqueueUniqueWork("usage_catchup", ExistingWorkPolicy.REPLACE, catchupRequest)

            // Periodic idle poll (15 min)
            val periodicRequest = PeriodicWorkRequestBuilder<UsagePollWorker>(15, TimeUnit.MINUTES)
                .build()
            workManager.enqueueUniquePeriodicWork("usage_idle_poll", ExistingPeriodicWorkPolicy.KEEP, periodicRequest)
        }
    }
}
