"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Clock,
  BarChart2,
  ListFilter,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Check,
  ArrowLeft,
  Sliders,
  Table as TableIcon,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { AppLensData, getAppInitials, getAppLensThresholdPartition } from "@/lib/app-lens";
import { Category } from "@/lib/types";
import { formatDurationSeconds } from "@/lib/format";
import { EvidenceSheet, EvidenceModel } from "../ui/EvidenceSheet";
import { ThresholdPartitionResult } from "@/lib/stat-utils";

interface AppLensSheetProps {
  data: AppLensData | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInTimeline?: () => void;
  onReviewCategory?: (appLabel: string, currentCat: Category) => void;
  onExcludeActivity?: (appLabel: string) => void;
  onOpenLogsPrefiltered?: (appKey: string, thresholdSeconds?: number) => void;
}

export function AppLensSheet({
  data,
  isOpen,
  onClose,
  onViewInTimeline,
  onReviewCategory,
  onExcludeActivity,
  onOpenLogsPrefiltered,
}: AppLensSheetProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "patterns" | "sessions">("patterns");
  const [chartMode, setChartMode] = useState<"segments" | "time">("segments");
  const [thresholdSeconds, setThresholdSeconds] = useState<number>(300);
  const [showTableAlternative, setShowTableAlternative] = useState<boolean>(false);
  const [customThresholdInput, setCustomThresholdInput] = useState<string>("300");

  // Subview state for detail navigation without stacked sheets (§3.0)
  const [subviewEvidence, setSubviewEvidence] = useState<EvidenceModel | null>(null);

  if (!isOpen || !data) return null;

  const initials = getAppInitials(data.friendlyName);

  // Dynamic partition based on threshold selection (§3.3)
  const partition: ThresholdPartitionResult = useMemo(() => {
    if (thresholdSeconds === 300 && data.thresholdPartition) return data.thresholdPartition;
    const slices = data.allSegments && data.allSegments.length > 0 ? data.allSegments : data.recentSessions;
    return getAppLensThresholdPartition(slices as any, thresholdSeconds);
  }, [data, thresholdSeconds]);

  // Subview Evidence Handler
  const handleOpenEvidence = (pattern: any) => {
    setSubviewEvidence({
      title: `${data.friendlyName} · Pattern Evidence`,
      dateRange: "Recorded activity",
      observedText: pattern.headline,
      meaningText: pattern.detail,
      limitation: "Reflects exported records and capture boundaries. Boundaries may differ from real visits.",
      calculation: {
        definition: "Empirical inverse-CDF and interval union across eligible segments.",
        unit: "seconds",
        numerator: null,
        denominator: null,
        rule: "Nearest-rank percentile Q(p) = d_sorted[ceil(p*N)], 1-based.",
        timezone: "Asia/Kolkata",
        windowBounds: "Selected query scope",
        deviceScope: "Paired devices",
        sampleCount: pattern.sampleCount,
        basis: "effective",
        overlapHandling: "Interval union",
        boundaryStatus: "Recorded segment timestamps",
        definitionVersion: "1.2",
        dataRevision: "rev-current",
      },
      records: data.recentSessions.map((s) => ({
        id: s.id,
        label: data.friendlyName,
        device: s.device,
        startFormatted: s.startedAtFormatted,
        endFormatted: "",
        durationFormatted: s.durationFormatted,
        durationSeconds: s.durationSeconds,
        category: s.category,
        appraisal: s.appraisal,
        isAdjusted: s.isAdjusted,
      })),
    });
  };

  if (subviewEvidence) {
    return (
      <EvidenceSheet
        evidence={subviewEvidence}
        isOpen={true}
        onClose={onClose}
        onBack={() => setSubviewEvidence(null)}
        backTitle={data.friendlyName}
      />
    );
  }

  const thresholdLabel = formatDurationSeconds(thresholdSeconds);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex justify-end transition-opacity select-text"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${data.friendlyName} lens`}
    >
      <div
        className="w-full sm:w-[480px] lg:w-[500px] h-full bg-[#161718] border-l border-[#2B2D30] shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2A2C2E] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs text-[#8E9296] hover:text-[#ECECE7] flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[#8E9296] hover:text-[#ECECE7] hover:bg-[#202122] transition-colors"
              aria-label="Close App lens"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* App Icon */}
              <div className="w-12 h-12 rounded-[12px] bg-gradient-to-tr from-[#E1306C] via-[#FD1D1D] to-[#F77737] flex items-center justify-center text-white font-bold text-base shadow-md">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#ECECE7] leading-tight">
                  {data.friendlyName}
                </h2>
                <div className="flex items-center gap-1 text-xs text-[#8E9296] mt-0.5">
                  <span>Last 7 days</span>
                  <span className="text-[10px]">▼</span>
                </div>
              </div>
            </div>
          </div>

          {/* Underlined Navigation Tabs (Image 4 Panel 2) */}
          <div className="flex border-b border-[#2A2C2E] text-xs font-medium">
            {(["summary", "patterns", "sessions"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-3 capitalize transition-colors relative ${
                    isActive
                      ? "text-[#ECECE7] font-semibold"
                      : "text-[#8E9296] hover:text-[#ECECE7]"
                  }`}
                >
                  {tab}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DDB66D]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* TAB: PATTERNS (Image 4 Panel 2 Hero View) */}
          {activeTab === "patterns" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-semibold text-[#ECECE7]">
                  Most segments are short
                </h3>
                <p className="text-xs text-[#8E9296] mt-1">
                  You tend to open {data.friendlyName} for brief moments throughout the day.
                </p>
              </div>

              {/* Histogram Chart */}
              <div className="bg-[#1C1D1F] border border-[#2A2C2E] rounded-[10px] p-4 flex flex-col gap-3">
                <span className="text-[10px] uppercase font-mono text-[#8E9296]">
                  Number of segments
                </span>

                <div className="h-36 flex items-end justify-between gap-3 pt-2 pb-1 border-b border-[#2A2C2E]">
                  {[
                    { label: "< 1m", count: 60, pct: 100 },
                    { label: "1–5m", count: 22, pct: 36 },
                    { label: "5–10m", count: 8, pct: 13 },
                    { label: "10–30m", count: 3, pct: 5 },
                    { label: "> 30m", count: 1, pct: 2 },
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full bg-[#E58376] rounded-t-[3px] transition-all hover:brightness-110"
                        style={{ height: `${bar.pct}%` }}
                        title={`${bar.label}: ${bar.count} segments`}
                      />
                      <span className="text-[10px] text-[#8E9296] mt-1.5 font-mono whitespace-nowrap">
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-center text-[10px] text-[#8E9296]">
                  Segment duration
                </div>
              </div>

              {/* Stat Summary Row */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E]">
                <div>
                  <div className="text-xs font-semibold text-[#ECECE7]">
                    121 of 151 segments under 1m
                  </div>
                  <div className="text-[10px] text-[#8E9296] mt-0.5">
                    Across 7 days (Apr 16 – Apr 22, 2024)
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-[#8E9296]">Median duration</div>
                  <div className="text-xl font-bold font-mono text-[#ECECE7]">14s</div>
                </div>
              </div>

              {/* Action Buttons (Amber filled + Outline) */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onReviewCategory?.(data.rawLabel, data.category);
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-[8px] bg-[#DDB66D] text-[#121314] hover:bg-[#E5C27C] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Review activity</span>
                </button>

                <button
                  onClick={() => {
                    onOpenLogsPrefiltered?.(data.rawLabel);
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-[8px] bg-[#1C1D1F] border border-[#2A2C2E] text-[#ECECE7] hover:bg-[#2A2C2E] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-[#8E9296]" />
                  <span>View segments</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="flex flex-col gap-4">
              {/* Empirical Duration Distribution with Threshold Explorer (§3.3) */}
              <div className="p-4 rounded-[10px] bg-[#171819] border border-[#3A3D3E] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#ECECE7]">
                    Empirical Duration Distribution
                  </span>

                  {/* Toggle Modes: Segments vs Time Contributed (§3.3) */}
                  <div className="flex bg-[#202122] p-0.5 rounded-[6px] border border-[#3A3D3E] text-[11px]">
                    <button
                      onClick={() => setChartMode("segments")}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        chartMode === "segments"
                          ? "bg-[#DDB66D] text-[#171819] font-semibold"
                          : "text-[#C1C5C1] hover:text-[#ECECE7]"
                      }`}
                    >
                      Segments
                    </button>
                    <button
                      onClick={() => setChartMode("time")}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        chartMode === "time"
                          ? "bg-[#DDB66D] text-[#171819] font-semibold"
                          : "text-[#C1C5C1] hover:text-[#ECECE7]"
                      }`}
                    >
                      Time contributed
                    </button>
                  </div>
                </div>

                {/* Threshold Controls (§3.3: 30s, 1m, 5m, 10m preset buttons + exact custom duration) */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#202122] p-2 rounded-[6px] border border-[#3A3D3E]">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#DDB66D]" />
                    <span className="text-[11px] text-[#C1C5C1]">
                      Threshold: <strong className="text-[#ECECE7]">{thresholdLabel}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    {[30, 60, 300, 600].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => {
                          setThresholdSeconds(sec);
                          setCustomThresholdInput(String(sec));
                        }}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          thresholdSeconds === sec
                            ? "bg-[#DDB66D] text-[#171819] font-bold border-[#DDB66D]"
                            : "bg-[#171819] text-[#C1C5C1] border-[#3A3D3E] hover:text-[#ECECE7]"
                        }`}
                      >
                        {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                      </button>
                    ))}
                    <div className="flex items-center gap-1 pl-1 border-l border-[#3A3D3E]">
                      <input
                        type="number"
                        min={1}
                        max={86400}
                        value={customThresholdInput}
                        onChange={(e) => {
                          setCustomThresholdInput(e.target.value);
                          const parsed = parseInt(e.target.value, 10);
                          if (!isNaN(parsed) && parsed > 0) {
                            setThresholdSeconds(parsed);
                          }
                        }}
                        placeholder="sec"
                        aria-label="Custom threshold in seconds"
                        className="w-14 px-1.5 py-0.5 rounded bg-[#171819] border border-[#3A3D3E] text-[11px] text-[#ECECE7] font-mono focus:outline-none focus:border-[#DDB66D]"
                      />
                      <span className="text-[10px] text-[#A1A9A5]">s</span>
                    </div>
                  </div>
                </div>

                {/* Numerical Callout (§3.3) */}
                <div className="p-2.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-xs leading-relaxed text-[#C1C5C1]">
                  {chartMode === "segments" ? (
                    <div>
                      Segments &gt; {thresholdLabel}:{" "}
                      <strong className="text-[#DDB66D]">
                        {partition.segmentsOver} of {partition.totalSegments}
                      </strong>{" "}
                      ({partition.shareOverPercent ?? 0}%)
                    </div>
                  ) : (
                    <div>
                      Time in segments &gt; {thresholdLabel}:{" "}
                      <strong className="text-[#DDB66D]">
                        {formatDurationSeconds(partition.unionSecondsOver)}
                      </strong>{" "}
                      of {formatDurationSeconds(partition.unionSecondsTotal)} union (
                      {partition.unionShareOverPercent ?? 0}%)
                    </div>
                  )}
                </div>

                {/* Plot Area: 180–220px high (§3.3) */}
                {!showTableAlternative ? (
                  <div className="h-44 bg-[#202122] rounded-[6px] border border-[#3A3D3E] p-3 flex flex-col justify-between">
                    <div className="flex justify-between text-[10px] font-mono text-[#A1A9A5]">
                      <span>0s</span>
                      <span className="text-[#DDB66D] font-bold">Threshold: {thresholdLabel}</span>
                      <span>15m+</span>
                    </div>

                    {/* Bars visual representation */}
                    <div className="flex items-end gap-2 h-28 border-b border-[#3A3D3E] pb-1">
                      <div className="flex-1 flex flex-col items-center h-full justify-end">
                        <span className="text-[10px] font-mono text-[#A1A9A5]">
                          {chartMode === "segments"
                            ? partition.segmentsUnderOrEqual
                            : formatDurationSeconds(partition.unionSecondsTotal - partition.unionSecondsOver)}
                        </span>
                        <div
                          className="w-full bg-[#3A3D3E] rounded-t-[4px] transition-all"
                          style={{
                            height: `${Math.max(
                              8,
                              chartMode === "segments"
                                ? partition.shareUnderOrEqualPercent ?? 10
                                : 100 - (partition.unionShareOverPercent ?? 0)
                            )}%`,
                          }}
                          title={`<= ${thresholdLabel}`}
                        />
                        <span className="text-[10px] mt-1 text-[#A1A9A5]">≤ {thresholdLabel}</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center h-full justify-end">
                        <span className="text-[10px] font-mono text-[#DDB66D] font-bold">
                          {chartMode === "segments"
                            ? partition.segmentsOver
                            : formatDurationSeconds(partition.unionSecondsOver)}
                        </span>
                        <div
                          className="w-full bg-[#DDB66D] rounded-t-[4px] transition-all"
                          style={{
                            height: `${Math.max(
                              8,
                              chartMode === "segments"
                                ? partition.shareOverPercent ?? 10
                                : partition.unionShareOverPercent ?? 10
                            )}%`,
                          }}
                          title={`> ${thresholdLabel}`}
                        />
                        <span className="text-[10px] mt-1 text-[#DDB66D]">&gt; {thresholdLabel}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] text-[#A1A9A5]">
                        Sparse 2px data line visual partition
                      </span>
                      <button
                        onClick={() => setShowTableAlternative(true)}
                        className="text-[11px] text-[#C1C5C1] hover:text-[#ECECE7] flex items-center gap-1"
                      >
                        <TableIcon className="w-3 h-3" />
                        <span>View table alternative</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Accessible Table Alternative (§3.3) */
                  <div className="flex flex-col gap-2">
                    <div className="rounded-[6px] border border-[#3A3D3E] overflow-hidden bg-[#202122] text-xs">
                      <table className="w-full text-left divide-y divide-[#3A3D3E]">
                        <thead className="bg-[#171819] text-[10px] font-mono text-[#A1A9A5] uppercase">
                          <tr>
                            <th className="p-2">Range</th>
                            <th className="p-2">Count</th>
                            <th className="p-2">Union Duration</th>
                            <th className="p-2">Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A3D3E] text-[11px]">
                          <tr>
                            <td className="p-2">≤ {thresholdLabel}</td>
                            <td className="p-2 font-mono">{partition.segmentsUnderOrEqual}</td>
                            <td className="p-2 font-mono">
                              {formatDurationSeconds(partition.unionSecondsTotal - partition.unionSecondsOver)}
                            </td>
                            <td className="p-2 font-mono">{partition.shareUnderOrEqualPercent ?? 0}%</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-[#DDB66D]">&gt; {thresholdLabel}</td>
                            <td className="p-2 font-mono text-[#DDB66D]">{partition.segmentsOver}</td>
                            <td className="p-2 font-mono text-[#DDB66D]">
                              {formatDurationSeconds(partition.unionSecondsOver)}
                            </td>
                            <td className="p-2 font-mono text-[#DDB66D]">{partition.unionShareOverPercent ?? 0}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <button
                      onClick={() => setShowTableAlternative(false)}
                      className="text-[11px] text-[#DDB66D] hover:underline self-end"
                    >
                      ← Back to visual chart
                    </button>
                  </div>
                )}
              </div>

              {/* Actions (§3.0, §3.3) */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => {
                    onOpenLogsPrefiltered?.(data.rawLabel, thresholdSeconds);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-[6px] bg-[#ECECE7] text-[#171819] hover:bg-white text-xs font-semibold transition-colors text-center shadow-sm"
                >
                  View {partition.segmentsOver} matching segments in Logs
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onReviewCategory?.(data.rawLabel, data.category);
                      onClose();
                    }}
                    className="py-2 px-3 rounded-[6px] bg-[#171819] hover:bg-[#3A3D3E] text-xs text-[#C1C5C1] hover:text-[#ECECE7] border border-[#3A3D3E] transition-colors text-center"
                  >
                    Change category
                  </button>
                  <button
                    onClick={() => {
                      onExcludeActivity?.(data.rawLabel);
                      onClose();
                    }}
                    className="py-2 px-3 rounded-[6px] bg-[#171819] hover:bg-[#DFA095]/10 text-xs text-[#DFA095] border border-[#3A3D3E] transition-colors text-center"
                  >
                    Exclude from analysis
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* TAB 3: SESSIONS (§3.3) */}
          {activeTab === "sessions" && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#A1A9A5]">
                  Recorded safe segments ({data.recentSessions.length})
                </span>
                <button
                  onClick={() => {
                    onOpenLogsPrefiltered?.(data.rawLabel);
                    onClose();
                  }}
                  className="text-[11px] text-[#DDB66D] hover:underline font-semibold"
                >
                  Open in Logs →
                </button>
              </div>

              <div className="divide-y divide-[#3A3D3E] border border-[#3A3D3E] rounded-[8px] overflow-hidden bg-[#171819]">
                {data.recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 flex items-center justify-between hover:bg-[#202122] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#ECECE7]">{s.startedAtFormatted}</span>
                      <span className="text-[10px] font-mono text-[#A1A9A5] px-1 rounded bg-[#202122] border border-[#3A3D3E]">
                        {s.device}
                      </span>
                      {s.appraisal && s.appraisal !== "unreviewed" && (
                        <span className="text-[10px] px-1 rounded bg-[#DDB66D]/10 text-[#DDB66D] border border-[#DDB66D]/20 capitalize">
                          {s.appraisal}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-medium text-[#DDB66D]">
                      {s.durationFormatted}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-2 rounded-[6px] bg-[#171819]/50 border border-[#3A3D3E] text-[11px] text-[#A1A9A5] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#90D2BC]" />
                <span>Protected and private activities are filtered from this view.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#3A3D3E] bg-[#171819]/60 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-[#A1A9A5]">
            Timeframe App Observatory
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[6px] bg-[#171819] text-[#ECECE7] border border-[#3A3D3E] hover:bg-[#3A3D3E] text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
