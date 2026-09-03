import { EnrichedSession, Envelope, Session } from "./types";
import { cleanSessions } from "./clean";

/**
 * Hand-rolled session validator (no Zod per spec).
 */
export function validateSession(obj: unknown): obj is Session {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;

  if (typeof s.id !== "string" || s.id.length === 0) return false;
  if (s.source !== "chrome_extension" && s.source !== "android") return false;
  if (s.device !== "computer" && s.device !== "phone") return false;
  if (typeof s.label !== "string" || s.label.length === 0) return false;
  if (typeof s.started_at !== "string") return false;
  if (typeof s.seconds !== "number" || isNaN(s.seconds) || s.seconds <= 0) return false;

  const startMs = Date.parse(s.started_at);
  if (isNaN(startMs)) return false;

  if (s.ended_at !== null && s.ended_at !== undefined) {
    if (typeof s.ended_at !== "string") return false;
    const endMs = Date.parse(s.ended_at);
    if (isNaN(endMs)) return false;
  }

  return true;
}

/**
 * Normalizes ISO timestamp with support for Z and +00:00.
 */
export function parseTimestampMs(iso: string): number {
  return new Date(iso).getTime();
}

/**
 * Deduplicates sessions by id, first occurrence wins.
 * Applies duration guard (|ended_at - started_at - seconds| > 1s -> recompute seconds).
 * Ensures timezone defaults to Asia/Kolkata when missing.
 */
export function ingestSessions(rawSessions: unknown[]): Session[] {
  const seenIds = new Set<string>();
  const validSessions: Session[] = [];

  for (const item of rawSessions) {
    if (!validateSession(item)) {
      continue;
    }

    if (seenIds.has(item.id)) {
      continue; // First occurrence wins
    }
    seenIds.add(item.id);

    const startMs = parseTimestampMs(item.started_at);
    let endMs = item.ended_at ? parseTimestampMs(item.ended_at) : startMs + item.seconds * 1000;

    let seconds = item.seconds;
    const deltaMs = Math.abs(endMs - startMs - seconds * 1000);
    if (deltaMs > 1000) {
      seconds = Math.round((endMs - startMs) / 1000);
    }

    const minutes = parseFloat((seconds / 60).toFixed(2));
    const timezone = item.timezone || "Asia/Kolkata";

    validSessions.push({
      ...item,
      seconds,
      minutes,
      timezone,
      ended_at: item.ended_at || new Date(endMs).toISOString(),
    });
  }

  return validSessions;
}

/**
 * Pure function: Envelope -> EnrichedSession[]
 */
export function buildLedger(
  envelope: Envelope,
  userPins?: { work?: string[]; killers?: string[] },
  userOverrides?: Record<string, import("./types").Category>
): EnrichedSession[] {
  const ingested = ingestSessions(envelope.sessions);
  return cleanSessions(ingested, userPins, userOverrides);
}
