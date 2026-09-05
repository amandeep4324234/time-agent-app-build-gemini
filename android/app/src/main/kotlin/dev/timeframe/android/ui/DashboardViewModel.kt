package dev.timeframe.android.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.timeframe.android.billing.EntitlementStore
import dev.timeframe.collector.db.CollectorHealthDao
import dev.timeframe.collector.db.SessionDao
import dev.timeframe.collector.db.SessionEntity
import dev.timeframe.engine.clean.EnrichedSessionRow
import dev.timeframe.engine.compute.DayMetricsOutput
import dev.timeframe.engine.compute.Metrics
import dev.timeframe.engine.compute.Week
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.ZoneId

data class DashboardUiState(
    val selectedDate: LocalDate = LocalDate.now(),
    val dayMetrics: DayMetricsOutput? = null,
    val weekCardModel: Week.CardModel? = null,
    val isPro: Boolean = false,
    val phoneTrackerOffSince: String? = null,
    val computerTrackerOffSince: String? = null,
    val isLoading: Boolean = true
)

class DashboardViewModel(
    private val sessionDao: SessionDao,
    private val healthDao: CollectorHealthDao,
    private val entitlementStore: EntitlementStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState

    init {
        loadData(LocalDate.now())
    }

    fun selectDate(date: LocalDate) {
        loadData(date)
    }

    fun loadData(date: LocalDate) {
        viewModelScope.launch(Dispatchers.IO) {
            val isPro = entitlementStore.getEntitlement().tier == "pro"

            val allSessionEntities = sessionDao.sessionsBetween(0, Long.MAX_VALUE)
            val enrichedRows = allSessionEntities.map { toEnrichedRow(it) }

            val dayMetrics = Metrics.computeDay(
                logicalDate = date,
                sessions = enrichedRows,
                zoneId = ZoneId.of("Asia/Kolkata")
            )

            val weekMetrics = Week.computeWeek(enrichedRows, ZoneId.of("Asia/Kolkata"))
            val weekCard = Week.buildCardModel(weekMetrics, "phone this week")

            val phoneOffSince = dayMetrics.sources.phoneOffSince?.let { "Phone tracker off since $it" }
            val computerOffSince = dayMetrics.sources.computerOffSince?.let { "Computer tracker off since $it" }

            _uiState.value = DashboardUiState(
                selectedDate = date,
                dayMetrics = dayMetrics,
                weekCardModel = weekCard,
                isPro = isPro,
                phoneTrackerOffSince = phoneOffSince,
                computerTrackerOffSince = computerOffSince,
                isLoading = false
            )
        }
    }

    private fun toEnrichedRow(e: SessionEntity): EnrichedSessionRow {
        val cat = e.category ?: if (e.label.contains("Instagram", ignoreCase = true) ||
            e.label.contains("YouTube", ignoreCase = true) ||
            e.label.contains("Reddit", ignoreCase = true) ||
            e.label.contains("Discord", ignoreCase = true)
        ) "sink" else if (e.label.contains("Chrome", ignoreCase = true) && e.device == "phone") "unclassified" else "work"

        val endMs = e.ended_at?.let {
            try { java.time.Instant.parse(it).toEpochMilli() } catch (_: Exception) { e.started_at_ms + e.seconds * 1000 }
        } ?: (e.started_at_ms + e.seconds * 1000)

        return EnrichedSessionRow(
            id = e.id,
            source = e.source,
            device = e.device,
            label = e.label,
            started_at = e.started_at,
            ended_at = e.ended_at,
            seconds = e.seconds,
            minutes = e.minutes,
            timezone = e.timezone,
            canonical_app = e.canonical_app ?: e.label,
            category = cat,
            session_kind = e.session_kind ?: "block",
            started_at_ms = e.started_at_ms,
            ended_at_ms = endMs
        )
    }
}
