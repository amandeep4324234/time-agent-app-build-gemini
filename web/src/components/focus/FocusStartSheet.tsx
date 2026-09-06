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
  const [lastTimedMode, setLastTimedMode] = useState<"25" | "45" | "60" | "90" | "custom">("45");
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [tags, setTags] = useState<string[]>(["Design", "UI"]);
  const [tagInput, setTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [autoReview, setAutoReview] = useState(true);

  if (!isOpen) return null;

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().slice(0, 32);
    if (trimmed && tags.length < 8 && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
    setIsAddingTag(false);
  };

  const handleSelectDuration = (mode: "25" | "45" | "60" | "90" | "custom" | "open") => {
    setDurationMode(mode);
    if (mode !== "open") {
      setLastTimedMode(mode);
    }
  };

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let plannedMinutes: number | null = 45;
    if (durationMode === "25") plannedMinutes = 25;
    else if (durationMode === "45") plannedMinutes = 45;
    else if (durationMode === "60") plannedMinutes = 60;
    else if (durationMode === "90") plannedMinutes = 90;
    else if (durationMode === "custom") plannedMinutes = Math.min(240, Math.max(1, customMinutes));
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
        className="w-full max-w-[520px] p-6 bg-[#202122] border border-[#3A3D3E] rounded-[10px] shadow-2xl flex flex-col gap-5 text-left"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-block-heading"
      >
        {/* Header (§7.4: Heading 22px Start a focus block) */}
        <div className="flex items-center justify-between">
          <div>
            <h2 id="start-block-heading" className="text-[22px] font-semibold text-[#ECECE7] leading-tight m-0">
              Start a focus block
            </h2>
            <p className="text-[14px] text-[#A1A9A5] mt-1 m-0">
              Dedicate intentional time to your priority work.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-[6px] text-[#A1A9A5] hover:text-[#ECECE7] hover:bg-[#27292A] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleStartSubmit} className="flex flex-col gap-5">
          {/* 1. What are you working on? */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#C1C5C1]">
              What are you working on?
            </label>
            <input
              type="text"
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Design system"
              className="h-[44px] px-3.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[14px] text-[#ECECE7] placeholder-[#737978] focus:outline-none focus:border-[#ECECE7]"
              autoFocus
            />
          </div>

          {/* 2. How long do you want to focus? (44px buttons, selected neutral fill + amber bottom inset) */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#C1C5C1]">
              How long do you want to focus?
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  { id: "25", label: "25m" },
                  { id: "45", label: "45m" },
                  { id: "60", label: "60m" },
                  { id: "90", label: "90m" },
                  { id: "custom", label: "Custom" },
                  { id: "open", label: "Open-ended" },
                ] as const
              ).map((btn) => {
                const isSelected = durationMode === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => handleSelectDuration(btn.id)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-[6px] text-[14px] font-medium border transition-colors ${
                      isSelected
                        ? "bg-[#27292A] text-[#ECECE7] border-[#3A3D3E] border-b-2 border-b-[#DDB66D]"
                        : "bg-[#171819] text-[#A1A9A5] border-[#3A3D3E] hover:text-[#ECECE7]"
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {durationMode === "custom" && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="h-[44px] w-24 px-3 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[14px] text-[#ECECE7] font-mono focus:outline-none focus:border-[#ECECE7]"
                />
                <span className="text-[14px] text-[#A1A9A5]">minutes (1–240)</span>
              </div>
            )}
          </div>

          {/* 3. Tags (Max 8 tags, 32-char max) */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#C1C5C1]">Tags</label>
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map((t) => (
                <span
                  key={t}
                  className="min-h-[36px] px-3 py-1.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[13px] text-[#ECECE7] flex items-center gap-2"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-[#A1A9A5] hover:text-[#ECECE7] text-[14px] leading-none"
                    aria-label={`Remove tag ${t}`}
                  >
                    &times;
                  </button>
                </span>
              ))}

              {isAddingTag ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={32}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      } else if (e.key === "Escape") {
                        setIsAddingTag(false);
                      }
                    }}
                    placeholder="Tag name"
                    className="h-[36px] px-2.5 rounded-[6px] bg-[#171819] border border-[#737978] text-[13px] text-[#ECECE7] w-28 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="h-[36px] px-2.5 rounded-[6px] bg-[#27292A] text-[#ECECE7] text-[13px] font-medium hover:bg-[#2D3031]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(false)}
                    className="h-[36px] px-2 text-[#A1A9A5] hover:text-[#ECECE7] text-[13px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                tags.length < 8 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="min-h-[36px] px-3 py-1.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[13px] text-[#A1A9A5] hover:text-[#ECECE7] hover:border-[#737978] transition-colors"
                  >
                    + Add tag
                  </button>
                )
              )}
            </div>
          </div>

          {/* 4. Review activity checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={autoReview}
              onChange={(e) => setAutoReview(e.target.checked)}
              className="mt-1 rounded border-[#3A3D3E] text-[#DDB66D] bg-[#171819] focus:ring-0 w-4 h-4"
            />
            <div className="flex flex-col">
              <span className="text-[14px] text-[#ECECE7] font-medium">
                Review activity when I finish
              </span>
              <span className="text-[13px] text-[#A1A9A5]">
                You&apos;ll be able to categorize apps and adjust what&apos;s included in your analysis.
              </span>
            </div>
          </label>

          {/* 5. Footer Buttons: Cancel right-adjacent to Start block, 44px high */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3A3D3E]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-[6px] text-[14px] font-medium text-[#ECECE7] bg-transparent border border-[#737978] hover:bg-[#27292A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tf-button tf-button-primary min-h-[44px] px-5 py-2.5 rounded-[6px] bg-[#ECECE7] text-[#171819] hover:bg-white text-[14px] font-medium transition-colors"
            >
              Start block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
