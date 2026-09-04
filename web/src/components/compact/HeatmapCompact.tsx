"use client";

import React, { useState } from "react";
import { Heatmap12WkCell } from "@/lib/heatmap";

interface HeatmapCompactProps {
  grid: Heatmap12WkCell[][]; // 12 columns x 7 rows
  selectedDay: string;
  onSelectDay: (date: string) => void;
}

export function HeatmapCompact({
  grid,
  selectedDay,
  onSelectDay,
}: HeatmapCompactProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Cell style based on intensity level (UI.md §2.3)
  const getCellStyle = (cell: Heatmap12WkCell) => {
    let bg = "bg-transparent";
    let border = "border-transparent";

    switch (cell.intensity) {
      case -1: // no data: transparent with 1px hairline #21262D outline
        bg = "bg-transparent";
        border = "border-[#21262D]";
        break;
      case 0: // tracked-but-zero: #161B22
        bg = "bg-[#161B22]";
        border = "border-[#161B22]";
        break;
      case 1: // L1 < 1h: #3E331A
        bg = "bg-[#3E331A]";
        border = "border-[#3E331A]";
        break;
      case 2: // L2 >= 1h: #6F551D
        bg = "bg-[#6F551D]";
        border = "border-[#6F551D]";
        break;
      case 3: // L3 >= 3h: #A1771F
        bg = "bg-[#A1771F]";
        border = "border-[#A1771F]";
        break;
      case 4: // L4 >= 6h: #D29922 (amber)
        bg = "bg-[#D29922]";
        border = "border-[#D29922]";
        break;
    }

    const isTodayOrSelected = cell.date === selectedDay;
    const outline = isTodayOrSelected ? "ring-1 ring-[#8B949E]" : "";

    return `${bg} border ${border} ${outline}`;
  };

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex flex-col font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[#21262D]">
        <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#8B949E]">
          HEATMAP 12wk
        </div>
        {activeTooltip && (
          <div className="text-[10px] text-[#E6EDF3] truncate max-w-[140px]">
            {activeTooltip}
          </div>
        )}
      </div>

      <div className="pt-2 flex items-start gap-1 overflow-x-auto">
        {/* Weekday labels (Mon..Sun) */}
        <div className="flex flex-col gap-[2px] pr-1 text-[9px] text-[#6E7681]">
          {weekdays.map((d, i) => (
            <div key={i} className="h-[12px] flex items-center justify-center">
              {d}
            </div>
          ))}
        </div>

        {/* 12 Columns of Weeks (oldest left, current right) */}
        <div className="flex gap-[2px]">
          {grid.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[2px]">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  onClick={() => onSelectDay(cell.date)}
                  onPointerEnter={() => setActiveTooltip(cell.tooltip)}
                  onPointerLeave={() => setActiveTooltip(null)}
                  className={`w-[12px] h-[12px] rounded-[2px] cursor-pointer hover:scale-110 transition-transform duration-120 ${getCellStyle(
                    cell
                  )}`}
                  title={cell.tooltip}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
