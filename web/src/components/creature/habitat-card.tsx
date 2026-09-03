"use client";

import React from "react";
import Link from "next/link";

interface HabitatCardProps {
  status?: "idle" | "focusing" | "broken";
  killerName?: string;
  isPaid?: boolean;
}

export function HabitatCard({
  status = "idle",
  killerName,
  isPaid = false,
}: HabitatCardProps) {
  return (
    <div className="p-6 rounded-lg border border-[#222735] bg-[#12151D] flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        {/* Creature Vector Graphic */}
        <div className="w-20 h-20 rounded-full bg-[#1E2538]/50 border border-[#333D52] flex items-center justify-center relative overflow-hidden flex-shrink-0">
          {status === "broken" ? (
            // Broken creature (neutral fact, not judgment)
            <svg viewBox="0 0 64 64" className="w-12 h-12 text-[#94A3B8]">
              <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="24" y1="26" x2="28" y2="30" stroke="currentColor" strokeWidth="2" />
              <line x1="28" y1="26" x2="24" y2="30" stroke="currentColor" strokeWidth="2" />
              <line x1="36" y1="26" x2="40" y2="30" stroke="currentColor" strokeWidth="2" />
              <line x1="40" y1="26" x2="36" y2="30" stroke="currentColor" strokeWidth="2" />
              <path d="M26 40 Q32 36 38 40" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : status === "focusing" ? (
            // Focusing creature (active accent #22D3EE)
            <svg viewBox="0 0 64 64" className="w-12 h-12 text-[#22D3EE] animate-pulse">
              <circle cx="32" cy="32" r="24" fill="#22D3EE/10" stroke="currentColor" strokeWidth="2" />
              <circle cx="25" cy="28" r="2.5" fill="currentColor" />
              <circle cx="39" cy="28" r="2.5" fill="currentColor" />
              <path d="M26 38 Q32 44 38 38" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : (
            // Idle / Egg
            <svg viewBox="0 0 64 64" className="w-12 h-12 text-[#94A3B8]">
              <ellipse cx="32" cy="34" rx="20" ry="24" fill="#1E2538" stroke="currentColor" strokeWidth="2" />
              <path d="M32 14 L30 22 L34 28" fill="none" stroke="#64748B" strokeWidth="1.5" strokeOpacity="0.6" />
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#F8FAFC]">Companion</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-[#222735] text-[#94A3B8]">
              {status === "broken"
                ? `ended on ${killerName || "sink"}`
                : status === "focusing"
                ? "in focus block"
                : "resting"}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] max-w-sm">
            {status === "broken"
              ? "The creature fell on a confirmed killer. It returns on the next focus block."
              : status === "focusing"
              ? "Block running. The companion stays alive while attention holds."
              : "Charm rides on the truth; it never carries it."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isPaid ? (
          <Link
            href="/checkout"
            className="text-xs text-[#22D3EE] hover:underline font-mono"
          >
            Upgrade to Pro for full creature growth →
          </Link>
        ) : (
          <span className="text-xs font-mono text-[#22D3EE] border border-[#22D3EE]/30 px-2.5 py-1 rounded-full">
            Pro active
          </span>
        )}
      </div>
    </div>
  );
}
