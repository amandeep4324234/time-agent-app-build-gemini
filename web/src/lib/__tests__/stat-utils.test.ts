import { describe, it, expect } from "vitest";
import {
  mergeIntervals,
  measureUnionSeconds,
  calculateMedianSeconds,
  calculateNearestRankPercentile,
  computeHistogramBins,
  computeThresholdPartition,
  intersectIntervals,
  computeBlockOverlapSeconds,
} from "../stat-utils";
import demoSessions from "../../../data/demo-sessions.json";

describe("Statistical & Interval Utilities (§6, §10, §11 checks)", () => {
  describe("Interval Union & Touching Boundaries (§6.1, §11)", () => {
    it("Touching intervals [0,10), [10,20) total 20", () => {
      const intervals = [
        { startMs: 0, endMs: 10_000 },
        { startMs: 10_000, endMs: 20_000 },
      ];
      expect(measureUnionSeconds(intervals)).toBe(20);
      const merged = mergeIntervals(intervals);
      expect(merged.length).toBe(1);
      expect(merged[0]).toEqual({ startMs: 0, endMs: 20_000 });
    });

    it("Overlapping intervals [0,10), [5,15) total 15", () => {
      const intervals = [
        { startMs: 0, endMs: 10_000 },
        { startMs: 5_000, endMs: 15_000 },
      ];
      expect(measureUnionSeconds(intervals)).toBe(15);
      const merged = mergeIntervals(intervals);
      expect(merged.length).toBe(1);
      expect(merged[0]).toEqual({ startMs: 0, endMs: 15_000 });
    });

    it("Disjoint intervals [0,10), [15,25) total 20", () => {
      const intervals = [
        { startMs: 0, endMs: 10_000 },
        { startMs: 15_000, endMs: 25_000 },
      ];
      expect(measureUnionSeconds(intervals)).toBe(20);
      const merged = mergeIntervals(intervals);
      expect(merged.length).toBe(2);
    });

    it("Empty intervals list totals 0", () => {
      expect(measureUnionSeconds([])).toBe(0);
    });
  });

  describe("Median & Percentile Conventions (§6.2, §11)", () => {
    it("Odd-N median returns middle observation", () => {
      expect(calculateMedianSeconds([10, 20, 30])).toBe(20);
      expect(calculateMedianSeconds([50, 10, 30, 20, 40])).toBe(30);
    });

    it("Even-N median returns arithmetic mean of central two observations", () => {
      expect(calculateMedianSeconds([10, 20, 30, 40])).toBe(25);
      expect(calculateMedianSeconds([10, 20])).toBe(15);
      expect(calculateMedianSeconds([10, 15])).toBe(12.5);
    });

    it("Empty array returns null, never zero", () => {
      expect(calculateMedianSeconds([])).toBeNull();
    });

    it("Singleton array returns the single element", () => {
      expect(calculateMedianSeconds([42])).toBe(42);
    });

    it("Nearest-rank quantile Q(p) = d_sorted[ceil(p*N)] 1-based convention", () => {
      // For N=5: ceil(0.8 * 5) = 4th element (1-based), which is index 3
      const d = [10, 20, 30, 40, 50];
      expect(calculateNearestRankPercentile(d, 0.8)).toBe(40);
      // For N=10: p80 -> ceil(8) = 8th element
      const d10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(calculateNearestRankPercentile(d10, 0.8)).toBe(8);
      // Empty array returns null
      expect(calculateNearestRankPercentile([], 0.8)).toBeNull();
    });
  });

  describe("Histogram Convenience Bins & Nonpositive Durations (§6.2, §11)", () => {
    it("Exact 60s and 300s land in [60, 300] bin ('1–5m')", () => {
      const durations = [
        59,   // Under 1m
        60,   // 1–5m (exact boundary)
        180,  // 1–5m
        300,  // 1–5m (exact boundary)
        301,  // Over 5m
      ];
      const bins = computeHistogramBins(durations);
      expect(bins.totalCount).toBe(5);
      expect(bins.under1m.count).toBe(1); // 59
      expect(bins.bin1to5m.count).toBe(3); // 60, 180, 300
      expect(bins.over5m.count).toBe(1); // 301
    });

    it("Nonpositive durations (<= 0) are quarantined", () => {
      const durations = [-5, 0, 10, 20];
      const bins = computeHistogramBins(durations);
      expect(bins.quarantinedCount).toBe(2);
      expect(bins.totalCount).toBe(2);
      expect(bins.under1m.count).toBe(2);
    });
  });

  describe("Threshold Partition & Overlap Distinction (§6.3, §11)", () => {
    it("Distinguishes summed segment-seconds from union duration when segments overlap", () => {
      const overlappingSegments = [
        { startMs: 0, endMs: 400_000, seconds: 400 }, // > 300s
        { startMs: 100_000, endMs: 500_000, seconds: 400 }, // > 300s, overlaps with first
      ];

      const res = computeThresholdPartition(overlappingSegments, 300);
      expect(res.totalSegments).toBe(2);
      expect(res.segmentsOver).toBe(2);
      expect(res.summedSecondsTotal).toBe(800);
      expect(res.summedSecondsOver).toBe(800);
      // Union duration is 500s, not 800s!
      expect(res.unionSecondsTotal).toBe(500);
      expect(res.unionSecondsOver).toBe(500);
      expect(res.isOverlapping).toBe(true);
    });
  });

  describe("Block Overlap (§6.4, §11)", () => {
    it("Computes app overlap as union(A) intersect union(B) with pauses excluded", () => {
      // Block active intervals (excluding pause from 10:30-10:45)
      const blockActive = [
        { startMs: 1000, endMs: 2000 },
        { startMs: 3000, endMs: 4000 },
      ];
      // App activity: spans across pause (1500 to 3500)
      const appActivity = [
        { startMs: 1500, endMs: 3500 },
      ];

      // Overlap with [1000, 2000] is [1500, 2000] (500ms)
      // Overlap with [3000, 4000] is [3000, 3500] (500ms)
      // Total overlap = 1000ms = 1s
      const overlapSec = computeBlockOverlapSeconds(appActivity, blockActive);
      expect(overlapSec).toBe(1);
    });
  });

  describe("Exact Audit Reference Check from demo-sessions.json (§10)", () => {
    const sessions = (demoSessions as any).sessions;

    it("Reproduces Instagram audit values down to the exact second", () => {
      const ig = sessions.filter((s: any) => s.label === "instagram.com");
      const durations = ig.map((s: any) => s.seconds);

      expect(durations.length).toBe(151);
      expect(durations.reduce((a: number, b: number) => a + b, 0)).toBe(6792);
      expect(calculateMedianSeconds(durations)).toBe(14);
      expect(calculateNearestRankPercentile(durations, 0.8)).toBe(55);

      const bins = computeHistogramBins(durations);
      expect(bins.under1m.count).toBe(121);
      expect(bins.under1m.sumSeconds).toBe(1932);
      expect(bins.over5m.count).toBe(3);
      expect(bins.over5m.sumSeconds).toBe(1807);
    });

    it("Reproduces YouTube audit values down to the exact second", () => {
      const yt = sessions.filter((s: any) => s.label === "youtube.com");
      const durations = yt.map((s: any) => s.seconds);

      expect(durations.length).toBe(273);
      expect(durations.reduce((a: number, b: number) => a + b, 0)).toBe(21830);
      expect(calculateMedianSeconds(durations)).toBe(18);
      expect(calculateNearestRankPercentile(durations, 0.8)).toBe(94);

      const bins = computeHistogramBins(durations);
      expect(bins.under1m.count).toBe(190);
      expect(bins.under1m.sumSeconds).toBe(2891);
      expect(bins.over5m.count).toBe(21);
      expect(bins.over5m.sumSeconds).toBe(11437);

      // Verify time share over 300s: 11437 / 21830 = 52.39%
      const share = 11437 / 21830;
      expect(Math.round(share * 10000) / 100).toBe(52.39);
    });
  });
});
