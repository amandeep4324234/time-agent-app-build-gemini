/**
 * App Lens & Constellation Engine
 * Authority: TIMEFRAME-UI-REDESIGN.md v4.1 §3.5, §3.6 · update.md §1.1, §3.3, §6.2, §6.3, §7
 * 
 * Friendly name resolution, local icons, exact empirical duration distributions,
 * threshold exploration, and clear distinction between visits and recorded segments.
 */

import { EnrichedSession, Category } from "./types";
import { formatDurationSeconds } from "./format";
import {
  EffectiveSessionSlice,
  computeUnwantedUnionSeconds,
  computeAppraisalSummary,
  AppraisalSummary,
} from "./corrections";
import { FocusBlock } from "./focus-blocks";
import {
  calculateMedianSeconds,
  calculateNearestRankPercentile,
  computeHistogramBins,
  computeThresholdPartition,
  HistogramBinsResult,
  ThresholdPartitionResult,
  measureUnionSeconds,
} from "./stat-utils";

// Conservative explicit mapping for friendly display labels (§3.5)
export const KNOWN_APP_NAMES: Record<string, string> = {
  "instagram.com": "Instagram",
  "youtube.com": "YouTube",
  "github.com": "GitHub",
  "cursor.com": "Cursor",
  "authenticator.cursor.sh": "Cursor Auth",
  "grok.com": "Grok",
  "gemini.google.com": "Gemini",
  "chat.qwen.ai": "Qwen",
  "x.com": "X (Twitter)",
  "x.ai": "xAI",
  "accounts.x.ai": "xAI Account",
  "reddit.com": "Reddit",
  "discord.com": "Discord",
  "google.com": "Google Search",
  "accounts.google.com": "Google Account",
  "blog.google": "Google Blog",
  "scholar.google.com": "Google Scholar",
  "opal.google": "Google Opal",
  "antigravity.google": "Antigravity",
  "chess.com": "Chess.com",
  "lichess.org": "Lichess",
  "forwardchess.com": "Forward Chess",
  "app.airtalk.live": "AirTalk App",
  "airtalk.live": "AirTalk",
  "nature.com": "Nature",
  "in.tradingview.com": "TradingView",
  "agentrouter.org": "AgentRouter",
  "verizon.com": "Verizon",
  "lindows.org": "Lindows",
  "slack": "Slack",
  "code": "VS Code",
};

/**
 * Resolve friendly app display name. Falls back to capitalized derived site name.
 */
export function getFriendlyAppName(rawLabel: string): string {
  const lower = rawLabel.toLowerCase().trim();
  if (KNOWN_APP_NAMES[lower]) return KNOWN_APP_NAMES[lower];

  // Derive from domain: e.g. "sub.example.com" -> "Example"
  const clean = lower.replace(/^(?:https?:\/\/)?(?:www\.)?/, "");
  const parts = clean.split(".");
  if (parts.length >= 2) {
    const main = parts.length > 2 && parts[parts.length - 1].length <= 3 && parts[parts.length - 2].length <= 3
      ? parts[parts.length - 3]
      : parts[parts.length - 2];
    return main.charAt(0).toUpperCase() + main.slice(1);
  }
  return rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
}

/**
 * Get 1-2 letter monogram initials for local icon well (§3.5)
 */
export function getAppInitials(friendlyName: string): string {
  const words = friendlyName.split(/[\s.-]+/);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return friendlyName.slice(0, 2).toUpperCase();
}

export interface SessionHistogramBin {
  label: string;
  range: string;
  count: number;
  totalSeconds: number;
  percent: number;
}

export interface NerdyInsight {
  id: string;
  headline: string; // Plain-English conclusion
  detail: string;   // Exact calculation & support
  metricValue: string;
  eligible: boolean;
  sampleCount: number;
}

export interface AppLensData {
  key: string;
  friendlyName: string;
  rawLabel: string;
  category: Category;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
  totalDurationUnionSeconds: number;
  totalDurationSumSeconds: number;
  sessionCount: number;
  segmentCount: number; // Labeled "Recorded segments" per §1.1, §3.3
  medianSessionSeconds: number;
  medianSessionFormatted: string;
  medianSegmentSeconds: number | null;
  medianSegmentFormatted: string;
  p80SegmentSeconds: number | null;
  p90SegmentSeconds: number | null;
  longestSessionSeconds: number;
  longestSessionFormatted: string;
  histogram: SessionHistogramBin[];
  convenienceBins: HistogramBinsResult;
  thresholdPartition: ThresholdPartitionResult;
  unwantedDurationSeconds: number;
  appraisalSummary: AppraisalSummary;
  patterns: NerdyInsight[];
  recentSessions: Array<{
    id: string;
    startedAtFormatted: string;
    durationSeconds: number;
    durationFormatted: string;
    device: "computer" | "phone";
    category: Category;
    isExcluded: boolean;
    isAdjusted: boolean;
    isReviewed?: boolean;
    appraisal?: string;
    appraisalReason?: string;
  }>;
  allSegments?: Array<{
    id?: string;
    startMs: number;
    endMs: number;
    sliceStartMs: number;
    sliceEndMs: number;
    sliceSeconds: number;
    seconds: number;
    isExcluded: boolean;
    label?: string;
    device?: string;
    category?: Category;
  }>;
}

/**
 * Recompute threshold partition for an app's active slices given a threshold in seconds (§3.3).
 */
export function getAppLensThresholdPartition(
  slices: Array<{
    sliceStartMs?: number;
    startMs?: number;
    sliceEndMs?: number;
    endMs?: number;
    sliceSeconds?: number;
    seconds?: number;
    durationSeconds?: number;
    isExcluded?: boolean;
    id?: string;
    label?: string;
    device?: string;
  }>,
  thresholdSeconds: number
): ThresholdPartitionResult {
  const activeSlices = slices.filter((s) => !s.isExcluded);
  const segments = activeSlices.map((s) => {
    const startMs = s.sliceStartMs ?? s.startMs ?? 0;
    const durSec =
      s.sliceSeconds ??
      s.seconds ??
      s.durationSeconds ??
      (s.sliceEndMs && s.sliceStartMs ? Math.round((s.sliceEndMs - s.sliceStartMs) / 1000) : 0);
    const endMs = s.sliceEndMs ?? s.endMs ?? startMs + durSec * 1000;
    return {
      startMs,
      endMs,
      seconds: durSec,
      id: s.id,
      label: s.label,
      device: s.device,
    };
  });
  return computeThresholdPartition(segments, thresholdSeconds);
}

/**
 * Build complete App Lens data for an app across effective session slices.
 * Implements TIMEFRAME-UI-REDESIGN §3.6 and update.md §3.3, §6.2, §6.3, §7.
 */
export function computeAppLensData(
  appKey: string,
  slices: Array<EffectiveSessionSlice | EnrichedSession | any>,
  blocks: FocusBlock[] = []
): AppLensData {
  const matchingSlices: EffectiveSessionSlice[] = slices
    .filter((s) => s.label && s.label.toLowerCase() === appKey.toLowerCase())
    .map((s) => {
      const startMs = s.sliceStartMs ?? s.started_at_ms ?? (s.started_at ? Date.parse(s.started_at) : 0);
      const endMs = s.sliceEndMs ?? s.ended_at_ms ?? (s.ended_at ? Date.parse(s.ended_at) : 0);
      const durSec = s.sliceSeconds ?? s.duration_seconds ?? s.seconds ?? Math.max(0, Math.round((endMs - startMs) / 1000));
      return {
        ...s,
        id: s.id,
        originalSessionId: s.originalSessionId ?? s.id,
        sliceStartMs: startMs,
        sliceEndMs: endMs,
        started_at_ms: startMs,
        ended_at_ms: endMs,
        sliceSeconds: durSec,
        seconds: durSec,
        label: s.label,
        effectiveCategory: s.effectiveCategory ?? s.category ?? "other-known",
        originalCategory: s.originalCategory ?? s.category ?? "other-known",
        device: s.device ?? "computer",
        source: s.source ?? "unknown",
        isExcluded: s.isExcluded ?? s.is_fenced ?? false,
        isAdjusted: s.isAdjusted ?? false,
        isReviewed: s.isReviewed ?? false,
      } as EffectiveSessionSlice;
    });

  const rawLabel = matchingSlices.length > 0 ? matchingSlices[0].label : appKey;
  const friendlyName = getFriendlyAppName(rawLabel);
  const category = matchingSlices.length > 0 ? matchingSlices[0].effectiveCategory : "other-known";

  // Active (non-excluded) sessions for duration metrics
  const activeSlices = matchingSlices.filter((s) => !s.isExcluded);
  const totalSumSeconds = activeSlices.reduce((acc, s) => acc + s.sliceSeconds, 0);

  // Union duration
  const activeIntervals = activeSlices.map((s) => ({
    startMs: s.sliceStartMs,
    endMs: s.sliceEndMs,
  }));
  const totalUnionSeconds = measureUnionSeconds(activeIntervals);

  // Exact durations array for medians & percentiles
  const durations = activeSlices.map((s) => s.sliceSeconds).sort((a, b) => a - b);
  const medianSec = calculateMedianSeconds(durations);
  const medianFormatted = medianSec !== null ? formatDurationSeconds(medianSec) : "0m";
  const p80Sec = calculateNearestRankPercentile(durations, 0.8);
  const p90Sec = calculateNearestRankPercentile(durations, 0.9);
  const longestSec = durations.length > 0 ? durations[durations.length - 1] : 0;

  // Exact convenience histogram bins per §6.2: [0, 60), [60, 300], (300, inf)
  const convenienceBins = computeHistogramBins(durations);

  // Default threshold starts at 300s (5m display preset) per §3.3
  const thresholdPartition = getAppLensThresholdPartition(matchingSlices, 300);

  // User appraisal summary per §7
  const unwantedDurationSeconds = computeUnwantedUnionSeconds(matchingSlices);
  const appraisalSummary = computeAppraisalSummary(matchingSlices);

  // Legacy 4-bin histogram for compatibility
  const binUnder1m = activeSlices.filter((s) => s.sliceSeconds < 60);
  const bin1to5m = activeSlices.filter((s) => s.sliceSeconds >= 60 && s.sliceSeconds < 300);
  const bin5to15m = activeSlices.filter((s) => s.sliceSeconds >= 300 && s.sliceSeconds < 900);
  const binOver15m = activeSlices.filter((s) => s.sliceSeconds >= 900);

  const totalCount = Math.max(1, activeSlices.length);
  const legacyHistogram: SessionHistogramBin[] = [
    {
      label: "<1 min",
      range: "0–59s",
      count: binUnder1m.length,
      totalSeconds: binUnder1m.reduce((a, s) => a + s.sliceSeconds, 0),
      percent: Math.round((binUnder1m.length / totalCount) * 100),
    },
    {
      label: "1–5 min",
      range: "1–5m",
      count: bin1to5m.length,
      totalSeconds: bin1to5m.reduce((a, s) => a + s.sliceSeconds, 0),
      percent: Math.round((bin1to5m.length / totalCount) * 100),
    },
    {
      label: "5–15 min",
      range: "5–15m",
      count: bin5to15m.length,
      totalSeconds: bin5to15m.reduce((a, s) => a + s.sliceSeconds, 0),
      percent: Math.round((bin5to15m.length / totalCount) * 100),
    },
    {
      label: ">15 min",
      range: "15m+",
      count: binOver15m.length,
      totalSeconds: binOver15m.reduce((a, s) => a + s.sliceSeconds, 0),
      percent: Math.round((binOver15m.length / totalCount) * 100),
    },
  ];

  // Patterns per §3.3 & update.md §1.1 (plain factual wording, no heuristics-as-science)
  const patterns: NerdyInsight[] = [];

  if (durations.length >= 10) {
    // Empirical duration distribution finding
    const over300Count = convenienceBins.over5m.count;
    const over300Sum = convenienceBins.over5m.sumSeconds;
    const shareOver = totalSumSeconds > 0 ? (over300Sum / totalSumSeconds) * 100 : 0;

    patterns.push({
      id: "quick-checks-vs-long",
      headline: `Segments over 5m contained ${shareOver.toFixed(1)}% of recorded time.`,
      detail: `${convenienceBins.under1m.count} of ${durations.length} recorded segments were under 1m (${convenienceBins.under1m.percent}%). Segments over 5m accounted for ${formatDurationSeconds(over300Sum)} (${shareOver.toFixed(2)}%).`,
      metricValue: `${shareOver.toFixed(1)}% over 5m`,
      eligible: true,
      sampleCount: durations.length,
    });

    // Median & percentile finding
    const medFmt = formatDurationSeconds(medianSec ?? 0);
    const p80Fmt = formatDurationSeconds(p80Sec ?? 0);
    patterns.push({
      id: "typical-session",
      headline: `Median recorded segment: ${medFmt}; 80% at or below ${p80Fmt}.`,
      detail: `Empirical median of ${durations.length} recorded segments. Nearest-rank 80th percentile: ${p80Fmt}.`,
      metricValue: `Median ${medFmt}`,
      eligible: true,
      sampleCount: durations.length,
    });
  }

  // Focus block intersection finding
  const blockIntersectingSlices = activeSlices.filter((s) => !!s.associatedBlockId);
  const blockSeconds = blockIntersectingSlices.reduce((a, s) => a + s.sliceSeconds, 0);
  if (blocks.length >= 1 && blockSeconds > 0) {
    const blockFmt = formatDurationSeconds(blockSeconds);
    patterns.push({
      id: "inside-focus-blocks",
      headline: `${blockFmt} recorded during focus block active intervals.`,
      detail: `Intersected recorded duration of ${friendlyName} across ${blocks.length} focus blocks. Overlap indicates recorded presence, not proof of distraction.`,
      metricValue: blockFmt,
      eligible: true,
      sampleCount: blockIntersectingSlices.length,
    });
  }

  // Unwanted appraisal finding if user marked activity
  if (unwantedDurationSeconds > 0) {
    const unwFmt = formatDurationSeconds(unwantedDurationSeconds);
    patterns.push({
      id: "marked-unwanted",
      headline: `${unwFmt} marked unwanted by you.`,
      detail: `Based on explicit user appraisals. Unreviewed activity is not automatically unwanted.`,
      metricValue: unwFmt,
      eligible: true,
      sampleCount: matchingSlices.filter((s) => s.appraisal === "unwanted").length,
    });
  }

  // Fallback pattern if sparse data
  if (patterns.length === 0) {
    patterns.push({
      id: "sparse-notice",
      headline: "Sample context: fewer than 10 recorded segments.",
      detail: `Generalization withheld until broader empirical records exist. Currently recorded: ${durations.length} segments.`,
      metricValue: `${durations.length} segments`,
      eligible: false,
      sampleCount: durations.length,
    });
  }

  // Recent chronological sessions
  const recentSessions = matchingSlices.slice(0, 30).map((s) => ({
    id: s.id,
    startedAtFormatted: new Date(s.sliceStartMs).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    durationSeconds: s.sliceSeconds,
    durationFormatted: formatDurationSeconds(s.sliceSeconds),
    device: s.device,
    category: s.effectiveCategory,
    isExcluded: s.isExcluded,
    isAdjusted: s.isAdjusted,
    isReviewed: s.isReviewed,
    appraisal: s.appraisal,
    appraisalReason: s.appraisalReason,
  }));

  // All chronological segments with exact interval coordinates for dynamic threshold partitioning
  const allSegments = matchingSlices.map((s) => ({
    id: s.id,
    startMs: s.sliceStartMs,
    endMs: s.sliceEndMs,
    sliceStartMs: s.sliceStartMs,
    sliceEndMs: s.sliceEndMs,
    sliceSeconds: s.sliceSeconds,
    seconds: s.sliceSeconds,
    durationSeconds: s.sliceSeconds,
    isExcluded: s.isExcluded,
    label: s.label,
    device: s.device,
    category: s.effectiveCategory,
  }));

  return {
    key: appKey,
    friendlyName,
    rawLabel,
    category,
    totalDurationSeconds: totalSumSeconds,
    totalDurationFormatted: formatDurationSeconds(totalSumSeconds),
    totalDurationUnionSeconds: totalUnionSeconds,
    totalDurationSumSeconds: totalSumSeconds,
    sessionCount: activeSlices.length,
    segmentCount: activeSlices.length,
    medianSessionSeconds: medianSec ?? 0,
    medianSessionFormatted: medianFormatted,
    medianSegmentSeconds: medianSec,
    medianSegmentFormatted: medianFormatted,
    p80SegmentSeconds: p80Sec,
    p90SegmentSeconds: p90Sec,
    longestSessionSeconds: longestSec,
    longestSessionFormatted: formatDurationSeconds(longestSec),
    histogram: legacyHistogram,
    convenienceBins,
    thresholdPartition,
    unwantedDurationSeconds,
    appraisalSummary,
    patterns: patterns.slice(0, 3),
    recentSessions,
    allSegments,
  };
}
