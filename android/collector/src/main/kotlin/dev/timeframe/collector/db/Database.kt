package dev.timeframe.collector.db

import androidx.room.*
import dev.timeframe.engine.ports.Device
import dev.timeframe.engine.ports.Pin
import dev.timeframe.engine.ports.PinStore
import dev.timeframe.engine.ports.SessionRow
import dev.timeframe.engine.ports.SessionStore

@Entity(
    tableName = "usage_events",
    primaryKeys = ["event_time_ms", "package_name", "event_type"]
)
data class UsageEventEntity(
    val event_time_ms: Long,
    val package_name: String,
    val event_type: Int,
    val class_name: String? = null
)

@Entity(
    tableName = "sessions",
    indices = [Index(value = ["started_at_ms"])]
)
data class SessionEntity(
    @PrimaryKey val id: String,
    val source: String,
    val device: String,
    val label: String,
    val started_at: String,
    val ended_at: String?,
    val seconds: Long,
    val minutes: Double,
    val session_kind: String?,
    val timezone: String,
    val canonical_app: String?,
    val category: String?,
    val user_override: String?,
    val started_at_ms: Long
)

@Entity(tableName = "focus_blocks")
data class FocusBlockEntity(
    @PrimaryKey val block_id: String,
    val started_at_ms: Long,
    val ended_at_ms: Long?,
    val target_minutes: Int?,
    val state: String,
    val killer_label: String?,
    val killer_private: Int = 0,
    val death_floor_s: Int,
    val focus_label: String?,
    val origin_device: String,
    val updated_at_ms: Long,
    val seq: Int
)

@Entity(tableName = "collector_health")
data class CollectorHealthEntity(
    @PrimaryKey val checked_at_ms: Long,
    val has_usage_access: Int,
    val watermark_ms: Long
)

@Entity(tableName = "user_pins")
data class UserPinEntity(
    @PrimaryKey val match_key: String,
    val category: String,
    val origin: String
)

@Dao
interface SessionDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(sessions: List<SessionEntity>)

    @Query("SELECT * FROM sessions WHERE started_at_ms >= :fromMs AND started_at_ms <= :toMs ORDER BY started_at_ms ASC")
    suspend fun sessionsBetween(fromMs: Long, toMs: Long): List<SessionEntity>

    @Query("SELECT MAX(started_at_ms + seconds * 1000) FROM sessions WHERE device = :device")
    suspend fun lastWriteMs(device: String): Long?

    @Query("DELETE FROM sessions")
    suspend fun clear()
}

@Dao
interface PinDao {
    @Query("SELECT * FROM user_pins")
    suspend fun getAll(): List<UserPinEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(pin: UserPinEntity)

    @Query("DELETE FROM user_pins")
    suspend fun clear()
}

@Database(
    entities = [
        UsageEventEntity::class,
        SessionEntity::class,
        FocusBlockEntity::class,
        CollectorHealthEntity::class,
        UserPinEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class TimeframeDatabase : RoomDatabase() {
    abstract fun sessionDao(): SessionDao
    abstract fun pinDao(): PinDao
}

class RoomSessionStore(private val dao: SessionDao) : SessionStore {
    override suspend fun upsertAll(rows: List<SessionRow>) {
        dao.insertAll(rows.map {
            SessionEntity(
                id = it.id,
                source = it.source,
                device = it.device,
                label = it.label,
                started_at = it.started_at,
                ended_at = it.ended_at,
                seconds = it.seconds,
                minutes = it.minutes,
                session_kind = it.session_kind,
                timezone = it.timezone ?: "Asia/Kolkata",
                canonical_app = null,
                category = null,
                user_override = null,
                started_at_ms = java.time.Instant.parse(it.started_at).toEpochMilli()
            )
        })
    }

    override suspend fun sessionsIn(fromMs: Long, toMs: Long): List<SessionRow> {
        return dao.sessionsBetween(fromMs, toMs).map {
            SessionRow(
                id = it.id,
                source = it.source,
                device = it.device,
                label = it.label,
                started_at = it.started_at,
                ended_at = it.ended_at,
                seconds = it.seconds,
                minutes = it.minutes,
                timezone = it.timezone,
                session_kind = it.session_kind
            )
        }
    }

    override suspend fun lastWriteMs(device: Device): Long? {
        val devStr = if (device == Device.PHONE) "phone" else "computer"
        return dao.lastWriteMs(devStr)
    }

    override suspend fun wipe() {
        dao.clear()
    }
}

class RoomPinStore(private val dao: PinDao) : PinStore {
    override suspend fun pins(): List<Pin> {
        return dao.getAll().map { Pin(it.match_key, it.category, it.origin) }
    }

    override suspend fun upsert(pin: Pin) {
        dao.upsert(UserPinEntity(pin.match_key, pin.category, pin.origin))
    }
}
