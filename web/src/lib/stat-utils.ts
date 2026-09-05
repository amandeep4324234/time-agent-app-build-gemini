/**
 * Exact Statistical & Interval Utility Functions
 * Authority: update.md §6.1, §6.2, §6.3, §6.4, §10, §11
 * 
 * Rules:
 * - Half-open intervals [start, end) throughout.
 * - Touching intervals [0,10) and [10,20) union to 20.
 * - Overlapping intervals [0,10) and [5,15) union to 15.
 * - Median: central element for odd N, arithmetic mean of two central elements for even N.
 * - Percentile: Nearest-rank NIST method Q(p) = d_sorted[ceil(p*N)], 1-based (ceil(p*N) - 1 in 0-based indexing).
 * - Empty N=0 returns null, never zero percent.
 * - Histogram bins: [0, 60) 'Under 1m', [60, 300] '1–5m', (300, inf) 'Over 5m'.
 * - Nonpositive durations (<= 0) quarantined.
 * - Summed segment-seconds distinguished from union duration.
 */

export interface TimeInterval {
  startMs: number;
  endMs: number;
}

export interface SegmentWithInterval extends TimeInterval {
  id?: string;
  seconds?: number;
  label?: string;
  app?: string;
  device?: string;
}

/**
 * Compute union of intervals [start, end) and return disjoint merged intervals.
 * Touching intervals [0,10) and [10,20) merge to [0,20).
 */
export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  const valid = intervals
    .filter((inv) => inv.endMs > inv.startMs)
    .sort((a, b) => a.startMs - b.startMs);

  if (valid.length === 0) return [];

  const merged: TimeInterval[] = [{ startMs: valid[0].startMs, endMs: valid[0].endMs }];

  for (let i = 1; i < valid.length; i++) {
    const current = valid[i];
    const last = merged[merged.length - 1];

    if (current.startMs <= last.endMs) {
      // Overlapping or touching ([start_current <= end_last])
      last.endMs = Math.max(last.endMs, current.endMs);
    } else {
      merged.push({ startMs: current.startMs, endMs: current.endMs });
    }
  }

  return merged;
}

/**
 * Measure the total duration (in seconds) of the union of intervals.
 * Clips to optional query window [windowStartMs, windowEndMs) before union.
 */
export function measureUnionSeconds(
  intervals: TimeInterval[],
  window?: { startMs: number; endMs: number }
): number {
  let clipped = intervals;
  if (window) {
    clipped = intervals
      .map((inv) => ({
        startMs: Math.max(inv.startMs, window.startMs),
        endMs: Math.min(inv.endMs, window.endMs),
      }))
      .filter((inv) => inv.endMs > inv.startMs);
  }

  const merged = mergeIntervals(clipped);
  const totalMs = merged.reduce((acc, inv) => acc + (inv.endMs - inv.startMs), 0);
  return Math.round(totalMs / 1000);
}

/**
 * Compute median duration for an array of durations (in seconds).
 * Returns null if durations array is empty (N=0).
 * For odd N: middle observation.
 * For even N: arithmetic mean of the two central observations.
 */
export function calculateMedianSeconds(durations: number[]): number | null {
  const valid = durations.filter((d) => d > 0).sort((a, b) => a - b);
  const N = valid.length;
  if (N === 0) return null;

  if (N % 2 === 1) {
    return valid[Math.floor(N / 2)];
  } else {
    const mid1 = valid[N / 2 - 1];
    const mid2 = valid[N / 2];
    return Math.round(((mid1 + mid2) / 2) * 100) / 100;
  }
}

/**
 * Compute nearest-rank quantile Q(p) = d_sorted[ceil(p*N)], 1-based.
 * Returns null if N=0.
 * @param durations array of positive durations
 * @param p quantile fraction (0 < p <= 1, e.g. 0.8 for p80)
 */
export function calculateNearestRankPercentile(
  durations: number[],
  p: number
): number | null {
  if (p <= 0 || p > 1) {
    throw new Error(`Quantile p must be in (0, 1], got ${p}`);
  }
  const valid = durations.filter((d) => d > 0).sort((a, b) => a - b);
  const N = valid.length;
  if (N === 0) return null;

  // 1-based formula: ceil(p * N). In 0-based array index: ceil(p * N) - 1
  const index = Math.ceil(p * N) - 1;
  const clampedIndex = Math.max(0, Math.min(N - 1, index));
  return valid[clampedIndex];
}

export interface HistogramBinData {
  label: string;
  range: string;
  count: number;
  sumSeconds: number;
  seconds: number;
  percent: number | null;
}

export interface HistogramBinsResult {
  totalCount: number;
  totalSumSeconds: number;
  quarantinedCount: number;
  under1m: HistogramBinData;
  bin1to5m: HistogramBinData;
  between1mAnd5m: HistogramBinData;
  over5m: HistogramBinData;
}

/**
 * Partition durations into convenience bins:
 * [0, 60) 'Under 1m'
 * [60, 300] '1–5m'
 * (300, infinity) 'Over 5m'
 * Durations <= 0 are quarantined (not included in visits/distribution).
 */
export function computeHistogramBins(
  durations: number[],
  options?: { allowZero?: boolean }
): HistogramBinsResult {
  let quarantinedCount = 0;
  const valid: number[] = [];
  const allowZero = options?.allowZero ?? false;

  for (const d of durations) {
    if (allowZero ? d < 0 : d <= 0) {
      quarantinedCount++;
    } else {
      valid.push(d);
    }
  }

  const totalCount = valid.length;
  const totalSumSeconds = valid.reduce((a, b) => a + b, 0);

  const under1mList = valid.filter((d) => d < 60);
  const bin1to5mList = valid.filter((d) => d >= 60 && d <= 300);
  const over5mList = valid.filter((d) => d > 300);

  const under1mSum = under1mList.reduce((a, b) => a + b, 0);
  const bin1to5mSum = bin1to5mList.reduce((a, b) => a + b, 0);
  const over5mSum = over5mList.reduce((a, b) => a + b, 0);

  const binUnder1m: HistogramBinData = {
    label: "Under 1m",
    range: "[0, 60s)",
    count: under1mList.length,
    sumSeconds: under1mSum,
    seconds: under1mSum,
    percent: totalCount > 0 ? Math.round((under1mList.length / totalCount) * 1000) / 10 : null,
  };

  const binBetween1mAnd5m: HistogramBinData = {
    label: "1–5m",
    range: "[60s, 300s]",
    count: bin1to5mList.length,
    sumSeconds: bin1to5mSum,
    seconds: bin1to5mSum,
    percent: totalCount > 0 ? Math.round((bin1to5mList.length / totalCount) * 1000) / 10 : null,
  };

  const binOver5m: HistogramBinData = {
    label: "Over 5m",
    range: "(300s, ∞)",
    count: over5mList.length,
    sumSeconds: over5mSum,
    seconds: over5mSum,
    percent: totalCount > 0 ? Math.round((over5mList.length / totalCount) * 1000) / 10 : null,
  };

  return {
    totalCount,
    totalSumSeconds,
    quarantinedCount,
    under1m: binUnder1m,
    bin1to5m: binBetween1mAnd5m,
    between1mAnd5m: binBetween1mAnd5m,
    over5m: binOver5m,
  };
}

export interface ThresholdPartitionResult {
  thresholdSeconds: number;
  totalSegments: number;
  segmentsUnderOrEqual: number;
  segmentsOver: number;
  shareUnderOrEqualPercent: number | null;
  shareOverPercent: number | null;
  summedSecondsTotal: number;
  summedSecondsOver: number;
  summedSecondsUnderOrEqual: number;
  summedShareOverPercent: number | null;
  unionSecondsTotal: number;
  unionSecondsOver: number;
  unionShareOverPercent: number | null;
  isOverlapping: boolean;
}

/**
 * Compute empirical duration threshold partition for segments.
 * Explicitly distinguishes summed segment-seconds from union duration (§6.3).
 */
export function computeThresholdPartition(
  segments: SegmentWithInterval[],
  thresholdSeconds: number
): ThresholdPartitionResult {
  const valid = segments.filter((s) => {
    const durSec = s.seconds ?? Math.round((s.endMs - s.startMs) / 1000);
    return durSec > 0;
  });

  const N = valid.length;
  if (N === 0) {
    return {
      thresholdSeconds,
      totalSegments: 0,
      segmentsUnderOrEqual: 0,
      segmentsOver: 0,
      shareUnderOrEqualPercent: null,
      shareOverPercent: null,
      summedSecondsTotal: 0,
      summedSecondsOver: 0,
      summedSecondsUnderOrEqual: 0,
      summedShareOverPercent: null,
      unionSecondsTotal: 0,
      unionSecondsOver: 0,
      unionShareOverPercent: null,
      isOverlapping: false,
    };
  }

  const overSegments: SegmentWithInterval[] = [];
  const underOrEqualSegments: SegmentWithInterval[] = [];

  let summedSecondsTotal = 0;
  let summedSecondsOver = 0;
  let summedSecondsUnderOrEqual = 0;

  for (const s of valid) {
    const durSec = s.seconds ?? Math.round((s.endMs - s.startMs) / 1000);
    summedSecondsTotal += durSec;
    if (durSec > thresholdSeconds) {
      overSegments.push(s);
      summedSecondsOver += durSec;
    } else {
      underOrEqualSegments.push(s);
      summedSecondsUnderOrEqual += durSec;
    }
  }

  const unionSecondsTotal = measureUnionSeconds(valid);
  const unionSecondsOver = measureUnionSeconds(overSegments);
  const isOverlapping = summedSecondsTotal > unionSecondsTotal;

  return {
    thresholdSeconds,
    totalSegments: N,
    segmentsUnderOrEqual: underOrEqualSegments.length,
    segmentsOver: overSegments.length,
    shareUnderOrEqualPercent: Math.round((underOrEqualSegments.length / N) * 1000) / 10,
    shareOverPercent: Math.round((overSegments.length / N) * 1000) / 10,
    summedSecondsTotal,
    summedSecondsOver,
    summedSecondsUnderOrEqual,
    summedShareOverPercent:
      summedSecondsTotal > 0
        ? Math.round((summedSecondsOver / summedSecondsTotal) * 1000) / 10
        : null,
    unionSecondsTotal,
    unionSecondsOver,
    unionShareOverPercent:
      unionSecondsTotal > 0
        ? Math.round((unionSecondsOver / unionSecondsTotal) * 1000) / 10
        : null,
    isOverlapping,
  };
}

/**
 * Intersect two lists of intervals: union(A) intersect union(B).
 * Pauses are excluded by defining activeIntervals of B without paused intervals.
 */
export function intersectIntervals(
  intervalsA: TimeInterval[],
  intervalsB: TimeInterval[]
): TimeInterval[] {
  const mergedA = mergeIntervals(intervalsA);
  const mergedB = mergeIntervals(intervalsB);

  const intersections: TimeInterval[] = [];

  for (const a of mergedA) {
    for (const b of mergedB) {
      const startMs = Math.max(a.startMs, b.startMs);
      const endMs = Math.min(a.endMs, b.endMs);
      if (endMs > startMs) {
        intersections.push({ startMs, endMs });
      }
    }
  }

  return mergeIntervals(intersections);
}

/**
 * Compute overlap in seconds between app activity intervals A and block intervals B.
 * Implements §6.4: app overlap = measure(union(A) intersect union(B)).
 */
export function computeBlockOverlapSeconds(
  appIntervals: TimeInterval[],
  blockActiveIntervals: TimeInterval[]
): number {
  const intersected = intersectIntervals(appIntervals, blockActiveIntervals);
  return measureUnionSeconds(intersected);
}

export const computeIntervalUnionSeconds = measureUnionSeconds;
export const computeIntervalIntersectionSeconds = computeBlockOverlapSeconds;
export function computeMedianSegmentSeconds(durations: number[]): number {
  return calculateMedianSeconds(durations) ?? 0;
}
export const computeNearestRankPercentile = calculateNearestRankPercentile;
export function computeConvenienceBins(durations: number[]): HistogramBinsResult {
  return computeHistogramBins(durations, { allowZero: true });
}

export interface ThresholdPartitionAlternativeResult {
  totalCount: number;
  summedSeconds: number;
  unionSeconds: number;
  atOrBelowThreshold: {
    count: number;
    summedSeconds: number;
    unionSeconds: number;
    shareOfSummedSeconds: number;
    shareOfUnionSeconds: number;
  };
  overThreshold: {
    count: number;
    summedSeconds: number;
    unionSeconds: number;
    shareOfSummedSeconds: number;
    shareOfUnionSeconds: number;
  };
}

export function partitionByThreshold(
  slices: Array<{ startMs: number; endMs: number; seconds?: number }>,
  thresholdSeconds: number
): ThresholdPartitionAlternativeResult {
  const atOrBelow: Array<{ startMs: number; endMs: number; seconds: number }> = [];
  const over: Array<{ startMs: number; endMs: number; seconds: number }> = [];
  let totalSum = 0;

  for (const s of slices) {
    const sec = s.seconds ?? Math.round((s.endMs - s.startMs) / 1000);
    const item = { startMs: s.startMs, endMs: s.endMs, seconds: sec };
    totalSum += sec;
    if (sec <= thresholdSeconds) {
      atOrBelow.push(item);
    } else {
      over.push(item);
    }
  }

  const atOrBelowSum = atOrBelow.reduce((a, b) => a + b.seconds, 0);
  const overSum = over.reduce((a, b) => a + b.seconds, 0);
  const totalUnion = measureUnionSeconds(slices);
  const atOrBelowUnion = measureUnionSeconds(atOrBelow);
  const overUnion = measureUnionSeconds(over);

  return {
    totalCount: slices.length,
    summedSeconds: totalSum,
    unionSeconds: totalUnion,
    atOrBelowThreshold: {
      count: atOrBelow.length,
      summedSeconds: atOrBelowSum,
      unionSeconds: atOrBelowUnion,
      shareOfSummedSeconds: totalSum > 0 ? atOrBelowSum / totalSum : 0,
      shareOfUnionSeconds: totalUnion > 0 ? atOrBelowUnion / totalUnion : 0,
    },
    overThreshold: {
      count: over.length,
      summedSeconds: overSum,
      unionSeconds: overUnion,
      shareOfSummedSeconds: totalSum > 0 ? overSum / totalSum : 0,
      shareOfUnionSeconds: totalUnion > 0 ? overUnion / totalUnion : 0,
    },
  };
}

