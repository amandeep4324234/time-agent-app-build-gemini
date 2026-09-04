import { DateTime } from "luxon";
import { EnrichedSession, FocusRun } from "./types";
import { getLogicalDay } from "./day";
import { computeFocusRuns } from "./focus-run";
import { formatClock, formatDuration, maskFencedLabel } from "./format";

export interface TimelineSegment {
  id: string;
  label: string;
  displayLabel: string;
  category: string;
  isPrivate: boolean;
  device: "phone" | "computer";
  started_at_ms: number;
  ended_at_ms: number;
  leftPercent: number;
  widthPercent: number;
  seconds: number;
  minutes: number;
  killedRunMinutes?: number;
}

export interface TimelineRunSegment {
  startMs: number;
  endMs: number;
  leftPercent: number;
  widthPercent: number;
  durationSeconds: number;
  fillerSeconds: number;
  ended_by: "sink" | "hole" | "day-end" | "open";
  killerApp?: string;
  apps?: string[];
  hasSinkTick: boolean;
}

export interface TimelineModel {
  dayKey: string;
  dayStartMs: number;
  dayEndMs: number;
  runs: FocusRun[];
  phoneSegments: TimelineSegment[];
  computerSegments: TimelineSegment[];
  runSegments: TimelineRunSegment[];
  ghostPhoneSegments: TimelineSegment[];
  ghostComputerSegments: TimelineSegment[];
  ghostRunSegments: TimelineRunSegment[];
  ghostDayKey?: string;
  totalTrackedSeconds: number;
  isLightDay: boolean;
  isNoData: boolean;
}

export function buildTimelineModel(
  dayKey: string,
  sessions: EnrichedSession[],
  tz = "Asia/Kolkata",
  deathFloor = 5,
  ghostSessions?: EnrichedSession[],
  ghostDayKey?: string
): TimelineModel {
  const dayStartDt = DateTime.fromISO(`${dayKey}T04:00:00`, { zone: tz });
  const dayStartMs = dayStartDt.toMillis();
  const dayEndMs = dayStartMs + 24 * 3600 * 1000;
  const dayTotalDurationMs = 24 * 3600 * 1000;

  // Filter live sessions for this logical day
  const daySessions = sessions.filter(
    (s) => getLogicalDay(s.started_at_ms, tz) === dayKey
  );

  const isNoData = daySessions.length === 0;
  const totalTrackedSeconds = daySessions.reduce((acc, s) => acc + s.seconds, 0);
  const isLightDay = totalTrackedSeconds > 0 && totalTrackedSeconds < 45 * 60;

  // Compute runs for this logical day
  const { runs } = computeFocusRuns(daySessions, deathFloor);

  // Map runs to run segments
  const runSegments: TimelineRunSegment[] = [];
  for (const r of runs) {
    const clampedStart = Math.max(dayStartMs, r.startMs);
    const clampedEnd = Math.min(dayEndMs, r.endMs);
    if (clampedEnd <= clampedStart) continue;

    const leftPercent = ((clampedStart - dayStartMs) / dayTotalDurationMs) * 100;
    const widthPercent = ((clampedEnd - clampedStart) / dayTotalDurationMs) * 100;

    runSegments.push({
      startMs: r.startMs,
      endMs: r.endMs,
      leftPercent,
      widthPercent,
      durationSeconds: r.durationSeconds,
      fillerSeconds: r.fillerSeconds,
      ended_by: r.ended_by || "open",
      killerApp: r.killerApp ? maskFencedLabel(r.killerApp) : undefined,
      apps: r.apps?.map((a) => maskFencedLabel(a)),
      hasSinkTick: r.ended_by === "sink",
    });
  }

  // Helper to map sessions to timeline segments
  function mapToSegments(sessList: EnrichedSession[], runsList: FocusRun[]): TimelineSegment[] {
    const segments: TimelineSegment[] = [];
    for (const s of sessList) {
      const clampedStart = Math.max(dayStartMs, s.started_at_ms);
      const clampedEnd = Math.min(dayEndMs, s.ended_at_ms);
      if (clampedEnd <= clampedStart) continue;

      const leftPercent = ((clampedStart - dayStartMs) / dayTotalDurationMs) * 100;
      const widthPercent = ((clampedEnd - clampedStart) / dayTotalDurationMs) * 100;

      const isPrivate = s.category === "private" || s.label.toLowerCase().includes("private");
      const displayLabel = maskFencedLabel(s.label, s.category === "private");

      // Check if this session killed a run
      let killedRunMinutes: number | undefined = undefined;
      if (s.category === "sink" && s.seconds >= deathFloor) {
        const killedRun = runsList.find(
          (r) =>
            r.ended_by === "sink" &&
            Math.abs(r.endMs - s.started_at_ms) <= 2000
        );
        if (killedRun) {
          killedRunMinutes = Math.round(killedRun.durationSeconds / 60);
        }
      }

      segments.push({
        id: s.id,
        label: s.label,
        displayLabel,
        category: s.category,
        isPrivate,
        device: s.device,
        started_at_ms: s.started_at_ms,
        ended_at_ms: s.ended_at_ms,
        leftPercent,
        widthPercent,
        seconds: s.seconds,
        minutes: s.minutes,
        killedRunMinutes,
      });
    }
    return segments;
  }

  const phoneSegments = mapToSegments(
    daySessions.filter((s) => s.device === "phone"),
    runs
  );
  const computerSegments = mapToSegments(
    daySessions.filter((s) => s.device === "computer"),
    runs
  );

  // Ghost data calculation if ghostSessions provided
  let ghostPhoneSegments: TimelineSegment[] = [];
  let ghostComputerSegments: TimelineSegment[] = [];
  let ghostRunSegments: TimelineRunSegment[] = [];

  if (ghostSessions && ghostDayKey) {
    const ghostDaySessions = ghostSessions.filter(
      (s) => getLogicalDay(s.started_at_ms, tz) === ghostDayKey
    );
    const { runs: gRuns } = computeFocusRuns(ghostDaySessions, deathFloor);

    // Offset ghost sessions to overlay directly on the live day 04:00-04:00 axis
    const gStartDt = DateTime.fromISO(`${ghostDayKey}T04:00:00`, { zone: tz });
    const gStartMs = gStartDt.toMillis();
    const shiftMs = dayStartMs - gStartMs;

    const shiftedGhostSessions = ghostDaySessions.map((s) => ({
      ...s,
      started_at_ms: s.started_at_ms + shiftMs,
      ended_at_ms: s.ended_at_ms + shiftMs,
    }));

    const shiftedGRuns = gRuns.map((r) => ({
      ...r,
      startMs: r.startMs + shiftMs,
      endMs: r.endMs + shiftMs,
    }));

    ghostPhoneSegments = mapToSegments(
      shiftedGhostSessions.filter((s) => s.device === "phone"),
      shiftedGRuns
    );
    ghostComputerSegments = mapToSegments(
      shiftedGhostSessions.filter((s) => s.device === "computer"),
      shiftedGRuns
    );
    ghostRunSegments = [];
    for (const r of shiftedGRuns) {
      const clampedStart = Math.max(dayStartMs, r.startMs);
      const clampedEnd = Math.min(dayEndMs, r.endMs);
      if (clampedEnd <= clampedStart) continue;
      ghostRunSegments.push({
        startMs: r.startMs,
        endMs: r.endMs,
        leftPercent: ((clampedStart - dayStartMs) / dayTotalDurationMs) * 100,
        widthPercent: ((clampedEnd - clampedStart) / dayTotalDurationMs) * 100,
        durationSeconds: r.durationSeconds,
        fillerSeconds: r.fillerSeconds,
        ended_by: r.ended_by || "open",
        hasSinkTick: r.ended_by === "sink",
      });
    }
  }

  return {
    dayKey,
    dayStartMs,
    dayEndMs,
    runs,
    phoneSegments,
    computerSegments,
    runSegments,
    ghostPhoneSegments,
    ghostComputerSegments,
    ghostRunSegments,
    ghostDayKey,
    totalTrackedSeconds,
    isLightDay,
    isNoData,
  };
}

export interface HitTestResult {
  clock: string;
  timeMs: number;
  primarySegment?: TimelineSegment;
  activeRun?: TimelineRunSegment;
  isGhostOnly: boolean;
  readoutText: string;
}

export function hitTestTimeline(
  percent: number,
  model: TimelineModel,
  tz = "Asia/Kolkata"
): HitTestResult {
  const p = Math.max(0, Math.min(100, percent));
  const timeMs = model.dayStartMs + (p / 100) * 24 * 3600 * 1000;
  const clock = formatClock(timeMs, tz);

  // Find live session under cursor (check phone and computer)
  const hitPhone = model.phoneSegments.find(
    (s) => timeMs >= s.started_at_ms && timeMs <= s.ended_at_ms
  );
  const hitComputer = model.computerSegments.find(
    (s) => timeMs >= s.started_at_ms && timeMs <= s.ended_at_ms
  );
  const primarySegment = hitPhone || hitComputer;

  // Find run under cursor
  const activeRun = model.runSegments.find(
    (r) => timeMs >= r.startMs && timeMs <= r.endMs
  );

  if (primarySegment) {
    const label = primarySegment.displayLabel;
    const dur = formatDuration(primarySegment.seconds);
    const killed = primarySegment.killedRunMinutes
      ? `  killed ${primarySegment.killedRunMinutes}m`
      : "";
    return {
      clock,
      timeMs,
      primarySegment,
      activeRun,
      isGhostOnly: false,
      readoutText: `${clock}  ${label}  ${dur}${killed}`,
    };
  }

  if (activeRun) {
    const dur = formatDuration(activeRun.durationSeconds);
    return {
      clock,
      timeMs,
      activeRun,
      isGhostOnly: false,
      readoutText: `${clock}  focus run  ${dur}`,
    };
  }

  // Check if cursor lands only on ghost data (UI.md §1.3)
  const hitGhostPhone = model.ghostPhoneSegments.find(
    (s) => timeMs >= s.started_at_ms && timeMs <= s.ended_at_ms
  );
  const hitGhostComp = model.ghostComputerSegments.find(
    (s) => timeMs >= s.started_at_ms && timeMs <= s.ended_at_ms
  );
  if (hitGhostPhone || hitGhostComp) {
    return {
      clock,
      timeMs,
      isGhostOnly: true,
      readoutText: "nothing tracked here today",
    };
  }

  if (model.isNoData) {
    return {
      clock,
      timeMs,
      isGhostOnly: false,
      readoutText: "no data",
    };
  }

  return {
    clock,
    timeMs,
    isGhostOnly: false,
    readoutText: `${clock}  no active session`,
  };
}
