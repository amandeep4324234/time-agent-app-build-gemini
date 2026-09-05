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
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-2xl mx-auto text-center select-text">
      {/* Return to overview button (§7.2) */}
      <div className="w-full flex justify-start mb-6">
        <button
          onClick={onReturnToOverview}
          className="flex items-center gap-1.5 text-xs text-[#A1A9A5] hover:text-[#ECECE7] px-3 py-1.5 rounded-[8px] bg-[#202122] border border-[#3A3D3E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Overview (keeps running)</span>
        </button>
      </div>

      {/* Main Focus Card */}
      <div className="card-midnight w-full p-8 sm:p-12 bg-[#202122] border border-[#3A3D3E] flex flex-col items-center gap-8 shadow-2xl relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#DDB66D]/10 to-transparent pointer-events-none" />

        {/* Title & Tags Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                block.state === "running" ? "bg-[#DDB66D] animate-pulse" : "bg-[#D9BE87]"
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C1C5C1]">
              {block.state === "running" ? "Focus Block Active" : "Block Paused"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#ECECE7] tracking-tight">
            {block.title || "Untitled focus block"}
          </h1>

          {block.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
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

        {/* Large Countdown / Elapsed Timer (§2.2, §7.2) */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-6xl sm:text-8xl font-mono font-medium text-[#ECECE7] tracking-tighter tabular-nums select-all">
            {formatTimer(timerDisplaySeconds)}
          </div>
          <span className="text-xs text-[#A1A9A5]">
            {isCountdown ? "Remaining intentional time" : "Elapsed active time"}
          </span>
        </div>

        {/* Horizontal Elapsed Progress Bar (§7.2) */}
        {block.plannedSeconds && (
          <div className="w-full max-w-md flex flex-col gap-1.5">
            <div className="w-full h-3 rounded-full bg-[#171819] border border-[#3A3D3E] p-0.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#DDB66D] shadow-[0_0_12px_rgba(170,169,255,0.4)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-[#A1A9A5]">
              <span>{formatDurationSeconds(elapsedSeconds)} elapsed</span>
              <span>{formatDurationSeconds(block.plannedSeconds)} planned</span>
            </div>
          </div>
        )}

        {/* Action Controls: Pause/Resume, Finish (§7.2) */}
        <div className="flex items-center gap-4 pt-2">
          {block.state === "running" ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#2F3133] hover:bg-[#3A3D3E] text-[#ECECE7] text-sm font-semibold border border-[#3A3D3E] transition-colors"
            >
              <Pause className="w-4 h-4" />
              <span>Pause block</span>
            </button>
          ) : (
            <button
              onClick={onResume}
              className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#DDB66D] text-[#171819] hover:bg-[#E8C888] text-sm font-bold transition-colors shadow-md"
            >
              <Play className="w-4 h-4 fill-[#171819]" />
              <span>Resume block</span>
            </button>
          )}

          <button
            onClick={onFinish}
            className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#282A2C] hover:bg-[#DFA095]/20 text-[#DFA095] hover:text-[#ECECE7] text-sm font-semibold border border-[#3A3D3E] transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Finish & Review</span>
          </button>
        </div>

        {/* Explanatory note */}
        <p className="text-[11px] text-[#A1A9A5] max-w-sm">
          Switching to a sink app will not terminate this block. Take brief breaks as needed and review recorded activity upon completion.
        </p>
      </div>
    </div>
  );
}
