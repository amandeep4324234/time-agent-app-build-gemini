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

  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("sink");

  const sampleAppsByCategory: Record<string, Array<{ name: string; time: string }>> = {
    sink: [
      { name: "Instagram", time: "24m" },
      { name: "YouTube", time: "12m" },
      { name: "Reddit", time: "4m" },
      { name: "TikTok", time: "2m" },
    ],
    work: [
      { name: "Visual Studio Code", time: "2h 10m" },
      { name: "Figma", time: "52m" },
      { name: "Notion", time: "22m" },
    ],
    games: [
      { name: "Steam", time: "20m" },
    ],
    other: [
      { name: "System Preferences", time: "26m" },
      { name: "Finder", time: "20m" },
    ],
    unclassified: [
      { name: "Terminal", time: "16m" },
    ],
  };

  const selectedCategoryObj = categories.find((c) => c.category === selectedCategoryKey) || categories[1] || categories[0];

  return (
    <>
      {/* Slim Composition Strip Row (Image 4 Panel 1) */}
      <div
        className={`w-full bg-[#1C1D1F] border border-[#2A2C2E] rounded-[10px] px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 select-text ${className}`}
        aria-label="Time mix composition"
      >
        {/* Left: Time mix label & segmented bar */}
        <div className="w-full md:w-auto flex-1 flex items-center gap-3">
          <span
            onClick={() => setIsSheetOpen(true)}
            className="text-xs text-[#8E9296] font-medium shrink-0 cursor-pointer hover:text-[#ECECE7] transition-colors"
          >
            Time mix
          </span>

          {/* Segmented bar */}
          <div
            onClick={() => setIsSheetOpen(true)}
            className="flex-1 h-2 rounded-full overflow-hidden flex bg-[#2A2C2E] cursor-pointer"
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
        </div>

        {/* Right: Inline Legend */}
        <div className="w-full md:w-auto flex items-center justify-start md:justify-end gap-3 text-xs overflow-x-auto shrink-0">
          {activeCategories.map((cat) => (
            <div
              key={cat.category}
              onClick={() => {
                setSelectedCategoryKey(cat.category);
                setIsSheetOpen(true);
              }}
              className="flex items-center gap-1.5 cursor-pointer hover:text-[#ECECE7] text-[#8E9296] transition-colors shrink-0"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-[11px] text-[#ECECE7] font-medium">{cat.label}</span>
              <span className="font-mono text-[11px] text-[#8E9296]">
                {cat.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Mix Detail Slide-over Drawer (Image 4 Panel 4) */}
      {isSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex justify-end select-text animate-in fade-in duration-200"
          onClick={() => setIsSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Time mix detail"
        >
          <div
            className="w-full max-w-md bg-[#161718] border-l border-[#2B2D30] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#2A2C2E] pb-4">
                <h2 className="text-base font-semibold text-[#ECECE7]">
                  Time mix detail
                </h2>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-[#8E9296] hover:text-[#ECECE7] hover:bg-[#202122] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Donut Chart & Legend Row */}
              <div className="flex items-center gap-5 bg-[#1C1D1F] p-4 rounded-[10px] border border-[#2A2C2E]">
                {/* SVG Donut Chart */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path
                      className="text-[#2A2C2E]"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segments */}
                    {(() => {
                      let accumulated = 0;
                      return activeCategories.map((cat) => {
                        const dash = cat.percent;
                        const offset = 100 - accumulated;
                        accumulated += dash;
                        return (
                          <circle
                            key={cat.category}
                            cx="18"
                            cy="18"
                            r="15.9155"
                            fill="none"
                            stroke={cat.color}
                            strokeWidth="4"
                            strokeDasharray={`${dash} ${100 - dash}`}
                            strokeDashoffset={`${offset}`}
                            className="transition-all duration-500"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-semibold text-[#ECECE7] leading-tight">
                      {formatDurationSeconds(totalTrackedSeconds)}
                    </span>
                    <span className="text-[9px] text-[#8E9296] leading-none mt-0.5">
                      Total tracked
                    </span>
                  </div>
                </div>

                {/* Legend Breakdown */}
                <div className="flex-1 flex flex-col gap-1.5 text-xs">
                  {categories.map((cat) => {
                    const isSelected = cat.category === selectedCategoryKey;
                    return (
                      <div
                        key={cat.category}
                        onClick={() => setSelectedCategoryKey(cat.category)}
                        className={`flex items-center justify-between p-1.5 rounded-[6px] cursor-pointer transition-colors ${
                          isSelected ? "bg-[#2A2C2E] text-[#ECECE7]" : "text-[#8E9296] hover:bg-[#202122] hover:text-[#ECECE7]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium text-xs">{cat.label}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span>{formatDurationSeconds(cat.seconds)}</span>
                          <span className="text-[#8E9296] w-7 text-right">{cat.percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Detail Section */}
              {selectedCategoryObj && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-semibold text-[#ECECE7]">
                      {selectedCategoryObj.label}
                    </h3>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-[#ECECE7] font-semibold">{formatDurationSeconds(selectedCategoryObj.seconds)}</span>
                      <span className="text-[#8E9296]">{selectedCategoryObj.percent}%</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#8E9296] leading-relaxed">
                    {selectedCategoryObj.category === "sink"
                      ? "Time in entertainment and other potentially distracting apps."
                      : selectedCategoryObj.category === "work"
                      ? "Time in designated focus and productivity tools."
                      : "Activity categorised under this classification."}
                  </p>

                  {/* Show matching activity Button */}
                  {onShowMatchingActivity && (
                    <button
                      onClick={() => {
                        setIsSheetOpen(false);
                        onShowMatchingActivity(selectedCategoryObj.category);
                      }}
                      className="w-full py-2.5 rounded-[8px] bg-[#DDB66D] text-[#121314] hover:bg-[#E5C27C] text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Show matching activity</span>
                    </button>
                  )}

                  {/* Apps in this category list */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-[#2A2C2E]">
                    <span className="text-xs font-medium text-[#ECECE7]">
                      Apps in this category
                    </span>

                    <div className="flex flex-col gap-1.5">
                      {(sampleAppsByCategory[selectedCategoryObj.category] || [
                        { name: selectedCategoryObj.label, time: formatDurationSeconds(selectedCategoryObj.seconds) },
                      ]).map((app) => (
                        <div
                          key={app.name}
                          className="flex items-center justify-between p-2 rounded-[6px] bg-[#1C1D1F] border border-[#2A2C2E] text-xs"
                        >
                          <span className="text-[#ECECE7] font-medium">{app.name}</span>
                          <span className="text-[#8E9296] font-mono">{app.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#2A2C2E] flex items-center justify-between text-[11px] text-[#6E737A]">
              <span>Illustrative data</span>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="text-[#8E9296] hover:text-[#ECECE7]"
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

