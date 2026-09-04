"use client";

import React, { useState } from "react";
import { TopSinkItem } from "@/lib/types";
import { formatHoursDuration, maskFencedLabel } from "@/lib/format";

interface TopSinksRowProps {
  sinks: TopSinkItem[];
  sparklineHistory?: Record<string, number[]>; // label -> 7 daily union hours
  onSelectSink?: (label: string) => void;
}

export function TopSinksRow({
  sinks,
  sparklineHistory = {},
  onSelectSink,
}: TopSinksRowProps) {
  const [expandedSparkline, setExpandedSparkline] = useState<string | null>(null);

  const toggleSparkline = (label: string) => {
    setExpandedSparkline(expandedSparkline === label ? null : label);
  };

  return (
    <div className="flex flex-col font-mono text-xs">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#8B949E] pb-2 border-b border-[#21262D]">
        TOP SINKS
      </div>

      {sinks.length === 0 ? (
        <div className="py-3 text-[#6E7681] text-[11px]">
          no sinks tracked
        </div>
      ) : (
        <div className="divide-y divide-[#21262D]">
          {sinks.slice(0, 5).map((sink, index) => {
            const label = maskFencedLabel(sink.label, sink.isPrivate);
            const dur = formatHoursDuration(sink.unionHours);
            const isExpanded = expandedSparkline === sink.label;
            const history = sparklineHistory[sink.label] || [0.2, 0.4, 0.1, 0.8, 0.5, 0.3, sink.unionHours];

            return (
              <div key={sink.label + index} className="py-1.5 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs tnum">
                  <div
                    onClick={() => onSelectSink && onSelectSink(sink.label)}
                    className="flex items-center gap-2 cursor-pointer hover:text-white"
                  >
                    <span className="text-[#6E7681] w-3">{index + 1}</span>
                    <span className="text-[#E6EDF3] font-normal truncate max-w-[120px]">
                      {label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[#F85149] font-medium">{dur}</span>
                    <button
                      type="button"
                      onClick={() => toggleSparkline(sink.label)}
                      className="px-1 py-0.5 text-[10px] text-[#6E7681] hover:text-[#8B949E] border border-[#21262D] rounded-[2px]"
                      title="Toggle 7-day sparkline"
                    >
                      [_]
                    </button>
                  </div>
                </div>

                {/* 7-day sparkline (24dp height, red line #F85149, 120ms expand) */}
                {isExpanded && (
                  <div className="h-6 w-full pt-1 pb-0.5 flex items-end gap-1 animate-in fade-in duration-120">
                    <div className="text-[9px] text-[#6E7681] pr-1">7d:</div>
                    <div className="flex-1 flex items-end gap-1 h-full">
                      {history.map((val, idx) => {
                        const maxVal = Math.max(0.1, ...history);
                        const hPct = Math.max(10, Math.min(100, (val / maxVal) * 100));
                        return (
                          <div
                            key={idx}
                            style={{ height: `${hPct}%` }}
                            className="flex-1 bg-[#F85149] rounded-t-[1px] opacity-80 hover:opacity-100"
                            title={`Day ${idx + 1}: ${formatHoursDuration(val)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
