"use client";

import React, { useState, useRef, useCallback } from "react";
import { HelpCircle } from "lucide-react";
import { getMetricDefinition } from "@/lib/metric-registry";
import { MetricHelpPopover } from "./MetricHelpPopover";

interface MetricCardProps {
  metricId: string;
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  miniChart?: React.ReactNode;
  onClickCard?: () => void;
  onOpenEvidence?: () => void;
  className?: string;
}

export function MetricCard({
  metricId,
  title,
  value,
  subtitle,
  badge,
  miniChart,
  onClickCard,
  onOpenEvidence,
  className = "",
}: MetricCardProps) {
  const definition = getMetricDefinition(metricId);
  const [showHelp, setShowHelp] = useState(false);

  // Press-and-hold states (§4.1: 500ms, 10px movement tolerance)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const didTriggerHoldRef = useRef(false);

  const clearHoldTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary mouse button or single touch pointer
    if (e.button !== 0 && e.pointerType === "mouse") return;
    didTriggerHoldRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };

    timerRef.current = setTimeout(() => {
      didTriggerHoldRef.current = true;
      setShowHelp(true);
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 10 || dy > 10) {
      // Exceeded movement tolerance (§4.1)
      clearHoldTimer();
    }
  };

  const handlePointerUp = () => {
    clearHoldTimer();
  };

  const handlePointerCancel = () => {
    clearHoldTimer();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (didTriggerHoldRef.current) {
      // Consume synthetic click after successful hold (§4.1)
      e.stopPropagation();
      e.preventDefault();
      didTriggerHoldRef.current = false;
      return;
    }

    onClickCard?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClickCard?.();
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        role={onClickCard ? "button" : "region"}
        tabIndex={onClickCard ? 0 : undefined}
        aria-label={`${title} metric`}
        className={`card-midnight p-4 sm:p-5 flex flex-col justify-between cursor-pointer bg-[#202122] border border-[#3A3D3E] hover:border-[#737978] transition-colors rounded-[10px] select-text relative ${className}`}
      >
        {/* Top Label Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C1C5C1]">
              {title}
            </span>

            {/* Accessible Info Action Button (Single tap/click, >=44px hit area per §4.1) */}
            {definition && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHelp(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    setShowHelp(true);
                  }
                }}
                className="w-11 h-11 -m-3 flex items-center justify-center rounded-full text-[#A1A9A5] hover:text-[#DDB66D] transition-colors focus:outline-none focus:ring-1 focus:ring-[#DDB66D]"
                aria-label={definition.accessibleLabel}
                title={definition.accessibleLabel}
              >
                <HelpCircle className="w-3.5 h-3.5 pointer-events-none" />
              </button>
            )}
          </div>

          {badge && <div>{badge}</div>}
        </div>

        {/* Value Row */}
        <div className="my-1.5 sm:my-2">
          <div className="text-3xl sm:text-4xl font-mono font-medium text-[#ECECE7] tracking-tight">
            {value}
          </div>
          {subtitle && (
            <div className="text-[11px] text-[#A1A9A5] mt-0.5 leading-snug">
              {subtitle}
            </div>
          )}
        </div>

        {/* Mini chart row */}
        {miniChart && <div className="mt-1">{miniChart}</div>}
      </div>

      {/* Metric Help Popover */}
      {definition && (
        <MetricHelpPopover
          metric={definition}
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          onSeeCalculation={onOpenEvidence}
        />
      )}
    </>
  );
}
