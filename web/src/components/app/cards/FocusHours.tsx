import React from "react";
import { Badge } from "@/components/ui/badge";

interface FocusHoursProps {
  hours: number;
  isLightDay?: boolean;
  deltaText?: string;
}

export function FocusHours({ hours, isLightDay, deltaText }: FocusHoursProps) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  const formatted = `${wholeHours}h ${minutes.toString().padStart(2, "0")}m`;

  return (
    <div className="h-[168px] p-5 rounded-lg border border-[#222735] bg-[#12151D] flex flex-col justify-between">
      <div className="text-[11px] font-mono uppercase tracking-wider text-[#64748B]">
        Focus-set time
      </div>
      <div className="text-3xl font-mono font-bold tracking-tight text-[#F8FAFC]">
        {formatted}
      </div>
      <div>
        {isLightDay ? (
          <Badge>light day — not comparable</Badge>
        ) : deltaText ? (
          <div className="text-xs text-[#94A3B8] font-mono">{deltaText}</div>
        ) : (
          <div className="text-xs text-[#64748B] font-mono">active window</div>
        )}
      </div>
    </div>
  );
}
