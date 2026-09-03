import { EnrichedSession, TopSinkItem } from "./types";
import { computeUnionDurationSeconds, Interval } from "./union";

/**
 * Computes Top 5 sinks ranked by union hours (not session count).
 * Calculates median session length and count.
 * Private sinks render with name "private".
 */
export function computeTopSinks(sessions: EnrichedSession[]): TopSinkItem[] {
  const sinkSessions = sessions.filter((s) => s.category === "sink");

  if (sinkSessions.length === 0) {
    return [];
  }

  // Group by canonical app
  const groups: Record<string, EnrichedSession[]> = {};
  for (const s of sinkSessions) {
    const key = s.canonical_app;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }

  const items: TopSinkItem[] = [];

  for (const [appName, list] of Object.entries(groups)) {
    const intervals: Interval[] = list.map((s) => ({
      startMs: s.started_at_ms,
      endMs: s.ended_at_ms,
    }));

    const unionSec = computeUnionDurationSeconds(intervals, 0);
    const hours = parseFloat((unionSec / 3600).toFixed(2));

    const durations = list.map((s) => s.seconds).sort((a, b) => a - b);
    const mid = Math.floor(durations.length / 2);
    const medianSec =
      durations.length % 2 === 0
        ? (durations[mid - 1] + durations[mid]) / 2
        : durations[mid];
    const medianMinutes = Math.round(medianSec / 60);

    const isPrivate = list.some((s) => s.category === "private" || s.label.toLowerCase().includes("private"));

    const resolvedName = isPrivate ? "private" : appName;
    items.push({
      label: resolvedName,
      name: resolvedName,
      unionHours: hours,
      hours,
      medianMinutes,
      visitCount: list.length,
      count: list.length,
      isPrivate,
    });
  }

  // Rank by union hours descending
  items.sort((a, b) => b.hours - a.hours);

  return items.slice(0, 5);
}
