"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DateTime } from "luxon";
import { useAppStore } from "@/lib/store";
import { isPaid } from "@/lib/entitlement";
import { buildLedger } from "@/lib/ingest";
import { getLogicalDay } from "@/lib/day";
import { Envelope } from "@/lib/types";
import { Evidence } from "@/lib/presentation-types";
import { evaluateHistoricalObservations } from "@/lib/observations";
import { comparePeriods } from "@/lib/compare-engine";
import { EvidencePanel } from "@/components/today/EvidencePanel";
import { AnalyzerWorkspace } from "@/components/insights/AnalyzerWorkspace";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Clock,
  GitCompare,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { formatDuration } from "@/lib/format";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;
const TIMEZONE = "Asia/Kolkata";

const ALL_FAMILIES = [
  {
    family: "Return interval",
    requiredDays: 7,
    window: "Last 7 completed days",
    requirement: "≥3 safe sink-ended runs with subsequent work app resume within 4 hours.",
  },
  {
    family: "Sink concentration",
    requiredDays: 14,
    window: "Last 14 completed days",
    requirement: "≥7 eligible days with data, ≥60m in winning 2-hour window, density ≥1.25× daily mean.",
  },
  {
    family: "Early activity pattern",
    requiredDays: 7,
    window: "Last 7 completed days",
    requirement: "≥4 eligible days with activity; sink app recorded within 10 minutes of first daily activity on ≥50% of days.",
  },
  {
    family: "App sequence",
    requiredDays: 14,
    window: "Last 14 completed days",
    requirement: "Same-device transitions with 0–60s gap; ≥8 valid successors after A, ≥3 A→B (proportion ≥35%).",
  },
  {
    family: "Recurring focus window",
    requiredDays: 28,
    window: "Last 28 completed days",
    requirement: "Same weekday / 3-hour bucket observed in ≥3 distinct weeks with ≥30m average focus time.",
  },
];

function InsightsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = (searchParams.get("tab") as "patterns" | "compare" | "analyzer") || "patterns";

  const {
    entitlement,
    seedPins,
    overrides,
    focusBlocks,
    correctionBatches,
    classificationRules,
    settings,
  } = useAppStore();
  const isPro = isPaid(entitlement);

  // Window selector state for Patterns: 7 / 14 / 28 days
  const [selectedWindow, setSelectedWindow] = useState<7 | 14 | 28>(14);
  const [showRequirements, setShowRequirements] = useState(false);
  const [inspectEvidence, setInspectEvidence] = useState<Evidence | null>(null);

  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  const appliedCorrections = useMemo(() => {
    return correctionBatches.flatMap((b) => b.operations);
  }, [correctionBatches]);

  // Extract distinct days and latest anchor day
  const availableDays = useMemo(() => {
    const days = new Set<string>();
    for (const s of ledger) {
      days.add(getLogicalDay(s.started_at_ms, TIMEZONE));
    }
    return Array.from(days).sort();
  }, [ledger]);

  const latestDay = availableDays.length > 0 ? availableDays[availableDays.length - 1] : "2026-09-02";

  // Evaluate historical insights (§8.1, §9)
  const insights = useMemo(() => {
    return evaluateHistoricalObservations(
      latestDay,
      ledger,
      selectedWindow,
      TIMEZONE
    );
  }, [latestDay, ledger, selectedWindow]);

  // Compare 7D vs prior 7D data
  const completedDays = useMemo(() => availableDays.slice(0, -1), [availableDays]);
  const currentWeekDays = useMemo(() => completedDays.slice(-7), [completedDays]);
  const referenceWeekDays = useMemo(() => completedDays.slice(-14, -7), [completedDays]);

  const comparisonResult = useMemo(() => {
    return comparePeriods(currentWeekDays, referenceWeekDays, ledger, TIMEZONE);
  }, [currentWeekDays, referenceWeekDays, ledger]);

  const handleTabSelect = (tab: "patterns" | "compare" | "analyzer") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/patterns?${params.toString()}`);
  };

  // Dynamic window date ranges derived from latestDay
  const { windowStartDay, windowEndDay } = useMemo(() => {
    const endDt = DateTime.fromISO(latestDay, { zone: TIMEZONE }).isValid
      ? DateTime.fromISO(latestDay, { zone: TIMEZONE })
      : DateTime.now().setZone(TIMEZONE);
    const startDt = endDt.minus({ days: selectedWindow - 1 });
    return {
      windowStartDay: startDt.toFormat("LLL d, yyyy"),
      windowEndDay: endDt.toFormat("LLL d, yyyy"),
    };
  }, [latestDay, selectedWindow]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl select-text mx-auto">
      {/* 1. Shared Header (START-HERE.md §7.1, §7.7) */}
      <div className="tf-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#3A3D3E]">
        <div>
          <h1 className="tf-title text-[28px] font-semibold text-[#ECECE7] leading-tight m-0 mb-1">
            Insights
          </h1>
          <p className="text-[14px] text-[#C1C5C1] m-0">
            {activeTab === "compare"
              ? "Compare time periods to spot what changed."
              : activeTab === "analyzer"
              ? "Use AI to analyze your time and find practical insights."
              : "Understand your time. Find what works."}
          </p>
        </div>

        {/* Dynamic Date Range Controls */}
        {activeTab === "patterns" && (
          <div className="flex items-center gap-2">
            <div className="flex bg-[#141516] p-0.5 rounded-[6px] border border-[#3A3D3E] text-[13px]">
              {([7, 14, 28] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setSelectedWindow(w)}
                  className={`px-2.5 py-1 rounded-[4px] font-mono transition-colors ${
                    selectedWindow === w
                      ? "bg-[#252729] text-[#ECECE7] font-medium"
                      : "text-[#A1A9A5] hover:text-[#ECECE7]"
                  }`}
                >
                  {w}D
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[13px] text-[#ECECE7]">
              <Clock className="w-3.5 h-3.5 text-[#A1A9A5]" />
              <span>{windowStartDay} &ndash; {windowEndDay}</span>
            </div>
          </div>
        )}

        {activeTab === "compare" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[13px] text-[#ECECE7]">
            <span>Current period ({currentWeekDays.length}d)</span>
            <span className="text-[#A1A9A5]">&harr;</span>
            <span>Reference period ({referenceWeekDays.length}d)</span>
          </div>
        )}

        {activeTab === "analyzer" && (
          <div className="text-[13px] text-[#A1A9A5]">
            On-demand period analysis
          </div>
        )}
      </div>

      {/* Shared Secondary Navigation (START-HERE.md §7.1) */}
      <div className="flex items-center gap-6 border-b border-[#3A3D3E] text-[14px]">
        {(["patterns", "compare", "analyzer"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabSelect(tab)}
            className={`min-h-[44px] pb-2 pt-1 font-medium capitalize transition-colors flex items-center gap-2 ${
              activeTab === tab
                ? "text-[#ECECE7] border-b-2 border-[#DDB66D]"
                : "text-[#A1A9A5] border-b-2 border-transparent hover:text-[#ECECE7]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: PATTERNS (START-HERE.md §7.7) */}
      {activeTab === "patterns" && (
        <div className="flex flex-col gap-5">
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {insights.map((item) => (
                <div
                  key={item.insight.key}
                  className="tf-card p-5 rounded-[10px] bg-[#202122] border border-[#3A3D3E] hover:border-[#737978] transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-[18px] font-medium text-[#ECECE7] m-0">
                      {item.evidence.title}
                    </h3>
                    <p className="text-[16px] text-[#ECECE7] leading-snug m-0">
                      {item.insight.sentence}
                    </p>
                    <p className="text-[13px] text-[#A1A9A5] leading-relaxed m-0 mt-0.5">
                      {item.evidence.calculation}
                    </p>
                  </div>

                  {/* Chart area: ≥160-200px tall (§7.7) */}
                  <div className="h-[180px] w-full rounded-[6px] bg-[#171819] border border-[#3A3D3E] p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#A1A9A5]">
                      <span>{item.insight.family}</span>
                      <span>{item.evidence.windowLabel}</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center text-center p-2">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[20px] font-medium text-[#ECECE7]">
                          {item.insight.sampleCount} recorded samples
                        </span>
                        <span className="text-[12px] text-[#A1A9A5] max-w-xs">
                          {item.evidence.windowLabel}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#737978] truncate">
                      Rule: {item.evidence.calculation}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#3A3D3E] pt-3 text-[13px]">
                    <span className="text-[#A1A9A5] font-mono text-[12px]">
                      {item.insight.sampleCount ? `${item.insight.sampleCount} samples` : item.evidence.windowLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInspectEvidence(item.evidence)}
                      className="tf-button min-h-[44px] px-3 text-[13px] font-medium text-[#DDB66D] hover:underline flex items-center gap-1.5 bg-transparent border-0"
                    >
                      <span>View evidence</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tf-card p-12 text-center flex flex-col items-center gap-3 bg-[#202122] border border-[#3A3D3E] rounded-[10px]">
              <h3 className="text-[18px] font-semibold text-[#ECECE7] m-0">
                No supported patterns yet
              </h3>
              <p className="text-[14px] text-[#A1A9A5] max-w-md m-0">
                Patterns require sufficient consistent cross-device activity across the selected {selectedWindow}-day window. Continue using your devices to build your verified ledger.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPARE (START-HERE.md §7.7) */}
      {activeTab === "compare" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column (8 cols): Aligned chart & Key differences table */}
          <div className="md:col-span-8 flex flex-col gap-5">
            {/* Daily Focus Duration Aligned Bar Chart */}
            <div className="tf-card p-5 rounded-[10px] bg-[#202122] border border-[#3A3D3E] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-medium text-[#ECECE7] m-0">Daily focus duration</h3>
                <div className="flex items-center gap-4 text-[13px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DDB66D]" />
                    <span className="text-[#ECECE7]">Current period</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#737978]" />
                    <span className="text-[#A1A9A5]">Reference period</span>
                  </div>
                </div>
              </div>

              {/* Truthful Chart from comparisonResult */}
              <div className="relative h-48 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120">
                  {/* Paired Bars for observed days */}
                  {comparisonResult.current.dailyFocusSeconds.map((curDay, idx) => {
                    const refDay = comparisonResult.reference.dailyFocusSeconds[idx];
                    const maxSec = Math.max(
                      1,
                      ...comparisonResult.current.dailyFocusSeconds.map((d) => d.seconds),
                      ...comparisonResult.reference.dailyFocusSeconds.map((d) => d.seconds)
                    );
                    const curHeight = (curDay.seconds / maxSec) * 90;
                    const refHeight = refDay ? (refDay.seconds / maxSec) * 90 : 0;
                    const x = 20 + idx * 42;

                    return (
                      <g key={curDay.date}>
                        {/* Current Bar */}
                        <rect
                          x={x}
                          y={105 - curHeight}
                          width="12"
                          height={Math.max(1, curHeight)}
                          rx="1.5"
                          fill="#DDB66D"
                        >
                          <title>{`${curDay.dayLabel} Current: ${formatDuration(curDay.seconds)}`}</title>
                        </rect>
                        {/* Reference Bar */}
                        <rect
                          x={x + 14}
                          y={105 - refHeight}
                          width="12"
                          height={Math.max(1, refHeight)}
                          rx="1.5"
                          fill="#737978"
                        >
                          <title>{`${curDay.dayLabel} Reference: ${refDay ? formatDuration(refDay.seconds) : "0m"}`}</title>
                        </rect>
                        <text x={x + 13} y="118" fill="#A1A9A5" fontSize="9" textAnchor="middle">
                          {curDay.dayLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Key Differences Table */}
            <div className="tf-card p-5 rounded-[10px] bg-[#202122] border border-[#3A3D3E] flex flex-col gap-4">
              <h3 className="text-[18px] font-medium text-[#ECECE7] m-0">Key differences</h3>
              <div className="flex flex-col divide-y divide-[#3A3D3E] text-[14px]">
                <div className="grid grid-cols-12 py-2 text-[13px] text-[#A1A9A5] font-medium">
                  <div className="col-span-5">Metric</div>
                  <div className="col-span-3 text-right">Current</div>
                  <div className="col-span-2 text-right">Reference</div>
                  <div className="col-span-2 text-right">Diff</div>
                </div>

                {/* Focus row */}
                <div className="grid grid-cols-12 py-3 items-center">
                  <div className="col-span-5 text-[#ECECE7] font-medium">Focus time</div>
                  <div className="col-span-3 text-right font-mono text-[#ECECE7]">
                    {comparisonResult.metrics.focus.currentFormatted}
                  </div>
                  <div className="col-span-2 text-right font-mono text-[#A1A9A5]">
                    {comparisonResult.metrics.focus.refFormatted}
                  </div>
                  <div className="col-span-2 text-right font-mono text-[#DDB66D] font-medium">
                    {comparisonResult.metrics.focus.signedDeltaFormatted}
                  </div>
                </div>

                {/* Sink row */}
                <div className="grid grid-cols-12 py-3 items-center">
                  <div className="col-span-5 text-[#ECECE7] font-medium">Sink time</div>
                  <div className="col-span-3 text-right font-mono text-[#ECECE7]">
                    {comparisonResult.metrics.sink.currentFormatted}
                  </div>
                  <div className="col-span-2 text-right font-mono text-[#A1A9A5]">
                    {comparisonResult.metrics.sink.refFormatted}
                  </div>
                  <div className="col-span-2 text-right font-mono text-[#DFA095] font-medium">
                    {comparisonResult.metrics.sink.signedDeltaFormatted}
                  </div>
                </div>

                {/* Deep blocks row */}
                <div className="grid grid-cols-12 py-3 items-center">
                  <div className="col-span-5 text-[#ECECE7] font-medium">Deep blocks (≥15m)</div>
                  <div className="col-span-3 text-right font-mono text-[#ECECE7]">
                    {comparisonResult.metrics.deepBlocks.current}
                  </div>
                  <div className="col-span-2 text-right font-mono text-[#A1A9A5]">
                    {comparisonResult.metrics.deepBlocks.reference}
                  </div>
                  <div className="col-span-2 text-right font-mono text-[#ECECE7] font-medium">
                    {comparisonResult.metrics.deepBlocks.delta > 0
                      ? `+${comparisonResult.metrics.deepBlocks.delta}`
                      : comparisonResult.metrics.deepBlocks.delta}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Coverage & What changed */}
          <div className="md:col-span-4 flex flex-col gap-5">
            {/* Coverage Card */}
            <div className="tf-card p-5 rounded-[10px] bg-[#202122] border border-[#3A3D3E] flex flex-col gap-2">
              <span className="text-[14px] font-medium text-[#ECECE7]">Coverage</span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex flex-col">
                  <span className="text-[16px] font-medium text-[#ECECE7]">
                    {comparisonResult.current.eligibleDaysCount} days
                  </span>
                  <span className="text-[12px] text-[#A1A9A5]">Current period</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[16px] font-medium text-[#A1A9A5]">
                    {comparisonResult.reference.eligibleDaysCount} days
                  </span>
                  <span className="text-[12px] text-[#A1A9A5]">Reference period</span>
                </div>
              </div>
            </div>

            {/* What Changed Card */}
            <div className="tf-card p-5 rounded-[10px] bg-[#202122] border border-[#3A3D3E] flex flex-col gap-3">
              <span className="text-[14px] font-medium text-[#ECECE7]">What changed</span>
              <div className="flex flex-col gap-2">
                {comparisonResult.whatChanged && comparisonResult.whatChanged.length > 0 ? (
                  comparisonResult.whatChanged.map((item) => (
                    <div
                      key={item.app}
                      className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E]"
                    >
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium text-[#ECECE7] truncate">
                          {item.app}
                        </div>
                        <div className="text-[12px] text-[#A1A9A5]">
                          {item.currentFormatted} vs {item.refFormatted}
                        </div>
                      </div>
                      <span className={`font-mono text-[13px] font-medium shrink-0 ml-2 ${
                        item.deltaSeconds >= 0 ? "text-[#DDB66D]" : "text-[#DFA095]"
                      }`}>
                        {item.signedFormatted}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[13px] text-[#A1A9A5] py-2">
                    {comparisonResult.suppressionReason || "No significant shifts (≥30m) observed across periods."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYZER */}
      {activeTab === "analyzer" && (
        <AnalyzerWorkspace
          sessions={ledger}
          focusBlocks={focusBlocks}
          corrections={appliedCorrections}
          rules={classificationRules}
          goalHours={settings.focusGoalHours}
          timezone={TIMEZONE}
        />
      )}

      {/* Evidence Panel Modal */}
      {inspectEvidence && (
        <EvidencePanel
          selectedSegment={null}
          selectedRun={null}
          longestRun={null}
          customEvidence={inspectEvidence}
          timezone={TIMEZONE}
          onClose={() => setInspectEvidence(null)}
          isInline={false}
        />
      )}
    </div>
  );
}

export default function PatternsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#A1A9A5]">Loading insights…</div>}>
      <InsightsContent />
    </Suspense>
  );
}
