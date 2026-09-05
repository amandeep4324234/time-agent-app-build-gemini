"use client";

import React, { useState } from "react";
import { Sparkles, HelpCircle, MoreHorizontal, Check, RefreshCw, EyeOff, Power } from "lucide-react";
import { ReflectionResult, ReflectionTone } from "@/lib/reflection-service";
import { EvidenceModel, EvidenceSheet } from "../ui/EvidenceSheet";

interface ReflectionCardProps {
  reflection: ReflectionResult | null;
  onSelectTone: (tone: ReflectionTone) => void;
  onRefresh: () => void;
  onDismiss: () => void;
  onTurnOff: () => void;
  onOpenEvidence?: (model: EvidenceModel) => void;
}

export function ReflectionCard({
  reflection,
  onSelectTone,
  onRefresh,
  onDismiss,
  onTurnOff,
  onOpenEvidence,
}: ReflectionCardProps) {
  const [showEvidenceSheet, setShowEvidenceSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (!reflection) return null;

  const evidenceModel: EvidenceModel = {
    title: "AI Observation Evidence",
    dateRange: "Selected day · recorded activity",
    observedText: reflection.evidenceExplanation || reflection.text,
    meaningText: "Conditional interpretation derived from deterministic analysis and applicable intentions.",
    limitation: "Reflections describe recorded segments only; unobserved breaks or outside activity are not inferred.",
    calculation: {
      definition: "Deterministic fact packet matching approved fact templates.",
      unit: "derived",
      numerator: null,
      denominator: null,
      rule: "Validated factual statements without psychological or medical diagnosis.",
      timezone: "Asia/Kolkata",
      windowBounds: "Logical day bounds",
      deviceScope: "Paired active sources",
      sampleCount: reflection.supportingFactIds.length,
      basis: "effective",
      overlapHandling: "Interval union",
      boundaryStatus: "Recorded segment timestamps",
      definitionVersion: "1.2",
      dataRevision: reflection.revisionId,
    },
    records: [],
  };

  const handleWhyThis = () => {
    if (onOpenEvidence) {
      onOpenEvidence(evidenceModel);
    } else {
      setShowEvidenceSheet(true);
    }
  };

  return (
    <>
      <div
        className="card-midnight ai-card-glow relative px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-colors border border-[#3A3D3E] bg-[#202122] rounded-[10px] select-text"
        role="region"
        aria-label="AI Observation"
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          {/* Editorial Context Tag (§3.1: e.g. "This week · recorded activity" or "Timeframe AI") */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#171819] text-[#DDB66D] text-xs font-semibold shrink-0 border border-[#3A3D3E]">
            <Sparkles className="w-3.5 h-3.5 text-[#DDB66D]" />
            <span>{reflection.isLocalFallback ? "Local summary" : "Timeframe AI"}</span>
          </div>

          {/* Reflection Sentence */}
          <p className="text-[#ECECE7] font-normal leading-snug tracking-tight text-[14px] sm:text-[15px] flex-1">
            {reflection.text}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Why this? Button (§3.1: opens shared evidence panel) */}
          <button
            onClick={handleWhyThis}
            className="flex items-center gap-1 text-xs text-[#C1C5C1] hover:text-[#ECECE7] px-2.5 py-1 rounded-[6px] hover:bg-[#171819] transition-colors border border-transparent hover:border-[#3A3D3E]"
            title="Inspect factual evidence behind this observation"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#DDB66D]" />
            <span>Why this?</span>
          </button>

          {/* Overflow Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Observation options"
              className="p-1 rounded-[6px] text-[#A1A9A5] hover:text-[#ECECE7] hover:bg-[#171819] transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-50 w-52 rounded-[10px] bg-[#202122] border border-[#737978] shadow-2xl p-1.5 text-xs text-[#ECECE7] flex flex-col gap-1">
                <div className="px-2 py-1 text-[11px] font-medium text-[#A1A9A5] uppercase tracking-wider">
                  Tone
                </div>
                {(["witty", "straight", "gentle"] as ReflectionTone[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      onSelectTone(t);
                      setShowMenu(false);
                    }}
                    className="flex items-center justify-between px-2 py-1.5 rounded-[6px] hover:bg-[#171819] capitalize transition-colors text-left"
                  >
                    <span>{t === "straight" ? "Straight facts" : t}</span>
                    {reflection.tone === t && <Check className="w-3.5 h-3.5 text-[#DDB66D]" />}
                  </button>
                ))}

                <div className="h-[1px] bg-[#3A3D3E] my-1" />

                <button
                  onClick={() => {
                    onRefresh();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[#171819] text-[#C1C5C1] hover:text-[#ECECE7] transition-colors text-left"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Next observation</span>
                </button>

                <button
                  onClick={() => {
                    onDismiss();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[#171819] text-[#C1C5C1] hover:text-[#ECECE7] transition-colors text-left"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide today</span>
                </button>

                <button
                  onClick={() => {
                    onTurnOff();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[#171819] text-[#DFA095] hover:bg-[#DFA095]/10 transition-colors text-left"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Turn off AI reflection</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared Evidence Sheet fallback if not handled by parent */}
      <EvidenceSheet
        evidence={evidenceModel}
        isOpen={showEvidenceSheet}
        onClose={() => setShowEvidenceSheet(false)}
      />
    </>
  );
}
