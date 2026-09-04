"use client";

import React, { useState, useRef, useCallback, useEffect, useId } from "react";
import { TimelineModel, TimelineSegment, TimelineRunSegment, hitTestTimeline, HitTestResult } from "@/lib/timeline-model";
import { formatClock, formatDuration } from "@/lib/format";

interface TimelineProps {
  model: TimelineModel;
  tz?: string;
  isGhostActive?: boolean;
  onSelectTime?: (timeMs: number) => void;
  selectedSegmentId?: string | null;
}

interface PopoverInfo {
  xPercent: number;
  yPx: number;
  title: string;
  subtitle: string;
}

export function Timeline({
  model,
  tz = "Asia/Kolkata",
  isGhostActive = false,
  onSelectTime,
  selectedSegmentId,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrubPercent, setScrubPercent] = useState<number | null>(null);
  const [hitResult, setHitResult] = useState<HitTestResult | null>(null);
  const [popover, setPopover] = useState<PopoverInfo | null>(null);
  const lastThrottleRef = useRef<number>(0);

  // Close popover when day changes
  useEffect(() => {
    setPopover(null);
    setScrubPercent(null);
    setHitResult(null);
  }, [model.dayKey]);

  // Direct manipulation scrub tracking (1:1 with finger/mouse, readout throttled to 100ms)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const p = (x / rect.width) * 100;
      setScrubPercent(p);

      const now = performance.now();
      if (now - lastThrottleRef.current >= 100) {
        lastThrottleRef.current = now;
        const res = hitTestTimeline(p, model, tz);
        setHitResult(res);
      }
    },
    [model, tz]
  );

  const handlePointerLeave = useCallback(() => {
    setScrubPercent(null);
    setHitResult(null);
  }, []);

  // Tap-to-explain on click (160ms popover with one-sentence explanation)
  const handleSegmentClick = (
    e: React.MouseEvent,
    seg: TimelineSegment | TimelineRunSegment,
    isRun: boolean
  ) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const xPct = Math.max(5, Math.min(95, (clickX / rect.width) * 100));

    if (isRun) {
      const run = seg as TimelineRunSegment;
      const start = formatClock(run.startMs, tz);
      const end = formatClock(run.endMs, tz);
      const dur = formatDuration(run.durationSeconds);
      const killer = run.killerApp
        ? ` — ended by ${run.killerApp}`
        : run.ended_by === "sink"
        ? " — ended by sink"
        : "";
      setPopover({
        xPercent: xPct,
        yPx: 10,
        title: `Focus run — ${dur}`,
        subtitle: `${start}-${end}${killer}.`,
      });
      if (onSelectTime) onSelectTime(run.startMs);
    } else {
      const s = seg as TimelineSegment;
      const clock = formatClock(s.started_at_ms, tz);
      const dur = formatDuration(s.seconds);
      const label = s.displayLabel;

      let explanation = `${label} — ${dur} (${clock}).`;
      if (s.killedRunMinutes) {
        explanation = `${label} — ${dur}, killed a ${s.killedRunMinutes}-min run at ${clock}.`;
      }

      setPopover({
        xPercent: xPct,
        yPx: s.device === "phone" ? 30 : 48,
        title: label,
        subtitle: explanation,
      });
      if (onSelectTime) onSelectTime(s.started_at_ms);
    }
  };

  // Color mapping helper
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "work":
        return "bg-[#D29922]"; // Amber accent (focus only)
      case "sink":
        return "bg-[#F85149]"; // Sink red
      case "games":
        return "bg-[#8B949E]"; // Gray
      case "other-known":
        return "bg-[#6E7681]"; // Gray
      case "unclassified":
        return "bg-[#484F58]"; // Gray
      case "private":
        return "bg-[#6E7681]"; // Fenced gray
      default:
        return "bg-[#484F58]";
    }
  };

  const axisHours = [
    { label: "04", pct: 0 },
    { label: "08", pct: 16.666 },
    { label: "12", pct: 33.333 },
    { label: "16", pct: 50.0 },
    { label: "20", pct: 66.666 },
    { label: "00", pct: 83.333 },
    { label: "04(+1)", pct: 100 },
  ];

  return (
    <div className="flex flex-col gap-1.5 select-none font-mono relative py-1">
      {/* Axis Row (10sp fg-muted #6E7681) */}
      <div className="relative h-4 w-full text-[10px] text-[#6E7681]">
        {axisHours.map((hour) => (
          <div
            key={hour.label}
            className="absolute -translate-x-1/2 top-0"
            style={{ left: `${hour.pct}%` }}
          >
            {hour.label}
          </div>
        ))}
      </div>

      {/* Ghost reference label if active */}
      {isGhostActive && model.ghostDayKey && (
        <div className="text-[10px] text-[#6E7681] pl-0.5">
          vs {model.ghostDayKey}
        </div>
      )}

      {/* Interactive Timeline Canvas */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={() => setPopover(null)}
        className="relative w-full cursor-crosshair flex flex-col gap-1 py-1"
        style={{ touchAction: "none" }}
      >
        {/* Band 1: Runs Band (6dp / 6px) */}
        <div className="relative h-[6px] w-full bg-[#161B22] border border-[#21262D] rounded-[1px] overflow-hidden">
          {/* Ghost runs layer at 50% opacity */}
          {isGhostActive &&
            model.ghostRunSegments.map((gr, idx) => (
              <div
                key={`gr-${idx}`}
                className="absolute top-0 bottom-0 bg-[#D29922] opacity-40 pointer-events-none"
                style={{
                  left: `${gr.leftPercent}%`,
                  width: `${Math.max(0.4, gr.widthPercent)}%`,
                }}
              />
            ))}

          {/* Live runs layer */}
          {model.runSegments.map((run, idx) => (
            <div
              key={`run-${idx}`}
              onClick={(e) => handleSegmentClick(e, run, true)}
              className="absolute top-0 bottom-0 bg-[#D29922] hover:brightness-110 cursor-pointer transition-colors"
              style={{
                left: `${run.leftPercent}%`,
                width: `${Math.max(0.4, run.widthPercent)}%`,
              }}
              title={`Focus run: ${formatDuration(run.durationSeconds)}`}
            >
              {/* Red 2dp tick where ended_by = sink */}
              {run.hasSinkTick && (
                <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-[#F85149]" />
              )}
            </div>
          ))}
        </div>

        {/* Band 2: Phone Lane (12dp / 12px) */}
        <div className="relative flex items-center">
          <div className="w-10 text-[9px] uppercase tracking-wider text-[#8B949E] flex-shrink-0">
            phone
          </div>
          <div className="relative h-[12px] flex-1 bg-[#161B22] border border-[#21262D] rounded-[2px] overflow-hidden">
            {/* Ghost phone segments */}
            {isGhostActive &&
              model.ghostPhoneSegments.map((gs, idx) => (
                <div
                  key={`gps-${idx}`}
                  className={`absolute top-0 bottom-0 ${getCategoryColor(gs.category)} opacity-40 pointer-events-none`}
                  style={{
                    left: `${gs.leftPercent}%`,
                    width: `${Math.max(0.3, gs.widthPercent)}%`,
                  }}
                />
              ))}

            {/* Live phone segments */}
            {model.phoneSegments.map((seg) => {
              const isSelected = selectedSegmentId === seg.id;
              return (
                <div
                  key={seg.id}
                  onClick={(e) => handleSegmentClick(e, seg, false)}
                  className={`absolute top-0 bottom-0 ${getCategoryColor(
                    seg.category
                  )} flex items-center justify-center overflow-hidden cursor-pointer hover:brightness-110 transition-colors ${
                    isSelected ? "ring-1 ring-white" : ""
                  }`}
                  style={{
                    left: `${seg.leftPercent}%`,
                    width: `${Math.max(0.3, seg.widthPercent)}%`,
                  }}
                >
                  {/* Private text in segment: "private" if >= 18px / 3%, else "p" */}
                  {seg.isPrivate && (
                    <span className="text-[9px] text-[#E6EDF3] px-0.5 leading-none font-mono select-none pointer-events-none">
                      {seg.widthPercent >= 3 ? "private" : "p"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Band 3: Computer Lane (12dp / 12px) */}
        <div className="relative flex items-center">
          <div className="w-10 text-[9px] uppercase tracking-wider text-[#8B949E] flex-shrink-0">
            comp
          </div>
          <div className="relative h-[12px] flex-1 bg-[#161B22] border border-[#21262D] rounded-[2px] overflow-hidden">
            {/* Ghost comp segments */}
            {isGhostActive &&
              model.ghostComputerSegments.map((gs, idx) => (
                <div
                  key={`gcs-${idx}`}
                  className={`absolute top-0 bottom-0 ${getCategoryColor(gs.category)} opacity-40 pointer-events-none`}
                  style={{
                    left: `${gs.leftPercent}%`,
                    width: `${Math.max(0.3, gs.widthPercent)}%`,
                  }}
                />
              ))}

            {/* Live comp segments */}
            {model.computerSegments.map((seg) => {
              const isSelected = selectedSegmentId === seg.id;
              return (
                <div
                  key={seg.id}
                  onClick={(e) => handleSegmentClick(e, seg, false)}
                  className={`absolute top-0 bottom-0 ${getCategoryColor(
                    seg.category
                  )} flex items-center justify-center overflow-hidden cursor-pointer hover:brightness-110 transition-colors ${
                    isSelected ? "ring-1 ring-white" : ""
                  }`}
                  style={{
                    left: `${seg.leftPercent}%`,
                    width: `${Math.max(0.3, seg.widthPercent)}%`,
                  }}
                >
                  {seg.isPrivate && (
                    <span className="text-[9px] text-[#E6EDF3] px-0.5 leading-none font-mono select-none pointer-events-none">
                      {seg.widthPercent >= 3 ? "private" : "p"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty / No-data State Messages over tracks */}
        {model.isNoData && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0D1117]/80 pointer-events-none">
            <span className="text-xs text-[#6E7681]">no data for this day</span>
          </div>
        )}
        {!model.isNoData && model.totalTrackedSeconds === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0D1117]/70 pointer-events-none">
            <span className="text-xs text-[#6E7681]">nothing tracked</span>
          </div>
        )}

        {/* Scrub Crosshair line (1:1 direct manipulation, no easing) */}
        {scrubPercent !== null && (
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-[#E6EDF3] pointer-events-none z-10 shadow-sm"
            style={{ left: `${scrubPercent}%` }}
          />
        )}

        {/* Scrub Readout Plate (Surface-2 #1C2128, hairline #21262D, 13px / 500 tnum) */}
        {scrubPercent !== null && hitResult && (
          <div
            className="absolute top-[48px] -translate-x-1/2 z-20 px-2.5 py-1 bg-[#1C2128] border border-[#21262D] rounded-[2px] text-[13px] font-medium text-[#E6EDF3] shadow-md whitespace-nowrap pointer-events-none tnum"
            style={{
              left: `${Math.max(10, Math.min(90, scrubPercent))}%`,
            }}
          >
            {hitResult.readoutText}
          </div>
        )}

        {/* Tap-to-Explain Popover (160ms ease-out) */}
        {popover && (
          <div
            className="absolute z-30 -translate-x-1/2 p-2.5 bg-[#1C2128] border border-[#21262D] rounded-[4px] text-xs text-[#E6EDF3] shadow-lg max-w-[280px] animate-in fade-in slide-in-from-bottom-1 duration-160"
            style={{
              left: `${popover.xPercent}%`,
              top: `${popover.yPx}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-semibold text-[#E6EDF3] mb-0.5">
              {popover.title}
            </div>
            <div className="text-[11px] text-[#8B949E] leading-relaxed">
              {popover.subtitle}
            </div>
          </div>
        )}
      </div>

      {/* Sub-axis light day meta if applicable */}
      {model.isLightDay && (
        <div className="text-[10px] text-[#6E7681] pt-0.5">
          light day: &lt; 45m tracked
        </div>
      )}
    </div>
  );
}
