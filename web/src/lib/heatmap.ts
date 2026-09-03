import { EnrichedSession } from "./types";
import { getLocalHour, getLogicalDay } from "./day";

/**
 * Computes 24 hour buckets for a specific day or week.
 * Value = minutes of tracked time in that hour (0..60), or -1 for no measurement (blank).
 */
export function computeDayHeatmap(
  sessions: EnrichedSession[],
  logicalDayString: string,
  tz = "Asia/Kolkata"
): number[] {
  // If no sessions on this day at all, all cells are -1 (no data / blank)
  const daySessions = sessions.filter((s) => getLogicalDay(s.started_at_ms, tz) === logicalDayString);
  if (daySessions.length === 0) {
    return new Array(24).fill(-1);
  }

  const hourSeconds = new Array(24).fill(0);

  for (const s of daySessions) {
    if (s.category === "system") continue;
    const hour = getLocalHour(s.started_at_ms, tz);
    if (hour >= 0 && hour < 24) {
      hourSeconds[hour] += s.seconds;
    }
  }

  return hourSeconds.map((sec) => Math.min(60, Math.round(sec / 60)));
}
