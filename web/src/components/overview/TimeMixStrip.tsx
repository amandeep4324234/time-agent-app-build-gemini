"use client";

import React, { useState } from "react";
import { X, PieChart, ChevronRight, Layers } from "lucide-react";
import { formatDurationSeconds } from "@/lib/format";

export interface TimeMixCategoryItem {
  category: "work" | "sink" | "games" | "other" | "unclassified";
  label: string;
  seconds: number;
  hours: number;
  percent: number;
  color: string;
}

interface TimeMixStripProps {
  categories: TimeMixCategoryItem[];
  totalTrackedSeconds: number;
  onShowMatchingActivity?: (category: string) => void;
  className?: string;
}

export function TimeMixStrip({
  categories,
  totalTrackedSeconds,
  onShowMatchingActivity,
  className = "",
}: TimeMixStripProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Filter out categories with 0% to keep legend compact
  const activeCategories = categories.filter((c) => c.seconds > 0);

  // Check if categories sum to ~100% (within 5% margin due to rounding or non-overlap)
  const percentSum = activeCategories.reduce((acc, c) => acc + c.percent, 0);
  const isMutuallyExclusive = percentSum >= 90 && percentSum <= 105;

  return (
    <>
      {/* Slim Composition Strip Row (§3.2: Desktop ~40px, Mobile ~52px) */}
      <div
        className={`w-full bg-[#202122] border border-[#3A3D3E] rounded-[10px] px-3.5 py-2 flex flex-col md:flex-row items-center justify-between gap-2.5 select-text ${className}`}
        aria-label="Time mix composition"
      >
        {/* Left: Visible Time mix button & segmented bar */}
        <div className="w-full md:w-auto flex-1 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-xs font-semibold text-[#ECECE7] hover:border-[#737978] transition-colors shrink-0"
            aria-label="Open Time mix breakdown"
          >
            <PieChart className="w-3.5 h-3.5 text-[#DDB66D]" />
            <span>Time mix</span>
          </button>

          {/* 8px desktop / 6px mobile horizontal segmented bar */}
          {isMutuallyExclusive && activeCategories.length > 0 ? (
            <div
              onClick={() => setIsSheetOpen(true)}
              className="flex-1 h-1.5 md:h-2 rounded-[6px] overflow-hidden flex bg-[#171819] cursor-pointer"
              title="Click to view full category breakdown"
            >
              {activeCategories.map((cat) => (
                <div
                  key={cat.category}
                  style={{
                    width: `${Math.max(1, cat.percent)}%`,
                    backgroundColor: cat.color,
                  }}
                  className="h-full hover:brightness-110 transition-all"
                  title={`${cat.label}: ${formatDurationSeconds(cat.seconds)} (${cat.percent}%)`}
                />
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-[#A1A9A5] italic">
              Categories measured independently
            </span>
          )}
        </div>

        {/* Right: Short Legend in the same row */}
        <div className="w-full md:w-auto flex items-center justify-start md:justify-end gap-3 text-xs overflow-x-auto shrink-0">
          {activeCategories.slice(0, 4).map((cat) => (
            <div
              key={cat.category}
              onClick={() => setIsSheetOpen(true)}
              className="flex items-center gap-1.5 cursor-pointer hover:text-[#ECECE7] text-[#C1C5C1] transition-colors shrink-0"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-[11px]">{cat.label}</span>
              <span className="font-mono text-[11px] text-[#A1A9A5]">
                {cat.percent}%
              </span>
            </div>
          ))}
          {activeCategories.length > 4 && (
            <button
              onClick={() => setIsSheetOpen(true)}
              className="text-[11px] text-[#DDB66D] hover:underline"
            >
              +{activeCategories.length - 4} more
            </button>
          )}
        </div>
      </div>

      {/* Category Breakdown Sheet (§3.2) */}
      {isSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-text"
          onClick={() => setIsSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Time mix category breakdown"
        >
          <div
            className="w-full max-w-lg bg-[#202122] border border-[#737978] shadow-2xl rounded-[10px] p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#3A3D3E] pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#DDB66D]" />
                <h3 className="text-sm font-semibold text-[#ECECE7]">
                  Time Mix Breakdown
                </h3>
              </div>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#A1A9A5] hover:text-[#ECECE7] hover:bg-[#3A3D3E] transition-colors"
                aria-label="Close time mix breakdown"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Duration Banner */}
            <div className="p-3 rounded-[8px] bg-[#171819] border border-[#3A3D3E] flex items-center justify-between">
              <span className="text-xs text-[#C1C5C1]">Total Recorded Duration</span>
              <span className="font-mono text-sm font-bold text-[#DDB66D]">
                {formatDurationSeconds(totalTrackedSeconds)}
              </span>
            </div>

            {/* Category Rows with Show Matching Activity action (§3.2) */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A9A5]">
                Categories
              </span>
              <div className="divide-y divide-[#3A3D3E] border border-[#3A3D3E] rounded-[8px] overflow-hidden bg-[#171819]">
                {categories.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3 flex items-center justify-between hover:bg-[#202122] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#ECECE7]">
                          {cat.label}
                        </span>
                        <span className="text-[11px] font-mono text-[#A1A9A5]">
                          {formatDurationSeconds(cat.seconds)} ({cat.percent}%)
                        </span>
                      </div>
                    </div>

                    {onShowMatchingActivity && (
                      <button
                        onClick={() => {
                          setIsSheetOpen(false);
                          onShowMatchingActivity(cat.category);
                        }}
                        className="flex items-center gap-1 text-xs text-[#C1C5C1] hover:text-[#ECECE7] px-2 py-1 rounded bg-[#202122] border border-[#3A3D3E] hover:border-[#737978] transition-colors"
                      >
                        <span>Show matching activity</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanatory Limitation Footer */}
            <div className="text-[11px] text-[#A1A9A5] leading-relaxed p-2.5 rounded-[6px] bg-[#171819]/60 border border-[#3A3D3E]">
              Percentages reflect category duration shares of eligible recorded time. When devices overlap simultaneously, categories are attributed without false proportions.
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsSheetOpen(false)}
                className="px-4 py-1.5 rounded-[6px] bg-[#171819] text-[#ECECE7] border border-[#3A3D3E] hover:bg-[#3A3D3E] text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
