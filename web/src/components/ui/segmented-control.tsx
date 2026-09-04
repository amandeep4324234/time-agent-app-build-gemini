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
        "inline-flex p-0.5 rounded-[4px] border border-[#21262D] bg-[#161B22] max-w-full overflow-x-auto font-mono",
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
              "min-h-[28px] px-3 rounded-[2px] text-xs transition-colors duration-120 flex flex-col items-center justify-center min-w-[56px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D29922]",
              isSelected
                ? "bg-[#21262D] text-[#E6EDF3] font-semibold"
                : "text-[#8B949E] hover:text-[#E6EDF3] bg-transparent"
            )}
          >
            <span>{opt.label}</span>
            {opt.subLabel && (
              <span className="text-[10px] text-[#6E7681] font-mono leading-none mt-0.5">
                {opt.subLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
