"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, Square, ArrowLeft, Clock, Tag, Sparkles, CheckCircle2, RotateCcw, Plus } from "lucide-react";
import { FocusBlock, calculateBlockElapsedSeconds, calculateBlockRemainingSeconds, isBlockTargetReached } from "@/lib/focus-blocks";
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
  // Local tick state to update timer display every second without mutating database state (§7.2)
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
    ? Math.min(100, (elapsedSeconds / block.plannedSeconds) * 100)
    : 100;

  // Render §7.3 Completion View if finished or target reached
  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-2xl mx-auto text-center select-text">
        <div className="card-midnight w-full p-8 sm:p-12 bg-[#202122] border border-[#DDB66D]/60 flex flex-col items-center gap-7 shadow-2xl relative overflow-hidden">
          {/* Completion glow */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#90D2BC]/15 to-transparent pointer-events-none" />

          {/* Badge & Icon */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#90D2BC]/15 border border-[#90D2BC]/40 flex items-center justify-center text-[#90D2BC] shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#90D2BC]">
              Block complete
            </span>
          </div>

          {/* Title & Elapsed Summary (§7.3) */}
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#ECECE7] tracking-tight">
              {block.title || "Focus block"}
            </h1>
            <div className="text-3xl sm:text-4xl font-mono font-medium text-[#DDB66D] mt-1">
              {formatDurationSeconds(elapsedSeconds)}
            </div>
            <span className="text-xs text-[#A1A9A5]">total intentional active time</span>

            {block.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {block.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-full bg-[#282A2C] border border-[#3A3D3E] text-xs text-[#DDB66D]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons: Review activity (primary), Save for later, Start another (§7.3) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-2">
            <button
              onClick={onFinish}
              className="w-full sm:flex-1 py-3 px-5 rounded-[10px] bg-[#DDB66D] text-[#171819] hover:bg-[#E8C888] text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Review activity</span>
            </button>

            <button
              onClick={onSaveForLater || onReturnToOverview}
              className="w-full sm:flex-1 py-3 px-5 rounded-[10px] bg-[#282A2C] hover:bg-[#2F3133] text-[#ECECE7] text-sm font-semibold border border-[#3A3D3E] transition-colors"
            >
              <span>Save for later</span>
            </button>
          </div>

          {onStartAnother && (
            <button
              onClick={onStartAnother}
              className="flex items-center gap-1.5 text-xs text-[#DDB66D] hover:underline font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start another block</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[85vh] p-6 max-w-4xl mx-auto select-text">
      {/* Top bar (Image 2 Panel 3) */}
      <div className="flex items-center justify-between w-full mb-10">
        <h1 className="text-xl font-bold text-[#ECECE7] tracking-tight">
          Focus mode
        </h1>
        <button
          onClick={onReturnToOverview}
          className="flex items-center gap-1.5 text-xs text-[#8E9296] hover:text-[#ECECE7] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to overview</span>
        </button>
      </div>

      {/* Main Focus Center */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Title & Tags Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-[#DDB66D]">
            <span className="text-sm">✏️</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#ECECE7] tracking-tight">
            {block.title || "Untitled focus block"}
          </h2>

          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {block.tags.length > 0 ? (
              block.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 rounded-[4px] bg-[#1E1F21] border border-[#2F3134] text-xs text-[#ECECE7]"
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="px-2.5 py-0.5 rounded-[4px] bg-[#1E1F21] border border-[#2F3134] text-xs text-[#ECECE7]">
                General
              </span>
            )}
          </div>
        </div>

        {/* Circular Countdown / Elapsed Timer Ring */}
        <div className="relative w-64 h-64 flex items-center justify-center my-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#1E1F21"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#DDB66D"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-medium text-[#ECECE7] tracking-tight">
              {formatTimer(timerDisplaySeconds)}
            </span>
            <span className="text-xs text-[#8E9296] mt-0.5">
              {isCountdown ? "remaining" : "elapsed"}
            </span>
          </div>
        </div>

        {/* Sub-metrics: Recorded work & Other */}
        <div className="flex items-center gap-12 text-center">
          <div className="flex flex-col items-center">
            <span className="text-xs text-[#8E9296]">Recorded work</span>
            <span className="text-base font-semibold text-[#ECECE7] mt-0.5">
              {Math.round(elapsedSeconds / 60)}m
            </span>
          </div>
          <div className="h-8 w-[1px] bg-[#2A2C2E]" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-[#8E9296]">Other</span>
            <span className="text-base font-semibold text-[#ECECE7] mt-0.5">
              3m
            </span>
          </div>
        </div>

        {/* Action Controls: Pause/Resume, Finish */}
        <div className="flex items-center gap-4 pt-4">
          {block.state === "running" ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[8px] bg-[#1E1F21] hover:bg-[#2A2C2E] text-[#ECECE7] text-xs font-semibold border border-[#2F3134] transition-colors"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onResume}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[8px] bg-[#DDB66D] text-[#121314] hover:bg-[#E5C27C] text-xs font-bold transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-[#121314]" />
              <span>Resume</span>
            </button>
          )}

          <button
            onClick={onFinish}
            className="flex items-center gap-2 px-8 py-2.5 rounded-[8px] bg-[#ECECE7] hover:bg-white text-[#121314] text-xs font-bold transition-colors shadow-sm"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Finish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
