package dev.timeframe.collector.usage

import dev.timeframe.collector.db.SessionEntity
import dev.timeframe.collector.db.UsageEventEntity
import java.time.Instant
import java.time.ZoneId

object SessionDeriver {
    /**
     * Derives usage sessions from an ordered list of usage events.
     * Generates deterministic IDs: "android:{package}:{started_at_ms}".
     */
    fun deriveSessions(
        events: List<UsageEventEntity>,
        timezoneId: String = ZoneId.systemDefault().id
    ): List<SessionEntity> {
        val sorted = events.sortedBy { it.event_time_ms }
        val sessions = mutableListOf<SessionEntity>()

        var currentPackage: String? = null
        var currentStartMs: Long = 0

        for (event in sorted) {
            when (event.event_type) {
                1 -> { // ACTIVITY_RESUMED
                    if (currentPackage != null && currentPackage != event.package_name) {
                        // Close preceding session
                        val endMs = event.event_time_ms
                        val sec = maxOf(1L, (endMs - currentStartMs) / 1000)
                        sessions.add(createEntity(currentPackage, currentStartMs, endMs, sec, timezoneId))
                    }
                    currentPackage = event.package_name
                    currentStartMs = event.event_time_ms
                }
                2, 23 -> { // ACTIVITY_PAUSED or ACTIVITY_STOPPED
                    if (currentPackage == event.package_name) {
                        val endMs = event.event_time_ms
                        val sec = maxOf(1L, (endMs - currentStartMs) / 1000)
                        sessions.add(createEntity(currentPackage, currentStartMs, endMs, sec, timezoneId))
                        currentPackage = null
                    }
                }
            }
        }
        return sessions
    }

    private fun createEntity(
        pkg: String,
        startMs: Long,
        endMs: Long,
        seconds: Long,
        tz: String
    ): SessionEntity {
        val kind = if (seconds < 5) "flicker" else if (seconds <= 120) "glance" else "block"
        val startIso = Instant.ofEpochMilli(startMs).toString()
        val endIso = Instant.ofEpochMilli(endMs).toString()

        return SessionEntity(
            id = "android:$pkg:$startMs",
            source = "android",
            device = "phone",
            label = pkg,
            started_at = startIso,
            ended_at = endIso,
            seconds = seconds,
            minutes = Math.round(seconds / 60.0 * 100.0) / 100.0,
            session_kind = kind,
            timezone = tz,
            canonical_app = null,
            category = null,
            user_override = null,
            started_at_ms = startMs
        )
    }
}
