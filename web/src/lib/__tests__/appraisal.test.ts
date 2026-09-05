import { describe, it, expect } from "vitest";
import {
  sliceSessionWithCorrections,
  computeUnwantedUnionSeconds,
  computeAppraisalSummary,
  CorrectionEvent,
  CorrectionStoreManager,
  RevisionBatch,
} from "../corrections";
import { EnrichedSession } from "../types";

describe("User Appraisal Contract (§7, §3.4, §11)", () => {
  const baseSession: EnrichedSession = {
    id: "sess-work-appraisal",
    source: "chrome_extension",
    device: "computer",
    label: "code",
    canonical_app: "code",
    category: "work",
    started_at: "2026-09-02T10:00:00.000Z",
    ended_at: "2026-09-02T10:30:00.000Z",
    started_at_ms: Date.parse("2026-09-02T10:00:00.000Z"),
    ended_at_ms: Date.parse("2026-09-02T10:30:00.000Z"),
    seconds: 1800,
    minutes: 30,
    session_kind: "block",
  };

  it("Appraisal marks interval as 'unwanted' without changing category or deleting raw data (§7)", () => {
    const appraisalEvent: CorrectionEvent = {
      id: "appr-1",
      targetSessionId: baseSession.id,
      intervalStartUtc: "2026-09-02T10:00:00.000Z",
      intervalEndUtc: "2026-09-02T10:30:00.000Z",
      operation: "appraisal",
      appraisal: "unwanted",
      appraisalReason: "Unnecessary refactoring",
      baseRevisionId: "rev-0",
      batchId: "batch-appr-1",
      createdAtUtc: "2026-09-02T10:35:00.000Z",
    };

    const slices = sliceSessionWithCorrections(baseSession, [appraisalEvent], [], []);

    expect(slices.length).toBe(1);
    const sl = slices[0];
    // Category remains WORK!
    expect(sl.effectiveCategory).toBe("work");
    expect(sl.originalCategory).toBe("work");
    expect(sl.isExcluded).toBe(false);
    expect(sl.sliceSeconds).toBe(1800);
    // Appraisal is unwanted
    expect(sl.appraisal).toBe("unwanted");
    expect(sl.appraisalReason).toBe("Unnecessary refactoring");
    expect(sl.isReviewed).toBe(true);
    // Adjusted is false because category was not altered and activity was not excluded
    expect(sl.isAdjusted).toBe(false);
  });

  it("A Sink session can be marked Intentional (chosen break) (§7)", () => {
    const sinkSession: EnrichedSession = {
      ...baseSession,
      id: "sess-sink-intentional",
      label: "youtube.com",
      canonical_app: "youtube.com",
      category: "sink",
    };

    const appraisalEvent: CorrectionEvent = {
      id: "appr-2",
      targetSessionId: sinkSession.id,
      intervalStartUtc: "2026-09-02T10:00:00.000Z",
      intervalEndUtc: "2026-09-02T10:30:00.000Z",
      operation: "appraisal",
      appraisal: "intentional",
      appraisalReason: "Lunchtime video break",
      baseRevisionId: "rev-0",
      batchId: "batch-appr-2",
      createdAtUtc: "2026-09-02T10:35:00.000Z",
    };

    const slices = sliceSessionWithCorrections(sinkSession, [appraisalEvent], [], []);
    expect(slices.length).toBe(1);
    const sl = slices[0];
    expect(sl.effectiveCategory).toBe("sink");
    expect(sl.appraisal).toBe("intentional");
    expect(sl.isReviewed).toBe(true);
  });

  it("User-confirmed unwanted duration = union of effective included intervals marked unwanted (§7)", () => {
    const event1: CorrectionEvent = {
      id: "appr-unw-1",
      targetSessionId: "sess-1",
      intervalStartUtc: "2026-09-02T10:00:00.000Z",
      intervalEndUtc: "2026-09-02T10:20:00.000Z", // 20m
      operation: "appraisal",
      appraisal: "unwanted",
      baseRevisionId: "rev-0",
      batchId: "batch-1",
      createdAtUtc: "2026-09-02T10:35:00.000Z",
    };

    const event2: CorrectionEvent = {
      id: "appr-unw-2",
      targetSessionId: "sess-2",
      intervalStartUtc: "2026-09-02T10:10:00.000Z",
      intervalEndUtc: "2026-09-02T10:30:00.000Z", // 20m, overlaps 10:10-10:20
      operation: "appraisal",
      appraisal: "unwanted",
      baseRevisionId: "rev-0",
      batchId: "batch-2",
      createdAtUtc: "2026-09-02T10:35:00.000Z",
    };

    const s1: EnrichedSession = {
      ...baseSession,
      id: "sess-1",
      started_at_ms: Date.parse("2026-09-02T10:00:00.000Z"),
      ended_at_ms: Date.parse("2026-09-02T10:20:00.000Z"),
    };
    const s2: EnrichedSession = {
      ...baseSession,
      id: "sess-2",
      device: "phone",
      started_at_ms: Date.parse("2026-09-02T10:10:00.000Z"),
      ended_at_ms: Date.parse("2026-09-02T10:30:00.000Z"),
    };

    const slices1 = sliceSessionWithCorrections(s1, [event1], [], []);
    const slices2 = sliceSessionWithCorrections(s2, [event2], [], []);
    const allSlices = [...slices1, ...slices2];

    // Union of [10:00, 10:20) and [10:10, 10:30) is [10:00, 10:30) = 30 minutes = 1800s
    const unwantedUnionSec = computeUnwantedUnionSeconds(allSlices);
    expect(unwantedUnionSec).toBe(1800);
  });

  it("Excluded intervals stay out of unwanted analysis (§7)", () => {
    const s: EnrichedSession = {
      ...baseSession,
      id: "sess-ex-unw",
    };
    const appr: CorrectionEvent = {
      id: "appr-unw",
      targetSessionId: s.id,
      intervalStartUtc: "2026-09-02T10:00:00.000Z",
      intervalEndUtc: "2026-09-02T10:30:00.000Z",
      operation: "appraisal",
      appraisal: "unwanted",
      baseRevisionId: "rev-0",
      batchId: "b-1",
      createdAtUtc: "2026-09-02T10:35:00.000Z",
    };
    const exclude: CorrectionEvent = {
      id: "corr-ex",
      targetSessionId: s.id,
      intervalStartUtc: "2026-09-02T10:00:00.000Z",
      intervalEndUtc: "2026-09-02T10:30:00.000Z",
      operation: "exclude",
      baseRevisionId: "rev-0",
      batchId: "b-2",
      createdAtUtc: "2026-09-02T10:36:00.000Z",
    };

    const slices = sliceSessionWithCorrections(s, [appr, exclude], [], []);
    expect(slices[0].isExcluded).toBe(true);
    // Excluded intervals stay out of unwanted analysis
    const unwantedUnionSec = computeUnwantedUnionSeconds(slices);
    expect(unwantedUnionSec).toBe(0);
  });

  it("Conflicting overlapping intentional and unwanted across devices is flagged as mixed (§7)", () => {
    const phoneSession: EnrichedSession = {
      ...baseSession,
      id: "phone-sess",
      device: "phone",
      started_at_ms: Date.parse("2026-09-02T10:00:00.000Z"),
      ended_at_ms: Date.parse("2026-09-02T10:20:00.000Z"),
    };
    const compSession: EnrichedSession = {
      ...baseSession,
      id: "comp-sess",
      device: "computer",
      started_at_ms: Date.parse("2026-09-02T10:10:00.000Z"),
      ended_at_ms: Date.parse("2026-09-02T10:30:00.000Z"),
    };

    // Phone intentional, Computer unwanted
    const apprPhone: CorrectionEvent = {
      id: "appr-phone",
      targetSessionId: "phone-sess",
      intervalStartUtc: "2026-09-02T10:00:00.000Z",
      intervalEndUtc: "2026-09-02T10:20:00.000Z",
      operation: "appraisal",
      appraisal: "intentional",
      baseRevisionId: "rev-0",
      batchId: "b-p",
      createdAtUtc: "2026-09-02T10:35:00.000Z",
    };
    const apprComp: CorrectionEvent = {
      id: "appr-comp",
      targetSessionId: "comp-sess",
      intervalStartUtc: "2026-09-02T10:10:00.000Z",
      intervalEndUtc: "2026-09-02T10:30:00.000Z",
      operation: "appraisal",
      appraisal: "unwanted",
      baseRevisionId: "rev-0",
      batchId: "b-c",
      createdAtUtc: "2026-09-02T10:35:00.000Z",
    };

    const slices1 = sliceSessionWithCorrections(phoneSession, [apprPhone], [], []);
    const slices2 = sliceSessionWithCorrections(compSession, [apprComp], [], []);
    const summary = computeAppraisalSummary([...slices1, ...slices2]);

    expect(summary.hasMixedCrossDeviceOverlap).toBe(true);
  });
});
