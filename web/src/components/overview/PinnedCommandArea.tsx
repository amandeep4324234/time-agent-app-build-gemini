"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, RotateCcw, Calendar, Clock } from "lucide-react";
import { DateTime } from "luxon";
import { ReflectionCard } from "./ReflectionCard";
import { ReflectionResult, ReflectionTone } from "@/lib/reflection-service";
import { FocusBlock, calculateBlockElapsedSeconds } from "@/lib/focus-blocks";
import { formatDurationSeconds } from "@/lib/format";
import { EvidenceModel } from "../ui/EvidenceSheet";

interface PinnedCommandAreaProps {
  selectedDay: string;
  latestDay: string;
  availableDays: string[];
  timezone: string;
  onSelectDay: (day: string) => void;
  onBackToToday: () => void;
  activeBlock: FocusBlock | null;
  onStartFocus: () => void;
  onOpenActiveBlock: () => void;
  reflection: ReflectionResult | null;
  onSelectAiTone: (tone: ReflectionTone) => void;
  onRefreshReflection: () => void;
  onDismissReflection: () => void;
  onTurnOffAi: () => void;
  isAiVisible: boolean;
  onOpenEvidence?: (model: EvidenceModel) => void;
}

export function PinnedCommandArea({
  selectedDay,
  latestDay,
  availableDays,
  timezone,
  onSelectDay,
  onBackToToday,
  activeBlock,
  onStartFocus,
  onOpenActiveBlock,
  reflection,
  onSelectAiTone,
  onRefreshReflection,
  onDismissReflection,
  onTurnOffAi,
  isAiVisible,
  onOpenEvidence,
}: PinnedCommandAreaProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentIndex = availableDays.indexOf(selectedDay);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < availableDays.length - 1;

  const handlePrev = () => {
    if (canGoPrev) onSelectDay(availableDays[currentIndex - 1]);
  };

  const handleNext = () => {
    if (canGoNext) onSelectDay(availableDays[currentIndex + 1]);
  };

  const isToday = selectedDay === latestDay;

  const activeElapsedSeconds = activeBlock ? calculateBlockElapsedSeconds(activeBlock) : 0;
  const activeElapsedFormatted = formatDurationSeconds(activeElapsedSeconds);

  // Deterministic date formatting with Luxon
  const formattedDate = DateTime.fromISO(selectedDay, { zone: timezone }).isValid
    ? DateTime.fromISO(selectedDay, { zone: timezone }).toFormat("cccc, d LLLL")
    : selectedDay;

  return (
    <div className="flex flex-col gap-4 select-text">
      {/* 1. Header: Overview, Date with < >, Start focus button */}
      <div className="tf-header flex items-center justify-between min-h-[56px] gap-4">
        {/* Left: Title & Date Selector */}
        <div>
          <h1 className="tf-title text-[28px] font-semibold text-[#ECECE7] leading-tight m-0 mb-1.5">
            Overview
          </h1>
          <div className="tf-date flex items-center gap-2 text-[14px] text-[#C1C5C1]">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="p-1 rounded-[4px] text-[#A1A9A5] hover:text-[#ECECE7] disabled:opacity-30 transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-normal">{formattedDate}</span>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="p-1 rounded-[4px] text-[#A1A9A5] hover:text-[#ECECE7] disabled:opacity-30 transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onBackToToday}
              className="p-1 text-[#A1A9A5] hover:text-[#ECECE7] transition-colors ml-1"
              title="Jump to today"
              aria-label="Calendar date"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Primary Action (Off-white button with dark text) */}
        <div>
          {activeBlock ? (
            <button
              onClick={onOpenActiveBlock}
              className="tf-button min-h-[44px] px-4 py-2.5 rounded-[6px] border border-[#DDB66D] bg-[#252729] text-[#DDB66D] hover:bg-[#DDB66D]/10 text-[14px] font-medium flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#DDB66D] animate-ping" />
              <span>Return to block · {activeElapsedFormatted}</span>
            </button>
          ) : (
            <button
              onClick={onStartFocus}
              className="tf-button tf-button-primary min-h-[44px] px-5 py-2.5 rounded-[6px] bg-[#ECECE7] text-[#171819] hover:bg-white text-[14px] font-medium flex items-center gap-2 transition-colors border-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start focus</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Timeframe AI Observation Strip (§3, approved-overview.png) */}
      {isAiVisible && reflection && (
        <div className="tf-observation rounded-[10px] bg-[#202122] border border-[#3A3D3E] p-3.5 px-4 flex items-center justify-between gap-4 min-h-[64px] relative overflow-hidden">
          {/* Text block */}
          <div className="tf-observation-copy min-w-0 flex-1">
            <div className="tf-eyebrow text-[13px] font-medium text-[#DDB66D] mb-0.5">
              Timeframe AI
            </div>
            <p className="text-[16px] text-[#ECECE7] leading-snug m-0 font-normal truncate sm:whitespace-normal">
              {(reflection as any).headline || reflection.text}
            </p>
          </div>

          {/* Right: Why this? > */}
          <div className="flex items-center gap-3 shrink-0">
            {onOpenEvidence && (
              <button
                onClick={() =>
                  onOpenEvidence(
                    (reflection as any).evidence || {
                      title: "AI Observation Evidence",
                      dateRange: formattedDate,
                      observedText: (reflection as any).headline || reflection.text,
                      meaningText: "Conditional interpretation derived from deterministic analysis.",
                      limitation: "Reflections describe recorded segments only; unobserved breaks are not inferred.",
                      calculation: {
                        definition: "Deterministic fact packet matching approved fact templates.",
                        unit: "derived",
                        numerator: null,
                        denominator: null,
                        rule: "Validated factual statements without psychological diagnosis.",
                        timezone: "Asia/Kolkata",
                        windowBounds: "Logical day bounds",
                        deviceScope: "Paired active sources",
                        sampleCount: reflection.facts?.length || 1,
                        basis: "effective",
                        overlapHandling: "Interval union",
                        boundaryStatus: "Recorded segment timestamps",
                        definitionVersion: "1.2",
                        dataRevision: reflection.revisionId || "rev-1",
                      },
                      records: [],
                    }
                  )
                }
                className="text-[14px] text-[#C1C5C1] hover:text-[#ECECE7] flex items-center gap-1 font-normal transition-colors"
              >
                <span>Why this?</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onDismissReflection}
              className="text-[#A1A9A5] hover:text-[#ECECE7] text-lg leading-none p-1"
              title="Dismiss"
              aria-label="Dismiss observation"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
