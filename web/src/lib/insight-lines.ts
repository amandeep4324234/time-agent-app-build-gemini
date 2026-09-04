import { DayMetrics, EnrichedSession, FocusRun } from "./types";
import { formatClock, formatDuration, formatHoursDuration, maskFencedLabel } from "./format";

export interface InsightLineItem {
  id: string;
  type: "focus_hours" | "sink_hours" | "deep_blocks" | "top_sink" | "hours_by_source" | "return_after_sink";
  text: string;
  target?: "timeline" | "sink" | "best_run";
  targetTimeMs?: number;
}

export function generateInsightLines(
  metrics: DayMetrics,
  runs: FocusRun[],
  daySessions: EnrichedSession[],
  tz = "Asia/Kolkata"
): InsightLineItem[] {
  const lines: InsightLineItem[] = [];

  // No-data variant (UI.md §3.2)
  if (daySessions.length === 0) {
    const lastWrite = metrics.sources.lastWritePhone || metrics.sources.lastWriteComputer || "14:00";
    lines.push({
      id: "no_data",
      type: "focus_hours",
      text: `No data for ${metrics.date} — tracker last wrote ${lastWrite}.`,
    });
    return lines;
  }

  // Light-day prefix (UI.md §3.2: < 45 tracked min)
  const isLight = metrics.lightDay;
  const trackedMins = Math.round((metrics.lab?.unionHours ?? (metrics.focusHours + metrics.sinkHours)) * 60);
  const lightPrefix = isLight ? `Light day: ${trackedMins}m tracked. ` : "";

  // 1. FOCUS_HOURS: "Focus {H}h {M}m across {runs} runs."
  const focusDur = formatHoursDuration(metrics.focusHours);
  const runCount = runs.length;
  lines.push({
    id: "focus_hours",
    type: "focus_hours",
    text: `${lightPrefix}Focus ${focusDur} across ${runCount} runs.`,
    target: "timeline",
  });

  // 2. SINK_HOURS: "Sinks took {H}h {M}m — {pct}% of tracked time."
  const sinkDur = formatHoursDuration(metrics.sinkHours);
  const sinkPct = Math.round(metrics.mix.shares.sinkPercent);
  lines.push({
    id: "sink_hours",
    type: "sink_hours",
    text: `Sinks took ${sinkDur} — ${sinkPct}% of tracked time.`,
    target: "sink",
  });

  // 3. DEEP_BLOCKS: "{n} runs >= 15 min. Best: {best} min ({start}-{end})."
  // Suppressed on light days
  if (!isLight && runs.length > 0) {
    const deepRuns = runs.filter((r) => r.durationSeconds >= 15 * 60);
    const bestRun = [...runs].sort((a, b) => b.durationSeconds - a.durationSeconds)[0];
    if (bestRun) {
      const bestMins = Math.round(bestRun.durationSeconds / 60);
      const startClock = formatClock(bestRun.startMs, tz);
      const endClock = formatClock(bestRun.endMs, tz);
      lines.push({
        id: "deep_blocks",
        type: "deep_blocks",
        text: `${deepRuns.length} runs >= 15 min. Best: ${bestMins} min (${startClock}-${endClock}).`,
        target: "best_run",
        targetTimeMs: bestRun.startMs,
      });
    }
  }

  // 4. TOP_SINK: "Top sink: {label} — {H}h {M}m, killed {k} runs."
  if (metrics.topSinks.length > 0) {
    const top = metrics.topSinks[0];
    const topLabel = maskFencedLabel(top.label, top.isPrivate);
    const topDur = formatHoursDuration(top.unionHours);

    // Count runs killed by this top sink
    const killedRunsCount = runs.filter(
      (r) =>
        r.ended_by === "sink" &&
        (r.killerApp === top.label || (top.isPrivate && r.killerApp === "private"))
    ).length;

    lines.push({
      id: "top_sink",
      type: "top_sink",
      text: `Top sink: ${topLabel} — ${topDur}, killed ${killedRunsCount} runs.`,
      target: "sink",
    });
  }

  // 5. HOURS_BY_SOURCE: "Phone {H1} | computer {H2}."
  const phoneH = metrics.sources.phoneHours !== null ? formatHoursDuration(metrics.sources.phoneHours) : "0m";
  const compH = metrics.sources.computerHours !== null ? formatHoursDuration(metrics.sources.computerHours) : "0m";
  lines.push({
    id: "hours_by_source",
    type: "hours_by_source",
    text: `Phone ${phoneH} | computer ${compH}.`,
    target: "timeline",
  });

  // 6. RETURN_AFTER_SINK: "Median return to focus: {M}m {S}s after a sink."
  // Suppressed on light days
  if (!isLight) {
    const sinkKilledRuns = runs.filter((r) => r.ended_by === "sink");
    const returnGapsSec: number[] = [];

    for (const r of sinkKilledRuns) {
      const nextWork = daySessions.find(
        (s) => s.category === "work" && s.started_at_ms > r.endMs
      );
      if (nextWork) {
        returnGapsSec.push((nextWork.started_at_ms - r.endMs) / 1000);
      }
    }

    if (returnGapsSec.length >= 1) {
      returnGapsSec.sort((a, b) => a - b);
      const medianSec = returnGapsSec[Math.floor(returnGapsSec.length / 2)];
      const m = Math.floor(medianSec / 60);
      const s = Math.round(medianSec % 60);
      lines.push({
        id: "return_after_sink",
        type: "return_after_sink",
        text: `Median return to focus: ${m}m ${s}s after a sink.`,
        target: "sink",
      });
    }
  }

  return lines;
}
