"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { isPaid } from "@/lib/entitlement";
import { buildLedger } from "@/lib/ingest";
import { getLogicalDay } from "@/lib/day";
import { Envelope } from "@/lib/types";
import { Evidence } from "@/lib/presentation-types";
import { evaluateHistoricalObservations, EvaluatedInsight } from "@/lib/observations";
import { EvidencePanel } from "@/components/today/EvidencePanel";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import { Sparkles, ChevronDown, ChevronUp, ChevronRight, BarChart3, Clock, AlertCircle } from "lucide-react";

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

function PatternsContent() {
  const { entitlement, seedPins, overrides } = useAppStore();
  const isPro = isPaid(entitlement);

  // Window selector state (§8.1): 7 / 14 / 28 days (default 14)
  const [selectedWindow, setSelectedWindow] = useState<7 | 14 | 28>(14);
  const [showRequirements, setShowRequirements] = useState(false);
  const [inspectEvidence, setInspectEvidence] = useState<Evidence | null>(null);

  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

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

  return (
    <div className="flex flex-col gap-6 max-w-4xl select-text">
      {/* 1. Header & Window Selector (§8.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#303B49]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#EDF1F5] tracking-tight">
              Patterns
            </h1>
            {!isPro && (
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-[4px] bg-[#E4B45F]/20 text-[#E4B45F] border border-[#E4B45F]/30">
                Illustrative Demo
              </span>
            )}
          </div>
          <span className="text-xs text-[#94A1B2]">
            Read-time observational analysis across multi-day windows · {TIMEZONE}
          </span>
        </div>

        {/* Window Selector (§8.1) */}
        <div className="flex rounded-[6px] border border-[#303B49] bg-[#141A22] p-1 text-xs">
          {([7, 14, 28] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setSelectedWindow(days)}
              className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
                selectedWindow === days
                  ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
                  : "text-[#94A1B2] hover:text-[#EDF1F5]"
              }`}
            >
              Last {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Pro Access Notice when not upgraded (§8.1, §13) */}
      {!isPro && (
        <div className="p-4 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#E4B45F] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#EDF1F5]">
                Timeframe Pro Feature
              </span>
              <span className="text-xs text-[#B0BBC9] leading-relaxed">
                Patterns analyzes multi-week app habits with strict data-sufficiency gates. Below is an illustrative demonstration based on verified local sessions.
              </span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="px-4 py-2 rounded-[6px] bg-[#EDF1F5] text-[#0D1117] text-xs font-semibold hover:bg-white transition-colors shrink-0 text-center"
          >
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* 2. Vertically Ordered Insight List (§8.1) */}
      <div className="flex flex-col gap-4">
        {insights.length > 0 ? (
          insights.map((item) => (
            <article
              key={item.insight.key}
              className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#E4B45F] font-semibold">
                      {item.insight.family.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-[#94A1B2]">·</span>
                    <span className="text-xs text-[#94A1B2]">
                      Evaluated over {item.insight.windowLabel}
                    </span>
                  </div>
                  <h2 className="text-base md:text-lg font-medium text-[#EDF1F5] leading-relaxed">
                    {item.insight.sentence}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectEvidence(item.evidence)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#303B49] bg-[#0D1117] text-xs font-medium text-[#B0BBC9] hover:text-[#EDF1F5] hover:bg-[#1D2530] transition-colors shrink-0 self-start sm:self-auto"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#94A1B2]" />
                  <span>View evidence</span>
                </button>
              </div>

              {/* Sample and Confidence Details */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#303B49]/60 text-xs text-[#94A1B2]">
                <div className="flex items-center gap-3">
                  <span>Supporting samples: <strong className="text-[#EDF1F5] font-mono-nums">{item.insight.sampleCount}</strong></span>
                  <span>·</span>
                  <span>Statistic: <strong className="text-[#EDF1F5] capitalize">{item.insight.statistic}</strong></span>
                </div>
                <span className="text-[11px] italic">Private activity excluded</span>
              </div>
            </article>
          ))
        ) : (
          <div className="p-8 rounded-[10px] border border-[#303B49] bg-[#141A22] text-center flex flex-col items-center justify-center gap-2 text-xs text-[#94A1B2]">
            <Clock className="w-6 h-6 text-[#627086]" />
            <span className="text-sm font-medium text-[#EDF1F5]">
              Not enough history for patterns in this window yet.
            </span>
            <span>
              Patterns require multiple days of observed coverage before reporting habit correlations.
            </span>
          </div>
        )}
      </div>

      {/* 3. Collapsed Data Requirements Section (§8.1, §9) */}
      <section className="rounded-[10px] border border-[#303B49] bg-[#141A22] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRequirements(!showRequirements)}
          className="w-full flex items-center justify-between p-4 text-xs font-semibold text-[#B0BBC9] hover:text-[#EDF1F5] transition-colors text-left"
        >
          <span>Data Requirements &amp; Insight Thresholds (§9)</span>
          {showRequirements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRequirements && (
          <div className="p-4 pt-0 border-t border-[#303B49] divide-y divide-[#303B49]/60 text-xs">
            {ALL_FAMILIES.map((req) => {
              const isWindowEligible = selectedWindow >= req.requiredDays;
              const activeInsight = insights.find((i) => i.insight.family.toLowerCase().replace(/_/g, " ") === req.family.toLowerCase());
              return (
                <div key={req.family} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#EDF1F5]">{req.family}</span>
                      {!isWindowEligible ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-[3px] bg-[#303B49] text-[#94A1B2]">
                          Unavailable for {selectedWindow}d
                        </span>
                      ) : activeInsight ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-[3px] bg-[#E4B45F]/20 text-[#E4B45F]">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-[3px] bg-[#202A36] text-[#B0BBC9]">
                          Threshold not met
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#94A1B2]">{req.window}</span>
                  </div>
                  <span className="text-xs text-[#B0BBC9] max-w-md sm:text-right leading-relaxed">
                    {req.requirement}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Evidence Sheet Modal */}
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
    <Suspense fallback={<div className="p-8 text-sm text-[#94A1B2]">Loading patterns…</div>}>
      <PatternsContent />
    </Suspense>
  );
}
