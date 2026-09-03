package dev.timeframe.engine.ingest

import dev.timeframe.engine.ports.SessionRow
import java.time.Instant

object Ingest {
    fun validate(session: SessionRow): Boolean {
        if (session.id.isEmpty()) return false
        if (session.source != "chrome_extension" && session.source != "android") return false
        if (session.device != "computer" && session.device != "phone") return false
        if (session.label.isEmpty()) return false
        if (session.seconds <= 0) return false
        return try {
            Instant.parse(session.started_at)
            session.ended_at?.let { Instant.parse(it) }
            true
        } catch (_: Exception) {
            false
        }
    }

    fun dedupeAndGuard(rows: List<SessionRow>): List<SessionRow> {
        val seen = mutableSetOf<String>()
        val result = mutableListOf<SessionRow>()

        for (row in rows) {
            if (!validate(row)) continue
            if (seen.contains(row.id)) continue
            seen.add(row.id)

            val startMs = Instant.parse(row.started_at).toEpochMilli()
            val endMs = row.ended_at?.let { Instant.parse(it).toEpochMilli() } ?: (startMs + row.seconds * 1000)

            var sec = row.seconds
            val delta = Math.abs(endMs - startMs - sec * 1000)
            if (delta > 1000) {
                sec = Math.round((endMs - startMs) / 1000.0)
            }

            result.add(
                row.copy(
                    seconds = sec,
                    minutes = Math.round(sec / 60.0 * 100.0) / 100.0,
                    timezone = row.timezone ?: "Asia/Kolkata",
                    ended_at = row.ended_at ?: Instant.ofEpochMilli(endMs).toString()
                )
            )
        }
        return result
    }
}
