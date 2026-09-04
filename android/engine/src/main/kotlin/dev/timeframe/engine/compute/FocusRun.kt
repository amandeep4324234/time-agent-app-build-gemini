package dev.timeframe.engine.compute

import dev.timeframe.engine.clean.EnrichedSessionRow

data class FocusRunResult(
    val startMs: Long,
    val endMs: Long,
    val durationSeconds: Long,
    val fillerSeconds: Long
)

/**
 * Focus-run (one rule)
 *
 * A known sink >= death floor (default 5s, user 3/5/10) ends the run.
 *
 * Everything else that is not work is filler (gap with no row, system, unknown,
 * browser_generic, games, other non-work): it may sit inside the run only while
 * each filler incident is <=60s and all filler <=10% of the finished run.
 * Longer filler ends the run.
 *
 * The run also requires every contributing device to be work, filler, or a <=60s gap
 * at that instant. A >60s hole on one device ends the run even if the other device is still busy.
 *
 * Run length = wall-clock of that interval. Sub-floor sink flickers do not end the run;
 * they still add wall time; they do not spend the 10% pool (they are sinks, just short).
 *
 * Live blocks (the creature) do not use this cap. They die only on a known sink >= death floor, or cancel.
 */
object FocusRun {
    data class Output(
        val runs: List<FocusRunResult>,
        val deepBlocksCount: Int,
        val longestMinutes: Long
    )

    fun compute(
        sessions: List<EnrichedSessionRow>,
        deathFloorSeconds: Int = 5
    ): Output {
        val sorted = sessions.sortedBy { it.started_at_ms }
        val runs = mutableListOf<FocusRunResult>()

        var i = 0
        while (i < sorted.size) {
            if (sorted[i].category != "work") {
                i++
                continue
            }

            val runStart = sorted[i].started_at_ms
            var runEnd = sorted[i].ended_at_ms
            var fillerMs = 0L
            val contributing = mutableSetOf(sorted[i].device)
            val lastDeviceActivity = mutableMapOf(sorted[i].device to sorted[i].ended_at_ms)

            var j = i + 1
            var runTerminatedAt: Long? = null

            while (j < sorted.size) {
                val s = sorted[j]
                val overallGapSec = (s.started_at_ms - runEnd) / 1000.0
                if (overallGapSec > 60.0) {
                    runTerminatedAt = runEnd
                    break
                }

                // Rule D: >60s hole on any contributing device
                var deviceHoleEnd: Long? = null
                for (dev in contributing) {
                    val lastEnd = lastDeviceActivity[dev] ?: runStart
                    if (s.started_at_ms - lastEnd > 60_000) {
                        deviceHoleEnd = lastEnd + 60_000
                        break
                    }
                }
                if (deviceHoleEnd != null && deviceHoleEnd < s.started_at_ms) {
                    runTerminatedAt = deviceHoleEnd
                    break
                }

                contributing.add(s.device)

                if (s.category == "work") {
                    runEnd = maxOf(runEnd, s.ended_at_ms)
                    lastDeviceActivity[s.device] = maxOf(lastDeviceActivity[s.device] ?: 0L, s.ended_at_ms)
                    j++
                } else if (s.category == "sink") {
                    if (s.seconds >= deathFloorSeconds) {
                        runTerminatedAt = s.started_at_ms
                        break
                    } else {
                        runEnd = maxOf(runEnd, s.ended_at_ms)
                        lastDeviceActivity[s.device] = maxOf(lastDeviceActivity[s.device] ?: 0L, s.ended_at_ms)
                        j++
                    }
                } else {
                    // Filler
                    val gapMs = maxOf(0L, s.started_at_ms - runEnd)
                    if (gapMs > 60_000) {
                        runTerminatedAt = runEnd
                        break
                    }
                    if (s.seconds > 60) {
                        runTerminatedAt = s.started_at_ms
                        break
                    }
                    val durMs = s.ended_at_ms - s.started_at_ms
                    val candidatePool = fillerMs + gapMs + durMs
                    val candidateRunLen = s.ended_at_ms - runStart
                    if (candidatePool > 0.10 * candidateRunLen) {
                        runTerminatedAt = s.started_at_ms
                        break
                    }
                    fillerMs = candidatePool
                    runEnd = maxOf(runEnd, s.ended_at_ms)
                    lastDeviceActivity[s.device] = maxOf(lastDeviceActivity[s.device] ?: 0L, s.ended_at_ms)
                    j++
                }
            }

            val finalEnd = runTerminatedAt ?: runEnd
            val durationSec = maxOf(0L, (finalEnd - runStart) / 1000)

            if (durationSec > 0) {
                runs.add(
                    FocusRunResult(
                        startMs = runStart,
                        endMs = finalEnd,
                        durationSeconds = durationSec,
                        fillerSeconds = fillerMs / 1000
                    )
                )
            }

            var nextI = i + 1
            if (runTerminatedAt != null) {
                while (nextI < sorted.size && sorted[nextI].started_at_ms < finalEnd) {
                    nextI++
                }
            } else {
                nextI = maxOf(i + 1, j)
            }
            i = maxOf(i + 1, nextI)
        }

        val deepCount = runs.count { it.durationSeconds >= 15 * 60 }
        val longestSec = runs.maxOfOrNull { it.durationSeconds } ?: 0L
        val longestMin = Math.round(longestSec / 60.0)

        return Output(
            runs = runs,
            deepBlocksCount = deepCount,
            longestMinutes = longestMin
        )
    }
}
