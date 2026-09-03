export interface Interval {
  startMs: number;
  endMs: number;
}

/**
 * Merges overlapping intervals and returns the total union duration in seconds.
 * afkBridgeMaxMs: if gap <= afkBridgeMaxMs, intervals can bridge.
 * AFK strictly > 180s splits (gap of exactly 180s bridges -> 180,000 ms).
 * When bridging is 0, pure union is computed.
 */
export function computeUnionDurationSeconds(
  intervals: Interval[],
  afkBridgeMaxMs = 0
): number {
  if (intervals.length === 0) return 0;

  // Filter out non-positive intervals
  const valid = intervals
    .filter((inv) => inv.endMs > inv.startMs)
    .sort((a, b) => a.startMs - b.startMs);

  if (valid.length === 0) return 0;

  const merged: Interval[] = [];
  let current: Interval = { ...valid[0] };

  for (let i = 1; i < valid.length; i++) {
    const next = valid[i];
    if (next.startMs <= current.endMs + afkBridgeMaxMs) {
      current.endMs = Math.max(current.endMs, next.endMs);
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  const totalMs = merged.reduce((sum, inv) => sum + (inv.endMs - inv.startMs), 0);
  return totalMs / 1000;
}

/**
 * Computes raw sum, union, and double-count hours for a set of sessions.
 */
export function computeTrackedMetrics(sessions: Array<{ started_at_ms: number; ended_at_ms: number; seconds: number }>) {
  const rawSumSeconds = sessions.reduce((acc, s) => acc + s.seconds, 0);
  const rawSumHours = parseFloat((rawSumSeconds / 3600).toFixed(2));

  const intervals: Interval[] = sessions.map((s) => ({
    startMs: s.started_at_ms,
    endMs: s.ended_at_ms,
  }));

  const unionSeconds = computeUnionDurationSeconds(intervals, 0);
  const unionHours = parseFloat((unionSeconds / 3600).toFixed(2));
  const doubleCountHours = parseFloat(Math.max(0, rawSumHours - unionHours).toFixed(2));

  return {
    rawSumSeconds,
    rawSumHours,
    unionSeconds,
    unionHours,
    doubleCountHours,
  };
}
