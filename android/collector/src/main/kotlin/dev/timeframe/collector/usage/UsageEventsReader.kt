package dev.timeframe.collector.usage

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import dev.timeframe.collector.db.UsageEventEntity

class UsageEventsReader(private val context: Context) {
    private val usageStatsManager: UsageStatsManager? =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager

    fun readEvents(startMs: Long, endMs: Long): List<UsageEventEntity> {
        val manager = usageStatsManager ?: return emptyList()
        val events = manager.queryEvents(startMs, endMs)
        val result = mutableListOf<UsageEventEntity>()
        val event = UsageEvents.Event()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            // Filter relevant event types: ACTIVITY_RESUMED (1), ACTIVITY_PAUSED (2), ACTIVITY_STOPPED (23)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
                event.eventType == UsageEvents.Event.ACTIVITY_PAUSED ||
                event.eventType == UsageEvents.Event.ACTIVITY_STOPPED
            ) {
                result.add(
                    UsageEventEntity(
                        event_time_ms = event.timeStamp,
                        package_name = event.packageName,
                        event_type = event.eventType,
                        class_name = event.className
                    )
                )
            }
        }
        return result
    }
}
