/**
 * App Lens & Constellation Engine
 * Authority: TIMEFRAME-UI-REDESIGN.md v4.1 §3.5, §3.6
 * 
 * Friendly name resolution, local icons, session duration histograms,
 * and nerdy analytical patterns with plain-English conclusions and exact arithmetic.
 */

import { EnrichedSession, Category } from "./types";
import { formatMinutes, formatDurationSeconds } from "./format";
import { EffectiveSessionSlice } from "./corrections";
import { FocusBlock } from "./focus-blocks";

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
  sessionCount: number;
  medianSessionSeconds: number;
  medianSessionFormatted: string;
  longestSessionSeconds: number;
  longestSessionFormatted: string;
  histogram: SessionHistogramBin[];
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
  }>;
}

/**
 * Build complete nerdy App Lens data for an app across effective session slices (§3.6).
 */
export function computeAppLensData(
  appKey: string,
  slices: EffectiveSessionSlice[],
  blocks: FocusBlock[] = []
): AppLensData {
  const matchingSlices = slices.filter(
    (s) => s.label.toLowerCase() === appKey.toLowerCase()
  );

  const rawLabel = matchingSlices.length > 0 ? matchingSlices[0].label : appKey;
  const friendlyName = getFriendlyAppName(rawLabel);
  const category = matchingSlices.length > 0 ? matchingSlices[0].effectiveCategory : "other-known";

  // Active (non-excluded) sessions for duration metrics
  const activeSlices = matchingSlices.filter((s) => !s.isExcluded);
  const totalSeconds = activeSlices.reduce((acc, s) => acc + s.sliceSeconds, 0);

  // Durations array for medians & percentiles
  const durations = activeSlices.map((s) => s.sliceSeconds).sort((a, b) => a - b);
  const medianSec = durations.length > 0
    ? durations[Math.floor(durations.length / 2)]
    : 0;
  const longestSec = durations.length > 0 ? durations[durations.length - 1] : 0;

  // Session length histogram bins: <1m, 1-5m, 5-15m, >15m
  const binUnder1m = activeSlices.filter((s) => s.sliceSeconds < 60);
  const bin1to5m = activeSlices.filter((s) => s.sliceSeconds >= 60 && s.sliceSeconds < 300);
  const bin5to15m = activeSlices.filter((s) => s.sliceSeconds >= 300 && s.sliceSeconds < 900);
  const binOver15m = activeSlices.filter((s) => s.sliceSeconds >= 900);

  const totalCount = Math.max(1, activeSlices.length);
  const histogram: SessionHistogramBin[] = [
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

  // Compute up to 3 nerdy patterns per §3.6 table
  const patterns: NerdyInsight[] = [];

  // Pattern 1: Quick checks vs long visits (requires >= 10 sessions)
  if (durations.length >= 10) {
    const quickShare = binUnder1m.length / totalCount;
    const longTimeSec = bin5to15m.reduce((a, s) => a + s.sliceSeconds, 0) + binOver15m.reduce((a, s) => a + s.sliceSeconds, 0);
    const longTimeShare = totalSeconds > 0 ? longTimeSec / totalSeconds : 0;

    let headline = "Even mix between quick glances and longer stays.";
    if (quickShare >= 0.5 && longTimeShare >= 0.5) {
      headline = "Most sessions were short; most time came from longer visits.";
    } else if (quickShare >= 0.6) {
      headline = "Predominantly used for quick checks under 60 seconds.";
    }

    patterns.push({
      id: "quick-checks-vs-long",
      headline,
      detail: `${binUnder1m.length} of ${durations.length} sessions were under 1m (${Math.round(quickShare * 100)}%), while visits over 5m accounted for ${Math.round(longTimeShare * 100)}% of total time.`,
      metricValue: `${Math.round(quickShare * 100)}% quick checks`,
      eligible: true,
      sampleCount: durations.length,
    });
  }

  // Pattern 2: Typical session (median and p80, requires >= 10 sessions)
  if (durations.length >= 10) {
    const p80Index = Math.min(durations.length - 1, Math.floor(durations.length * 0.8));
    const p80Sec = durations[p80Index];
    const medFmt = formatDurationSeconds(medianSec);
    const p80Fmt = formatDurationSeconds(p80Sec);

    patterns.push({
      id: "typical-session",
      headline: `Median visit ${medFmt}; 80% ended within ${p80Fmt}.`,
      detail: `Calculated from ${durations.length} recorded sessions. Nearest-rank 80th percentile duration: ${p80Fmt}.`,
      metricValue: `Median ${medFmt}`,
      eligible: true,
      sampleCount: durations.length,
    });
  }

  // Pattern 3: Inside focus blocks
  const blockIntersectingSlices = activeSlices.filter((s) => !!s.associatedBlockId);
  const blockSeconds = blockIntersectingSlices.reduce((a, s) => a + s.sliceSeconds, 0);
  if (blocks.length >= 1 && blockSeconds > 0) {
    const blockFmt = formatDurationSeconds(blockSeconds);
    patterns.push({
      id: "inside-focus-blocks",
      headline: `${blockFmt} appeared inside your planned focus blocks.`,
      detail: `Union duration of ${friendlyName} activity intersecting active intervals across ${blocks.length} focus blocks. Overlap indicates recorded presence, not proof of distraction.`,
      metricValue: blockFmt,
      eligible: true,
      sampleCount: blockIntersectingSlices.length,
    });
  }

  // Fallback pattern if sparse data
  if (patterns.length === 0) {
    patterns.push({
      id: "sparse-notice",
      headline: "More recorded sessions needed for pattern detection.",
      detail: `Pattern analysis requires at least 10 valid sessions. Currently recorded: ${durations.length} sessions.`,
      metricValue: `${durations.length} sessions`,
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
  }));

  return {
    key: appKey,
    friendlyName,
    rawLabel,
    category,
    totalDurationSeconds: totalSeconds,
    totalDurationFormatted: formatDurationSeconds(totalSeconds),
    sessionCount: activeSlices.length,
    medianSessionSeconds: medianSec,
    medianSessionFormatted: formatDurationSeconds(medianSec),
    longestSessionSeconds: longestSec,
    longestSessionFormatted: formatDurationSeconds(longestSec),
    histogram,
    patterns: patterns.slice(0, 3),
    recentSessions,
  };
}
