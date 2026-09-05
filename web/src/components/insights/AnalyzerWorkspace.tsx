"use client";

import React, { useState, useMemo } from "react";
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
  Info,
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
  const todayStr = "2026-09-02";

  // Query Form State (§10.2)
  const [rangeType, setRangeType] = useState<"7d" | "14d" | "30d" | "custom">("14d");
  const [startDate, setStartDate] = useState("2026-08-20");
  const [endDate, setEndDate] = useState("2026-09-02");
  const [compareWith, setCompareWith] = useState<"previous_period" | "custom_baseline" | "none">("previous_period");
  const [baselineStartDate, setBaselineStartDate] = useState("2026-08-06");
  const [baselineEndDate, setBaselineEndDate] = useState("2026-08-19");
  const [filterKind, setFilterKind] = useState<"all" | "apps" | "tags" | "category">("all");
  const [userIntention, setUserIntention] = useState("Longer study blocks with fewer app switches");

  // Baseline non-overlapping validation (§10.2)
  const baselineValidation = useMemo(() => {
    if (compareWith !== "custom_baseline") return { isValid: true };
    return validateBaselineRange(startDate, endDate, baselineStartDate, baselineEndDate);
  }, [compareWith, startDate, endDate, baselineStartDate, baselineEndDate]);

  // Execution & Progress State
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState<"preparing" | "patterns" | "writing" | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzerResult | null>(() => {
    // Initial pre-computed analysis
    return runPeriodAnalysis({
      query: {
        rangeType: "14d",
        startDate: "2026-08-20",
        endDate: "2026-09-02",
        compareWith: "previous_period",
        filterKind: "all",
        filterValues: [],
        userIntention: "Longer study blocks with fewer app switches",
      },
      rawSessions: sessions,
      corrections,
      rules,
      blocks: focusBlocks,
      timezone,
      goalHours,
    });
  });

  const [activeTab, setActiveTab] = useState<"summary" | "progress" | "evidence">("summary");
  const [selectedMetric, setSelectedMetric] = useState<
    "focus_time" | "deep_run_length" | "planned_vs_recorded" | "sink_time" | "review_rate"
  >("focus_time");
  const [selectedFinding, setSelectedFinding] = useState<AnalyzerFinding | null>(null);
  const [isDirty, setIsDirty] = useState(false);

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
      {/* 1. Setup Form Header (§10.2) */}
      <div className="card-midnight p-5 bg-[#141A25] border border-[#2B374B] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#2B374B] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#AAA9FF]" />
            <h2 className="text-sm font-bold text-[#F2F5FB]">Custom-Range AI Analyzer</h2>
          </div>
          {isDirty && (
            <span className="text-[11px] text-[#D9BE87] px-2 py-0.5 rounded bg-[#D9BE87]/10 font-medium">
              Settings changed &mdash; run again
            </span>
          )}
        </div>

        {/* Compact Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Time Range */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#B8C4D8]">Time Range</label>
            <div className="flex bg-[#0B0E14] p-0.5 rounded-[8px] border border-[#2B374B]">
              {(["7d", "14d", "30d", "custom"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    handleFieldChange(() => {
                      setRangeType(r);
                      if (r === "7d") setStartDate("2026-08-27");
                      else if (r === "14d") setStartDate("2026-08-20");
                      else if (r === "30d") setStartDate("2026-08-04");
                    })
                  }
                  className={`flex-1 py-1.5 rounded-[6px] capitalize font-mono font-medium transition-colors ${
                    rangeType === r
                      ? "bg-[#AAA9FF] text-[#0B0E14] font-semibold"
                      : "text-[#B8C4D8] hover:text-[#F2F5FB]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {rangeType === "custom" ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="date"
                  value={startDate}
                  max={endDate || todayStr}
                  onChange={(e) => handleFieldChange(() => setStartDate(e.target.value))}
                  className="px-2 py-1 rounded bg-[#0B0E14] border border-[#2B374B] text-[#F2F5FB] text-[11px] w-full"
                />
                <span className="text-[#96A5BD]">&rarr;</span>
                <input
                  type="date"
                  value={endDate}
                  max={todayStr}
                  onChange={(e) => handleFieldChange(() => setEndDate(e.target.value))}
                  className="px-2 py-1 rounded bg-[#0B0E14] border border-[#2B374B] text-[#F2F5FB] text-[11px] w-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] font-mono text-[#96A5BD]">
                <span>{startDate}</span>
                <span>&rarr;</span>
                <span>{endDate}</span>
              </div>
            )}
          </div>

          {/* Compare With */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#B8C4D8]">Compare With</label>
            <select
              value={compareWith}
              onChange={(e) =>
                handleFieldChange(() => setCompareWith(e.target.value as any))
              }
              className="px-3 py-1.5 rounded-[8px] bg-[#0B0E14] border border-[#2B374B] text-[#F2F5FB] focus:outline-none focus:border-[#AAA9FF]"
            >
              <option value="previous_period">Previous equal-length period</option>
              <option value="custom_baseline">Custom baseline</option>
              <option value="none">No comparison</option>
            </select>

            {compareWith === "custom_baseline" ? (
              <div className="flex flex-col gap-1 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={baselineStartDate}
                    max={baselineEndDate || todayStr}
                    onChange={(e) => handleFieldChange(() => setBaselineStartDate(e.target.value))}
                    className="px-2 py-1 rounded bg-[#0B0E14] border border-[#2B374B] text-[#F2F5FB] text-[11px] w-full"
                  />
                  <span className="text-[#96A5BD]">&rarr;</span>
                  <input
                    type="date"
                    value={baselineEndDate}
                    max={todayStr}
                    onChange={(e) => handleFieldChange(() => setBaselineEndDate(e.target.value))}
                    className="px-2 py-1 rounded bg-[#0B0E14] border border-[#2B374B] text-[#F2F5FB] text-[11px] w-full"
                  />
                </div>
                {!baselineValidation.isValid && (
                  <span className="text-[10px] text-[#EE9DAA] leading-tight">
                    {baselineValidation.error}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-[#96A5BD]">
                Per-eligible-day averages
              </span>
            )}
          </div>

          {/* Scope Filters */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#B8C4D8]">Look At</label>
            <select
              value={filterKind}
              onChange={(e) =>
                handleFieldChange(() => setFilterKind(e.target.value as any))
              }
              className="px-3 py-1.5 rounded-[8px] bg-[#0B0E14] border border-[#2B374B] text-[#F2F5FB] focus:outline-none focus:border-[#AAA9FF]"
            >
              <option value="all">All activity (display safe)</option>
              <option value="apps">Selected apps</option>
              <option value="tags">Focus block tags</option>
              <option value="category">Work category only</option>
            </select>
            <span className="text-[11px] text-[#96A5BD]">
              Interval unions preserved
            </span>
          </div>

          {/* User Intention */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#B8C4D8]">Your Intention</label>
            <input
              type="text"
              value={userIntention}
              onChange={(e) => handleFieldChange(() => setUserIntention(e.target.value))}
              placeholder="e.g. Fewer distractions, longer blocks"
              className="px-3 py-1.5 rounded-[8px] bg-[#0B0E14] border border-[#2B374B] text-[#F2F5FB] focus:outline-none focus:border-[#AAA9FF]"
            />
            <span className="text-[11px] text-[#96A5BD]">
              Grounds accountability findings
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2B374B]">
          <span className="text-xs text-[#96A5BD]">
            Deterministic facts crunching &bull; Zero external data leak
          </span>

          <button
            onClick={handleRunAnalysis}
            disabled={isLoading || !baselineValidation.isValid}
            className="flex items-center gap-2 px-5 py-2 rounded-[8px] bg-[#AAA9FF] text-[#0B0E14] hover:bg-[#D0CEFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-bold shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-[#0B0E14]" />
            <span>{isLoading ? "Running..." : "Analyze period"}</span>
          </button>
        </div>

        {/* Loading / Progress State (§10.6) */}
        {isLoading && (
          <div className="p-3 rounded-[8px] bg-[#1A2230] border border-[#AAA9FF]/30 flex items-center justify-between text-xs text-[#AAA9FF]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span className="capitalize font-semibold">
                {progressStage === "preparing" && "Preparing corrected data…"}
                {progressStage === "patterns" && "Calculating progression & patterns…"}
                {progressStage === "writing" && "Writing evidence-backed summary…"}
              </span>
            </div>
            <button
              onClick={() => setIsLoading(false)}
              className="text-[#EE9DAA] hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* 2. Analysis Results Workspace (§10.3) */}
      {analysisResult && (
        <div className="card-midnight bg-[#141A25] border border-[#2B374B] overflow-hidden flex flex-col">
          {/* Result Tabs Bar */}
          <div className="flex items-center justify-between border-b border-[#2B374B] px-5 pt-3 bg-[#0E121B]">
            <div className="flex gap-4">
              {(["summary", "progress", "evidence"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`pb-3 text-xs font-semibold capitalize border-b-2 transition-colors ${
                    activeTab === t
                      ? "border-[#AAA9FF] text-[#F2F5FB]"
                      : "border-transparent text-[#96A5BD] hover:text-[#B8C4D8]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-[#96A5BD] pb-3">
              Revision {analysisResult.dataRevision}
            </span>
          </div>

          <div className="p-5 sm:p-6 flex flex-col gap-6">
            {/* TAB 1: SUMMARY */}
            {activeTab === "summary" && (
              <div className="flex flex-col gap-6">
                {/* 40–70 Word Overview Paragraph (§10.3) */}
                <div className="p-4 rounded-[12px] bg-[#1A2230] border border-[#2B374B]">
                  <p className="text-sm sm:text-base text-[#F2F5FB] leading-relaxed font-normal">
                    {analysisResult.summaryText}
                  </p>
                </div>

                {/* Three Columns / Cards: Working Well, Getting in the Way, Worth Trying (§10.3, §10.5) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Working well */}
                  <div className="p-4 rounded-[12px] bg-[#1A2230] border border-[#2B374B] flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#90D2BC]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Working well</span>
                    </div>
                    {analysisResult.findings
                      .filter((f) => f.kind === "working-well")
                      .map((f) => (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFinding(f)}
                          className="p-3 rounded-[8px] bg-[#141A25] border border-[#2B374B] hover:border-[#90D2BC] cursor-pointer transition-colors flex flex-col gap-1.5"
                        >
                          <h4 className="text-xs font-bold text-[#F2F5FB] leading-snug">
                            {f.headline}
                          </h4>
                          <p className="text-[11px] text-[#B8C4D8] leading-relaxed">
                            {f.explanation}
                          </p>
                        </div>
                      ))}
                  </div>

                  {/* Getting in the way */}
                  <div className="p-4 rounded-[12px] bg-[#1A2230] border border-[#2B374B] flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EE9DAA]">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Getting in the way</span>
                    </div>
                    {analysisResult.findings
                      .filter((f) => f.kind === "getting-in-the-way")
                      .map((f) => (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFinding(f)}
                          className="p-3 rounded-[8px] bg-[#141A25] border border-[#2B374B] hover:border-[#EE9DAA] cursor-pointer transition-colors flex flex-col gap-1.5"
                        >
                          <h4 className="text-xs font-bold text-[#F2F5FB] leading-snug">
                            {f.headline}
                          </h4>
                          <p className="text-[11px] text-[#B8C4D8] leading-relaxed">
                            {f.explanation}
                          </p>
                        </div>
                      ))}
                  </div>

                  {/* Worth trying */}
                  <div className="p-4 rounded-[12px] bg-[#1A2230] border border-[#2B374B] flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7CDCE5]">
                      <Lightbulb className="w-4 h-4" />
                      <span>Worth trying</span>
                    </div>
                    {analysisResult.findings
                      .filter((f) => f.kind === "worth-trying")
                      .map((f) => (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFinding(f)}
                          className="p-3 rounded-[8px] bg-[#141A25] border border-[#2B374B] hover:border-[#7CDCE5] cursor-pointer transition-colors flex flex-col gap-1.5"
                        >
                          <h4 className="text-xs font-bold text-[#F2F5FB] leading-snug">
                            {f.headline}
                          </h4>
                          <p className="text-[11px] text-[#B8C4D8] leading-relaxed">
                            {f.explanation}
                          </p>
                          {f.suggestedExperiment && (
                            <div className="mt-1 pt-1.5 border-t border-[#2B374B] text-[10px] text-[#7CDCE5]">
                              Suggested: {f.suggestedExperiment.action}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROGRESS (§10.3) */}
            {activeTab === "progress" && (
              <div className="flex flex-col gap-5">
                {/* Metric Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap bg-[#0B0E14] p-0.5 rounded-[8px] border border-[#2B374B] text-xs">
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
                            ? "bg-[#AAA9FF] text-[#0B0E14] font-semibold"
                            : "text-[#B8C4D8] hover:text-[#F2F5FB]"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progression Bar Chart */}
                <div className="p-4 rounded-[12px] bg-[#1A2230] border border-[#2B374B] flex flex-col gap-3">
                  <span className="text-xs font-semibold text-[#F2F5FB] capitalize">
                    {selectedMetric.replace(/_/g, " ")} Progression
                  </span>
                  <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-[#2B374B]">
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
                          <span className="text-[9px] font-mono text-[#96A5BD]">
                            {label}
                          </span>
                          <div
                            className={`w-full rounded-t-[3px] transition-all hover:brightness-125 ${
                              selectedMetric === "sink_time"
                                ? "bg-[#EE9DAA]"
                                : selectedMetric === "review_rate"
                                ? "bg-[#90D2BC]"
                                : selectedMetric === "planned_vs_recorded"
                                ? "bg-[#D0CEFF]"
                                : "bg-[#AAA9FF]"
                            }`}
                            style={{ height: `${pct}%` }}
                            title={`${d.date}: ${label}`}
                          />
                          <span className="text-[9px] text-[#96A5BD] truncate w-full text-center">
                            {d.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Exact Values Table (§10.3) */}
                  <div className="mt-3 overflow-x-auto">
                    <div className="text-xs font-semibold text-[#B8C4D8] mb-2">Exact Values Table</div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#2B374B] text-[#96A5BD] text-[11px]">
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
                          <tr key={`exact-${d.date}`} className="border-b border-[#2B374B]/40 hover:bg-[#1F2939]/50 transition-colors">
                            <td className="py-2 px-3 font-mono text-[#F2F5FB]">{d.date}</td>
                            <td className="py-2 px-3 font-mono text-[#AAA9FF]">{formatDurationSeconds(d.workSeconds)}</td>
                            <td className="py-2 px-3 font-mono text-[#7CDCE5]">{formatDurationSeconds(d.longestRunSeconds)}</td>
                            <td className="py-2 px-3 font-mono text-[#D0CEFF]">
                              {Math.round(d.recordedWorkSecondsInBlocks / 60)}m / {Math.round(d.plannedWorkSeconds / 60)}m
                            </td>
                            <td className="py-2 px-3 font-mono text-[#EE9DAA]">{formatDurationSeconds(d.sinkSeconds)}</td>
                            <td className="py-2 px-3 font-mono text-[#90D2BC]">
                              {d.blockCount > 0 ? `${Math.round((d.reviewedBlockCount / d.blockCount) * 100)}%` : "N/A"}
                            </td>
                            <td className="py-2 px-3 font-mono text-right text-[#96A5BD]">
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

            {/* TAB 3: EVIDENCE */}
            {activeTab === "evidence" && (
              <div className="flex flex-col gap-4 text-xs text-[#B8C4D8]">
                <h3 className="text-sm font-semibold text-[#F2F5FB]">
                  Supporting Arithmetic & Limitations
                </h3>
                <div className="p-4 rounded-[10px] bg-[#1A2230] border border-[#2B374B] flex flex-col gap-2 font-mono">
                  <div className="flex justify-between">
                    <span>Resolved Window:</span>
                    <span className="text-[#F2F5FB]">
                      {analysisResult.resolvedRange.start} &ndash; {analysisResult.resolvedRange.end}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Observed Days Denominator:</span>
                    <span className="text-[#90D2BC]">
                      {analysisResult.resolvedRange.observedDays} of {analysisResult.resolvedRange.totalDays} days
                    </span>
                  </div>
                  {analysisResult.coverageLimitation && (
                    <div className="flex justify-between text-[#D9BE87]">
                      <span>Coverage Limitation:</span>
                      <span>{analysisResult.coverageLimitation}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-[10px] bg-[#1A2230] border border-[#2B374B] flex flex-col gap-2">
                  <span className="font-semibold text-[#F2F5FB]">Zero Moralizing Guard</span>
                  <p className="text-[#96A5BD] leading-relaxed">
                    Findings are bounded strictly to observable timestamps and explicit intentions. The model never assumes mental state, moral discipline, or hidden intent.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Finding Detail Sheet */}
      {selectedFinding && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSelectedFinding(null)}
        >
          <div
            className="card-midnight w-full max-w-md p-5 bg-[#141A25] border border-[#53637D] shadow-2xl flex flex-col gap-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2B374B] pb-2.5">
              <h3 className="text-sm font-semibold text-[#F2F5FB]">{selectedFinding.headline}</h3>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-xs text-[#96A5BD] hover:text-[#F2F5FB]"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-[#B8C4D8] leading-relaxed">
              {selectedFinding.explanation}
            </p>
            {selectedFinding.suggestedExperiment && (
              <div className="p-3 rounded-[8px] bg-[#1A2230] border border-[#2B374B] text-xs flex flex-col gap-1.5">
                <span className="font-semibold text-[#7CDCE5]">Suggested Experiment:</span>
                <p className="text-[#F2F5FB]">{selectedFinding.suggestedExperiment.action}</p>
                <div className="text-[11px] text-[#96A5BD] flex justify-between mt-1">
                  <span>Duration: {selectedFinding.suggestedExperiment.durationDays} days</span>
                  <span>Metric: {selectedFinding.suggestedExperiment.successMetric}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
