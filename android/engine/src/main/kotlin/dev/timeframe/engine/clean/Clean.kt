package dev.timeframe.engine.clean

import dev.timeframe.engine.classify.Classify
import dev.timeframe.engine.ports.SessionRow
import java.time.Instant

data class EnrichedSessionRow(
    val id: String,
    val source: String,
    val device: String,
    val label: String,
    val started_at: String,
    val ended_at: String?,
    val seconds: Long,
    val minutes: Double,
    val timezone: String,
    val canonical_app: String,
    val category: String,
    val session_kind: String,
    val started_at_ms: Long,
    val ended_at_ms: Long
)

object Clean {
    val ALIAS_MAP = mapOf(
        "instagram.com" to "Instagram",
        "ig" to "Instagram",
        "Instagram" to "Instagram",
        "youtube.com" to "YouTube",
        "YouTube" to "YouTube",
        "discord.com" to "Discord",
        "Discord" to "Discord",
        "reddit.com" to "Reddit",
        "Reddit" to "Reddit",
        "grok.com" to "Grok",
        "assets.grok.com" to "Grok",
        "Grok" to "Grok",
        "chatgpt.com" to "ChatGPT",
        "ChatGPT" to "ChatGPT",
        "github.com" to "GitHub",
        "GitHub" to "GitHub",
        "lichess.org" to "Lichess",
        "Lichess" to "Lichess",
        "chess.com" to "Chess.com"
    )

    fun canonicalApp(label: String): String {
        return ALIAS_MAP[label] ?: ALIAS_MAP[label.trim()] ?: label.trim()
    }

    fun sessionKind(seconds: Long): String {
        return when {
            seconds < 5 -> "flicker"
            seconds <= 120 -> "glance"
            else -> "block"
        }
    }

    fun isSystem(label: String): Boolean {
        val l = label.lowercase()
        return l == "system ui kits" || l == "google play store" || l.contains("systemui") || l.contains("com.google.android.gms")
    }

    fun clean(
        rows: List<SessionRow>,
        userPins: Map<String, String> = emptyMap(),
        userOverrides: Map<String, String> = emptyMap(),
        seedMap: Map<String, String> = emptyMap()
    ): List<EnrichedSessionRow> {
        val enriched = rows.map { r ->
            val startMs = Instant.parse(r.started_at).toEpochMilli()
            val endMs = r.ended_at?.let { Instant.parse(it).toEpochMilli() } ?: (startMs + r.seconds * 1000)
            val kind = sessionKind(r.seconds)
            val canonical = canonicalApp(r.label)
            val cat = if (isSystem(r.label)) "system" else Classify.classify(r, userPins, userOverrides, seedMap)

            EnrichedSessionRow(
                id = r.id,
                source = r.source,
                device = r.device,
                label = r.label,
                started_at = r.started_at,
                ended_at = r.ended_at ?: Instant.ofEpochMilli(endMs).toString(),
                seconds = r.seconds,
                minutes = r.minutes,
                timezone = r.timezone ?: "Asia/Kolkata",
                canonical_app = canonical,
                category = cat,
                session_kind = kind,
                started_at_ms = startMs,
                ended_at_ms = endMs
            )
        }.sortedBy { it.started_at_ms }

        // Gap collapse: same canonical_app, same device, gap < 15s -> merge
        val collapsed = mutableListOf<EnrichedSessionRow>()
        for (current in enriched) {
            if (collapsed.isEmpty()) {
                collapsed.add(current)
                continue
            }

            val prev = collapsed.last()
            val gapSec = (current.started_at_ms - prev.ended_at_ms) / 1000.0
            val sameApp = prev.canonical_app == current.canonical_app
            val sameDevice = prev.device == current.device
            val isSinkFlicker = current.category == "sink" && current.session_kind == "flicker"
            val isPrevWork = prev.category == "work"

            if (sameApp && sameDevice && gapSec in 0.0..<15.0 && !(isSinkFlicker && isPrevWork)) {
                val newEndMs = maxOf(prev.ended_at_ms, current.ended_at_ms)
                val newSec = Math.round((newEndMs - prev.started_at_ms) / 1000.0)
                collapsed[collapsed.size - 1] = prev.copy(
                    ended_at_ms = newEndMs,
                    ended_at = Instant.ofEpochMilli(newEndMs).toString(),
                    seconds = newSec,
                    minutes = Math.round(newSec / 60.0 * 100.0) / 100.0,
                    session_kind = sessionKind(newSec)
                )
            } else {
                collapsed.add(current)
            }
        }

        return collapsed
    }
}
