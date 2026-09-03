package dev.timeframe.engine

import dev.timeframe.engine.clean.Clean
import dev.timeframe.engine.compute.Health
import dev.timeframe.engine.compute.Union
import dev.timeframe.engine.compute.Week
import dev.timeframe.engine.ingest.Ingest
import dev.timeframe.engine.ports.SessionRow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.time.LocalDate

@Serializable
data class GoldenData(
    val days: Int,
    val phoneDays: Int,
    val computerDays: Int,
    val unionHours: Double,
    val rawSumHours: Double,
    val doubleCountHours: Double,
    val androidLiveDaySessions: Int,
    val androidLiveDayHours: Double,
    val bannerText: String
)

@Serializable
data class EnvelopeData(
    val schema: String,
    val exported_at: String,
    val count: Int,
    val sessions: List<SessionRow>
)

class RuleIdentityTest {
    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun testRuleIdentityWithGoldens() {
        val goldensFile = File("src/test/resources/goldens.json")
        if (!goldensFile.exists()) return

        val goldens = json.decodeFromString<GoldenData>(goldensFile.readText())

        // Load fixtures
        val fixtureFile = File("../../spec-inputs/demo-sessions.json")
        if (!fixtureFile.exists()) return

        val envelope = json.decodeFromString<EnvelopeData>(fixtureFile.readText())
        val ingested = Ingest.dedupeAndGuard(envelope.sessions)

        val seedMapFile = File("src/test/resources/seed-map.json")
        val seedMap = if (seedMapFile.exists()) {
            json.decodeFromString<Map<String, String>>(seedMapFile.readText())
        } else emptyMap()

        val cleaned = Clean.clean(ingested, seedMap = seedMap)
        val week = Week.compute(cleaned)

        assertEquals(goldens.days, week.trackedDays)
        assertEquals(goldens.phoneDays, week.phoneDays)
        assertEquals(goldens.computerDays, week.computerDays)
        assertEquals(goldens.unionHours, week.totalHours, 0.01)
        assertEquals(goldens.doubleCountHours, week.doubleCountedHours, 0.01)

        val androidSessions = cleaned.filter { it.device == "phone" }
        assertEquals(goldens.androidLiveDaySessions, androidSessions.size)
        val androidMetrics = Union.computeTrackedMetrics(androidSessions)
        assertEquals(goldens.androidLiveDayHours, androidMetrics.rawSumHours, 0.01)

        val health = Health.compute(cleaned, LocalDate.parse("2026-09-02"))
        assertEquals("Aug 28", health.phoneOffSince)
    }
}
