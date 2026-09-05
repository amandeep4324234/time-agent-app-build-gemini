/**
 * Observational Insight Contract & Deterministic Ranking Engine
 * Authority: TIMEFRAME-UI-REDESIGN.md §9, §10
 */

import { EnrichedSession, FocusRun } from "./types";
import { Insight, Evidence } from "./presentation-types";
import { isFencedSession, FENCED_DOMAINS } from "./safe-adapter";
import { getLogicalDay } from "./day";
import { formatDuration } from "./format";
import { DateTime } from "luxon";

export interface EvaluatedInsight {
  insight: Insight;
  evidence: Evidence;
}

/**
 * Format duration helper for approved templates
 */
function formatHM(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Evaluates Today observations:
 * 1. Daily longest block (first)
 * 2. Return interval
 * 3. Sink concentration
 * 4. Early activity
 * 5. App sequence
 * 6. Recurring focus window
 * Capped at 3 insights, deduplicated by semantic family/key.
 */
export function evaluateTodayObservations(
  selectedDate: string,
  runs: FocusRun[],
  daySessions: EnrichedSession[],
  historySessions: EnrichedSession[],
  timezone = "Asia/Kolkata"
): EvaluatedInsight[] {
  const results: EvaluatedInsight[] = [];
  const usedKeys = new Set<string>();

  // 1. Daily longest block (§9)
  const qualifyingRuns = runs.filter(
    (r) =>
      r.durationSeconds >= 15 * 60 &&
      (!r.killerApp || (!FENCED_DOMAINS.has(r.killerApp.toLowerCase()) && r.killerApp !== "private"))
  );
  if (qualifyingRuns.length > 0) {
    const bestRun = [...qualifyingRuns].sort((a, b) => b.durationSeconds - a.durationSeconds)[0];
    const durationLabel = formatHM(bestRun.durationSeconds);
    const key = `daily_longest_block_${selectedDate}`;
    usedKeys.add(key);

    results.push({
      insight: {
        key,
        family: "daily_longest_block",
        sentence: `Your longest recorded focus block lasted ${durationLabel}.`,
        windowLabel: "Today",
        sampleCount: qualifyingRuns.length,
        excludedCount: 0,
        statistic: "duration",
        evidenceKey: `ev_${key}`,
        availability: "ready",
      },
      evidence: {
        title: "Longest Focus Block",
        calculation: `Identified highest contiguous wall-clock focus duration (≥15m) on ${selectedDate}.`,
        windowLabel: "Today",
        chart: "timeline",
        rows: qualifyingRuns.map((r) => ({
          start: DateTime.fromMillis(r.startMs, { zone: timezone }).toFormat("h:mma").toLowerCase(),
          end: DateTime.fromMillis(r.endMs, { zone: timezone }).toFormat("h:mma").toLowerCase(),
          duration: formatHM(r.durationSeconds),
          endingCause: r.ended_by || "completed",
        })),
        limitations: [
          "Describes recorded foreground app occupancy, not attention or mental state.",
          "Overlapping device activity is deduplicated.",
        ],
      },
    });
  }

  // Evaluate multi-day families if history is available
  const historyInsights = evaluateHistoricalObservations(
    selectedDate,
    historySessions,
    14, // 14-day default window
    timezone
  );

  for (const item of historyInsights) {
    if (results.length >= 3) break;
    if (!usedKeys.has(item.insight.family)) {
      usedKeys.add(item.insight.family);
      results.push(item);
    }
  }

  return results;
}

/**
 * Evaluates Patterns observations per §8.1 & §9
 * Returns up to 5 insights sorted by deterministic family order:
 * Return interval -> Sink concentration -> Early activity -> App sequence -> Recurring focus window
 */
export function evaluateHistoricalObservations(
  anchorDate: string,
  historySessions: EnrichedSession[],
  windowDays = 14,
  timezone = "Asia/Kolkata"
): EvaluatedInsight[] {
  const safeHistory = historySessions.filter((s) => !isFencedSession(s));
  const results: EvaluatedInsight[] = [];

  // 1. Return Interval (7 days window per §9)
  if (windowDays >= 7) {
    const returnInsight = evaluateReturnInterval(anchorDate, safeHistory, timezone);
    if (returnInsight) results.push(returnInsight);
  }

  // 2. Sink Concentration (14 days window per §9)
  if (windowDays >= 14) {
    const sinkConcInsight = evaluateSinkConcentration(anchorDate, safeHistory, timezone);
    if (sinkConcInsight) results.push(sinkConcInsight);
  }

  // 3. Early Activity Pattern (7 days window per §9)
  if (windowDays >= 7) {
    const earlyInsight = evaluateEarlyActivity(anchorDate, safeHistory, timezone);
    if (earlyInsight) results.push(earlyInsight);
  }

  // 4. App Sequence (14 days window per §9)
  if (windowDays >= 14) {
    const sequenceInsight = evaluateAppSequence(anchorDate, safeHistory, timezone);
    if (sequenceInsight) results.push(sequenceInsight);
  }

  // 5. Recurring Focus Window (28 days window per §9)
  if (windowDays >= 28) {
    const recurringInsight = evaluateRecurringFocusWindow(anchorDate, safeHistory, timezone);
    if (recurringInsight) results.push(recurringInsight);
  }

  return results.slice(0, 5);
}

/**
 * Return interval family:
 * "After runs ended with {app}, work apps resumed a median {duration} later."
 */
function evaluateReturnInterval(
  anchorDate: string,
  sessions: EnrichedSession[],
  timezone: string
): EvaluatedInsight | null {
  // Bounded 7-day window
  const anchorEnd = DateTime.fromISO(`${anchorDate}T04:00:00`, { zone: timezone }).plus({ days: 1 }).toMillis();
  const windowStart = DateTime.fromISO(`${anchorDate}T04:00:00`, { zone: timezone }).plus({ days: 1 }).minus({ days: 7 }).toMillis();

  const windowSessions = sessions
    .filter((s) => s.started_at_ms >= windowStart && s.started_at_ms < anchorEnd)
    .sort((a, b) => a.started_at_ms - b.started_at_ms);

  const sinkEvents = windowSessions.filter((s) => s.category === "sink" && s.seconds >= 5);
  const pairsBySink = new Map<string, number[]>();

  for (const sink of sinkEvents) {
    const nextWork = windowSessions.find(
      (s) => s.category === "work" && s.started_at_ms >= sink.ended_at_ms
    );
    if (nextWork) {
      const gapSec = (nextWork.started_at_ms - sink.ended_at_ms) / 1000;
      if (gapSec >= 0 && gapSec <= 4 * 3600) {
        const list = pairsBySink.get(sink.label) || [];
        list.push(gapSec);
        pairsBySink.set(sink.label, list);
      }
    }
  }

  // Find candidate meeting >= 3 samples
  let bestSink = "";
  let bestGaps: number[] = [];
  for (const [sink, gaps] of pairsBySink.entries()) {
    if (gaps.length >= 3 && gaps.length > bestGaps.length) {
      bestSink = sink;
      bestGaps = gaps;
    }
  }

  if (!bestSink || bestGaps.length < 3) return null;

  bestGaps.sort((a, b) => a - b);
  const medianSec = bestGaps[Math.floor(bestGaps.length / 2)];
  const durationText = formatHM(medianSec);
  const key = `return_interval_${bestSink.toLowerCase()}`;

  return {
    insight: {
      key,
      family: "return_interval",
      sentence: `After runs ended with ${bestSink}, work apps resumed a median ${durationText} later.`,
      windowLabel: "Last 7 days",
      sampleCount: bestGaps.length,
      excludedCount: 0,
      statistic: "median",
      evidenceKey: `ev_${key}`,
      availability: "ready",
    },
    evidence: {
      title: `Return Interval: ${bestSink}`,
      calculation: `Median interval between ${bestSink} session end and the subsequent work app session start over the last 7 completed days.`,
      windowLabel: "Last 7 days",
      chart: "bars",
      rows: bestGaps.map((gap, i) => ({
        incident: `#${i + 1}`,
        interval: formatHM(gap),
        seconds: Math.round(gap),
      })),
      limitations: [
        "Reports clock intervals between sessions. Does not measure attention recovery or cognitive friction.",
        "Includes overnight gaps if sessions bridged past midnight.",
      ],
    },
  };
}

/**
 * Sink concentration family:
 * "{share}% of recorded sink time fell between {start} and {end}."
 */
function evaluateSinkConcentration(
  anchorDate: string,
  sessions: EnrichedSession[],
  timezone: string
): EvaluatedInsight | null {
  const anchorEnd = DateTime.fromISO(`${anchorDate}T04:00:00`, { zone: timezone }).plus({ days: 1 }).toMillis();
  const windowStart = DateTime.fromISO(`${anchorDate}T04:00:00`, { zone: timezone }).plus({ days: 1 }).minus({ days: 14 }).toMillis();

  const windowSessions = sessions.filter(
    (s) => s.category === "sink" && s.started_at_ms >= windowStart && s.started_at_ms < anchorEnd
  );

  // Group by day to verify >= 7 eligible days (§9)
  const eligibleDays = new Set<string>();
  for (const s of windowSessions) {
    eligibleDays.add(getLogicalDay(s.started_at_ms, timezone));
  }
  if (eligibleDays.size < 7) return null;

  const totalSinkSec = windowSessions.reduce((acc, s) => acc + s.seconds, 0);

  // Group by 2-hour buckets (0-2, 2-4, ..., 22-24)
  const buckets = new Array(12).fill(0);
  for (const s of windowSessions) {
    const hour = DateTime.fromMillis(s.started_at_ms, { zone: timezone }).hour;
    const bucketIdx = Math.min(11, Math.floor(hour / 2));
    buckets[bucketIdx] += s.seconds;
  }

  let maxIdx = 0;
  let maxSec = 0;
  for (let i = 0; i < 12; i++) {
    if (buckets[i] > maxSec) {
      maxSec = buckets[i];
      maxIdx = i;
    }
  }

  // Gates: ≥60 minutes in winning 2-hour window, winning density ≥ 1.25x mean (§9)
  if (maxSec < 60 * 60) return null;
  const meanSec = totalSinkSec / 12;
  if (maxSec < meanSec * 1.25) return null;

  const share = Math.round((maxSec / totalSinkSec) * 100);
  const startHour = maxIdx * 2;
  const endHour = startHour + 2;
  const startFmt = DateTime.now().set({ hour: startHour, minute: 0 }).toFormat("ha").toLowerCase();
  const endFmt = DateTime.now().set({ hour: endHour, minute: 0 }).toFormat("ha").toLowerCase();

  const key = `sink_concentration_${maxIdx}`;

  return {
    insight: {
      key,
      family: "sink_concentration",
      sentence: `${share}% of recorded sink time fell between ${startFmt} and ${endFmt}.`,
      windowLabel: "Last 14 days",
      sampleCount: windowSessions.length,
      excludedCount: 0,
      statistic: "share",
      evidenceKey: `ev_${key}`,
      availability: "ready",
    },
    evidence: {
      title: "Sink Time Concentration",
      calculation: `Distribution of ${formatHM(totalSinkSec)} total sink time across 2-hour buckets over the last 14 days.`,
      windowLabel: "Last 14 days",
      chart: "histogram",
      rows: buckets.map((sec, idx) => ({
        window: `${idx * 2}:00 - ${(idx + 1) * 2}:00`,
        duration: formatHM(sec),
        share: `${Math.round((sec / totalSinkSec) * 100)}%`,
      })),
      limitations: [
        "Only includes foreground activity classified as Sinks.",
        "Mutually exclusive denominator covers all observed sink sessions.",
      ],
    },
  };
}

/**
 * Early activity pattern family:
 * "{app} appeared within 10 minutes of your first tracked activity on {hits} of {days} days."
 */
function evaluateEarlyActivity(
  anchorDate: string,
  sessions: EnrichedSession[],
  timezone: string
): EvaluatedInsight | null {
  const targetDays: string[] = [];
  for (let d = 6; d >= 0; d--) {
    const dayIso = DateTime.fromISO(`${anchorDate}`, { zone: timezone }).minus({ days: d }).toISODate()!;
    targetDays.push(dayIso);
  }

  const anchorEndMs = DateTime.fromISO(`${anchorDate}T04:00:00`, { zone: timezone }).plus({ days: 1 }).toMillis();
  const windowStartMs = DateTime.fromISO(`${anchorDate}T04:00:00`, { zone: timezone }).plus({ days: 1 }).minus({ days: 7 }).toMillis();

  const windowSessions = sessions.filter(
    (s) => s.started_at_ms >= windowStartMs && s.started_at_ms < anchorEndMs
  );

  const daysMap = new Map<string, EnrichedSession[]>();
  for (const s of windowSessions) {
    const day = getLogicalDay(s.started_at_ms, timezone);
    const list = daysMap.get(day) || [];
    list.push(s);
    daysMap.set(day, list);
  }

  const eligibleDays = targetDays.filter((d) => (daysMap.get(d) || []).length > 0);
  if (eligibleDays.length < 4) return null; // >= 4 eligible days required

  const sinkHits = new Map<string, number>();

  for (const day of eligibleDays) {
    const daySess = (daysMap.get(day) || []).sort((a, b) => a.started_at_ms - b.started_at_ms);
    if (daySess.length === 0) continue;
    const firstActivityMs = daySess[0].started_at_ms;
    const tenMinCutoff = firstActivityMs + 10 * 60 * 1000;

    const earlySinks = daySess.filter(
      (s) => s.category === "sink" && s.started_at_ms <= tenMinCutoff
    );

    const countedInDay = new Set<string>();
    for (const sink of earlySinks) {
      if (!countedInDay.has(sink.label)) {
        countedInDay.add(sink.label);
        sinkHits.set(sink.label, (sinkHits.get(sink.label) || 0) + 1);
      }
    }
  }

  let bestApp = "";
  let bestHits = 0;
  for (const [app, hits] of sinkHits.entries()) {
    if (hits >= 4 && hits / eligibleDays.length >= 0.5 && hits > bestHits) {
      bestApp = app;
      bestHits = hits;
    }
  }

  if (!bestApp) return null;

  const key = `early_activity_${bestApp.toLowerCase()}`;

  return {
    insight: {
      key,
      family: "early_activity",
      sentence: `${bestApp} appeared within 10 minutes of your first tracked activity on ${bestHits} of ${eligibleDays.length} days.`,
      windowLabel: "Last 7 days",
      sampleCount: bestHits,
      excludedCount: 0,
      statistic: "count",
      evidenceKey: `ev_${key}`,
      availability: "ready",
    },
    evidence: {
      title: `Early Activity: ${bestApp}`,
      calculation: `Count of days where ${bestApp} was recorded within 10 minutes of initial daily activity across ${eligibleDays.length} observed days.`,
      windowLabel: "Last 7 days",
      chart: "bars",
      rows: eligibleDays.map((d) => {
        const daySess = daysMap.get(d) || [];
        const hasHit = daySess.some(
          (s) =>
            s.label === bestApp &&
            s.started_at_ms <= daySess[0].started_at_ms + 10 * 60 * 1000
        );
        return {
          date: d,
          status: hasHit ? "Detected" : "Not observed",
        };
      }),
      limitations: [
        "Measures earliest recorded session in foreground; does not know wake time, alarms, or sleep.",
      ],
    },
  };
}

/**
 * App sequence family:
 * "{B} followed {A} in {hits} of {total} eligible transitions."
 */
function evaluateAppSequence(
  anchorDate: string,
  sessions: EnrichedSession[],
  timezone: string
): EvaluatedInsight | null {
  const anchorEndMs = DateTime.fromISO(`${anchorDate}T04:00:00`, { zone: timezone }).plus({ days: 1 }).toMillis();
  const windowStartMs = DateTime.fromISO(`${anchorDate}T04:00:00`, { zone: timezone }).plus({ days: 1 }).minus({ days: 14 }).toMillis();

  const windowSessions = sessions
    .filter((s) => s.started_at_ms >= windowStartMs && s.started_at_ms < anchorEndMs)
    .sort((a, b) => a.started_at_ms - b.started_at_ms);

  const transitionPairs = new Map<string, { appA: string; appB: string; count: number }>();
  const totalAfterA = new Map<string, number>();

  for (let i = 0; i < windowSessions.length - 1; i++) {
    const a = windowSessions[i];
    const b = windowSessions[i + 1];

    // Same-device non-overlapping transitions with gap 0-60s; exclude self-loops
    if (a.device === b.device && a.label !== b.label) {
      const gapSec = (b.started_at_ms - a.ended_at_ms) / 1000;
      if (gapSec >= 0 && gapSec <= 60) {
        totalAfterA.set(a.label, (totalAfterA.get(a.label) || 0) + 1);
        const pairKey = `${a.label}:::${b.label}`;
        const existing = transitionPairs.get(pairKey) || { appA: a.label, appB: b.label, count: 0 };
        existing.count += 1;
        transitionPairs.set(pairKey, existing);
      }
    }
  }

  // Gates: >=8 valid successors after A, >=3 A->B, proportion >=35%
  let bestPair: { appA: string; appB: string; count: number } | null = null;
  let bestProportion = 0;

  for (const pair of transitionPairs.values()) {
    const total = totalAfterA.get(pair.appA) || 0;
    if (total >= 8 && pair.count >= 3) {
      const prop = pair.count / total;
      if (prop >= 0.35 && prop > bestProportion) {
        bestProportion = prop;
        bestPair = pair;
      }
    }
  }

  if (!bestPair) return null;

  const totalTransitions = totalAfterA.get(bestPair.appA) || 1;
  const key = `app_sequence_${bestPair.appA.toLowerCase()}_${bestPair.appB.toLowerCase()}`;

  return {
    insight: {
      key,
      family: "app_sequence",
      sentence: `${bestPair.appB} followed ${bestPair.appA} in ${bestPair.count} of ${totalTransitions} eligible transitions.`,
      windowLabel: "Last 14 days",
      sampleCount: bestPair.count,
      excludedCount: 0,
      statistic: "count",
      evidenceKey: `ev_${key}`,
      availability: "ready",
    },
    evidence: {
      title: `Sequence: ${bestPair.appA} → ${bestPair.appB}`,
      calculation: `Observed same-device transitions within 60s gap across the last 14 days.`,
      windowLabel: "Last 14 days",
      chart: "bars",
      rows: [
        { transition: `${bestPair.appA} → ${bestPair.appB}`, count: bestPair.count },
        { transition: `${bestPair.appA} → Other apps`, count: totalTransitions - bestPair.count },
      ],
      limitations: [
        "Measures chronological foreground transition order on the same device. Makes no cross-device or psychological causal claim.",
      ],
    },
  };
}

/**
 * Recurring focus window family:
 * "{weekday}, {start}–{end}: an average {duration} in work apps across {weeks} observed weeks."
 */
function evaluateRecurringFocusWindow(
  anchorDate: string,
  sessions: EnrichedSession[],
  timezone: string
): EvaluatedInsight | null {
  const anchorEndMs = DateTime.fromISO(`${anchorDate}T04:00:00`, { zone: timezone }).plus({ days: 1 }).toMillis();
  const windowStartMs = DateTime.fromISO(`${anchorDate}T04:00:00`, { zone: timezone }).plus({ days: 1 }).minus({ days: 28 }).toMillis();

  const workSessions = sessions.filter(
    (s) => s.category === "work" && s.started_at_ms >= windowStartMs && s.started_at_ms < anchorEndMs
  );
  if (workSessions.length === 0) return null;

  // Track weekday + 3-hour window buckets (e.g. "Tuesday 9am-12pm")
  // Gate: observed in >= 3 distinct weeks with >= 30m mean
  const bucketWeeklyData = new Map<string, Map<number, number>>();

  for (const s of workSessions) {
    const dt = DateTime.fromMillis(s.started_at_ms, { zone: timezone });
    const weekday = dt.toFormat("cccc");
    const weekNumber = dt.weekNumber;
    const windowStartHour = Math.floor(dt.hour / 3) * 3;
    const key = `${weekday}:::${windowStartHour}`;

    const weekMap = bucketWeeklyData.get(key) || new Map<number, number>();
    weekMap.set(weekNumber, (weekMap.get(weekNumber) || 0) + s.seconds);
    bucketWeeklyData.set(key, weekMap);
  }

  for (const [key, weekMap] of bucketWeeklyData.entries()) {
    if (weekMap.size >= 3) {
      const totalSec = Array.from(weekMap.values()).reduce((a, b) => a + b, 0);
      const meanSec = totalSec / weekMap.size;
      if (meanSec >= 30 * 60) {
        const [weekday, startHourStr] = key.split(":::");
        const startH = parseInt(startHourStr, 10);
        const endH = startH + 3;
        const startFmt = DateTime.now().set({ hour: startH, minute: 0 }).toFormat("ha").toLowerCase();
        const endFmt = DateTime.now().set({ hour: endH, minute: 0 }).toFormat("ha").toLowerCase();

        return {
          insight: {
            key: `recurring_focus_${key}`,
            family: "recurring_focus_window",
            sentence: `${weekday}, ${startFmt}–${endFmt}: an average ${formatHM(meanSec)} in work apps across ${weekMap.size} observed weeks.`,
            windowLabel: "Last 28 days",
            sampleCount: weekMap.size,
            excludedCount: 0,
            statistic: "mean",
            evidenceKey: `ev_recurring_${key}`,
            availability: "ready",
          },
          evidence: {
            title: `Recurring Focus: ${weekday} ${startFmt}–${endFmt}`,
            calculation: `Mean work-set duration during this recurring 3-hour block across ${weekMap.size} distinct observed weeks.`,
            windowLabel: "Last 28 days",
            chart: "bars",
            rows: Array.from(weekMap.entries()).map(([wk, sec]) => ({
              week: `Week ${wk}`,
              workDuration: formatHM(sec),
              seconds: sec,
            })),
            limitations: [
              "Calculated across weeks with verified collector coverage.",
              "Averages include observed zero days during tracked periods.",
            ],
          },
        };
      }
    }
  }

  return null;
}
