"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { computeWeek, buildWeekCardModel } from "@/lib/week";
import { Envelope } from "@/lib/types";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { formatHoursDuration } from "@/lib/format";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;

export default function WeekPage() {
  const { seedPins, overrides, entitlement } = useAppStore();
  const [deviceFilter, setDeviceFilter] = useState<"phone" | "laptop" | "all">("all");
  const [isExporting, setIsExporting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Ingest sessions
  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  // Filter by device if requested
  const filteredLedger = useMemo(() => {
    if (deviceFilter === "phone") return ledger.filter((s) => s.device === "phone");
    if (deviceFilter === "laptop") return ledger.filter((s) => s.device === "computer");
    return ledger;
  }, [ledger, deviceFilter]);

  const hasData = filteredLedger.length > 0;
  const isPaid = entitlement.tier === "pro";

  const deviceSelectorLabel =
    deviceFilter === "phone"
      ? "phone this week"
      : deviceFilter === "laptop"
      ? "laptop this week"
      : "merged export";

  const weekMetrics = useMemo(() => {
    if (!hasData) return null;
    return computeWeek(filteredLedger, "Asia/Kolkata", 5);
  }, [filteredLedger, hasData]);

  const cardModel = useMemo(() => {
    if (!weekMetrics) return null;
    return buildWeekCardModel(weekMetrics, deviceSelectorLabel, isPaid);
  }, [weekMetrics, deviceSelectorLabel, isPaid]);

  // Locked footer format: {D} days | phone {D_p}/{D} | computer {D_c}/{D} | {U}% unclassified | {H} double-count (UI.md §2.5)
  const lockedFooter = weekMetrics
    ? `${weekMetrics.trackedDays} days | phone ${weekMetrics.phoneDays}/${weekMetrics.trackedDays} | computer ${weekMetrics.computerDays}/${weekMetrics.trackedDays} | ${weekMetrics.unclassifiedPercent}% unclassified | ${weekMetrics.doubleCountedHours.toFixed(1)}h double-count`
    : "";

  const handleShare = async () => {
    if (!weekMetrics) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/week-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceSelector: deviceSelectorLabel,
          metrics: weekMetrics,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `timeframe-week-${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await navigator.clipboard.writeText(
          `${cardModel?.label}\n${lockedFooter}`
        );
      }
    } catch {
      await navigator.clipboard.writeText(
        `${cardModel?.label}\n${lockedFooter}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const deviceOptions = [
    { label: "Merged", value: "all" as const },
    { label: "Phone", value: "phone" as const },
    { label: "Laptop", value: "laptop" as const },
  ];

  return (
    <div className="max-w-[720px] w-full mx-auto flex flex-col gap-6 font-mono pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#21262D]">
        <div>
          <h1 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#E6EDF3]">
            WEEK REVIEW &amp; CARD
          </h1>
          <p className="text-[11px] text-[#6E7681] mt-0.5">
            Read-time attention ledger summary (04:00-04:00 local)
          </p>
        </div>

        <SegmentedControl
          options={deviceOptions}
          value={deviceFilter}
          onChange={setDeviceFilter}
        />
      </div>

      {!hasData || !cardModel || !weekMetrics ? (
        <div className="p-8 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col items-center text-center gap-2">
          <div className="text-xs text-[#E6EDF3] font-medium">
            No tracked time in this range
          </div>
          <div className="text-[11px] text-[#6E7681]">
            The card never renders without data.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full">
          {/* Week Card Artifact (UI.md §2.5) */}
          <div
            id="week-card-preview"
            className="w-full rounded-[4px] border border-[#21262D] bg-[#0D1117] p-6 md:p-8 flex flex-col gap-6 select-text"
          >
            {/* Header */}
            <div className="flex items-baseline justify-between gap-4 border-b border-[#21262D] pb-4">
              <div>
                <span className="text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
                  {cardModel.label}
                </span>
                <div className="text-[44px] leading-none font-semibold text-[#E6EDF3] tnum mt-2">
                  {formatHoursDuration(cardModel.focusHours)}
                </div>
                <div className="text-[11px] text-[#8B949E] mt-1">
                  focus-set time
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#6E7681] uppercase">sink time</span>
                <div className="text-xl font-medium text-[#F85149] tnum mt-1">
                  {formatHoursDuration(cardModel.sinkHours)}
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#21262D] text-xs tnum">
              <div className="flex flex-col gap-1 p-2 bg-[#161B22] rounded-[2px] border border-[#21262D]">
                <span className="text-[#8B949E] text-[11px]">Blocks &gt;= 15 min</span>
                <span className="text-lg font-semibold text-[#E6EDF3]">
                  {cardModel.blocksCount}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-2 bg-[#161B22] rounded-[2px] border border-[#21262D]">
                <span className="text-[#8B949E] text-[11px]">Best Run</span>
                <span className="text-lg font-semibold text-[#E6EDF3]">
                  {cardModel.longestMinutes}m
                </span>
              </div>
            </div>

            {/* Locked Footer (UI.md §2.5 & QA.md A14) */}
            <div className="flex flex-col gap-1">
              <div
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-[11px] text-[#8B949E] tracking-tight leading-relaxed cursor-pointer hover:text-[#E6EDF3] transition-colors"
                title="Click for double-count honesty explanation"
              >
                {lockedFooter}
              </div>

              {/* Long-press / click tooltip */}
              {showTooltip && (
                <div className="text-[10px] text-[#6E7681] pt-1">
                  overlap is counted once in focus; shown raw here
                </div>
              )}
            </div>
          </div>

          {/* Day-3 Tease for Graded Report Card (BUSINESS.md §3) */}
          {!isPaid && (
            <div className="p-4 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#E6EDF3]">
                    Report Card — B+
                  </span>
                  <span className="text-[10px] border border-[#D29922] text-[#D29922] px-1 rounded-[2px]">
                    Pro preview
                  </span>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  12.4h focus vs 10h baseline, 9 deep blocks, sink under allowance.
                </p>
              </div>

              <Link
                href="/checkout"
                className="px-3 py-1 text-xs border border-[#21262D] rounded-[2px] text-[#E6EDF3] hover:border-[#8B949E] whitespace-nowrap transition-colors"
              >
                Unlock Pro ($1.25/mo) →
              </Link>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Button
              variant="primary"
              onClick={handleShare}
              isLoading={isExporting}
              loadingLabel="Exporting…"
              className="w-full sm:w-auto"
            >
              Export Week Card PNG
            </Button>
            <span className="text-[11px] text-[#6E7681]">
              Private apps stay off this card.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
