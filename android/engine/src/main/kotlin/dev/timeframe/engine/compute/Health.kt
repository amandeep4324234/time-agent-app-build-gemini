package dev.timeframe.engine.compute

import dev.timeframe.engine.clean.EnrichedSessionRow
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

object Health {
    data class Output(
        val phoneHours: Double?,
        val computerHours: Double?,
        val phoneOffSince: String?,
        val computerOffSince: String?
    )

    fun compute(
        sessions: List<EnrichedSessionRow>,
        currentLogicalDay: LocalDate,
        zoneId: ZoneId = ZoneId.of("Asia/Kolkata")
    ): Output {
        val phoneSessions = sessions.filter { it.device == "phone" }
        val compSessions = sessions.filter { it.device == "computer" }

        val todayPhone = phoneSessions.filter {
            Instant.ofEpochMilli(it.started_at_ms).atZone(zoneId).minusHours(4).toLocalDate() == currentLogicalDay
        }
        val todayComp = compSessions.filter {
            Instant.ofEpochMilli(it.started_at_ms).atZone(zoneId).minusHours(4).toLocalDate() == currentLogicalDay
        }

        val phoneH = if (todayPhone.isNotEmpty()) {
            Math.round(todayPhone.sumOf { it.seconds } / 3600.0 * 100.0) / 100.0
        } else null

        val compH = if (todayComp.isNotEmpty()) {
            Math.round(todayComp.sumOf { it.seconds } / 3600.0 * 100.0) / 100.0
        } else null

        val lastPhoneMs = phoneSessions.maxOfOrNull { it.ended_at_ms }
        val lastCompMs = compSessions.maxOfOrNull { it.ended_at_ms }

        val formatter = DateTimeFormatter.ofPattern("LLL d", Locale.US)
        var phoneOffSince: String? = null
        var computerOffSince: String? = null

        if (lastPhoneMs != null && phoneH == null) {
            val lastDay = Instant.ofEpochMilli(lastPhoneMs).atZone(zoneId).minusHours(4).toLocalDate()
            if (lastDay.isBefore(currentLogicalDay)) {
                phoneOffSince = lastDay.plusDays(1).format(formatter)
            }
        }

        if (lastCompMs != null && compH == null) {
            val lastDay = Instant.ofEpochMilli(lastCompMs).atZone(zoneId).minusHours(4).toLocalDate()
            if (lastDay.isBefore(currentLogicalDay)) {
                computerOffSince = lastDay.plusDays(1).format(formatter)
            }
        }

        return Output(
            phoneHours = phoneH,
            computerHours = compH,
            phoneOffSince = phoneOffSince,
            computerOffSince = computerOffSince
        )
    }
}
