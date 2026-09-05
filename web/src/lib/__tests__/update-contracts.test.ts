/**
 * Verification Test Suite for update.md
 * Authority: update.md (Version 1.2 · 2026-09-06 Amendment to TIMEFRAME-UI-REDESIGN.md)
 */

import { describe, it, expect } from "vitest";
import {
  computeIntervalUnionSeconds,
  computeIntervalIntersectionSeconds,
  computeMedianSegmentSeconds,
  computeNearestRankPercentile,
  computeConvenienceBins,
  partitionByThreshold,
} from "../stat-utils";
import {
  METRIC_REGISTRY,
  METRIC_IDS,
  getMetricDefinition,
  resolveMetricFacts,
  InsightFact,
} from "../metric-registry";
import {
  computeEffectiveSessions,
  computeUnwantedUnionSeconds,
  computeAppraisalSummary,
  UserAppraisal,
  CorrectionEvent,
  ClassificationRule,
} from "../corrections";
import { FocusBlock } from "../focus-blocks";
import { EnrichedSession } from "../types";
import { computeAppLensData, getAppLensThresholdPartition } from "../app-lens";
import { runPeriodAnalysis } from "../analyzer-engine";
import { TIMEFRAME_UI_TOKENS } from "../constants";
import demoEnvelopeRaw from "../../../data/demo-sessions.json";

describe("update.md Section 6 & 11: Exact Mathematical and Statistical Contracts", () => {
  it("§6.1 & §11: Half-open intervals touching [0,10) and [10,20) total 20; overlapping [0,10) and [5,15) total 15", () => {
    // Touching intervals
    const touching = [
      { startMs: 0, endMs: 10_000 },
      { startMs: 10_000, endMs: 20_000 },
    ];
    expect(computeIntervalUnionSeconds(touching)).toBe(20);

    // Overlapping intervals
    const overlapping = [
      { startMs: 0, endMs: 10_000 },
      { startMs: 5_000, endMs: 15_000 },
    ];
    expect(computeIntervalUnionSeconds(overlapping)).toBe(15);

    // Duplicate IDs / identical intervals do not double-count
    const duplicates = [
      { startMs: 0, endMs: 10_000 },
      { startMs: 0, endMs: 10_000 },
    ];
    expect(computeIntervalUnionSeconds(duplicates)).toBe(10);
  });

  it("§6.2 & §11: Histogram bins partition [0,60), [60,300], and (300,inf) without gaps or double counts", () => {
    const bins = computeConvenienceBins([
      0,
      30,
      59.9,
      60,     // Exactly 60s -> lands in [60, 300] "1–5m"
      150,
      300,    // Exactly 300s -> lands in [60, 300] "1–5m"
      300.1,  // > 300s -> lands in (300, inf) "Over 5m"
      600,
    ]);

    expect(bins.under1m.count).toBe(3); // 0, 30, 59.9
    expect(bins.between1mAnd5m.count).toBe(3); // 60, 150, 300
    expect(bins.over5m.count).toBe(2); // 300.1, 600
    expect(bins.under1m.count + bins.between1mAnd5m.count + bins.over5m.count).toBe(8);
  });

  it("§6.2: Threshold <= t vs > t partitions segment counts and distinguishes summed seconds from union", () => {
    const slices = [
      { startMs: 0, endMs: 100_000, seconds: 100 },
      { startMs: 50_000, endMs: 400_000, seconds: 350 }, // Overlaps first slice
      { startMs: 500_000, endMs: 1_000_000, seconds: 500 },
    ];

    const partition = partitionByThreshold(slices, 300);

    // Count partition
    expect(partition.atOrBelowThreshold.count).toBe(1); // 100s
    expect(partition.overThreshold.count).toBe(2); // 350s, 500s
    expect(partition.totalCount).toBe(3);

    // Summed seconds vs union seconds
    expect(partition.summedSeconds).toBe(950); // 100 + 350 + 500
    expect(partition.unionSeconds).toBe(900);  // [0, 400] is 400s + [500, 1000] is 500s = 900s
    expect(partition.summedSeconds).not.toBe(partition.unionSeconds);

    // Over-threshold metrics
    expect(partition.overThreshold.summedSeconds).toBe(850);
    expect(partition.overThreshold.unionSeconds).toBe(850);
    expect(partition.overThreshold.shareOfSummedSeconds).toBeCloseTo(850 / 950, 4);
    expect(partition.overThreshold.shareOfUnionSeconds).toBeCloseTo(850 / 900, 4);
  });

  it("§6.2: Nearest-rank quantile Q(p) = d_sorted[ceil(p*N)] and even-N median convention", () => {
    // Odd N median
    expect(computeMedianSegmentSeconds([10, 20, 30])).toBe(20);

    // Even N median is arithmetic mean of central two
    expect(computeMedianSegmentSeconds([10, 20, 30, 40])).toBe(25);

    // Empty and singleton
    expect(computeMedianSegmentSeconds([])).toBe(0);
    expect(computeMedianSegmentSeconds([42])).toBe(42);

    // Nearest-rank percentile: N = 5, values = [10, 20, 30, 40, 50]
    // p = 0.8: ceil(0.8 * 5) = ceil(4) = 4 -> index 3 (0-based) -> 40
    expect(computeNearestRankPercentile([10, 20, 30, 40, 50], 0.8)).toBe(40);
    // p = 0.2: ceil(0.2 * 5) = 1 -> index 0 -> 10
    expect(computeNearestRankPercentile([10, 20, 30, 40, 50], 0.2)).toBe(10);
  });

  it("§6.4: Block overlap intersects app intervals with active block intervals and excludes pauses", () => {
    // App intervals: [0, 60_000) (60s)
    const appIntervals = [{ startMs: 0, endMs: 60_000 }];

    // Block has two active intervals separated by a pause: [10_000, 30_000) and [40_000, 70_000)
    // Active block total = 20s + 30s = 50s; pause is [30_000, 40_000) (10s)
    const blockActiveIntervals = [
      { startMs: 10_000, endMs: 30_000 },
      { startMs: 40_000, endMs: 70_000 },
    ];

    const overlap = computeIntervalIntersectionSeconds(appIntervals, blockActiveIntervals);
    // Overlap: [10_000, 30_000) = 20s, and [40_000, 60_000) = 20s. Total = 40s.
    expect(overlap).toBe(40);
  });
});

describe("update.md Section 7 & 11: User Appraisal Contracts", () => {
  const baseSession: EnrichedSession = {
    id: "sess-1",
    started_at_ms: 100_000,
    ended_at_ms: 300_000, // 200s
    duration_seconds: 200,
    label: "github.com",
    category: "work",
    device: "computer",
    source: "chrome",
    is_fenced: false,
  };

  it("§7 & §11: Appraisal changes interpretation but does not change category or union duration", () => {
    const appraisalEvent: CorrectionEvent = {
      id: "corr-app-1",
      operation: "appraisal",
      targetSessionId: "sess-1",
      appraisal: "unwanted",
      appraisalReason: "Should have been focusing on docs",
      createdAtUtc: new Date().toISOString(),
    };

    const slices = computeEffectiveSessions([baseSession], [appraisalEvent]);
    expect(slices.length).toBe(1);
    expect(slices[0].effectiveCategory).toBe("work"); // Unchanged!
    expect(slices[0].sliceSeconds).toBe(200);          // Unchanged!
    expect(slices[0].appraisal).toBe("unwanted");
    expect(slices[0].appraisalReason).toBe("Should have been focusing on docs");
    expect(slices[0].isAdjusted).toBe(false);          // Category not adjusted
    expect(slices[0].isReviewed).toBe(true);           // User reviewed
  });

  it("§7 & §11: Both Work+Unwanted and Sink+Intentional are valid states", () => {
    const workSession: EnrichedSession = { ...baseSession, id: "sess-work", category: "work" };
    const sinkSession: EnrichedSession = {
      ...baseSession,
      id: "sess-sink",
      label: "youtube.com",
      category: "sink",
      started_at_ms: 400_000,
      ended_at_ms: 700_000, // 300s
      duration_seconds: 300,
    };

    const corrections: CorrectionEvent[] = [
      { id: "c1", operation: "appraisal", targetSessionId: "sess-work", appraisal: "unwanted", createdAtUtc: "" },
      { id: "c2", operation: "appraisal", targetSessionId: "sess-sink", appraisal: "intentional", appraisalReason: "Chosen lunch break", createdAtUtc: "" },
    ];

    const slices = computeEffectiveSessions([workSession, sinkSession], corrections);
    const workSlice = slices.find((s) => s.originalSessionId === "sess-work")!;
    const sinkSlice = slices.find((s) => s.originalSessionId === "sess-sink")!;

    expect(workSlice.effectiveCategory).toBe("work");
    expect(workSlice.appraisal).toBe("unwanted");

    expect(sinkSlice.effectiveCategory).toBe("sink");
    expect(sinkSlice.appraisal).toBe("intentional");
    expect(sinkSlice.appraisalReason).toBe("Chosen lunch break");
  });

  it("§7: Conflicting overlapping appraisals across devices produce hasMixedCrossDeviceOverlap", () => {
    // Computer: [100_000, 200_000) marked intentional
    const compSlice: any = {
      id: "sl-comp",
      originalSessionId: "s-comp",
      device: "computer",
      sliceStartMs: 100_000,
      sliceEndMs: 200_000,
      sliceSeconds: 100,
      effectiveCategory: "work",
      isExcluded: false,
      appraisal: "intentional",
    };

    // Phone: [150_000, 250_000) marked unwanted
    const phoneSlice: any = {
      id: "sl-phone",
      originalSessionId: "s-phone",
      device: "phone",
      sliceStartMs: 150_000,
      sliceEndMs: 250_000,
      sliceSeconds: 100,
      effectiveCategory: "sink",
      isExcluded: false,
      appraisal: "unwanted",
    };

    const summary = computeAppraisalSummary([compSlice, phoneSlice]);
    expect(summary.hasMixedCrossDeviceOverlap).toBe(true);
    expect(summary.intentionalSeconds).toBe(100);
    expect(summary.unwantedSeconds).toBe(100);
  });
});

describe("update.md Section 4.1 & 9: Metric Registry Contracts", () => {
  it("§4.1: Registry defines all 9 required metrics with strictly enforced word bounds", () => {
    expect(METRIC_IDS).toHaveLength(9);

    for (const id of METRIC_IDS) {
      const def = getMetricDefinition(id);
      expect(def).toBeDefined();
      expect(def!.stableId).toBe(id);
      expect(def!.definitionVersion).toBe("1.2");

      // What it means: ideally under 25 words
      const meaningWords = def!.whatItMeans.trim().split(/\s+/).length;
      expect(meaningWords).toBeLessThan(25);

      // How we count it: ideally under 30 words
      const countingWords = def!.howWeCountIt.trim().split(/\s+/).length;
      expect(countingWords).toBeLessThan(30);

      // Accessible label
      expect(def!.accessibleLabel).toMatch(/^Explain /);
    }
  });

  it("§9: InsightFact and GuidedInsight types follow strict view contract", () => {
    const fact = resolveMetricFacts(
      "focus_time",
      {
        startUtc: "2026-09-02T04:00:00.000Z",
        endUtc: "2026-09-03T04:00:00.000Z",
        timezone: "Asia/Kolkata",
      },
      "Today · Work activity",
      14400,
      86400,
      "seconds",
      12,
      "effective",
      "rev-1"
    );

    expect(fact.id).toContain("fact-focus_time");
    expect(fact.definitionVersion).toBe("1.2");
    expect(fact.dataRevision).toBe("rev-1");
    expect(fact.unit).toBe("seconds");
    expect(fact.sampleCount).toBe(12);
    expect(fact.sampleUnit).toBe("recorded-segment");
    expect(fact.basis).toBe("effective");
    expect(fact.limitations.length).toBeGreaterThan(0);
    expect(fact.evidenceKey).toBeDefined();
  });
});

describe("update.md Section 10: Exact Audit Golden Reproduction on Demo Sessions", () => {
  it("reproduces the exact audited Instagram and YouTube figures from update.md §10", () => {
    const sessions = (demoEnvelopeRaw as any).sessions as EnrichedSession[];
    expect(sessions.length).toBe(1563);

    // Instagram audit
    const igLens = computeAppLensData("instagram.com", sessions);
    expect(igLens.segmentCount).toBe(151);
    expect(igLens.totalDurationSumSeconds).toBe(6792);
    expect(igLens.medianSegmentSeconds).toBe(14);
    expect(igLens.p80SegmentSeconds).toBe(55);
    expect(igLens.convenienceBins.under1m.count).toBe(121);
    expect(igLens.convenienceBins.under1m.seconds).toBe(1932);
    expect(igLens.convenienceBins.over5m.count).toBe(3);
    expect(igLens.convenienceBins.over5m.seconds).toBe(1807);

    // YouTube audit
    const ytLens = computeAppLensData("youtube.com", sessions);
    expect(ytLens.segmentCount).toBe(273);
    expect(ytLens.totalDurationSumSeconds).toBe(21830);
    expect(ytLens.medianSegmentSeconds).toBe(18);
    expect(ytLens.p80SegmentSeconds).toBe(94);
    expect(ytLens.convenienceBins.under1m.count).toBe(190);
    expect(ytLens.convenienceBins.under1m.seconds).toBe(2891);
    expect(ytLens.convenienceBins.over5m.count).toBe(21);
    expect(ytLens.convenienceBins.over5m.seconds).toBe(11437);

    // 52.39% calculation verified
    const ytShareOver5m = (ytLens.convenienceBins.over5m.seconds / ytLens.totalDurationSumSeconds) * 100;
    expect(ytShareOver5m).toBeCloseTo(52.39, 2);
  });
});

describe("update.md Section 2 & 3.5: Analyzer Findings 3 Layers and Categories", () => {
  const sessions = (demoEnvelopeRaw as any).sessions as EnrichedSession[];

  it("generates findings with 3 layers (Observed, Meaning, Action) and dynamic categories", () => {
    const resultWithIntention = runPeriodAnalysis({
      query: {
        rangeType: "7d",
        startDate: "2026-08-27",
        endDate: "2026-09-02",
        compareWith: "previous_period",
        filterKind: "all",
        filterValues: [],
        userIntention: "Limit social media during workday",
      },
      rawSessions: sessions,
      corrections: [],
    });

    expect(resultWithIntention.findings.length).toBeGreaterThanOrEqual(1);

    for (const f of resultWithIntention.findings) {
      // 3 layers exist
      expect(f.observed).toBeDefined();
      expect(f.observed.length).toBeGreaterThan(0);
      expect(f.meaning).toBeDefined();
      expect(f.meaning.length).toBeGreaterThan(0);
      expect(f.action).toBeDefined();
      expect(f.action!.label).toBeDefined();

      // Kinds with intention: aligned-plan, worth-reviewing, try-compare
      expect(["aligned-plan", "worth-reviewing", "try-compare"]).toContain(f.kind);
    }

    // Progress series contains planned vs recorded and recorded change capability
    const focusSeries = resultWithIntention.progressSeries.find((s) => s.metricKey === "focus_time");
    expect(focusSeries).toBeDefined();
    expect(focusSeries!.averageValue).toBeGreaterThan(0);
  });

  it("uses What happened and Patterns to inspect when no user intention exists", () => {
    const resultWithoutIntention = runPeriodAnalysis({
      query: {
        rangeType: "7d",
        startDate: "2026-08-27",
        endDate: "2026-09-02",
        compareWith: "none",
        filterKind: "all",
        filterValues: [],
        userIntention: "",
      },
      rawSessions: sessions,
      corrections: [],
    });

    const kinds = resultWithoutIntention.findings.map((f) => f.kind);
    expect(kinds).toContain("what-happened");
  });
});

describe("update.md Section 4.2: Timeframe UI Approved Tokens", () => {
  it("defines graphite-and-amber theme tokens exactly as specified", () => {
    expect(TIMEFRAME_UI_TOKENS.background).toBe("#171819");
    expect(TIMEFRAME_UI_TOKENS.card).toBe("#202122");
    expect(TIMEFRAME_UI_TOKENS.text).toBe("#ECECE7");
    expect(TIMEFRAME_UI_TOKENS.textSecondary).toBe("#C1C5C1");
    expect(TIMEFRAME_UI_TOKENS.muted).toBe("#A1A9A5");
    expect(TIMEFRAME_UI_TOKENS.amberFocus).toBe("#DDB66D");
    expect(TIMEFRAME_UI_TOKENS.coralSink).toBe("#DFA095");
    expect(TIMEFRAME_UI_TOKENS.border).toBe("#3A3D3E");
    expect(TIMEFRAME_UI_TOKENS.outlineStrong).toBe("#737978");
  });
});
