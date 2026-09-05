"use client";

import React, { useEffect, useRef } from "react";
import { X, HelpCircle, ChevronRight } from "lucide-react";
import { MetricDefinition } from "@/lib/metric-registry";

interface MetricHelpPopoverProps {
  metric: MetricDefinition;
  isOpen: boolean;
  onClose: () => void;
  onSeeCalculation?: () => void;
  anchorRect?: DOMRect | null;
}

export function MetricHelpPopover({
  metric,
  isOpen,
  onClose,
  onSeeCalculation,
  anchorRect,
}: MetricHelpPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex sm:items-center justify-center p-4 bg-black/40 sm:bg-transparent"
      role="dialog"
      aria-modal="true"
      aria-label={metric.accessibleLabel}
    >
      <div
        ref={popoverRef}
        className="w-full max-w-[340px] bg-[#202122] border border-[#737978] shadow-2xl rounded-[10px] p-4 flex flex-col gap-3 my-auto animate-in fade-in zoom-in-95 duration-100 select-text"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3A3D3E] pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DDB66D]" />
            <h3 className="text-sm font-semibold text-[#ECECE7]">{metric.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#A1A9A5] hover:text-[#ECECE7] hover:bg-[#3A3D3E] transition-colors -mr-1"
            aria-label="Close metric explanation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (§4.1: Plain language, 16px body text, 14px labels) */}
        <div className="space-y-2.5 text-xs text-[#C1C5C1]">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A9A5]">
              What it means
            </div>
            <p className="text-sm text-[#ECECE7] leading-relaxed mt-0.5">
              {metric.meaning}
            </p>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A9A5]">
              How we count it
            </div>
            <p className="text-xs text-[#C1C5C1] leading-relaxed mt-0.5">
              {metric.countingRule}
            </p>
          </div>

          {metric.limitation && (
            <div className="p-2 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[11px] text-[#A1A9A5] leading-relaxed">
              <span className="font-semibold text-[#C1C5C1]">Limitation: </span>
              {metric.limitation}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-[#3A3D3E]">
          {onSeeCalculation ? (
            <button
              onClick={() => {
                onClose();
                onSeeCalculation();
              }}
              className="flex items-center gap-1 text-xs text-[#DDB66D] hover:underline font-semibold"
            >
              <span>See calculation</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span />
          )}

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-[6px] bg-[#171819] text-[#ECECE7] border border-[#3A3D3E] hover:bg-[#3A3D3E] text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
