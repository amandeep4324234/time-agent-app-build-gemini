import React from "react";

interface SourceHoursProps {
  phoneHours: number | null;
  computerHours: number | null;
  phoneDark?: boolean;
  phoneOffSince?: string | null;
  computerDark?: boolean;
  computerOffSince?: string | null;
  phoneLastWriteAge?: string | null;
  computerLastWriteAge?: string | null;
}

export function SourceHours({
  phoneHours,
  computerHours,
  phoneDark,
  phoneOffSince,
  computerDark,
  computerOffSince,
  phoneLastWriteAge,
  computerLastWriteAge,
}: SourceHoursProps) {
  const maxHours = Math.max(phoneHours || 0, computerHours || 0, 1);

  const formatHours = (h: number) => {
    const whole = Math.floor(h);
    const min = Math.round((h - whole) * 60);
    return `${whole}h ${min.toString().padStart(2, "0")}m`;
  };

  return (
    <div className="p-6 rounded-lg border border-[#222735] bg-[#12151D] flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#F8FAFC]">Hours by source</h2>
      </div>

      {/* C3 Tracker-off banner */}
      {phoneDark && phoneOffSince && (
        <div className="p-3 rounded bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-xs text-[#F43F5E] font-mono">
          Phone tracker off since {phoneOffSince}
        </div>
      )}
      {computerDark && computerOffSince && (
        <div className="p-3 rounded bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-xs text-[#F43F5E] font-mono">
          Computer tracker off since {computerOffSince}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Phone Row */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#94A3B8]">phone</span>
            {phoneHours !== null ? (
              <span className="text-[#F8FAFC] font-semibold">{formatHours(phoneHours)}</span>
            ) : (
              <span className="text-[#64748B]">off</span>
            )}
          </div>
          {phoneHours !== null && (
            <div className="h-1 w-full bg-[#1E2538] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#38BDF8] rounded-full"
                style={{ width: `${Math.min(100, (phoneHours / maxHours) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Computer Row */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#94A3B8]">computer</span>
            {computerHours !== null ? (
              <span className="text-[#F8FAFC] font-semibold">{formatHours(computerHours)}</span>
            ) : (
              <span className="text-[#64748B]">off</span>
            )}
          </div>
          {computerHours !== null && (
            <div className="h-1 w-full bg-[#1E2538] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#38BDF8] rounded-full"
                style={{ width: `${Math.min(100, (computerHours / maxHours) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Last write line */}
      <div className="text-[11px] font-mono text-[#64748B] pt-1">
        last write: phone {phoneLastWriteAge || "never"} · computer {computerLastWriteAge || "never"}
      </div>
    </div>
  );
}
