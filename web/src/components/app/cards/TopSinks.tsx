import React from "react";
import { TopSinkItem } from "@/lib/types";

interface TopSinksProps {
  sinks: TopSinkItem[];
}

export function TopSinks({ sinks }: TopSinksProps) {
  return (
    <div className="p-6 rounded-lg border border-[#222735] bg-[#12151D] flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-[#F8FAFC]">Top sinks</h2>

      {sinks.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-[#64748B]">
          No killer-set time tracked
        </div>
      ) : (
        <div className="divide-y divide-[#222735]">
          {sinks.map((item, index) => {
            const wholeHours = Math.floor(item.unionHours);
            const minutes = Math.round((item.unionHours - wholeHours) * 60);
            const formatted = `${wholeHours}h ${minutes.toString().padStart(2, "0")}m`;

            return (
              <div
                key={item.label + index}
                className="py-3 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#64748B] w-4">{index + 1}</span>
                  <span className="text-[#F8FAFC] font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-4 text-[#94A3B8]">
                  <span>{item.visitCount} visits</span>
                  <span>{item.medianMinutes}m median</span>
                  <span className="text-[#F8FAFC] font-bold w-16 text-right">
                    {formatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
