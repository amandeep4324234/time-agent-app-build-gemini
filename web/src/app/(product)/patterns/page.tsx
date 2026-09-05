"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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

  return (
    <div className="flex flex-col gap-6 max-w-5xl select-text mx-auto">
      {/* 1. Header & Navigation Tabs (§10.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#3A3D3E]">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold text-[#ECECE7] tracking-tight">
            Insights &amp; Analytics
          </h1>
          <span className="text-xs text-[#A1A9A5]">
            Long-term habits, period comparison, and dedicated custom-range analysis &bull; {TIMEZONE}
          </span>
        </div>

        {/* 3 Main Destination Tabs inside Insights (§10.1) */}
        <div className="flex bg-[#202122] p-1 rounded-[10px] border border-[#3A3D3E] text-xs">
          <button
            onClick={() => handleTabSelect("patterns")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] font-semibold transition-colors ${
              activeTab === "patterns"
                ? "bg-[#DDB66D] text-[#171819]"
                : "text-[#C1C5C1] hover:text-[#ECECE7]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Patterns</span>
          </button>

          <button
            onClick={() => handleTabSelect("compare")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] font-semibold transition-colors ${
              activeTab === "compare"
                ? "bg-[#DDB66D] text-[#171819]"
                : "text-[#C1C5C1] hover:text-[#ECECE7]"
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>

          <button
            onClick={() => handleTabSelect("analyzer")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] font-semibold transition-colors ${
              activeTab === "analyzer"
                ? "bg-[#DDB66D] text-[#171819]"
                : "text-[#C1C5C1] hover:text-[#ECECE7]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyzer</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PATTERNS */}
      {activeTab === "patterns" && (
        <div className="flex flex-col gap-6">
          {/* Window Selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A1A9A5]">
              Evaluated over completed days
            </span>
            <div className="flex rounded-[6px] border border-[#3A3D3E] bg-[#202122] p-0.5 text-xs">
              {([7, 14, 28] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSelectedWindow(days)}
                  className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
                    selectedWindow === days
                      ? "bg-[#DDB66D] text-[#171819] font-semibold"
                      : "text-[#C1C5C1] hover:text-[#ECECE7]"
                  }`}
                >
                  Last {days} days
                </button>
              ))}
            </div>
          </div>

          {/* Insight Cards */}
          <div className="flex flex-col gap-4">
            {insights.length > 0 ? (
              insights.map((item) => (
                <article
                  key={item.insight.key}
                  className="p-5 rounded-[12px] border border-[#3A3D3E] bg-[#202122] flex flex-col gap-3 card-midnight"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wider text-[#DDB66D] font-semibold">
                          {item.insight.family.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-[#A1A9A5]">&bull;</span>
                        <span className="text-xs text-[#A1A9A5]">
                          {item.insight.windowLabel}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-medium text-[#ECECE7] leading-relaxed">
                        {item.insight.sentence}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectEvidence(item.evidence)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#3A3D3E] bg-[#282A2C] text-xs font-semibold text-[#C1C5C1] hover:text-[#ECECE7] hover:bg-[#2F3133] transition-colors shrink-0"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-[#DDB66D]" />
                      <span>View evidence</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#3A3D3E] text-xs text-[#A1A9A5]">
                    <span>Supporting samples: <strong className="text-[#ECECE7] font-mono">{item.insight.sampleCount}</strong></span>
                    <span className="italic text-[11px]">Private activity strictly excluded</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="p-8 rounded-[12px] border border-[#3A3D3E] bg-[#202122] text-center text-xs text-[#A1A9A5] flex flex-col items-center gap-2">
                <Clock className="w-6 h-6 text-[#A1A9A5]/40" />
                <span className="text-sm font-medium text-[#ECECE7]">
                  Not enough history for patterns in this window yet.
                </span>
                <span>
                  Patterns require multiple days of observed coverage before reporting habit correlations.
                </span>
              </div>
            )}
          </div>

          {/* Data Requirements Dropdown */}
          <section className="rounded-[10px] border border-[#3A3D3E] bg-[#202122] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRequirements(!showRequirements)}
              className="w-full flex items-center justify-between p-4 text-xs font-semibold text-[#C1C5C1] hover:text-[#ECECE7] transition-colors"
            >
              <span>Data Requirements &amp; Insight Thresholds (§10)</span>
              {showRequirements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRequirements && (
              <div className="p-4 pt-0 border-t border-[#3A3D3E] divide-y divide-[#3A3D3E] text-xs">
                {ALL_FAMILIES.map((req) => (
                  <div key={req.family} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-[#ECECE7] block">{req.family}</span>
                      <span className="text-[11px] text-[#A1A9A5]">{req.window}</span>
                    </div>
                    <span className="text-xs text-[#C1C5C1] max-w-md sm:text-right">
                      {req.requirement}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: COMPARE */}
      {activeTab === "compare" && (
        <div className="flex flex-col gap-6">
          <div className="card-midnight p-5 bg-[#202122] border border-[#3A3D3E] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#3A3D3E] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[#ECECE7]">Aligned Period Comparison</h3>
                <p className="text-xs text-[#A1A9A5]">
                  Previous 7 completed days vs preceding 7 completed days
                </p>
              </div>
              <span className="text-xs font-mono text-[#DDB66D]">
                {comparisonResult.current.label} vs {comparisonResult.reference.label}
              </span>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-[10px] bg-[#282A2C] border border-[#3A3D3E] flex flex-col">
                <span className="text-xs text-[#C1C5C1]">Average daily focus</span>
                <span className="text-2xl font-mono font-bold text-[#DDB66D] mt-1">
                  {comparisonResult.metrics.focus.currentFormatted}
                </span>
                <span className="text-xs text-[#A1A9A5] mt-1">
                  {comparisonResult.metrics.focus.signedDeltaFormatted} vs ref ({comparisonResult.metrics.focus.refFormatted})
                </span>
              </div>

              <div className="p-4 rounded-[10px] bg-[#282A2C] border border-[#3A3D3E] flex flex-col">
                <span className="text-xs text-[#C1C5C1]">Average daily sinks</span>
                <span className="text-2xl font-mono font-bold text-[#DFA095] mt-1">
                  {comparisonResult.metrics.sink.currentFormatted}
                </span>
                <span className="text-xs text-[#A1A9A5] mt-1">
                  {comparisonResult.metrics.sink.signedDeltaFormatted} vs ref ({comparisonResult.metrics.sink.refFormatted})
                </span>
              </div>

              <div className="p-4 rounded-[10px] bg-[#282A2C] border border-[#3A3D3E] flex flex-col">
                <span className="text-xs text-[#C1C5C1]">Deep blocks (&ge;15m)</span>
                <span className="text-2xl font-mono font-bold text-[#ECECE7] mt-1">
                  {comparisonResult.metrics.deepBlocks.current}
                </span>
                <span className="text-xs text-[#A1A9A5] mt-1">
                  {comparisonResult.metrics.deepBlocks.delta > 0 ? `+${comparisonResult.metrics.deepBlocks.delta}` : comparisonResult.metrics.deepBlocks.delta} vs ref ({comparisonResult.metrics.deepBlocks.reference})
                </span>
              </div>
            </div>

            {/* What Changed List */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-xs font-semibold text-[#ECECE7]">
                What Changed (&ge;30m absolute delta, max 3)
              </span>
              {comparisonResult.whatChanged.length > 0 ? (
                comparisonResult.whatChanged.map((c) => (
                  <div
                    key={c.app}
                    className="p-3 rounded-[8px] bg-[#282A2C] border border-[#3A3D3E] flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-[#ECECE7]">{c.app}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-[#A1A9A5]">{c.refFormatted} &rarr; {c.currentFormatted}</span>
                      <span className={c.deltaSeconds >= 0 ? "text-[#DDB66D]" : "text-[#DFA095]"}>
                        {c.signedFormatted}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-xs text-[#A1A9A5]">
                  No app changes &ge;30m between these two periods.
                </span>
              )}
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
