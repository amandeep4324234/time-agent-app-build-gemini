import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border border-[#222735] px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] bg-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
