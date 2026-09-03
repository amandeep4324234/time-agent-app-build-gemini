import { DateTime } from "luxon";
import { EnrichedSession, SourceHoursSummary } from "./types";
import { getLogicalDay } from "./day";

export function formatLastWriteAge(lastWriteMs: number | null, nowMs: number): string {
  if (!lastWriteMs) return "never";
  const diffSec = Math.floor((nowMs - lastWriteMs) / 1000);
  if (diffSec < 0) return "just now";
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Computes health and banner states for phone and computer.
 * Banner = first dark logical day after last write (N+1 rule).
 * Format: MMM d in device locale (e.g. "Aug 28").
 */
export function computeHealth(
  sessions: EnrichedSession[],
  currentLogicalDay: string,
  nowMs = Date.now(),
  tz = "Asia/Kolkata"
): SourceHoursSummary {
  const phoneSessions = sessions.filter((s) => s.device === "phone");
  const compSessions = sessions.filter((s) => s.device === "computer");

  const todayPhone = phoneSessions.filter((s) => getLogicalDay(s.started_at_ms, tz) === currentLogicalDay);
  const todayComp = compSessions.filter((s) => getLogicalDay(s.started_at_ms, tz) === currentLogicalDay);

  const phoneHours = todayPhone.length > 0
    ? parseFloat((todayPhone.reduce((acc, s) => acc + s.seconds, 0) / 3600).toFixed(2))
    : null;

  const computerHours = todayComp.length > 0
    ? parseFloat((todayComp.reduce((acc, s) => acc + s.seconds, 0) / 3600).toFixed(2))
    : null;

  // Last write timestamps
  let lastPhoneMs: number | null = null;
  for (const s of phoneSessions) {
    if (lastPhoneMs === null || s.ended_at_ms > lastPhoneMs) {
      lastPhoneMs = s.ended_at_ms;
    }
  }

  let lastCompMs: number | null = null;
  for (const s of compSessions) {
    if (lastCompMs === null || s.ended_at_ms > lastCompMs) {
      lastCompMs = s.ended_at_ms;
    }
  }

  let phoneOffSince: string | null = null;
  let computerOffSince: string | null = null;

  // N+1 banner date rule: if device had writes in the past but is dark today
  if (lastPhoneMs !== null && phoneHours === null) {
    const lastDay = getLogicalDay(lastPhoneMs, tz);
    if (lastDay < currentLogicalDay) {
      const nextDayDt = DateTime.fromISO(lastDay).plus({ days: 1 });
      phoneOffSince = nextDayDt.toFormat("LLL d"); // e.g. "Aug 28"
    }
  }

  if (lastCompMs !== null && computerHours === null) {
    const lastDay = getLogicalDay(lastCompMs, tz);
    if (lastDay < currentLogicalDay) {
      const nextDayDt = DateTime.fromISO(lastDay).plus({ days: 1 });
      computerOffSince = nextDayDt.toFormat("LLL d");
    }
  }

  const phoneAge = formatLastWriteAge(lastPhoneMs, nowMs);
  const compAge = formatLastWriteAge(lastCompMs, nowMs);

  return {
    phoneHours,
    computerHours,
    phoneDark: phoneOffSince !== null,
    computerDark: computerOffSince !== null,
    phoneOffSince,
    computerOffSince,
    phoneLastWriteAge: phoneAge,
    computerLastWriteAge: compAge,
    lastWritePhone: phoneAge,
    lastWriteComputer: compAge,
  };
}
