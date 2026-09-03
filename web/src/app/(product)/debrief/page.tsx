"use client";

import React, { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { computeDay } from "@/lib/metrics";
import { Envelope } from "@/lib/types";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import { Badge } from "@/components/ui/badge";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;

export default function DebriefPage() {
  const { settings, seedPins, overrides, entitlement } = useAppStore();

  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  // Use the anchor day 2026-09-02
  const anchorDay = "2026-09-02";

  const metrics = useMemo(() => {
    return computeDay(
      anchorDay,
      ledger,
      { deathFloor: settings.deathFloor },
      Date.parse("2026-09-02T23:59:59.000Z"),
      "Asia/Kolkata"
    );
  }, [anchorDay, ledger, settings.deathFloor]);

  const isPaid = entitlement.tier === "pro";

  // Derive the 6 lines
  // 1. Total tracked
  const totalTrackedHours = metrics.lab?.unionHours ?? 0;
  const line1Total = `${Math.floor(totalTrackedHours)}h ${Math.round((totalTrackedHours % 1) * 60)
    .toString()
    .padStart(2, "0")}m`;

  // 2. Focus-set time
  const line2Focus = `${Math.floor(metrics.focusHours)}h ${Math.round((metrics.focusHours % 1) * 60)
    .toString()
    .padStart(2, "0")}m`;

  // 3. Top sink
  const topSink = metrics.topSinks[0];
  const line3Sink = topSink
    ? `${topSink.label} (${Math.floor(topSink.unionHours)}h ${Math.round((topSink.unionHours % 1) * 60)}m)`
    : "None";

  // 4. Blocks >= 15 min (+ longest)
  const line4Blocks = `${metrics.blocksCount} blocks (longest ${metrics.longestMinutes} min)`;

  // 5. Writers
  const line5Writers = metrics.sources.phoneDark
    ? `phone off since ${metrics.sources.phoneOffSince || "Aug 28"} · computer on`
    : "phone on · computer on";

  // 6. Named pair (alternation)
  const line6Pair = isPaid
    ? "The day swung between Grok and GitHub"
    : "Grok ↔ GitHub · 4";

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
          Evening Debrief
        </h1>
        <p className="text-xs text-[#94A3B8] font-mono">
          Receipt for {anchorDay}
        </p>
      </div>

      {metrics.lightDay && (
        <div>
          <Badge>light day — not comparable</Badge>
        </div>
      )}

      {/* 6-Line Receipt Card */}
      <div className="p-8 rounded-xl border border-[#222735] bg-[#12151D] flex flex-col gap-5 divide-y divide-[#222735] font-mono text-xs">
        {/* Line 1 */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-[#94A3B8]">Total tracked</span>
          <span className="text-[#F8FAFC] font-semibold">{line1Total}</span>
        </div>

        {/* Line 2 */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-[#94A3B8]">Focus-set time</span>
          <span className="text-[#F8FAFC] font-semibold">{line2Focus}</span>
        </div>

        {/* Line 3 */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-[#94A3B8]">Top sink</span>
          <span className="text-[#F8FAFC] font-semibold">{line3Sink}</span>
        </div>

        {/* Line 4 */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-[#94A3B8]">Blocks ≥15 min</span>
          <span className="text-[#F8FAFC] font-semibold">{line4Blocks}</span>
        </div>

        {/* Line 5 */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-[#94A3B8]">Writers</span>
          <span className="text-[#F8FAFC] font-semibold">{line5Writers}</span>
        </div>

        {/* Line 6 */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-[#94A3B8]">Named pair</span>
          <span className="text-[#22D3EE] font-semibold">{line6Pair}</span>
        </div>
      </div>
    </div>
  );
}
