"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  SafeTimelineSegment,
  SafeRunSegment,
  SafeDayAdapterResult,
} from "@/lib/safe-adapter";
import { Evidence } from "@/lib/presentation-types";
import { EvidencePanel } from "./EvidencePanel";
import { formatDuration } from "@/lib/format";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight, List, ZoomIn, Keyboard } from "lucide-react";

interface TimelineWorkspaceProps {
  adapterResult: SafeDayAdapterResult;
  highlightCategory?: string | null;
  highlightApp?: string | null;
  externalEvidence?: Evidence | null;
  onClearExternalEvidence?: () => void;
}

export function TimelineWorkspace({
  adapterResult,
  highlightCategory,
  highlightApp,
  externalEvidence,
  onClearExternalEvidence,
}: TimelineWorkspaceProps) {
  const { dayStartMs, dayEndMs, totalDaySeconds, segments, timezone } = adapterResult;

  // Controls state (§7.1)
  const [deviceScope, setDeviceScope] = useState<"all" | "computer" | "phone">("all");
  const [zoomMode, setZoomMode] = useState<"full" | "6h">("full");
  const [zoomOffsetSeconds, setZoomOffsetSeconds] = useState(0); // offset from dayStartMs for 6h view
  const [showEventsList, setShowEventsList] = useState(false);

  // Selection state
  const [selectedSegment, setSelectedSegment] = useState<SafeTimelineSegment | null>(null);
  const [selectedRun, setSelectedRun] = useState<SafeRunSegment | null>(null);
  const [isEvidenceSheetOpen, setIsEvidenceSheetOpen] = useState(false);

  // Crosshair hover state (§7.2)
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);

  // All displayable events sorted chronologically for keyboard/events list
  const allDisplayableSegments = useMemo(() => {
    let list: SafeTimelineSegment[] = [];
    if (deviceScope === "all" || deviceScope === "computer") {
      list = list.concat(segments.computer);
    }
    if (deviceScope === "all" || deviceScope === "phone") {
      list = list.concat(segments.phone);
    }
    return list.sort((a, b) => a.startMs - b.startMs);
  }, [segments, deviceScope]);

  // Longest run for default display
  const longestRun = useMemo(() => {
    if (segments.focusRuns.length === 0) return null;
    return [...segments.focusRuns].sort((a, b) => b.durationSeconds - a.durationSeconds)[0];
  }, [segments.focusRuns]);

  // Window bounds (in seconds from dayStartMs)
  const windowSeconds = zoomMode === "full" ? totalDaySeconds : 6 * 3600;
  const clampedOffset = Math.max(0, Math.min(zoomOffsetSeconds, totalDaySeconds - windowSeconds));

  // Center on event when zooming into 6h (§7.2)
  const handleToggleZoom = (newMode: "full" | "6h") => {
    if (newMode === "6h" && zoomMode === "full") {
      let targetSec = 12 * 3600; // default noon
      if (selectedSegment) {
        targetSec = (selectedSegment.startMs - dayStartMs) / 1000;
      } else if (allDisplayableSegments.length > 0) {
        targetSec = (allDisplayableSegments[0].startMs - dayStartMs) / 1000;
      }
      // Center the 6h window around targetSec
      const centerOffset = Math.max(0, Math.min(totalDaySeconds - 6 * 3600, targetSec - 3 * 3600));
      setZoomOffsetSeconds(centerOffset);
    }
    setZoomMode(newMode);
  };

  // 6-hour view step controls: Earlier / Later +/- 3 hours (§7.2)
  const handleStepEarlier = () => {
    setZoomOffsetSeconds((prev) => Math.max(0, prev - 3 * 3600));
  };
  const handleStepLater = () => {
    setZoomOffsetSeconds((prev) => Math.min(totalDaySeconds - 6 * 3600, prev + 3 * 3600));
  };

  // Convert timeline timestamp to viewport percentage
  const toViewportPercent = (timestampMs: number) => {
    const secFromDayStart = (timestampMs - dayStartMs) / 1000;
    const secInView = secFromDayStart - clampedOffset;
    return (secInView / windowSeconds) * 100;
  };

  // Selection handlers
  const handleSelectSegment = (seg: SafeTimelineSegment) => {
    setSelectedSegment(seg);
    setSelectedRun(null);
    if (onClearExternalEvidence) onClearExternalEvidence();
    setIsEvidenceSheetOpen(true);
  };

  const handleSelectRun = (run: SafeRunSegment) => {
    setSelectedRun(run);
    setSelectedSegment(null);
    if (onClearExternalEvidence) onClearExternalEvidence();
    setIsEvidenceSheetOpen(true);
  };

  const handleCloseEvidence = () => {
    setSelectedSegment(null);
    setSelectedRun(null);
    if (onClearExternalEvidence) onClearExternalEvidence();
    setIsEvidenceSheetOpen(false);
  };

  // Keyboard timeline mode (§7.2): Left/Right selects prev/next, Home/End first/last, Enter opens
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allDisplayableSegments.length === 0) return;
    const currentIndex = selectedSegment ? allDisplayableSegments.findIndex((s) => s.id === selectedSegment.id) : -1;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIdx = currentIndex < allDisplayableSegments.length - 1 ? currentIndex + 1 : 0;
      handleSelectSegment(allDisplayableSegments[nextIdx]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIdx = currentIndex > 0 ? currentIndex - 1 : allDisplayableSegments.length - 1;
      handleSelectSegment(allDisplayableSegments[prevIdx]);
    } else if (e.key === "Home") {
      e.preventDefault();
      handleSelectSegment(allDisplayableSegments[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      handleSelectSegment(allDisplayableSegments[allDisplayableSegments.length - 1]);
    }
  };

  // Hover tracker
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineTrackRef.current) return;
    const rect = timelineTrackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setHoverPercent(pct);
  };

  const handleMouseLeave = () => {
    setHoverPercent(null);
  };

  // Calculate hover timestamp
  const hoverTimeStr = useMemo(() => {
    if (hoverPercent === null) return null;
    const secInView = (hoverPercent / 100) * windowSeconds;
    const totalSec = clampedOffset + secInView;
    const timeMs = dayStartMs + totalSec * 1000;
    return DateTime.fromMillis(timeMs, { zone: timezone }).toFormat("h:mma").toLowerCase();
  }, [hoverPercent, windowSeconds, clampedOffset, dayStartMs, timezone]);

  // Axis ticks (every 4 hours on desktop, every 6 hours on mobile, §7.1)
  const axisTicks = useMemo(() => {
    const ticks: Array<{ percent: number; label: string }> = [];
    const intervalHours = zoomMode === "full" ? 4 : 1;
    const intervalSec = intervalHours * 3600;

    const startSec = Math.floor(clampedOffset / intervalSec) * intervalSec;
    const endSec = clampedOffset + windowSeconds;

    for (let sec = startSec; sec <= endSec; sec += intervalSec) {
      if (sec < clampedOffset || sec > endSec) continue;
      const pct = ((sec - clampedOffset) / windowSeconds) * 100;
      const timeMs = dayStartMs + sec * 1000;
      const label = DateTime.fromMillis(timeMs, { zone: timezone }).toFormat("ha").toLowerCase();
      ticks.push({ percent: pct, label });
    }
    return ticks;
  }, [clampedOffset, windowSeconds, zoomMode, dayStartMs, timezone]);

  // Category segment color style
  const getSegmentColor = (cat: string) => {
    switch (cat) {
      case "work":
        return "bg-[#E4B45F]";
      case "sink":
        return "bg-[#F28D87] sink-hatch";
      case "games":
        return "bg-[#B3BBC7]";
      case "other-known":
        return "bg-[#8795A8]";
      case "unclassified":
      default:
        return "bg-[#627086] unclassified-dotted";
    }
  };

  const showFocusLane = deviceScope === "all";

  return (
    <section
      aria-label="Timeline workspace"
      className="rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col xl:flex-row overflow-hidden"
    >
      {/* Left / Main Workspace Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 gap-6 min-w-0">
        {/* Header & Controls Toolbar (§7.1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#303B49]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#EDF1F5] tracking-tight">
              Your day
            </h2>
            <span className="text-xs text-[#94A1B2]">
              {deviceScope === "all" ? "All devices" : deviceScope === "computer" ? "Computer only" : "Phone only"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Device Scope Selector */}
            <div className="flex rounded-[6px] border border-[#303B49] bg-[#0D1117] p-0.5 text-xs">
              {(["all", "computer", "phone"] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setDeviceScope(scope)}
                  className={`px-2.5 py-1 rounded-[4px] capitalize transition-colors ${
                    deviceScope === scope
                      ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
                      : "text-[#94A1B2] hover:text-[#EDF1F5]"
                  }`}
                >
                  {scope === "all" ? "All devices" : scope}
                </button>
              ))}
            </div>

            {/* Zoom Selector (§7.1) */}
            <div className="flex rounded-[6px] border border-[#303B49] bg-[#0D1117] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleToggleZoom("full")}
                className={`px-2.5 py-1 rounded-[4px] transition-colors ${
                  zoomMode === "full"
                    ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
                    : "text-[#94A1B2] hover:text-[#EDF1F5]"
                }`}
              >
                Full day
              </button>
              <button
                type="button"
                onClick={() => handleToggleZoom("6h")}
                className={`px-2.5 py-1 rounded-[4px] transition-colors ${
                  zoomMode === "6h"
                    ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
                    : "text-[#94A1B2] hover:text-[#EDF1F5]"
                }`}
              >
                6 hours
              </button>
            </div>

            {/* Earlier / Later Steppers for 6h Zoom (§7.2) */}
            {zoomMode === "6h" && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleStepEarlier}
                  disabled={clampedOffset <= 0}
                  className="px-2 py-1 rounded-[6px] border border-[#303B49] bg-[#141A22] text-xs text-[#B0BBC9] hover:text-[#EDF1F5] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Earlier
                </button>
                <button
                  type="button"
                  onClick={handleStepLater}
                  disabled={clampedOffset >= totalDaySeconds - windowSeconds}
                  className="px-2 py-1 rounded-[6px] border border-[#303B49] bg-[#141A22] text-xs text-[#B0BBC9] hover:text-[#EDF1F5] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Later
                </button>
              </div>
            )}

            {/* Events List Alternative Toggle (§7.1, §7.2) */}
            <button
              type="button"
              onClick={() => setShowEventsList(!showEventsList)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border text-xs transition-colors ${
                showEventsList
                  ? "bg-[#E4B45F]/20 border-[#E4B45F] text-[#E4B45F]"
                  : "border-[#303B49] bg-[#141A22] text-[#B0BBC9] hover:text-[#EDF1F5]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Events</span>
            </button>
          </div>
        </div>

        {/* View Mode: Interactive Visual Timeline OR Accessible Events List */}
        {!showEventsList ? (
          <div
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label="Interactive timeline workspace. Use arrow keys to step between sessions, Enter to inspect."
            className="flex flex-col gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E7EEF7] rounded-[6px]"
          >
            {/* Timeline Lanes Container */}
            <div
              ref={timelineTrackRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative flex flex-col gap-2 select-none"
            >
              {/* Hover Crosshair Guide & Safe Readout (§7.2) */}
              {hoverPercent !== null && (
                <>
                  <div
                    className="absolute top-0 bottom-0 w-[1px] bg-[#E7EEF7] pointer-events-none z-20"
                    style={{ left: `${hoverPercent}%` }}
                  />
                  <div
                    className="absolute -top-6 px-1.5 py-0.5 rounded-[4px] bg-[#202A36] border border-[#303B49] text-[10px] text-[#EDF1F5] font-mono-nums pointer-events-none z-30 transform -translate-x-1/2"
                    style={{ left: `${hoverPercent}%` }}
                  >
                    {hoverTimeStr}
                  </div>
                </>
              )}

              {/* Lane 1: Combined Focus Runs (24px height inside 44px row, §7.1) */}
              {showFocusLane && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 h-auto md:h-11">
                  <div className="w-24 shrink-0 text-xs font-medium text-[#E4B45F]">
                    Combined focus runs
                  </div>
                  <div className="relative flex-1 h-6 rounded-[3px] bg-[#0D1117] border border-[#303B49]/60 overflow-hidden">
                    {segments.focusRuns.map((run) => {
                      const left = toViewportPercent(run.startMs);
                      const right = toViewportPercent(run.endMs);
                      const width = right - left;
                      if (right < 0 || left > 100) return null;

                      const isSelected = selectedRun?.id === run.id;
                      return (
                        <button
                          key={run.id}
                          type="button"
                          onClick={() => handleSelectRun(run)}
                          aria-label={`Focus run: ${formatDuration(run.durationSeconds)}`}
                          style={{
                            left: `${Math.max(0, left)}%`,
                            width: `${Math.max(0.5, width)}%`,
                          }}
                          className={`absolute top-0 bottom-0 bg-[#E4B45F] rounded-[2px] transition-opacity hover:opacity-90 ${
                            isSelected ? "ring-2 ring-[#E7EEF7] z-10" : ""
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lane 2: Computer (28px height inside 48px row, §7.1) */}
              {(deviceScope === "all" || deviceScope === "computer") && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 h-auto md:h-12">
                  <div className="w-24 shrink-0 text-xs font-medium text-[#B0BBC9]">
                    Computer
                  </div>
                  <div className="relative flex-1 h-7 rounded-[3px] bg-[#0D1117] border border-[#303B49]/60 overflow-hidden">
                    {segments.computer.map((seg) => {
                      const left = toViewportPercent(seg.startMs);
                      const right = toViewportPercent(seg.endMs);
                      const width = right - left;
                      if (right < 0 || left > 100) return null;

                      const isSelected = selectedSegment?.id === seg.id;
                      const isHighlighted =
                        (highlightCategory && seg.category === highlightCategory) ||
                        (highlightApp && seg.app.toLowerCase() === highlightApp.toLowerCase());

                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => handleSelectSegment(seg)}
                          aria-label={`${seg.app} (${seg.category}): ${formatDuration(seg.durationSeconds)}`}
                          style={{
                            left: `${Math.max(0, left)}%`,
                            width: `${Math.max(0.4, width)}%`,
                          }}
                          className={`absolute top-0 bottom-0 rounded-[2px] transition-transform ${getSegmentColor(
                            seg.category
                          )} ${isSelected ? "ring-2 ring-[#E7EEF7] z-10 scale-y-105" : ""} ${
                            isHighlighted ? "ring-1 ring-white" : ""
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lane 3: Phone (28px height inside 48px row, §7.1) */}
              {(deviceScope === "all" || deviceScope === "phone") && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 h-auto md:h-12">
                  <div className="w-24 shrink-0 text-xs font-medium text-[#B0BBC9]">
                    Phone
                  </div>
                  <div className="relative flex-1 h-7 rounded-[3px] bg-[#0D1117] border border-[#303B49]/60 overflow-hidden">
                    {segments.phone.map((seg) => {
                      const left = toViewportPercent(seg.startMs);
                      const right = toViewportPercent(seg.endMs);
                      const width = right - left;
                      if (right < 0 || left > 100) return null;

                      const isSelected = selectedSegment?.id === seg.id;
                      const isHighlighted =
                        (highlightCategory && seg.category === highlightCategory) ||
                        (highlightApp && seg.app.toLowerCase() === highlightApp.toLowerCase());

                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => handleSelectSegment(seg)}
                          aria-label={`${seg.app} (${seg.category}): ${formatDuration(seg.durationSeconds)}`}
                          style={{
                            left: `${Math.max(0, left)}%`,
                            width: `${Math.max(0.4, width)}%`,
                          }}
                          className={`absolute top-0 bottom-0 rounded-[2px] transition-transform ${getSegmentColor(
                            seg.category
                          )} ${isSelected ? "ring-2 ring-[#E7EEF7] z-10 scale-y-105" : ""} ${
                            isHighlighted ? "ring-1 ring-white" : ""
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Time Axis Row (§7.1) */}
            <div className="flex items-center gap-4 pt-1">
              <div className="w-24 shrink-0 hidden md:block" />
              <div className="relative flex-1 h-4">
                {axisTicks.map((tick, i) => (
                  <div
                    key={i}
                    style={{ left: `${tick.percent}%` }}
                    className="absolute top-0 transform -translate-x-1/2 text-[11px] text-[#94A1B2] font-mono-nums"
                  >
                    {tick.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Keyboard & Accessibility Guide Helper */}
            <div className="flex items-center justify-between pt-3 border-t border-[#303B49] text-[11px] text-[#94A1B2]">
              <div className="flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5" />
                <span>Use ← / → arrow keys to step events, Enter to inspect</span>
              </div>
              <span className="italic">Private activity excluded</span>
            </div>
          </div>
        ) : (
          /* Events List Alternative (§7.1, §7.2) */
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#94A1B2] pb-2 border-b border-[#303B49]">
              <span>Chronological Events ({allDisplayableSegments.length})</span>
              <span>Tap row to open evidence</span>
            </div>
            <div className="max-h-72 overflow-y-auto rounded-[6px] border border-[#303B49] bg-[#0D1117] divide-y divide-[#303B49]">
              {allDisplayableSegments.map((seg) => {
                const isSelected = selectedSegment?.id === seg.id;
                const startStr = DateTime.fromMillis(seg.startMs, { zone: timezone }).toFormat("h:mma").toLowerCase();
                const endStr = DateTime.fromMillis(seg.endMs, { zone: timezone }).toFormat("h:mma").toLowerCase();

                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => handleSelectSegment(seg)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-[#1D2530] text-[#EDF1F5] font-medium"
                        : "text-[#B0BBC9] hover:bg-[#1D2530]/50 hover:text-[#EDF1F5]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${getSegmentColor(seg.category)}`} />
                      <span className="font-medium text-[#EDF1F5]">{seg.app}</span>
                      <span className="text-[11px] text-[#94A1B2] capitalize">({seg.category})</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono-nums text-[11px]">
                      <span className="text-[#94A1B2]">{startStr} – {endStr}</span>
                      <span className="text-[#EDF1F5]">{formatDuration(seg.durationSeconds)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Inline Evidence Panel on Desktop (≥1280px) */}
      <div className="hidden xl:block">
        <EvidencePanel
          selectedSegment={selectedSegment}
          selectedRun={selectedRun}
          longestRun={longestRun}
          customEvidence={externalEvidence || null}
          timezone={timezone}
          onClose={handleCloseEvidence}
          isInline={true}
        />
      </div>

      {/* Modal Evidence Sheet for Smaller Screens (<1280px) */}
      {isEvidenceSheetOpen && (
        <div className="xl:hidden">
          <EvidencePanel
            selectedSegment={selectedSegment}
            selectedRun={selectedRun}
            longestRun={longestRun}
            customEvidence={externalEvidence || null}
            timezone={timezone}
            onClose={handleCloseEvidence}
            isInline={false}
          />
        </div>
      )}
    </section>
  );
}
