package dev.timeframe.engine.compute

import dev.timeframe.engine.clean.EnrichedSessionRow
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

object Week {
    data class Output(
        val totalHours: Double,
        val focusHours: Double,
        val sinkHours: Double,
        val blocksCount: Int,
        val longestMinutes: Long,
        val trackedDays: Int,
        val phoneDays: Int,
        val computerDays: Int,
        val unclassifiedPercent: Int,
        val doubleCountedHours: Double,
        val footer: String
    )

    fun compute(
        sessions: List<EnrichedSessionRow>,
        zoneId: ZoneId = ZoneId.of("Asia/Kolkata"),
        deathFloorSeconds: Int = 5
    ): Output {
        val nonPrivate = sessions.filter { it.category != "private" }
        val daySet = mutableSetOf<LocalDate>()
        val phoneDaySet = mutableSetOf<LocalDate>()
        val compDaySet = mutableSetOf<LocalDate>()

        for (s in sessions) {
            val localDt = Instant.ofEpochMilli(s.started_at_ms).atZone(zoneId).minusHours(4).toLocalDate()
            daySet.add(localDt)
            if (s.device == "phone") phoneDaySet.add(localDt)
            if (s.device == "computer") compDaySet.add(localDt)
        }

        val d = maxOf(1, daySet.size)
        val dp = phoneDaySet.size
        val dc = compDaySet.size

        val overallMetrics = Union.computeTrackedMetrics(sessions)
        val focusSessions = nonPrivate.filter { it.category == "work" }
        val focusHours = Union.computeTrackedMetrics(focusSessions).unionHours

        val sinkSessions = nonPrivate.filter { it.category == "sink" }
        val sinkHours = Union.computeTrackedMetrics(sinkSessions).unionHours

        val focusRunOutput = FocusRun.compute(nonPrivate, deathFloorSeconds)

        // Denominator
        var workSec = 0L
        var sinkSec = 0L
        var gamesSec = 0L
        var otherSec = 0L
        var unclassifiedSec = 0L

        for (s in nonPrivate) {
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

        val hStr = String.format(java.util.Locale.US, "%.2f", overallMetrics.doubleCountHours)
        val footer = "Tracked $d days · phone up $dp/$d · computer up $dc/$d · unclassified $u% · double-counted ${hStr}h"

        return Output(
            totalHours = overallMetrics.unionHours,
            focusHours = focusHours,
            sinkHours = sinkHours,
            blocksCount = focusRunOutput.deepBlocksCount,
            longestMinutes = focusRunOutput.longestMinutes,
            trackedDays = d,
            phoneDays = dp,
            computerDays = dc,
            unclassifiedPercent = u,
            doubleCountedHours = overallMetrics.doubleCountHours,
            footer = footer
        )
    }

    data class CardStatRow(val label: String, val value: String)

    data class CardModel(
        val label: String,
        val hero: String,
        val stats: List<CardStatRow>,
        val footer: String
    )

    fun computeWeek(
        sessions: List<EnrichedSessionRow>,
        zoneId: ZoneId = ZoneId.of("Asia/Kolkata"),
        deathFloorSeconds: Int = 5
    ): Output = compute(sessions, zoneId, deathFloorSeconds)

    fun buildCardModel(output: Output, label: String = "phone this week"): CardModel {
        val heroStr = String.format(java.util.Locale.US, "%.1fh", output.focusHours)
        val stats = listOf(
            CardStatRow("focus time", heroStr),
            CardStatRow("sink time", String.format(java.util.Locale.US, "%.1fh", output.sinkHours)),
            CardStatRow("deep blocks", "${output.blocksCount}"),
            CardStatRow("longest run", "${output.longestMinutes}m")
        )
        return CardModel(label = label, hero = heroStr, stats = stats, footer = output.footer)
    }
}
