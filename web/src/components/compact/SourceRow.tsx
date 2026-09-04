"use client";

import React from "react";
import { formatHoursDuration } from "@/lib/format";

interface SourceRowProps {
  phoneHours: number | null;
  computerHours: number | null;
  phoneDark?: boolean;
  phoneOffSince?: string | null;
  computerDark?: boolean;
  computerOffSince?: string | null;
}

export function SourceRow({
  phoneHours,
  computerHours,
  phoneDark = false,
  phoneOffSince,
  computerDark = false,
  computerOffSince,
}: SourceRowProps) {
  const pFormatted = phoneHours !== null ? formatHoursDuration(phoneHours) : "0m";
  const cFormatted = computerHours !== null ? formatHoursDuration(computerHours) : "0m";

  return (
    <div className="flex flex-col font-mono text-xs">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#8B949E] pb-2 border-b border-[#21262D]">
        BY SOURCE
      </div>

      <div className="divide-y divide-[#21262D]">
        <div className="py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#E6EDF3]">phone</span>
            {phoneDark && (
              <span className="text-[10px] text-[#6E7681]">
                (off {phoneOffSince || "prior"})
              </span>
            )}
          </div>
          <span className="text-[#E6EDF3] tnum font-medium">{pFormatted}</span>
        </div>

        <div className="py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#E6EDF3]">computer</span>
            {computerDark && (
              <span className="text-[10px] text-[#6E7681]">
                (off {computerOffSince || "prior"})
              </span>
            )}
          </div>
          <span className="text-[#E6EDF3] tnum font-medium">{cFormatted}</span>
        </div>
      </div>
    </div>
  );
}
