package dev.timeframe.collector.health

import android.app.AppOpsManager
import android.content.Context
import android.os.Process
import dev.timeframe.collector.db.CollectorHealthDao
import dev.timeframe.collector.db.CollectorHealthEntity

class CollectorHealthTracker(
    private val context: Context,
    private val healthDao: CollectorHealthDao
) {
    fun hasUsageAccess(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    suspend fun recordHealth(watermarkMs: Long): CollectorHealthEntity {
        val hasAccess = if (hasUsageAccess()) 1 else 0
        val entity = CollectorHealthEntity(
            checked_at_ms = System.currentTimeMillis(),
            has_usage_access = hasAccess,
            watermark_ms = watermarkMs
        )
        healthDao.insert(entity)
        return entity
    }
}
