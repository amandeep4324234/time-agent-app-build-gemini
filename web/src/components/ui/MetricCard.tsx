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
        role={onClickCard ? "group" : "region"}
        tabIndex={onClickCard ? 0 : undefined}
        aria-label={`${title} metric`}
        className={`tf-card tf-metric p-4 min-h-[128px] flex flex-col justify-between cursor-pointer bg-[#202122] border border-[#3A3D3E] hover:border-[#737978] transition-colors rounded-[10px] select-text relative ${className}`}
      >
        {/* 1. Top Heading Row: Title & Accessible Info Icon */}
        <div className="tf-metric-heading flex items-center justify-between gap-2">
          <h2 className="m-0 text-[14px] font-medium text-[#C1C5C1]">
            {title}
          </h2>

          <div className="flex items-center gap-1.5">
            {badge && <div>{badge}</div>}

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
                className="w-6 h-6 -mr-1 flex items-center justify-center rounded-full text-[#A1A9A5] hover:text-[#DDB66D] transition-colors focus:outline-none"
                aria-label={definition.accessibleLabel}
                title={definition.accessibleLabel}
              >
                <HelpCircle className="w-3.5 h-3.5 pointer-events-none" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Middle Row: Metric Value on Left, Microchart on Right */}
        <div className="tf-metric-value-row flex items-center justify-between gap-3 min-w-0 my-1">
          <div className="tf-metric-value font-medium leading-tight whitespace-nowrap text-[#ECECE7]">
            {value}
          </div>
          {miniChart && <div className="tf-microchart shrink-0">{miniChart}</div>}
        </div>

        {/* 3. Bottom Meta Scope Line */}
        {subtitle && (
          <div className="tf-meta text-[13px] text-[#A1A9A5] leading-normal m-0 mt-1">
            {subtitle}
          </div>
        )}
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
