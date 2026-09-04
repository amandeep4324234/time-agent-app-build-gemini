import { DayMetrics, EnrichedSession } from "./types";
import { getLogicalDay, isLightDay } from "./day";
import { computeTrackedMetrics } from "./union";
import { computeFocusRuns } from "./focus-run";
import { computeMix } from "./mix";
import { computeTopSinks } from "./top-sinks";
import { computeHealth } from "./health";
import { computeDayHeatmap } from "./heatmap";

/**
 * Orchestrator: computes the seven numbers in spec order for a selected logical day.
 * 1. Focus-set time
 * 2. Sink
 * 3. Blocks >= 15 min & longest
 * 4. Share of tracked time (Mix ring)
 * 5. Top 5 sinks
 * 6. Hours by source & banner
 * 7. Heatmap
 */
export function computeDay(
  logicalDate: string,
  ledger: EnrichedSession[],
  settings: { deathFloor?: number } = {},
  nowMs = Date.now(),
  tz = "Asia/Kolkata"
): DayMetrics {
  const deathFloor = settings.deathFloor ?? 5;
  const daySessions = ledger.filter((s) => getLogicalDay(s.started_at_ms, tz) === logicalDate);

  // 1. Focus hours
  const focusSessions = daySessions.filter((s) => s.category === "work");
  const focusMetrics = computeTrackedMetrics(focusSessions);
  const focusHours = focusMetrics.unionHours;

  // 2. Sink hours
  const sinkSessions = daySessions.filter((s) => s.category === "sink");
  const sinkMetrics = computeTrackedMetrics(sinkSessions);
  const sinkHours = sinkMetrics.unionHours;

  // 3. Deep blocks & longest run
  const { deepBlocksCount, longestMinutes, runs } = computeFocusRuns(daySessions, deathFloor);

  // 4. Mix ring & badges
  // Check if sustained unclassified (3 consecutive days > 15%)
  let isSustainedUnclassified = false;
  const dateObj = new Date(`${logicalDate}T00:00:00Z`);
  const prevDate1Obj = new Date(dateObj.getTime() - 24 * 60 * 60 * 1000);
  const prevDate2Obj = new Date(dateObj.getTime() - 48 * 60 * 60 * 1000);
  const prevDay1 = prevDate1Obj.toISOString().slice(0, 10);
  const prevDay2 = prevDate2Obj.toISOString().slice(0, 10);

  const day0Mix = computeMix(daySessions, false);
  const day1Sessions = ledger.filter((s) => getLogicalDay(s.started_at_ms, tz) === prevDay1);
  const day2Sessions = ledger.filter((s) => getLogicalDay(s.started_at_ms, tz) === prevDay2);

  if (day1Sessions.length > 0 && day2Sessions.length > 0) {
    const day1Mix = computeMix(day1Sessions, false);
    const day2Mix = computeMix(day2Sessions, false);
    if (
      day0Mix.unclassifiedPercent > 15 &&
      day1Mix.unclassifiedPercent > 15 &&
      day2Mix.unclassifiedPercent > 15
    ) {
      isSustainedUnclassified = true;
    }
  }

  const mix = computeMix(daySessions, isSustainedUnclassified);

  // 5. Top 5 sinks
  const topSinks = computeTopSinks(daySessions);

  // 6. Hours by source & banner
  const sources = computeHealth(ledger, logicalDate, nowMs, tz);

  // 7. Heatmap (24 hours)
  const heatmapHours = computeDayHeatmap(ledger, logicalDate, tz);
  const heatmap = [heatmapHours]; // Array of 24-bucket rows

  // Light-day badge check (< 45 tracked minutes on that device)
  const dayTracked = computeTrackedMetrics(daySessions);
  const lightDay = isLightDay(dayTracked.unionSeconds);

  return {
    date: logicalDate,
    focusHours,
    sinkHours,
    blocksCount: deepBlocksCount,
    longestMinutes,
    lightDay,
    mix,
    topSinks,
    sources,
    heatmap,
    lab: {
      rawSumHours: dayTracked.rawSumHours,
      unionHours: dayTracked.unionHours,
      doubleCountHours: dayTracked.doubleCountHours,
      runCount: runs.length,
    },
  };
}
