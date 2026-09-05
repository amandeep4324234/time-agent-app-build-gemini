"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { isPaid as checkIsPaid } from "@/lib/entitlement";
import { buildLedger } from "@/lib/ingest";
import { computeWeek, buildWeekCardModel } from "@/lib/week";
import { Envelope } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import { Download, Share2, Eye, X, ShieldCheck, Check } from "lucide-react";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;

function WeekReviewContent() {
  const { seedPins, overrides, entitlement } = useAppStore();
  const [deviceFilter, setDeviceFilter] = useState<"all" | "phone" | "laptop">("all");
  const [isExporting, setIsExporting] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [includeAppLabels, setIncludeAppLabels] = useState(false); // off by default (§13)

  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  const filteredLedger = useMemo(() => {
    if (deviceFilter === "phone") return ledger.filter((s) => s.device === "phone");
    if (deviceFilter === "laptop") return ledger.filter((s) => s.device === "computer");
    return ledger;
  }, [ledger, deviceFilter]);

  const hasData = filteredLedger.length > 0;
  const isPaid = checkIsPaid(entitlement);

  const cardSelector: "phone this week" | "laptop this week" | "merged export" =
    deviceFilter === "phone"
      ? "phone this week"
      : deviceFilter === "laptop"
      ? "laptop this week"
      : "merged export";

  const deviceSelectorLabel =
    deviceFilter === "phone"
      ? "Phone only"
      : deviceFilter === "laptop"
      ? "Computer only"
      : "All devices";

  const weekMetrics = useMemo(() => {
    if (!hasData) return null;
    return computeWeek(filteredLedger, "Asia/Kolkata", 5);
  }, [filteredLedger, hasData]);

  const cardModel = useMemo(() => {
    if (!weekMetrics) return null;
    return buildWeekCardModel(weekMetrics, cardSelector, isPaid);
  }, [weekMetrics, cardSelector, isPaid]);

  // Coverage footer (§13)
  const coverageFooter = weekMetrics
    ? `Tracked ${weekMetrics.trackedDays} of 7 days · Phone up ${weekMetrics.phoneDays}/7 · Computer up ${weekMetrics.computerDays}/7 · Unclassified ${weekMetrics.unclassifiedPercent}% · Overlap ${weekMetrics.doubleCountedHours.toFixed(1)}h`
    : "";

  const handleExportPNG = async () => {
    if (!weekMetrics) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/week-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceSelector: cardSelector,
          metrics: weekMetrics,
          isPaid,
          includeAppLabels,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `timeframe-week-review-${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Fallback
    } finally {
      setIsExporting(false);
      setShowSharePreview(false);
    }
  };

  return (
    <div className="max-w-4xl w-full flex flex-col gap-6 select-text pb-16">
      {/* 1. Header (§13) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#303B49]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-[28px] font-semibold text-[#EDF1F5] tracking-tight">
            Weekly review
          </h1>
          <span className="text-xs text-[#94A1B2]">
            Exact date range: Aug 27, 2026 – Sep 2, 2026 · 04:00–04:00 logical days
          </span>
        </div>

        {/* Device Filter */}
        <div className="flex rounded-[6px] border border-[#303B49] bg-[#141A22] p-1 text-xs">
          {(["all", "phone", "laptop"] as const).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setDeviceFilter(scope)}
              className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
                deviceFilter === scope
                  ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
                  : "text-[#94A1B2] hover:text-[#EDF1F5]"
              }`}
            >
              {scope === "all" ? "All devices" : scope === "phone" ? "Phone" : "Computer"}
            </button>
          ))}
        </div>
      </div>

      {!hasData || !cardModel || !weekMetrics ? (
        <div className="p-8 rounded-[10px] border border-[#303B49] bg-[#141A22] text-center text-xs text-[#94A1B2]">
          No tracked activity recorded for this 7-day period.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Main Review Summary Surface (§13) */}
          <div className="p-6 md:p-8 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#303B49]">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#B0BBC9]">
                  Focus time · {deviceSelectorLabel}
                </span>
                <div className="text-4xl md:text-5xl font-medium text-[#E4B45F] font-mono-nums">
                  {formatDuration(cardModel.focusHours * 3600)}
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-1">
                <span className="text-xs font-medium text-[#B0BBC9]">
                  Sink time · {deviceSelectorLabel}
                </span>
                <div className="text-2xl md:text-3xl font-medium text-[#F28D87] font-mono-nums">
                  {formatDuration(cardModel.sinkHours * 3600)}
                </div>
              </div>
            </div>

            {/* Deep blocks and best run row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-[6px] bg-[#0D1117] border border-[#303B49] flex justify-between items-center">
                <span className="text-xs text-[#B0BBC9]">Deep blocks (≥15m)</span>
                <span className="text-lg font-semibold text-[#EDF1F5] font-mono-nums">
                  {cardModel.blocksCount}
                </span>
              </div>
              <div className="p-4 rounded-[6px] bg-[#0D1117] border border-[#303B49] flex justify-between items-center">
                <span className="text-xs text-[#B0BBC9]">Longest focus block</span>
                <span className="text-lg font-semibold text-[#EDF1F5] font-mono-nums">
                  {cardModel.longestMinutes}m
                </span>
              </div>
            </div>

            {/* Daily Bars Section (§13) */}
            {cardModel.dailyBars && cardModel.dailyBars.length > 0 && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between text-xs text-[#94A1B2]">
                  <span className="font-medium text-[#EDF1F5]">Daily focus and sink (7 days)</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-[#E4B45F]" /> Focus</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-[#F28D87]" /> Sink</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {cardModel.dailyBars.map((d, i) => {
                    const maxDaily = Math.max(6, ...cardModel.dailyBars!.map((b) => b.focusHours + b.sinkHours));
                    const focusPct = Math.min(100, (d.focusHours / maxDaily) * 100);
                    const sinkPct = Math.min(100 - focusPct, (d.sinkHours / maxDaily) * 100);
                    return (
                      <div key={i} className="flex items-center gap-3 text-xs font-mono-nums">
                        <span className="w-8 text-[#94A1B2]">{d.dayLabel}</span>
                        <div className="flex-1 h-4 rounded-[3px] bg-[#0D1117] border border-[#303B49] flex overflow-hidden">
                          <div style={{ width: `${focusPct}%` }} className="h-full bg-[#E4B45F]" />
                          <div style={{ width: `${sinkPct}%` }} className="h-full bg-[#F28D87]" />
                        </div>
                        <span className="w-14 text-right text-[#EDF1F5]">{(d.focusHours + d.sinkHours).toFixed(1)}h</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coverage footer */}
            <div className="text-xs text-[#94A1B2] pt-2 border-t border-[#303B49] leading-relaxed">
              {coverageFooter}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[10px] border border-[#303B49] bg-[#141A22]">
            <div className="flex items-center gap-2 text-xs text-[#94A1B2]">
              <ShieldCheck className="w-4 h-4 text-[#E4B45F]" />
              <span>Private activity is excluded from exports. App labels are off by default.</span>
            </div>

            <button
              type="button"
              onClick={() => setShowSharePreview(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#EDF1F5] text-xs font-semibold text-[#0D1117] hover:bg-white transition-colors w-full sm:w-auto justify-center"
            >
              <Eye className="w-4 h-4" />
              <span>Share Preview &amp; Export</span>
            </button>
          </div>
        </div>
      )}

      {/* Share Preview Modal (1080×1350 PNG export per §13) */}
      {showSharePreview && weekMetrics && cardModel && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share week export preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-fast"
          onClick={() => setShowSharePreview(false)}
        >
          <div
            className="w-full max-w-lg rounded-[10px] border border-[#303B49] bg-[#141A22] p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#303B49]">
              <span className="text-sm font-semibold text-[#EDF1F5]">
                Export Preview (1080 × 1350 PNG)
              </span>
              <button
                type="button"
                onClick={() => setShowSharePreview(false)}
                className="p-1 rounded-[4px] text-[#94A1B2] hover:text-[#EDF1F5] hover:bg-[#1D2530]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1080x1350 Aspect Ratio Card Preview (§13) */}
            <div className="w-full aspect-[4/5] rounded-[8px] border border-[#303B49] bg-[#0D1117] p-6 sm:p-8 flex flex-col justify-between select-none shadow-inner overflow-hidden">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-[#B0BBC9] font-medium">
                  TIMEFRAME · WEEKLY REVIEW
                </span>
                <span className="text-[11px] text-[#94A1B2]">
                  {cardModel.dateRange || "Aug 27, 2026 – Sep 2, 2026"} · {deviceSelectorLabel}
                </span>
              </div>

              <div className="flex flex-col gap-3 my-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-[6px] bg-[#141A22] border border-[#303B49]">
                    <span className="text-[11px] text-[#94A1B2]">Focus time</span>
                    <div className="text-2xl font-semibold text-[#E4B45F] font-mono-nums">
                      {cardModel.focusHours.toFixed(1)}h
                    </div>
                  </div>
                  <div className="p-3 rounded-[6px] bg-[#141A22] border border-[#303B49]">
                    <span className="text-[11px] text-[#94A1B2]">Sink time</span>
                    <div className="text-2xl font-semibold text-[#F28D87] font-mono-nums">
                      {cardModel.sinkHours.toFixed(1)}h
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-2.5 rounded-[6px] bg-[#141A22] border border-[#303B49] text-xs font-mono-nums">
                  <div>
                    <span className="text-[#94A1B2]">Deep blocks: </span>
                    <span className="text-[#EDF1F5] font-semibold">{cardModel.blocksCount}</span>
                  </div>
                  <div>
                    <span className="text-[#94A1B2]">Longest run: </span>
                    <span className="text-[#EDF1F5] font-semibold">{cardModel.longestMinutes}m</span>
                  </div>
                </div>

                {/* 7 Daily Bars Preview */}
                {cardModel.dailyBars && cardModel.dailyBars.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-[#94A1B2]">
                      <span>Daily Activity (7 Days)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#E4B45F]">■ Focus</span>
                        <span className="text-[#F28D87]">■ Sink</span>
                      </div>
                    </div>
                    {cardModel.dailyBars.map((d, i) => {
                      const maxDaily = Math.max(6, ...cardModel.dailyBars!.map((b) => b.focusHours + b.sinkHours));
                      const focusPct = Math.min(100, (d.focusHours / maxDaily) * 100);
                      const sinkPct = Math.min(100 - focusPct, (d.sinkHours / maxDaily) * 100);
                      return (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-mono-nums">
                          <span className="w-6 text-[#94A1B2] shrink-0">{d.dayLabel}</span>
                          <div className="flex-1 h-2.5 rounded-[2px] bg-[#141A22] border border-[#303B49]/40 flex overflow-hidden">
                            <div style={{ width: `${focusPct}%` }} className="h-full bg-[#E4B45F]" />
                            <div style={{ width: `${sinkPct}%` }} className="h-full bg-[#F28D87]" />
                          </div>
                          <span className="w-8 text-right text-[#EDF1F5] shrink-0">{(d.focusHours + d.sinkHours).toFixed(1)}h</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-[#94A1B2] pt-2 border-t border-[#303B49] leading-relaxed">
                {coverageFooter}
              </div>
            </div>

            {/* Privacy Options (§13: App labels off by default, opt-in for non-fenced only) */}
            <div className="flex items-center justify-between px-2 text-xs">
              <label className="flex items-center gap-2 text-[#B0BBC9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAppLabels}
                  onChange={(e) => setIncludeAppLabels(e.target.checked)}
                  className="rounded border-[#303B49] text-[#E4B45F] focus:ring-0"
                />
                <span>Include non-fenced app breakdown in export</span>
              </label>
            </div>

            {/* Export Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#303B49]">
              <button
                type="button"
                onClick={() => setShowSharePreview(false)}
                className="px-3.5 py-1.5 rounded-[6px] border border-[#303B49] text-xs text-[#B0BBC9] hover:bg-[#1D2530]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportPNG}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-[#EDF1F5] text-xs font-semibold text-[#0D1117] hover:bg-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? "Rendering…" : "Download 1080×1350 PNG"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WeekPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#94A1B2]">Loading week review…</div>}>
      <WeekReviewContent />
    </Suspense>
  );
}
