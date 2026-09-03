"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface Option<T extends string | number> {
  label: string;
  value: T;
  subLabel?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  name?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex p-1 rounded-full border border-[#222735] bg-[#0A0C10] max-w-full overflow-x-auto",
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-[40px] px-4 rounded-full text-xs font-medium transition-all duration-150 flex flex-col items-center justify-center min-w-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]",
              isSelected
                ? "bg-[#1E2538] text-[#F8FAFC] shadow-sm font-semibold"
                : "text-[#94A3B8] hover:text-[#F8FAFC] bg-transparent"
            )}
          >
            <span>{opt.label}</span>
            {opt.subLabel && (
              <span className="text-[10px] text-[#64748B] font-mono leading-none mt-0.5">
                {opt.subLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
