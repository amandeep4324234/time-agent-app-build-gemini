"use client";

import React from "react";
import { InsightLineItem } from "@/lib/insight-lines";

interface InsightLinesProps {
  lines: InsightLineItem[];
  onLineClick?: (item: InsightLineItem) => void;
}

export function InsightLines({ lines, onLineClick }: InsightLinesProps) {
  if (lines.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 py-3 font-mono text-[13px] leading-[1.45] text-[#8B949E] border-y border-[#21262D]">
      {lines.map((line) => {
        const isInteractive = Boolean(line.target && onLineClick);

        return (
          <div
            key={line.id}
            onClick={() => isInteractive && onLineClick && onLineClick(line)}
            className={`flex items-baseline gap-2 ${
              isInteractive
                ? "cursor-pointer hover:text-[#E6EDF3] transition-colors duration-120"
                : ""
            }`}
          >
            <span className="text-[#6E7681] text-xs">·</span>
            <span className="tnum text-[#E6EDF3]">{line.text}</span>
            {isInteractive && (
              <span className="text-[10px] text-[#6E7681] ml-1">
                [view]
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
