"use client";

import React, { useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { getLogicalDay } from "@/lib/day";
import { Envelope, Category } from "@/lib/types";
import { Evidence } from "@/lib/presentation-types";
import { buildSafeDayPresentation } from "@/lib/safe-adapter";
import { computeFocusRuns } from "@/lib/focus-run";
import { evaluateTodayObservations, EvaluatedInsight } from "@/lib/observations";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";

import { TodayHeader } from "@/components/today/TodayHeader";
import { SummaryStrip } from "@/components/today/SummaryStrip";
import { TimelineWorkspace } from "@/components/today/TimelineWorkspace";
import { CategoryAppsSection } from "@/components/today/CategoryAppsSection";
import { ObservationsSection } from "@/components/today/ObservationsSection";
import { CategoryEditDialog } from "@/components/today/CategoryEditDialog";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;
const TIMEZONE = "Asia/Kolkata";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { settings, seedPins, overrides, setOverride } = useAppStore();

  // Ingest sessions with user overrides
  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  // Extract available distinct logical days
  const availableDays = useMemo(() => {
    const days = new Set<string>();
    for (const s of ledger) {
      days.add(getLogicalDay(s.started_at_ms, TIMEZONE));
    }
    return Array.from(days).sort();
  }, [ledger]);

  // Selected logical day from query param (?day=)
  const urlDay = searchParams.get("day");
  const latestDay = availableDays.length > 0 ? availableDays[availableDays.length - 1] : "2026-09-02";
  const selectedDay = urlDay && availableDays.includes(urlDay) ? urlDay : latestDay;

  const handleSelectDay = (day: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", day);
    router.replace(`/app?${params.toString()}`);
  };

  const handleBackToToday = () => {
    handleSelectDay(latestDay);
  };

  // Day boundaries: 04:00 to 04:00 (+1) in TIMEZONE
  const { dayStartMs, dayEndMs } = useMemo(() => {
    const start = DateTime.fromISO(`${selectedDay}T04:00:00`, { zone: TIMEZONE }).toMillis();
    const end = DateTime.fromISO(`${selectedDay}T04:00:00`, { zone: TIMEZONE }).plus({ days: 1 }).toMillis();
    return { dayStartMs: start, dayEndMs: end };
  }, [selectedDay]);

  // Extract day sessions
  const daySessions = useMemo(() => {
    return ledger.filter(
      (s) => getLogicalDay(s.started_at_ms, TIMEZONE) === selectedDay
    );
  }, [ledger, selectedDay]);

  // Build safe presentation models (§3.3, §10)
  // Reconstruct focus runs for the day using verified engine logic
  const dayRuns = useMemo(() => {
    const { runs } = computeFocusRuns(daySessions, settings.deathFloor ?? 5);
    return runs;
  }, [daySessions, settings.deathFloor]);

  const safeAdapterResult = useMemo(() => {
    return buildSafeDayPresentation(
      selectedDay,
      daySessions,
      dayRuns,
      dayStartMs,
      dayEndMs,
      TIMEZONE,
      settings.focusGoalHours ?? undefined
    );
  }, [selectedDay, daySessions, dayRuns, dayStartMs, dayEndMs, settings.focusGoalHours]);

  // Observations (§6.3 & §9)
  const observations = useMemo(() => {
    return evaluateTodayObservations(
      selectedDay,
      dayRuns,
      daySessions,
      ledger,
      TIMEZONE
    );
  }, [selectedDay, dayRuns, daySessions, ledger]);

  const topObservation = observations.length > 0 ? observations[0] : null;

  // Interaction State: Filters and Evidence
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [inspectEvidence, setInspectEvidence] = useState<Evidence | null>(null);

  // Category Edit Dialog State
  const [editAppTarget, setEditAppTarget] = useState<{ app: string; category: Category } | null>(null);

  const handleOpenEvidence = (ev: Evidence) => {
    setInspectEvidence(ev);
  };

  const handleSaveCategory = (app: string, newCategory: Category) => {
    setOverride(app, newCategory);
  };

  return (
    <div className="flex flex-col gap-6 select-text">
      {/* 1. Today Header (§6.1) */}
      <TodayHeader
        selectedDay={selectedDay}
        latestDay={latestDay}
        availableDays={availableDays}
        timezone={TIMEZONE}
        onSelectDay={handleSelectDay}
        onBackToToday={handleBackToToday}
      />

      {/* 2. Summary Strip (§6.2) */}
      <SummaryStrip
        focusSeconds={safeAdapterResult.metrics.focus.value}
        sinkSeconds={safeAdapterResult.metrics.sink.value}
        deepBlocksCount={safeAdapterResult.metrics.deepBlocks.count}
        longestSeconds={safeAdapterResult.metrics.deepBlocks.longestSeconds}
        topObservation={topObservation}
        onOpenEvidence={handleOpenEvidence}
        focusGoalHours={settings.focusGoalHours ?? undefined}
        isNoData={safeAdapterResult.availability === "no-data"}
        isLightDay={safeAdapterResult.availability === "light-day"}
      />

      {/* 3. Timeline Workspace (§7.1, §7.2, §7.3) */}
      <TimelineWorkspace
        adapterResult={safeAdapterResult}
        highlightCategory={selectedCategory}
        highlightApp={selectedApp}
        externalEvidence={inspectEvidence}
        onClearExternalEvidence={() => setInspectEvidence(null)}
      />

      {/* 4. Lower Grid (§5.2, §6.3): Categories/Apps at 7/12 width, Observations at 5/12 width */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 min-w-0">
          <CategoryAppsSection
            adapterResult={safeAdapterResult}
            selectedCategory={selectedCategory}
            selectedApp={selectedApp}
            onSelectCategory={setSelectedCategory}
            onSelectApp={setSelectedApp}
            onEditCategory={(app, currentCat) => setEditAppTarget({ app, category: currentCat })}
          />
        </div>

        <div className="lg:col-span-5 min-w-0">
          <ObservationsSection
            observations={observations}
            summaryInsightKey={topObservation?.insight.key}
            onOpenEvidence={handleOpenEvidence}
          />
        </div>
      </div>

      {/* Category Reclassification Modal Dialog */}
      {editAppTarget && (
        <CategoryEditDialog
          appLabel={editAppTarget.app}
          currentCategory={editAppTarget.category}
          isOpen={true}
          onClose={() => setEditAppTarget(null)}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-[#94A1B2]">
          Loading instrument panel…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
