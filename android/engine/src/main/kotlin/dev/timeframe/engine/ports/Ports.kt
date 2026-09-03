package dev.timeframe.engine.ports

import kotlinx.serialization.Serializable

enum class Device {
    PHONE, COMPUTER
}

@Serializable
data class SessionRow(
    val id: String,
    val source: String,
    val device: String,
    val label: String,
    val started_at: String,
    val ended_at: String?,
    val seconds: Long,
    val minutes: Double,
    val timezone: String? = null,
    val session_kind: String? = null
)

@Serializable
data class Pin(
    val match_key: String,
    val category: String, // work, sink, games, other
    val origin: String    // seed, user
)

@Serializable
data class Entitlement(
    val aid: String?,
    val tier: String,
    val plan: String?,
    val src: String?,
    val ref: String?,
    val skin: String?,
    val valid_until: String?,
    val jti: String?
)

@Serializable
data class Sku(val id: String)

@Serializable
data class PairingCode(val code: String)

@Serializable
data class KillerName(val label: String, val isPrivate: Boolean)

@Serializable
data class LogEntry(
    val timestamp: Long,
    val level: String,
    val message: String
)

@Serializable
data class EncryptedSyncRow(
    val pair_id: String,
    val seq: Long,
    val nonce: String,
    val ciphertext: String,
    val updated_at: String,
    val expires_at: String
)

interface SessionStore {
    suspend fun upsertAll(rows: List<SessionRow>)
    suspend fun sessionsIn(fromMs: Long, toMs: Long): List<SessionRow>
    suspend fun lastWriteMs(device: Device): Long?
    suspend fun wipe()
}

interface PinStore {
    suspend fun pins(): List<Pin>
    suspend fun upsert(pin: Pin)
}

interface PaymentGateway {
    suspend fun currentEntitlement(): Entitlement
    suspend fun purchase(sku: Sku)
}

interface EntitlementSource {
    suspend fun read(): Entitlement?
    suspend fun write(e: Entitlement)
}

interface RestoreApi {
    suspend fun restore(code: PairingCode, deviceAid: String): Entitlement
}

interface InterruptNotifier {
    fun blockBroken(killer: KillerName)
}

interface LedgerIO {
    suspend fun writeEnvelope(json: String): Boolean
    suspend fun readEnvelope(): String?
}

interface LogPort {
    fun log(entry: LogEntry)
}

interface SyncStore {
    suspend fun publish(row: EncryptedSyncRow)
    suspend fun poll(): EncryptedSyncRow?
}
