import { EnrichedSession, WeekMetrics, WeekCardModel } from "./types";
import { getLogicalDay } from "./day";
import { computeTrackedMetrics } from "./union";
import { computeFocusRuns } from "./focus-run";
import { computeMix } from "./mix";
import { COPY } from "./copy";

/**
 * Computes week metrics and verbatim footer.
 * Rule: Tracked {D} days · phone up {D_p}/{D} · computer up {D_c}/{D} · unclassified {U}% · double-counted {H}h
 */
export function computeWeek(
  sessions: EnrichedSession[],
  tz = "Asia/Kolkata",
  deathFloorSeconds = 5
): WeekMetrics {
  // Structural private fence: exclude private rows from breakdown display
  const nonPrivate = sessions.filter((s) => s.category !== "private");

  const daySet = new Set<string>();
  const phoneDaySet = new Set<string>();
  const compDaySet = new Set<string>();

  for (const s of sessions) {
    const day = getLogicalDay(s.started_at_ms, tz);
    daySet.add(day);
    if (s.device === "phone") phoneDaySet.add(day);
    if (s.device === "computer") compDaySet.add(day);
  }

  const D = daySet.size || 1;
  const D_p = phoneDaySet.size;
  const D_c = compDaySet.size;

  // Private rows contribute to totals (Section 6.8 C22)
  const { unionHours, doubleCountHours } = computeTrackedMetrics(sessions);

  const focusSessions = nonPrivate.filter((s) => s.category === "work");
  const focusTracked = computeTrackedMetrics(focusSessions);
  const focusHours = focusTracked.unionHours;

  const sinkSessions = nonPrivate.filter((s) => s.category === "sink");
  const sinkTracked = computeTrackedMetrics(sinkSessions);
  const sinkHours = sinkTracked.unionHours;

  const { deepBlocksCount, longestMinutes } = computeFocusRuns(nonPrivate, deathFloorSeconds);
  const mix = computeMix(sessions);
  const U = mix.unclassifiedPercent;

  const footer = COPY.footer.format(D, D_p, D_c, U, doubleCountHours.toFixed(2));

  return {
    totalHours: unionHours,
    focusHours,
    sinkHours,
    blocksCount: deepBlocksCount,
    longestMinutes,
    trackedDays: D,
    phoneDays: D_p,
    computerDays: D_c,
    unclassifiedPercent: U,
    doubleCountedHours: doubleCountHours,
    footer,
  };
}

/**
 * Creates the week card model for display or PNG export.
 */
export function buildWeekCardModel(
  weekMetrics: WeekMetrics,
  deviceSelector: "phone this week" | "laptop this week" | "merged export",
  isPaid: boolean
): WeekCardModel {
  const focusSharePercent = weekMetrics.totalHours > 0
    ? Math.round((weekMetrics.focusHours / weekMetrics.totalHours) * 100)
    : 0;

  const label = `${deviceSelector} · ${focusSharePercent}% focus-set time`;

  return {
    label,
    focusSharePercent,
    focusHours: weekMetrics.focusHours,
    sinkHours: weekMetrics.sinkHours,
    blocksCount: weekMetrics.blocksCount,
    longestMinutes: weekMetrics.longestMinutes,
    footer: weekMetrics.footer,
    clean: isPaid,
    watermark: !isPaid,
  };
}
