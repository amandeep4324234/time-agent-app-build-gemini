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
  const [title, setTitle] = useState("Design system");
  const [durationMode, setDurationMode] = useState<"25" | "45" | "60" | "90" | "custom" | "open">("45");
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [tags, setTags] = useState<string[]>(["Design", "UI"]);
  const [autoReview, setAutoReview] = useState(true);

  if (!isOpen) return null;

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let plannedMinutes: number | null = 45;
    if (durationMode === "25") plannedMinutes = 25;
    else if (durationMode === "45") plannedMinutes = 45;
    else if (durationMode === "60") plannedMinutes = 60;
    else if (durationMode === "90") plannedMinutes = 90;
    else if (durationMode === "custom") plannedMinutes = customMinutes;
    else plannedMinutes = null;

    onStart({
      title: title.trim().slice(0, 80) || "Untitled focus block",
      plannedMinutes,
      tags: normalizeTags(tags),
      autoReview,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#141516]/80 backdrop-blur-sm flex items-center justify-center p-4 select-text"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 bg-[#1C1D1F] border border-[#2A2C2E] rounded-[12px] shadow-2xl flex flex-col gap-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Image 2 Panel 2) */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#ECECE7]">Start a block</h2>
          <button
            onClick={onClose}
            className="text-[#8E9296] hover:text-[#ECECE7] p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleStartSubmit} className="flex flex-col gap-4">
          {/* 1. What are you working on? */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#8E9296]">
              What are you working on?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              placeholder="Design system"
              className="px-3.5 py-2 rounded-[8px] bg-[#141516] border border-[#2A2C2E] text-xs text-[#ECECE7] placeholder-[#8E9296] focus:outline-none focus:border-[#DDB66D]"
              autoFocus
            />
          </div>

          {/* 2. How long do you want to focus? (Single row of 6 pills) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#8E9296]">
              How long do you want to focus?
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: "25", label: "25m" },
                  { id: "45", label: "45m" },
                  { id: "60", label: "60m" },
                  { id: "90", label: "90m" },
                  { id: "custom", label: "Custom" },
                  { id: "open", label: "Open-ended" },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setDurationMode(btn.id)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-colors ${
                    durationMode === btn.id
                      ? "bg-[#DDB66D] text-[#121314] font-bold border-[#DDB66D]"
                      : "bg-[#141516] text-[#8E9296] border-[#2A2C2E] hover:text-[#ECECE7]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {durationMode === "custom" && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="w-20 px-2.5 py-1 rounded-[6px] bg-[#141516] border border-[#2A2C2E] text-xs text-[#ECECE7] font-mono"
                />
                <span className="text-xs text-[#8E9296]">minutes</span>
              </div>
            )}
          </div>

          {/* 3. Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#8E9296]">Tags</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-[6px] bg-[#141516] border border-[#2A2C2E] text-xs text-[#ECECE7] flex items-center gap-1.5"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-[#8E9296] hover:text-[#ECECE7]"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => {
                  const tag = prompt("Enter tag:");
                  if (tag && tag.trim() && !tags.includes(tag.trim())) {
                    setTags([...tags, tag.trim()]);
                  }
                }}
                className="px-2.5 py-1 rounded-[6px] bg-[#141516] border border-[#2A2C2E] text-xs text-[#8E9296] hover:text-[#ECECE7]"
              >
                + Add tag
              </button>
            </div>
          </div>

          {/* 4. Review activity checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none pt-2">
            <input
              type="checkbox"
              checked={autoReview}
              onChange={(e) => setAutoReview(e.target.checked)}
              className="mt-0.5 rounded border-[#2A2C2E] text-[#DDB66D] bg-[#141516] focus:ring-0"
            />
            <div className="flex flex-col">
              <span className="text-xs text-[#ECECE7] font-medium">
                Review activity when I finish
              </span>
              <span className="text-[11px] text-[#8E9296]">
                You'll be able to categorize apps and adjust what's included in your analysis.
              </span>
            </div>
          </label>

          {/* 5. Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#26282A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#ECECE7] bg-[#26282A] hover:bg-[#2F3134] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-[8px] bg-[#ECECE7] text-[#121314] hover:bg-white text-xs font-bold transition-colors shadow-sm"
            >
              Start block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
