"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, TrendingUp, PieChart, Sparkles, ChevronRight } from "lucide-react";
import { SafeEffectiveDayResult } from "@/lib/effective-adapter";
import { formatDurationSeconds } from "@/lib/format";

interface WorkspaceTabsProps {
  dayResult: SafeEffectiveDayResult;
}

type TabMode = "rhythm" | "mix" | "patterns";

export function WorkspaceTabs({ dayResult }: WorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState<TabMode | null>(null);
  const [rhythmWindow, setRhythmWindow] = useState<"7d" | "14d" | "28d">("7d");

  const { categories, metrics } = dayResult;
  const totalTrackedFormatted = formatDurationSeconds(metrics.unionTrackedSeconds);

  return (
    <div className="flex flex-col gap-3">
      {/* Workspace Tab Bar */}
      <div className="flex items-center justify-between border-b border-[#2B374B] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#96A5BD]">
            Workspace Detail:
          </span>
          <div className="flex items-center bg-[#141A25] rounded-[8px] p-0.5 border border-[#2B374B]">
            <button
              onClick={() => setActiveTab(activeTab === "rhythm" ? null : "rhythm")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium transition-colors ${
                activeTab === "rhythm"
                  ? "bg-[#AAA9FF] text-[#0B0E14] font-semibold"
                  : "text-[#B8C4D8] hover:text-[#F2F5FB]"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Rhythm</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === "mix" ? null : "mix")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium transition-colors ${
                activeTab === "mix"
                  ? "bg-[#AAA9FF] text-[#0B0E14] font-semibold"
                  : "text-[#B8C4D8] hover:text-[#F2F5FB]"
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Time Mix</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === "patterns" ? null : "patterns")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium transition-colors ${
                activeTab === "patterns"
                  ? "bg-[#AAA9FF] text-[#0B0E14] font-semibold"
                  : "text-[#B8C4D8] hover:text-[#F2F5FB]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Patterns</span>
            </button>
          </div>
        </div>

        {activeTab !== null && (
          <button
            onClick={() => setActiveTab(null)}
            className="flex items-center gap-1 text-xs text-[#96A5BD] hover:text-[#F2F5FB] px-2 py-1 rounded hover:bg-[#1A2230] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close detail</span>
          </button>
        )}
      </div>

      {/* Single Active 180–220px Panel (§3.2, §6) */}
      {activeTab !== null && (
        <div className="card-midnight p-4 sm:p-5 bg-[#141A25] border border-[#2B374B] min-h-[190px] flex flex-col justify-between">
          {/* TAB 1: RHYTHM */}
          {activeTab === "rhythm" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#F2F5FB]">Work Rhythm</h4>
                  <p className="text-xs text-[#96A5BD]">
                    Daily Work duration across devices over time
                  </p>
                </div>
                <div className="flex bg-[#0B0E14] p-0.5 rounded-[6px] border border-[#2B374B] text-[11px]">
                  {(["7d", "14d", "28d"] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setRhythmWindow(w)}
                      className={`px-2 py-0.5 rounded uppercase font-mono ${
                        rhythmWindow === w
                          ? "bg-[#AAA9FF] text-[#0B0E14] font-semibold"
                          : "text-[#B8C4D8]"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area / Line Chart with Discrete Points */}
              <div className="h-28 flex items-end gap-2 pt-2 pb-1 border-b border-[#2B374B]">
                {metrics.focus.sparklineDays.map((val, i) => {
                  const maxH = 6;
                  const pct = Math.min(100, Math.max(10, (val / maxH) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] font-mono text-[#96A5BD]">{val.toFixed(1)}h</span>
                      <div
                        className="w-full rounded-t-[4px] bg-[#AAA9FF] transition-all hover:brightness-125"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TIME MIX */}
          {activeTab === "mix" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* 160px Donut with 12px Stroke & Center Total (§6) */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke="#1A2230"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Category Donut Segments */}
                  {categories.map((cat, idx) => {
                    const circumference = 2 * Math.PI * 68;
                    const strokeDasharray = `${(cat.percent / 100) * circumference} ${circumference}`;
                    const offset = categories
                      .slice(0, idx)
                      .reduce((acc, c) => acc + (c.percent / 100) * circumference, 0);

                    return (
                      <circle
                        key={cat.category}
                        cx="80"
                        cy="80"
                        r="68"
                        stroke={cat.color}
                        strokeWidth="12"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={-offset}
                        fill="transparent"
                        className="transition-all"
                      />
                    );
                  })}
                </svg>

                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-[10px] uppercase font-semibold text-[#96A5BD]">
                    Tracked
                  </span>
                  <span className="text-sm font-mono font-bold text-[#F2F5FB]">
                    {totalTrackedFormatted}
                  </span>
                </div>
              </div>

              {/* Exact Legend Beside Donut */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full text-xs">
                {categories.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-2 rounded-[8px] bg-[#1A2230] border border-[#2B374B] flex flex-col"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-[#F2F5FB]">{cat.label}</span>
                    </div>
                    <div className="flex justify-between items-baseline mt-1 font-mono text-[11px]">
                      <span className="text-[#AAA9FF]">{formatDurationSeconds(cat.seconds)}</span>
                      <span className="text-[#96A5BD]">{cat.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PATTERNS */}
          {activeTab === "patterns" && (
            <div className="flex flex-col justify-between gap-3 h-full">
              <div>
                <h4 className="text-sm font-semibold text-[#F2F5FB]">Selected Daily Pattern</h4>
                <p className="text-xs text-[#B8C4D8] mt-1 leading-relaxed">
                  Your longest recorded Work period appeared between 10:00 and 11:00. Intentional focus blocks on this day captured 100% of planned time before sink interruptions.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[#2B374B] pt-2.5">
                <span className="text-[11px] text-[#96A5BD]">
                  Based on 8 eligible blocks &bull; Last 14 days
                </span>
                <Link
                  href="/patterns"
                  className="flex items-center gap-1 text-xs text-[#AAA9FF] hover:underline font-semibold"
                >
                  <span>Open Insights & Analyzer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
