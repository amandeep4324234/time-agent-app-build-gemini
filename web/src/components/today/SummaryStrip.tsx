"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronRight } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { EvaluatedInsight } from "@/lib/observations";

interface SummaryStripProps {
  focusSeconds: number | null;
  sinkSeconds: number | null;
  deepBlocksCount: number;
  longestSeconds: number;
  topObservation?: EvaluatedInsight | null;
  onOpenEvidence: (evidence: EvaluatedInsight["evidence"]) => void;
  focusGoalHours?: number; // e.g. 4
  isNoData?: boolean;
  isLightDay?: boolean;
}

export function SummaryStrip({
  focusSeconds,
  sinkSeconds,
  deepBlocksCount,
  longestSeconds,
  topObservation,
  onOpenEvidence,
  focusGoalHours,
  isNoData = false,
  isLightDay = false,
}: SummaryStripProps) {
  const [activeTooltip, setActiveTooltip] = useState<"focus" | "sink" | null>(null);

  // Formatting per §4.2: "4h 12m", tabular nums mono
  const focusFormatted = focusSeconds !== null ? formatDuration(focusSeconds) : "—";
  const sinkFormatted = sinkSeconds !== null ? formatDuration(sinkSeconds) : "—";
  const longestFormatted = longestSeconds > 0 ? formatDuration(longestSeconds) : "0m";

  // Goal calculations (§6.2, §11.4: empty means unset, not zero)
  const hasGoal = focusGoalHours !== undefined && focusGoalHours !== null && focusGoalHours > 0;
  const focusGoalSeconds = hasGoal ? focusGoalHours * 3600 : 0;
  const currentFocus = focusSeconds || 0;
  const goalProgressPercent = hasGoal ? Math.min(100, Math.round((currentFocus / focusGoalSeconds) * 100)) : 0;
  const isGoalExceeded = hasGoal && currentFocus > focusGoalSeconds;
  const overageFormatted = isGoalExceeded ? formatDuration(currentFocus - focusGoalSeconds) : null;

  return (
    <section
      aria-label="Daily activity summary"
      className="p-4 sm:p-6 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-6"
    >
      {/* Upper Metrics Strip: Focus (Primary), Sink (Supporting), Deep blocks (§6.2) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
        {/* 1. Focus Time (Primary Duration: 56px desktop / 40px mobile, Amber) */}
        <div className="md:col-span-6 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#B0BBC9]">
            <span>Focus time · All devices</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === "focus" ? null : "focus")}
                aria-label="Focus time definition"
                className="text-[#94A1B2] hover:text-[#EDF1F5] p-0.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              {activeTooltip === "focus" && (
                <div className="absolute left-0 top-full mt-1 w-64 p-3 rounded-[6px] bg-[#202A36] border border-[#303B49] text-xs text-[#EDF1F5] shadow-xl z-50 leading-relaxed">
                  Recorded time in apps categorized as Work, after the existing idle adjustment. Overlapping device time is counted once. This does not measure attention.
                </div>
              )}
            </div>
          </div>

          <div className="text-4xl md:text-[56px] font-medium leading-none text-[#E4B45F] font-mono-nums tracking-tight">
            {focusFormatted}
          </div>

          {/* User-set Focus Goal Line (§6.2) */}
          {hasGoal && !isNoData && (
            <div className="flex flex-col gap-1 mt-2 max-w-sm">
              <div className="w-full h-1.5 rounded-[3px] bg-[#202A36] overflow-hidden">
                <div
                  className="h-full bg-[#E4B45F] rounded-[3px] transition-all duration-normal"
                  style={{ width: `${goalProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#94A1B2]">
                <span>Daily goal: {focusGoalHours}h</span>
                <span>
                  {isGoalExceeded
                    ? `${overageFormatted} above goal`
                    : `${goalProgressPercent}%`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Sink Time (Supporting Duration: 28px desktop / 24px mobile, Sink Red) */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#B0BBC9]">
            <span>Sink time · All devices</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === "sink" ? null : "sink")}
                aria-label="Sink time definition"
                className="text-[#94A1B2] hover:text-[#EDF1F5] p-0.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              {activeTooltip === "sink" && (
                <div className="absolute left-0 top-full mt-1 w-60 p-3 rounded-[6px] bg-[#202A36] border border-[#303B49] text-xs text-[#EDF1F5] shadow-xl z-50 leading-relaxed">
                  Recorded time in apps you categorize as Sinks.
                </div>
              )}
            </div>
          </div>

          <div className="text-2xl md:text-[28px] font-medium leading-tight text-[#F28D87] font-mono-nums">
            {sinkFormatted}
          </div>
        </div>

        {/* 3. Deep Blocks (Count plus Longest duration) */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#B0BBC9]">
            Deep blocks (≥15m)
          </span>
          <div className="text-2xl md:text-[28px] font-medium leading-tight text-[#EDF1F5] font-mono-nums flex items-baseline gap-2">
            <span>{deepBlocksCount}</span>
            <span className="text-xs font-normal text-[#94A1B2]">
              Longest <span className="text-[#EDF1F5] font-mono-nums">{longestFormatted}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Lower Observation Row (§6.2): single strongest observation or neutral coverage context */}
      <div className="pt-4 border-t border-[#303B49] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        {topObservation ? (
          <>
            <div className="flex items-center gap-2.5 text-[#EDF1F5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E4B45F] shrink-0" />
              <span className="text-sm font-normal leading-relaxed">
                {topObservation.insight.sentence}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenEvidence(topObservation.evidence)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#B0BBC9] hover:text-[#EDF1F5] self-start sm:self-auto shrink-0 transition-colors"
            >
              <span>View evidence</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="text-xs text-[#94A1B2]">
            {isNoData
              ? "No activity recorded for this date."
              : isLightDay
              ? "Limited activity recorded (<45m) — comparative insights suppressed."
              : "Coverage is recorded for today. No unusual patterns observed."}
          </div>
        )}
      </div>
    </section>
  );
}
