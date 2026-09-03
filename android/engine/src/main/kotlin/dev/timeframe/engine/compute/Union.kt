package dev.timeframe.engine.compute

import dev.timeframe.engine.clean.EnrichedSessionRow

data class Interval(val startMs: Long, val endMs: Long)

object Union {
    fun computeUnionDurationSeconds(intervals: List<Interval>, afkBridgeMaxMs: Long = 0): Double {
        val valid = intervals.filter { it.endMs > it.startMs }.sortedBy { it.startMs }
        if (valid.isEmpty()) return 0.0

        val merged = mutableListOf<Interval>()
        var current = valid[0]

        for (i in 1 until valid.size) {
            val next = valid[i]
            if (next.startMs <= current.endMs + afkBridgeMaxMs) {
                current = current.copy(endMs = maxOf(current.endMs, next.endMs))
            } else {
                merged.add(current)
                current = next
            }
        }
        merged.add(current)

        val totalMs = merged.sumOf { it.endMs - it.startMs }
        return totalMs / 1000.0
    }

    data class TrackedMetrics(
        val rawSumSeconds: Long,
        val rawSumHours: Double,
        val unionSeconds: Double,
        val unionHours: Double,
        val doubleCountHours: Double
    )

    fun computeTrackedMetrics(sessions: List<EnrichedSessionRow>): TrackedMetrics {
        val rawSumSec = sessions.sumOf { it.seconds }
        val rawSumH = Math.round((rawSumSec / 3600.0) * 100.0) / 100.0

        val intervals = sessions.map { Interval(it.started_at_ms, it.ended_at_ms) }
        val unionSec = computeUnionDurationSeconds(intervals, 0)
        val unionH = Math.round((unionSec / 3600.0) * 100.0) / 100.0
        val doubleCountH = Math.round(maxOf(0.0, rawSumH - unionH) * 100.0) / 100.0

        return TrackedMetrics(
            rawSumSeconds = rawSumSec,
            rawSumHours = rawSumH,
            unionSeconds = unionSec,
            unionHours = unionH,
            doubleCountHours = doubleCountH
        )
    }
}
