package dev.timeframe.collector.io

import android.content.Context
import android.net.Uri
import dev.timeframe.collector.db.SessionDao
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.OutputStreamWriter
import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Serializable
data class ExportEnvelope(
    val schema: String = "timeframe.usage_sessions/v1",
    val exported_at: String,
    val count: Int,
    val sessions: List<ExportSessionRow>
)

@Serializable
data class ExportSessionRow(
    val id: String,
    val source: String,
    val device: String,
    val label: String,
    val started_at: String,
    val ended_at: String?,
    val seconds: Long,
    val minutes: Double,
    val session_kind: String? = null,
    val timezone: String? = null
)

class ExportWriter(private val context: Context, private val sessionDao: SessionDao) {
    private val json = Json { prettyPrint = true }

    suspend fun writeExport(uri: Uri): Int {
        val allSessions = sessionDao.sessionsBetween(0, Long.MAX_VALUE)
        val nowIso = Instant.now().toString()

        val rows = allSessions.map { s ->
            // If open session at export time, close at export time
            val endedAt = s.ended_at ?: nowIso
            val sec = if (s.ended_at == null) {
                maxOf(1L, (Instant.parse(nowIso).toEpochMilli() - s.started_at_ms) / 1000)
            } else {
                s.seconds
            }

            ExportSessionRow(
                id = s.id,
                source = s.source,
                device = s.device,
                label = s.label,
                started_at = s.started_at,
                ended_at = endedAt,
                seconds = sec,
                minutes = Math.round(sec / 60.0 * 100.0) / 100.0,
                session_kind = s.session_kind,
                timezone = s.timezone
            )
        }

        val envelope = ExportEnvelope(
            schema = "timeframe.usage_sessions/v1",
            exported_at = nowIso,
            count = rows.size,
            sessions = rows
        )

        val jsonStr = json.encodeToString(envelope)
        context.contentResolver.openOutputStream(uri)?.use { os ->
            OutputStreamWriter(os, Charsets.UTF_8).use { writer ->
                writer.write(jsonStr)
            }
        }

        return rows.size
    }

    companion object {
        fun defaultFileName(): String {
            val dateStr = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE)
            return "timeframe-usage-$dateStr.json"
        }
    }
}
