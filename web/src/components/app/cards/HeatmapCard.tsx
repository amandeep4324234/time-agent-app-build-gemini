import React from "react";

export interface HeatmapDay {
  date: string;
  hours: number[];
}

interface HeatmapCardProps {
  days: HeatmapDay[];
}

export function HeatmapCard({ days }: HeatmapCardProps) {
  const hoursLabels = ["00", "04", "08", "12", "16", "20"];

  const getCellColor = (minutes: number) => {
    if (minutes === -1) {
      return "border border-dashed border-[#333D52] bg-transparent";
    }
    if (minutes === 0) return "bg-[#1E2538]/40";
    if (minutes <= 15) return "bg-[#075985]/50";
    if (minutes <= 30) return "bg-[#0284C7]/70";
    if (minutes <= 45) return "bg-[#38BDF8]";
    return "bg-[#22D3EE]";
  };

  return (
    <div className="p-6 rounded-lg border border-[#222735] bg-[#12151D] flex flex-col gap-5 overflow-x-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#F8FAFC]">When tracked time happened</h2>
      </div>

      <div className="min-w-[500px]">
        {/* Hour Header */}
        <div className="flex text-[10px] font-mono text-[#64748B] mb-2 pl-12">
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="flex-1 text-center">
              {h % 4 === 0 ? h.toString().padStart(2, "0") : ""}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex flex-col gap-1.5">
          {days.map((day) => (
            <div key={day.date} className="flex items-center gap-2">
              <span className="w-10 text-[11px] font-mono text-[#94A3B8]">
                {day.date.slice(5)}
              </span>
              <div className="flex-1 grid grid-cols-24 gap-1">
                {day.hours.map((minutes, h) => (
                  <div
                    key={h}
                    title={`${day.date} ${h}:00 - ${minutes === -1 ? "no data" : `${minutes}m`}`}
                    className={`h-4 rounded-sm ${getCellColor(minutes)}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-3 text-[11px] font-mono text-[#64748B] mt-5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-dashed border-[#333D52]" />
            <span>no data</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#1E2538]/40" />
            <span>0m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#075985]/50" />
            <span>1-15m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#0284C7]/70" />
            <span>16-30m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#38BDF8]" />
            <span>31-45m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#22D3EE]" />
            <span>46-60m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
