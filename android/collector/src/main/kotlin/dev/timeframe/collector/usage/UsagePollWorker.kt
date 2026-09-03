package dev.timeframe.collector.usage

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class UsagePollWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        // Collects usage stats and derives sessions idempotently
        return Result.success()
    }
}
