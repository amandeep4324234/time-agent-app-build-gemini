"use client";

import React, { useState } from "react";
import { Clock, CheckCircle2, AlertTriangle, Zap, HelpCircle } from "lucide-react";
import { SafeEffectiveDayResult } from "@/lib/effective-adapter";
import { formatMinutes, formatDurationSeconds } from "@/lib/format";

interface MetricCardsProps {
  dayResult: SafeEffectiveDayResult;
  onOpenFocusEvidence?: () => void;
  onOpenBlocksList?: () => void;
  onOpenSinkEvidence?: () => void;
}

export function MetricCards({
  dayResult,
  onOpenFocusEvidence,
  onOpenBlocksList,
  onOpenSinkEvidence,
}: MetricCardsProps) {
  const { metrics, availability } = dayResult;
  const isNoData = availability === "no-data";

  const [activeModal, setActiveModal] = useState<"focus" | "sink" | null>(null);

  const handleKeyDown = (action?: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action?.();
    }
  };

  // Focus time formatted
  const focusSec = metrics.focus.value;
  const focusFormatted = isNoData || focusSec === null
    ? "—"
    : formatDurationSeconds(focusSec);

  // Sink time formatted
  const sinkSec = metrics.sink.value;
  const sinkFormatted = isNoData || sinkSec === null
    ? "—"
    : formatDurationSeconds(sinkSec);

  // Longest deep block
  const longestSec = metrics.longestDeepBlock.longestSeconds;
  const longestFormatted = isNoData || longestSec === 0
    ? "—"
    : formatDurationSeconds(longestSec);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 select-text">
        {/* 1. Focus Time (4/12 width on desktop) */}
        <div
          onClick={() => setActiveModal("focus")}
          onKeyDown={handleKeyDown(() => setActiveModal("focus"))}
          className="col-span-1 lg:col-span-4 card-midnight p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#AAA9FF]/40 transition-colors bg-[#141A25] border border-[#2B374B]"
          role="button"
          tabIndex={0}
          aria-label="Focus time metric"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B8C4D8]">
              Focus Time
            </span>
            {metrics.focus.goalHours && (
              <span className="text-[11px] font-mono text-[#AAA9FF] px-1.5 py-0.5 rounded-[4px] bg-[#AAA9FF]/10">
                Goal {metrics.focus.goalHours}h
              </span>
            )}
          </div>

          <div className="my-1 sm:my-2">
            <div className="text-3xl sm:text-4xl font-mono font-medium text-[#F2F5FB] tracking-tight">
              {focusFormatted}
            </div>
            <div className="text-[11px] text-[#96A5BD] mt-0.5 flex items-center justify-between">
              <span>Cross-device approved Work</span>
              <HelpCircle className="w-3 h-3 text-[#AAA9FF]/70" />
            </div>
          </div>

          {/* 7-day sparkline */}
          <div className="flex items-end gap-1 h-5 pt-1">
            {metrics.focus.sparklineDays.map((val, idx) => {
              const heightPct = Math.min(100, Math.max(15, (val / 6) * 100));
              const isCurrent = idx === metrics.focus.sparklineDays.length - 1;
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-t-[2px] transition-all ${
                    isCurrent ? "bg-[#AAA9FF]" : "bg-[#AAA9FF]/30"
                  }`}
                  style={{ height: `${heightPct}%` }}
                  title={`Day ${idx + 1}: ${val.toFixed(1)}h`}
                />
              );
            })}
          </div>
        </div>

        {/* 2. Focus Blocks (3/12 width on desktop) */}
        <div
          onClick={onOpenBlocksList}
          onKeyDown={handleKeyDown(onOpenBlocksList)}
          className="col-span-1 lg:col-span-3 card-midnight p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#AAA9FF]/40 transition-colors bg-[#141A25] border border-[#2B374B]"
          role="button"
          tabIndex={0}
          aria-label="Focus blocks metric"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B8C4D8]">
              Focus Blocks
            </span>
            <span className="text-[11px] font-medium text-[#7CDCE5] px-1.5 py-0.5 rounded-[4px] bg-[#7CDCE5]/10">
              Intentional
            </span>
          </div>

          <div className="my-1 sm:my-2">
            <div className="text-3xl sm:text-4xl font-mono font-medium text-[#F2F5FB] tracking-tight">
              {metrics.focusBlocks.completedCount > 0 ? metrics.focusBlocks.completedCount : "—"}
            </div>
            <div className="text-[11px] text-[#96A5BD] mt-0.5">
              {metrics.focusBlocks.completedCount > 0
                ? `${metrics.focusBlocks.reviewedCount} reviewed`
                : "No blocks yet"}
            </div>
          </div>

          {/* Mini duration bars */}
          <div className="flex items-center gap-1.5 h-5">
            {metrics.focusBlocks.blocks.length > 0 ? (
              metrics.focusBlocks.blocks.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  className={`h-2 rounded-[2px] flex-1 ${
                    b.isReviewed ? "bg-[#90D2BC]" : "bg-[#AAA9FF]"
                  }`}
                  title={`${b.title}: ${formatDurationSeconds(b.elapsedSeconds)} (${
                    b.isReviewed ? "Reviewed" : "Unreviewed"
                  })`}
                />
              ))
            ) : (
              <span className="text-[11px] text-[#96A5BD]">Start a block to begin</span>
            )}
          </div>
        </div>

        {/* 3. Sink Time (3/12 width on desktop) */}
        <div
          onClick={() => setActiveModal("sink")}
          onKeyDown={handleKeyDown(() => setActiveModal("sink"))}
          className="col-span-1 lg:col-span-3 card-midnight p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-[#EE9DAA]/40 transition-colors bg-[#141A25] border border-[#2B374B]"
          role="button"
          tabIndex={0}
          aria-label="Sink time metric"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B8C4D8]">
              Sink Time
            </span>
            <span className="text-[11px] font-mono text-[#EE9DAA] px-1.5 py-0.5 rounded-[4px] bg-[#EE9DAA]/10">
              {metrics.sink.sharePercent}% share
            </span>
          </div>

          <div className="my-1 sm:my-2">
            <div className="text-3xl sm:text-4xl font-mono font-medium text-[#EE9DAA] tracking-tight">
              {sinkFormatted}
            </div>
            <div className="text-[11px] text-[#96A5BD] mt-0.5 flex items-center justify-between">
              <span>Entertainment & social</span>
              <HelpCircle className="w-3 h-3 text-[#EE9DAA]/70" />
            </div>
          </div>

          {/* Rose mini series */}
          <div className="flex items-end gap-1 h-5 pt-1">
            {metrics.sink.miniSeries.map((val, idx) => {
              const heightPct = Math.min(100, Math.max(15, (val / 3) * 100));
              const isCurrent = idx === metrics.sink.miniSeries.length - 1;
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-t-[2px] transition-all ${
                    isCurrent ? "bg-[#EE9DAA]" : "bg-[#EE9DAA]/30"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* 4. Longest Deep Block (2/12 width on desktop) */}
        <div
          className="col-span-1 lg:col-span-2 card-midnight p-4 sm:p-5 flex flex-col justify-between bg-[#141A25] border border-[#2B374B]"
          aria-label="Longest deep block metric"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B8C4D8]">
              Longest Run
            </span>
            <span className="text-[10px] uppercase font-semibold text-[#B8C4D8] px-1 py-0.5 rounded-[3px] bg-[#1A2230] border border-[#2B374B]">
              Auto
            </span>
          </div>

          <div className="my-1 sm:my-2">
            <div className="text-2xl sm:text-3xl font-mono font-medium text-[#F2F5FB] tracking-tight">
              {longestFormatted}
            </div>
            <div className="text-[11px] text-[#96A5BD] mt-0.5">
              {metrics.longestDeepBlock.count} runs &ge;15m
            </div>
          </div>

          {/* Small run strip */}
          <div className="flex items-center gap-1 h-5">
            {metrics.longestDeepBlock.runs.slice(0, 4).map((r, i) => (
              <div
                key={i}
                className="h-2 rounded-[2px] bg-[#AAA9FF]/60 flex-1"
                title={`Run ${i + 1}: ${formatDurationSeconds(r.durationSeconds)}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Focus / Sink Definition Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="card-midnight w-full max-w-md p-5 bg-[#141A25] border border-[#53637D] shadow-2xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2B374B] pb-2.5">
              <h3 className="text-sm font-semibold text-[#F2F5FB]">
                {activeModal === "focus" ? "Focus Time Evidence" : "Sink Time Evidence"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs text-[#96A5BD] hover:text-[#F2F5FB]"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-[#B8C4D8]">
              {activeModal === "focus"
                ? metrics.focus.explanation
                : metrics.sink.explanation}
            </p>
            <div className="p-3 rounded-[8px] bg-[#1A2230] border border-[#2B374B] text-[11px] flex flex-col gap-1.5 text-[#B8C4D8]">
              <div className="flex justify-between">
                <span>Effective Total:</span>
                <span className="font-mono text-[#F2F5FB]">
                  {activeModal === "focus" ? focusFormatted : sinkFormatted}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Overlapping Devices:</span>
                <span className="text-[#90D2BC]">Counted once (union)</span>
              </div>
              <div className="flex justify-between">
                <span>Revision State:</span>
                <span className="font-mono text-[#AAA9FF]">{dayResult.revisionId}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
