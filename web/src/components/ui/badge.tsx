import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-[2px] border border-[#21262D] px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider text-[#8B949E] bg-[#161B22]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
