"use client";

import React, { useState } from "react";
import { Sparkles, HelpCircle, MoreHorizontal, Check, RefreshCw, EyeOff, Power } from "lucide-react";
import { ReflectionResult, ReflectionTone } from "@/lib/reflection-service";

interface ReflectionCardProps {
  reflection: ReflectionResult | null;
  onSelectTone: (tone: ReflectionTone) => void;
  onRefresh: () => void;
  onDismiss: () => void;
  onTurnOff: () => void;
}

export function ReflectionCard({
  reflection,
  onSelectTone,
  onRefresh,
  onDismiss,
  onTurnOff,
}: ReflectionCardProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (!reflection) return null;

  return (
    <div
      className="card-midnight ai-card-glow relative px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-colors border border-[#2B374B] bg-[#141A25]"
      role="region"
      aria-label="AI Observation"
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {/* Editorial AI Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#AAA9FF]/15 text-[#AAA9FF] text-xs font-semibold shrink-0 border border-[#AAA9FF]/30">
          <Sparkles className="w-3.5 h-3.5 text-[#AAA9FF]" />
          <span>{reflection.isLocalFallback ? "Local summary" : "Timeframe AI"}</span>
        </div>

        {/* Reflection Sentence (12–26 words, max 36) */}
        <p className="text-[#F2F5FB] font-normal leading-snug tracking-tight text-[15px] sm:text-[16px] truncate-2-lines flex-1">
          {reflection.text}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {/* Why this? Button */}
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="flex items-center gap-1 text-xs text-[#B8C4D8] hover:text-[#F2F5FB] px-2 py-1 rounded-[6px] hover:bg-[#1F2939] transition-colors border border-transparent hover:border-[#2B374B]"
          title="Inspect factual evidence behind this observation"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#AAA9FF]" />
          <span>Why this?</span>
        </button>

        {/* Overflow Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Observation options"
            className="p-1 rounded-[6px] text-[#96A5BD] hover:text-[#F2F5FB] hover:bg-[#1F2939] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 z-50 w-52 rounded-[10px] bg-[#1A2230] border border-[#2B374B] shadow-xl p-1.5 text-xs text-[#F2F5FB] flex flex-col gap-1">
              <div className="px-2 py-1 text-[11px] font-medium text-[#96A5BD] uppercase tracking-wider">
                Tone
              </div>
              {(["witty", "straight", "gentle"] as ReflectionTone[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    onSelectTone(t);
                    setShowMenu(false);
                  }}
                  className="flex items-center justify-between px-2 py-1.5 rounded-[6px] hover:bg-[#1F2939] capitalize transition-colors text-left"
                >
                  <span>{t === "straight" ? "Straight facts" : t}</span>
                  {reflection.tone === t && <Check className="w-3.5 h-3.5 text-[#AAA9FF]" />}
                </button>
              ))}

              <div className="h-[1px] bg-[#2B374B] my-1" />

              <button
                onClick={() => {
                  onRefresh();
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[#1F2939] text-[#B8C4D8] hover:text-[#F2F5FB] transition-colors text-left"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Next observation</span>
              </button>

              <button
                onClick={() => {
                  onDismiss();
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[#1F2939] text-[#B8C4D8] hover:text-[#F2F5FB] transition-colors text-left"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide today</span>
              </button>

              <button
                onClick={() => {
                  onTurnOff();
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[#1F2939] text-[#EE9DAA] hover:bg-[#EE9DAA]/10 transition-colors text-left"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Turn off AI reflection</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* "Why this?" Evidence Modal / Popover */}
      {showEvidence && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowEvidence(false)}
        >
          <div
            className="card-midnight w-full max-w-md p-5 bg-[#141A25] border border-[#53637D] shadow-2xl flex flex-col gap-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2B374B] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#AAA9FF]" />
                <h3 className="text-sm font-semibold text-[#F2F5FB]">Observation Evidence</h3>
              </div>
              <button
                onClick={() => setShowEvidence(false)}
                className="text-xs text-[#96A5BD] hover:text-[#F2F5FB] px-2 py-1 rounded-[6px]"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-[#B8C4D8]">
              <div>
                <span className="font-semibold text-[#F2F5FB] block mb-1">Generated Reflection</span>
                <p className="italic text-[#F2F5FB] bg-[#0B0E14] p-2.5 rounded-[8px] border border-[#2B374B]">
                  &ldquo;{reflection.text}&rdquo;
                </p>
              </div>

              <div>
                <span className="font-semibold text-[#F2F5FB] block mb-1">Factual Grounding</span>
                <p>{reflection.evidenceExplanation}</p>
              </div>

              <div className="p-2.5 rounded-[8px] bg-[#1A2230] border border-[#2B374B] flex flex-col gap-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#96A5BD]">Supporting Fact ID:</span>
                  <span className="font-mono text-[#F2F5FB]">{reflection.supportingFactIds[0] || "fact-general"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#96A5BD]">Data Revision:</span>
                  <span className="font-mono text-[#AAA9FF]">{reflection.revisionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#96A5BD]">Provider Mode:</span>
                  <span className="text-[#F2F5FB]">Local deterministic summary</span>
                </div>
              </div>

              <p className="text-[11px] text-[#96A5BD]">
                All arithmetic and comparisons are validated by the deterministic engine. Reflections invalidate and recompute immediately whenever you review or correct activity.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
