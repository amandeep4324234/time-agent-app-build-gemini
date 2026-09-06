"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as RightIcon } from "lucide-react";
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

// Inline high-fidelity app icons matching approved-overview.png
function renderAppIcon(label: string, size = 32) {
  const norm = label.toLowerCase();

  if (norm.includes("code") || norm.includes("vscode")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M23.5 3L8.5 14.5L3 10L1 11.5L7 16L1 20.5L3 22L8.5 17.5L23.5 29L31 25.5V6.5L23.5 3Z" fill="#007ACC" />
        <path d="M23.5 3L8.5 14.5L13.5 18.5L23.5 11V3Z" fill="#1F9CF0" />
        <path d="M23.5 29L8.5 17.5L13.5 13.5L23.5 21V29Z" fill="#0065A9" />
      </svg>
    );
  }
  if (norm.includes("figma")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M11 6C11 3.23858 13.2386 1 16 1H21C23.7614 1 26 3.23858 26 6C26 8.76142 23.7614 11 21 11H16H11V6Z" fill="#FF7262" />
        <path d="M6 6C6 3.23858 8.23858 1 11 1V11H6C3.23858 11 1 8.76142 1 6C1 3.23858 3.23858 1 6 1" fill="#F24E1E" />
        <path d="M6 16C6 13.2386 8.23858 11 11 11V21H6C3.23858 21 1 18.7614 1 16C1 13.2386 3.23858 11 6 11" fill="#A259FF" />
        <path d="M16 16C16 13.2386 18.2386 11 21 11C23.7614 11 26 13.2386 26 16C26 18.7614 23.7614 21 21 21C18.2386 21 16 18.7614 16 16Z" fill="#1ABCFE" />
        <path d="M6 26C6 23.2386 8.23858 21 11 21V26C11 28.7614 8.23858 31 6 31C3.23858 31 1 28.7614 1 26C1 23.2386 3.23858 21 6 21" fill="#0ACF83" />
      </svg>
    );
  }
  if (norm.includes("notion")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#1A1C1D" />
        <path d="M7 6.5L20 4.5L25 6V25.5L19 28L8 27L7 6.5Z" fill="white" fillOpacity="0.08" />
        <path d="M8.5 7.5L20.5 6L23.5 7.5V25L18.5 27L8.5 25.5V7.5Z" stroke="#ECECE7" strokeWidth="1.5" />
        <path d="M12 11V22M12 11L20 22M20 11V22" stroke="#ECECE7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (norm.includes("instagram")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <defs>
          <radialGradient id="ig-grad" cx="20%" cy="100%" r="120%">
            <stop offset="0%" stopColor="#FFDC80" />
            <stop offset="20%" stopColor="#F77737" />
            <stop offset="50%" stopColor="#E1306C" />
            <stop offset="100%" stopColor="#833AB4" />
          </radialGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#ig-grad)" />
        <rect x="7" y="7" width="18" height="18" rx="5" stroke="white" strokeWidth="2" />
        <circle cx="16" cy="16" r="4.5" stroke="white" strokeWidth="2" />
        <circle cx="21.5" cy="10.5" r="1.25" fill="white" />
      </svg>
    );
  }
  if (norm.includes("youtube")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="24" y="4" rx="6" fill="#FF0000" />
        <polygon points="13,10 22,16 13,22" fill="white" />
      </svg>
    );
  }
  if (norm.includes("chrome")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="#EA4335" />
        <path d="M16 2A14 14 0 0 1 29.5 21H16V2Z" fill="#FBBC05" />
        <path d="M16 2A14 14 0 0 0 2.5 21L9.5 9H16V2Z" fill="#34A853" />
        <circle cx="16" cy="16" r="6" fill="white" />
        <circle cx="16" cy="16" r="4.5" fill="#4285F4" />
      </svg>
    );
  }
  if (norm.includes("obsidian")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#1A1C1D" />
        <path d="M16 4L25 11L22 25L16 28L10 25L7 11L16 4Z" fill="#7C3AED" fillOpacity="0.8" />
        <path d="M16 4L22 25L16 28L10 25L16 4Z" fill="#A78BFA" />
      </svg>
    );
  }
  if (norm.includes("spotify")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="#1DB954" />
        <path d="M9 13C13.5 11.5 19 12 23 14" stroke="#121314" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M10 16.5C13.5 15.5 18 16 21.5 17.5" stroke="#121314" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M11.5 20C14.5 19.2 17.5 19.5 20 20.8" stroke="#121314" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (norm.includes("github")) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="#24292E" />
        <path fillRule="evenodd" clipRule="evenodd" d="M16 5C9.92 5 5 9.92 5 16C5 20.86 8.16 24.98 12.54 26.44C13.09 26.54 13.29 26.2 13.29 25.91C13.29 25.65 13.28 24.77 13.27 23.71C10.21 24.37 9.57 22.42 9.57 22.42C9.07 21.15 8.35 20.81 8.35 20.81C7.35 20.13 8.43 20.14 8.43 20.14C9.54 20.22 10.12 21.28 10.12 21.28C11.1 22.96 12.7 22.47 13.33 22.19C13.43 21.48 13.71 20.99 14.02 20.72C11.58 20.44 9.01 19.5 9.01 15.3C9.01 14.1 9.44 13.12 10.15 12.35C10.04 12.07 9.66 10.96 10.25 9.46C10.25 9.46 11.17 9.17 13.27 10.59C14.15 10.35 15.08 10.22 16.01 10.22C16.94 10.22 17.87 10.35 18.75 10.59C20.85 9.17 21.77 9.46 21.77 9.46C22.36 10.96 21.98 12.07 21.87 12.35C22.58 13.12 23.01 14.1 23.01 15.3C23.01 19.51 20.43 20.44 17.98 20.71C18.37 21.05 18.72 21.72 18.72 22.74C18.72 24.2 18.71 25.38 18.71 25.73C18.71 26.02 18.91 26.37 19.47 26.26C23.84 24.79 27 20.73 27 15.82C27 9.84 22.07 5 16 5Z" fill="white" />
      </svg>
    );
  }

  // Neutral initial tile fallback
  return (
    <div className="w-full h-full rounded-[6px] bg-[#27292A] border border-[#3A3D3E] flex items-center justify-center text-[13px] font-bold text-[#ECECE7]">
      {getAppInitials(getFriendlyAppName(label))}
    </div>
  );
}

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

  const itemsPerPage = 9; // 3 columns x 3 rows (§3.5, 9 items)
  const totalPages = Math.max(1, Math.ceil(sortedApps.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages - 1);
  const displayedApps = sortedApps.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const selectedApp = apps.find((a) => a.key === selectedAppKey) || displayedApps[0] || null;

  return (
    <div
      className="tf-card tf-apps p-4 flex flex-col justify-between h-full bg-[#202122] border border-[#3A3D3E] rounded-[10px] min-h-[440px]"
      role="region"
      aria-label="App constellation"
    >
      {/* Header & Controls */}
      <div className="flex items-center justify-between border-b border-[#3A3D3E] pb-3 mb-2">
        <h3 className="text-[18px] font-semibold text-[#ECECE7] m-0">Apps</h3>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown / Button */}
          <button
            onClick={() => setSortBy(sortBy === "time" ? "name" : "time")}
            className="flex items-center gap-1.5 text-[13px] text-[#C1C5C1] hover:text-[#ECECE7] px-2 py-1 rounded-[6px] bg-[#171819] border border-[#3A3D3E] transition-colors"
            title="Sort apps"
          >
            <span>{sortBy === "time" ? "Total time" : "Name"}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Icon Tiles (3x3 on desktop) */}
      <div className="tf-app-grid grid grid-cols-3 gap-2 flex-1 items-start content-start py-1">
        {displayedApps.map((app) => {
          const friendlyName = getFriendlyAppName(app.label);
          const isSelected = selectedAppKey === app.key;
          const formattedDuration = formatDurationSeconds(app.seconds);

          return (
            <button
              key={app.key}
              onClick={() => onSelectApp(app.key)}
              aria-pressed={isSelected}
              className={`tf-app-tile flex flex-col items-center justify-center p-2 rounded-[8px] border transition-all text-center min-h-[100px] w-full ${
                isSelected
                  ? "bg-[#27292A] border-[#ECECE7]"
                  : "bg-transparent border-transparent hover:bg-[#2D3031]"
              } ${app.isExcluded ? "opacity-40" : ""}`}
              title={`${friendlyName} · ${formattedDuration} · Click to view App lens`}
            >
              {/* 48px Icon Well with 34px actual icon */}
              <div className="tf-app-icon w-12 h-12 rounded-[8px] bg-[#1A1C1D] flex items-center justify-center shrink-0 mb-1.5 overflow-hidden">
                {renderAppIcon(app.label, 34)}
              </div>

              {/* Friendly Name (14px) */}
              <span className="tf-app-name text-[14px] font-normal text-[#ECECE7] truncate w-full px-0.5 leading-snug">
                {friendlyName}
              </span>

              {/* Duration (14px mono) */}
              <span className="tf-app-duration text-[14px] font-mono text-[#A1A9A5] leading-snug">
                {formattedDuration}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected App Teaser Summary Row (matching approved-overview.png) */}
      {selectedApp && (
        <div
          onClick={() => onSelectApp(selectedApp.key)}
          className="flex items-center justify-between p-2 px-3 rounded-[8px] bg-[#1A1C1D] border border-[#3A3D3E] hover:border-[#737978] transition-colors cursor-pointer mt-2"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[6px] bg-[#27292A] flex items-center justify-center shrink-0 overflow-hidden">
              {renderAppIcon(selectedApp.label, 22)}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[13px] font-medium text-[#ECECE7] truncate">
                {getFriendlyAppName(selectedApp.label)}
              </div>
              <div className="text-[11px] text-[#A1A9A5] truncate">
                {selectedApp.seconds > 0 ? `${formatDurationSeconds(selectedApp.seconds)} tracked` : "0m inside focus blocks"}
              </div>
            </div>
          </div>
          <div className="text-[12px] text-[#C1C5C1] hover:text-[#ECECE7] flex items-center gap-0.5 shrink-0 font-normal">
            <span>Open insights</span>
            <RightIcon className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Centered Pager (< 1 / 3 >) */}
      <div className="tf-app-pager flex items-center justify-center gap-3 pt-2 text-[14px] text-[#A1A9A5]">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="p-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] disabled:opacity-30 transition-colors"
          aria-label="Previous app page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-mono text-[13px]">
          {currentPage + 1} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage >= totalPages - 1}
          className="p-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] disabled:opacity-30 transition-colors"
          aria-label="Next app page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
