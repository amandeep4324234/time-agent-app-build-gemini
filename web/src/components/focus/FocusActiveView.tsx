"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, Square, ArrowLeft, CheckCircle2, Plus } from "lucide-react";
import { FocusBlock, calculateBlockElapsedSeconds, calculateBlockRemainingSeconds } from "@/lib/focus-blocks";
import { formatDurationSeconds } from "@/lib/format";

interface FocusActiveViewProps {
  block: FocusBlock;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onReturnToOverview: () => void;
  onStartAnother?: () => void;
  onSaveForLater?: () => void;
}

export function FocusActiveView({
  block,
  onPause,
  onResume,
  onFinish,
  onReturnToOverview,
  onStartAnother,
  onSaveForLater,
}: FocusActiveViewProps) {
  // Local tick state to update timer display every second without mutating database state (§7.2, §7.5)
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (block.state !== "running") return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [block.state]);

  const elapsedSeconds = calculateBlockElapsedSeconds(block, nowMs);
  const remainingSeconds = calculateBlockRemainingSeconds(block, nowMs);

  // Check if target duration reached (§7.3)
  const isTargetReached = block.plannedSeconds !== null && remainingSeconds === 0;
  const isCompleted = block.state === "awaiting_review" || block.state === "reviewed" || isTargetReached;

  // Auto-finish on target duration reaching 0 if running (§7.3)
  useEffect(() => {
    if (block.state === "running" && isTargetReached) {
      onFinish();
    }
  }, [block.state, isTargetReached, onFinish]);

  const isCountdown = block.plannedSeconds !== null && remainingSeconds !== null && !isCompleted;
  const timerDisplaySeconds = isCountdown ? remainingSeconds : elapsedSeconds;

  // Format mm:ss or hh:mm:ss in JetBrains Mono
  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = block.plannedSeconds
    ? Math.min(100, Math.max(0, (elapsedSeconds / block.plannedSeconds) * 100))
    : 100;

  // Render §7.3 Completion View if finished or target reached
  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-xl mx-auto text-center select-text">
        <div className="w-full p-8 sm:p-10 bg-[#202122] border border-[#3A3D3E] rounded-[10px] flex flex-col items-center gap-6 relative">
          {/* Badge & Icon */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#90D2BC]/15 border border-[#90D2BC]/40 flex items-center justify-center text-[#90D2BC]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#90D2BC]">
              Block complete
            </span>
          </div>

          {/* Title & Elapsed Summary (§7.3) */}
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-[24px] font-semibold text-[#ECECE7] tracking-tight">
              {block.title || "Focus block"}
            </h1>
            <div className="text-[36px] sm:text-[44px] font-mono font-medium text-[#DDB66D] mt-1">
              {formatDurationSeconds(elapsedSeconds)}
            </div>
            <span className="text-[13px] text-[#A1A9A5]">total intentional active time</span>

            {block.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {block.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-[6px] bg-[#27292A] border border-[#3A3D3E] text-[12px] text-[#C1C5C1]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons: Review activity (off-white primary), Save for later (§7.3) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm pt-2">
            <button
              onClick={onFinish}
              className="tf-button tf-button-primary w-full sm:flex-1 py-3 px-5 text-[14px] font-medium transition-all"
            >
              <span>Review activity</span>
            </button>

            <button
              onClick={onSaveForLater || onReturnToOverview}
              className="tf-button w-full sm:flex-1 py-3 px-5 text-[14px] font-medium border border-[#737978] text-[#ECECE7] hover:bg-[#2D3031] transition-colors"
            >
              <span>Save for later</span>
            </button>
          </div>

          {onStartAnother && (
            <button
              onClick={onStartAnother}
              className="flex items-center gap-1.5 text-[13px] text-[#DDB66D] hover:underline font-medium mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start another block</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active Focus Screen (§7.5, approved-overview contract)
  return (
    <div className="max-w-[640px] mx-auto w-full pt-6 sm:pt-16 px-4 pb-12 select-text flex flex-col items-center">
      {/* Top Row: Back to overview (left-aligned) */}
      <div className="w-full flex items-center justify-start mb-8 sm:mb-12">
        <button
          type="button"
          onClick={onReturnToOverview}
          className="inline-flex items-center gap-2 text-[14px] text-[#C1C5C1] hover:text-[#ECECE7] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to overview</span>
        </button>
      </div>

      {/* Centered Block Title (24px) and Tags */}
      <div className="flex flex-col items-center gap-3 text-center w-full">
        <h1 className="text-[24px] font-semibold text-[#ECECE7] leading-snug">
          {block.title || "Focus session"}
        </h1>

        {block.tags.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1.5">
            {block.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-0.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[13px] text-[#C1C5C1]"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <span className="px-2.5 py-0.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[13px] text-[#A1A9A5]">
            General
          </span>
        )}
      </div>

      {/* Timer: 72px desktop / 56px mobile, JetBrains Mono, Tabular numbers */}
      <div className="mt-8 flex flex-col items-center text-center">
        <div className="text-[56px] sm:text-[72px] font-mono font-medium tracking-tight text-[#ECECE7] leading-none">
          {formatTimer(timerDisplaySeconds)}
        </div>
        <div className="mt-3 text-[14px] text-[#A1A9A5]">
          {block.state === "paused" ? "Paused" : isCountdown ? "Remaining" : "Elapsed"}
        </div>
      </div>

      {/* Horizontal Progress Track: Full content width, 12px high, radius 6, amber fill (§7.5) */}
      <div className="mt-6 w-full flex flex-col gap-2">
        <div
          className="w-full h-[12px] rounded-[6px] bg-[#27292A] border border-[#3A3D3E] overflow-hidden relative"
          role="progressbar"
          aria-valuenow={block.plannedSeconds ? Math.round(progressPercent) : elapsedSeconds}
          aria-valuemin={0}
          aria-valuemax={block.plannedSeconds ? 100 : undefined}
        >
          <div
            className="h-full bg-[#DDB66D] rounded-[6px] transition-all duration-500 ease-out"
            style={{ width: block.plannedSeconds ? `${progressPercent}%` : "100%" }}
          />
        </div>
        <div className="flex items-center justify-between text-[13px] font-mono text-[#A1A9A5]">
          <span>0:00</span>
          <span>
            {block.plannedSeconds ? formatTimer(block.plannedSeconds) : formatTimer(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Sub-metrics: Recorded Work & Other (§7.5) */}
      <div className="mt-6 w-full grid grid-cols-2 gap-4 text-center py-3 border-y border-[#2D3031]">
        <div className="flex flex-col items-center">
          <span className="text-[13px] text-[#A1A9A5]">Recorded work</span>
          <span className="text-[18px] font-mono font-medium text-[#ECECE7] mt-0.5">
            {formatDurationSeconds(elapsedSeconds)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[13px] text-[#A1A9A5]">Other</span>
          <span className="text-[18px] font-mono font-medium text-[#ECECE7] mt-0.5">
            0m
          </span>
        </div>
      </div>

      {/* Action Controls: Pause/Resume (secondary) and Finish (off-white primary) (§7.5) */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
        {block.state === "running" ? (
          <button
            type="button"
            onClick={onPause}
            className="tf-button w-full sm:flex-1 min-h-[48px] min-w-[144px] text-[14px] font-medium border border-[#737978] bg-transparent text-[#ECECE7] hover:bg-[#2D3031] transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onResume}
            className="tf-button w-full sm:flex-1 min-h-[48px] min-w-[144px] text-[14px] font-medium border border-[#737978] bg-transparent text-[#ECECE7] hover:bg-[#2D3031] transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Resume</span>
          </button>
        )}

        <button
          type="button"
          onClick={onFinish}
          className="tf-button tf-button-primary w-full sm:flex-1 min-h-[48px] min-w-[144px] text-[14px] font-medium bg-[#ECECE7] text-[#171819] hover:bg-white transition-colors"
        >
          <Square className="w-4 h-4 fill-current" />
          <span>Finish</span>
        </button>
      </div>
    </div>
  );
}
