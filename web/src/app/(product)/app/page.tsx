"use client";

import React, { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { computeDay } from "@/lib/metrics";
import { computeDayHeatmap } from "@/lib/heatmap";
import { getLogicalDay } from "@/lib/day";
import { Envelope } from "@/lib/types";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";

import { FocusHours } from "@/components/app/cards/FocusHours";
import { SinkHours } from "@/components/app/cards/SinkHours";
import { DeepBlocks } from "@/components/app/cards/DeepBlocks";
import { MixRing } from "@/components/app/cards/MixRing";
import { TopSinks } from "@/components/app/cards/TopSinks";
import { SourceHours } from "@/components/app/cards/SourceHours";
import { HeatmapCard, HeatmapDay } from "@/components/app/cards/HeatmapCard";
import { HabitatCard } from "@/components/creature/habitat-card";
import { SegmentedControl } from "@/components/ui/segmented-control";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { settings, seedPins, overrides, entitlement } = useAppStore();

  // Ingest sessions with current pins/overrides
  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  // Extract available distinct logical days
  const availableDays = useMemo(() => {
    const days = new Set<string>();
    for (const s of ledger) {
      days.add(getLogicalDay(s.started_at_ms, "Asia/Kolkata"));
    }
    return Array.from(days).sort();
  }, [ledger]);

  // Query parameter ?day=
  const urlDay = searchParams.get("day");
  const defaultDay = availableDays.length > 0 ? availableDays[availableDays.length - 1] : "2026-09-02";
  const selectedDay = urlDay && availableDays.includes(urlDay) ? urlDay : defaultDay;

  const handleSelectDay = (day: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", day);
    window.history.replaceState(null, "", `?${params.toString()}`);
    // Force rerender through shallow push or local state
    router.replace(`/app?${params.toString()}`);
  };

  // Compute metrics for the selected day
  const dayMetrics = useMemo(() => {
    return computeDay(
      selectedDay,
      ledger,
      { deathFloor: settings.deathFloor },
      Date.parse("2026-09-02T23:59:59.000Z"),
      "Asia/Kolkata"
    );
  }, [selectedDay, ledger, settings.deathFloor]);

  // Compute full 7-day heatmap
  const fullHeatmapDays: HeatmapDay[] = useMemo(() => {
    return availableDays.map((d) => ({
      date: d,
      hours: computeDayHeatmap(ledger, d, "Asia/Kolkata"),
    }));
  }, [availableDays, ledger]);

  const isDemoPillVisible = demoEnvelope.count < 100;

  const dayOptions = availableDays.map((d) => {
    const dateObj = new Date(`${d}T00:00:00Z`);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    return {
      label: dayName,
      subLabel: d.slice(5),
      value: d,
    };
  });

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
            Attention Ledger
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Logical day 04:00 – 04:00 Asia/Kolkata
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isDemoPillVisible && (
            <span className="px-3 py-1 text-xs font-mono rounded-full bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/30">
              Demo Placeholder Data
            </span>
          )}
          {dayOptions.length > 0 && (
            <SegmentedControl
              options={dayOptions}
              value={selectedDay}
              onChange={handleSelectDay}
            />
          )}
        </div>
      </div>

      {/* Creature Companion Habitat Card */}
      <HabitatCard
        status="idle"
        isPaid={entitlement.tier === "pro"}
      />

      {/* The Seven Cards in Exact Spec Order */}

      {/* Cards 1, 2, 3: FocusHours, SinkHours, DeepBlocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FocusHours
          hours={dayMetrics.focusHours}
          isLightDay={dayMetrics.lightDay}
        />
        <SinkHours
          hours={dayMetrics.sinkHours}
          isLightDay={dayMetrics.lightDay}
        />
        <DeepBlocks
          blocksCount={dayMetrics.blocksCount}
          longestMinutes={dayMetrics.longestMinutes}
        />
      </div>

      {/* Card 4: MixRing & Card 5: TopSinks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MixRing
          shares={dayMetrics.mix.shares}
          totalHours={dayMetrics.mix.totalHours}
          gamesHeavyNotice={dayMetrics.mix.gamesHeavy}
          sustainedUnclassifiedNotice={dayMetrics.mix.sustainedUnclassifiedAction}
        />
        <TopSinks sinks={dayMetrics.topSinks} />
      </div>

      {/* Card 6: SourceHours (+ Banner) */}
      <SourceHours
        phoneHours={dayMetrics.sources.phoneHours}
        computerHours={dayMetrics.sources.computerHours}
        phoneDark={dayMetrics.sources.phoneDark}
        phoneOffSince={dayMetrics.sources.phoneOffSince}
        computerDark={dayMetrics.sources.computerDark}
        computerOffSince={dayMetrics.sources.computerOffSince}
        phoneLastWriteAge={dayMetrics.sources.phoneLastWriteAge}
        computerLastWriteAge={dayMetrics.sources.computerLastWriteAge}
      />

      {/* Card 7: Heatmap */}
      <HeatmapCard days={fullHeatmapDays} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-mono text-[#64748B]">
          Loading dashboard…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
