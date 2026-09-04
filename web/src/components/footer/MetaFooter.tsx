"use client";

import React from "react";
import Link from "next/link";

interface MetaFooterProps {
  isToday: boolean;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onBackToToday?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function MetaFooter({
  isToday,
  onPrevDay,
  onNextDay,
  onBackToToday,
  hasPrev = true,
  hasNext = true,
}: MetaFooterProps) {
  return (
    <div className="py-3 border-t border-[#21262D] flex items-center justify-between font-mono text-[11px] text-[#6E7681]">
      {isToday ? (
        <div className="w-full flex items-center justify-between">
          <span>free: 7-day history - Pro: full history, compare, goals</span>
          <Link href="/checkout" className="text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
            view Pro →
          </Link>
        </div>
      ) : (
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={onPrevDay}
            disabled={!hasPrev}
            className="hover:text-[#E6EDF3] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            ← prev day
          </button>

          <button
            type="button"
            onClick={onBackToToday}
            className="text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
          >
            back to today
          </button>

          <button
            type="button"
            onClick={onNextDay}
            disabled={!hasNext}
            className="hover:text-[#E6EDF3] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            next day →
          </button>
        </div>
      )}
    </div>
  );
}
