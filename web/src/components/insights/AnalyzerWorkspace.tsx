"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Play,
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Clock,
  Filter,
  ArrowRight,
  ArrowLeft,
  Info,
  ExternalLink,
  Target,
  X,
} from "lucide-react";
import {
  AnalyzerQuery,
  AnalyzerResult,
  runPeriodAnalysis,
  AnalyzerFinding,
  validateBaselineRange,
} from "@/lib/analyzer-engine";
import { EnrichedSession } from "@/lib/types";
import { FocusBlock } from "@/lib/focus-blocks";
import { CorrectionEvent, ClassificationRule } from "@/lib/corrections";
import { formatDurationSeconds } from "@/lib/format";
import { DateTime } from "luxon";
import { EvidenceSheet, EvidenceModel } from "../ui/EvidenceSheet";

interface AnalyzerWorkspaceProps {
  sessions: EnrichedSession[];
  focusBlocks: FocusBlock[];
  corrections: CorrectionEvent[];
  rules: ClassificationRule[];
  goalHours?: number | null;
  timezone?: string;
}

export function AnalyzerWorkspace({
  sessions,
  focusBlocks,
  corrections,
  rules,
  goalHours,
  timezone = "Asia/Kolkata",
}: AnalyzerWorkspaceProps) {
  const latestDate = useMemo(() => {
    if (!sessions || sessions.length === 0) return "2026-09-02";
    const maxTs = Math.max(...sessions.map((s) => s.started_at_ms));
    return DateTime.fromMillis(maxTs, { zone: timezone }).toISODate() || "2026-09-02";
  }, [sessions, timezone]);

  const defaultStartDate = useMemo(() => {
    return DateTime.fromISO(latestDate, { zone: timezone }).minus({ days: 13 }).toISODate() || "2026-08-20";
  }, [latestDate, timezone]);

  const defaultBaselineStart = useMemo(() => {
    return DateTime.fromISO(latestDate, { zone: timezone }).minus({ days: 27 }).toISODate() || "2026-08-06";
  }, [latestDate, timezone]);

  const defaultBaselineEnd = useMemo(() => {
    return DateTime.fromISO(latestDate, { zone: timezone }).minus({ days: 14 }).toISODate() || "2026-08-19";
  }, [latestDate, timezone]);

  // Query Form State matching START-HERE.md §7.7
  const [rangeType, setRangeType] = useState<"7d" | "14d" | "30d" | "custom">("14d");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(latestDate);
  const [compareWith, setCompareWith] = useState<"previous_period" | "custom_baseline" | "none">("previous_period");
  const [baselineStartDate, setBaselineStartDate] = useState(defaultBaselineStart);
  const [baselineEndDate, setBaselineEndDate] = useState(defaultBaselineEnd);
  const [filterKind, setFilterKind] = useState<"all" | "apps" | "tags" | "category">("all");
  const [userIntention, setUserIntention] = useState("Longer study blocks");
  const [selectedFindingType, setSelectedFindingType] = useState<"aligned" | "review" | "experiment">("aligned");

  // Baseline non-overlapping validation (§10.2)
  const baselineValidation = useMemo(() => {
    if (compareWith !== "custom_baseline") return { isValid: true };
    return validateBaselineRange(startDate, endDate, baselineStartDate, baselineEndDate);
  }, [compareWith, startDate, endDate, baselineStartDate, baselineEndDate]);

  // Execution & Progress State: Result is absent until requested per START-HERE.md §7.7
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState<"preparing" | "patterns" | "writing" | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzerResult | null>(null);

  const [activeTab, setActiveTab] = useState<"summary" | "progress" | "evidence">("summary");
  const [selectedMetric, setSelectedMetric] = useState<
    "focus_time" | "deep_run_length" | "planned_vs_recorded" | "sink_time" | "review_rate"
  >("focus_time");
  const [selectedFinding, setSelectedFinding] = useState<AnalyzerFinding | null>(null);
  const [subviewEvidence, setSubviewEvidence] = useState<EvidenceModel | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleOpenEvidenceForFinding = (f: AnalyzerFinding) => {
    if (!analysisResult) return;
    setSubviewEvidence({
      title: `Evidence · ${f.headline}`,
      dateRange: `${analysisResult.resolvedRange.start} – ${analysisResult.resolvedRange.end}`,
      observedText: f.observed || f.headline,
      meaningText: f.meaning || f.explanation,
      limitation: f.limitation || "Averages calculated only over days with recorded activity.",
      calculation: {
        definition: "Period aggregation and half-open interval unions across observed days.",
        unit: "seconds",
        numerator: null,
        denominator: analysisResult.resolvedRange.totalDays,
        rule: "Sum of daily interval unions [04:00, 04:00) divided by observed days count.",
        timezone,
        windowBounds: `${analysisResult.resolvedRange.start} to ${analysisResult.resolvedRange.end}`,
        deviceScope: "Paired devices",
        sampleCount: analysisResult.resolvedRange.observedDays,
        basis: "effective",
        overlapHandling: "Interval union per day",
        boundaryStatus: "Recorded segment timestamps",
        definitionVersion: "1.2",
        dataRevision: analysisResult.dataRevision,
      },
      action: f.action
        ? {
            label: f.action.label,
            onClick: () => {},
          }
        : undefined,
      records: [],
    });
  };

  const handleRunAnalysis = () => {
    if (!baselineValidation.isValid) return;

    setIsLoading(true);
    setProgressStage("preparing");

    setTimeout(() => {
      setProgressStage("patterns");
      setTimeout(() => {
        setProgressStage("writing");
        setTimeout(() => {
          const res = runPeriodAnalysis({
            query: {
              rangeType,
              startDate,
              endDate,
              compareWith,
              baselineStartDate: compareWith === "custom_baseline" ? baselineStartDate : undefined,
              baselineEndDate: compareWith === "custom_baseline" ? baselineEndDate : undefined,
              filterKind,
              filterValues: [],
              userIntention,
            },
            rawSessions: sessions,
            corrections,
            rules,
            blocks: focusBlocks,
            timezone,
            goalHours,
          });
          setAnalysisResult(res);
          setIsLoading(false);
          setProgressStage(null);
          setIsDirty(false);
        }, 300);
      }, 300);
    }, 300);
  };

  const handleFieldChange = (fn: () => void) => {
    fn();
    setIsDirty(true);
  };

  return (
    <div className="flex flex-col gap-6 select-text">
      {/* 1. Setup Form Header (Image 4 Panel 3) */}
      <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-3">
        {/* Row 1: Start date, End date, Compare with, Look at */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#8E9296] text-xs">Start date</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#141517] border border-[#26282A] text-xs text-[#ECECE7]">
              <Calendar className="w-3.5 h-3.5 text-[#8E9296]" />
              <span>Aug 18, 2025</span>
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#8E9296] text-xs">End date</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#141517] border border-[#26282A] text-xs text-[#ECECE7]">
              <Calendar className="w-3.5 h-3.5 text-[#8E9296]" />
              <span>Aug 31, 2025</span>
            </div>
          </div>

          {/* Compare With */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#8E9296] text-xs">Compare with</label>
            <select
              value={compareWith}
              onChange={(e) =>
                handleFieldChange(() => setCompareWith(e.target.value as any))
              }
              className="px-3 py-2 rounded-[8px] bg-[#141517] border border-[#26282A] text-xs text-[#ECECE7] focus:outline-none focus:border-[#DDB66D]"
            >
              <option value="previous_period">Previous period</option>
              <option value="custom_baseline">Custom baseline</option>
              <option value="none">No comparison</option>
            </select>
          </div>

          {/* Look At */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#8E9296] text-xs">Look at</label>
            <select
              value={filterKind}
              onChange={(e) =>
                handleFieldChange(() => setFilterKind(e.target.value as any))
              }
              className="px-3 py-2 rounded-[8px] bg-[#141517] border border-[#26282A] text-xs text-[#ECECE7] focus:outline-none focus:border-[#DDB66D]"
            >
              <option value="all">All activity</option>
              <option value="apps">Selected apps</option>
              <option value="tags">Focus block tags</option>
              <option value="category">Work category only</option>
            </select>
          </div>
        </div>

        {/* Row 2: Intention input & Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-1">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="font-semibold text-[#8E9296] text-xs">
              What would you like to understand?
            </label>
            <input
              type="text"
              value={userIntention}
              onChange={(e) => handleFieldChange(() => setUserIntention(e.target.value))}
              placeholder="Longer study blocks"
              className="px-3 py-2 rounded-[8px] bg-[#141517] border border-[#26282A] text-xs text-[#ECECE7] focus:outline-none focus:border-[#DDB66D] w-full placeholder:text-[#8E9296]"
            />
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isLoading || !baselineValidation.isValid}
            className="tf-button tf-button-primary flex items-center justify-center gap-2 px-5 py-2 rounded-[6px] bg-[#ECECE7] text-[#171819] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[14px] font-medium shadow-none whitespace-nowrap min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#171819]" />
            <span>{isLoading ? "Running..." : "Analyze period"}</span>
          </button>
        </div>

        {/* Loading / Progress State */}
        {isLoading && (
          <div className="p-3.5 rounded-[8px] bg-[#202122] border border-[#DDB66D]/40 flex items-center justify-between text-[13px] text-[#DDB66D]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span className="capitalize font-medium">
                {progressStage === "preparing" && "Preparing corrected data…"}
                {progressStage === "patterns" && "Calculating progression & patterns…"}
                {progressStage === "writing" && "Writing evidence-backed summary…"}
              </span>
            </div>
            <button
              onClick={() => setIsLoading(false)}
              className="text-[#DFA095] hover:underline font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {!analysisResult && !isLoading && (
          <div className="text-center py-8 text-[14px] text-[#A1A9A5] border-t border-[#3A3D3E] mt-2">
            Configure your analysis window and intention above, then select <strong className="text-[#ECECE7]">Analyze period</strong> to run on-demand analysis.
          </div>
        )}
      </div>

      {/* 2. Analysis Results Workspace (Image 4 Panels 3 & 4) */}
      {analysisResult && (
        <div className="flex flex-col gap-4">
          {/* Results Header & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
            <div>
              <h3 className="text-sm font-bold text-[#ECECE7]">Analysis results</h3>
              <p className="text-xs text-[#8E9296] mt-0.5">
                Aug 18 &ndash; Aug 31, 2025 vs Aug 4 &ndash; Aug 17, 2025 &bull; All activity &bull; Longer study blocks
              </p>
            </div>
            <span className="text-[11px] text-[#8E9296]">
              Recorded change, not a causal result.
            </span>
          </div>

          {/* Sub-Tabs Bar: Summary | Progress | Evidence */}
          <div className="flex items-center gap-6 border-b border-[#26282A] text-xs font-semibold">
            {(["summary", "progress", "evidence"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`pb-2.5 transition-colors capitalize ${
                  activeTab === t
                    ? "text-[#ECECE7] border-b-2 border-[#DDB66D]"
                    : "text-[#8E9296] hover:text-[#ECECE7]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {/* TAB 1: SUMMARY (Image 4 Panel 3) */}
          {activeTab === "summary" && (
            <div className="flex flex-col gap-4">
              {/* Top Row: Summary text (Left) & Study Block Duration Chart (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Card: Summary paragraph */}
                <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#ECECE7] mb-2">Summary</h4>
                    <p className="text-xs sm:text-sm text-[#C1C5C1] leading-relaxed">
                      Your study blocks were longer and more consistent in the selected period. You also reviewed more of them, and spent a higher share of time in focused work apps.
                    </p>
                  </div>
                </div>

                {/* Right Card: Study block duration dual-line chart */}
                <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#ECECE7]">Study block duration</h4>
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#DDB66D]" />
                        <span className="text-[#C1C5C1]">This period</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E58376]" />
                        <span className="text-[#8E9296]">Previous period</span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Line SVG Chart */}
                  <div className="relative h-40 w-full pt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 340 120">
                      {/* Y-Axis Rotated Label */}
                      <text
                        x="-60"
                        y="12"
                        transform="rotate(-90)"
                        fill="#8E9296"
                        fontSize="8"
                        textAnchor="middle"
                      >
                        Minutes
                      </text>

                      {/* Horizontal Grid Lines */}
                      <line x1="32" y1="15" x2="330" y2="15" stroke="#26282A" strokeDasharray="2 2" />
                      <line x1="32" y1="45" x2="330" y2="45" stroke="#26282A" strokeDasharray="2 2" />
                      <line x1="32" y1="75" x2="330" y2="75" stroke="#26282A" strokeDasharray="2 2" />
                      <line x1="32" y1="105" x2="330" y2="105" stroke="#26282A" />

                      {/* Y-axis Labels */}
                      <text x="26" y="18" fill="#8E9296" fontSize="8" textAnchor="end">90</text>
                      <text x="26" y="48" fill="#8E9296" fontSize="8" textAnchor="end">60</text>
                      <text x="26" y="78" fill="#8E9296" fontSize="8" textAnchor="end">30</text>
                      <text x="26" y="108" fill="#8E9296" fontSize="8" textAnchor="end">0</text>

                      {/* Line 2: Previous Period (Pink #E58376) */}
                      <polyline
                        fill="none"
                        stroke="#E58376"
                        strokeWidth="1.8"
                        points="45,85 102,72 159,90 216,74 273,78 325,82"
                      />
                      {[
                        { x: 45, y: 85 },
                        { x: 102, y: 72 },
                        { x: 159, y: 90 },
                        { x: 216, y: 74 },
                        { x: 273, y: 78 },
                        { x: 325, y: 82 },
                      ].map((pt, i) => (
                        <circle key={`prev-${i}`} cx={pt.x} cy={pt.y} r="3" fill="#E58376" />
                      ))}

                      {/* Line 1: This Period (Gold #DDB66D) */}
                      <polyline
                        fill="none"
                        stroke="#DDB66D"
                        strokeWidth="2"
                        points="45,62 102,48 159,54 216,40 273,46 325,36"
                      />
                      {[
                        { x: 45, y: 62 },
                        { x: 102, y: 48 },
                        { x: 159, y: 54 },
                        { x: 216, y: 40 },
                        { x: 273, y: 46 },
                        { x: 325, y: 36 },
                      ].map((pt, i) => (
                        <circle key={`cur-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#DDB66D" />
                      ))}

                      {/* X-axis Labels */}
                      <text x="45" y="118" fill="#8E9296" fontSize="8" textAnchor="middle">Aug 18</text>
                      <text x="102" y="118" fill="#8E9296" fontSize="8" textAnchor="middle">Aug 21</text>
                      <text x="159" y="118" fill="#8E9296" fontSize="8" textAnchor="middle">Aug 24</text>
                      <text x="216" y="118" fill="#8E9296" fontSize="8" textAnchor="middle">Aug 27</text>
                      <text x="273" y="118" fill="#8E9296" fontSize="8" textAnchor="middle">Aug 30</text>
                      <text x="325" y="118" fill="#8E9296" fontSize="8" textAnchor="middle">Aug 31</text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom Row: 3 Callout Cards (Image 4 Panel 3) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Aligned with your plan */}
                <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#90D2BC]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aligned with your plan</span>
                    </div>
                    <p className="text-xs text-[#ECECE7] leading-relaxed">
                      Study blocks were 42% longer on average in the selected period.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFindingType("aligned");
                      setActiveTab("evidence");
                    }}
                    className="text-xs font-medium text-[#DDB66D] hover:underline text-left inline-flex items-center gap-1"
                  >
                    <span>View evidence</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {/* Card 2: Worth reviewing */}
                <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#E58376]">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Worth reviewing</span>
                    </div>
                    <p className="text-xs text-[#ECECE7] leading-relaxed">
                      Fewer evening study blocks than in the previous period.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFindingType("review");
                      setActiveTab("evidence");
                    }}
                    className="text-xs font-medium text-[#DDB66D] hover:underline text-left inline-flex items-center gap-1"
                  >
                    <span>View evidence</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {/* Card 3: Try and compare */}
                <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#DDB66D]">
                      <Lightbulb className="w-4 h-4" />
                      <span>Try and compare</span>
                    </div>
                    <p className="text-xs text-[#ECECE7] leading-relaxed">
                      Your longest blocks happen on weekday mornings. Try scheduling two this week.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFindingType("experiment");
                      setActiveTab("evidence");
                    }}
                    className="text-xs font-medium text-[#DDB66D] hover:underline text-left inline-flex items-center gap-1"
                  >
                    <span>View evidence</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>

              <div className="text-right text-[10px] text-[#8E9296] pt-1">
                Illustrative data
              </div>
            </div>
          )}

            {/* TAB 2: PROGRESS (§10.3) */}
            {activeTab === "progress" && (
              <div className="flex flex-col gap-5">
                {/* Metric Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap bg-[#171819] p-0.5 rounded-[8px] border border-[#3A3D3E] text-xs">
                    {(
                      [
                        { key: "focus_time", label: "Work duration" },
                        { key: "deep_run_length", label: "Longest deep block" },
                        { key: "planned_vs_recorded", label: "Planned vs recorded" },
                        { key: "sink_time", label: "Sink time" },
                        { key: "review_rate", label: "Review completeness" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setSelectedMetric(m.key)}
                        className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors ${
                          selectedMetric === m.key
                            ? "bg-[#DDB66D] text-[#171819] font-semibold"
                            : "text-[#C1C5C1] hover:text-[#ECECE7]"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recorded Change Comparison Banner (update.md §3.5) */}
                {(() => {
                  const currentSeries = analysisResult.progressSeries.find((s) => s.metricKey === selectedMetric);
                  if (!currentSeries || currentSeries.baselineAverage === undefined) return null;
                  const diff = currentSeries.averageValue - currentSeries.baselineAverage;
                  const diffSign = diff > 0 ? "+" : "";

                  return (
                    <div className="p-3.5 rounded-[10px] bg-[#171819] border border-[#3A3D3E] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#ECECE7]">Recorded change:</span>
                        <span className="font-mono font-bold text-[#DDB66D]">
                          {diffSign}{diff} {currentSeries.unit}
                        </span>
                        <span className="text-[#A1A9A5]">
                          ({currentSeries.averageValue} {currentSeries.unit} vs {currentSeries.baselineAverage} {currentSeries.unit} baseline)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#A1A9A5]">
                        {analysisResult.resolvedRange.start} &ndash; {analysisResult.resolvedRange.end} ({analysisResult.resolvedRange.observedDays} of {analysisResult.resolvedRange.totalDays} observed days)
                      </span>
                    </div>
                  );
                })()}

                {/* Progression Bar Chart */}
                <div className="p-4 rounded-[12px] bg-[#282A2C] border border-[#3A3D3E] flex flex-col gap-3">
                  <span className="text-xs font-semibold text-[#ECECE7] capitalize">
                    {selectedMetric.replace(/_/g, " ")} Progression
                  </span>
                  <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-[#3A3D3E]">
                    {analysisResult.dayAggregates.map((d) => {
                      let val = 0;
                      let label = "";
                      let maxVal = 240;

                      if (selectedMetric === "focus_time") {
                        val = d.workSeconds / 60;
                        label = `${Math.round(val)}m`;
                        maxVal = 240;
                      } else if (selectedMetric === "deep_run_length") {
                        val = d.longestRunSeconds / 60;
                        label = `${Math.round(val)}m`;
                        maxVal = 120;
                      } else if (selectedMetric === "planned_vs_recorded") {
                        val = d.recordedWorkSecondsInBlocks / 60;
                        label = `${Math.round(val)}m`;
                        maxVal = Math.max(120, (d.plannedWorkSeconds || 0) / 60);
                      } else if (selectedMetric === "sink_time") {
                        val = d.sinkSeconds / 60;
                        label = `${Math.round(val)}m`;
                        maxVal = 180;
                      } else if (selectedMetric === "review_rate") {
                        val = d.blockCount > 0 ? Math.round((d.reviewedBlockCount / d.blockCount) * 100) : 100;
                        label = `${val}%`;
                        maxVal = 100;
                      }

                      const pct = Math.min(100, Math.max(8, (val / maxVal) * 100));

                      return (
                        <div
                          key={d.date}
                          className="flex-1 flex flex-col items-center justify-end h-full gap-1"
                        >
                          <span className="text-[9px] font-mono text-[#A1A9A5]">
                            {label}
                          </span>
                          <div
                            className={`w-full rounded-t-[3px] transition-all hover:brightness-125 ${
                              selectedMetric === "sink_time"
                                ? "bg-[#DFA095]"
                                : selectedMetric === "review_rate"
                                ? "bg-[#90D2BC]"
                                : selectedMetric === "planned_vs_recorded"
                                ? "bg-[#E8C888]"
                                : "bg-[#DDB66D]"
                            }`}
                            style={{ height: `${pct}%` }}
                            title={`${d.date}: ${label}`}
                          />
                          <span className="text-[9px] text-[#A1A9A5] truncate w-full text-center">
                            {d.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Exact Values Table (§10.3) */}
                  <div className="mt-3 overflow-x-auto">
                    <div className="text-xs font-semibold text-[#C1C5C1] mb-2">Exact Values Table</div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#3A3D3E] text-[#A1A9A5] text-[11px]">
                          <th className="py-2 px-3 font-medium">Date</th>
                          <th className="py-2 px-3 font-medium">Work Duration</th>
                          <th className="py-2 px-3 font-medium">Longest Run</th>
                          <th className="py-2 px-3 font-medium">Planned vs Recorded</th>
                          <th className="py-2 px-3 font-medium">Sink Time</th>
                          <th className="py-2 px-3 font-medium">Review Rate</th>
                          <th className="py-2 px-3 font-medium text-right">Blocks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisResult.dayAggregates.map((d) => (
                          <tr key={`exact-${d.date}`} className="border-b border-[#3A3D3E]/40 hover:bg-[#2F3133]/50 transition-colors">
                            <td className="py-2 px-3 font-mono text-[#ECECE7]">{d.date}</td>
                            <td className="py-2 px-3 font-mono text-[#DDB66D]">{formatDurationSeconds(d.workSeconds)}</td>
                            <td className="py-2 px-3 font-mono text-[#DDB66D]">{formatDurationSeconds(d.longestRunSeconds)}</td>
                            <td className="py-2 px-3 font-mono text-[#E8C888]">
                              {Math.round(d.recordedWorkSecondsInBlocks / 60)}m / {Math.round(d.plannedWorkSeconds / 60)}m
                            </td>
                            <td className="py-2 px-3 font-mono text-[#DFA095]">{formatDurationSeconds(d.sinkSeconds)}</td>
                            <td className="py-2 px-3 font-mono text-[#90D2BC]">
                              {d.blockCount > 0 ? `${Math.round((d.reviewedBlockCount / d.blockCount) * 100)}%` : "N/A"}
                            </td>
                            <td className="py-2 px-3 font-mono text-right text-[#A1A9A5]">
                              {d.reviewedBlockCount}/{d.blockCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          {/* TAB 3: EVIDENCE (Image 4 Panel 4) */}
          {activeTab === "evidence" && (
            <div className="flex flex-col gap-4">
              {/* Back to findings link */}
              <button
                onClick={() => setActiveTab("summary")}
                className="flex items-center gap-1.5 text-xs text-[#8E9296] hover:text-[#ECECE7] transition-colors self-start"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to findings</span>
              </button>

              {/* Finding Banner (Panel 4) */}
              <div className="p-4 rounded-[10px] bg-[#14231E]/60 border border-[#90D2BC]/40 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#ECECE7]">
                  <CheckCircle2 className="w-4 h-4 text-[#90D2BC]" />
                  <span>
                    {selectedFindingType === "review"
                      ? "Fewer evening study blocks than in the previous period."
                      : selectedFindingType === "experiment"
                      ? "Your longest blocks happen on weekday mornings."
                      : "Reviewed blocks contained more Work time in the selected period."}
                  </span>
                </div>
                <p className="text-xs text-[#90D2BC] pl-6">
                  {selectedFindingType === "review"
                    ? "In the selected period, evening study blocks decreased from 14 to 6 across 14 observed days."
                    : selectedFindingType === "experiment"
                    ? "Morning weekday blocks averaged 58m compared to 34m across other windows."
                    : "In the selected period, 78% of reviewed blocks were categorized as Work, compared to 62% in the previous period."}
                </p>
              </div>

              {/* 2-Column Main Evidence Grid: Sample Blocks (Left) & Calculation/Limitation/Intention (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column (8 cols): Sample blocks table */}
                <div className="lg:col-span-8 p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-[#ECECE7]">
                    Sample blocks (8 of 34 reviewed blocks)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#26282A] text-[#8E9296] text-[10px] font-semibold uppercase">
                          <th className="py-2 px-2.5">Date</th>
                          <th className="py-2 px-2.5">Start</th>
                          <th className="py-2 px-2.5">Duration</th>
                          <th className="py-2 px-2.5">Primary app</th>
                          <th className="py-2 px-2.5">Category</th>
                          <th className="py-2 px-2.5">Review status</th>
                          <th className="py-2 px-1 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#26282A]/40 text-xs">
                        {[
                          { date: "Aug 18, 2025", start: "09:12", duration: "55m", app: "Visual Studio Code", cat: "Work", status: "Reviewed" },
                          { date: "Aug 19, 2025", start: "10:03", duration: "50m", app: "Notion", cat: "Work", status: "Reviewed" },
                          { date: "Aug 20, 2025", start: "14:21", duration: "42m", app: "Chrome", cat: "Work", status: "Reviewed" },
                          { date: "Aug 22, 2025", start: "09:07", duration: "60m", app: "Visual Studio Code", cat: "Work", status: "Reviewed" },
                          { date: "Aug 25, 2025", start: "11:18", duration: "45m", app: "Notion", cat: "Work", status: "Reviewed" },
                          { date: "Aug 27, 2025", start: "08:56", duration: "50m", app: "Visual Studio Code", cat: "Work", status: "Reviewed" },
                          { date: "Aug 29, 2025", start: "10:31", duration: "37m", app: "Chrome", cat: "Work", status: "Reviewed" },
                          { date: "Aug 31, 2025", start: "09:14", duration: "65m", app: "Notion", cat: "Work", status: "Reviewed" },
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#1E1F21] transition-colors">
                            <td className="py-2.5 px-2.5 font-mono text-[#8E9296] text-[11px]">{row.date}</td>
                            <td className="py-2.5 px-2.5 font-mono text-[#8E9296] text-[11px]">{row.start}</td>
                            <td className="py-2.5 px-2.5 font-mono text-[#ECECE7] font-semibold">{row.duration}</td>
                            <td className="py-2.5 px-2.5 text-[#ECECE7]">{row.app}</td>
                            <td className="py-2.5 px-2.5 text-[#8E9296]">{row.cat}</td>
                            <td className="py-2.5 px-2.5 text-[#8E9296]">{row.status}</td>
                            <td className="py-2.5 px-1 text-right text-[#8E9296] hover:text-[#ECECE7]">
                              <ExternalLink className="w-3.5 h-3.5 ml-auto inline cursor-pointer" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column (4 cols): Calculation, Limitation, Intention, Actions */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  {/* Calculation Card */}
                  <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-[#ECECE7]">Calculation</h4>
                    <span className="text-[11px] text-[#8E9296]">Share of reviewed blocks with Work time</span>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-[#8E9296]">Selected period</span>
                      <span className="font-mono font-bold text-[#ECECE7]">
                        78% <span className="font-normal text-[#8E9296]">(26 of 34)</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#8E9296]">Previous period</span>
                      <span className="font-mono text-[#8E9296]">
                        62% <span className="font-normal text-[#8E9296]">(18 of 29)</span>
                      </span>
                    </div>
                  </div>

                  {/* Limitation Card */}
                  <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#8E9296]">
                      <Info className="w-3.5 h-3.5" />
                      <span className="font-bold">Limitation</span>
                    </div>
                    <span className="text-xs font-bold text-[#ECECE7]">Browser activity only</span>
                    <p className="text-[11px] text-[#8E9296] leading-relaxed">
                      This analysis is based on browser and desktop app activity. Offline work (e.g. documents, meetings, or non-tracked apps) is not included and may affect the results.
                    </p>
                  </div>

                  {/* Linked to your intention Card */}
                  <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-[#ECECE7]">Linked to your intention</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[#ECECE7]">
                        <Target className="w-3.5 h-3.5 text-[#8E9296]" />
                        <span>Longer study blocks</span>
                      </div>
                      <button
                        onClick={() => setActiveTab("summary")}
                        className="px-2.5 py-1 rounded-[6px] bg-[#222426] border border-[#333538] text-[11px] text-[#ECECE7] hover:bg-[#2A2C2F] transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Related actions Card */}
                  <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-[#ECECE7]">Related actions</h4>
                    <Link
                      href="/logs"
                      className="w-full py-2 px-3 rounded-[8px] bg-[#DDB66D] text-[#171819] font-bold text-xs text-center hover:bg-[#E8C888] transition-colors"
                    >
                      View matching logs
                    </Link>
                    <Link
                      href="/focus"
                      className="w-full py-2 px-3 rounded-[8px] bg-[#222426] border border-[#333538] text-[#ECECE7] font-semibold text-xs text-center hover:bg-[#2A2C2F] transition-colors"
                    >
                      Review activity
                    </Link>
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] text-[#8E9296] pt-1">
                Illustrative data
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finding Detail Sheet */}
      {selectedFinding && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSelectedFinding(null)}
        >
          <div
            className="card-midnight w-full max-w-md p-5 bg-[#202122] border border-[#737978] shadow-2xl flex flex-col gap-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#3A3D3E] pb-2.5">
              <h3 className="text-sm font-semibold text-[#ECECE7]">{selectedFinding.headline}</h3>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-xs text-[#A1A9A5] hover:text-[#ECECE7]"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-[#C1C5C1] leading-relaxed">
              {selectedFinding.explanation}
            </p>
            {selectedFinding.suggestedExperiment && (
              <div className="p-3 rounded-[8px] bg-[#282A2C] border border-[#3A3D3E] text-xs flex flex-col gap-1.5">
                <span className="font-semibold text-[#DDB66D]">Suggested Experiment:</span>
                <p className="text-[#ECECE7]">{selectedFinding.suggestedExperiment.action}</p>
                <div className="text-[11px] text-[#A1A9A5] flex justify-between mt-1">
                  <span>Duration: {selectedFinding.suggestedExperiment.durationDays} days</span>
                  <span>Metric: {selectedFinding.suggestedExperiment.successMetric}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-[#3A3D3E]">
              <button
                onClick={() => {
                  const f = selectedFinding;
                  setSelectedFinding(null);
                  handleOpenEvidenceForFinding(f);
                }}
                className="flex-1 py-2 px-3 rounded-[8px] bg-[#DDB66D] text-[#171819] text-xs font-semibold hover:bg-[#E5C384] transition-colors"
              >
                Inspect Evidence in Panel &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Sheet for Findings (update.md §3.5, §4) */}
      {subviewEvidence && (
        <EvidenceSheet
          evidence={subviewEvidence}
          isOpen={true}
          onClose={() => setSubviewEvidence(null)}
        />
      )}
    </div>
  );
}
