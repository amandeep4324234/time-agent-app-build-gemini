"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Play, RotateCcw, Calendar, Clock } from "lucide-react";
import { ReflectionCard } from "./ReflectionCard";
import { ReflectionResult, ReflectionTone } from "@/lib/reflection-service";
import { FocusBlock, calculateBlockElapsedSeconds } from "@/lib/focus-blocks";
import { formatDurationSeconds } from "@/lib/format";

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
}: PinnedCommandAreaProps) {
  const currentIndex = availableDays.indexOf(selectedDay);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < availableDays.length - 1;
  const isToday = selectedDay === latestDay;

  const handlePrev = () => {
    if (canGoPrev) onSelectDay(availableDays[currentIndex - 1]);
  };

  const handleNext = () => {
    if (canGoNext) onSelectDay(availableDays[currentIndex + 1]);
  };

  const activeElapsedSeconds = activeBlock ? calculateBlockElapsedSeconds(activeBlock) : 0;
  const activeElapsedFormatted = formatDurationSeconds(activeElapsedSeconds);

  return (
    <div className="sticky top-0 z-20 bg-[#0B0E14] border-b border-[#2B374B] pb-3 -mx-4 sm:-mx-6 xl:-mx-8 px-4 sm:px-6 xl:px-8 flex flex-col gap-2.5">
      {/* 1. Header Bar (~56px) */}
      <div className="flex items-center justify-between gap-4 h-12 pt-1">
        {/* Date Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#141A25] rounded-[8px] border border-[#2B374B] p-0.5">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="p-1.5 rounded-[6px] text-[#B8C4D8] hover:text-[#F2F5FB] hover:bg-[#1F2939] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="p-1.5 rounded-[6px] text-[#B8C4D8] hover:text-[#F2F5FB] hover:bg-[#1F2939] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-semibold text-[#F2F5FB] tracking-tight">
              {selectedDay}
            </span>
            <span className="hidden sm:inline text-xs text-[#96A5BD]">
              {timezone.replace("_", " ")}
            </span>
          </div>

          {!isToday && (
            <button
              onClick={onBackToToday}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[6px] bg-[#1A2230] text-[#B8C4D8] hover:text-[#F2F5FB] hover:bg-[#1F2939] border border-[#2B374B] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Jump to Today</span>
            </button>
          )}
        </div>

        {/* Primary Action Button: "Start focus" or "Return to block · {elapsed}" (§3, §7.1) */}
        <div>
          {activeBlock ? (
            <button
              onClick={onOpenActiveBlock}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-[#AAA9FF]/20 border border-[#AAA9FF] text-[#D0CEFF] hover:bg-[#AAA9FF]/30 transition-all text-xs sm:text-sm font-semibold shadow-[0_0_12px_rgba(170,169,255,0.25)]"
            >
              <span className="w-2 h-2 rounded-full bg-[#7CDCE5] animate-ping" />
              <span>Return to block · {activeElapsedFormatted}</span>
            </button>
          ) : (
            <button
              onClick={onStartFocus}
              className="flex items-center gap-2 px-4 py-1.5 rounded-[8px] bg-[#AAA9FF] text-[#0B0E14] hover:bg-[#D0CEFF] transition-colors text-xs sm:text-sm font-semibold shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-[#0B0E14]" />
              <span>Start focus</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Pinned AI Observation Card (§3.1, §4) */}
      {isAiVisible && (
        <ReflectionCard
          reflection={reflection}
          onSelectTone={onSelectAiTone}
          onRefresh={onRefreshReflection}
          onDismiss={onDismissReflection}
          onTurnOff={onTurnOffAi}
        />
      )}
    </div>
  );
}
