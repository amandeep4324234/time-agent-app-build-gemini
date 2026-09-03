import React from "react";

interface DeepBlocksProps {
  blocksCount: number;
  longestMinutes: number;
}

export function DeepBlocks({ blocksCount, longestMinutes }: DeepBlocksProps) {
  return (
    <div className="h-[168px] p-5 rounded-lg border border-[#222735] bg-[#12151D] flex flex-col justify-between">
      <div className="text-[11px] font-mono uppercase tracking-wider text-[#64748B]">
        Blocks ≥15 min
      </div>
      <div className="text-3xl font-mono font-bold tracking-tight text-[#F8FAFC]">
        {blocksCount}
      </div>
      <div className="text-xs text-[#94A3B8] font-mono">
        longest {longestMinutes} min
      </div>
    </div>
  );
}
