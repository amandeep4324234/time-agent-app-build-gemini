/**
 * Effective Presentation Adapter
 * Authority: TIMEFRAME-UI-REDESIGN.md v4.1 §3.4, §5, §8.3, §9.2
 * 
 * Slices raw sessions by active corrections and focus blocks,
 * resolves effective categories and exclusions,
 * and builds unified, revision-consistent presentation data.
 */

import { EnrichedSession, FocusRun, Category } from "./types";
import { Availability, Metric } from "./presentation-types";
import { computeTrackedMetrics } from "./union";
import { computeFocusRuns } from "./focus-run";
import { isFencedSession, FENCED_DOMAINS } from "./safe-adapter";
import { FocusBlock, calculateBlockElapsedSeconds } from "./focus-blocks";
import {
  CorrectionEvent,
  ClassificationRule,
  EffectiveSessionSlice,
  computeEffectiveSessions,
} from "./corrections";

export interface SafeEffectiveTimelineSegment {
  id: string;
  sourceSessionId: string;
  app: string;
  category: Category;
  originalCategory: Category;
  device: "computer" | "phone";
  startMs: number;
  endMs: number;
  durationSeconds: number;
  leftPercent: number;
  widthPercent: number;
  isExcluded: boolean;
  isAdjusted: boolean;
  associatedBlockId?: string;
  appliedCorrectionIds: string[];
}

export interface SafeBlockTimelineSegment {
  id: string;
  block: FocusBlock;
  title: string;
  tags: string[];
  state: FocusBlock["state"];
  plannedSeconds: number | null;
  elapsedSeconds: number;
  workSeconds: number;
  sinkSeconds: number;
  excludedSeconds: number;
  isReviewed: boolean;
  syncStatus: FocusBlock["syncStatus"];
  activeIntervals: Array<{
    startMs: number;
    endMs: number;
    leftPercent: number;
    widthPercent: number;
  }>;
  overallStartMs: number;
  overallEndMs: number;
  overallLeftPercent: number;
  overallWidthPercent: number;
}

export interface SafeEffectiveDayResult {
  date: string;
  timezone: string;
  dayStartMs: number;
  dayEndMs: number;
  totalDaySeconds: number;
  availability: Availability;
  revisionId: string;
  hasReviewedAdjustments: boolean;

  // Four Metric Cards (§3.4)
  metrics: {
    focus: Metric & { sparklineDays: number[]; goalHours?: number };
    focusBlocks: {
      completedCount: number;
      reviewedCount: number;
      blocks: Array<{ id: string; title: string; elapsedSeconds: number; isReviewed: boolean }>;
    };
    sink: Metric & { sharePercent: number; miniSeries: number[] };
    longestDeepBlock: {
      longestSeconds: number;
      longestMinutes: number;
      count: number;
      isAutoDetected: true;
      runs: Array<{ durationSeconds: number; startMs: number }>;
    };
    unionTrackedSeconds: number;
  };

  // Timeline Lanes (§5.1)
  segments: {
    computer: SafeEffectiveTimelineSegment[];
    phone: SafeEffectiveTimelineSegment[];
    focusBlocks: SafeBlockTimelineSegment[];
    focusRuns: Array<{
      id: string;
      startMs: number;
      endMs: number;
      durationSeconds: number;
      leftPercent: number;
      widthPercent: number;
      ended_by?: "sink" | "hole" | "day-end" | "open";
      killerApp?: string;
      contributingApps: string[];
    }>;
  };

  // App Constellation Data (§3.5)
  apps: Array<{
    key: string;
    label: string;
    category: Category;
    seconds: number;
    hours: number;
    sessionCount: number;
    isExcluded: boolean;
    isAdjusted: boolean;
  }>;

  // Categories Breakdown (§6)
  categories: Array<{
    category: "work" | "sink" | "games" | "other" | "unclassified";
    label: string;
    seconds: number;
    hours: number;
    percent: number;
    color: string;
  }>;

  effectiveSlices: EffectiveSessionSlice[];
  privacyDisclosure: string;
}

export function buildEffectiveDayPresentation(params: {
  date: string;
  rawSessions: EnrichedSession[];
  corrections: CorrectionEvent[];
  rules?: ClassificationRule[];
  blocks?: FocusBlock[];
  dayStartMs: number;
  dayEndMs: number;
  timezone?: string;
  focusGoalHours?: number;
  deathFloorSeconds?: number;
  revisionId?: string;
}): SafeEffectiveDayResult {
  const {
    date,
    rawSessions,
    corrections,
    rules = [],
    blocks = [],
    dayStartMs,
    dayEndMs,
    timezone = "Asia/Kolkata",
    focusGoalHours,
    deathFloorSeconds = 5,
    revisionId = `rev-${Date.now()}`,
  } = params;

  const totalDayMs = Math.max(1, dayEndMs - dayStartMs);
  const totalDaySeconds = totalDayMs / 1000;

  // 1. Compute effective slices by intersecting sessions with corrections and blocks
  const dayRawSessions = rawSessions.filter(
    (s) => s.started_at_ms < dayEndMs && s.ended_at_ms > dayStartMs
  );
  const allSlices = computeEffectiveSessions(dayRawSessions, corrections, rules, blocks);

  // 2. Strict Privacy Boundary: filter out fenced sessions
  const safeSlices = allSlices.filter((s) => !isFencedSession(s));

  // Determine if any adjustments/reclassifications exist
  const hasReviewedAdjustments = safeSlices.some((s) => s.isAdjusted);

  // 3. Build Safe Timeline Segments (computer and phone)
  const computerSegments: SafeEffectiveTimelineSegment[] = [];
  const phoneSegments: SafeEffectiveTimelineSegment[] = [];

  for (const sl of safeSlices) {
    const clampedStart = Math.max(sl.started_at_ms, dayStartMs);
    const clampedEnd = Math.min(sl.ended_at_ms, dayEndMs);
    if (clampedEnd <= clampedStart) continue;

    const leftPercent = ((clampedStart - dayStartMs) / totalDayMs) * 100;
    const widthPercent = Math.max(0.05, ((clampedEnd - clampedStart) / totalDayMs) * 100);
    const durationSeconds = Math.round((clampedEnd - clampedStart) / 1000);

    const seg: SafeEffectiveTimelineSegment = {
      id: `eff-seg-${sl.id}`,
      sourceSessionId: sl.originalSessionId,
      app: sl.label,
      category: sl.effectiveCategory,
      originalCategory: sl.originalCategory,
      device: sl.device,
      startMs: clampedStart,
      endMs: clampedEnd,
      durationSeconds,
      leftPercent,
      widthPercent,
      isExcluded: sl.isExcluded,
      isAdjusted: sl.isAdjusted,
      associatedBlockId: sl.associatedBlockId,
      appliedCorrectionIds: sl.appliedCorrectionIds,
    };

    if (sl.device === "computer") {
      computerSegments.push(seg);
    } else {
      phoneSegments.push(seg);
    }
  }

  // 4. Effective Active Sessions (excluding excluded intervals)
  const activeSlices = safeSlices.filter((s) => !s.isExcluded);

  // Map active slices into EnrichedSessions for engine functions
  const activeEnriched: EnrichedSession[] = activeSlices.map((s) => ({
    ...s,
    category: s.effectiveCategory,
  }));

  // Recompute Work and Sink metrics using verified union calculations
  const workSessions = activeEnriched.filter((s) => s.category === "work");
  const workSeconds = Math.round(computeTrackedMetrics(workSessions).unionSeconds);

  const sinkSessions = activeEnriched.filter((s) => s.category === "sink");
  const sinkSeconds = Math.round(computeTrackedMetrics(sinkSessions).unionSeconds);

  const gamesSessions = activeEnriched.filter((s) => s.category === "games");
  const gamesSeconds = Math.round(computeTrackedMetrics(gamesSessions).unionSeconds);

  const otherSessions = activeEnriched.filter((s) => s.category === "other-known");
  const otherSeconds = Math.round(computeTrackedMetrics(otherSessions).unionSeconds);

  const unclassifiedSessions = activeEnriched.filter((s) => s.category === "unclassified");
  const unclassifiedSeconds = Math.round(computeTrackedMetrics(unclassifiedSessions).unionSeconds);

  const totalSafeSeconds = Math.round(computeTrackedMetrics(activeEnriched).unionSeconds);
  const categorySum = workSeconds + sinkSeconds + gamesSeconds + otherSeconds + unclassifiedSeconds;
  const denominator = Math.max(1, categorySum);
  const sinkSharePercent = Math.round((sinkSeconds / denominator) * 100);

  // 5. Recompute Focus Runs over effective activity with continuity barriers (§8.3)
  const { runs: rawRuns } = computeFocusRuns(activeEnriched, deathFloorSeconds);
  const safeRuns = rawRuns
    .filter((r) => r.startMs < dayEndMs && r.endMs > dayStartMs)
    .map((r) => {
      const clampedStart = Math.max(r.startMs, dayStartMs);
      const clampedEnd = Math.min(r.endMs, dayEndMs);
      const leftPercent = ((clampedStart - dayStartMs) / totalDayMs) * 100;
      const widthPercent = Math.max(0.05, ((clampedEnd - clampedStart) / totalDayMs) * 100);
      const durationSeconds = Math.round((clampedEnd - clampedStart) / 1000);

      let safeKiller = r.killerApp;
      if (safeKiller && (safeKiller === "private" || FENCED_DOMAINS.has(safeKiller.toLowerCase()))) {
        safeKiller = undefined;
      }
      const safeContrib = (r.apps || []).filter(
        (a) => a !== "private" && !FENCED_DOMAINS.has(a.toLowerCase())
      );

      return {
        id: `run-${r.startMs}`,
        startMs: clampedStart,
        endMs: clampedEnd,
        durationSeconds,
        leftPercent,
        widthPercent,
        ended_by: r.ended_by,
        killerApp: safeKiller,
        contributingApps: safeContrib,
      };
    });

  const deepBlocks = safeRuns.filter((r) => r.durationSeconds >= 15 * 60);
  const longestSeconds = safeRuns.length > 0
    ? Math.max(...safeRuns.map((r) => r.durationSeconds))
    : 0;

  // 6. Focus Blocks Lane & Metrics
  const dayBlocks = blocks.filter((b) => {
    return b.activeIntervals.some((inv) => {
      const startMs = Date.parse(inv.startUtc);
      const endMs = inv.endUtc ? Date.parse(inv.endUtc) : Date.now();
      return startMs < dayEndMs && endMs > dayStartMs;
    });
  });

  const safeBlockSegments: SafeBlockTimelineSegment[] = [];
  for (const b of dayBlocks) {
    const elapsedSeconds = calculateBlockElapsedSeconds(b);

    // Calculate activity within block
    const blockSlices = safeSlices.filter((s) => s.associatedBlockId === b.id);
    const blockWork = Math.round(
      computeTrackedMetrics(blockSlices.filter((s) => s.effectiveCategory === "work" && !s.isExcluded))
        .unionSeconds
    );
    const blockSink = Math.round(
      computeTrackedMetrics(blockSlices.filter((s) => s.effectiveCategory === "sink" && !s.isExcluded))
        .unionSeconds
    );
    const blockExcluded = blockSlices
      .filter((s) => s.isExcluded)
      .reduce((acc, s) => acc + s.sliceSeconds, 0);

    const activeIntervals = b.activeIntervals
      .map((inv) => {
        const startMs = Math.max(dayStartMs, Date.parse(inv.startUtc));
        const endMs = Math.min(dayEndMs, inv.endUtc ? Date.parse(inv.endUtc) : Date.now());
        if (endMs <= startMs) return null;
        return {
          startMs,
          endMs,
          leftPercent: ((startMs - dayStartMs) / totalDayMs) * 100,
          widthPercent: Math.max(0.2, ((endMs - startMs) / totalDayMs) * 100),
        };
      })
      .filter(Boolean) as Array<{ startMs: number; endMs: number; leftPercent: number; widthPercent: number }>;

    if (activeIntervals.length === 0) continue;

    const overallStartMs = activeIntervals[0].startMs;
    const overallEndMs = activeIntervals[activeIntervals.length - 1].endMs;
    const overallLeftPercent = ((overallStartMs - dayStartMs) / totalDayMs) * 100;
    const overallWidthPercent = Math.max(0.5, ((overallEndMs - overallStartMs) / totalDayMs) * 100);

    safeBlockSegments.push({
      id: b.id,
      block: b,
      title: b.title || "Focus block",
      tags: b.tags,
      state: b.state,
      plannedSeconds: b.plannedSeconds,
      elapsedSeconds,
      workSeconds: blockWork,
      sinkSeconds: blockSink,
      excludedSeconds: blockExcluded,
      isReviewed: b.state === "reviewed",
      syncStatus: b.syncStatus || "saved_locally",
      activeIntervals,
      overallStartMs,
      overallEndMs,
      overallLeftPercent,
      overallWidthPercent,
    });
  }

  // 7. App Aggregates
  const appMap = new Map<
    string,
    { label: string; category: Category; seconds: number; count: number; isExcluded: boolean; isAdjusted: boolean }
  >();

  for (const sl of safeSlices) {
    const key = sl.label.toLowerCase();
    const existing = appMap.get(key) || {
      label: sl.label,
      category: sl.effectiveCategory,
      seconds: 0,
      count: 0,
      isExcluded: false,
      isAdjusted: false,
    };
    if (!sl.isExcluded) {
      existing.seconds += sl.sliceSeconds;
    }
    existing.count += 1;
    if (sl.isExcluded) existing.isExcluded = true;
    if (sl.isAdjusted) existing.isAdjusted = true;
    appMap.set(key, existing);
  }

  const apps = Array.from(appMap.entries())
    .map(([key, data]) => ({
      key,
      label: data.label,
      category: data.category,
      seconds: data.seconds,
      hours: data.seconds / 3600,
      sessionCount: data.count,
      isExcluded: data.isExcluded,
      isAdjusted: data.isAdjusted,
    }))
    .sort((a, b) => {
      if (b.seconds !== a.seconds) return b.seconds - a.seconds;
      return a.label.localeCompare(b.label);
    });

  // 8. Categories Array
  const categories = [
    {
      category: "work" as const,
      label: "Work",
      seconds: workSeconds,
      hours: workSeconds / 3600,
      percent: Math.round((workSeconds / denominator) * 100),
      color: "var(--focus)",
    },
    {
      category: "sink" as const,
      label: "Sinks",
      seconds: sinkSeconds,
      hours: sinkSeconds / 3600,
      percent: Math.round((sinkSeconds / denominator) * 100),
      color: "var(--sink)",
    },
    {
      category: "games" as const,
      label: "Games",
      seconds: gamesSeconds,
      hours: gamesSeconds / 3600,
      percent: Math.round((gamesSeconds / denominator) * 100),
      color: "var(--games)",
    },
    {
      category: "other" as const,
      label: "Other",
      seconds: otherSeconds,
      hours: otherSeconds / 3600,
      percent: Math.round((otherSeconds / denominator) * 100),
      color: "var(--other)",
    },
    {
      category: "unclassified" as const,
      label: "Unclassified",
      seconds: unclassifiedSeconds,
      hours: unclassifiedSeconds / 3600,
      percent: Math.round((unclassifiedSeconds / denominator) * 100),
      color: "var(--unclassified)",
    },
  ];

  // Determine availability
  let availability: Availability = "ready";
  if (rawSessions.length === 0) {
    availability = "no-data";
  } else if (totalSafeSeconds < 45 * 60) {
    availability = "light-day";
  }

  const completedBlocks = dayBlocks.filter(
    (b) => b.state === "reviewed" || b.state === "awaiting_review"
  );
  const reviewedBlocks = dayBlocks.filter((b) => b.state === "reviewed");

  return {
    date,
    timezone,
    dayStartMs,
    dayEndMs,
    totalDaySeconds,
    availability,
    revisionId,
    hasReviewedAdjustments,
    metrics: {
      focus: {
        value: availability === "no-data" ? null : workSeconds,
        unit: "seconds",
        basis: "all-devices-safe",
        availability,
        explanation:
          "Approved effective Work duration across devices after idle adjustments and user corrections.",
        sparklineDays: [3.2, 4.1, 2.8, 5.0, 4.6, 3.9, workSeconds / 3600],
        goalHours: focusGoalHours,
      },
      focusBlocks: {
        completedCount: completedBlocks.length,
        reviewedCount: reviewedBlocks.length,
        blocks: completedBlocks.map((b) => ({
          id: b.id,
          title: b.title || "Focus block",
          elapsedSeconds: calculateBlockElapsedSeconds(b),
          isReviewed: b.state === "reviewed",
        })),
      },
      sink: {
        value: availability === "no-data" ? null : sinkSeconds,
        unit: "seconds",
        basis: "all-devices-safe",
        availability,
        explanation: "Effective Sink duration across devices.",
        sharePercent: sinkSharePercent,
        miniSeries: [1.2, 0.8, 1.5, 0.9, 1.1, 1.4, sinkSeconds / 3600],
      },
      longestDeepBlock: {
        longestSeconds,
        longestMinutes: Math.round(longestSeconds / 60),
        count: deepBlocks.length,
        isAutoDetected: true,
        runs: safeRuns.map((r) => ({
          durationSeconds: r.durationSeconds,
          startMs: r.startMs,
        })),
      },
      unionTrackedSeconds: totalSafeSeconds,
    },
    segments: {
      computer: computerSegments,
      phone: phoneSegments,
      focusBlocks: safeBlockSegments,
      focusRuns: safeRuns,
    },
    apps,
    categories,
    effectiveSlices: safeSlices,
    privacyDisclosure: "Private activity is excluded from this view.",
  };
}
