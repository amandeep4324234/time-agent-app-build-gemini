import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "text" | "destructive";
  isLoading?: boolean;
  loadingLabel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, loadingLabel, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-mono text-xs transition-colors duration-120 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D29922] disabled:pointer-events-none disabled:opacity-40 min-h-[36px] px-4 rounded-[4px] select-none";

    const variantStyles = {
      primary: "bg-[#E6EDF3] text-[#0D1117] font-medium hover:bg-white active:bg-[#E6EDF3]",
      secondary: "bg-[#161B22] border border-[#21262D] text-[#E6EDF3] hover:bg-[#1C2128] hover:border-[#8B949E]/40",
      text: "bg-transparent text-[#8B949E] hover:text-[#E6EDF3] p-0 min-h-0",
      destructive: "bg-[#161B22] border border-[#F85149] text-[#F85149] hover:bg-[#F85149]/10",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? loadingLabel || "Loading..." : children}
      </button>
    );
  }
);

Button.displayName = "Button";
