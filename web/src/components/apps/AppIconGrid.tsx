"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowUpDown, Smartphone, Laptop, Sparkles } from "lucide-react";
import { getFriendlyAppName, getAppInitials } from "@/lib/app-lens";
import { formatDurationSeconds } from "@/lib/format";
import { Category } from "@/lib/types";

interface AppItem {
  key: string;
  label: string;
  category: Category;
  seconds: number;
  hours: number;
  sessionCount: number;
  isExcluded: boolean;
  isAdjusted: boolean;
}

interface AppIconGridProps {
  apps: AppItem[];
  onSelectApp: (appKey: string) => void;
  selectedAppKey?: string | null;
}

// Category color badges
const CATEGORY_COLORS: Record<string, string> = {
  work: "var(--focus)",
  sink: "var(--sink)",
  games: "var(--games)",
  "other-known": "var(--other)",
  other: "var(--other)",
  unclassified: "var(--unclassified)",
};

export function AppIconGrid({ apps, onSelectApp, selectedAppKey }: AppIconGridProps) {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<"time" | "name">("time");

  const sortedApps = useMemo(() => {
    const list = [...apps];
    if (sortBy === "name") {
      return list.sort((a, b) => {
        const friendlyA = getFriendlyAppName(a.label);
        const friendlyB = getFriendlyAppName(b.label);
        return friendlyA.localeCompare(friendlyB) || a.key.localeCompare(b.key);
      });
    }
    return list.sort((a, b) => {
      const friendlyA = getFriendlyAppName(a.label);
      const friendlyB = getFriendlyAppName(b.label);
      return (
        b.seconds - a.seconds ||
        friendlyA.localeCompare(friendlyB) ||
        a.key.localeCompare(b.key)
      );
    });
  }, [apps, sortBy]);

  const itemsPerPage = 9; // 3 columns x 3 rows (§3.5)
  const totalPages = Math.max(1, Math.ceil(sortedApps.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages - 1);
  const displayedApps = sortedApps.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div
      className="card-midnight p-4 sm:p-5 flex flex-col justify-between h-full bg-[#141A25] border border-[#2B374B]"
      role="region"
      aria-label="App constellation"
    >
      {/* Header & Controls */}
      <div className="flex items-center justify-between border-b border-[#2B374B] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#F2F5FB]">Apps</h3>
          <span className="text-xs text-[#96A5BD]">({sortedApps.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Control */}
          <button
            onClick={() => setSortBy(sortBy === "time" ? "name" : "time")}
            className="flex items-center gap-1 text-[11px] text-[#B8C4D8] hover:text-[#F2F5FB] px-2 py-1 rounded-[6px] bg-[#1A2230] border border-[#2B374B] transition-colors"
            title="Toggle sort by Time or Name"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span className="capitalize">{sortBy}</span>
          </button>

          {/* Pager */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded-[6px] text-[#B8C4D8] hover:text-[#F2F5FB] disabled:opacity-30 transition-colors"
              aria-label="Previous app page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-[#96A5BD] min-w-[32px] text-center font-mono">
              {currentPage + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-1 rounded-[6px] text-[#B8C4D8] hover:text-[#F2F5FB] disabled:opacity-30 transition-colors"
              aria-label="Next app page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Icon Tiles (3x3 on desktop, 4x3 on wide / mobile) */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 sm:gap-3 flex-1 items-center justify-center">
        {displayedApps.map((app) => {
          const friendlyName = getFriendlyAppName(app.label);
          const initials = getAppInitials(friendlyName);
          const isSelected = selectedAppKey === app.key;
          const formattedDuration = formatDurationSeconds(app.seconds);
          const catColor = CATEGORY_COLORS[app.category] || "var(--other)";

          return (
            <button
              key={app.key}
              onClick={() => onSelectApp(app.key)}
              className={`flex flex-col items-center justify-between p-2 rounded-[12px] border transition-all text-center h-[96px] w-full ${
                isSelected
                  ? "bg-[#1F2939] border-[#AAA9FF] shadow-[0_0_12px_rgba(170,169,255,0.2)]"
                  : "bg-[#1A2230]/70 border-[#2B374B] hover:bg-[#1F2939] hover:border-[#53637D]"
              } ${app.isExcluded ? "opacity-40" : ""}`}
              title={`${friendlyName} · ${formattedDuration} · Click to open App lens`}
            >
              {/* 48px Icon Well with Initials and Category Dot */}
              <div className="relative w-11 h-11 rounded-[10px] bg-[#0B0E14] border border-[#2B374B] flex items-center justify-center text-xs font-bold tracking-wider text-[#F2F5FB] shrink-0">
                {initials}
                {/* Small category indicator */}
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#141A25]"
                  style={{ backgroundColor: catColor }}
                  title={`Category: ${app.category}`}
                />
              </div>

              {/* Friendly Name */}
              <span className="text-[11px] font-medium text-[#F2F5FB] truncate w-full px-1">
                {friendlyName}
              </span>

              {/* Duration */}
              <span className="text-[10px] font-mono text-[#96A5BD]">
                {formattedDuration}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
