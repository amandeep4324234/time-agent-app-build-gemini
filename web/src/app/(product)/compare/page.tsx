"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { isPaid } from "@/lib/entitlement";
import { buildLedger } from "@/lib/ingest";
import { getLogicalDay } from "@/lib/day";
import { Envelope } from "@/lib/types";
import { comparePeriods, ComparisonResult } from "@/lib/compare-engine";
import { buildSafeDayPresentation } from "@/lib/safe-adapter";
import { computeFocusRuns } from "@/lib/focus-run";
import { formatDuration } from "@/lib/format";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import { Sparkles, Calendar, ArrowRight, TrendingUp, TrendingDown, Layers, CheckCircle2 } from "lucide-react";
import { DateTime } from "luxon";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;
const TIMEZONE = "Asia/Kolkata";

function CompareContent() {
  const { entitlement, seedPins, overrides } = useAppStore();
  const isPro = isPaid(entitlement);

  const [compareMode, setCompareMode] = useState<"week" | "day">("week");

  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  // Extract completed days
  const availableDays = useMemo(() => {
    const days = new Set<string>();
    for (const s of ledger) {
      days.add(getLogicalDay(s.started_at_ms, TIMEZONE));
    }
    return Array.from(days).sort();
  }, [ledger]);

  // Completed days (excluding incomplete latest day for strict comparison per §8.2)
  const completedDays = useMemo(() => {
    return availableDays.slice(0, -1);
  }, [availableDays]);

  // Default week comparison: previous 7 completed days vs prior 7 completed days (§8.2)
  const currentWeekDays = useMemo(() => {
    return completedDays.slice(-7);
  }, [completedDays]);

  const referenceWeekDays = useMemo(() => {
    return completedDays.slice(-14, -7);
  }, [completedDays]);

  // Day comparison defaults
  const [selectedDayCurrent, setSelectedDayCurrent] = useState<string>(
    completedDays.length > 0 ? completedDays[completedDays.length - 1] : "2026-09-01"
  );
  const [selectedDayRef, setSelectedDayRef] = useState<string>(
    completedDays.length > 1 ? completedDays[completedDays.length - 2] : "2026-08-31"
  );

  // Compute comparison result
  const comparisonResult: ComparisonResult = useMemo(() => {
    if (compareMode === "week") {
      return comparePeriods(currentWeekDays, referenceWeekDays, ledger, TIMEZONE);
    } else {
      return comparePeriods([selectedDayCurrent], [selectedDayRef], ledger, TIMEZONE);
    }
  }, [compareMode, currentWeekDays, referenceWeekDays, selectedDayCurrent, selectedDayRef, ledger]);

  const { current, reference, metrics, whatChanged, isWhatChangedSuppressed, suppressionReason } =
    comparisonResult;

  const currentSafe = useMemo(() => {
    if (compareMode !== "day") return null;
    const startMs = DateTime.fromISO(`${selectedDayCurrent}T04:00:00`, { zone: TIMEZONE }).toMillis();
    const endMs = DateTime.fromISO(`${selectedDayCurrent}T04:00:00`, { zone: TIMEZONE }).plus({ days: 1 }).toMillis();
    const daySessions = ledger.filter((s) => getLogicalDay(s.started_at_ms, TIMEZONE) === selectedDayCurrent);
    const { runs } = computeFocusRuns(daySessions);
    return buildSafeDayPresentation(selectedDayCurrent, daySessions, runs, startMs, endMs, TIMEZONE);
  }, [compareMode, selectedDayCurrent, ledger]);

  const refSafe = useMemo(() => {
    if (compareMode !== "day") return null;
    const startMs = DateTime.fromISO(`${selectedDayRef}T04:00:00`, { zone: TIMEZONE }).toMillis();
    const endMs = DateTime.fromISO(`${selectedDayRef}T04:00:00`, { zone: TIMEZONE }).plus({ days: 1 }).toMillis();
    const daySessions = ledger.filter((s) => getLogicalDay(s.started_at_ms, TIMEZONE) === selectedDayRef);
    const { runs } = computeFocusRuns(daySessions);
    return buildSafeDayPresentation(selectedDayRef, daySessions, runs, startMs, endMs, TIMEZONE);
  }, [compareMode, selectedDayRef, ledger]);

  const getSegmentColor = (cat: string) => {
    switch (cat) {
      case "work":
        return "bg-[#E4B45F]";
      case "sink":
        return "bg-[#F28D87]";
      case "games":
        return "bg-[#B3BBC7]";
      case "other-known":
        return "bg-[#8795A8]";
      case "unclassified":
      default:
        return "bg-[#627086]";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl select-text">
      {/* 1. Header & Mode Switcher (§8.2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#303B49]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#EDF1F5] tracking-tight">
              Compare
            </h1>
            {!isPro && (
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-[4px] bg-[#E4B45F]/20 text-[#E4B45F] border border-[#E4B45F]/30">
                Illustrative Demo
              </span>
            )}
          </div>
          <span className="text-xs text-[#94A1B2]">
            Aligned period comparison · No overlapping ghost pixels · {TIMEZONE}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-[6px] border border-[#303B49] bg-[#141A22] p-1 text-xs">
          <button
            type="button"
            onClick={() => setCompareMode("week")}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
              compareMode === "week"
                ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
                : "text-[#94A1B2] hover:text-[#EDF1F5]"
            }`}
          >
            Previous 7 days
          </button>
          <button
            type="button"
            onClick={() => setCompareMode("day")}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
              compareMode === "day"
                ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
                : "text-[#94A1B2] hover:text-[#EDF1F5]"
            }`}
          >
            Choose two dates
          </button>
        </div>
      </div>

      {/* Date Pickers for Day Mode */}
      {compareMode === "day" && (
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-[10px] border border-[#303B49] bg-[#141A22] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#94A1B2] font-medium">Current day:</span>
            <select
              value={selectedDayCurrent}
              onChange={(e) => setSelectedDayCurrent(e.target.value)}
              className="px-2.5 py-1.5 rounded-[6px] border border-[#303B49] bg-[#0D1117] text-[#EDF1F5] focus:outline-none"
            >
              {completedDays.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#94A1B2] font-medium">Reference day:</span>
            <select
              value={selectedDayRef}
              onChange={(e) => setSelectedDayRef(e.target.value)}
              className="px-2.5 py-1.5 rounded-[6px] border border-[#303B49] bg-[#0D1117] text-[#EDF1F5] focus:outline-none"
            >
              {completedDays.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Pro Entitlement Banner (§8.2, §13) */}
      {!isPro && (
        <div className="p-4 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#E4B45F] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#EDF1F5]">
                Timeframe Pro Feature
              </span>
              <span className="text-xs text-[#B0BBC9] leading-relaxed">
                Compare aligns verified completed days side-by-side on the same scale without translucent ghost overlays.
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

      {/* Period Description Banner */}
      <div className="flex items-center justify-between px-4 py-3 rounded-[6px] bg-[#141A22] border border-[#303B49] text-xs">
        <div className="flex items-center gap-2 text-[#EDF1F5]">
          <span className="font-semibold text-[#E4B45F]">Current:</span>
          <span>{current.label} ({current.eligibleDaysCount} days with data)</span>
        </div>
        <div className="flex items-center gap-2 text-[#B0BBC9]">
          <span className="font-semibold text-[#94A1B2]">Reference:</span>
          <span>{reference.label} ({reference.eligibleDaysCount} days with data)</span>
        </div>
      </div>

      {/* 2. Metric Rows: Focus, Sink, Deep Blocks (§8.2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Focus Time Card */}
        <div className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-3">
          <span className="text-xs font-medium text-[#B0BBC9]">
            {metrics.focus.isAverage ? "Average daily focus" : "Total focus time"}
          </span>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-semibold text-[#E4B45F] font-mono-nums">
              {metrics.focus.currentFormatted}
            </span>
            <span
              className={`text-sm font-semibold font-mono-nums ${
                metrics.focus.deltaSeconds >= 0 ? "text-[#E4B45F]" : "text-[#94A1B2]"
              }`}
            >
              {metrics.focus.signedDeltaFormatted}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-[#94A1B2] border-t border-[#303B49]/60 pt-2 font-mono-nums">
            <span>Reference: {metrics.focus.refFormatted}</span>
            {metrics.focus.percentChange !== null && (
              <span>({metrics.focus.percentChange > 0 ? `+${metrics.focus.percentChange}` : metrics.focus.percentChange}%)</span>
            )}
          </div>
        </div>

        {/* Sink Time Card */}
        <div className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-3">
          <span className="text-xs font-medium text-[#B0BBC9]">
            {metrics.sink.isAverage ? "Average daily sinks" : "Total sink time"}
          </span>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-semibold text-[#F28D87] font-mono-nums">
              {metrics.sink.currentFormatted}
            </span>
            <span
              className={`text-sm font-semibold font-mono-nums ${
                metrics.sink.deltaSeconds <= 0 ? "text-[#B0BBC9]" : "text-[#F28D87]"
              }`}
            >
              {metrics.sink.signedDeltaFormatted}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-[#94A1B2] border-t border-[#303B49]/60 pt-2 font-mono-nums">
            <span>Reference: {metrics.sink.refFormatted}</span>
            {metrics.sink.percentChange !== null && (
              <span>({metrics.sink.percentChange > 0 ? `+${metrics.sink.percentChange}` : metrics.sink.percentChange}%)</span>
            )}
          </div>
        </div>

        {/* Deep Blocks Card */}
        <div className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-3">
          <span className="text-xs font-medium text-[#B0BBC9]">
            Deep blocks (≥15m)
          </span>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-semibold text-[#EDF1F5] font-mono-nums">
              {metrics.deepBlocks.current}
            </span>
            <span className="text-sm font-semibold font-mono-nums text-[#EDF1F5]">
              {metrics.deepBlocks.delta > 0
                ? `+${metrics.deepBlocks.delta}`
                : metrics.deepBlocks.delta}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-[#94A1B2] border-t border-[#303B49]/60 pt-2 font-mono-nums">
            <span>Reference: {metrics.deepBlocks.reference}</span>
          </div>
        </div>
      </div>

      {/* 3. Aligned Charts: Paired Daily Bars (Week) or Stacked Timelines (Day) (§8.2) */}
      {compareMode === "week" ? (
        <section className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#303B49]">
            <h2 className="text-sm font-semibold text-[#EDF1F5]">
              Daily Focus Comparison (Paired Bars)
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[2px] bg-[#E4B45F]" />
                <span className="text-[#EDF1F5]">Current week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[2px] bg-[#8795A8]" />
                <span className="text-[#94A1B2]">Reference week</span>
              </div>
            </div>
          </div>

          {/* Daily Paired Bars */}
          <div className="flex flex-col gap-3">
            {current.dailyFocusSeconds.map((currDay, idx) => {
              const refDay = reference.dailyFocusSeconds[idx] || { seconds: 0 };
              const maxSec = 6 * 3600; // 6h scale
              const currPct = Math.min(100, (currDay.seconds / maxSec) * 100);
              const refPct = Math.min(100, (refDay.seconds / maxSec) * 100);

              return (
                <div key={currDay.date} className="flex items-center gap-4 text-xs">
                  <span className="w-12 text-[#94A1B2] shrink-0 font-medium">{currDay.dayLabel}</span>
                  <div className="flex-1 flex flex-col gap-1">
                    {/* Current Bar */}
                    <div className="w-full h-3 rounded-[2px] bg-[#202A36] overflow-hidden flex items-center">
                      <div
                        className="h-full bg-[#E4B45F] rounded-[2px] transition-all duration-normal"
                        style={{ width: `${currPct}%` }}
                      />
                    </div>
                    {/* Reference Bar */}
                    <div className="w-full h-3 rounded-[2px] bg-[#202A36] overflow-hidden flex items-center">
                      <div
                        className="h-full bg-[#8795A8] rounded-[2px] transition-all duration-normal"
                        style={{ width: `${refPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right font-mono-nums text-[11px] shrink-0 text-[#EDF1F5]">
                    {formatDuration(currDay.seconds)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#303B49]">
            <div>
              <h2 className="text-sm font-semibold text-[#EDF1F5]">
                Stacked Timeline Comparison
              </h2>
              <span className="text-xs text-[#94A1B2]">
                Shared 04:00–04:00 viewport scale · No translucent ghost overlay (§8.2)
              </span>
            </div>
            {/* Shared Category Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#E4B45F]" />
                <span className="text-[#EDF1F5]">Work</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#F28D87]" />
                <span className="text-[#EDF1F5]">Sink</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#B3BBC7]" />
                <span className="text-[#EDF1F5]">Games</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#8795A8]" />
                <span className="text-[#EDF1F5]">Other</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#627086]" />
                <span className="text-[#EDF1F5]">Unclassified</span>
              </div>
            </div>
          </div>

          {/* Stacked Timelines */}
          <div className="flex flex-col gap-6">
            {[
              { label: "Current Day", date: selectedDayCurrent, safe: currentSafe },
              { label: "Reference Day", date: selectedDayRef, safe: refSafe },
            ].map(({ label, date, safe }) => (
              <div key={label} className="flex flex-col gap-2 p-4 rounded-[8px] bg-[#0D1117] border border-[#303B49]/60">
                <div className="flex items-center justify-between pb-2 border-b border-[#303B49]/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#EDF1F5]">{label}:</span>
                    <span className="font-mono-nums text-[#94A1B2]">{date}</span>
                  </div>
                  <span className="text-[11px] text-[#94A1B2] font-mono-nums">
                    Focus: {formatDuration(safe?.metrics.focus.value || 0)} · Sink: {formatDuration(safe?.metrics.sink.value || 0)}
                  </span>
                </div>

                {/* Timeline Lanes: Focus runs, Computer, Phone (§7.1) */}
                <div className="flex flex-col gap-2 pt-1">
                  {/* Lane 1: Combined focus runs */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 h-auto md:h-11">
                    <div className="w-24 shrink-0 text-xs font-medium text-[#E4B45F]">
                      Focus runs
                    </div>
                    <div className="relative flex-1 h-6 rounded-[3px] bg-[#141A22] border border-[#303B49]/60 overflow-hidden">
                      {safe?.segments.focusRuns.map((run) => (
                        <div
                          key={run.id}
                          title={`Focus run: ${formatDuration(run.durationSeconds)}`}
                          style={{
                            left: `${Math.max(0, run.leftPercent)}%`,
                            width: `${Math.max(0.5, run.widthPercent)}%`,
                          }}
                          className="absolute top-0 bottom-0 bg-[#E4B45F] rounded-[2px]"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Lane 2: Computer */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 h-auto md:h-12">
                    <div className="w-24 shrink-0 text-xs font-medium text-[#B0BBC9]">
                      Computer
                    </div>
                    <div className="relative flex-1 h-7 rounded-[3px] bg-[#141A22] border border-[#303B49]/60 overflow-hidden">
                      {safe?.segments.computer.map((seg) => (
                        <div
                          key={seg.id}
                          title={`${seg.app} (${seg.category}): ${formatDuration(seg.durationSeconds)}`}
                          style={{
                            left: `${Math.max(0, seg.leftPercent)}%`,
                            width: `${Math.max(0.4, seg.widthPercent)}%`,
                          }}
                          className={`absolute top-0 bottom-0 rounded-[2px] ${getSegmentColor(seg.category)}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Lane 3: Phone */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 h-auto md:h-12">
                    <div className="w-24 shrink-0 text-xs font-medium text-[#B0BBC9]">
                      Phone
                    </div>
                    <div className="relative flex-1 h-7 rounded-[3px] bg-[#141A22] border border-[#303B49]/60 overflow-hidden">
                      {safe?.segments.phone.map((seg) => (
                        <div
                          key={seg.id}
                          title={`${seg.app} (${seg.category}): ${formatDuration(seg.durationSeconds)}`}
                          style={{
                            left: `${Math.max(0, seg.leftPercent)}%`,
                            width: `${Math.max(0.4, seg.widthPercent)}%`,
                          }}
                          className={`absolute top-0 bottom-0 rounded-[2px] ${getSegmentColor(seg.category)}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Shared Time Axis Ticks (04:00 to 04:00) */}
            <div className="flex items-center justify-between text-[10px] text-[#94A1B2] font-mono-nums px-2 md:pl-28">
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>00:00</span>
              <span>04:00</span>
            </div>
          </div>
        </section>
      )}

      {/* 4. "What Changed" List (§8.2): Capped at 3 entries */}
      <section className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#303B49]">
          <h2 className="text-sm font-semibold text-[#EDF1F5]">
            What changed (≥30m absolute delta)
          </h2>
          <span className="text-xs text-[#94A1B2]">Capped at 3</span>
        </div>

        {!isWhatChangedSuppressed && whatChanged.length > 0 ? (
          <div className="flex flex-col gap-2">
            {whatChanged.map((item) => (
              <div
                key={item.app}
                className="flex items-center justify-between p-3 rounded-[6px] border border-[#303B49] bg-[#0D1117] text-xs"
              >
                <span className="font-medium text-[#EDF1F5]">{item.app}</span>
                <div className="flex items-center gap-4 font-mono-nums">
                  <span className="text-[#94A1B2]">
                    {item.refFormatted} → {item.currentFormatted}
                  </span>
                  <span
                    className={`font-semibold ${
                      item.deltaSeconds >= 0 ? "text-[#E4B45F]" : "text-[#B0BBC9]"
                    }`}
                  >
                    {item.signedFormatted}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-[#94A1B2]">
            {suppressionReason || "No changes greater than 30 minutes observed between these periods."}
          </div>
        )}
      </section>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#94A1B2]">Loading comparison…</div>}>
      <CompareContent />
    </Suspense>
  );
}
