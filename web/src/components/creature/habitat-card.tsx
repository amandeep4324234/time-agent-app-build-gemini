"use client";

import React, { useState } from "react";
import Link from "next/link";
import { maskFencedLabel } from "@/lib/format";

export interface HabitatCardProps {
  status?: "idle" | "focusing" | "broken" | "empty" | "loading";
  killerName?: string;
  timeOfDeath?: string;
  minutesSurvived?: number;
  minutesGrownToday?: number;
  isLightDay?: boolean;
  isNoData?: boolean;
  isPaid?: boolean;
}

export function HabitatCard({
  status = "idle",
  killerName,
  timeOfDeath = "2:47pm",
  minutesSurvived = 18,
  minutesGrownToday = 45,
  isLightDay = false,
  isNoData = false,
  isPaid = false,
}: HabitatCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isDead = status === "broken";
  const isAlive = status === "focusing";
  const maskedKiller = killerName ? maskFencedLabel(killerName) : "sink";
  const isFencedKiller = maskedKiller === "private";

  // Geometry: flat 1px-stroke line creature, 56dp max (UI.md §2.4)
  const strokeColor = isDead ? "#6E7681" : "#D29922"; // amber alive, fg-muted dead

  const deathText = isFencedKiller
    ? `Killed by private — ${timeOfDeath}`
    : `Killed by ${maskedKiller} — ${timeOfDeath}`;

  return (
    <div className="py-2.5 px-3 bg-[#161B22] border border-[#21262D] rounded-[4px] font-mono text-xs flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Flat 1px-stroke line creature (56dp / 56px max) */}
        <div
          onClick={() => setShowDetails(!showDetails)}
          className={`w-12 h-12 flex-shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-120 ${
            isLightDay ? "opacity-50" : ""
          }`}
          title={isDead ? "Tap for death details" : "Tap for minutes grown"}
        >
          {status === "loading" ? (
            // Loading / egg: hairline outline
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <ellipse
                cx="22"
                cy="24"
                rx="14"
                ry="18"
                stroke="#21262D"
                strokeWidth="1"
              />
            </svg>
          ) : isDead ? (
            // Dead creature: fg-muted 1px stroke geometry, no face
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <polygon
                points="22,6 38,20 30,38 14,38 6,20"
                stroke="#6E7681"
                strokeWidth="1"
              />
              <line x1="16" y1="20" x2="28" y2="20" stroke="#6E7681" strokeWidth="1" />
              <line x1="16" y1="26" x2="28" y2="26" stroke="#6E7681" strokeWidth="1" />
            </svg>
          ) : isAlive ? (
            // Alive creature: amber #D29922 1px stroke geometry
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <polygon
                points="22,6 38,20 30,38 14,38 6,20"
                stroke="#D29922"
                strokeWidth="1"
              />
              <polygon
                points="22,14 30,22 26,32 18,32 14,22"
                stroke="#D29922"
                strokeWidth="1"
              />
            </svg>
          ) : (
            // Idle geometry
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <ellipse
                cx="22"
                cy="22"
                rx="16"
                ry="16"
                stroke={strokeColor}
                strokeWidth="1"
              />
              <line x1="12" y1="22" x2="32" y2="22" stroke={strokeColor} strokeWidth="1" />
            </svg>
          )}
        </div>

        {/* Status text */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#8B949E]">
              CREATURE
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-[2px] border ${
                isDead
                  ? "border-[#6E7681] text-[#6E7681]"
                  : "border-[#D29922] text-[#D29922]"
              }`}
            >
              {isDead ? "dead" : isAlive ? "alive" : "idle"}
            </span>
            {isLightDay && (
              <span className="text-[10px] text-[#6E7681]">light day</span>
            )}
          </div>

          <div className="text-[11px] text-[#E6EDF3]">
            {isDead ? deathText : `${minutesGrownToday}m grown today`}
          </div>

          {/* Details modal/popover text if tapped */}
          {showDetails && (
            <div className="text-[10px] text-[#8B949E] pt-0.5 animate-in fade-in duration-120">
              {isDead
                ? `Survived ${minutesSurvived}m before ${maskedKiller}. Revives after run >= 15m.`
                : `${minutesGrownToday} focus minutes accumulated.`}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!isPaid ? (
          <Link
            href="/checkout"
            className="text-[11px] text-[#8B949E] hover:text-[#E6EDF3] underline underline-offset-2"
          >
            Pro feature
          </Link>
        ) : (
          <span className="text-[10px] text-[#D29922] border border-[#D29922]/30 px-1.5 py-0.5 rounded-[2px]">
            Pro
          </span>
        )}
      </div>
    </div>
  );
}
