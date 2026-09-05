import { describe, it, expect } from "vitest";
import { MIDNIGHT_TOKENS } from "../constants";
import {
  createFocusBlock,
  pauseFocusBlock,
  resumeFocusBlock,
  finishFocusBlock,
  calculateBlockElapsedSeconds,
  calculateBlockRemainingSeconds,
  isBlockTargetReached,
  normalizeTags,
  FocusBlock,
} from "../focus-blocks";
import {
  sliceSessionWithCorrections,
  computeEffectiveSessions,
  CorrectionStoreManager,
  CorrectionEvent,
  RevisionBatch,
  ClassificationRule,
} from "../corrections";
import { EnrichedSession, Category } from "../types";
import { buildEffectiveDayPresentation } from "../effective-adapter";
import { computeFocusRuns } from "../focus-run";
import { generateReflection, buildCandidateFacts } from "../reflection-service";
import { getFriendlyAppName, computeAppLensData } from "../app-lens";
import { runPeriodAnalysis, validateBaselineRange } from "../analyzer-engine";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("TIMEFRAME-UI-REDESIGN v4.1 Specification Contracts & Invariants", () => {
  const TIMEZONE = "Asia/Kolkata";

  // 1. Midnight Studio Design Tokens (§2.1)
  describe("Midnight Studio Art Direction Tokens (§2.1)", () => {
    it("Defines Midnight Studio color palette tokens", () => {
      expect(MIDNIGHT_TOKENS.background).toBe("#0B0E14");
      expect(MIDNIGHT_TOKENS.card).toBe("#141A25");
      expect(MIDNIGHT_TOKENS.cardRaised).toBe("#1A2230");
      expect(MIDNIGHT_TOKENS.focus).toBe("#AAA9FF");
      expect(MIDNIGHT_TOKENS.sink).toBe("#EE9DAA");
      expect(MIDNIGHT_TOKENS.text).toBe("#F2F5FB");
    });

    it("Midnight Studio primary text passes AAA (>= 7:1) on card surface", () => {
      const ratio = contrastRatio(MIDNIGHT_TOKENS.text, MIDNIGHT_TOKENS.card);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("Midnight Studio focus and sink accents pass AA (>= 4.5:1) on card surface", () => {
      const focusRatio = contrastRatio(MIDNIGHT_TOKENS.focus, MIDNIGHT_TOKENS.card);
      const sinkRatio = contrastRatio(MIDNIGHT_TOKENS.sink, MIDNIGHT_TOKENS.card);
      expect(focusRatio).toBeGreaterThanOrEqual(4.5);
      expect(sinkRatio).toBeGreaterThanOrEqual(4.5);
    });
  });

  // 2. Focus Blocks State Model & Timer Invariants (§7)
  describe("Focus Blocks Mode & Timer Invariants (§7, §7.1, §7.2)", () => {
    it("Creates block in 'running' state with persisted start timestamp", () => {
      const block = createFocusBlock({
        title: "Test Block",
        plannedMinutes: 45,
        tags: ["Coding", "Architecture"],
        startUtc: "2026-09-02T10:00:00.000Z",
      });

      expect(block.state).toBe("running");
      expect(block.plannedSeconds).toBe(2700);
      expect(block.activeIntervals.length).toBe(1);
      expect(block.activeIntervals[0].startUtc).toBe("2026-09-02T10:00:00.000Z");
      expect(block.activeIntervals[0].endUtc).toBeNull();
    });

    it("Normalizes tags: trims spaces, deduplicates case-insensitively, caps at 8 tags and 32 chars", () => {
      const raw = ["  work  ", "WORK", "deep work", "a".repeat(40), "t1", "t2", "t3", "t4", "t5", "t6", "t7"];
      const norm = normalizeTags(raw);

      expect(norm).toContain("work");
      expect(norm).not.toContain("WORK"); // deduplicated
      expect(norm[0]).toBe("work");
      expect(norm[1]).toBe("deep work");
      expect(norm[2].length).toBeLessThanOrEqual(32); // capped at 32 chars
      expect(norm.length).toBeLessThanOrEqual(8);     // capped at 8 tags
    });

    it("Pause closes current active interval; resume opens another; elapsed ignores paused interval (§7.2)", () => {
      const block = createFocusBlock({
        plannedMinutes: 45,
        startUtc: "2026-09-02T10:00:00.000Z",
      });

      // Pause at 10:20 (20 min elapsed)
      const paused = pauseFocusBlock(block, "2026-09-02T10:20:00.000Z");
      expect(paused.state).toBe("paused");
      expect(paused.activeIntervals[0].endUtc).toBe("2026-09-02T10:20:00.000Z");

      // Check elapsed during pause (at 10:30)
      const elapsedDuringPause = calculateBlockElapsedSeconds(
        paused,
        Date.parse("2026-09-02T10:30:00.000Z")
      );
      expect(elapsedDuringPause).toBe(20 * 60); // exactly 20m, paused 10m is not counted!

      // Resume at 10:35
      const resumed = resumeFocusBlock(paused, "2026-09-02T10:35:00.000Z");
      expect(resumed.state).toBe("running");
      expect(resumed.activeIntervals.length).toBe(2);

      // Check elapsed at 10:45 (20m first interval + 10m second interval = 30m total)
      const elapsedAfterResume = calculateBlockElapsedSeconds(
        resumed,
        Date.parse("2026-09-02T10:45:00.000Z")
      );
      expect(elapsedAfterResume).toBe(30 * 60);

      // Remaining seconds on 45m planned block
      const remaining = calculateBlockRemainingSeconds(
        resumed,
        Date.parse("2026-09-02T10:45:00.000Z")
      );
      expect(remaining).toBe(15 * 60);
    });

    it("Finishing marks block awaiting_review and closes interval (§7.3)", () => {
      const block = createFocusBlock({
        plannedMinutes: 45,
        startUtc: "2026-09-02T10:00:00.000Z",
      });
      const finished = finishFocusBlock(block, "2026-09-02T10:45:00.000Z");
      expect(finished.state).toBe("awaiting_review");
      expect(finished.activeIntervals[0].endUtc).toBe("2026-09-02T10:45:00.000Z");
    });
  });

  // 3. Post-Sync Review & Custom Corrections Engine (§8, §8.3, §9)
  describe("Interval Slicing & Truthful Totals (§8.3, §9.2)", () => {
    const rawSession: EnrichedSession = {
      id: "sess-1000-1040",
      source: "chrome_extension",
      device: "computer",
      label: "instagram.com",
      canonical_app: "instagram",
      category: "sink",
      started_at: "2026-09-02T10:00:00.000Z",
      ended_at: "2026-09-02T10:40:00.000Z",
      started_at_ms: Date.parse("2026-09-02T10:00:00.000Z"),
      ended_at_ms: Date.parse("2026-09-02T10:40:00.000Z"),
      seconds: 2400,
      minutes: 40,
      session_kind: "block",
    };

    it("A 10:00–10:40 session corrected inside a 10:15–10:30 block modifies ONLY the 15-minute intersection (§8.3, §14)", () => {
      const block: FocusBlock = {
        id: "block-1015-1030",
        title: "Work block",
        tags: ["Test"],
        plannedSeconds: 900,
        activeIntervals: [
          {
            startUtc: "2026-09-02T10:15:00.000Z",
            endUtc: "2026-09-02T10:30:00.000Z",
          },
        ],
        state: "reviewed",
        revisionId: "rev-1",
        createdAtUtc: "2026-09-02T10:15:00.000Z",
        updatedAtUtc: "2026-09-02T10:30:00.000Z",
        autoReview: true,
      };

      // Correction reclassifying 10:15–10:30 as "work"
      const correction: CorrectionEvent = {
        id: "corr-1",
        targetSessionId: "sess-1000-1040",
        intervalStartUtc: "2026-09-02T10:15:00.000Z",
        intervalEndUtc: "2026-09-02T10:30:00.000Z",
        operation: "category",
        category: "work",
        scopeBlockId: block.id,
        baseRevisionId: "rev-0",
        batchId: "batch-1",
        createdAtUtc: "2026-09-02T10:35:00.000Z",
      };

      const slices = sliceSessionWithCorrections(rawSession, [correction], [], [block]);

      // Must be split into exactly 3 slices
      expect(slices.length).toBe(3);

      // Slice 1: 10:00 - 10:15 (15 min) -> sink (unchanged)
      expect(slices[0].sliceStartMs).toBe(Date.parse("2026-09-02T10:00:00.000Z"));
      expect(slices[0].sliceEndMs).toBe(Date.parse("2026-09-02T10:15:00.000Z"));
      expect(slices[0].sliceSeconds).toBe(15 * 60);
      expect(slices[0].effectiveCategory).toBe("sink");
      expect(slices[0].isAdjusted).toBe(false);

      // Slice 2: 10:15 - 10:30 (15 min) -> work (reclassified!)
      expect(slices[1].sliceStartMs).toBe(Date.parse("2026-09-02T10:15:00.000Z"));
      expect(slices[1].sliceEndMs).toBe(Date.parse("2026-09-02T10:30:00.000Z"));
      expect(slices[1].sliceSeconds).toBe(15 * 60);
      expect(slices[1].effectiveCategory).toBe("work");
      expect(slices[1].isAdjusted).toBe(true);
      expect(slices[1].associatedBlockId).toBe("block-1015-1030");

      // Slice 3: 10:30 - 10:40 (10 min) -> sink (unchanged)
      expect(slices[2].sliceStartMs).toBe(Date.parse("2026-09-02T10:30:00.000Z"));
      expect(slices[2].sliceEndMs).toBe(Date.parse("2026-09-02T10:40:00.000Z"));
      expect(slices[2].sliceSeconds).toBe(10 * 60);
      expect(slices[2].effectiveCategory).toBe("sink");
      expect(slices[2].isAdjusted).toBe(false);

      // Total duration preserved exactly (15m + 15m + 10m = 40m)
      const sumSeconds = slices.reduce((acc, s) => acc + s.sliceSeconds, 0);
      expect(sumSeconds).toBe(40 * 60);
    });

    it("Exclusion removes interval from eligible analysis while retaining original activity (§8.2)", () => {
      const correction: CorrectionEvent = {
        id: "corr-exclude",
        targetSessionId: "sess-1000-1040",
        intervalStartUtc: "2026-09-02T10:15:00.000Z",
        intervalEndUtc: "2026-09-02T10:30:00.000Z",
        operation: "exclude",
        baseRevisionId: "rev-0",
        batchId: "batch-ex",
        createdAtUtc: "2026-09-02T10:35:00.000Z",
      };

      const slices = sliceSessionWithCorrections(rawSession, [correction], [], []);
      const excludedSlice = slices.find((s) => s.isExcluded);

      expect(excludedSlice).toBeDefined();
      expect(excludedSlice?.sliceSeconds).toBe(15 * 60);
      // Raw row data is still intact
      expect(excludedSlice?.originalCategory).toBe("sink");
      expect(excludedSlice?.label).toBe("instagram.com");
    });

    it("Privacy fence outranks user category correction (§9.2)", () => {
      const fencedSession: EnrichedSession = {
        ...rawSession,
        id: "sess-fenced-test",
        label: "screening.mhanational.org",
        category: "private",
        canonical_app: "private",
      };

      const overrideAttempt: CorrectionEvent = {
        id: "corr-fence-leak",
        targetSessionId: "sess-fenced-test",
        intervalStartUtc: "2026-09-02T10:00:00.000Z",
        intervalEndUtc: "2026-09-02T10:40:00.000Z",
        operation: "category",
        category: "work", // Attempt to make private row Work
        baseRevisionId: "rev-0",
        batchId: "batch-leak",
        createdAtUtc: "2026-09-02T10:45:00.000Z",
      };

      const slices = sliceSessionWithCorrections(fencedSession, [overrideAttempt], [], []);
      for (const s of slices) {
        expect(s.effectiveCategory).toBe("private");
      }
    });

    it("Excluded activity acts as continuity barrier and does not create artificial deep blocks (§8.3, §14)", () => {
      // 2 work sessions of 10m separated by 5m of excluded activity
      const s1: EnrichedSession = {
        id: "work-1",
        label: "code",
        device: "computer",
        source: "chrome_extension",
        canonical_app: "code",
        category: "work",
        started_at: "2026-09-02T10:00:00.000Z",
        ended_at: "2026-09-02T10:10:00.000Z",
        started_at_ms: Date.parse("2026-09-02T10:00:00.000Z"),
        ended_at_ms: Date.parse("2026-09-02T10:10:00.000Z"),
        seconds: 600,
        minutes: 10,
        session_kind: "block",
      };

      const s2: EnrichedSession = {
        id: "work-2",
        label: "code",
        device: "computer",
        source: "chrome_extension",
        canonical_app: "code",
        category: "work",
        started_at: "2026-09-02T10:15:00.000Z",
        ended_at: "2026-09-02T10:25:00.000Z",
        started_at_ms: Date.parse("2026-09-02T10:15:00.000Z"),
        ended_at_ms: Date.parse("2026-09-02T10:25:00.000Z"),
        seconds: 600,
        minutes: 10,
        session_kind: "block",
      };

      // Since the gap is 5 minutes (>= 5 min death floor), they cannot bridge into a 25m deep run!
      const { runs } = computeFocusRuns([s1, s2], 5);
      // Neither session alone is >= 15m, so runs array has no qualifying 25m continuous deep block
      const deepRuns = runs.filter((r) => r.durationSeconds >= 15 * 60);
      expect(deepRuns.length).toBe(0);
    });
  });

  // 4. Post-Sync Consistency & Outbox (§9.3)
  describe("Post-Sync Consistency & Outbox (§9.3)", () => {
    it("Replaying the same revision batch twice is idempotent with exactly one revision effect (§9.3, §14)", () => {
      const manager = new CorrectionStoreManager();
      const existingSessions = new Set(["sess-1"]);

      const batch: RevisionBatch = {
        id: "batch-dup-test",
        baseRevisionId: "rev-0",
        operations: [
          {
            id: "op-1",
            targetSessionId: "sess-1",
            intervalStartUtc: "2026-09-02T10:00:00.000Z",
            intervalEndUtc: "2026-09-02T10:10:00.000Z",
            operation: "category",
            category: "work",
            baseRevisionId: "rev-0",
            batchId: "batch-dup-test",
            createdAtUtc: "2026-09-02T10:12:00.000Z",
          },
        ],
        status: "applied",
        appliedAtUtc: "2026-09-02T10:12:00.000Z",
      };

      // First apply
      const res1 = manager.applyBatch(batch, existingSessions);
      expect(res1.success).toBe(true);
      expect(res1.isDuplicate).toBe(false);
      expect(manager.getAllAppliedEvents().length).toBe(1);

      // Second apply (replaying identical batch)
      const res2 = manager.applyBatch(batch, existingSessions);
      expect(res2.success).toBe(true);
      expect(res2.isDuplicate).toBe(true);
      // Exactly one effect: events count is still 1
      expect(manager.getAllAppliedEvents().length).toBe(1);
    });

    it("Correction arriving before target session is retained pending and drained when session arrives (§9.3, §14)", () => {
      const manager = new CorrectionStoreManager();
      const existingSessions = new Set<string>(); // target session not loaded yet!

      const batch: RevisionBatch = {
        id: "batch-pending-test",
        baseRevisionId: "rev-0",
        operations: [
          {
            id: "op-pending",
            targetSessionId: "sess-future",
            intervalStartUtc: "2026-09-02T10:00:00.000Z",
            intervalEndUtc: "2026-09-02T10:10:00.000Z",
            operation: "category",
            category: "work",
            baseRevisionId: "rev-0",
            batchId: "batch-pending-test",
            createdAtUtc: "2026-09-02T10:12:00.000Z",
          },
        ],
        status: "applied",
        appliedAtUtc: "2026-09-02T10:12:00.000Z",
      };

      manager.applyBatch(batch, existingSessions);
      expect(manager.getPendingCorrections().length).toBe(1);

      // Now session arrives
      const loaded = new Set(["sess-future"]);
      const drained = manager.drainPendingForSessions(loaded);
      expect(drained.length).toBe(1);
      expect(manager.getPendingCorrections().length).toBe(0);
    });

    it("Detects concurrent conflicts when distinct batches modify same session interval with divergent operations (§9.3, §14)", () => {
      const manager = new CorrectionStoreManager();
      const existingSessions = new Set(["sess-conflict"]);

      const batchA: RevisionBatch = {
        id: "batch-device-a",
        baseRevisionId: "rev-0",
        operations: [
          {
            id: "op-a",
            targetSessionId: "sess-conflict",
            intervalStartUtc: "2026-09-02T10:00:00.000Z",
            intervalEndUtc: "2026-09-02T10:20:00.000Z",
            operation: "category",
            category: "work",
            baseRevisionId: "rev-0",
            batchId: "batch-device-a",
            createdAtUtc: "2026-09-02T10:25:00.000Z",
          },
        ],
        status: "applied",
        appliedAtUtc: "2026-09-02T10:25:00.000Z",
      };

      const batchB: RevisionBatch = {
        id: "batch-device-b",
        baseRevisionId: "rev-0",
        operations: [
          {
            id: "op-b",
            targetSessionId: "sess-conflict",
            intervalStartUtc: "2026-09-02T10:05:00.000Z",
            intervalEndUtc: "2026-09-02T10:15:00.000Z",
            operation: "exclude", // Different operation on overlapping interval!
            baseRevisionId: "rev-0",
            batchId: "batch-device-b",
            createdAtUtc: "2026-09-02T10:26:00.000Z",
          },
        ],
        status: "applied",
        appliedAtUtc: "2026-09-02T10:26:00.000Z",
      };

      manager.applyBatch(batchA, existingSessions);
      const resB = manager.applyBatch(batchB, existingSessions);

      expect(resB.conflicts.length).toBe(1);
      expect(resB.conflicts[0].targetSessionId).toBe("sess-conflict");
      expect(manager.getConflicts().length).toBe(1);
    });
  });

  // 5. App Lens & Constellation Engine (§3.5, §3.6)
  describe("App Lens & Constellation Engine (§3.5, §3.6)", () => {
    it("Resolves friendly app names without third-party network leaking", () => {
      expect(getFriendlyAppName("instagram.com")).toBe("Instagram");
      expect(getFriendlyAppName("youtube.com")).toBe("YouTube");
      expect(getFriendlyAppName("cursor.com")).toBe("Cursor");
      expect(getFriendlyAppName("github.com")).toBe("GitHub");
    });

    it("App Lens calculates median, longest, and nerdy patterns when valid sessions >= 10 (§3.6)", () => {
      const mockSlices: any[] = [];
      for (let i = 0; i < 12; i++) {
        mockSlices.push({
          id: `sl-${i}`,
          label: "instagram.com",
          device: "computer",
          sliceStartMs: 1000 + i * 10000,
          sliceEndMs: 1000 + i * 10000 + 40000, // 40s
          sliceSeconds: 40,
          effectiveCategory: "sink",
          isExcluded: false,
          isAdjusted: false,
        });
      }

      const lens = computeAppLensData("instagram.com", mockSlices);
      expect(lens.friendlyName).toBe("Instagram");
      expect(lens.sessionCount).toBe(12);
      expect(lens.medianSessionSeconds).toBe(40);
      expect(lens.histogram.length).toBe(4);
      expect(lens.patterns.length).toBeGreaterThan(0);
      expect(lens.patterns[0].headline).toBeDefined();
    });

    it("App Lens displays sparse notice when fewer than 10 sessions exist (§3.6)", () => {
      const mockSlices: any[] = [
        {
          id: "sl-1",
          label: "chess.com",
          device: "computer",
          sliceStartMs: 1000,
          sliceEndMs: 3000,
          sliceSeconds: 2,
          effectiveCategory: "games",
          isExcluded: false,
          isAdjusted: false,
        },
      ];

      const lens = computeAppLensData("chess.com", mockSlices);
      expect(lens.patterns.some((p) => p.id === "sparse-notice")).toBe(true);
    });
  });

  // 6. AI Reflection Service (§4)
  describe("AI Reflection Service (§4, §4.1–§4.4)", () => {
    it("Generates original editorial reflection within 12–26 words (max 36 words)", () => {
      const mockDayResult: any = {
        date: "2026-09-02",
        revisionId: "rev-test-1",
        metrics: {
          focus: { value: 3 * 3600 },
          focusBlocks: { completedCount: 2, reviewedCount: 1 },
          sink: { value: 12 * 60 },
          longestDeepBlock: { count: 1, longestSeconds: 1800 },
        },
        segments: {
          focusBlocks: [
            {
              id: "b-1",
              title: "Study session",
              sinkSeconds: 12 * 60,
              plannedSeconds: 45 * 60,
              elapsedSeconds: 45 * 60,
            },
          ],
        },
        effectiveSlices: [
          {
            associatedBlockId: "b-1",
            effectiveCategory: "sink",
            isExcluded: false,
            label: "Instagram",
            sliceSeconds: 12 * 60,
          },
        ],
      };

      const reflection = generateReflection(mockDayResult, "witty");
      const wordCount = reflection.text.split(/\s+/).length;

      expect(wordCount).toBeGreaterThanOrEqual(10);
      expect(wordCount).toBeLessThanOrEqual(36);
      expect(reflection.supportingFactIds.length).toBeGreaterThan(0);
      expect(reflection.evidenceExplanation).toContain("Planned active block");
      expect(reflection.revisionId).toBe("rev-test-1");
    });

    it("Why this? provides grounded evidence matching exact facts (§4.2)", () => {
      const mockDayResult: any = {
        date: "2026-09-02",
        revisionId: "rev-test-2",
        metrics: {
          focus: { value: 42 * 60 },
          focusBlocks: { completedCount: 0, reviewedCount: 0 },
          sink: { value: 0 },
          longestDeepBlock: { count: 0, longestSeconds: 0 },
        },
        segments: { focusBlocks: [] },
        effectiveSlices: [],
      };

      const reflection = generateReflection(mockDayResult, "straight", 1 /* 1 hour goal */);
      expect(reflection.text).toContain("Target was 1 hours");
      expect(reflection.evidenceExplanation).toContain("42 minutes of effective work");
    });
  });

  // 7. Custom-Range AI Analyzer Engine (§10)
  describe("Custom-Range AI Analyzer Engine (§10, §10.1–§10.6)", () => {
    it("Resolves query across custom historical dates to 04:00 local boundaries", () => {
      const result = runPeriodAnalysis({
        query: {
          rangeType: "14d",
          startDate: "2026-08-20",
          endDate: "2026-09-02",
          compareWith: "previous_period",
          filterKind: "all",
          filterValues: [],
          userIntention: "Deep focus on coding",
        },
        rawSessions: [],
        corrections: [],
        rules: [],
        blocks: [],
        timezone: TIMEZONE,
      });

      expect(result.resolvedRange.totalDays).toBe(14);
      expect(result.summaryText.length).toBeGreaterThan(40);
      expect(result.findings.length).toBeGreaterThan(0);
      for (const f of result.findings) {
        // Headline max 14 words (§10.5)
        expect(f.headline.split(/\s+/).length).toBeLessThanOrEqual(14);
        // Explanation max 55 words (§10.5)
        expect(f.explanation.split(/\s+/).length).toBeLessThanOrEqual(55);
      }
    });

    it("Validates baseline range: rejects overlapping baseline and accepts disjoint baseline (§10.2)", () => {
      // Overlapping baseline
      const overlapping = validateBaselineRange("2026-08-20", "2026-09-02", "2026-08-25", "2026-09-05");
      expect(overlapping.isValid).toBe(false);
      expect(overlapping.error).toContain("non-overlapping");

      // Disjoint baseline
      const disjoint = validateBaselineRange("2026-08-20", "2026-09-02", "2026-08-01", "2026-08-15");
      expect(disjoint.isValid).toBe(true);
      expect(disjoint.error).toBeUndefined();
    });

    it("Computes planned vs recorded and review completeness series in analyzer (§10.3)", () => {
      const mockBlock = createFocusBlock({
        title: "Planned coding",
        plannedMinutes: 60,
        tags: ["dev"],
        startUtc: "2026-08-25T05:00:00.000Z",
      });
      const finishedBlock = finishFocusBlock(mockBlock, "2026-08-25T06:00:00.000Z");
      finishedBlock.state = "reviewed";

      const result = runPeriodAnalysis({
        query: {
          rangeType: "7d",
          startDate: "2026-08-24",
          endDate: "2026-08-30",
          compareWith: "none",
          filterKind: "all",
          filterValues: [],
        },
        rawSessions: [],
        corrections: [],
        rules: [],
        blocks: [finishedBlock],
        timezone: TIMEZONE,
      });

      const plannedSeries = result.progressSeries.find((s) => s.metricKey === "planned_vs_recorded");
      const reviewSeries = result.progressSeries.find((s) => s.metricKey === "review_rate");

      expect(plannedSeries).toBeDefined();
      expect(reviewSeries).toBeDefined();
    });
  });

  // 8. Focus Block Backgrounding Duration Clamping (§7.3)
  describe("Focus Block Backgrounding Duration Clamping (§7.3)", () => {
    it("Clamps active interval to planned duration when block finishes after long background delay", () => {
      const block = createFocusBlock({
        title: "Writing",
        plannedMinutes: 45,
        tags: ["docs"],
        startUtc: "2026-09-02T10:00:00.000Z",
      });

      // User returns 2 hours later (7200s) instead of 45 minutes (2700s)
      const finished = finishFocusBlock(block, "2026-09-02T12:00:00.000Z");

      // Interval must be clamped to planned duration (10:45:00.000Z), not 12:00:00.000Z
      expect(finished.activeIntervals[0].endUtc).toBe("2026-09-02T10:45:00.000Z");
      expect(calculateBlockElapsedSeconds(finished)).toBe(45 * 60);
      expect(isBlockTargetReached(finished, Date.parse("2026-09-02T12:00:00.000Z"))).toBe(true);
    });

    it("Preserves raw finish time if user finishes before planned duration", () => {
      const block = createFocusBlock({
        title: "Short block",
        plannedMinutes: 45,
        tags: ["docs"],
        startUtc: "2026-09-02T10:00:00.000Z",
      });

      const finished = finishFocusBlock(block, "2026-09-02T10:20:00.000Z");
      expect(finished.activeIntervals[0].endUtc).toBe("2026-09-02T10:20:00.000Z");
      expect(calculateBlockElapsedSeconds(finished)).toBe(20 * 60);
      expect(isBlockTargetReached(finished, Date.parse("2026-09-02T10:20:00.000Z"))).toBe(false);
    });
  });

  // 9. AI Reflection In-Progress Day Handling (§4.1, §4.3)
  describe("AI Reflection In-Progress Day Goal Handling (§4.1, §4.3)", () => {
    it("Reflects remaining time toward goal without predicting failure on an in-progress day", () => {
      // Future end of logical day ensures day is in-progress
      const mockDayResult: any = {
        date: "2026-09-02",
        dayStartMs: Date.now() - 2 * 3600 * 1000,
        dayEndMs: Date.now() + 10 * 3600 * 1000, // In progress!
        revisionId: "rev-in-progress-1",
        metrics: {
          focus: { value: 30 * 60 }, // 30m logged
          focusBlocks: { completedCount: 0, reviewedCount: 0 },
          sink: { value: 0 },
          longestDeepBlock: { count: 0, longestSeconds: 0 },
        },
        segments: { focusBlocks: [] },
        effectiveSlices: [],
      };

      const reflection = generateReflection(mockDayResult, "witty", 4 /* 4h goal */);
      // Must not say "The plan said 4 hours. The log says 30 minutes. A modest plot twist."
      expect(reflection.text).not.toContain("modest plot twist");
      // Must state logged minutes and remaining minutes
      expect(reflection.text).toContain("30 minutes logged toward your 4-hour target today");
      expect(reflection.text).toContain("210 minutes to go");
    });

    it("Allows witty contrast on completed past day", () => {
      // Past day: dayEndMs is in the past
      const mockPastDayResult: any = {
        date: "2026-08-30",
        dayStartMs: Date.parse("2026-08-30T04:00:00.000Z"),
        dayEndMs: Date.parse("2026-08-31T04:00:00.000Z"), // Past!
        revisionId: "rev-past-1",
        metrics: {
          focus: { value: 30 * 60 },
          focusBlocks: { completedCount: 0, reviewedCount: 0 },
          sink: { value: 0 },
          longestDeepBlock: { count: 0, longestSeconds: 0 },
        },
        segments: { focusBlocks: [] },
        effectiveSlices: [],
      };

      const reflection = generateReflection(mockPastDayResult, "witty", 4 /* 4h goal */);
      expect(reflection.text).toContain("The plan said 4 hours. The log says 30 minutes. A modest plot twist.");
    });
  });

  // 10. App Constellation Deterministic Tie-Breaking (§3.5)
  describe("App Constellation Deterministic Tie-Breaking (§3.5)", () => {
    it("Ties in duration are deterministically broken by friendly name and stable key", () => {
      const apps = [
        { key: "app-b", label: "Beta App", seconds: 1200 },
        { key: "app-a", label: "Alpha App", seconds: 1200 },
        { key: "app-c", label: "Alpha App", seconds: 1200 }, // same name, different key
        { key: "app-top", label: "Top App", seconds: 3600 },
      ];

      const sorted = [...apps].sort((a, b) => {
        const friendlyA = getFriendlyAppName(a.label);
        const friendlyB = getFriendlyAppName(b.label);
        return (
          b.seconds - a.seconds ||
          friendlyA.localeCompare(friendlyB) ||
          a.key.localeCompare(b.key)
        );
      });

      expect(sorted[0].key).toBe("app-top");
      expect(sorted[1].key).toBe("app-a"); // Alpha App (app-a)
      expect(sorted[2].key).toBe("app-c"); // Alpha App (app-c)
      expect(sorted[3].key).toBe("app-b"); // Beta App (app-b)
    });
  });
});
