"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { computeWeek, buildWeekCardModel } from "@/lib/week";
import { Envelope } from "@/lib/types";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;

export default function WeekPage() {
  const { seedPins, overrides, entitlement } = useAppStore();
  const [deviceFilter, setDeviceFilter] = useState<"phone" | "laptop" | "all">("all");
  const [isExporting, setIsExporting] = useState(false);

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

  const handleShare = async () => {
    if (!weekMetrics) return;
    setIsExporting(true);
    try {
      // Direct client copy or fetch PNG
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
        // Fallback: copy footer text to clipboard (panic path)
        await navigator.clipboard.writeText(
          `${cardModel?.label}\n${cardModel?.footer}`
        );
      }
    } catch {
      // Panic fallback: copy footer verbatim to clipboard
      await navigator.clipboard.writeText(
        `${cardModel?.label}\n${cardModel?.footer}`
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
    <div className="flex flex-col items-center gap-8 pb-16">
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
            Week Review & Card
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Shareable attention artifact
          </p>
        </div>

        <SegmentedControl
          options={deviceOptions}
          value={deviceFilter}
          onChange={setDeviceFilter}
        />
      </div>

      {!hasData || !cardModel || !weekMetrics ? (
        // C18 Empty state: card does NOT render
        <div className="w-full max-w-md my-16 p-12 rounded-lg border border-[#222735] bg-[#12151D] flex flex-col items-center text-center gap-3">
          <h2 className="text-base font-semibold text-[#F8FAFC]">
            No tracked time in this range
          </h2>
          <p className="text-xs text-[#94A3B8] font-mono">
            The card never renders without a label and data.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
          {/* C22 Week Card Rendered Artifact */}
          <div
            id="week-card-preview"
            className="w-full aspect-[4/5] rounded-xl border border-[#222735] bg-[#0A0C10] p-8 md:p-10 flex flex-col justify-between relative shadow-2xl overflow-hidden"
          >
            {/* Header Block */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B]">
                {cardModel.label}
              </span>
              <div className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-[#F8FAFC] mt-4">
                {Math.floor(cardModel.focusHours)}h{" "}
                {Math.round((cardModel.focusHours % 1) * 60)
                  .toString()
                  .padStart(2, "0")}m
              </div>
              <span className="text-xs font-mono text-[#94A3B8]">
                focus-set time
              </span>
            </div>

            {/* Stat Block */}
            <div className="flex flex-col gap-4 my-auto border-t border-b border-[#222735] py-6">
              <div className="flex justify-between items-center text-sm font-mono">
                <span className="text-[#94A3B8]">Sink time</span>
                <span className="text-[#F8FAFC] font-semibold">
                  {Math.floor(cardModel.sinkHours)}h{" "}
                  {Math.round((cardModel.sinkHours % 1) * 60)
                    .toString()
                    .padStart(2, "0")}m
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-mono">
                <span className="text-[#94A3B8]">Blocks ≥15 min</span>
                <span className="text-[#F8FAFC] font-semibold">
                  {cardModel.blocksCount}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-mono">
                <span className="text-[#94A3B8]">Longest block</span>
                <span className="text-[#F8FAFC] font-semibold">
                  {cardModel.longestMinutes} min
                </span>
              </div>
            </div>

            {/* Footer Block */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-mono text-[#64748B] tracking-tight leading-relaxed">
                {cardModel.footer}
              </p>

              {/* Watermark on free tier */}
              {cardModel.watermark && (
                <div className="flex justify-end pt-1">
                  <span className="text-[11px] font-mono text-[#333D52] tracking-widest uppercase">
                    Timeframe
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action & Preflight info */}
          <div className="flex flex-col items-center gap-2 w-full">
            <Button
              variant="primary"
              onClick={handleShare}
              isLoading={isExporting}
              loadingLabel="Rendering…"
              className="w-full sm:w-auto min-w-[200px]"
            >
              Export Week Card
            </Button>
            <span className="text-xs font-mono text-[#64748B]">
              Private apps stay off this card.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
