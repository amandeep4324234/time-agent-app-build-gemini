/**
 * Aligned Comparison Engine
 * Authority: TIMEFRAME-UI-REDESIGN.md §8.2
 * 
 * Rules:
 * - Compares completed periods without overlapping pixels (no translucent ghost overlay).
 * - Focus, Sink, Deep blocks with signed absolute differences and secondary percent deltas.
 * - "What changed" capped at 3 entries, requires >= 30m absolute delta and >= 4 eligible days.
 */

import { EnrichedSession } from "./types";
import { isFencedSession } from "./safe-adapter";
import { getLogicalDay } from "./day";
import { computeTrackedMetrics } from "./union";
import { computeFocusRuns } from "./focus-run";
import { formatDuration } from "./format";
import { DateTime } from "luxon";

export interface PeriodMetrics {
  label: string;
  startDate: string;
  endDate: string;
  eligibleDaysCount: number;
  focusSeconds: number;
  sinkSeconds: number;
  deepBlocksCount: number;
  focusAvgDailySeconds: number;
  sinkAvgDailySeconds: number;
  appSeconds: Map<string, number>;
  dailyFocusSeconds: Array<{ date: string; seconds: number; dayLabel: string }>;
}

export interface MetricDelta {
  currentValue: number;
  refValue: number | null;
  currentFormatted: string;
  refFormatted: string;
  deltaSeconds: number;
  signedDeltaFormatted: string;
  percentChange: number | null;
  isAverage: boolean;
}

export interface WhatChangedItem {
  app: string;
  deltaSeconds: number;
  signedFormatted: string;
  currentFormatted: string;
  refFormatted: string;
}

export interface ComparisonResult {
  mode: "week" | "day";
  current: PeriodMetrics;
  reference: PeriodMetrics;
  metrics: {
    focus: MetricDelta;
    sink: MetricDelta;
    deepBlocks: {
      current: number;
      reference: number;
      delta: number;
    };
  };
  whatChanged: WhatChangedItem[];
  isWhatChangedSuppressed: boolean;
  suppressionReason?: string;
}

/**
 * Computes metrics for a range of dates.
 */
function computePeriod(
  dates: string[],
  sessions: EnrichedSession[],
  timezone: string
): PeriodMetrics {
  const safeSessions = sessions.filter((s) => !isFencedSession(s));

  const daysWithData = new Set<string>();
  const dailyFocusMap = new Map<string, number>();
  const appMap = new Map<string, number>();

  let totalWorkSec = 0;
  let totalSinkSec = 0;
  let deepBlocksCount = 0;

  for (const d of dates) {
    const daySessions = safeSessions.filter(
      (s) => getLogicalDay(s.started_at_ms, timezone) === d
    );
    if (daySessions.length > 0) {
      daysWithData.add(d);
    }

    const dayWork = daySessions.filter((s) => s.category === "work");
    const dayWorkSec = Math.round(computeTrackedMetrics(dayWork).unionSeconds);
    dailyFocusMap.set(d, dayWorkSec);
    totalWorkSec += dayWorkSec;

    const daySink = daySessions.filter((s) => s.category === "sink");
    const daySinkSec = Math.round(computeTrackedMetrics(daySink).unionSeconds);
    totalSinkSec += daySinkSec;

    const { deepBlocksCount: dayDeepBlocks } = computeFocusRuns(daySessions);
    deepBlocksCount += dayDeepBlocks;

    for (const s of daySessions) {
      appMap.set(s.label, (appMap.get(s.label) || 0) + s.seconds);
    }
  }

  const eligibleDaysCount = Math.max(1, daysWithData.size);
  const focusAvgDailySeconds = Math.round(totalWorkSec / eligibleDaysCount);
  const sinkAvgDailySeconds = Math.round(totalSinkSec / eligibleDaysCount);

  const dailyFocusSeconds = dates.map((d) => {
    const dt = DateTime.fromISO(d);
    return {
      date: d,
      seconds: dailyFocusMap.get(d) || 0,
      dayLabel: dt.toFormat("ccc"),
    };
  });

  return {
    label: `${dates[0]} to ${dates[dates.length - 1]}`,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    eligibleDaysCount: daysWithData.size,
    focusSeconds: totalWorkSec,
    sinkSeconds: totalSinkSec,
    deepBlocksCount,
    focusAvgDailySeconds,
    sinkAvgDailySeconds,
    appSeconds: appMap,
    dailyFocusSeconds,
  };
}

/**
 * Format signed difference: "+1h 15m" or "-45m"
 */
function formatSignedDelta(deltaSeconds: number): string {
  if (deltaSeconds === 0) return "0m";
  const sign = deltaSeconds > 0 ? "+" : "-";
  const abs = Math.abs(deltaSeconds);
  return `${sign}${formatDuration(abs)}`;
}

/**
 * Run full comparison between two completed periods or dates (§8.2).
 */
export function comparePeriods(
  currentDates: string[],
  referenceDates: string[],
  sessions: EnrichedSession[],
  timezone = "Asia/Kolkata"
): ComparisonResult {
  const isSingleDay = currentDates.length === 1 && referenceDates.length === 1;
  const current = computePeriod(currentDates, sessions, timezone);
  const reference = computePeriod(referenceDates, sessions, timezone);

  // If eligible days differ in week mode, compare per-eligible-day averages (§8.2)
  const useAverages = !isSingleDay && current.eligibleDaysCount !== reference.eligibleDaysCount;

  const currentFocusVal = useAverages ? current.focusAvgDailySeconds : current.focusSeconds;
  const refFocusVal = useAverages ? reference.focusAvgDailySeconds : reference.focusSeconds;
  const focusDelta = currentFocusVal - refFocusVal;

  const currentSinkVal = useAverages ? current.sinkAvgDailySeconds : current.sinkSeconds;
  const refSinkVal = useAverages ? reference.sinkAvgDailySeconds : reference.sinkSeconds;
  const sinkDelta = currentSinkVal - refSinkVal;

  // Percent change: omitted when reference is 0
  const focusPctChange = refFocusVal > 0 ? Math.round((focusDelta / refFocusVal) * 100) : null;
  const sinkPctChange = refSinkVal > 0 ? Math.round((sinkDelta / refSinkVal) * 100) : null;

  // "What changed" list (§8.2)
  // Suppress if either week has fewer than 4 eligible days
  const hasAdequateCoverage = isSingleDay || (current.eligibleDaysCount >= 4 && reference.eligibleDaysCount >= 4);

  const changes: WhatChangedItem[] = [];
  if (hasAdequateCoverage) {
    const allApps = new Set([...current.appSeconds.keys(), ...reference.appSeconds.keys()]);
    for (const app of allApps) {
      const cSec = current.appSeconds.get(app) || 0;
      const rSec = reference.appSeconds.get(app) || 0;
      const delta = cSec - rSec;

      // Minimum 30 minutes absolute delta (§8.2)
      if (Math.abs(delta) >= 30 * 60) {
        changes.push({
          app,
          deltaSeconds: delta,
          signedFormatted: formatSignedDelta(delta),
          currentFormatted: formatDuration(cSec),
          refFormatted: formatDuration(rSec),
        });
      }
    }

    // Deterministic sort: absolute delta descending, then alphabetical
    changes.sort((a, b) => {
      const diffA = Math.abs(a.deltaSeconds);
      const diffB = Math.abs(b.deltaSeconds);
      if (diffB !== diffA) return diffB - diffA;
      return a.app.localeCompare(b.app);
    });
  }

  const isWhatChangedSuppressed = !hasAdequateCoverage || changes.length === 0;
  const suppressionReason = !hasAdequateCoverage
    ? "Fewer than 4 eligible days with data in comparison period."
    : changes.length === 0
    ? "No apps had a change greater than 30 minutes between periods."
    : undefined;

  return {
    mode: isSingleDay ? "day" : "week",
    current,
    reference,
    metrics: {
      focus: {
        currentValue: currentFocusVal,
        refValue: refFocusVal,
        currentFormatted: formatDuration(currentFocusVal),
        refFormatted: refFocusVal > 0 ? formatDuration(refFocusVal) : "Previously 0m",
        deltaSeconds: focusDelta,
        signedDeltaFormatted: formatSignedDelta(focusDelta),
        percentChange: focusPctChange,
        isAverage: useAverages,
      },
      sink: {
        currentValue: currentSinkVal,
        refValue: refSinkVal,
        currentFormatted: formatDuration(currentSinkVal),
        refFormatted: refSinkVal > 0 ? formatDuration(refSinkVal) : "Previously 0m",
        deltaSeconds: sinkDelta,
        signedDeltaFormatted: formatSignedDelta(sinkDelta),
        percentChange: sinkPctChange,
        isAverage: useAverages,
      },
      deepBlocks: {
        current: current.deepBlocksCount,
        reference: reference.deepBlocksCount,
        delta: current.deepBlocksCount - reference.deepBlocksCount,
      },
    },
    whatChanged: changes.slice(0, 3), // Capped at 3 entries
    isWhatChangedSuppressed,
    suppressionReason,
  };
}
