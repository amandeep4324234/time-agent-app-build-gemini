"use client";

import React, { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { computeDay } from "@/lib/metrics";
import { Envelope } from "@/lib/types";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import { Badge } from "@/components/ui/badge";
import { formatHoursDuration, maskFencedLabel } from "@/lib/format";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;

export default function DebriefPage() {
  const { settings, seedPins, overrides, entitlement } = useAppStore();

  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

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
  const totalTrackedHours = metrics.lab?.unionHours ?? 0;
  const line1Total = formatHoursDuration(totalTrackedHours);
  const line2Focus = formatHoursDuration(metrics.focusHours);

  const topSink = metrics.topSinks[0];
  const topSinkLabel = topSink ? maskFencedLabel(topSink.label, topSink.isPrivate) : null;
  const line3Sink = topSink && topSinkLabel
    ? `${topSinkLabel} (${formatHoursDuration(topSink.unionHours)})`
    : "None";

  const line4Blocks = `${metrics.blocksCount} runs >= 15 min (longest ${metrics.longestMinutes} min)`;

  const line5Writers = metrics.sources.phoneDark
    ? `phone off since ${metrics.sources.phoneOffSince || "Aug 28"} · computer on`
    : "phone on · computer on";

  const line6Pair = isPaid
    ? "Day swung between Grok and GitHub"
    : "Grok ↔ GitHub · 4";

  return (
    <div className="max-w-[560px] w-full mx-auto flex flex-col gap-6 pb-16 font-mono text-xs">
      <div className="flex flex-col gap-1 pb-3 border-b border-[#21262D]">
        <h1 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#E6EDF3]">
          EVENING DEBRIEF
        </h1>
        <p className="text-[11px] text-[#6E7681]">
          Read-time daily receipt for {anchorDay}
        </p>
      </div>

      {metrics.lightDay && (
        <div>
          <Badge>light day — not comparable</Badge>
        </div>
      )}

      {/* 6-Line Receipt Card */}
      <div className="p-6 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col gap-4 divide-y divide-[#21262D]">
        {/* Line 1 */}
        <div className="flex justify-between items-center pt-1">
          <span className="text-[#8B949E]">Total tracked</span>
          <span className="text-[#E6EDF3] font-semibold tnum">{line1Total}</span>
        </div>

        {/* Line 2 */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-[#8B949E]">Focus-set time</span>
          <span className="text-[#D29922] font-semibold tnum">{line2Focus}</span>
        </div>

        {/* Line 3 */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-[#8B949E]">Top sink</span>
          <span className="text-[#F85149] font-semibold tnum">{line3Sink}</span>
        </div>

        {/* Line 4 */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-[#8B949E]">Deep blocks</span>
          <span className="text-[#E6EDF3] font-semibold tnum">{line4Blocks}</span>
        </div>

        {/* Line 5 */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-[#8B949E]">Writers</span>
          <span className="text-[#E6EDF3] font-semibold">{line5Writers}</span>
        </div>

        {/* Line 6 */}
        <div className="flex justify-between items-center pt-3">
          <span className="text-[#8B949E]">Alternation</span>
          <span className="text-[#E6EDF3] font-semibold">{line6Pair}</span>
        </div>
      </div>
    </div>
  );
}
