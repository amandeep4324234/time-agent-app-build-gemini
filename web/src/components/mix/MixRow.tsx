"use client";

import React, { useState } from "react";
import { MixDistribution } from "@/lib/types";
import { formatHoursDuration } from "@/lib/format";

interface MixRowProps {
  mix: MixDistribution;
  isLightDay?: boolean;
  isNoData?: boolean;
  onSinkRowClick?: () => void;
}

export function MixRow({
  mix,
  isLightDay = false,
  isNoData = false,
  onSinkRowClick,
}: MixRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Shares in locked order: work, sink, games, other, unclassified
  const shares = mix.shares;
  const totalHours = mix.totalHours;

  const categories = [
    {
      key: "work",
      label: "work",
      pct: Math.round(shares.workPercent),
      hours: (shares.workPercent / 100) * totalHours,
      color: "#D29922", // amber
    },
    {
      key: "sink",
      label: "sink",
      pct: Math.round(shares.sinkPercent),
      hours: (shares.sinkPercent / 100) * totalHours,
      color: "#F85149", // red
    },
    {
      key: "games",
      label: "games",
      pct: Math.round(shares.gamesPercent),
      hours: (shares.gamesPercent / 100) * totalHours,
      color: "#8B949E", // fg-secondary
    },
    {
      key: "other",
      label: "other",
      pct: Math.round(shares.otherPercent),
      hours: (shares.otherPercent / 100) * totalHours,
      color: "#6E7681", // fg-muted
    },
    {
      key: "unc",
      label: "unc",
      pct: Math.round(shares.unclassifiedPercent),
      hours: (shares.unclassifiedPercent / 100) * totalHours,
      color: "#484F58", // fg-faint
    },
  ];

  // SVG Geometry: 36dp outer, 8px stroke max, no gaps
  const size = 36;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col gap-2 font-mono">
      {/* 40dp mix row */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-10 px-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#161B22]/50 rounded-[4px] transition-colors duration-120"
        title="Click to toggle expanded category legend"
      >
        <div className="flex items-center gap-3 overflow-x-auto text-xs tnum">
          {/* 36dp MixRing */}
          <div className="relative w-9 h-9 flex-shrink-0">
            {isNoData ? (
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#21262D"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
              </svg>
            ) : totalHours === 0 ? (
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#161B22"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
              </svg>
            ) : (
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90 transition-all duration-200"
              >
                {/* Background track */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#161B22"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {categories.map((cat) => {
                  if (cat.pct <= 0) return null;
                  const dash = (cat.pct / 100) * circumference;
                  const offset = cumulativeOffset;
                  cumulativeOffset += dash;

                  return (
                    <circle
                      key={cat.key}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={cat.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offset}
                      fill="none"
                    />
                  );
                })}
              </svg>
            )}
          </div>

          {/* Inline Summary */}
          <div className="flex items-center gap-2 text-xs text-[#E6EDF3] whitespace-nowrap">
            <span className="font-semibold text-[#E6EDF3]">
              {isNoData ? "no data" : totalHours === 0 ? "0m" : formatHoursDuration(totalHours)}
            </span>
            <span className="text-[#6E7681]">|</span>
            {categories.map((cat, idx) => (
              <React.Fragment key={cat.key}>
                <span className="flex items-center gap-1">
                  <span className="text-[#8B949E]">{cat.label}</span>
                  <span className="text-[#E6EDF3]">{cat.pct}%</span>
                </span>
                {idx < categories.length - 1 && (
                  <span className="text-[#6E7681]">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-[#6E7681] hover:text-[#8B949E] flex-shrink-0">
          {isExpanded ? "[collapse]" : "[expand]"}
        </div>
      </div>

      {/* Expanded 8px horizontal bar + category breakdown rows (200ms transition) */}
      {isExpanded && (
        <div className="flex flex-col gap-3 p-3 bg-[#161B22] border border-[#21262D] rounded-[4px] animate-in fade-in duration-200">
          {/* 8px horizontal stacked bar */}
          <div className="h-2 w-full bg-[#21262D] rounded-[2px] overflow-hidden flex">
            {categories.map((cat) => (
              <div
                key={cat.key}
                style={{
                  width: `${cat.pct}%`,
                  backgroundColor: cat.color,
                }}
                className="h-full transition-all duration-200"
                title={`${cat.label}: ${cat.pct}% (${formatHoursDuration(cat.hours)})`}
              />
            ))}
          </div>

          {/* Category rows (hours + %) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs tnum pt-1">
            {categories.map((cat) => {
              const isSink = cat.key === "sink";
              return (
                <div
                  key={cat.key}
                  onClick={() => {
                    if (isSink && onSinkRowClick) onSinkRowClick();
                  }}
                  className={`flex flex-col gap-0.5 p-2 rounded-[2px] border border-[#21262D] bg-[#0D1117] ${
                    isSink ? "cursor-pointer hover:border-[#F85149]" : ""
                  } transition-colors duration-120`}
                >
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#8B949E]">
                    <span>{cat.label}</span>
                    <span
                      className="w-2 h-2 rounded-[1px]"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                  <div className="text-sm font-semibold text-[#E6EDF3]">
                    {formatHoursDuration(cat.hours)}
                  </div>
                  <div className="text-[10px] text-[#6E7681]">
                    {cat.pct}% of tracked
                  </div>
                  {isSink && onSinkRowClick && (
                    <div className="text-[9px] text-[#F85149] pt-1">
                      tap to locate sink →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
