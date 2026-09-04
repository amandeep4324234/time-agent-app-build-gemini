package dev.timeframe.collector.io

import android.content.Context
import android.net.Uri
import dev.timeframe.collector.db.SessionDao
import dev.timeframe.collector.db.SessionEntity
import kotlinx.serialization.json.Json
import java.io.BufferedReader
import java.io.InputStreamReader
import java.time.Instant

class ImportReader(private val context: Context, private val sessionDao: SessionDao) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun readImport(uri: Uri): Result<Int> {
        return try {
            val content = context.contentResolver.openInputStream(uri)?.use { stream ->
                BufferedReader(InputStreamReader(stream, Charsets.UTF_8)).readText()
            } ?: return Result.failure(IllegalArgumentException("Could not read file"))

            val envelope = json.decodeFromString<ExportEnvelope>(content)
            if (!envelope.schema.startsWith("timeframe.usage_sessions")) {
                return Result.failure(IllegalArgumentException("That file isn't a Timeframe export"))
            }

            val entities = envelope.sessions.map { s ->
                val startMs = try {
                    Instant.parse(s.started_at).toEpochMilli()
                } catch (_: Exception) {
                    0L
                }

                SessionEntity(
                    id = s.id,
                    source = s.source,
                    device = s.device,
                    label = s.label,
                    started_at = s.started_at,
                    ended_at = s.ended_at,
                    seconds = s.seconds,
                    minutes = s.minutes,
                    session_kind = s.session_kind,
                    timezone = s.timezone ?: "Asia/Kolkata",
                    canonical_app = null,
                    category = null,
                    user_override = null,
                    started_at_ms = startMs
                )
            }

            sessionDao.insertAll(entities)
            Result.success(entities.size)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
