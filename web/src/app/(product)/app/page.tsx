"use client";

import React, { useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { getLogicalDay } from "@/lib/day";
import { Envelope, Category } from "@/lib/types";
import { buildEffectiveDayPresentation } from "@/lib/effective-adapter";
import { generateReflection, ReflectionTone } from "@/lib/reflection-service";
import { computeAppLensData } from "@/lib/app-lens";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";

import { PinnedCommandArea } from "@/components/overview/PinnedCommandArea";
import { MetricCards } from "@/components/overview/MetricCards";
import { TimeMixStrip } from "@/components/overview/TimeMixStrip";
import { TimeCanvas } from "@/components/timeline/TimeCanvas";
import { AppIconGrid } from "@/components/apps/AppIconGrid";
import { AppLensSheet } from "@/components/apps/AppLensSheet";
import { FocusStartSheet } from "@/components/focus/FocusStartSheet";
import { FocusActiveView } from "@/components/focus/FocusActiveView";
import { FocusReviewWorkspace } from "@/components/focus/FocusReviewWorkspace";
import { CategoryEditDialog } from "@/components/today/CategoryEditDialog";
import { EvidenceSheet, EvidenceModel } from "@/components/ui/EvidenceSheet";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;
const TIMEZONE = "Asia/Kolkata";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    settings,
    seedPins,
    overrides,
    setOverride,
    focusBlocks,
    activeBlockId,
    startFocusBlock,
    pauseCurrentBlock,
    resumeCurrentBlock,
    finishCurrentBlock,
    updateFocusBlock,
    commitReviewBatch,
    correctionBatches,
    classificationRules,
    addClassificationRule,
    currentRevisionId,
    aiTone,
    setAiTone,
    aiEnabled,
    setAiEnabled,
    aiDismissedDays,
    dismissAiDay,
  } = useAppStore();

  // Ingest raw sessions with seed pins & base overrides
  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  // Extract available distinct logical days (04:00 to 04:00)
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

  // Flatten applied corrections from store
  const appliedCorrections = useMemo(() => {
    return correctionBatches.flatMap((b) => b.operations);
  }, [correctionBatches]);

  // Compute revision-consistent Effective Day Presentation (§3.4, §8.3, §9.2)
  const effectiveDayResult = useMemo(() => {
    return buildEffectiveDayPresentation({
      date: selectedDay,
      rawSessions: ledger,
      corrections: appliedCorrections,
      rules: classificationRules,
      blocks: focusBlocks,
      dayStartMs,
      dayEndMs,
      timezone: TIMEZONE,
      focusGoalHours: settings.focusGoalHours ?? undefined,
      deathFloorSeconds: settings.deathFloor ?? 5,
      revisionId: currentRevisionId,
    });
  }, [
    selectedDay,
    ledger,
    appliedCorrections,
    classificationRules,
    focusBlocks,
    dayStartMs,
    dayEndMs,
    settings.focusGoalHours,
    settings.deathFloor,
    currentRevisionId,
  ]);

  // AI Reflection: Generate observation from effective day result (§4)
  const [reflectionFactOffset, setReflectionFactOffset] = useState(0);
  const reflection = useMemo(() => {
    if (!aiEnabled || aiDismissedDays[selectedDay]) return null;
    return generateReflection(
      effectiveDayResult,
      aiTone,
      settings.focusGoalHours,
      reflectionFactOffset
    );
  }, [
    effectiveDayResult,
    aiTone,
    settings.focusGoalHours,
    aiEnabled,
    aiDismissedDays,
    selectedDay,
    reflectionFactOffset,
  ]);

  // Active Focus Block
  const activeBlock = useMemo(() => {
    return focusBlocks.find((b) => b.id === activeBlockId && (b.state === "running" || b.state === "paused")) || null;
  }, [focusBlocks, activeBlockId]);

  // Shared Detail Surface Navigation (§3.0)
  const [activeEvidenceModel, setActiveEvidenceModel] = useState<EvidenceModel | null>(null);

  // UI Modal & Sheet States
  const [isStartFocusOpen, setIsStartFocusOpen] = useState(false);
  const [isShowingActiveView, setIsShowingActiveView] = useState(false);
  const [reviewingBlockId, setReviewingBlockId] = useState<string | null>(null);

  // Mobile workspace switch view state (< 1200px) (§2.1, §4)
  const [workspaceView, setWorkspaceView] = useState<"timeline" | "apps">("timeline");

  // App Lens state
  const [selectedLensAppKey, setSelectedLensAppKey] = useState<string | null>(null);
  const appLensData = useMemo(() => {
    if (!selectedLensAppKey) return null;
    return computeAppLensData(selectedLensAppKey, effectiveDayResult.effectiveSlices, focusBlocks);
  }, [selectedLensAppKey, effectiveDayResult.effectiveSlices, focusBlocks]);

  // Block selected in timeline
  const [selectedTimelineBlockId, setSelectedTimelineBlockId] = useState<string | null>(null);

  // Category Edit Dialog State
  const [editAppTarget, setEditAppTarget] = useState<{ app: string; category: Category } | null>(null);

  const reviewingBlock = useMemo(() => {
    return focusBlocks.find((b) => b.id === reviewingBlockId) || null;
  }, [focusBlocks, reviewingBlockId]);

  return (
    <div className="flex flex-col gap-4 sm:gap-5 select-text">
      {/* 1. Pinned Command Area (§3.1, §4) */}
      <PinnedCommandArea
        selectedDay={selectedDay}
        latestDay={latestDay}
        availableDays={availableDays}
        timezone={TIMEZONE}
        onSelectDay={handleSelectDay}
        onBackToToday={handleBackToToday}
        activeBlock={activeBlock}
        onStartFocus={() => setIsStartFocusOpen(true)}
        onOpenActiveBlock={() => setIsShowingActiveView(true)}
        reflection={reflection}
        onSelectAiTone={setAiTone}
        onRefreshReflection={() => setReflectionFactOffset((prev) => prev + 1)}
        onDismissReflection={() => dismissAiDay(selectedDay)}
        onTurnOffAi={() => setAiEnabled(false)}
        isAiVisible={aiEnabled && !aiDismissedDays[selectedDay]}
        onOpenEvidence={setActiveEvidenceModel}
      />

      {/* 2. Four Metric Cards with Integrated Rhythm (§3.2, §3.4, §4.1) */}
      <MetricCards
        dayResult={effectiveDayResult}
        onOpenBlocksList={() => router.push(`/focus?day=${selectedDay}`)}
        onOpenEvidenceModel={setActiveEvidenceModel}
      />

      {/* 3. Slim Time Mix Composition Strip (§3.2) */}
      <TimeMixStrip
        categories={effectiveDayResult.categories}
        totalTrackedSeconds={effectiveDayResult.metrics.unionTrackedSeconds}
        apps={effectiveDayResult.apps}
        onShowMatchingActivity={(category) => {
          router.push(`/logs?category=${encodeURIComponent(category)}&day=${selectedDay}`);
        }}
      />

      {/* Mobile/Tablet Workspace Selector (< 1200px) (§2.1, §4) */}
      <div className="tf-workspace-switch">
        <button
          type="button"
          className={`tf-button ${workspaceView === "timeline" ? "tf-button-primary" : "bg-[#202122] text-[#C1C5C1]"}`}
          onClick={() => setWorkspaceView("timeline")}
          aria-pressed={workspaceView === "timeline"}
        >
          Timeline
        </button>
        <button
          type="button"
          className={`tf-button ${workspaceView === "apps" ? "tf-button-primary" : "bg-[#202122] text-[#C1C5C1]"}`}
          onClick={() => setWorkspaceView("apps")}
          aria-pressed={workspaceView === "apps"}
        >
          Apps
        </button>
      </div>

      {/* 4. Main Workbench: Timeline (minmax(0,1fr)) and Apps (304px) (§2.1, §3) */}
      <div className="tf-workbench" data-view={workspaceView}>
        {/* Left: Large Zoomable Time Canvas */}
        <div className="tf-timeline min-w-0 flex flex-col">
          <TimeCanvas
            dayResult={effectiveDayResult}
            selectedBlockId={selectedTimelineBlockId}
            onSelectBlock={setSelectedTimelineBlockId}
            onSelectSegment={(seg) => {
              if (seg) setSelectedLensAppKey(seg.app.toLowerCase());
            }}
            onStartReviewForBlock={(bId) => setReviewingBlockId(bId)}
            onCorrectActivityForSegment={(seg) => {
              setEditAppTarget({ app: seg.app, category: seg.category });
            }}
          />
        </div>

        {/* Right: App Constellation (3x3 Icon Grid) */}
        <div className="tf-apps min-w-0 flex flex-col">
          <AppIconGrid
            apps={effectiveDayResult.apps}
            selectedAppKey={selectedLensAppKey}
            onSelectApp={(key) => setSelectedLensAppKey(key)}
          />
        </div>
      </div>

      {/* (WorkspaceTabs removed completely per §3.2) */}

      {/* Shared Evidence Sheet (§4) */}
      <EvidenceSheet
        evidence={activeEvidenceModel}
        isOpen={activeEvidenceModel !== null}
        onClose={() => setActiveEvidenceModel(null)}
      />

      {/* App Lens Slide-over Sheet (§3.3, §3.6) */}
      <AppLensSheet
        data={appLensData}
        isOpen={selectedLensAppKey !== null}
        onClose={() => setSelectedLensAppKey(null)}
        onReviewCategory={(app, cat) => setEditAppTarget({ app, category: cat })}
        onExcludeActivity={(app) => {
          // Exclude app sessions in this day by creating a batch
          const targetSlices = effectiveDayResult.effectiveSlices.filter(
            (s) => s.label.toLowerCase() === app.toLowerCase()
          );
          const ops = targetSlices.map((sl) => ({
            id: `quick-ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            targetSessionId: sl.originalSessionId,
            intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
            intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
            operation: "exclude" as const,
            baseRevisionId: currentRevisionId,
            batchId: `batch-ex-${Date.now()}`,
            createdAtUtc: new Date().toISOString(),
          }));
          commitReviewBatch("", ops, `Excluded ${app} activity`);
        }}
        onOpenLogsPrefiltered={(appKey, thresholdSec) => {
          const query = thresholdSec
            ? `/logs?app=${encodeURIComponent(appKey)}&threshold=${thresholdSec}&day=${selectedDay}`
            : `/logs?app=${encodeURIComponent(appKey)}&day=${selectedDay}`;
          router.push(query);
        }}
      />

      {/* Start Focus Sheet Modal (§7.1) */}
      <FocusStartSheet
        isOpen={isStartFocusOpen}
        onClose={() => setIsStartFocusOpen(false)}
        onStart={({ title, plannedMinutes, tags, autoReview }) => {
          const newBlock = startFocusBlock(title, plannedMinutes, tags, autoReview);
          setIsShowingActiveView(true);
        }}
      />

      {/* Fullscreen Focus Active Surface (§7.2) */}
      {isShowingActiveView && activeBlock && (
        <div className="fixed inset-0 z-50 bg-[#171819] overflow-y-auto">
          <FocusActiveView
            block={activeBlock}
            onPause={pauseCurrentBlock}
            onResume={resumeCurrentBlock}
            onFinish={() => {
              const finished = finishCurrentBlock();
              setIsShowingActiveView(false);
              if (finished) setReviewingBlockId(finished.id);
            }}
            onReturnToOverview={() => setIsShowingActiveView(false)}
            onSaveForLater={() => setIsShowingActiveView(false)}
            onStartAnother={() => {
              setIsShowingActiveView(false);
              setIsStartFocusOpen(true);
            }}
          />
        </div>
      )}

      {/* End-of-Block Review & Custom Corrections Workspace (§8) */}
      {reviewingBlock && (
        <FocusReviewWorkspace
          block={reviewingBlock}
          sessions={ledger}
          existingCorrections={appliedCorrections}
          existingRules={classificationRules}
          isOpen={true}
          onClose={() => setReviewingBlockId(null)}
          onSaveBatch={(ops, updated) => {
            commitReviewBatch(updated.id, ops);
            updateFocusBlock(updated.id, updated);
            setReviewingBlockId(null);
          }}
          onAddRule={addClassificationRule}
        />
      )}

      {/* Category Reclassification Modal Dialog */}
      {editAppTarget && (
        <CategoryEditDialog
          appLabel={editAppTarget.app}
          currentCategory={editAppTarget.category}
          isOpen={true}
          onClose={() => setEditAppTarget(null)}
          onSave={(app, newCat) => {
            setOverride(app, newCat);
            setEditAppTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-[#A1A9A5]">
          Loading Timeframe observatory…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
