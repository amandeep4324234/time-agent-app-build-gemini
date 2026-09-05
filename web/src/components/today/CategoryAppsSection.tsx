"use client";

import React, { useState } from "react";
import { formatDuration } from "@/lib/format";
import { SafeDayAdapterResult } from "@/lib/safe-adapter";
import { Category } from "@/lib/types";
import { Edit2, X, ChevronDown, ChevronUp } from "lucide-react";

interface CategoryAppsSectionProps {
  adapterResult: SafeDayAdapterResult;
  selectedCategory: string | null;
  selectedApp: string | null;
  onSelectCategory: (cat: string | null) => void;
  onSelectApp: (app: string | null) => void;
  onEditCategory: (app: string, currentCategory: Category) => void;
}

export function CategoryAppsSection({
  adapterResult,
  selectedCategory,
  selectedApp,
  onSelectCategory,
  onSelectApp,
  onEditCategory,
}: CategoryAppsSectionProps) {
  const { categories, apps } = adapterResult;
  const [showAllApps, setShowAllApps] = useState(false);

  // Filter apps if category is selected
  const filteredApps = selectedCategory
    ? apps.filter((a) => {
        if (selectedCategory === "work") return a.category === "work";
        if (selectedCategory === "sink") return a.category === "sink";
        if (selectedCategory === "games") return a.category === "games";
        if (selectedCategory === "other") return a.category === "other-known";
        if (selectedCategory === "unclassified") return a.category === "unclassified";
        return true;
      })
    : apps;

  const displayedApps = showAllApps ? filteredApps : filteredApps.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 rounded-[10px] border border-[#303B49] bg-[#141A22]">
      {/* 1. Time by Category (§6.3) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-[#EDF1F5] tracking-tight">
              Time by category
            </h3>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-[4px] bg-[#1D2530] text-[#E4B45F] hover:bg-[#202A36] border border-[#303B49] transition-colors"
              >
                <span>Clear filter</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-xs text-[#94A1B2]">All devices</span>
        </div>

        {/* 10px Stacked Horizontal Bar (§6.3) */}
        <div className="w-full h-2.5 rounded-[3px] bg-[#202A36] overflow-hidden flex">
          {categories.map((cat) => {
            if (cat.percent <= 0) return null;
            return (
              <div
                key={cat.category}
                style={{
                  width: `${cat.percent}%`,
                  backgroundColor: cat.color,
                }}
                title={`${cat.label}: ${cat.percent}%`}
                className="h-full transition-all duration-normal cursor-pointer hover:opacity-85"
                onClick={() => onSelectCategory(selectedCategory === cat.category ? null : cat.category)}
              />
            );
          })}
        </div>

        {/* Legend Rows with exact values & percentages (§6.3) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.category;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : cat.category)}
                className={`flex items-center justify-between p-2 rounded-[6px] text-xs transition-colors text-left border ${
                  isSelected
                    ? "bg-[#1D2530] border-[#E4B45F] text-[#EDF1F5]"
                    : "bg-[#0D1117] border-[#303B49]/60 text-[#B0BBC9] hover:border-[#303B49]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-[#EDF1F5]">{cat.label}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono-nums">
                  <span>{formatDuration(cat.seconds)}</span>
                  <span className="text-[#94A1B2] text-[11px]">({cat.percent}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top Apps Table (§6.3) */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[#303B49]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[#EDF1F5] tracking-tight">
              Apps
            </h3>
            {selectedCategory && (
              <span className="text-xs text-[#E4B45F] capitalize font-medium">
                ({selectedCategory})
              </span>
            )}
          </div>
          <span className="text-xs text-[#94A1B2]">
            {filteredApps.length} recorded
          </span>
        </div>

        {displayedApps.length > 0 ? (
          <div className="rounded-[6px] border border-[#303B49] bg-[#0D1117] divide-y divide-[#303B49] overflow-hidden">
            {displayedApps.map((app) => {
              const isSelected = selectedApp === app.label;
              return (
                <div
                  key={app.key}
                  onClick={() => onSelectApp(isSelected ? null : app.label)}
                  className={`flex items-center justify-between px-3 py-2.5 min-h-[48px] text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#1D2530] text-[#EDF1F5]"
                      : "text-[#B0BBC9] hover:bg-[#1D2530]/40 hover:text-[#EDF1F5]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-medium text-[#EDF1F5] truncate max-w-[140px] sm:max-w-xs">
                      {app.label}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-[3px] bg-[#202A36] text-[#94A1B2] capitalize shrink-0">
                      {app.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono-nums">
                    {/* Sessions count column (§6.3) */}
                    <span className="text-[#94A1B2] text-[11px] hidden sm:inline">
                      {app.sessionCount} {app.sessionCount === 1 ? "session" : "sessions"}
                    </span>
                    <span className="text-[#EDF1F5] font-medium">
                      {formatDuration(app.seconds)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCategory(app.label, app.category);
                      }}
                      aria-label={`Edit category for ${app.label}`}
                      className="p-1 rounded-[4px] hover:bg-[#202A36] text-[#94A1B2] hover:text-[#EDF1F5] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-[#94A1B2]">
            No apps match the selected filter.
          </div>
        )}

        {filteredApps.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllApps(!showAllApps)}
            className="self-center flex items-center gap-1.5 text-xs font-medium text-[#B0BBC9] hover:text-[#EDF1F5] transition-colors pt-1"
          >
            <span>{showAllApps ? "Show less" : `Show all ${filteredApps.length} apps`}</span>
            {showAllApps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
