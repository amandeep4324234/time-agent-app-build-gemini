"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface MixRingProps {
  shares: {
    workPercent: number;
    sinkPercent: number;
    gamesPercent: number;
    otherPercent: number;
    unclassifiedPercent: number;
  };
  totalHours: number;
  gamesHeavyNotice?: boolean;
  sustainedUnclassifiedNotice?: boolean;
  onBadgeClick?: () => void;
}

export function MixRing({
  shares,
  totalHours,
  gamesHeavyNotice,
  sustainedUnclassifiedNotice,
  onBadgeClick,
}: MixRingProps) {
  const wholeHours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - wholeHours) * 60);
  const formattedTotal = `${wholeHours}h ${minutes.toString().padStart(2, "0")}m`;

  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Compute SVG stroke-dasharray segments
  const segments = [
    { name: "Focus", percent: shares.workPercent, color: "#22D3EE" },
    { name: "Sink", percent: shares.sinkPercent, color: "#F43F5E" },
    { name: "Games", percent: shares.gamesPercent, color: "#A855F7" },
    { name: "Other", percent: shares.otherPercent, color: "#64748B" },
    { name: "Unclassified", percent: shares.unclassifiedPercent, color: "#334155" },
  ].filter((s) => s.percent > 0);

  let cumulativePercent = 0;

  return (
    <div className="p-6 rounded-lg border border-[#222735] bg-[#12151D] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#F8FAFC]">Attention mix</h2>
        {shares.unclassifiedPercent > 0 && (
          <button
            type="button"
            onClick={onBadgeClick}
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] rounded-full"
          >
            <Badge className="hover:border-[#94A3B8] transition-colors">
              {shares.unclassifiedPercent}% unclassified
            </Badge>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
        {/* SVG Ring */}
        <div className="relative w-[200px] h-[200px] flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="#1E2538"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {segments.map((seg) => {
              const strokeDasharray = `${(seg.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += seg.percent;
              return (
                <circle
                  key={seg.name}
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-mono font-bold text-[#F8FAFC]">
              {formattedTotal}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B]">
              tracked
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE]" />
            <span className="text-[#94A3B8]">Focus:</span>
            <span className="text-[#F8FAFC] font-semibold">{shares.workPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
            <span className="text-[#94A3B8]">Sink:</span>
            <span className="text-[#F8FAFC] font-semibold">{shares.sinkPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7]" />
            <span className="text-[#94A3B8]">Games:</span>
            <span className="text-[#F8FAFC] font-semibold">{shares.gamesPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" />
            <span className="text-[#94A3B8]">Other:</span>
            <span className="text-[#F8FAFC] font-semibold">{shares.otherPercent}%</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#334155]" />
            <span className="text-[#94A3B8]">Unclassified:</span>
            <span className="text-[#F8FAFC] font-semibold">{shares.unclassifiedPercent}%</span>
          </div>
        </div>
      </div>

      {gamesHeavyNotice && (
        <div className="text-xs text-[#94A3B8] border-t border-[#222735] pt-3 font-mono">
          Games led non-work time today.
        </div>
      )}

      {sustainedUnclassifiedNotice && (
        <div className="p-3 rounded-md bg-[#1E2538]/50 border border-[#333D52] text-xs text-[#E2E8F0] flex flex-col gap-1">
          <span className="font-semibold text-[#22D3EE]">Notice</span>
          <span>
            Over 15% of your time is unclassified. Pin unknown apps to keep your ledger accurate.
          </span>
        </div>
      )}
    </div>
  );
}
