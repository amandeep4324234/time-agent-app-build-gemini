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
    ? DateTime.fromISO(selectedDay, { zone: timezone }).toFormat("ccc, LLL d, yyyy")
    : selectedDay;

  const getGreeting = () => {
    if (!mounted) return "Welcome";
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="sticky top-0 z-20 bg-[#141516] border-b border-[#26282A] pb-3 -mx-4 sm:-mx-6 xl:-mx-8 px-4 sm:px-6 xl:px-8 flex flex-col gap-3">
      {/* 1. Top Header Row: Greeting on left, Date Nav in center, Start Focus on right */}
      <div className="flex items-center justify-between gap-4 pt-2">
        {/* Left: Greeting & Formatted Date */}
        <div>
          <h1 suppressHydrationWarning className="text-xl sm:text-2xl font-semibold text-[#ECECE7] tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-xs text-[#8E9296] mt-0.5">{formattedDate}</p>
        </div>

        {/* Center: Compact Date Pill */}
        <div className="flex items-center bg-[#1E1F21] rounded-[8px] border border-[#2F3134] px-1 py-0.5">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="p-1 rounded-[4px] text-[#8E9296] hover:text-[#ECECE7] hover:bg-[#2A2C2E] disabled:opacity-30 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onBackToToday}
            className="px-3 py-1 text-xs font-medium text-[#ECECE7] hover:text-white transition-colors"
          >
            {isToday ? "Today" : selectedDay}
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="p-1 rounded-[4px] text-[#8E9296] hover:text-[#ECECE7] hover:bg-[#2A2C2E] disabled:opacity-30 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: + Start Focus amber button */}
        <div>
          {activeBlock ? (
            <button
              onClick={onOpenActiveBlock}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#1E1F21] border border-[#DDB66D] text-[#DDB66D] hover:bg-[#DDB66D]/10 transition-all text-xs sm:text-sm font-semibold shadow-[0_0_12px_rgba(221,182,109,0.2)]"
            >
              <span className="w-2 h-2 rounded-full bg-[#DDB66D] animate-ping" />
              <span>Return to block · {activeElapsedFormatted}</span>
            </button>
          ) : (
            <button
              onClick={onStartFocus}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#DDB66D] text-[#121314] hover:bg-[#E5C27C] transition-colors text-xs sm:text-sm font-semibold shadow-sm"
            >
              <span className="text-base font-bold leading-none">+</span>
              <span>Start focus</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Observation Banner (Image 4 Panel 1 style) */}
      {isAiVisible && reflection && (
        <div className="w-full bg-[#1A1B1D] border border-[#2B2D30] rounded-[8px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="w-4 h-4 text-[#8E9296] shrink-0" />
            <span className="text-[#ECECE7] truncate">
              {(reflection as any).headline || reflection.text}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onOpenEvidence && (
              <button
                onClick={() =>
                  onOpenEvidence(
                    (reflection as any).evidence || {
                      headline: (reflection as any).headline || reflection.text,
                      explanation: reflection.evidenceExplanation,
                      sampleCount: reflection.facts?.length || 1,
                      timezone: "Asia/Kolkata",
                      periodLabel: "Today",
                    }
                  )
                }
                className="text-xs text-[#DDB66D] hover:underline font-medium"
              >
                Why this?
              </button>
            )}
            <button
              onClick={onDismissReflection}
              className="text-[#8E9296] hover:text-[#ECECE7] text-xs"
              title="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
