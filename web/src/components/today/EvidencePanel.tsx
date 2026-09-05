"use client";

import React, { useEffect } from "react";
import { X, Clock, Layers, AlertCircle, ShieldCheck } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { SafeTimelineSegment, SafeRunSegment } from "@/lib/safe-adapter";
import { Evidence } from "@/lib/presentation-types";
import { DateTime } from "luxon";

interface EvidencePanelProps {
  selectedSegment: SafeTimelineSegment | null;
  selectedRun: SafeRunSegment | null;
  longestRun: SafeRunSegment | null;
  customEvidence: Evidence | null;
  timezone?: string;
  onClose: () => void;
  isInline?: boolean; // Desktop inline column vs mobile sheet
}

export function EvidencePanel({
  selectedSegment,
  selectedRun,
  longestRun,
  customEvidence,
  timezone = "Asia/Kolkata",
  onClose,
  isInline = false,
}: EvidencePanelProps) {
  // Handle escape key dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const formatClock = (ms: number) => {
    return DateTime.fromMillis(ms, { zone: timezone }).toFormat("h:mma").toLowerCase();
  };

  // Content render
  const renderContent = () => {
    // 1. Custom Evidence (from Observations)
    if (customEvidence) {
      return (
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-[#94A1B2] font-medium">
              Evidence Detail · {customEvidence.windowLabel}
            </span>
            <h3 className="text-base font-semibold text-[#EDF1F5]">
              {customEvidence.title}
            </h3>
            <p className="text-xs text-[#B0BBC9] leading-relaxed mt-1">
              {customEvidence.calculation}
            </p>
          </div>

          {/* Table of Rows */}
          {customEvidence.rows && customEvidence.rows.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-[#303B49] pt-3">
              <span className="text-[11px] text-[#94A1B2] font-medium">
                Sample Set ({customEvidence.rows.length})
              </span>
              <div className="max-h-56 overflow-y-auto rounded-[6px] border border-[#303B49] bg-[#0D1117] divide-y divide-[#303B49]">
                {customEvidence.rows.map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center px-3 py-2 text-xs">
                    <span className="text-[#B0BBC9]">
                      {Object.values(row)[0]}
                    </span>
                    <span className="text-[#EDF1F5] font-mono-nums font-medium">
                      {Object.values(row)[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations Disclosure */}
          <div className="flex flex-col gap-1 border-t border-[#303B49] pt-3 text-[11px] text-[#94A1B2] leading-relaxed">
            {customEvidence.limitations.map((lim, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-[#94A1B2]">•</span>
                <span>{lim}</span>
              </div>
            ))}
            <div className="mt-2 text-[#94A1B2] italic">
              Private activity is excluded from this view.
            </div>
          </div>
        </div>
      );
    }

    // 2. Selected Focus Run (§7.3)
    if (selectedRun) {
      const durationFmt = formatDuration(selectedRun.durationSeconds);
      const startFmt = formatClock(selectedRun.startMs);
      const endFmt = formatClock(selectedRun.endMs);

      // Termination explanation (§7.3)
      let terminationText = "Ending detail unavailable.";
      if (selectedRun.ended_by === "sink") {
        terminationText = selectedRun.killerApp
          ? `This run ended when ${selectedRun.killerApp} became active for at least 5 seconds.`
          : "Ending detail unavailable.";
      } else if (selectedRun.ended_by === "hole") {
        terminationText = "This run ended after a gap longer than 60 seconds.";
      } else if (selectedRun.ended_by === "day-end") {
        terminationText = "This run ended at the 04:00 logical day boundary.";
      }

      return (
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1 border-b border-[#303B49] pb-3">
            <span className="text-[11px] uppercase tracking-wider text-[#E4B45F] font-semibold">
              Focus Run
            </span>
            <div className="text-2xl font-semibold text-[#EDF1F5] font-mono-nums">
              {durationFmt}
            </div>
            <span className="text-xs text-[#94A1B2]">
              {startFmt} – {endFmt}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[#94A1B2] font-medium">
              Termination Reason
            </span>
            <div className="p-3 rounded-[6px] bg-[#0D1117] border border-[#303B49] text-xs text-[#EDF1F5] leading-relaxed">
              {terminationText}
            </div>
          </div>

          {selectedRun.contributingApps.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-[#94A1B2] font-medium">
                Contributing Apps
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedRun.contributingApps.map((app) => (
                  <span
                    key={app}
                    className="px-2 py-1 rounded-[4px] bg-[#202A36] text-[#B0BBC9] text-xs"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-[#303B49] text-[11px] text-[#94A1B2] leading-relaxed">
            This describes recorded app activity, not your attention. Private activity is excluded from this view.
          </div>
        </div>
      );
    }

    // 3. Selected Session Segment (§7.3)
    if (selectedSegment) {
      const durationFmt = formatDuration(selectedSegment.durationSeconds);
      const startFmt = formatClock(selectedSegment.startMs);
      const endFmt = formatClock(selectedSegment.endMs);

      return (
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1 border-b border-[#303B49] pb-3">
            <span className="text-[11px] uppercase tracking-wider text-[#94A1B2] font-medium">
              {selectedSegment.device} · {selectedSegment.category}
            </span>
            <h3 className="text-lg font-semibold text-[#EDF1F5] truncate">
              {selectedSegment.app}
            </h3>
            <div className="text-xl font-semibold text-[#EDF1F5] font-mono-nums">
              {durationFmt}
            </div>
            <span className="text-xs text-[#94A1B2]">
              {startFmt} – {endFmt}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[#94A1B2] font-medium">
              Classification
            </span>
            <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#0D1117] border border-[#303B49]">
              <span className="text-xs text-[#B0BBC9] capitalize">{selectedSegment.category}</span>
              <span className="text-[11px] text-[#94A1B2]">Edit in Settings</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#303B49] text-[11px] text-[#94A1B2] leading-relaxed">
            Timeframe observes foreground occupancy. Private activity is excluded from this view.
          </div>
        </div>
      );
    }

    // 4. Default / Unselected: Longest safe completed block (§7.3)
    if (longestRun) {
      const durationFmt = formatDuration(longestRun.durationSeconds);
      const startFmt = formatClock(longestRun.startMs);
      const endFmt = formatClock(longestRun.endMs);

      return (
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1 border-b border-[#303B49] pb-3">
            <span className="text-[11px] uppercase tracking-wider text-[#94A1B2] font-medium">
              Day Highlight
            </span>
            <h3 className="text-sm font-semibold text-[#EDF1F5]">
              Longest Focus Run
            </h3>
            <div className="text-2xl font-semibold text-[#E4B45F] font-mono-nums">
              {durationFmt}
            </div>
            <span className="text-xs text-[#94A1B2]">
              {startFmt} – {endFmt}
            </span>
          </div>

          <div className="p-3 rounded-[6px] bg-[#0D1117] border border-[#303B49] text-xs text-[#B0BBC9] leading-relaxed">
            Select any timeline segment or event row to inspect its exact timestamps and contributing activity.
          </div>

          <div className="pt-2 border-t border-[#303B49] text-[11px] text-[#94A1B2] leading-relaxed">
            Private activity is excluded from this view.
          </div>
        </div>
      );
    }

    // Empty state
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-[#94A1B2] gap-2">
        <Clock className="w-6 h-6 text-[#627086]" />
        <span>Select a moment on the timeline to inspect evidence.</span>
      </div>
    );
  };

  // Inline container on Desktop (≥1280px)
  if (isInline) {
    return (
      <aside
        aria-label="Evidence detail"
        className="w-full xl:w-[320px] shrink-0 border-t xl:border-t-0 xl:border-l border-[#303B49] p-4 xl:p-6 bg-[#141A22] rounded-b-[10px] xl:rounded-r-[10px] xl:rounded-bl-none flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#303B49] mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#EDF1F5]">
            Evidence
          </span>
          {(selectedSegment || selectedRun || customEvidence) && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Clear selection"
              className="p-1 rounded-[4px] hover:bg-[#1D2530] text-[#94A1B2] hover:text-[#EDF1F5] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1">{renderContent()}</div>
      </aside>
    );
  }

  // Modal Sheet for smaller viewports (<1280px, §5.2, §7.3)
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Evidence detail modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-fast"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-[16px] sm:rounded-[10px] border border-[#303B49] bg-[#141A22] p-6 shadow-2xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#303B49]">
          <span className="text-sm font-semibold uppercase tracking-wider text-[#EDF1F5]">
            Evidence Detail
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close evidence sheet"
            className="p-1 rounded-[6px] hover:bg-[#1D2530] text-[#94A1B2] hover:text-[#EDF1F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
