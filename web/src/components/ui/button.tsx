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
      "inline-flex items-center justify-center font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0C10] disabled:pointer-events-none disabled:opacity-50 min-h-[48px] px-5 rounded-full select-none";

    const variantStyles = {
      primary: "bg-[#F8FAFC] text-[#0A0C10] hover:bg-[#E2E8F0] active:scale-[0.98]",
      secondary: "bg-transparent border border-[#333D52] text-[#E2E8F0] hover:bg-[#1E2538] active:scale-[0.98]",
      text: "bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] p-0 min-h-0",
      destructive: "bg-transparent border border-[#F43F5E] text-[#F43F5E] hover:bg-[#F43F5E]/10 active:scale-[0.98]",
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
