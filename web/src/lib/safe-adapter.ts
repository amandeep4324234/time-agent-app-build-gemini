/**
 * Safe Presentation Adapter
 * Authority: TIMEFRAME-UI-REDESIGN.md §3.3, §10
 * 
 * Strict privacy disclosure boundary:
 * Raw fenced rows (category === 'private' or sensitive domains) never reach a renderer.
 * Fenced activity is completely excluded from UI payloads, accessibility labels, and tooltips.
 */

import { EnrichedSession, FocusRun, Category } from "./types";
import { Availability, Metric } from "./presentation-types";
import { computeTrackedMetrics } from "./union";

// Mental health and sensitive domains explicitly fenced
export const FENCED_DOMAINS = new Set([
  "screening.mhanational.org",
  "heartitout.in",
]);

export function isFencedSession(session: EnrichedSession): boolean {
  if (session.category === "private") return true;
  if (session.canonical_app === "private") return true;
  if (FENCED_DOMAINS.has(session.label.toLowerCase())) return true;
  return false;
}

export interface SafeTimelineSegment {
  id: string;
  sourceSessionId: string;
  app: string;
  category: Category;
  device: "computer" | "phone";
  startMs: number;
  endMs: number;
  durationSeconds: number;
  leftPercent: number;
  widthPercent: number;
}

export interface SafeRunSegment {
  id: string;
  startMs: number;
  endMs: number;
  durationSeconds: number;
  leftPercent: number;
  widthPercent: number;
  ended_by?: "sink" | "hole" | "day-end" | "open";
  killerApp?: string; // only display-safe app name, never fenced
  contributingApps: string[];
}

export interface SafeDayAdapterResult {
  date: string;
  timezone: string;
  dayStartMs: number;
  dayEndMs: number;
  totalDaySeconds: number;
  availability: Availability;
  metrics: {
    focus: Metric;
    sink: Metric;
    deepBlocks: {
      count: number;
      longestSeconds: number;
      longestMinutes: number;
    };
    unionTrackedSeconds: number;
  };
  segments: {
    computer: SafeTimelineSegment[];
    phone: SafeTimelineSegment[];
    focusRuns: SafeRunSegment[];
  };
  categories: Array<{
    category: "work" | "sink" | "games" | "other" | "unclassified";
    label: string;
    seconds: number;
    hours: number;
    percent: number;
    color: string;
  }>;
  apps: Array<{
    key: string;
    label: string;
    category: Category;
    seconds: number;
    hours: number;
    sessionCount: number;
  }>;
  privacyDisclosure: string;
}

/**
 * Filter and project raw sessions into safe, displayable timeline and summary models.
 */
export function buildSafeDayPresentation(
  date: string,
  rawSessions: EnrichedSession[],
  rawRuns: FocusRun[],
  dayStartMs: number,
  dayEndMs: number,
  timezone = "Asia/Kolkata",
  focusGoalHours?: number
): SafeDayAdapterResult {
  const totalDayMs = Math.max(1, dayEndMs - dayStartMs);
  const totalDaySeconds = totalDayMs / 1000;

  // STRICT PRIVACY BOUNDARY (§3.3): Exclude all fenced sessions from displayable payload
  const safeSessions = rawSessions.filter(
    (s) => !isFencedSession(s) && s.started_at_ms < dayEndMs && s.ended_at_ms > dayStartMs
  );

  // Map segments for computer and phone
  const computerSegments: SafeTimelineSegment[] = [];
  const phoneSegments: SafeTimelineSegment[] = [];

  for (const s of safeSessions) {
    const clampedStart = Math.max(s.started_at_ms, dayStartMs);
    const clampedEnd = Math.min(s.ended_at_ms, dayEndMs);
    if (clampedEnd <= clampedStart) continue;

    const leftPercent = ((clampedStart - dayStartMs) / totalDayMs) * 100;
    const widthPercent = Math.max(0.05, ((clampedEnd - clampedStart) / totalDayMs) * 100);
    const durationSeconds = Math.round((clampedEnd - clampedStart) / 1000);

    const seg: SafeTimelineSegment = {
      id: `seg-${s.id}`,
      sourceSessionId: s.id,
      app: s.label,
      category: s.category,
      device: s.device,
      startMs: clampedStart,
      endMs: clampedEnd,
      durationSeconds,
      leftPercent,
      widthPercent,
    };

    if (s.device === "computer") {
      computerSegments.push(seg);
    } else {
      phoneSegments.push(seg);
    }
  }

  // Safe focus runs (§7.1)
  const safeRuns: SafeRunSegment[] = [];
  for (let i = 0; i < rawRuns.length; i++) {
    const r = rawRuns[i];
    const clampedStart = Math.max(r.startMs, dayStartMs);
    const clampedEnd = Math.min(r.endMs, dayEndMs);
    if (clampedEnd <= clampedStart) continue;

    const leftPercent = ((clampedStart - dayStartMs) / totalDayMs) * 100;
    const widthPercent = Math.max(0.05, ((clampedEnd - clampedStart) / totalDayMs) * 100);
    const durationSeconds = Math.round((clampedEnd - clampedStart) / 1000);

    // Filter killerApp if fenced
    let safeKillerApp = r.killerApp;
    if (safeKillerApp && (safeKillerApp === "private" || FENCED_DOMAINS.has(safeKillerApp.toLowerCase()))) {
      safeKillerApp = undefined; // Suppress rather than reveal or invent (§3.3)
    }

    // Filter contributing apps
    const safeContributing = (r.apps || []).filter(
      (app) => app !== "private" && !FENCED_DOMAINS.has(app.toLowerCase())
    );

    safeRuns.push({
      id: `run-${i}-${r.startMs}`,
      startMs: clampedStart,
      endMs: clampedEnd,
      durationSeconds,
      leftPercent,
      widthPercent,
      ended_by: r.ended_by,
      killerApp: safeKillerApp,
      contributingApps: safeContributing,
    });
  }

  // Compute union and categories from display-safe activity
  const workSessions = safeSessions.filter((s) => s.category === "work");
  const workSeconds = Math.round(computeTrackedMetrics(workSessions).unionSeconds);

  const sinkSessions = safeSessions.filter((s) => s.category === "sink");
  const sinkSeconds = Math.round(computeTrackedMetrics(sinkSessions).unionSeconds);

  const gamesSessions = safeSessions.filter((s) => s.category === "games");
  const gamesSeconds = Math.round(computeTrackedMetrics(gamesSessions).unionSeconds);

  const otherSessions = safeSessions.filter((s) => s.category === "other-known");
  const otherSeconds = Math.round(computeTrackedMetrics(otherSessions).unionSeconds);

  const unclassifiedSessions = safeSessions.filter((s) => s.category === "unclassified");
  const unclassifiedSeconds = Math.round(computeTrackedMetrics(unclassifiedSessions).unionSeconds);

  const totalSafeSeconds = Math.round(computeTrackedMetrics(safeSessions).unionSeconds);
  const categorySum = workSeconds + sinkSeconds + gamesSeconds + otherSeconds + unclassifiedSeconds;
  const denominator = Math.max(1, categorySum);

  // Deep blocks: run >= 15 min (900 seconds)
  const deepBlocks = safeRuns.filter((r) => r.durationSeconds >= 15 * 60);
  const longestSeconds = safeRuns.length > 0
    ? Math.max(...safeRuns.map((r) => r.durationSeconds))
    : 0;

  // Determine availability
  let availability: Availability = "ready";
  if (rawSessions.length === 0) {
    availability = "no-data";
  } else if (totalSafeSeconds < 45 * 60) {
    availability = "light-day";
  }

  // Categories breakdown (§6.3)
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

  // App breakdown (§6.3)
  const appMap = new Map<string, { label: string; category: Category; seconds: number; count: number }>();
  for (const s of safeSessions) {
    const key = s.label.toLowerCase();
    const existing = appMap.get(key) || {
      label: s.label,
      category: s.category,
      seconds: 0,
      count: 0,
    };
    existing.seconds += s.seconds;
    existing.count += 1;
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
    }))
    .sort((a, b) => {
      if (b.seconds !== a.seconds) return b.seconds - a.seconds;
      return a.label.localeCompare(b.label);
    });

  return {
    date,
    timezone,
    dayStartMs,
    dayEndMs,
    totalDaySeconds,
    availability,
    metrics: {
      focus: {
        value: availability === "no-data" ? null : workSeconds,
        unit: "seconds",
        basis: "all-devices-safe",
        availability,
        explanation:
          "Recorded time in apps categorized as Work, after the existing idle adjustment. Overlapping device time is counted once. This does not measure attention.",
      },
      sink: {
        value: availability === "no-data" ? null : sinkSeconds,
        unit: "seconds",
        basis: "all-devices-safe",
        availability,
        explanation: "Recorded time in apps you categorize as Sinks.",
      },
      deepBlocks: {
        count: deepBlocks.length,
        longestSeconds,
        longestMinutes: Math.round(longestSeconds / 60),
      },
      unionTrackedSeconds: totalSafeSeconds,
    },
    segments: {
      computer: computerSegments,
      phone: phoneSegments,
      focusRuns: safeRuns,
    },
    categories,
    apps,
    privacyDisclosure: "Private activity is excluded from this view.",
  };
}
