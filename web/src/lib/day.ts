import { DateTime } from "luxon";

/**
 * 04:00 -> 04:00 logical day calculation:
 * logicalDay(instant, tz) = LocalDate(instant − 4h, tz)
 */
export function getLogicalDay(instant: number | string, tz = "Asia/Kolkata"): string {
  const millis = typeof instant === "string" ? new Date(instant).getTime() : instant;
  // Subtract 4 hours (4 * 60 * 60 * 1000 = 14400000 ms)
  const dt = DateTime.fromMillis(millis, { zone: tz }).minus({ hours: 4 });
  return dt.toISODate() || dt.toFormat("yyyy-MM-dd");
}

/**
 * Returns local hour (0..23) for a given timestamp in timezone.
 */
export function getLocalHour(instant: number | string, tz = "Asia/Kolkata"): number {
  const millis = typeof instant === "string" ? new Date(instant).getTime() : instant;
  return DateTime.fromMillis(millis, { zone: tz }).hour;
}

/**
 * Checks if a day is a light day (< 45 tracked minutes on that device).
 */
export function isLightDay(trackedSeconds: number): boolean {
  return trackedSeconds < 45 * 60;
}
