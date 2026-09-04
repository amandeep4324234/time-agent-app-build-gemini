import { DateTime } from "luxon";
import { EnrichedSession } from "./types";
import { getLocalHour, getLogicalDay } from "./day";
import { computeTrackedMetrics } from "./union";
import { formatHoursDuration } from "./format";

export interface Heatmap12WkCell {
  date: string;
  displayDate: string; // e.g. "Tue Aug 26"
  weekday: number;     // 0 = Mon, 6 = Sun
  weekIndex: number;   // 0 (oldest) to 11 (current week)
  hours: number;
  formattedHours: string;
  isNoData: boolean;   // true if zero rows for this day
  isLightDay: boolean; // true if < 45 min
  isToday: boolean;
  intensity: -1 | 0 | 1 | 2 | 3 | 4; // -1: no-data, 0: zero, 1: <1h, 2: 1-3h, 3: 3-6h, 4: >=6h
  tooltip: string;     // e.g. "Tue Aug 26 — 4h 12m" or "Tue Aug 26 — no data"
}

/**
 * Computes 12 weeks of heatmap cells ending on the given anchor/today date.
 * Columns = 12 weeks (oldest left, current right), Rows = 7 weekdays (Monday top).
 */
export function compute12WeekHeatmap(
  sessions: EnrichedSession[],
  anchorDate: string,
  tz = "Asia/Kolkata"
): Heatmap12WkCell[][] {
  const anchorDt = DateTime.fromISO(anchorDate, { zone: tz });
  // Start of current week (Monday)
  const currentWeekMonday = anchorDt.startOf("week");
  // 12 weeks starting from 11 weeks before current week Monday
  const startMonday = currentWeekMonday.minus({ weeks: 11 });

  // Pre-index sessions by logical day
  const sessionsByDay = new Map<string, EnrichedSession[]>();
  for (const s of sessions) {
    const d = getLogicalDay(s.started_at_ms, tz);
    const list = sessionsByDay.get(d) || [];
    list.push(s);
    sessionsByDay.set(d, list);
  }

  // Grid: 12 columns (weeks) x 7 rows (weekdays Mon..Sun)
  const grid: Heatmap12WkCell[][] = [];

  for (let w = 0; w < 12; w++) {
    const weekCol: Heatmap12WkCell[] = [];
    const weekStart = startMonday.plus({ weeks: w });

    for (let d = 0; d < 7; d++) {
      const dayDt = weekStart.plus({ days: d });
      const dateStr = dayDt.toISODate() || dayDt.toFormat("yyyy-MM-dd");
      const displayDate = dayDt.toFormat("ccc LLL d"); // e.g. "Tue Aug 26"
      const isToday = dateStr === anchorDate;

      const daySessions = sessionsByDay.get(dateStr) || [];
      const isNoData = daySessions.length === 0;

      let hours = 0;
      let isLightDay = false;
      let intensity: -1 | 0 | 1 | 2 | 3 | 4 = -1;
      let tooltip = `${displayDate} — no data`;

      if (!isNoData) {
        const metrics = computeTrackedMetrics(daySessions);
        hours = metrics.unionHours;
        isLightDay = hours > 0 && hours < 0.75; // < 45 min

        if (hours === 0) {
          intensity = 0;
          tooltip = `${displayDate} — 0m`;
        } else if (hours < 1) {
          intensity = 1;
          tooltip = `${displayDate} — ${formatHoursDuration(hours)}${isLightDay ? " (light day)" : ""}`;
        } else if (hours < 3) {
          intensity = 2;
          tooltip = `${displayDate} — ${formatHoursDuration(hours)}`;
        } else if (hours < 6) {
          intensity = 3;
          tooltip = `${displayDate} — ${formatHoursDuration(hours)}`;
        } else {
          intensity = 4;
          tooltip = `${displayDate} — ${formatHoursDuration(hours)}`;
        }
      }

      weekCol.push({
        date: dateStr,
        displayDate,
        weekday: d,
        weekIndex: w,
        hours,
        formattedHours: formatHoursDuration(hours),
        isNoData,
        isLightDay,
        isToday,
        intensity,
        tooltip,
      });
    }

    grid.push(weekCol);
  }

  return grid;
}

/**
 * Computes 24 hour buckets for a specific day or week.
 * Value = minutes of tracked time in that hour (0..60), or -1 for no measurement (blank).
 */
export function computeDayHeatmap(
  sessions: EnrichedSession[],
  logicalDayString: string,
  tz = "Asia/Kolkata"
): number[] {
  // If no sessions on this day at all, all cells are -1 (no data / blank)
  const daySessions = sessions.filter((s) => getLogicalDay(s.started_at_ms, tz) === logicalDayString);
  if (daySessions.length === 0) {
    return new Array(24).fill(-1);
  }

  const hourSeconds = new Array(24).fill(0);

  for (const s of daySessions) {
    if (s.category === "system") continue;
    const hour = getLocalHour(s.started_at_ms, tz);
    if (hour >= 0 && hour < 24) {
      hourSeconds[hour] += s.seconds;
    }
  }

  return hourSeconds.map((sec) => Math.min(60, Math.round(sec / 60)));
}
