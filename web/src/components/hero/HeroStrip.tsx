"use client";

import React, { useState } from "react";
import { formatHoursDuration } from "@/lib/format";

interface HeroStripProps {
  dayTitle: string; // e.g. "TODAY" or "TUE AUG 26"
  isToday: boolean;
  rankText?: string; // e.g. "2nd best of 7"
  focusHours: number;
  sinkHours: number;
  deepBlocksCount: number;
  longestMinutes: number;
  totalTrackedHours: number;
  isLightDay?: boolean;
  phoneDark?: boolean;
  phoneOffSince?: string | null;
  computerDark?: boolean;
  computerOffSince?: string | null;
  isGhostActive?: boolean;
  isPro?: boolean;
  onToggleGhost?: () => void;
}

export function HeroStrip({
  dayTitle,
  isToday,
  rankText,
  focusHours,
  sinkHours,
  deepBlocksCount,
  longestMinutes,
  totalTrackedHours,
  isLightDay = false,
  phoneDark = false,
  phoneOffSince,
  computerDark = false,
  computerOffSince,
  isGhostActive = false,
  onToggleGhost,
  isPro = false,
}: HeroStripProps) {
  const [showProGhostNotice, setShowProGhostNotice] = useState(false);

  const handleGhostClick = () => {
    if (!isPro) {
      setShowProGhostNotice(true);
      setTimeout(() => setShowProGhostNotice(false), 2500);
      return;
    }
    if (onToggleGhost) onToggleGhost();
  };

  // Format durations
  const mainHoursFormatted = formatHoursDuration(totalTrackedHours > 0 ? totalTrackedHours : focusHours);
  const focusFormatted = `${focusHours.toFixed(1)}h`;
  const sinkFormatted = `${sinkHours.toFixed(1)}h`;
  const bestRunFormatted = `${longestMinutes}m`;

  return (
    <div className="flex flex-col justify-between py-2 min-h-[96px] font-mono border-b border-[#21262D]">
      {/* Line 1: Header + Hero Numeral 44/600 tnum */}
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#8B949E]">
            {dayTitle}
          </div>
          {!isToday && rankText && (
            <div className="text-[10px] text-[#6E7681] mt-0.5">
              {rankText}
            </div>
          )}
        </div>

        <div className="text-[44px] leading-none font-semibold text-[#E6EDF3] tnum tracking-tight">
          {mainHoursFormatted}
        </div>
      </div>

      {/* Line 2: Hero Secondary 20/500 tnum + [ghost] control */}
      <div className="flex items-center justify-between gap-4 mt-2 flex-wrap text-sm">
        <div className="flex items-center gap-3 md:gap-4 text-[13px] md:text-base text-[#8B949E] tnum flex-wrap">
          <span>
            focus <span className="text-[#D29922] font-medium">{focusFormatted}</span>
          </span>
          <span>
            sink <span className="text-[#F85149] font-medium">{sinkFormatted}</span>
          </span>
          <span>
            <span className="text-[#E6EDF3] font-medium">{deepBlocksCount}</span> deep
          </span>
          <span>
            best <span className="text-[#E6EDF3] font-medium">{bestRunFormatted}</span>
          </span>
        </div>

        {/* [ghost] control button */}
        <div className="relative">
          <button
            type="button"
            onClick={handleGhostClick}
            className={`px-2 py-0.5 text-xs rounded-[2px] border transition-colors duration-120 ${
              isGhostActive
                ? "border-[#D29922] text-[#D29922] bg-[#D29922]/10"
                : "border-[#21262D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#8B949E]/40"
            }`}
          >
            [ghost]
          </button>

          {showProGhostNotice && (
            <div className="absolute right-0 top-full mt-1 z-20 px-2 py-1 bg-[#1C2128] border border-[#21262D] text-[11px] text-[#8B949E] rounded-[2px] whitespace-nowrap shadow-md">
              compare is Pro
            </div>
          )}
        </div>
      </div>

      {/* Line 3: Tracker-off banner OR light-day badge */}
      {(phoneDark || computerDark || isLightDay) && (
        <div className="mt-2 pt-1 border-t border-[#21262D]/60 flex items-center gap-2 text-[11px] text-[#6E7681]">
          {phoneDark && (
            <span className="text-[#8B949E]">
              phone tracker off since {phoneOffSince || "prior write"}
            </span>
          )}
          {computerDark && (
            <span className="text-[#8B949E]">
              computer tracker off since {computerOffSince || "prior write"}
            </span>
          )}
          {isLightDay && (
            <span className="text-[#8B949E]">
              light day: not comparable
            </span>
          )}
        </div>
      )}
    </div>
  );
}
