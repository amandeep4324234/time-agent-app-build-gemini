/**
 * Post-Sync Corrections & Effective Activity Model
 * Authority: TIMEFRAME-UI-REDESIGN.md v4.1 §8, §9
 * 
 * Rules:
 * - Append-only raw sessions remain unchanged.
 * - Interval splitting at correction/block boundaries.
 * - Precedence: Immutable Privacy Fence > Explicit Interval Correction > User Classification Rule > Default.
 * - Exclusions are reversible and act as continuity barriers.
 * - Atomic revision batches, idempotent sync replay, and conflict detection.
 */

import { EnrichedSession, Category } from "./types";
import { isFencedSession, FENCED_DOMAINS } from "./safe-adapter";
import { FocusBlock } from "./focus-blocks";

export type CorrectionOperation = "category" | "exclude" | "restore";

export interface CorrectionEvent {
  id: string;
  ownerId?: string;
  targetSessionId: string;
  intervalStartUtc: string;
  intervalEndUtc: string;
  operation: CorrectionOperation;
  category?: Category;
  scopeBlockId?: string;
  baseRevisionId: string;
  batchId: string;
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
  appliedCorrectionIds: string[];
  associatedBlockId?: string;
  sliceStartMs: number;
  sliceEndMs: number;
  sliceSeconds: number;
}

export interface ConflictRecord {
  id: string;
  targetSessionId: string;
  intervalStartUtc: string;
  intervalEndUtc: string;
  localEvent: CorrectionEvent;
  remoteEvent: CorrectionEvent;
  detectedAtUtc: string;
  resolved: boolean;
  resolution?: "keep_mine" | "use_other";
}

/**
 * Split a single session into effective slices based on active corrections and block intervals.
 * Implements §8.3 (e.g. 10:15–10:30 correction within a 10:00–10:40 session modifies only 15m intersection).
 */
export function sliceSessionWithCorrections(
  session: EnrichedSession,
  corrections: CorrectionEvent[],
  rules: ClassificationRule[],
  blocks: FocusBlock[]
): EffectiveSessionSlice[] {
  const sessionStartMs = session.started_at_ms;
  const sessionEndMs = session.ended_at_ms;
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
    const cStart = Date.parse(c.intervalStartUtc);
    const cEnd = Date.parse(c.intervalEndUtc);
    if (!isNaN(cStart) && cStart > sessionStartMs && cStart < sessionEndMs) {
      cutSet.add(cStart);
    }
    if (!isNaN(cEnd) && cEnd > sessionStartMs && cEnd < sessionEndMs) {
      cutSet.add(cEnd);
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

    // Default base category from session
    let effectiveCategory: Category = session.category;
    let isExcluded = false;
    const appliedIds: string[] = [];

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
        const cStart = Date.parse(c.intervalStartUtc);
        const cEnd = Date.parse(c.intervalEndUtc);
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
        } else if (c.operation === "restore") {
          isExcluded = false;
          if (c.category) effectiveCategory = c.category;
        } else if (c.operation === "category" && c.category) {
          isExcluded = false;
          effectiveCategory = c.category;
        }
      }
    }

    const isAdjusted =
      isExcluded ||
      effectiveCategory !== session.category ||
      appliedIds.length > 0;

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
      originalCategory: session.category,
      effectiveCategory,
      isExcluded,
      isAdjusted,
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
          const inStart = Date.parse(incoming.intervalStartUtc);
          const inEnd = Date.parse(incoming.intervalEndUtc);
          const apStart = Date.parse(applied.intervalStartUtc);
          const apEnd = Date.parse(applied.intervalEndUtc);

          const overlaps = inStart < apEnd && inEnd > apStart;
          if (overlaps && (incoming.operation !== applied.operation || incoming.category !== applied.category)) {
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
