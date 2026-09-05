"use client";

import React, { useState } from "react";
import { X, Play, Tag, Clock, Sparkles } from "lucide-react";
import { normalizeTags } from "@/lib/focus-blocks";

interface FocusStartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (params: {
    title: string;
    plannedMinutes: number | null;
    tags: string[];
    autoReview: boolean;
  }) => void;
}

const PRESET_DURATIONS = [25, 45, 60, 90] as const;

export function FocusStartSheet({ isOpen, onClose, onStart }: FocusStartSheetProps) {
  const [title, setTitle] = useState("");
  const [durationMode, setDurationMode] = useState<"preset" | "custom" | "open">("preset");
  const [selectedPreset, setSelectedPreset] = useState<number>(45); // default 45m (§7.1)
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["Deep Work"]);
  const [autoReview, setAutoReview] = useState(true);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (!tagInput.trim()) return;
      const updated = normalizeTags([...tags, tagInput]);
      setTags(updated);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let plannedMinutes: number | null = null;
    if (durationMode === "preset") plannedMinutes = selectedPreset;
    else if (durationMode === "custom") plannedMinutes = Math.min(240, Math.max(1, customMinutes));
    else plannedMinutes = null;

    onStart({
      title: title.trim().slice(0, 80),
      plannedMinutes,
      tags: normalizeTags(tags),
      autoReview,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-text"
      onClick={onClose}
    >
      <div
        className="card-midnight w-full max-w-lg p-6 bg-[#202122] border border-[#737978] shadow-2xl flex flex-col gap-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3A3D3E] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-[#DDB66D]/15 border border-[#DDB66D]/30 flex items-center justify-center">
              <Play className="w-4 h-4 fill-[#DDB66D] text-[#DDB66D]" />
            </div>
            <h2 className="text-base font-bold text-[#ECECE7]">Start Focus Block</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#A1A9A5] hover:text-[#ECECE7] hover:bg-[#2F3133] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStartSubmit} className="flex flex-col gap-4">
          {/* 1. Title Input (max 80 chars, §7.1) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#C1C5C1]">
              What are you working on?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              placeholder="e.g. Architecture refactor, Writing spec"
              className="px-3.5 py-2.5 rounded-[8px] bg-[#171819] border border-[#3A3D3E] text-sm text-[#ECECE7] placeholder-[#A1A9A5] focus:outline-none focus:border-[#DDB66D]"
              autoFocus
            />
            <div className="flex justify-end text-[11px] text-[#A1A9A5]">
              {title.length}/80
            </div>
          </div>

          {/* 2. Duration Presets (§7.1) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#C1C5C1]">Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_DURATIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setDurationMode("preset");
                    setSelectedPreset(preset);
                  }}
                  className={`py-2 rounded-[8px] text-xs font-semibold border transition-all ${
                    durationMode === "preset" && selectedPreset === preset
                      ? "bg-[#DDB66D] text-[#171819] border-[#DDB66D] shadow-sm"
                      : "bg-[#282A2C] text-[#C1C5C1] border-[#3A3D3E] hover:bg-[#2F3133]"
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>

            {/* Custom & Open-Ended Options */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setDurationMode("custom")}
                className={`py-2 rounded-[8px] text-xs font-semibold border transition-all ${
                  durationMode === "custom"
                    ? "bg-[#DDB66D] text-[#171819] border-[#DDB66D]"
                    : "bg-[#282A2C] text-[#C1C5C1] border-[#3A3D3E] hover:bg-[#2F3133]"
                }`}
              >
                Custom (1–240m)
              </button>
              <button
                type="button"
                onClick={() => setDurationMode("open")}
                className={`py-2 rounded-[8px] text-xs font-semibold border transition-all ${
                  durationMode === "open"
                    ? "bg-[#DDB66D] text-[#171819] border-[#DDB66D]"
                    : "bg-[#282A2C] text-[#C1C5C1] border-[#3A3D3E] hover:bg-[#2F3133]"
                }`}
              >
                Open-ended
              </button>
            </div>

            {durationMode === "custom" && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 rounded-[8px] bg-[#171819] border border-[#3A3D3E] text-sm text-[#ECECE7] font-mono"
                />
                <span className="text-xs text-[#A1A9A5]">minutes target</span>
              </div>
            )}
          </div>

          {/* 3. Tags (up to 8 tags, max 32 chars, §7.1) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#C1C5C1]">
              Tags (Optional, max 8)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-[8px] bg-[#171819] border border-[#3A3D3E]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#282A2C] border border-[#3A3D3E] text-xs text-[#ECECE7]"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-[#A1A9A5] hover:text-[#DFA095]"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {tags.length < 8 && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={tags.length === 0 ? "Type tag & press Enter..." : "Add tag..."}
                  className="bg-transparent text-xs text-[#ECECE7] placeholder-[#A1A9A5] focus:outline-none flex-1 min-w-[100px]"
                />
              )}
            </div>
          </div>

          {/* 4. Review when finished checkbox (§7.1) */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={autoReview}
              onChange={(e) => setAutoReview(e.target.checked)}
              className="w-4 h-4 rounded border-[#3A3D3E] text-[#DDB66D] focus:ring-0 focus:ring-offset-0 bg-[#171819]"
            />
            <span className="text-xs text-[#C1C5C1]">
              Review activity when I finish (recommended)
            </span>
          </label>

          {/* 5. Submit & Cancel (§7.1) */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3A3D3E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#A1A9A5] hover:text-[#ECECE7] hover:bg-[#282A2C] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-[8px] bg-[#DDB66D] text-[#171819] hover:bg-[#E8C888] text-xs font-bold transition-colors shadow-sm"
            >
              Start block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
