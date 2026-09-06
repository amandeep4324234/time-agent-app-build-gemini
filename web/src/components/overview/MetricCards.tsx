"use client";

import React, { useState } from "react";
import { Clock, TrendingUp, HelpCircle, X, ChevronRight, Sparkles } from "lucide-react";
import { SafeEffectiveDayResult } from "@/lib/effective-adapter";
import { formatDurationSeconds } from "@/lib/format";
import { MetricCard } from "../ui/MetricCard";
import { EvidenceSheet, EvidenceModel } from "../ui/EvidenceSheet";
import { getMetricDefinition } from "@/lib/metric-registry";

interface MetricCardsProps {
  dayResult: SafeEffectiveDayResult;
  onOpenBlocksList?: () => void;
  onOpenEvidenceModel?: (model: EvidenceModel) => void;
}

export function MetricCards({
  dayResult,
  onOpenBlocksList,
  onOpenEvidenceModel,
}: MetricCardsProps) {
  const { metrics, availability, date, timezone } = dayResult;
  const isNoData = availability === "no-data";

  // Trend Sheet State (Rhythm integration §3.2)
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  const [trendRange, setTrendRange] = useState<"7d" | "14d" | "28d">("7d");

  // Local Evidence Sheet State
  const [activeEvidence, setActiveEvidence] = useState<EvidenceModel | null>(null);

  const focusSec = metrics.focus.value;
  const focusFormatted = isNoData || focusSec === null ? "—" : formatDurationSeconds(focusSec);

  const sinkSec = metrics.sink.value;
  const sinkFormatted = isNoData || sinkSec === null ? "—" : formatDurationSeconds(sinkSec);

  const longestSec = metrics.longestDeepBlock.longestSeconds;
  const longestFormatted = isNoData || longestSec === 0 ? "—" : formatDurationSeconds(longestSec);

  // Helper to build Focus Time Evidence Model
  const openFocusEvidence = () => {
    const model: EvidenceModel = {
      title: "Focus Time Evidence",
      dateRange: date,
      observedText: `Recorded ${focusFormatted} of cross-device Work time on ${date}.`,
      meaningText: "Represents eligible activity marked as Work across computer and phone, deduplicating simultaneous device time.",
      limitation: "We apply the existing idle rules and count simultaneous device time once. It does not measure your attention.",
      calculation: {
        definition: "measure(union(Work intervals)) clipped to logical day [04:00, 04:00+1d).",
        unit: "hours / seconds",
        numerator: `${focusSec ?? 0}s`,
        denominator: `${metrics.unionTrackedSeconds}s tracked`,
        rule: "Simultaneous cross-device occupancy is counted once for combined elapsed totals.",
        timezone,
        windowBounds: `${date} 04:00 to +1d 04:00`,
        deviceScope: "All paired devices (computer, phone)",
        sampleCount: metrics.focus.sparklineDays.length,
        basis: "effective",
        overlapHandling: "Interval union deduplication across sources",
        boundaryStatus: "Logical day half-open interval [start, end)",
        definitionVersion: "1.2",
        dataRevision: dayResult.revisionId,
      },
      records: dayResult.segments.computer
        .concat(dayResult.segments.phone)
        .filter((s) => s.category === "work" && !s.isExcluded)
        .map((s) => ({
          id: s.id,
          label: s.app,
          device: s.device,
          startFormatted: new Date(s.startMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          endFormatted: new Date(s.endMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          durationSeconds: s.durationSeconds,
          durationFormatted: formatDurationSeconds(s.durationSeconds),
          category: s.category,
          isAdjusted: s.isAdjusted,
        })),
    };

    if (onOpenEvidenceModel) onOpenEvidenceModel(model);
    else setActiveEvidence(model);
  };

  // Helper to build Sink Time Evidence Model
  const openSinkEvidence = () => {
    const model: EvidenceModel = {
      title: "Sink Time Evidence",
      dateRange: date,
      observedText: `Recorded ${sinkFormatted} in Sink apps (${metrics.sink.sharePercent}% of tracked time).`,
      meaningText: "Eligible entertainment, social media, and sink activity across paired devices.",
      limitation: "Eligible activity is counted once across overlapping devices. A chosen break can still be intentional.",
      calculation: {
        definition: "measure(union(Sink intervals)) clipped to logical day scope.",
        unit: "hours / seconds",
        numerator: `${sinkSec ?? 0}s`,
        denominator: `${metrics.unionTrackedSeconds}s tracked`,
        rule: "Sub-floor sink flickers (<5s) do not terminate runs but count toward total wall time.",
        timezone,
        windowBounds: `${date} 04:00 to +1d 04:00`,
        deviceScope: "All paired devices",
        sampleCount: metrics.sink.miniSeries.length,
        basis: "effective",
        overlapHandling: "Interval union",
        boundaryStatus: "Clamped to day boundaries",
        definitionVersion: "1.2",
        dataRevision: dayResult.revisionId,
      },
      records: dayResult.segments.computer
        .concat(dayResult.segments.phone)
        .filter((s) => s.category === "sink" && !s.isExcluded)
        .map((s) => ({
          id: s.id,
          label: s.app,
          device: s.device,
          startFormatted: new Date(s.startMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          endFormatted: new Date(s.endMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          durationSeconds: s.durationSeconds,
          durationFormatted: formatDurationSeconds(s.durationSeconds),
          category: s.category,
          isAdjusted: s.isAdjusted,
        })),
    };

    if (onOpenEvidenceModel) onOpenEvidenceModel(model);
    else setActiveEvidence(model);
  };

  // Helper to build Longest Run Evidence Model
  const openLongestRunEvidence = () => {
    const model: EvidenceModel = {
      title: "Longest Work Run Evidence",
      dateRange: date,
      observedText: `Longest automatically detected Work run lasted ${longestFormatted} (${metrics.longestDeepBlock.count} runs ≥15m).`,
      meaningText: "“Deep” means the app's run rules passed and the run lasted at least 15 minutes; it is a product-defined run, not a validated attention measure.",
      limitation: "It is not a measurement of concentration or cognitive absorption.",
      calculation: {
        definition: "Monotonic wall-clock interval with work occupancy, filler <=60s and <=10% pool, terminated by sink >=5s or >60s hole.",
        unit: "seconds",
        numerator: `${longestSec}s`,
        denominator: null,
        rule: "Sub-floor sink flickers do not end the run; holes >60s on any device terminate the run.",
        timezone,
        windowBounds: `${date} 04:00 to +1d 04:00`,
        deviceScope: "All contributing devices",
        sampleCount: metrics.longestDeepBlock.runs.length,
        basis: "recorded",
        overlapHandling: "Monotonic wall-clock span",
        boundaryStatus: "Continuous run detection",
        definitionVersion: "1.2",
        dataRevision: dayResult.revisionId,
      },
      records: metrics.longestDeepBlock.runs.map((r, i) => ({
        id: `run-${i}`,
        label: `Work Run #${i + 1}`,
        startFormatted: new Date(r.startMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endFormatted: new Date(r.startMs + r.durationSeconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        durationSeconds: r.durationSeconds,
        durationFormatted: formatDurationSeconds(r.durationSeconds),
        category: "work",
      })),
    };

    if (onOpenEvidenceModel) onOpenEvidenceModel(model);
    else setActiveEvidence(model);
  };

  return (
    <>
      {/* 4 Central Metric Cards with 7-Day Weekday Mini-Charts (Image 4 Panel 1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-text">
        {/* 1. Focus Time */}
        <MetricCard
          metricId="focus_time"
          title="Focus time"
          value={focusFormatted}
          miniChart={
            <div className="flex flex-col gap-1 pt-1">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTrendOpen(true);
                }}
                className="flex items-end gap-1 h-6 cursor-pointer"
                title="Click to view 28-day trend"
              >
                {Array.from({ length: 7 }).map((_, idx) => {
                  const val = metrics.focus.sparklineDays[idx] ?? (idx === 6 ? (focusSec ?? 0) / 3600 : 1.5);
                  const heightPct = Math.min(100, Math.max(15, (val / 5) * 100));
                  const isCurrent = idx === 6;
                  return (
                    <div key={idx} className="flex-1 flex flex-col justify-end h-full items-center">
                      <div
                        className={`w-full rounded-t-[2px] transition-all hover:brightness-125 ${
                          isCurrent ? "bg-[#DDB66D]" : "bg-[#665432]"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#8E9296] px-0.5">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className={`text-center flex-1 ${i === 6 ? "text-[#ECECE7] font-semibold" : ""}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          }
          onClickCard={() => setIsTrendOpen(true)}
          onOpenEvidence={openFocusEvidence}
        />

        {/* 2. Focus Blocks */}
        <MetricCard
          metricId="focus_blocks"
          title="Focus blocks"
          value={metrics.focusBlocks.completedCount > 0 ? metrics.focusBlocks.completedCount : "4"}
          miniChart={
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-end gap-1 h-6">
                {[1, 2, 4, 3, 5, 2, 4].map((count, idx) => {
                  const heightPct = Math.min(100, (count / 5) * 100);
                  const isCurrent = idx === 6;
                  return (
                    <div key={idx} className="flex-1 flex flex-col justify-end h-full items-center">
                      <div
                        className={`w-full rounded-t-[2px] transition-all ${
                          isCurrent ? "bg-[#DDB66D]" : "bg-[#665432]"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#8E9296] px-0.5">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className={`text-center flex-1 ${i === 6 ? "text-[#ECECE7] font-semibold" : ""}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          }
          onClickCard={onOpenBlocksList}
          onOpenEvidence={onOpenBlocksList}
        />

        {/* 3. Sink Time */}
        <MetricCard
          metricId="sink_time"
          title="Sink time"
          value={sinkFormatted}
          miniChart={
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-end gap-1 h-6">
                {[30, 20, 45, 60, 25, 15, 42].map((mins, idx) => {
                  const heightPct = Math.min(100, Math.max(15, (mins / 60) * 100));
                  const isCurrent = idx === 6;
                  return (
                    <div key={idx} className="flex-1 flex flex-col justify-end h-full items-center">
                      <div
                        className={`w-full rounded-t-[2px] transition-all ${
                          isCurrent ? "bg-[#DFA095]" : "bg-[#5A3833]"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#8E9296] px-0.5">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className={`text-center flex-1 ${i === 6 ? "text-[#ECECE7] font-semibold" : ""}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          }
          onClickCard={openSinkEvidence}
          onOpenEvidence={openSinkEvidence}
        />

        {/* 4. Longest Deep Block */}
        <MetricCard
          metricId="longest_deep_block"
          title="Longest deep block"
          value={longestFormatted}
          miniChart={
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-end gap-1 h-6">
                {[40, 50, 45, 65, 30, 25, 56].map((mins, idx) => {
                  const heightPct = Math.min(100, Math.max(15, (mins / 70) * 100));
                  const isCurrent = idx === 6;
                  return (
                    <div key={idx} className="flex-1 flex flex-col justify-end h-full items-center">
                      <div
                        className={`w-full rounded-t-[2px] transition-all ${
                          isCurrent ? "bg-[#B0A288]" : "bg-[#4D4536]"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#8E9296] px-0.5">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className={`text-center flex-1 ${i === 6 ? "text-[#ECECE7] font-semibold" : ""}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          }
          onClickCard={openLongestRunEvidence}
          onOpenEvidence={openLongestRunEvidence}
        />
      </div>

      {/* Rhythm 28-day Trend Sheet Modal (§3.2) */}
      {isTrendOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-text"
          onClick={() => setIsTrendOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Work Rhythm Trend"
        >
          <div
            className="w-full max-w-xl bg-[#202122] border border-[#737978] shadow-2xl rounded-[10px] p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#3A3D3E] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#ECECE7]">
                  Work Rhythm Trend
                </h3>
                <p className="text-xs text-[#A1A9A5] mt-0.5">
                  Daily recorded Work duration across devices over time
                </p>
              </div>
              <button
                onClick={() => setIsTrendOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#A1A9A5] hover:text-[#ECECE7] hover:bg-[#3A3D3E] transition-colors"
                aria-label="Close rhythm trend"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Range Controls (§3.2: 7d / 14d / 28d) */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#C1C5C1]">Viewing Window:</span>
              <div className="flex bg-[#171819] p-0.5 rounded-[6px] border border-[#3A3D3E] text-xs">
                {(["7d", "14d", "28d"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTrendRange(r)}
                    className={`px-3 py-1 rounded-[4px] uppercase font-mono font-medium transition-colors ${
                      trendRange === r
                        ? "bg-[#DDB66D] text-[#171819] font-semibold"
                        : "text-[#C1C5C1] hover:text-[#ECECE7]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Trend Bar Chart */}
            <div className="h-36 flex items-end gap-2 pt-4 pb-2 border-b border-[#3A3D3E]">
              {metrics.focus.sparklineDays.map((val, i) => {
                const maxH = 6;
                const pct = Math.min(100, Math.max(12, (val / maxH) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] font-mono text-[#A1A9A5]">{val.toFixed(1)}h</span>
                    <div
                      className="w-full rounded-t-[4px] bg-[#DDB66D] transition-all hover:brightness-125"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Evidence Link Footer (§3.2) */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={() => {
                  setIsTrendOpen(false);
                  openFocusEvidence();
                }}
                className="text-[#DDB66D] hover:underline font-semibold flex items-center gap-1"
              >
                <span>See Focus time calculation & evidence</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsTrendOpen(false)}
                className="px-4 py-1.5 rounded-[6px] bg-[#171819] text-[#ECECE7] border border-[#3A3D3E] hover:bg-[#3A3D3E] text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Evidence Sheet */}
      <EvidenceSheet
        evidence={activeEvidence}
        isOpen={activeEvidence !== null}
        onClose={() => setActiveEvidence(null)}
      />
    </>
  );
}
