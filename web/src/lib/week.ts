import { EnrichedSession, WeekMetrics, WeekCardModel } from "./types";
import { getLogicalDay } from "./day";
import { computeTrackedMetrics } from "./union";
import { computeFocusRuns } from "./focus-run";
import { computeMix } from "./mix";
import { COPY } from "./copy";
import { DateTime } from "luxon";

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

  const sortedDays = Array.from(daySet).sort();
  const dateRange = sortedDays.length > 0
    ? `${sortedDays[0]} – ${sortedDays[sortedDays.length - 1]}`
    : "7-day period";

  // Build daily focus and sink hours for the observed days (§13)
  const dayBarsMap = new Map<string, { focusSeconds: number; sinkSeconds: number }>();
  for (const day of sortedDays) {
    dayBarsMap.set(day, { focusSeconds: 0, sinkSeconds: 0 });
  }

  for (const s of nonPrivate) {
    const day = getLogicalDay(s.started_at_ms, tz);
    if (!dayBarsMap.has(day)) {
      dayBarsMap.set(day, { focusSeconds: 0, sinkSeconds: 0 });
    }
    const dur = Math.max(0, (s.ended_at_ms - s.started_at_ms) / 1000);
    const entry = dayBarsMap.get(day)!;
    if (s.category === "work") {
      entry.focusSeconds += dur;
    } else if (s.category === "sink") {
      entry.sinkSeconds += dur;
    }
  }

  const dailyBars = Array.from(dayBarsMap.entries()).slice(-7).map(([day, val]) => {
    const dt = DateTime.fromISO(day, { zone: tz });
    const dayLabel = dt.isValid ? dt.toFormat("ccc") : day.slice(-5);
    return {
      dayLabel,
      focusHours: val.focusSeconds / 3600,
      sinkHours: val.sinkSeconds / 3600,
    };
  });

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
    dateRange,
    dailyBars,
  };
}

/**
 * Creates the week card model for display or PNG export.
 */
export function buildWeekCardModel(
  weekMetrics: WeekMetrics,
  deviceSelector: "phone this week" | "laptop this week" | "merged export",
  isPaid: boolean,
  dateRange?: string,
  dailyBars?: Array<{ dayLabel: string; focusHours: number; sinkHours: number }>
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
    dateRange: dateRange || weekMetrics.dateRange,
    dailyBars: dailyBars || weekMetrics.dailyBars,
  };
}
