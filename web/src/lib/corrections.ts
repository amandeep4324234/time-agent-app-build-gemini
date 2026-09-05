/**
 * Post-Sync Corrections, User Appraisal & Effective Activity Model
 * Authority: TIMEFRAME-UI-REDESIGN.md v4.1 §8, §9 · update.md §1.1, §3.4, §7
 * 
 * Rules:
 * - Append-only raw sessions remain unchanged.
 * - Interval splitting at correction/block boundaries.
 * - Precedence: Immutable Privacy Fence > Explicit Interval Correction > User Classification Rule > Default.
 * - Exclusions are reversible and act as continuity barriers; distinct from user appraisal.
 * - User appraisal: intentional | unwanted | unsure | unreviewed. Does NOT silently change category or delete data.
 * - Adjusted: category/exclusion correction affecting calculation.
 * - Reviewed: user supplied intention/appraisal.
 * - Unwanted duration: union of effective, included intervals explicitly marked unwanted.
 * - Overlapping cross-device conflicting appraisals marked mixed in combined summaries.
 * - Atomic revision batches, idempotent sync replay, and conflict detection.
 */

import { EnrichedSession, Category } from "./types";
import { isFencedSession } from "./safe-adapter";
import { FocusBlock } from "./focus-blocks";
import { measureUnionSeconds, TimeInterval } from "./stat-utils";
import { classifySession } from "./classify";

export type CorrectionOperation = "category" | "exclude" | "restore" | "appraisal";

export type UserAppraisal = "intentional" | "unwanted" | "unsure" | "unreviewed";

export interface CorrectionEvent {
  id: string;
  ownerId?: string;
  targetSessionId: string;
  intervalStartUtc?: string;
  intervalEndUtc?: string;
  operation: CorrectionOperation;
  category?: Category;
  appraisal?: UserAppraisal;
  appraisalReason?: string; // user-authored private context max 160 chars
  scopeBlockId?: string;
  baseRevisionId?: string;
  batchId?: string;
  createdAtUtc: string;
  originDeviceId?: string;
}

export interface RevisionBatch {
  id: string;
  ownerId?: string;
  baseRevisionId: string;
  operations: CorrectionEvent[];
  status: "applied" | "syncing" | "synced" | "conflict";
  appliedAtUtc: string;
  summary?: string;
}

export interface ClassificationRule {
  id: string;
  appLabel: string;
  category: Category;
  effectiveFromUtc: string;
  effectiveToUtc?: string; // defined if applied to historical date range
  scope: "future" | "range";
  createdAtUtc: string;
}

export interface EffectiveSessionSlice extends EnrichedSession {
  originalSessionId: string;
  originalCategory: Category;
  effectiveCategory: Category;
  isExcluded: boolean;
  isAdjusted: boolean;
  isReviewed: boolean;
  appraisal: UserAppraisal;
  appraisalReason?: string;
  appliedCorrectionIds: string[];
  associatedBlockId?: string;
  sliceStartMs: number;
  sliceEndMs: number;
  sliceSeconds: number;
}

export interface ConflictRecord {
  id: string;
  targetSessionId: string;
  intervalStartUtc?: string;
  intervalEndUtc?: string;
  localEvent: CorrectionEvent;
  remoteEvent: CorrectionEvent;
  detectedAtUtc: string;
  resolved: boolean;
  resolution?: "keep_mine" | "use_other";
}

/**
 * Split a single session into effective slices based on active corrections, appraisals, and block intervals.
 * Implements §8.3 and update.md §3.4, §7.
 */
export function sliceSessionWithCorrections(
  session: EnrichedSession,
  corrections: CorrectionEvent[],
  rules: ClassificationRule[],
  blocks: FocusBlock[]
): EffectiveSessionSlice[] {
  const sessionStartMs =
    session.started_at_ms ??
    (session.started_at ? Date.parse(session.started_at) : 0);
  const sessionEndMs =
    session.ended_at_ms ??
    (session.ended_at
      ? Date.parse(session.ended_at)
      : sessionStartMs + (session.seconds ?? 0) * 1000);
  const sessionDurationMs = sessionEndMs - sessionStartMs;

  if (sessionDurationMs <= 0) return [];

  // 1. Immutable Privacy Fence Check (§3.3, §9.2 rule 2)
  const isFenced = isFencedSession(session);

  // 2. Identify relevant corrections targeting this session
  const relevantCorrections = corrections.filter(
    (c) => c.targetSessionId === session.id
  );

  // 3. Identify blocks overlapping this session
  const overlappingBlocks = blocks.filter((b) => {
    return b.activeIntervals.some((inv) => {
      const startMs = Date.parse(inv.startUtc);
      const endMs = inv.endUtc ? Date.parse(inv.endUtc) : Date.now();
      return startMs < sessionEndMs && endMs > sessionStartMs;
    });
  });

  // 4. Collect cut boundaries
  const cutSet = new Set<number>([sessionStartMs, sessionEndMs]);

  for (const c of relevantCorrections) {
    if (c.intervalStartUtc) {
      const cStart = Date.parse(c.intervalStartUtc);
      if (!isNaN(cStart) && cStart > sessionStartMs && cStart < sessionEndMs) {
        cutSet.add(cStart);
      }
    }
    if (c.intervalEndUtc) {
      const cEnd = Date.parse(c.intervalEndUtc);
      if (!isNaN(cEnd) && cEnd > sessionStartMs && cEnd < sessionEndMs) {
        cutSet.add(cEnd);
      }
    }
  }

  for (const b of overlappingBlocks) {
    for (const inv of b.activeIntervals) {
      const bStart = Date.parse(inv.startUtc);
      const bEnd = inv.endUtc ? Date.parse(inv.endUtc) : Date.now();
      if (bStart > sessionStartMs && bStart < sessionEndMs) cutSet.add(bStart);
      if (bEnd > sessionStartMs && bEnd < sessionEndMs) cutSet.add(bEnd);
    }
  }

  const sortedCuts = Array.from(cutSet).sort((a, b) => a - b);
  const slices: EffectiveSessionSlice[] = [];

  for (let i = 0; i < sortedCuts.length - 1; i++) {
    const sStart = sortedCuts[i];
    const sEnd = sortedCuts[i + 1];
    const durationMs = sEnd - sStart;
    if (durationMs <= 0) continue;
    const durationSec = Math.round(durationMs / 1000);

    // Identify which block active intervals this slice falls inside
    const midPoint = sStart + durationMs / 2;
    const matchedBlock = blocks.find((b) =>
      b.activeIntervals.some((inv) => {
        const bStart = Date.parse(inv.startUtc);
        const bEnd = inv.endUtc ? Date.parse(inv.endUtc) : Date.now();
        return midPoint >= bStart && midPoint < bEnd;
      })
    );

    // Default base category from session (fallback to automatic classification if absent)
    const initialCategory: Category =
      session.category ?? classifySession(session as any);
    let effectiveCategory: Category = initialCategory;
    let isExcluded = false;
    let appraisal: UserAppraisal = "unreviewed";
    let appraisalReason: string | undefined = undefined;
    const appliedIds: string[] = [];
    let hasCategoryOrExclusionCorrection = false;

    if (isFenced) {
      // Privacy fence outranks all user overrides (§9.2)
      effectiveCategory = "private";
      isExcluded = false;
    } else {
      // Check classification rules applicable to this app
      const appKey = session.label.toLowerCase();
      const applicableRule = rules.find((r) => {
        if (r.appLabel.toLowerCase() !== appKey) return false;
        const fromMs = Date.parse(r.effectiveFromUtc);
        if (r.scope === "future") {
          return midPoint >= fromMs;
        } else if (r.scope === "range" && r.effectiveToUtc) {
          const toMs = Date.parse(r.effectiveToUtc);
          return midPoint >= fromMs && midPoint <= toMs;
        }
        return false;
      });

      if (applicableRule) {
        effectiveCategory = applicableRule.category;
      }

      // Check interval corrections covering this slice (latest wins)
      const coveringCorrections = relevantCorrections.filter((c) => {
        const parsedStart = c.intervalStartUtc ? Date.parse(c.intervalStartUtc) : NaN;
        const parsedEnd = c.intervalEndUtc ? Date.parse(c.intervalEndUtc) : NaN;
        const cStart = isNaN(parsedStart) ? sessionStartMs : parsedStart;
        const cEnd = isNaN(parsedEnd) ? sessionEndMs : parsedEnd;
        return midPoint >= cStart && midPoint <= cEnd;
      });

      // Sort by creation time ascending
      coveringCorrections.sort(
        (a, b) => Date.parse(a.createdAtUtc) - Date.parse(b.createdAtUtc)
      );

      for (const c of coveringCorrections) {
        appliedIds.push(c.id);
        if (c.operation === "exclude") {
          isExcluded = true;
          hasCategoryOrExclusionCorrection = true;
        } else if (c.operation === "restore") {
          isExcluded = false;
          if (c.category) effectiveCategory = c.category;
          hasCategoryOrExclusionCorrection = true;
        } else if (c.operation === "category" && c.category) {
          isExcluded = false;
          effectiveCategory = c.category;
          hasCategoryOrExclusionCorrection = true;
        } else if (c.operation === "appraisal") {
          // User appraisal: does NOT change category or delete data (§7)
          if (c.appraisal) {
            appraisal = c.appraisal;
            appraisalReason = c.appraisalReason?.slice(0, 160);
          }
        }
      }
    }

    const isAdjusted =
      isExcluded ||
      effectiveCategory !== initialCategory ||
      hasCategoryOrExclusionCorrection;

    const isReviewed = appraisal !== "unreviewed";

    slices.push({
      ...session,
      id: `${session.id}__sl_${i}`,
      originalSessionId: session.id,
      started_at_ms: sStart,
      ended_at_ms: sEnd,
      started_at: new Date(sStart).toISOString(),
      ended_at: new Date(sEnd).toISOString(),
      seconds: durationSec,
      minutes: Math.round(durationSec / 60),
      originalCategory: initialCategory,
      effectiveCategory,
      isExcluded,
      isAdjusted,
      isReviewed,
      appraisal,
      appraisalReason,
      appliedCorrectionIds: appliedIds,
      associatedBlockId: matchedBlock?.id,
      sliceStartMs: sStart,
      sliceEndMs: sEnd,
      sliceSeconds: durationSec,
    });
  }

  return slices;
}

/**
 * Compute all effective sessions for a dataset.
 */
export function computeEffectiveSessions(
  rawSessions: EnrichedSession[],
  corrections: CorrectionEvent[],
  rules: ClassificationRule[] = [],
  blocks: FocusBlock[] = []
): EffectiveSessionSlice[] {
  const allSlices: EffectiveSessionSlice[] = [];
  for (const s of rawSessions) {
    const slices = sliceSessionWithCorrections(s, corrections, rules, blocks);
    allSlices.push(...slices);
  }
  return allSlices;
}

/**
 * Compute user-confirmed unwanted duration:
 * Union of effective, included intervals explicitly marked Unwanted (§7).
 */
export function computeUnwantedUnionSeconds(slices: EffectiveSessionSlice[]): number {
  const unwantedIntervals: TimeInterval[] = slices
    .filter((s) => !s.isExcluded && s.appraisal === "unwanted")
    .map((s) => ({ startMs: s.sliceStartMs, endMs: s.sliceEndMs }));

  return measureUnionSeconds(unwantedIntervals);
}

export interface AppraisalSummary {
  intentionalSeconds: number;
  unwantedSeconds: number;
  unsureSeconds: number;
  unreviewedSeconds: number;
  reviewedTotalSeconds: number;
  totalEligibleSeconds: number;
  unreviewedCoveragePercent: number;
  hasMixedCrossDeviceOverlap: boolean;
}

/**
 * Compute appraisal breakdown across slices with cross-device conflicting appraisal detection (§7).
 */
export function computeAppraisalSummary(slices: EffectiveSessionSlice[]): AppraisalSummary {
  const eligibleSlices = slices.filter((s) => !s.isExcluded && s.category !== "private");

  const intentionalIntervals: TimeInterval[] = [];
  const unwantedIntervals: TimeInterval[] = [];
  const unsureIntervals: TimeInterval[] = [];
  const allIntervals: TimeInterval[] = [];

  const phoneIntentional: TimeInterval[] = [];
  const phoneUnwanted: TimeInterval[] = [];
  const compIntentional: TimeInterval[] = [];
  const compUnwanted: TimeInterval[] = [];

  for (const s of eligibleSlices) {
    const inv = { startMs: s.sliceStartMs, endMs: s.sliceEndMs };
    allIntervals.push(inv);

    if (s.appraisal === "intentional") {
      intentionalIntervals.push(inv);
      if (s.device === "phone") phoneIntentional.push(inv);
      else compIntentional.push(inv);
    } else if (s.appraisal === "unwanted") {
      unwantedIntervals.push(inv);
      if (s.device === "phone") phoneUnwanted.push(inv);
      else compUnwanted.push(inv);
    } else if (s.appraisal === "unsure") {
      unsureIntervals.push(inv);
    }
  }

  const totalEligibleSeconds = measureUnionSeconds(allIntervals);
  const intentionalSeconds = measureUnionSeconds(intentionalIntervals);
  const unwantedSeconds = measureUnionSeconds(unwantedIntervals);
  const unsureSeconds = measureUnionSeconds(unsureIntervals);

  // Check cross-device conflicting overlap:
  // e.g. Phone intentional overlaps with Computer unwanted, or vice versa
  const checkCrossOverlap = (list1: TimeInterval[], list2: TimeInterval[]) => {
    for (const a of list1) {
      for (const b of list2) {
        if (a.startMs < b.endMs && a.endMs > b.startMs) return true;
      }
    }
    return false;
  };

  const hasMixedCrossDeviceOverlap =
    checkCrossOverlap(phoneIntentional, compUnwanted) ||
    checkCrossOverlap(compIntentional, phoneUnwanted);

  const reviewedUnion = measureUnionSeconds([
    ...intentionalIntervals,
    ...unwantedIntervals,
    ...unsureIntervals,
  ]);
  const unreviewedSeconds = Math.max(0, totalEligibleSeconds - reviewedUnion);
  const unreviewedCoveragePercent =
    totalEligibleSeconds > 0
      ? Math.round((unreviewedSeconds / totalEligibleSeconds) * 1000) / 10
      : 100;

  return {
    intentionalSeconds,
    unwantedSeconds,
    unsureSeconds,
    unreviewedSeconds,
    reviewedTotalSeconds: reviewedUnion,
    totalEligibleSeconds,
    unreviewedCoveragePercent,
    hasMixedCrossDeviceOverlap,
  };
}

/**
 * Outbox & Sync Store Helper
 */
export class CorrectionStoreManager {
  private appliedBatches = new Map<string, RevisionBatch>();
  private pendingCorrections: CorrectionEvent[] = [];
  private conflicts: ConflictRecord[] = [];

  constructor(initialBatches: RevisionBatch[] = []) {
    for (const b of initialBatches) {
      this.appliedBatches.set(b.id, b);
    }
  }

  /**
   * Apply a batch idempotently (§9.3).
   * Replaying the same batch ID twice has exactly one effect.
   */
  applyBatch(batch: RevisionBatch, existingSessionIds: Set<string>): {
    success: boolean;
    isDuplicate: boolean;
    conflicts: ConflictRecord[];
  } {
    if (this.appliedBatches.has(batch.id)) {
      return { success: true, isDuplicate: true, conflicts: [] };
    }

    const detectedConflicts: ConflictRecord[] = [];

    // Check for concurrent conflicts against already applied events
    for (const incoming of batch.operations) {
      if (!existingSessionIds.has(incoming.targetSessionId)) {
        // Target session not loaded yet: hold pending until row available (§9.3)
        this.pendingCorrections.push(incoming);
        continue;
      }

      for (const applied of this.getAllAppliedEvents()) {
        if (
          applied.targetSessionId === incoming.targetSessionId &&
          applied.batchId !== incoming.batchId
        ) {
          const inStart = incoming.intervalStartUtc ? Date.parse(incoming.intervalStartUtc) : 0;
          const inEnd = incoming.intervalEndUtc ? Date.parse(incoming.intervalEndUtc) : Infinity;
          const apStart = applied.intervalStartUtc ? Date.parse(applied.intervalStartUtc) : 0;
          const apEnd = applied.intervalEndUtc ? Date.parse(applied.intervalEndUtc) : Infinity;

          const overlaps = (isNaN(inStart) || isNaN(apEnd) || inStart < apEnd) && (isNaN(inEnd) || isNaN(apStart) || inEnd > apStart);
          if (
            overlaps &&
            (incoming.operation !== applied.operation ||
              incoming.category !== applied.category ||
              incoming.appraisal !== applied.appraisal)
          ) {
            const conflict: ConflictRecord = {
              id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              targetSessionId: incoming.targetSessionId,
              intervalStartUtc: incoming.intervalStartUtc,
              intervalEndUtc: incoming.intervalEndUtc,
              localEvent: applied,
              remoteEvent: incoming,
              detectedAtUtc: new Date().toISOString(),
              resolved: false,
            };
            detectedConflicts.push(conflict);
            this.conflicts.push(conflict);
          }
        }
      }
    }

    this.appliedBatches.set(batch.id, batch);
    return { success: true, isDuplicate: false, conflicts: detectedConflicts };
  }

  getAllBatches(): RevisionBatch[] {
    return Array.from(this.appliedBatches.values());
  }

  getAllAppliedEvents(): CorrectionEvent[] {
    const events: CorrectionEvent[] = [];
    for (const b of this.appliedBatches.values()) {
      events.push(...b.operations);
    }
    return events;
  }

  getPendingCorrections(): CorrectionEvent[] {
    return [...this.pendingCorrections];
  }

  getConflicts(): ConflictRecord[] {
    return [...this.conflicts];
  }

  /**
   * Drain pending corrections once matching sessions are loaded (§9.3)
   */
  drainPendingForSessions(loadedSessionIds: Set<string>): CorrectionEvent[] {
    const ready = this.pendingCorrections.filter((c) =>
      loadedSessionIds.has(c.targetSessionId)
    );
    this.pendingCorrections = this.pendingCorrections.filter(
      (c) => !loadedSessionIds.has(c.targetSessionId)
    );
    return ready;
  }
}
