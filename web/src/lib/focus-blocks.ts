/**
 * Focus Blocks Model & Invariants
 * Authority: TIMEFRAME-UI-REDESIGN.md v4.1 §7, §9
 */

export type FocusBlockState =
  | "draft"
  | "running"
  | "paused"
  | "awaiting_review"
  | "reviewed"
  | "cancelled"
  | "recovery_needed"
  | "conflict";

export type SyncStatus = "saved_locally" | "syncing" | "synced" | "needs_attention";

export interface ActiveInterval {
  startUtc: string; // ISO-8601 UTC
  endUtc: string | null; // null if active
}

export interface FocusBlock {
  id: string;
  ownerId?: string;
  title: string;
  tags: string[];
  plannedSeconds: number | null; // null for open-ended
  activeIntervals: ActiveInterval[];
  state: FocusBlockState;
  revisionId: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  autoReview: boolean;
  syncStatus?: SyncStatus;
  originDeviceId?: string;
}

/**
 * Calculate total elapsed active seconds for a block from persisted instants.
 * Monotonic and accurate across backgrounding/refresh (§7.2).
 */
export function calculateBlockElapsedSeconds(
  block: FocusBlock,
  referenceTimeMs: number = Date.now()
): number {
  let totalMs = 0;
  for (const interval of block.activeIntervals) {
    const startMs = Date.parse(interval.startUtc);
    if (isNaN(startMs)) continue;

    if (interval.endUtc) {
      const endMs = Date.parse(interval.endUtc);
      if (!isNaN(endMs) && endMs > startMs) {
        totalMs += endMs - startMs;
      }
    } else if (block.state === "running") {
      const currentMs = Math.max(startMs, referenceTimeMs);
      totalMs += currentMs - startMs;
    }
  }

  const elapsedSeconds = Math.floor(totalMs / 1000);
  if (block.plannedSeconds !== null && elapsedSeconds >= block.plannedSeconds) {
    return block.plannedSeconds;
  }
  return Math.max(0, elapsedSeconds);
}

/**
 * Calculate remaining seconds for a planned block.
 */
export function calculateBlockRemainingSeconds(
  block: FocusBlock,
  referenceTimeMs: number = Date.now()
): number | null {
  if (block.plannedSeconds === null) return null;
  const elapsed = calculateBlockElapsedSeconds(block, referenceTimeMs);
  return Math.max(0, block.plannedSeconds - elapsed);
}

/**
 * Normalize tags: trims spaces, prevents case-insensitive duplicates, max 8 tags, max 32 chars each (§7.1).
 */
export function normalizeTags(tags: string[]): string[] {
  const result: string[] = [];
  const seenLower = new Set<string>();

  for (const raw of tags) {
    const trimmed = raw.trim().slice(0, 32);
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      result.push(trimmed);
      if (result.length >= 8) break;
    }
  }
  return result;
}

/**
 * Create a new FocusBlock in 'running' state with persisted start instant (§7.1).
 */
export function createFocusBlock(params: {
  title?: string;
  plannedMinutes: number | null; // null for open-ended
  tags?: string[];
  autoReview?: boolean;
  startUtc?: string;
}): FocusBlock {
  const now = params.startUtc || new Date().toISOString();
  const plannedSeconds = params.plannedMinutes !== null ? Math.round(params.plannedMinutes * 60) : null;

  return {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: (params.title || "").trim().slice(0, 80),
    tags: normalizeTags(params.tags || []),
    plannedSeconds,
    activeIntervals: [{ startUtc: now, endUtc: null }],
    state: "running",
    revisionId: `rev-fb-${Date.now()}`,
    createdAtUtc: now,
    updatedAtUtc: now,
    autoReview: params.autoReview ?? true,
    syncStatus: "saved_locally",
    originDeviceId: "desktop-primary",
  };
}

/**
 * Check if block target duration has been reached.
 */
export function isBlockTargetReached(
  block: FocusBlock,
  referenceTimeMs: number = Date.now()
): boolean {
  if (block.plannedSeconds === null) return false;
  const elapsed = calculateBlockElapsedSeconds(block, referenceTimeMs);
  return elapsed >= block.plannedSeconds;
}

/**
 * Pause a running focus block. Closes the currently active interval (§7.2).
 * If target duration reached, closes at intended endpoint and moves to awaiting_review (§7.3).
 */
export function pauseFocusBlock(block: FocusBlock, pauseUtc?: string): FocusBlock {
  if (block.state !== "running") return block;
  const now = pauseUtc || new Date().toISOString();
  const nowMs = Date.parse(now);

  let priorElapsedMs = 0;
  for (let i = 0; i < block.activeIntervals.length - 1; i++) {
    const inv = block.activeIntervals[i];
    const s = Date.parse(inv.startUtc);
    const e = inv.endUtc ? Date.parse(inv.endUtc) : s;
    if (e > s) priorElapsedMs += e - s;
  }

  let reachedTarget = false;
  const intervals = block.activeIntervals.map((inv, idx) => {
    if (idx === block.activeIntervals.length - 1 && inv.endUtc === null) {
      const sMs = Date.parse(inv.startUtc);
      let endMs = nowMs;
      if (block.plannedSeconds !== null) {
        const remainingPlannedMs = Math.max(0, block.plannedSeconds * 1000 - priorElapsedMs);
        const intendedEndpointMs = sMs + remainingPlannedMs;
        if (endMs >= intendedEndpointMs) {
          endMs = intendedEndpointMs;
          reachedTarget = true;
        }
      }
      return { ...inv, endUtc: new Date(endMs).toISOString() };
    }
    return inv;
  });

  return {
    ...block,
    activeIntervals: intervals,
    state: reachedTarget ? "awaiting_review" : "paused",
    updatedAtUtc: now,
    revisionId: `rev-fb-${Date.now()}`,
  };
}

/**
 * Resume a paused focus block. Opens a new active interval (§7.2).
 */
export function resumeFocusBlock(block: FocusBlock, resumeUtc?: string): FocusBlock {
  if (block.state !== "paused") return block;
  const now = resumeUtc || new Date().toISOString();

  return {
    ...block,
    activeIntervals: [...block.activeIntervals, { startUtc: now, endUtc: null }],
    state: "running",
    updatedAtUtc: now,
    revisionId: `rev-fb-${Date.now()}`,
  };
}

/**
 * Finish a focus block. Closes the last interval if still open, marks as awaiting_review (§7.3).
 * If plannedSeconds is set, clamps to intended endpoint and never silently extends duration.
 */
export function finishFocusBlock(block: FocusBlock, finishUtc?: string): FocusBlock {
  const now = finishUtc || new Date().toISOString();
  const nowMs = Date.parse(now);

  let priorElapsedMs = 0;
  for (let i = 0; i < block.activeIntervals.length - 1; i++) {
    const inv = block.activeIntervals[i];
    const s = Date.parse(inv.startUtc);
    const e = inv.endUtc ? Date.parse(inv.endUtc) : s;
    if (e > s) priorElapsedMs += e - s;
  }

  const intervals = block.activeIntervals.map((inv, idx) => {
    if (idx === block.activeIntervals.length - 1 && inv.endUtc === null) {
      const sMs = Date.parse(inv.startUtc);
      let endMs = nowMs;
      if (block.plannedSeconds !== null) {
        const remainingPlannedMs = Math.max(0, block.plannedSeconds * 1000 - priorElapsedMs);
        const intendedEndpointMs = sMs + remainingPlannedMs;
        if (endMs > intendedEndpointMs) {
          endMs = intendedEndpointMs;
        }
      }
      return { ...inv, endUtc: new Date(endMs).toISOString() };
    }
    return inv;
  });

  return {
    ...block,
    activeIntervals: intervals,
    state: "awaiting_review",
    updatedAtUtc: now,
    revisionId: `rev-fb-${Date.now()}`,
  };
}
