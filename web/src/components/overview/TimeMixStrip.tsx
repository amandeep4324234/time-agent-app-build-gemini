"use client";

import React, { useState, useMemo } from "react";
import { X, Layers } from "lucide-react";
import { formatDurationSeconds } from "@/lib/format";

export interface TimeMixCategoryItem {
  category: "work" | "sink" | "games" | "other" | "unclassified";
  label: string;
  seconds: number;
  hours: number;
  percent: number;
  color: string;
}

export interface TimeMixAppItem {
  key: string;
  label: string;
  category: string;
  seconds: number;
  hours: number;
  sessionCount?: number;
  isExcluded?: boolean;
}

interface TimeMixStripProps {
  categories: TimeMixCategoryItem[];
  totalTrackedSeconds: number;
  apps?: TimeMixAppItem[];
  onShowMatchingActivity?: (category: string) => void;
  className?: string;
}

export function TimeMixStrip({
  categories,
  totalTrackedSeconds,
  apps = [],
  onShowMatchingActivity,
  className = "",
}: TimeMixStripProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Filter out categories with 0% to keep legend compact
  const activeCategories = categories.filter((c) => c.seconds > 0);

  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("sink");

  const selectedCategoryObj =
    categories.find((c) => c.category === selectedCategoryKey) || categories[1] || categories[0];

  // Derived apps in selected category from truthful data
  const appsInSelectedCategory = useMemo(() => {
    if (!apps || apps.length === 0) return [];
    return apps
      .filter((a) => {
        if (selectedCategoryKey === "other") {
          return a.category === "other" || a.category === "other-known";
        }
        return a.category === selectedCategoryKey;
      })
      .filter((a) => a.seconds > 0)
      .sort((a, b) => b.seconds - a.seconds);
  }, [apps, selectedCategoryKey]);

  return (
    <>
      {/* Slim Composition Strip Row (§2.1, §6, globals.css) */}
      <div
        className={`tf-mix-row select-text ${className}`}
        aria-label="Time mix composition"
      >
        <span
          onClick={() => setIsSheetOpen(true)}
          className="tf-mix-label text-[#C1C5C1] hover:text-[#ECECE7] font-medium shrink-0 cursor-pointer transition-colors"
        >
          Time mix
        </span>

        {/* Segmented bar */}
        <div
          onClick={() => setIsSheetOpen(true)}
          className="tf-mix-bar cursor-pointer"
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

        {/* Inline Legend */}
        <div className="tf-mix-legend flex items-center gap-3 overflow-x-auto shrink-0">
          {activeCategories.map((cat) => (
            <div
              key={cat.category}
              onClick={() => {
                setSelectedCategoryKey(cat.category);
                setIsSheetOpen(true);
              }}
              className="flex items-center gap-1.5 cursor-pointer hover:text-[#ECECE7] text-[#C1C5C1] transition-colors shrink-0 text-[13px]"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-[#ECECE7] font-medium">{cat.label}</span>
              <span className="font-mono text-[#A1A9A5]">
                {cat.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Mix Detail Sheet (§7.1, 480px desktop, off-white button, truthful app listing) */}
      {isSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#141516]/70 backdrop-blur-sm flex justify-end select-text animate-in fade-in duration-200"
          onClick={() => setIsSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Time mix detail"
        >
          <div
            className="w-full max-w-[480px] bg-[#202122] border-l border-[#3A3D3E] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#3A3D3E] pb-4">
                <h2 className="text-[18px] font-semibold text-[#ECECE7]">
                  Time mix detail
                </h2>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#A1A9A5] hover:text-[#ECECE7] hover:bg-[#27292A] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Donut Chart & Legend Row */}
              <div className="flex items-center gap-5 bg-[#171819] p-4 rounded-[10px] border border-[#3A3D3E]">
                {/* SVG Donut Chart */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path
                      className="text-[#27292A]"
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
                    <span className="text-[10px] text-[#A1A9A5] leading-none mt-0.5">
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
                          isSelected
                            ? "bg-[#27292A] text-[#ECECE7]"
                            : "text-[#A1A9A5] hover:bg-[#27292A]/50 hover:text-[#ECECE7]"
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
                          <span className="text-[#A1A9A5] w-7 text-right">{cat.percent}%</span>
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
                    <h3 className="text-[16px] font-semibold text-[#ECECE7]">
                      {selectedCategoryObj.label}
                    </h3>
                    <div className="flex items-center gap-2 font-mono text-[13px]">
                      <span className="text-[#ECECE7] font-semibold">
                        {formatDurationSeconds(selectedCategoryObj.seconds)}
                      </span>
                      <span className="text-[#A1A9A5]">{selectedCategoryObj.percent}%</span>
                    </div>
                  </div>

                  <p className="text-[13px] text-[#A1A9A5] leading-relaxed m-0">
                    {selectedCategoryObj.category === "sink"
                      ? "Time in entertainment and other potentially distracting apps."
                      : selectedCategoryObj.category === "work"
                      ? "Time in designated focus and productivity tools."
                      : "Activity categorised under this classification."}
                  </p>

                  {/* Show matching activity Button (off-white primary) */}
                  {onShowMatchingActivity && (
                    <button
                      onClick={() => {
                        setIsSheetOpen(false);
                        onShowMatchingActivity(selectedCategoryObj.category);
                      }}
                      className="tf-button tf-button-primary w-full min-h-[44px] rounded-[6px] bg-[#ECECE7] text-[#171819] hover:bg-white text-[14px] font-medium flex items-center justify-center gap-2 transition-colors shadow-none"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Show matching activity</span>
                    </button>
                  )}

                  {/* Apps in this category list */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-[#3A3D3E]">
                    <span className="text-[14px] font-medium text-[#ECECE7]">
                      Apps in this category
                    </span>

                    <div className="flex flex-col gap-1.5">
                      {appsInSelectedCategory.length > 0 ? (
                        appsInSelectedCategory.map((app) => (
                          <div
                            key={app.key}
                            className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[13px]"
                          >
                            <span className="text-[#ECECE7] font-medium">{app.label}</span>
                            <span className="text-[#A1A9A5] font-mono">
                              {formatDurationSeconds(app.seconds)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[13px] text-[#A1A9A5] py-2">
                          No tracked activity in this category.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#3A3D3E] flex items-center justify-between text-[12px] text-[#A1A9A5]">
              <span>Effective category distribution</span>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="text-[#A1A9A5] hover:text-[#ECECE7]"
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
