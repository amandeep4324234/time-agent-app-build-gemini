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
    <div className="flex flex-col gap-6 max-w-6xl select-text mx-auto">
      {/* 1. Top Header & Tabs (Image 4 Panels 1 & 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#26282A]">
        <div>
          <h1 className="text-xl font-bold text-[#ECECE7] tracking-tight">
            Insights
          </h1>
          <p className="text-xs text-[#8E9296] mt-0.5">
            {activeTab === "compare"
              ? "Compare time periods to spot what changed."
              : activeTab === "analyzer"
              ? "Use AI to analyze your time and find practical insights."
              : "Understand your time. Find what works."}
          </p>
        </div>

        {/* Date Selector Pills */}
        {activeTab === "patterns" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#1E1F21] border border-[#2F3134] text-xs text-[#ECECE7]">
            <Clock className="w-3.5 h-3.5 text-[#8E9296]" />
            <span>Aug 18, 2025 &ndash; Aug 31, 2025</span>
            <span className="text-[#8E9296] text-[11px] font-mono">Last 14 days</span>
            <div className="flex items-center gap-1 ml-1 text-[#8E9296]">
              <button className="hover:text-[#ECECE7]">&lsaquo;</button>
              <button className="hover:text-[#ECECE7]">&rsaquo;</button>
            </div>
          </div>
        )}

        {activeTab === "compare" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#1E1F21] border border-[#2F3134] text-xs text-[#ECECE7]">
            <span>Aug 25, 2025 &ndash; Aug 31, 2025 <span className="text-[#8E9296] font-normal">Current period</span></span>
            <span className="text-[#8E9296]">&harr;</span>
            <span>Aug 18, 2025 &ndash; Aug 24, 2025 <span className="text-[#8E9296] font-normal">Previous period</span></span>
          </div>
        )}

        {activeTab === "analyzer" && (
          <button
            onClick={() => alert("Viewing past analyses")}
            className="text-xs text-[#8E9296] hover:text-[#ECECE7] transition-colors"
          >
            View past analyses &rarr;
          </button>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-[#26282A] text-xs font-semibold">
        <button
          onClick={() => handleTabSelect("patterns")}
          className={`pb-2.5 transition-colors ${
            activeTab === "patterns"
              ? "text-[#ECECE7] border-b-2 border-[#DDB66D]"
              : "text-[#8E9296] hover:text-[#ECECE7]"
          }`}
        >
          Patterns
        </button>
        <button
          onClick={() => handleTabSelect("compare")}
          className={`pb-2.5 transition-colors ${
            activeTab === "compare"
              ? "text-[#ECECE7] border-b-2 border-[#DDB66D]"
              : "text-[#8E9296] hover:text-[#ECECE7]"
          }`}
        >
          Compare
        </button>
        <button
          onClick={() => handleTabSelect("analyzer")}
          className={`pb-2.5 transition-colors ${
            activeTab === "analyzer"
              ? "text-[#ECECE7] border-b-2 border-[#DDB66D]"
              : "text-[#8E9296] hover:text-[#ECECE7]"
          }`}
        >
          Analyzer
        </button>
      </div>

      {/* TAB 1: PATTERNS (Image 4 Panel 1) */}
      {activeTab === "patterns" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Recorded session lengths */}
          <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-[#ECECE7]">Recorded session lengths</h3>
              <p className="text-[11px] text-[#8E9296] leading-relaxed">
                Most sessions are 25&ndash;50 minutes, with a clear step-up at 50 minutes.
              </p>
            </div>

            {/* SVG Step Curve Chart */}
            <div className="relative h-44 w-full pt-4 pb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 240 120">
                {/* Horizontal Grid lines */}
                <line x1="30" y1="10" x2="230" y2="10" stroke="#26282A" strokeDasharray="2 2" />
                <line x1="30" y1="35" x2="230" y2="35" stroke="#26282A" strokeDasharray="2 2" />
                <line x1="30" y1="60" x2="230" y2="60" stroke="#26282A" strokeDasharray="2 2" />
                <line x1="30" y1="85" x2="230" y2="85" stroke="#26282A" strokeDasharray="2 2" />
                <line x1="30" y1="110" x2="230" y2="110" stroke="#26282A" />

                {/* Y-axis Labels */}
                <text x="25" y="13" fill="#8E9296" fontSize="8" textAnchor="end">100%</text>
                <text x="25" y="38" fill="#8E9296" fontSize="8" textAnchor="end">75%</text>
                <text x="25" y="63" fill="#8E9296" fontSize="8" textAnchor="end">50%</text>
                <text x="25" y="88" fill="#8E9296" fontSize="8" textAnchor="end">25%</text>
                <text x="25" y="113" fill="#8E9296" fontSize="8" textAnchor="end">0%</text>

                {/* Vertical Step Annotation at 50min */}
                <line x1="110" y1="10" x2="110" y2="110" stroke="#DDB66D" strokeDasharray="2 2" opacity="0.6" />
                <text x="110" y="8" fill="#DDB66D" fontSize="8" textAnchor="middle" fontWeight="bold">
                  50 min (62%)
                </text>

                {/* Step Curve Line */}
                <polyline
                  fill="none"
                  stroke="#DDB66D"
                  strokeWidth="2"
                  points="
                    30,110
                    50,105
                    60,100
                    75,90
                    85,82
                    95,68
                    110,48
                    130,35
                    150,25
                    180,18
                    210,14
                    230,12
                  "
                />

                {/* X-axis Labels */}
                <text x="30" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">0</text>
                <text x="70" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">25</text>
                <text x="110" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">50</text>
                <text x="150" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">75</text>
                <text x="190" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">100</text>
                <text x="230" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">120</text>
              </svg>
              <div className="text-center text-[9px] text-[#8E9296] mt-1">
                Session length (minutes)
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#26282A] pt-2 text-xs">
              <span className="text-[#8E9296] text-[11px]">612 sessions</span>
              <button
                onClick={() => setInspectEvidence({
                  headline: "Recorded session lengths",
                  explanation: "612 sessions analyzed with peak density around 50 minutes.",
                  sampleCount: 612,
                  timezone: "Asia/Kolkata",
                  periodLabel: "Last 14 days",
                } as any)}
                className="text-[#DDB66D] hover:underline text-[11px] font-medium"
              >
                View evidence &rarr;
              </button>
            </div>
          </div>

          {/* Card 2: Work resumption intervals */}
          <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-[#ECECE7]">Work resumption intervals</h3>
              <p className="text-[11px] text-[#8E9296] leading-relaxed">
                You typically return to work within 28 minutes after a break.
              </p>
            </div>

            {/* SVG Scatter Plot */}
            <div className="relative h-44 w-full pt-4 pb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 240 120">
                <line x1="20" y1="110" x2="230" y2="110" stroke="#26282A" />

                {/* Vertical Dotted line at 28min */}
                <line x1="76" y1="15" x2="76" y2="110" stroke="#DDB66D" strokeDasharray="2 2" />
                <text x="76" y="12" fill="#DDB66D" fontSize="8" textAnchor="middle" fontWeight="bold">
                  Median 28 min
                </text>

                {/* Scatter Dots */}
                {[
                  [25, 65], [30, 70], [35, 60], [40, 75], [45, 55], [50, 68], [55, 62],
                  [60, 58], [65, 72], [70, 60], [75, 50], [76, 65], [78, 58], [80, 70],
                  [85, 64], [90, 58], [95, 72], [100, 60], [105, 66], [110, 55],
                  [125, 70], [140, 62], [160, 68], [175, 65], [195, 60], [210, 64], [225, 62]
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="2.5" fill="#E58376" opacity="0.85" />
                ))}

                {/* X-axis */}
                <text x="20" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">0</text>
                <text x="80" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">30</text>
                <text x="130" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">60</text>
                <text x="180" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">90</text>
                <text x="230" y="122" fill="#8E9296" fontSize="8" textAnchor="middle">120</text>
              </svg>
              <div className="text-center text-[9px] text-[#8E9296] mt-1">
                Time to resume work (minutes)
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#26282A] pt-2 text-xs">
              <span className="text-[#8E9296] text-[11px]">428 transitions</span>
              <button
                onClick={() => setInspectEvidence({
                  headline: "Work resumption intervals",
                  explanation: "428 break-to-work transitions with a median resumption time of 28 minutes.",
                  sampleCount: 428,
                  timezone: "Asia/Kolkata",
                  periodLabel: "Last 14 days",
                } as any)}
                className="text-[#DDB66D] hover:underline text-[11px] font-medium"
              >
                View evidence &rarr;
              </button>
            </div>
          </div>

          {/* Card 3: Block review patterns */}
          <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-[#ECECE7]">Block review patterns</h3>
              <p className="text-[11px] text-[#8E9296] leading-relaxed">
                Reviewed blocks are more common on weekdays and tend to be longer.
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] text-[#8E9296] self-end">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#DDB66D]" />
                <span>Reviewed</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E58376]" />
                <span>Not reviewed</span>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="relative h-40 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 240 120">
                {/* Y-axis numbers */}
                <text x="15" y="15" fill="#8E9296" fontSize="8" textAnchor="end">80</text>
                <text x="15" y="45" fill="#8E9296" fontSize="8" textAnchor="end">60</text>
                <text x="15" y="75" fill="#8E9296" fontSize="8" textAnchor="end">40</text>
                <text x="15" y="105" fill="#8E9296" fontSize="8" textAnchor="end">20</text>
                <text x="15" y="118" fill="#8E9296" fontSize="8" textAnchor="end">0</text>

                {/* Day bars (Mon - Sun) */}
                {[
                  { day: "Mon", rev: 55, notRev: 15, x: 30 },
                  { day: "Tue", rev: 50, notRev: 12, x: 60 },
                  { day: "Wed", rev: 72, notRev: 18, x: 90 },
                  { day: "Thu", rev: 58, notRev: 14, x: 120 },
                  { day: "Fri", rev: 25, notRev: 10, x: 150 },
                  { day: "Sat", rev: 18, notRev: 8, x: 180 },
                  { day: "Sun", rev: 20, notRev: 8, x: 210 },
                ].map((b) => (
                  <g key={b.day}>
                    {/* Reviewed Bar */}
                    <rect
                      x={b.x}
                      y={115 - b.rev}
                      width="8"
                      height={b.rev}
                      rx="1"
                      fill="#DDB66D"
                    />
                    {/* Not Reviewed Bar */}
                    <rect
                      x={b.x + 9}
                      y={115 - b.notRev}
                      width="8"
                      height={b.notRev}
                      rx="1"
                      fill="#E58376"
                    />
                    <text x={b.x + 8} y="126" fill="#8E9296" fontSize="8" textAnchor="middle">
                      {b.day}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="flex items-center justify-between border-t border-[#26282A] pt-2 text-xs">
              <span className="text-[#8E9296] text-[11px]">304 blocks</span>
              <button
                onClick={() => setInspectEvidence({
                  headline: "Block review patterns",
                  explanation: "304 blocks analyzed across weekdays vs weekends.",
                  sampleCount: 304,
                  timezone: "Asia/Kolkata",
                  periodLabel: "Last 14 days",
                } as any)}
                className="text-[#DDB66D] hover:underline text-[11px] font-medium"
              >
                View evidence &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPARE (Image 4 Panel 2) */}
      {activeTab === "compare" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column (8 cols): Daily focus duration & Key differences */}
          <div className="md:col-span-8 flex flex-col gap-5">
            {/* Daily Focus Duration Bar Chart */}
            <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#ECECE7]">Daily focus duration</h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#DDB66D]" />
                    <span className="text-[#ECECE7]">Aug 25 &ndash; 31</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E58376]" />
                    <span className="text-[#8E9296]">Aug 18 &ndash; 24</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="relative h-44 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120">
                  {/* Y-axis */}
                  <text x="15" y="15" fill="#8E9296" fontSize="8" textAnchor="end">8h</text>
                  <text x="15" y="40" fill="#8E9296" fontSize="8" textAnchor="end">6h</text>
                  <text x="15" y="65" fill="#8E9296" fontSize="8" textAnchor="end">4h</text>
                  <text x="15" y="90" fill="#8E9296" fontSize="8" textAnchor="end">2h</text>
                  <text x="15" y="115" fill="#8E9296" fontSize="8" textAnchor="end">0h</text>

                  {/* Paired Bars for Mon - Sun */}
                  {[
                    { day: "Mon", cur: 45, prev: 35, x: 30 },
                    { day: "Tue", cur: 55, prev: 42, x: 70 },
                    { day: "Wed", cur: 65, prev: 58, x: 110 },
                    { day: "Thu", cur: 95, prev: 50, x: 150 },
                    { day: "Fri", cur: 70, prev: 60, x: 190 },
                    { day: "Sat", cur: 40, prev: 50, x: 230 },
                    { day: "Sun", cur: 22, prev: 38, x: 270 },
                  ].map((b) => (
                    <g key={b.day}>
                      <rect
                        x={b.x}
                        y={115 - b.cur}
                        width="12"
                        height={b.cur}
                        rx="1.5"
                        fill="#DDB66D"
                      />
                      <rect
                        x={b.x + 14}
                        y={115 - b.prev}
                        width="12"
                        height={b.prev}
                        rx="1.5"
                        fill="#E58376"
                      />
                      <text x={b.x + 13} y="126" fill="#8E9296" fontSize="8" textAnchor="middle">
                        {b.day}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Key Differences Table */}
            <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-3">
              <h3 className="text-xs font-bold text-[#ECECE7]">Key differences</h3>
              <div className="flex flex-col divide-y divide-[#26282A] text-xs">
                <div className="grid grid-cols-12 py-2 text-[10px] text-[#8E9296] font-semibold">
                  <div className="col-span-5">Metric</div>
                  <div className="col-span-3 text-right">Current</div>
                  <div className="col-span-2 text-right">Previous</div>
                  <div className="col-span-2 text-right">Diff</div>
                </div>

                {[
                  { label: "Total focus time", cur: "28h 24m", prev: "20h 17m", diff: "+8h 07m", icon: "⏱️" },
                  { label: "Average per day", cur: "4h 03m", prev: "2h 54m", diff: "+1h 09m", icon: "📊" },
                  { label: "Number of blocks", cur: "52", prev: "41", diff: "+11", icon: "📅" },
                  { label: "Average block length", cur: "32m", prev: "30m", diff: "+2m", icon: "⏳" },
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-12 py-2.5 items-center">
                    <div className="col-span-5 flex items-center gap-2">
                      <span>{row.icon}</span>
                      <span className="text-[#ECECE7] font-medium">{row.label}</span>
                    </div>
                    <div className="col-span-3 text-right font-mono text-[#ECECE7]">{row.cur}</div>
                    <div className="col-span-2 text-right font-mono text-[#8E9296]">{row.prev}</div>
                    <div className="col-span-2 text-right font-mono text-[#DDB66D] font-bold">{row.diff}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Coverage & What changed */}
          <div className="md:col-span-4 flex flex-col gap-5">
            {/* Coverage Card */}
            <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-2">
              <span className="text-xs font-bold text-[#ECECE7]">Coverage</span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#ECECE7]">7 observed days</span>
                  <span className="text-[10px] text-[#8E9296]">Aug 25 &ndash; 31, 2025</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#8E9296]">7 observed days</span>
                  <span className="text-[10px] text-[#8E9296]">Aug 18 &ndash; 24, 2025</span>
                </div>
              </div>
            </div>

            {/* What Changed Card */}
            <div className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex flex-col gap-3">
              <span className="text-xs font-bold text-[#ECECE7]">What changed</span>
              <div className="flex flex-col gap-2.5">
                {[
                  { name: "Visual Studio Code", sub: "More time than previous period", diff: "+3h 12m", isMore: true, icon: "💻" },
                  { name: "Google Chrome", sub: "More time than previous period", diff: "+2h 48m", isMore: true, icon: "🌐" },
                  { name: "Notion", sub: "More time than previous period", diff: "+1h 06m", isMore: true, icon: "📝" },
                  { name: "YouTube", sub: "Less time than previous period", diff: "-1h 20m", isMore: false, icon: "▶️" },
                ].map((app) => (
                  <div key={app.name} className="flex items-center justify-between p-2 rounded-[8px] bg-[#1E1F21] border border-[#2A2C2E]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm">{app.icon}</span>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-[#ECECE7] truncate">{app.name}</div>
                        <div className="text-[10px] text-[#8E9296] truncate">{app.sub}</div>
                      </div>
                    </div>
                    <span className={`font-mono text-xs font-bold shrink-0 ml-2 ${app.isMore ? "text-[#DDB66D]" : "text-[#E58376]"}`}>
                      {app.diff}
                    </span>
                  </div>
                ))}
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
