"use client";

import React, { useState } from "react";
import { X, Clock, BarChart2, ListFilter, ExternalLink, ShieldAlert, Sparkles, Check } from "lucide-react";
import { AppLensData, getAppInitials } from "@/lib/app-lens";
import { Category } from "@/lib/types";

interface AppLensSheetProps {
  data: AppLensData | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInTimeline?: () => void;
  onReviewCategory?: (appLabel: string, currentCat: Category) => void;
  onExcludeActivity?: (appLabel: string) => void;
  onOpenLogsPrefiltered?: (appKey: string) => void;
}

export function AppLensSheet({
  data,
  isOpen,
  onClose,
  onViewInTimeline,
  onReviewCategory,
  onExcludeActivity,
  onOpenLogsPrefiltered,
}: AppLensSheetProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "patterns" | "sessions">("summary");
  const [timeWindow, setTimeWindow] = useState<"today" | "7d" | "14d" | "28d">("today");

  if (!isOpen || !data) return null;

  const initials = getAppInitials(data.friendlyName);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex justify-end transition-opacity select-text"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[480px] h-full bg-[#141A25] border-l border-[#2B374B] shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#2B374B] bg-[#0E121B] flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* App Icon Well */}
              <div className="w-12 h-12 rounded-[12px] bg-[#1A2230] border border-[#2B374B] flex items-center justify-center text-sm font-bold text-[#F2F5FB] shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F2F5FB] leading-tight">
                  {data.friendlyName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-[#96A5BD]">
                  <span className="font-mono">{data.rawLabel}</span>
                  <span>&bull;</span>
                  <span className="capitalize text-[#AAA9FF]">{data.category}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-[#96A5BD] hover:text-[#F2F5FB] hover:bg-[#1F2939] transition-colors"
              aria-label="Close App lens"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Time Window Selector (Today / 7D / 14D / 28D) */}
          <div className="flex items-center justify-between">
            <div className="flex bg-[#141A25] p-0.5 rounded-[8px] border border-[#2B374B] text-xs">
              {(["today", "7d", "14d", "28d"] as const).map((win) => (
                <button
                  key={win}
                  onClick={() => setTimeWindow(win)}
                  className={`px-3 py-1 rounded-[6px] capitalize transition-colors font-medium ${
                    timeWindow === win
                      ? "bg-[#AAA9FF] text-[#0B0E14] font-semibold"
                      : "text-[#B8C4D8] hover:text-[#F2F5FB]"
                  }`}
                >
                  {win === "today" ? "Today" : win.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Scope disclosure */}
            <span className="text-[11px] text-[#96A5BD]">Single-device & cross-device</span>
          </div>

          {/* Navigation Tabs (Summary / Patterns / Sessions) */}
          <div className="flex border-b border-[#2B374B] -mb-5 mt-1">
            {(["summary", "patterns", "sessions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-semibold capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[#AAA9FF] text-[#F2F5FB]"
                    : "border-transparent text-[#96A5BD] hover:text-[#B8C4D8]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="flex flex-col gap-5">
              {/* Four Stat Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-[10px] bg-[#1A2230] border border-[#2B374B]">
                  <span className="text-[11px] uppercase font-semibold text-[#96A5BD]">
                    Total Time
                  </span>
                  <div className="text-xl font-mono font-medium text-[#F2F5FB] mt-1">
                    {data.totalDurationFormatted}
                  </div>
                </div>

                <div className="p-3 rounded-[10px] bg-[#1A2230] border border-[#2B374B]">
                  <span className="text-[11px] uppercase font-semibold text-[#96A5BD]">
                    Sessions Count
                  </span>
                  <div className="text-xl font-mono font-medium text-[#F2F5FB] mt-1">
                    {data.sessionCount}
                  </div>
                </div>

                <div className="p-3 rounded-[10px] bg-[#1A2230] border border-[#2B374B]">
                  <span className="text-[11px] uppercase font-semibold text-[#96A5BD]">
                    Median Visit
                  </span>
                  <div className="text-xl font-mono font-medium text-[#F2F5FB] mt-1">
                    {data.medianSessionFormatted}
                  </div>
                </div>

                <div className="p-3 rounded-[10px] bg-[#1A2230] border border-[#2B374B]">
                  <span className="text-[11px] uppercase font-semibold text-[#96A5BD]">
                    Longest Visit
                  </span>
                  <div className="text-xl font-mono font-medium text-[#F2F5FB] mt-1">
                    {data.longestSessionFormatted}
                  </div>
                </div>
              </div>

              {/* Session Length Histogram (§3.6) */}
              <div className="p-4 rounded-[12px] bg-[#1A2230] border border-[#2B374B] flex flex-col gap-3">
                <span className="text-xs font-semibold text-[#F2F5FB]">
                  Session Length Distribution
                </span>
                <div className="flex flex-col gap-2.5">
                  {data.histogram.map((bin) => (
                    <div key={bin.label} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-[#B8C4D8]">
                        <span>{bin.label}</span>
                        <span className="font-mono text-[#96A5BD]">
                          {bin.count} visits ({bin.percent}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#0B0E14] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#AAA9FF]"
                          style={{ width: `${bin.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons (§3.6) */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    onViewInTimeline?.();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-[8px] bg-[#1F2939] hover:bg-[#2B374B] text-xs font-semibold text-[#F2F5FB] border border-[#2B374B] transition-colors text-center"
                >
                  View in timeline
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onReviewCategory?.(data.rawLabel, data.category);
                      onClose();
                    }}
                    className="py-2 px-3 rounded-[8px] bg-[#1A2230] hover:bg-[#1F2939] text-xs text-[#B8C4D8] hover:text-[#F2F5FB] border border-[#2B374B] transition-colors text-center"
                  >
                    Change category
                  </button>
                  <button
                    onClick={() => {
                      onExcludeActivity?.(data.rawLabel);
                      onClose();
                    }}
                    className="py-2 px-3 rounded-[8px] bg-[#1A2230] hover:bg-[#EE9DAA]/10 text-xs text-[#EE9DAA] border border-[#2B374B] transition-colors text-center"
                  >
                    Exclude from analysis
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PATTERNS */}
          {activeTab === "patterns" && (
            <div className="flex flex-col gap-4">
              <span className="text-xs font-semibold text-[#96A5BD] uppercase tracking-wider">
                Nerdy Behavioral Insights (§3.6)
              </span>

              {data.patterns.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-[12px] bg-[#1A2230] border border-[#2B374B] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#AAA9FF] px-2 py-0.5 rounded-[4px] bg-[#AAA9FF]/10">
                      {p.metricValue}
                    </span>
                    {p.eligible && (
                      <span className="text-[10px] text-[#90D2BC] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Valid sample ({p.sampleCount})
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-[#F2F5FB] leading-snug">
                    {p.headline}
                  </h4>
                  <p className="text-xs text-[#B8C4D8] leading-relaxed">
                    {p.detail}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SESSIONS */}
          {activeTab === "sessions" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#96A5BD]">
                  Recent Activity Sessions
                </span>
                <button
                  onClick={() => {
                    onOpenLogsPrefiltered?.(data.key);
                    onClose();
                  }}
                  className="text-xs text-[#AAA9FF] hover:underline flex items-center gap-1"
                >
                  <span>Open in Logs</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {data.recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-[8px] bg-[#1A2230] border border-[#2B374B] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#F2F5FB] font-medium">{s.startedAtFormatted}</span>
                      <span className="text-[10px] text-[#96A5BD] uppercase font-mono px-1 rounded bg-[#0B0E14]">
                        {s.device}
                      </span>
                      {s.isExcluded && (
                        <span className="text-[10px] text-[#EE9DAA] bg-[#EE9DAA]/10 px-1 rounded">
                          Excluded
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[#AAA9FF]">{s.durationFormatted}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2B374B] bg-[#0E121B] flex justify-between items-center text-xs text-[#96A5BD]">
          <span>App lens inspection</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[6px] bg-[#1A2230] hover:bg-[#1F2939] text-[#F2F5FB] border border-[#2B374B]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
