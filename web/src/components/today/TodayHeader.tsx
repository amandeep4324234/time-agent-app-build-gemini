"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Share2, Info } from "lucide-react";
import { DateTime } from "luxon";

interface TodayHeaderProps {
  selectedDay: string;
  latestDay: string;
  availableDays: string[];
  timezone?: string;
  onSelectDay: (day: string) => void;
  onBackToToday: () => void;
}

export function TodayHeader({
  selectedDay,
  latestDay,
  availableDays,
  timezone = "Asia/Kolkata",
  onSelectDay,
  onBackToToday,
}: TodayHeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isToday = selectedDay === latestDay;
  const currentIndex = availableDays.indexOf(selectedDay);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < availableDays.length - 1;

  const dt = DateTime.fromISO(selectedDay, { zone: timezone });
  const weekdayStr = dt.toFormat("cccc");
  const fullDateStr = dt.toFormat("LLLL d, yyyy");

  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#303B49]">
      {/* Left: Date details & Timezone (§6.1) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-[28px] font-semibold text-[#EDF1F5] tracking-tight leading-tight">
            {isToday ? "Today" : dt.toFormat("LLL d, yyyy")}
          </h1>
          {!isToday && (
            <button
              type="button"
              onClick={onBackToToday}
              className="text-xs px-2.5 py-1 rounded-[6px] bg-[#1D2530] text-[#B0BBC9] hover:text-[#EDF1F5] hover:bg-[#202A36] transition-colors border border-[#303B49]"
            >
              Back to today
            </button>
          )}
        </div>
        <div className="text-xs text-[#94A1B2] flex items-center gap-2">
          <span>{weekdayStr}, {fullDateStr}</span>
          <span>·</span>
          <span>{timezone}</span>
        </div>
      </div>

      {/* Right: Steppers, Picker & Secondary Actions */}
      <div className="flex items-center gap-2 self-start md:self-auto">
        {/* Previous Day */}
        <button
          type="button"
          onClick={() => hasPrev && onSelectDay(availableDays[currentIndex - 1])}
          disabled={!hasPrev}
          aria-label="Previous day"
          className={`p-2 rounded-[6px] border border-[#303B49] transition-colors ${
            hasPrev
              ? "bg-[#141A22] text-[#EDF1F5] hover:bg-[#1D2530]"
              : "bg-[#141A22]/50 text-[#627086] border-[#303B49]/40 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Date Selector Popover/Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-3 py-2 rounded-[6px] border border-[#303B49] bg-[#141A22] text-xs font-medium text-[#EDF1F5] hover:bg-[#1D2530] transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#94A1B2]" />
            <span>Select day</span>
          </button>

          {showDatePicker && (
            <div className="absolute right-0 top-full mt-2 w-48 p-2 rounded-[10px] bg-[#141A22] border border-[#303B49] shadow-xl z-50 flex flex-col gap-1 max-h-60 overflow-y-auto">
              {availableDays.slice().reverse().map((day) => {
                const dayDt = DateTime.fromISO(day);
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      onSelectDay(day);
                      setShowDatePicker(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
                      isSelected
                        ? "bg-[#E4B45F]/20 text-[#E4B45F] font-semibold"
                        : "text-[#B0BBC9] hover:bg-[#1D2530] hover:text-[#EDF1F5]"
                    }`}
                  >
                    {day === latestDay ? `Today (${dayDt.toFormat("LLL d")})` : dayDt.toFormat("cccc, LLL d")}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Next Day (disabled for future days, §6.1) */}
        <button
          type="button"
          onClick={() => hasNext && onSelectDay(availableDays[currentIndex + 1])}
          disabled={!hasNext}
          aria-label={hasNext ? "Next day" : "Future days are unavailable"}
          aria-disabled={!hasNext}
          title={!hasNext ? "Cannot navigate to future days" : undefined}
          className={`p-2 rounded-[6px] border border-[#303B49] transition-colors ${
            hasNext
              ? "bg-[#141A22] text-[#EDF1F5] hover:bg-[#1D2530]"
              : "bg-[#141A22]/50 text-[#627086] border-[#303B49]/40 cursor-not-allowed"
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Share Week link */}
        <Link
          href="/week"
          className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#303B49] bg-[#141A22] text-xs font-medium text-[#B0BBC9] hover:text-[#EDF1F5] hover:bg-[#1D2530] transition-colors ml-1"
        >
          <Share2 className="w-3.5 h-3.5 text-[#94A1B2]" />
          <span className="hidden sm:inline">Share week</span>
        </Link>
      </div>
    </header>
  );
}
