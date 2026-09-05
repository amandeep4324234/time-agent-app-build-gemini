import { DateTime } from "luxon";
import { isSensitiveInSeedMap } from "./classify";

/**
 * Format duration adhering to UI.md §0.2:
 * "4h 12m", "47m", "22m", "4m 12s"
 */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const remS = s % 60;
    if (m < 5 && remS > 0) {
      return `${m}m ${remS}s`;
    }
    return `${m}m`;
  }
  return `${s}s`;
}

export const formatDurationSeconds = formatDuration;

export function formatMinutes(minutes: number): string {
  return formatDuration(minutes * 60);
}

/**
 * Format duration from minutes:
 * e.g. 4.5 -> "4h 30m"
 */
export function formatHoursDuration(hours: number): string {
  return formatDuration(hours * 3600);
}

/**
 * Clock format adhering to UI.md §0.2:
 * "2:47pm" lowercase
 */
export function formatClock(instant: number | string, tz = "Asia/Kolkata"): string {
  const ms = typeof instant === "string" ? new Date(instant).getTime() : instant;
  return DateTime.fromMillis(ms, { zone: tz }).toFormat("h:mma").toLowerCase();
}

/**
 * Time range format adhering to UI.md §0.2:
 * "9:10-9:57" hyphenated
 */
export function formatTimeRange(start: number | string, end: number | string, tz = "Asia/Kolkata"): string {
  const startMs = typeof start === "string" ? new Date(start).getTime() : start;
  const endMs = typeof end === "string" ? new Date(end).getTime() : end;
  const s = DateTime.fromMillis(startMs, { zone: tz }).toFormat("h:mm");
  const e = DateTime.fromMillis(endMs, { zone: tz }).toFormat("h:mma").toLowerCase();
  return `${s}-${e}`;
}

/**
 * Percentage format: integer + "%" (UI.md §0.2)
 */
export function formatPercent(val: number): string {
  return `${Math.round(val)}%`;
}

/**
 * Sensitive fence mask: replaces fenced apps with literal "private"
 */
export function maskFencedLabel(label: string, isPrivateCategory?: boolean): string {
  if (isPrivateCategory || isSensitiveInSeedMap(label)) {
    return "private";
  }
  return label;
}
