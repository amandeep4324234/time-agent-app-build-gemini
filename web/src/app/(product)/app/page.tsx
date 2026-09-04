"use client";

import React, { useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { computeDay } from "@/lib/metrics";
import { getLogicalDay } from "@/lib/day";
import { Envelope } from "@/lib/types";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";

import { buildTimelineModel } from "@/lib/timeline-model";
import { generateInsightLines } from "@/lib/insight-lines";
import { compute12WeekHeatmap } from "@/lib/heatmap";

import { HeroStrip } from "@/components/hero/HeroStrip";
import { MixRow } from "@/components/mix/MixRow";
import { Timeline } from "@/components/timeline/Timeline";
import { TopSinksRow } from "@/components/compact/TopSinksRow";
import { SourceRow } from "@/components/compact/SourceRow";
import { HeatmapCompact } from "@/components/compact/HeatmapCompact";
import { InsightLines } from "@/components/insights/InsightLines";
import { HabitatCard } from "@/components/creature/habitat-card";
import { MetaFooter } from "@/components/footer/MetaFooter";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { settings, seedPins, overrides, entitlement } = useAppStore();
  const isPro = entitlement.tier === "pro";

  // Ghost mode state (Pro feature)
  const [isGhostActive, setIsGhostActive] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

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
  const latestDay = availableDays.length > 0 ? availableDays[availableDays.length - 1] : "2026-09-02";
  const selectedDay = urlDay && availableDays.includes(urlDay) ? urlDay : latestDay;

  const currentIndex = availableDays.indexOf(selectedDay);
  const isToday = selectedDay === latestDay;

  const handleSelectDay = (day: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", day);
    router.replace(`/app?${params.toString()}`);
  };

  const handlePrevDay = () => {
    if (currentIndex > 0) {
      handleSelectDay(availableDays[currentIndex - 1]);
    }
  };

  const handleNextDay = () => {
    if (currentIndex < availableDays.length - 1) {
      handleSelectDay(availableDays[currentIndex + 1]);
    }
  };

  const handleBackToToday = () => {
    handleSelectDay(latestDay);
  };

  // Day metrics
  const dayMetrics = useMemo(() => {
    return computeDay(
      selectedDay,
      ledger,
      { deathFloor: settings.deathFloor },
      Date.parse("2026-09-02T23:59:59.000Z"),
      "Asia/Kolkata"
    );
  }, [selectedDay, ledger, settings.deathFloor]);

  // Ghost reference day: same weekday last week (7 days prior), or previous day
  const ghostDayKey = useMemo(() => {
    const targetDt = DateTime.fromISO(selectedDay).minus({ days: 7 }).toISODate();
    if (targetDt && availableDays.includes(targetDt)) return targetDt;
    if (currentIndex > 0) return availableDays[currentIndex - 1];
    return undefined;
  }, [selectedDay, availableDays, currentIndex]);

  // Timeline model
  const timelineModel = useMemo(() => {
    return buildTimelineModel(
      selectedDay,
      ledger,
      "Asia/Kolkata",
      settings.deathFloor,
      isGhostActive && ghostDayKey ? ledger : undefined,
      isGhostActive ? ghostDayKey : undefined
    );
  }, [selectedDay, ledger, settings.deathFloor, isGhostActive, ghostDayKey]);

  // Insight lines per UI.md §3
  const insightLines = useMemo(() => {
    const daySessions = ledger.filter(
      (s) => getLogicalDay(s.started_at_ms, "Asia/Kolkata") === selectedDay
    );
    return generateInsightLines(
      dayMetrics,
      timelineModel.runs,
      daySessions,
      "Asia/Kolkata"
    );
  }, [dayMetrics, timelineModel.runs, ledger, selectedDay]);

  // 12-week heatmap grid per UI.md §2.3
  const heatmapGrid = useMemo(() => {
    return compute12WeekHeatmap(ledger, selectedDay, "Asia/Kolkata");
  }, [ledger, selectedDay]);

  // Rank text for past days (e.g. "2nd best of 7")
  const rankText = useMemo(() => {
    if (isToday) return undefined;
    const sortedByFocus = [...availableDays].sort((a, b) => {
      const aHours = computeDay(a, ledger).focusHours;
      const bHours = computeDay(b, ledger).focusHours;
      return bHours - aHours;
    });
    const rank = sortedByFocus.indexOf(selectedDay) + 1;
    const suffixes = ["th", "st", "nd", "rd"];
    const v = rank % 100;
    const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
    return `${rank}${suffix} best of ${availableDays.length}`;
  }, [isToday, availableDays, selectedDay, ledger]);

  // Day header label
  const dayTitle = isToday
    ? "TODAY"
    : DateTime.fromISO(selectedDay).toFormat("ccc LLL d").toUpperCase();

  // Scroll to first sink when user taps sink in MixRow or InsightLine
  const handleScrollToSink = () => {
    const firstSink = timelineModel.phoneSegments
      .concat(timelineModel.computerSegments)
      .filter((s) => s.category === "sink")
      .sort((a, b) => a.started_at_ms - b.started_at_ms)[0];

    if (firstSink) {
      setSelectedSegmentId(firstSink.id);
      setTimeout(() => setSelectedSegmentId(null), 1500);
    }
  };

  return (
    <div className="max-w-[720px] w-full mx-auto flex flex-col gap-4 font-mono select-text pb-12">
      {/* 1. Hero Strip (96dp height budget, UI.md §1.1) */}
      <HeroStrip
        dayTitle={dayTitle}
        isToday={isToday}
        rankText={rankText}
        focusHours={dayMetrics.focusHours}
        sinkHours={dayMetrics.sinkHours}
        deepBlocksCount={dayMetrics.blocksCount}
        longestMinutes={dayMetrics.longestMinutes}
        totalTrackedHours={dayMetrics.lab?.unionHours ?? dayMetrics.mix.totalHours}
        isLightDay={dayMetrics.lightDay}
        phoneDark={dayMetrics.sources.phoneDark}
        phoneOffSince={dayMetrics.sources.phoneOffSince}
        computerDark={dayMetrics.sources.computerDark}
        computerOffSince={dayMetrics.sources.computerOffSince}
        isGhostActive={isGhostActive}
        isPro={isPro}
        onToggleGhost={() => setIsGhostActive(!isGhostActive)}
      />

      {/* 2. Mix Row (40dp height, 36dp ring, UI.md §1.1 & §2.2) */}
      <MixRow
        mix={dayMetrics.mix}
        isLightDay={dayMetrics.lightDay}
        isNoData={timelineModel.isNoData}
        onSinkRowClick={handleScrollToSink}
      />

      {/* 3. Day Timeline (signature instrument element, UI.md §2.1) */}
      <div className="border-t border-[#21262D] pt-2">
        <Timeline
          model={timelineModel}
          isGhostActive={isGhostActive}
          selectedSegmentId={selectedSegmentId}
        />
      </div>

      {/* 4. Compact Rows: Top Sinks | By Source | Heatmap 12wk (UI.md §1.1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#21262D]">
        {/* Top Sinks Compact List */}
        <TopSinksRow
          sinks={dayMetrics.topSinks}
          onSelectSink={handleScrollToSink}
        />

        {/* By Source Compact List */}
        <SourceRow
          phoneHours={dayMetrics.sources.phoneHours}
          computerHours={dayMetrics.sources.computerHours}
          phoneDark={dayMetrics.sources.phoneDark}
          phoneOffSince={dayMetrics.sources.phoneOffSince}
          computerDark={dayMetrics.sources.computerDark}
          computerOffSince={dayMetrics.sources.computerOffSince}
        />

        {/* Heatmap 12wk Thumbnail */}
        <HeatmapCompact
          grid={heatmapGrid}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
        />
      </div>

      {/* 5. Insight Lines (UI.md §2.6 & §3 templates) */}
      <InsightLines
        lines={insightLines}
        onLineClick={(item) => {
          if (item.target === "sink") handleScrollToSink();
        }}
      />

      {/* 6. Creature Companion (UI.md §2.4) */}
      <HabitatCard
        status={
          timelineModel.isNoData
            ? "empty"
            : dayMetrics.sinkHours > 0 && dayMetrics.sinkHours >= 1.5
            ? "broken"
            : dayMetrics.focusHours > 0
            ? "focusing"
            : "idle"
        }
        killerName={dayMetrics.topSinks[0]?.label}
        timeOfDeath="2:47pm"
        minutesSurvived={dayMetrics.longestMinutes || 18}
        minutesGrownToday={Math.round(dayMetrics.focusHours * 60)}
        isLightDay={dayMetrics.lightDay}
        isNoData={timelineModel.isNoData}
        isPaid={isPro}
      />

      {/* 7. Meta Footer (UI.md §1.1 & §1.2) */}
      <MetaFooter
        isToday={isToday}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onBackToToday={handleBackToToday}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < availableDays.length - 1}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[720px] mx-auto p-8 text-xs font-mono text-[#6E7681]">
          Loading instrument panel…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
