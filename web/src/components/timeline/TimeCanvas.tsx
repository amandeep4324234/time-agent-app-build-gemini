"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  Play,
  List,
  Layers,
  ChevronRight,
  Clock,
  Filter,
} from "lucide-react";
import {
  SafeEffectiveDayResult,
  SafeEffectiveTimelineSegment,
  SafeBlockTimelineSegment,
} from "@/lib/effective-adapter";
import { formatDurationSeconds } from "@/lib/format";
import { Category } from "@/lib/types";

interface TimeCanvasProps {
  dayResult: SafeEffectiveDayResult;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string | null) => void;
  onSelectSegment?: (segment: SafeEffectiveTimelineSegment | null) => void;
  onStartReviewForBlock?: (blockId: string) => void;
  onCorrectActivityForSegment?: (segment: SafeEffectiveTimelineSegment) => void;
}

type Density = "compact" | "comfortable" | "expanded";

// Category colors for timeline segments (§2.1)
const CATEGORY_COLORS: Record<string, string> = {
  work: "var(--focus)",
  sink: "var(--sink)",
  games: "var(--games)",
  "other-known": "var(--other)",
  other: "var(--other)",
  unclassified: "var(--unclassified)",
  private: "transparent",
};

export function TimeCanvas({
  dayResult,
  selectedBlockId,
  onSelectBlock,
  onSelectSegment,
  onStartReviewForBlock,
  onCorrectActivityForSegment,
}: TimeCanvasProps) {
  const { segments, dayStartMs, dayEndMs, totalDaySeconds, timezone } = dayResult;

  // Viewport zoom state: window [startPct, endPct] between 0 and 100
  const [viewWindow, setViewWindow] = useState<{ start: number; end: number }>({
    start: 0,
    end: 100,
  });

  const [density, setDensity] = useState<Density>("comfortable");
  const [isAccessibleListOpen, setIsAccessibleListOpen] = useState(false);
  const [showUnwantedOutline, setShowUnwantedOutline] = useState(false);

  // Inspector states
  const [inspectedBlock, setInspectedBlock] = useState<SafeBlockTimelineSegment | null>(null);
  const [inspectedSegment, setInspectedSegment] = useState<SafeEffectiveTimelineSegment | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWindowRef = useRef<{ start: number; end: number }>({ start: 0, end: 100 });

  // Navigator brush drag state (§5.1, §5.3)
  const navTrackRef = useRef<HTMLDivElement>(null);
  const isNavDraggingRef = useRef<"window" | "left" | "right" | null>(null);
  const navDragStartXRef = useRef(0);
  const navDragStartWindowRef = useRef<{ start: number; end: number }>({ start: 0, end: 100 });

  // Zoom preset helper
  const applyPresetHours = (hours: number) => {
    const totalDayHours = 24;
    if (hours >= totalDayHours) {
      setViewWindow({ start: 0, end: 100 });
      return;
    }
    const spanPct = (hours / totalDayHours) * 100;
    // Center around middle of day or current midpoint
    const mid = (viewWindow.start + viewWindow.end) / 2;
    let newStart = mid - spanPct / 2;
    let newEnd = mid + spanPct / 2;
    if (newStart < 0) {
      newEnd += -newStart;
      newStart = 0;
    }
    if (newEnd > 100) {
      newStart -= newEnd - 100;
      newEnd = 100;
    }
    setViewWindow({ start: Math.max(0, newStart), end: Math.min(100, newEnd) });
  };

  const handleZoomStep = (factor: number) => {
    const currentSpan = viewWindow.end - viewWindow.start;
    const newSpan = Math.max(1, Math.min(100, currentSpan * factor));
    const mid = (viewWindow.start + viewWindow.end) / 2;
    let newStart = mid - newSpan / 2;
    let newEnd = mid + newSpan / 2;
    if (newStart < 0) {
      newEnd += -newStart;
      newStart = 0;
    }
    if (newEnd > 100) {
      newStart -= newEnd - 100;
      newEnd = 100;
    }
    setViewWindow({ start: Math.max(0, newStart), end: Math.min(100, newEnd) });
  };

  // Fit Selection (§5.1)
  const handleFitSelection = () => {
    if (inspectedBlock) {
      const pad = Math.max(2, inspectedBlock.overallWidthPercent * 0.2);
      const start = Math.max(0, inspectedBlock.overallLeftPercent - pad);
      const end = Math.min(100, inspectedBlock.overallLeftPercent + inspectedBlock.overallWidthPercent + pad);
      setViewWindow({ start, end });
    } else if (inspectedSegment) {
      const pad = Math.max(2, inspectedSegment.widthPercent * 0.2);
      const start = Math.max(0, inspectedSegment.leftPercent - pad);
      const end = Math.min(100, inspectedSegment.leftPercent + inspectedSegment.widthPercent + pad);
      setViewWindow({ start, end });
    } else if (segments.focusBlocks.length > 0) {
      const minLeft = Math.min(...segments.focusBlocks.map((b) => b.overallLeftPercent));
      const maxRight = Math.max(...segments.focusBlocks.map((b) => b.overallLeftPercent + b.overallWidthPercent));
      const pad = 3;
      setViewWindow({ start: Math.max(0, minLeft - pad), end: Math.min(100, maxRight + pad) });
    } else {
      setViewWindow({ start: 0, end: 100 });
    }
  };

  // Wheel zoom with Ctrl key (§5.3)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
      handleZoomStep(zoomFactor);
    }
  };

  // Keyboard navigation for the canvas (§5.3, §14)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      handleZoomStep(0.75); // zoom in
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      handleZoomStep(1.25); // zoom out
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const panDelta = e.shiftKey ? 10 : 3;
      const span = viewWindow.end - viewWindow.start;
      const newStart = Math.max(0, viewWindow.start - panDelta);
      setViewWindow({ start: newStart, end: Math.min(100, newStart + span) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const panDelta = e.shiftKey ? 10 : 3;
      const span = viewWindow.end - viewWindow.start;
      const newEnd = Math.min(100, viewWindow.end + panDelta);
      setViewWindow({ start: Math.max(0, newEnd - span), end: newEnd });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (inspectedBlock) {
        onStartReviewForBlock?.(inspectedBlock.id);
      } else if (inspectedSegment) {
        onCorrectActivityForSegment?.(inspectedSegment);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setInspectedBlock(null);
      setInspectedSegment(null);
      onSelectBlock?.(null);
      onSelectSegment?.(null);
    }
  };

  // Pointer dragging to pan canvas (§5.3)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan on left mouse button and not on interactive buttons
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWindowRef.current = { ...viewWindow };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !canvasRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const deltaPct = -(deltaX / rect.width) * (dragStartWindowRef.current.end - dragStartWindowRef.current.start);

    const span = dragStartWindowRef.current.end - dragStartWindowRef.current.start;
    let newStart = dragStartWindowRef.current.start + deltaPct;
    let newEnd = dragStartWindowRef.current.end + deltaPct;

    if (newStart < 0) {
      newStart = 0;
      newEnd = span;
    }
    if (newEnd > 100) {
      newEnd = 100;
      newStart = 100 - span;
    }

    setViewWindow({ start: Math.max(0, newStart), end: Math.min(100, newEnd) });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Global listeners for navigator brush dragging (§5.1, §5.3)
  const handleNavMouseDown = (type: "window" | "left" | "right", e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isNavDraggingRef.current = type;
    navDragStartXRef.current = e.clientX;
    navDragStartWindowRef.current = { ...viewWindow };
  };

  const handleNavTouchStart = (type: "window" | "left" | "right", e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 0) return;
    isNavDraggingRef.current = type;
    navDragStartXRef.current = e.touches[0].clientX;
    navDragStartWindowRef.current = { ...viewWindow };
  };

  const handleNavTrackClick = (e: React.MouseEvent) => {
    if (!navTrackRef.current) return;
    const rect = navTrackRef.current.getBoundingClientRect();
    const clickPct = ((e.clientX - rect.left) / rect.width) * 100;
    const span = viewWindow.end - viewWindow.start;
    let newStart = clickPct - span / 2;
    let newEnd = clickPct + span / 2;
    if (newStart < 0) {
      newEnd += -newStart;
      newStart = 0;
    }
    if (newEnd > 100) {
      newStart -= newEnd - 100;
      newEnd = 100;
    }
    setViewWindow({ start: Math.max(0, newStart), end: Math.min(100, newEnd) });
  };

  useEffect(() => {
    const handleGlobalMove = (clientX: number) => {
      if (!isNavDraggingRef.current || !navTrackRef.current) return;
      const rect = navTrackRef.current.getBoundingClientRect();
      const deltaX = clientX - navDragStartXRef.current;
      const deltaPct = (deltaX / rect.width) * 100;
      const startWin = navDragStartWindowRef.current;
      const minSpan = (15 / (24 * 60)) * 100; // 15 min minimum span (~1.04%)

      if (isNavDraggingRef.current === "window") {
        const span = startWin.end - startWin.start;
        let newStart = startWin.start + deltaPct;
        let newEnd = startWin.end + deltaPct;
        if (newStart < 0) {
          newStart = 0;
          newEnd = span;
        }
        if (newEnd > 100) {
          newEnd = 100;
          newStart = 100 - span;
        }
        setViewWindow({ start: Math.max(0, newStart), end: Math.min(100, newEnd) });
      } else if (isNavDraggingRef.current === "left") {
        let newStart = Math.min(startWin.end - minSpan, Math.max(0, startWin.start + deltaPct));
        setViewWindow((prev) => ({ ...prev, start: newStart }));
      } else if (isNavDraggingRef.current === "right") {
        let newEnd = Math.max(startWin.start + minSpan, Math.min(100, startWin.end + deltaPct));
        setViewWindow((prev) => ({ ...prev, end: newEnd }));
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleGlobalMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleGlobalMove(e.touches[0].clientX);
    };
    const handleEnd = () => {
      isNavDraggingRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, []);

  // Transform percentages from [0, 100] full day into visible viewport [viewWindow.start, viewWindow.end]
  const viewSpan = Math.max(0.1, viewWindow.end - viewWindow.start);
  const mapToViewport = (pct: number) => {
    return ((pct - viewWindow.start) / viewSpan) * 100;
  };

  // Hour tick marks (04:00 to 04:00 next day)
  const hourTicks = useMemo(() => {
    const ticks: Array<{ hour: number; label: string; pct: number }> = [];
    for (let h = 0; h <= 24; h += 2) {
      const actualHour = (4 + h) % 24;
      const label = `${actualHour.toString().padStart(2, "0")}:00`;
      const pct = (h / 24) * 100;
      ticks.push({ hour: actualHour, label, pct });
    }
    return ticks;
  }, []);

  // Calculate subrows for concurrent overlapping focus blocks (§5.1)
  const blockSubrows = useMemo(() => {
    const subrows: SafeBlockTimelineSegment[][] = [];
    for (const b of segments.focusBlocks) {
      let placed = false;
      for (const row of subrows) {
        const overlaps = row.some((other) => {
          return b.overallStartMs < other.overallEndMs && b.overallEndMs > other.overallStartMs;
        });
        if (!overlaps) {
          row.push(b);
          placed = true;
          break;
        }
      }
      if (!placed) {
        subrows.push([b]);
      }
    }
    return subrows;
  }, [segments.focusBlocks]);

  const numSubrows = Math.max(1, blockSubrows.length);

  // Lane height mapping (§5.1 table)
  const laneHeights = {
    blocks: (density === "compact" ? 40 : density === "comfortable" ? 56 : 72) * numSubrows,
    singleBlock: density === "compact" ? 40 : density === "comfortable" ? 56 : 72,
    runs: density === "compact" ? 24 : density === "comfortable" ? 36 : 48,
    computer: density === "compact" ? 36 : density === "comfortable" ? 48 : 64,
    phone: density === "compact" ? 36 : density === "comfortable" ? 48 : 64,
  };

  return (
    <div
      className="card-midnight p-4 sm:p-5 flex flex-col gap-4 bg-[#202122] border border-[#3A3D3E] select-text"
      role="region"
      aria-label="Interactive time canvas"
    >
      {/* Header & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3A3D3E] pb-3">
        <div>
          <h2 className="text-base font-semibold text-[#ECECE7] flex items-center gap-2">
            <span>Your time, mapped</span>
            <span className="text-xs font-normal text-[#A1A9A5]">
              &bull; 04:00–04:00 ({timezone.replace("_", " ")})
            </span>
          </h2>
        </div>

        {/* Toolbar Controls (§5.1) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Zoom Presets (§5.1, §5.3) */}
          <div className="flex items-center bg-[#282A2C] rounded-[6px] p-0.5 border border-[#3A3D3E]">
            <button
              onClick={() => applyPresetHours(24)}
              className="px-2 py-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] hover:bg-[#2F3133] transition-colors"
            >
              Full day
            </button>
            <button
              onClick={() => applyPresetHours(12)}
              className="px-2 py-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] hover:bg-[#2F3133] transition-colors"
            >
              12h
            </button>
            <button
              onClick={() => applyPresetHours(6)}
              className="px-2 py-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] hover:bg-[#2F3133] transition-colors"
            >
              6h
            </button>
            <button
              onClick={() => applyPresetHours(3)}
              className="px-2 py-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] hover:bg-[#2F3133] transition-colors"
            >
              3h
            </button>
            <button
              onClick={() => applyPresetHours(1)}
              className="px-2 py-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] hover:bg-[#2F3133] transition-colors"
            >
              1h
            </button>
            <button
              onClick={() => applyPresetHours(0.25)}
              className="px-2 py-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] hover:bg-[#2F3133] transition-colors"
            >
              15m
            </button>
            <button
              onClick={handleFitSelection}
              className="px-2 py-1 rounded-[4px] text-[#DDB66D] hover:text-[#E8C888] hover:bg-[#2F3133] transition-colors font-medium border-l border-[#3A3D3E]/50 ml-0.5"
              title="Fit zoom to selected or latest block"
            >
              Fit
            </button>
          </div>

          {/* Plus / Minus Zoom */}
          <div className="flex items-center bg-[#282A2C] rounded-[6px] p-0.5 border border-[#3A3D3E]">
            <button
              onClick={() => handleZoomStep(1.25)}
              className="p-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] hover:bg-[#2F3133]"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoomStep(0.75)}
              className="p-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] hover:bg-[#2F3133]"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewWindow({ start: 0, end: 100 })}
              className="p-1 rounded-[4px] text-[#C1C5C1] hover:text-[#ECECE7] hover:bg-[#2F3133]"
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Density Control (Compact / Comfortable / Expanded) */}
          <div className="hidden sm:flex items-center bg-[#282A2C] rounded-[6px] p-0.5 border border-[#3A3D3E]">
            {(["compact", "comfortable", "expanded"] as Density[]).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`px-2 py-1 rounded-[4px] capitalize transition-colors ${
                  density === d
                    ? "bg-[#DDB66D] text-[#171819] font-semibold"
                    : "text-[#C1C5C1] hover:text-[#ECECE7]"
                }`}
              >
                {d.slice(0, 4)}
              </button>
            ))}
          </div>

          {/* Show Unwanted Activity Outline (§3.4) */}
          <button
            onClick={() => setShowUnwantedOutline(!showUnwantedOutline)}
            className={`px-2.5 py-1 rounded-[6px] border text-xs font-medium transition-colors ${
              showUnwantedOutline
                ? "bg-[#DFA095]/20 text-[#DFA095] border-[#DFA095]/60 font-semibold"
                : "bg-[#282A2C] text-[#C1C5C1] border-[#3A3D3E] hover:text-[#ECECE7]"
            }`}
            title="Toggle outline on safe segments marked unwanted"
          >
            {showUnwantedOutline ? "Hide unwanted outline" : "Show unwanted activity"}
          </button>

          {/* Non-graphical Accessible List Toggle (§5.3) */}
          <button
            onClick={() => setIsAccessibleListOpen(!isAccessibleListOpen)}
            className="p-1.5 rounded-[6px] bg-[#282A2C] border border-[#3A3D3E] text-[#C1C5C1] hover:text-[#ECECE7]"
            title="Accessible events list"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Drawing Canvas Container */}
      <div
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label="Interactive timeline canvas. Use arrow keys to pan, plus/minus to zoom."
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative bg-[#171819] border border-[#3A3D3E] rounded-[12px] overflow-hidden select-none cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-[#DDB66D]/50"
        style={{ minHeight: "280px" }}
      >
        {/* Faint Vertical Washes behind device lanes for Focus Blocks active intervals only (§5.2) */}
        {segments.focusBlocks.map((b) =>
          b.activeIntervals.map((inv, i) => {
            const leftV = mapToViewport(inv.leftPercent);
            const widthV = (inv.widthPercent / viewSpan) * 100;
            if (leftV + widthV < 0 || leftV > 100) return null;

            return (
              <div
                key={`wash-${b.id}-${i}`}
                className="absolute top-0 bottom-0 pointer-events-none bg-[#DDB66D]/[0.06] border-x border-[#DDB66D]/20"
                style={{
                  left: `${leftV}%`,
                  width: `${widthV}%`,
                }}
              />
            );
          })
        )}

        {/* Time Ruler (Hour Tick Lines) */}
        <div className="absolute inset-0 pointer-events-none">
          {hourTicks.map((tick) => {
            const posV = mapToViewport(tick.pct);
            if (posV < 0 || posV > 100) return null;
            return (
              <div
                key={tick.hour}
                className="absolute top-0 bottom-0 border-l border-[#3A3D3E]/40 flex flex-col justify-between"
                style={{ left: `${posV}%` }}
              >
                <span className="text-[10px] font-mono text-[#A1A9A5]/70 pl-1 pt-1">
                  {tick.label}
                </span>
                <span className="text-[9px] font-mono text-[#A1A9A5]/40 pl-1 pb-1">
                  {tick.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Lanes Stack */}
        <div className="relative z-10 flex flex-col gap-2 p-3">
          {/* LANE 1: Intentional Focus Blocks (§5.2) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#DDB66D] px-1">
              <span>Focus Blocks (Intentional)</span>
              <span>{segments.focusBlocks.length} recorded</span>
            </div>
            <div
              className="relative w-full rounded-[8px] bg-[#202122]/80 border border-[#3A3D3E]/60 overflow-hidden"
              style={{ height: `${laneHeights.blocks}px` }}
            >
              {blockSubrows.map((row, rowIndex) =>
                row.map((b) => {
                  const leftV = mapToViewport(b.overallLeftPercent);
                  const widthV = (b.overallWidthPercent / viewSpan) * 100;
                  if (leftV + widthV < 0 || leftV > 100) return null;

                  const isSelected = selectedBlockId === b.id;
                  const topPx = rowIndex * laneHeights.singleBlock + 2;
                  const heightPx = Math.max(24, laneHeights.singleBlock - 4);

                  return (
                    <div
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectedBlock(b);
                        onSelectBlock?.(b.id);
                      }}
                      className={`focus-ribbon absolute rounded-[8px] flex items-center justify-between px-2.5 cursor-pointer transition-all ${
                        isSelected ? "border-[#E8C888] shadow-[0_0_16px_rgba(170,169,255,0.4)]" : ""
                      } ${b.state === "running" ? "border-r-2 border-r-[#DDB66D]" : ""}`}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        left: `${leftV}%`,
                        width: `${Math.max(2, widthV)}%`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 truncate mr-2">
                        {b.isReviewed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#90D2BC] shrink-0" />
                        ) : (
                          <div className="w-2 h-2 rounded-full border border-[#DDB66D] shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-[#ECECE7] truncate">
                          {b.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-[#E8C888]">
                          {formatDurationSeconds(b.elapsedSeconds)}
                        </span>
                        {!b.isReviewed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartReviewForBlock?.(b.id);
                            }}
                            className="px-2 py-0.5 rounded-[4px] bg-[#DDB66D] text-[#171819] text-[10px] font-semibold hover:bg-[#E8C888] transition-colors"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* LANE 2: Automatically Detected Deep Blocks (§5.2) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#C1C5C1] px-1">
              <span>Auto-Detected Deep Runs</span>
              <span>{segments.focusRuns.length} qualified runs</span>
            </div>
            <div
              className="relative w-full rounded-[6px] bg-[#202122]/60 border border-[#3A3D3E]/40"
              style={{ height: `${laneHeights.runs}px` }}
            >
              {segments.focusRuns.map((r) => {
                const leftV = mapToViewport(r.leftPercent);
                const widthV = (r.widthPercent / viewSpan) * 100;
                if (leftV + widthV < 0 || leftV > 100) return null;

                return (
                  <div
                    key={r.id}
                    className="absolute top-1 bottom-1 rounded-[4px] bg-[#DDB66D]/60 border-l-2 border-[#ECECE7] flex items-center px-1.5 text-[10px] font-mono text-[#171819] font-medium truncate"
                    style={{
                      left: `${leftV}%`,
                      width: `${Math.max(1, widthV)}%`,
                    }}
                    title={`Deep Run: ${formatDurationSeconds(r.durationSeconds)}`}
                  >
                    {widthV > 4 && formatDurationSeconds(r.durationSeconds)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* LANE 3: Computer Activity */}
          <div className="flex flex-col gap-1">
            <div className="text-[11px] font-medium text-[#A1A9A5] px-1">Computer Activity</div>
            <div
              className="relative w-full rounded-[6px] bg-[#202122]/40 border border-[#3A3D3E]/30 overflow-hidden"
              style={{ height: `${laneHeights.computer}px` }}
            >
              {segments.computer.map((seg) => {
                const leftV = mapToViewport(seg.leftPercent);
                const widthV = (seg.widthPercent / viewSpan) * 100;
                if (leftV + widthV < 0 || leftV > 100) return null;

                const bg = CATEGORY_COLORS[seg.category] || "var(--other)";
                const isUnwanted = seg.appraisal === "unwanted";
                const unwantedOutline = showUnwantedOutline && isUnwanted ? "ring-2 ring-[#DFA095] z-10" : "";

                return (
                  <div
                    key={seg.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectedSegment(seg);
                      onSelectSegment?.(seg);
                    }}
                    className={`absolute top-1 bottom-1 rounded-[3px] cursor-pointer hover:brightness-125 transition-all ${
                      seg.isExcluded ? "opacity-30 border border-dashed border-[#DFA095]" : ""
                    } ${seg.isAdjusted ? "border-t border-[#DDB66D]" : ""} ${unwantedOutline}`}
                    style={{
                      left: `${leftV}%`,
                      width: `${Math.max(0.2, widthV)}%`,
                      backgroundColor: bg,
                    }}
                    title={`${seg.app} (${seg.category}) · ${formatDurationSeconds(seg.durationSeconds)}${
                      seg.appraisal && seg.appraisal !== "unreviewed" ? ` · ${seg.appraisal}` : ""
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* LANE 4: Phone Activity */}
          <div className="flex flex-col gap-1">
            <div className="text-[11px] font-medium text-[#A1A9A5] px-1">Phone Activity</div>
            <div
              className="relative w-full rounded-[6px] bg-[#202122]/40 border border-[#3A3D3E]/30 overflow-hidden"
              style={{ height: `${laneHeights.phone}px` }}
            >
              {segments.phone.map((seg) => {
                const leftV = mapToViewport(seg.leftPercent);
                const widthV = (seg.widthPercent / viewSpan) * 100;
                if (leftV + widthV < 0 || leftV > 100) return null;

                const bg = CATEGORY_COLORS[seg.category] || "var(--other)";
                const isUnwanted = seg.appraisal === "unwanted";
                const unwantedOutline = showUnwantedOutline && isUnwanted ? "ring-2 ring-[#DFA095] z-10" : "";

                return (
                  <div
                    key={seg.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectedSegment(seg);
                      onSelectSegment?.(seg);
                    }}
                    className={`absolute top-1 bottom-1 rounded-[3px] cursor-pointer hover:brightness-125 transition-all ${
                      seg.isExcluded ? "opacity-30 border border-dashed border-[#DFA095]" : ""
                    } ${unwantedOutline}`}
                    style={{
                      left: `${leftV}%`,
                      width: `${Math.max(0.2, widthV)}%`,
                      backgroundColor: bg,
                    }}
                    title={`${seg.app} (${seg.category}) · ${formatDurationSeconds(seg.durationSeconds)}${
                      seg.appraisal && seg.appraisal !== "unreviewed" ? ` · ${seg.appraisal}` : ""
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Day Navigator Brush below Canvas (§5.1) */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[11px] text-[#A1A9A5]">
          <span>Full Day Navigator</span>
          <span>Drag window or handles to explore timeline</span>
        </div>
        <div
          ref={navTrackRef}
          onClick={handleNavTrackClick}
          className="relative h-6 w-full rounded-[6px] bg-[#171819] border border-[#3A3D3E] overflow-hidden cursor-pointer"
        >
          {/* Background mini bars across day */}
          {segments.focusBlocks.map((b) => (
            <div
              key={`nav-b-${b.id}`}
              className="absolute top-0 bottom-0 bg-[#DDB66D]/30 pointer-events-none"
              style={{
                left: `${b.overallLeftPercent}%`,
                width: `${Math.max(0.5, b.overallWidthPercent)}%`,
              }}
            />
          ))}

          {/* Viewport Brush Window */}
          <div
            className="absolute top-0 bottom-0 border-2 border-[#DDB66D] bg-[#DDB66D]/15 rounded-[4px] cursor-grab active:cursor-grabbing"
            style={{
              left: `${viewWindow.start}%`,
              width: `${Math.max(2, viewWindow.end - viewWindow.start)}%`,
            }}
            onMouseDown={(e) => handleNavMouseDown("window", e)}
            onTouchStart={(e) => handleNavTouchStart("window", e)}
          >
            {/* Left handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 bg-[#DDB66D] cursor-ew-resize opacity-70 hover:opacity-100"
              onMouseDown={(e) => handleNavMouseDown("left", e)}
              onTouchStart={(e) => handleNavTouchStart("left", e)}
              aria-label="Drag left handle to adjust start time"
            />
            {/* Right handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-2 bg-[#DDB66D] cursor-ew-resize opacity-70 hover:opacity-100"
              onMouseDown={(e) => handleNavMouseDown("right", e)}
              onTouchStart={(e) => handleNavTouchStart("right", e)}
              aria-label="Drag right handle to adjust end time"
            />
          </div>
        </div>
      </div>

      {/* Block Inspector Modal / Sheet (§5.4) */}
      {inspectedBlock && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setInspectedBlock(null)}
        >
          <div
            className="card-midnight w-full max-w-md p-5 bg-[#202122] border border-[#737978] shadow-2xl flex flex-col gap-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#3A3D3E] pb-3">
              <h3 className="text-sm font-semibold text-[#ECECE7]">{inspectedBlock.title}</h3>
              <button
                onClick={() => setInspectedBlock(null)}
                className="text-xs text-[#A1A9A5] hover:text-[#ECECE7]"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-[#C1C5C1]">
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <div className="flex items-center gap-1.5">
                  <span className="capitalize font-medium text-[#DDB66D]">
                    {inspectedBlock.state.replace("_", " ")}
                  </span>
                  {inspectedBlock.isAdjusted && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DDB66D]/10 text-[#DDB66D] border border-[#DDB66D]/30">
                      Adjusted
                    </span>
                  )}
                  {inspectedBlock.isReviewed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#90D2BC]/10 text-[#90D2BC] border border-[#90D2BC]/30">
                      Reviewed
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span>Planned Duration:</span>
                <span className="font-mono text-[#ECECE7]">
                  {inspectedBlock.plannedSeconds ? formatDurationSeconds(inspectedBlock.plannedSeconds) : "Not set"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active Elapsed:</span>
                <span className="font-mono text-[#ECECE7]">
                  {formatDurationSeconds(inspectedBlock.elapsedSeconds)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Recorded Work Overlap:</span>
                <span className="font-mono text-[#DDB66D]">
                  {formatDurationSeconds(inspectedBlock.workSeconds)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sink Overlap:</span>
                <span className="font-mono text-[#DFA095]">
                  {formatDurationSeconds(inspectedBlock.sinkSeconds)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>User Appraisal:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono capitalize text-[#DDB66D]">
                    {inspectedBlock.appraisal && inspectedBlock.appraisal !== "unreviewed"
                      ? inspectedBlock.appraisal
                      : "Unreviewed"}
                  </span>
                  {(inspectedBlock.unwantedSeconds || 0) > 0 && (
                    <span className="text-[10px] text-[#DFA095]">
                      ({formatDurationSeconds(inspectedBlock.unwantedSeconds || 0)} unwanted)
                    </span>
                  )}
                </div>
              </div>
              {inspectedBlock.appraisalReason && (
                <div className="text-[11px] text-[#A1A9A5] italic bg-[#171819] p-2 rounded-[6px] border border-[#3A3D3E]">
                  &ldquo;{inspectedBlock.appraisalReason}&rdquo;
                </div>
              )}
              {inspectedBlock.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[#A1A9A5]">Tags:</span>
                  {inspectedBlock.tags.map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 rounded-[4px] bg-[#282A2C] text-[10px] text-[#ECECE7]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#3A3D3E]">
              <button
                onClick={() => {
                  onStartReviewForBlock?.(inspectedBlock.id);
                  setInspectedBlock(null);
                }}
                className="flex-1 py-2 px-3 rounded-[8px] bg-[#DDB66D] text-[#171819] text-xs font-semibold hover:bg-[#E8C888] transition-colors"
              >
                Review / Correct Block Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Inspector Modal (§5.4) */}
      {inspectedSegment && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setInspectedSegment(null)}
        >
          <div
            className="card-midnight w-full max-w-md p-5 bg-[#202122] border border-[#737978] shadow-2xl flex flex-col gap-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#3A3D3E] pb-3">
              <h3 className="text-sm font-semibold text-[#ECECE7]">{inspectedSegment.app}</h3>
              <button
                onClick={() => setInspectedSegment(null)}
                className="text-xs text-[#A1A9A5] hover:text-[#ECECE7]"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs text-[#C1C5C1]">
              <div className="flex justify-between items-center">
                <span>Category:</span>
                <div className="flex items-center gap-1.5">
                  <span className="capitalize font-medium text-[#DDB66D]">
                    {inspectedSegment.category}
                  </span>
                  {inspectedSegment.isAdjusted && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DDB66D]/10 text-[#DDB66D] border border-[#DDB66D]/30">
                      Adjusted
                    </span>
                  )}
                  {inspectedSegment.isReviewed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#90D2BC]/10 text-[#90D2BC] border border-[#90D2BC]/30">
                      Reviewed
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-mono text-[#ECECE7]">
                  {formatDurationSeconds(inspectedSegment.durationSeconds)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Device:</span>
                <span className="capitalize text-[#ECECE7]">{inspectedSegment.device}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>User Appraisal:</span>
                <span className="font-mono capitalize text-[#DDB66D]">
                  {inspectedSegment.appraisal && inspectedSegment.appraisal !== "unreviewed"
                    ? inspectedSegment.appraisal
                    : "Unreviewed"}
                </span>
              </div>
              {inspectedSegment.appraisalReason && (
                <div className="text-[11px] text-[#A1A9A5] italic bg-[#171819] p-2 rounded-[6px] border border-[#3A3D3E]">
                  &ldquo;{inspectedSegment.appraisalReason}&rdquo;
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#3A3D3E]">
              <button
                onClick={() => {
                  onCorrectActivityForSegment?.(inspectedSegment);
                  setInspectedSegment(null);
                }}
                className="flex-1 py-2 px-3 rounded-[8px] bg-[#2F3133] text-[#ECECE7] border border-[#3A3D3E] text-xs font-semibold hover:bg-[#3A3D3E] transition-colors"
              >
                Correct activity interval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Non-Graphical List Alternative (§5.3) */}
      {isAccessibleListOpen && (
        <div className="p-4 rounded-[10px] bg-[#171819] border border-[#3A3D3E] flex flex-col gap-3 text-xs">
          <div className="flex justify-between items-center border-b border-[#3A3D3E] pb-2">
            <span className="font-semibold text-[#ECECE7]">Accessible Event List</span>
            <button
              onClick={() => setIsAccessibleListOpen(false)}
              className="text-[#A1A9A5] hover:text-[#ECECE7]"
            >
              Hide
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5">
            {segments.computer.concat(segments.phone).map((s) => (
              <div
                key={s.id}
                className="flex justify-between p-2 rounded bg-[#202122] border border-[#3A3D3E]"
              >
                <div>
                  <span className="font-medium text-[#ECECE7]">{s.app}</span>
                  <span className="text-[#A1A9A5] ml-2">({s.category}, {s.device})</span>
                </div>
                <span className="font-mono text-[#DDB66D]">
                  {formatDurationSeconds(s.durationSeconds)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
