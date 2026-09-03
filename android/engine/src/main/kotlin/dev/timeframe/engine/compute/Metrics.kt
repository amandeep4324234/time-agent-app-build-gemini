package dev.timeframe.engine.compute

import dev.timeframe.engine.clean.EnrichedSessionRow
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

data class DayMetricsOutput(
    val date: String,
    val focusHours: Double,
    val sinkHours: Double,
    val blocksCount: Int,
    val longestMinutes: Long,
    val lightDay: Boolean,
    val unclassifiedPercent: Int,
    val sources: Health.Output
)

object Metrics {
    fun computeDay(
        logicalDate: LocalDate,
        sessions: List<EnrichedSessionRow>,
        zoneId: ZoneId = ZoneId.of("Asia/Kolkata"),
        deathFloorSeconds: Int = 5
    ): DayMetricsOutput {
        val daySessions = sessions.filter {
            Instant.ofEpochMilli(it.started_at_ms).atZone(zoneId).minusHours(4).toLocalDate() == logicalDate
        }

        val focusSessions = daySessions.filter { it.category == "work" }
        val focusHours = Union.computeTrackedMetrics(focusSessions).unionHours

        val sinkSessions = daySessions.filter { it.category == "sink" }
        val sinkHours = Union.computeTrackedMetrics(sinkSessions).unionHours

        val focusRunOutput = FocusRun.compute(daySessions, deathFloorSeconds)

        val dayMetrics = Union.computeTrackedMetrics(daySessions)
        val lightDay = dayMetrics.unionSeconds < 45 * 60

        // Unclassified
        var workSec = 0L
        var sinkSec = 0L
        var gamesSec = 0L
        var otherSec = 0L
        var unclassifiedSec = 0L
        for (s in daySessions) {
            if (s.session_kind == "flicker" || s.category == "system" || s.category == "private") continue
            when (s.category) {
                "work" -> workSec += s.seconds
                "sink" -> sinkSec += s.seconds
                "games" -> gamesSec += s.seconds
                "other-known" -> otherSec += s.seconds
                else -> unclassifiedSec += s.seconds
            }
        }
        val denom = workSec + sinkSec + gamesSec + otherSec + unclassifiedSec
        val u = if (denom > 0) Math.round((unclassifiedSec.toDouble() / denom.toDouble()) * 100).toInt() else 0

        val health = Health.compute(sessions, logicalDate, zoneId)

        return DayMetricsOutput(
            date = logicalDate.toString(),
            focusHours = focusHours,
            sinkHours = sinkHours,
            blocksCount = focusRunOutput.deepBlocksCount,
            longestMinutes = focusRunOutput.longestMinutes,
            lightDay = lightDay,
            unclassifiedPercent = u,
            sources = health
        )
    }
}
