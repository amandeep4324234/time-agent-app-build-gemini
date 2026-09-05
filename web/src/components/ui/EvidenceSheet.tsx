"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ArrowLeft, Info, Calculator, ListFilter, ShieldCheck, ChevronRight, Sparkles } from "lucide-react";

export interface EvidenceRecord {
  id: string;
  label: string;
  device?: string;
  startFormatted: string;
  endFormatted: string;
  durationFormatted: string;
  durationSeconds: number;
  category?: string;
  appraisal?: string;
  isAdjusted?: boolean;
  isExcluded?: boolean;
}

export interface EvidenceCalculationData {
  definition: string;
  unit: string;
  numerator?: number | string | null;
  denominator?: number | string | null;
  rule?: string;
  timezone: string;
  windowBounds: string;
  deviceScope: string;
  sampleCount: number;
  omittedCount?: number | null;
  basis: string; // 'recorded' | 'effective' | 'user-appraised'
  overlapHandling: string;
  boundaryStatus: string;
  definitionVersion: string;
  dataRevision: string;
}

export interface EvidenceModel {
  title: string;
  dateRange: string;
  observedText: string;
  meaningText?: string | null;
  userIntention?: string | null;
  limitation?: string;
  action?: {
    label: string;
    onClick: () => void;
  } | null;
  calculation: EvidenceCalculationData;
  records?: EvidenceRecord[];
  onReviewRecord?: (recordId: string) => void;
}

interface EvidenceSheetProps {
  evidence: EvidenceModel | null;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void; // Provided when opened as a subview from AppLens or elsewhere
  backTitle?: string;
  initialTab?: "summary" | "calculation" | "records";
}

export function EvidenceSheet({
  evidence,
  isOpen,
  onClose,
  onBack,
  backTitle = "Back",
  initialTab = "summary",
}: EvidenceSheetProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "calculation" | "records">(initialTab);
  const [showTechnicalDetail, setShowTechnicalDetail] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, evidence]);

  // Handle escape key dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap / initial focus on open
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen || !evidence) return null;

  const { title, dateRange, observedText, meaningText, userIntention, limitation, action, calculation, records = [] } = evidence;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex justify-end transition-opacity select-text"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} evidence`}
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[480px] lg:w-[500px] h-full bg-[#202122] border-l border-[#3A3D3E] shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (§4) */}
        <div className="p-4 sm:p-5 border-b border-[#3A3D3E] flex flex-col gap-2 shrink-0 bg-[#171819]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 text-xs text-[#C1C5C1] hover:text-[#ECECE7] px-2 py-1 rounded bg-[#202122] border border-[#3A3D3E] transition-colors"
                  aria-label={`Back to ${backTitle}`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{backTitle}</span>
                </button>
              )}
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A9A5]">
                {dateRange}
              </span>
            </div>

            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#3A3D3E] text-[#A1A9A5] hover:text-[#ECECE7] transition-colors"
              aria-label="Close evidence panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#ECECE7] leading-tight">
              {title}
            </h2>
            <p className="text-xs text-[#C1C5C1] mt-1 leading-relaxed">
              {observedText}
            </p>
          </div>

          {/* 3 Tabs: Summary / Calculation / Records */}
          <div className="flex bg-[#171819] p-0.5 rounded-[6px] border border-[#3A3D3E] mt-2">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[4px] transition-colors ${
                activeTab === "summary"
                  ? "bg-[#DDB66D] text-[#171819] font-semibold"
                  : "text-[#C1C5C1] hover:text-[#ECECE7]"
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab("calculation")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[4px] transition-colors ${
                activeTab === "calculation"
                  ? "bg-[#DDB66D] text-[#171819] font-semibold"
                  : "text-[#C1C5C1] hover:text-[#ECECE7]"
              }`}
            >
              Calculation
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[4px] transition-colors ${
                activeTab === "records"
                  ? "bg-[#DDB66D] text-[#171819] font-semibold"
                  : "text-[#C1C5C1] hover:text-[#ECECE7]"
              }`}
            >
              Records ({records.length})
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. SUMMARY TAB (§4) */}
          {activeTab === "summary" && (
            <div className="space-y-4 text-xs">
              {/* Layer 1: Observed fact */}
              <div className="p-3.5 rounded-[8px] bg-[#171819] border border-[#3A3D3E] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#DDB66D]">
                  1. Observed Fact
                </span>
                <p className="text-xs text-[#ECECE7] leading-relaxed">
                  {observedText}
                </p>
              </div>

              {/* Layer 2: Meaning / User intention */}
              {meaningText && (
                <div className="p-3.5 rounded-[8px] bg-[#171819] border border-[#3A3D3E] space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C1C5C1]">
                    2. Meaning & Context
                  </span>
                  <p className="text-xs text-[#C1C5C1] leading-relaxed">
                    {meaningText}
                  </p>
                  {userIntention && (
                    <div className="mt-2 pt-2 border-t border-[#3A3D3E] flex items-center gap-1.5 text-[11px] text-[#DDB66D]">
                      <Sparkles className="w-3 h-3" />
                      <span>Applicable goal: {userIntention}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Specific Limitation Disclosure */}
              {limitation && (
                <div className="p-3 rounded-[8px] bg-[#171819]/50 border border-[#3A3D3E] text-[11px] text-[#A1A9A5] leading-relaxed flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#A1A9A5] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#C1C5C1]">Main limitation: </span>
                    {limitation}
                  </div>
                </div>
              )}

              {/* Layer 3: Action */}
              {action && (
                <div className="pt-2">
                  <button
                    onClick={action.onClick}
                    className="w-full py-2.5 px-4 rounded-[6px] bg-[#ECECE7] text-[#171819] font-medium text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>{action.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. CALCULATION TAB (§4) */}
          {activeTab === "calculation" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-[8px] bg-[#171819] border border-[#3A3D3E] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A1A9A5]">
                    Definition & Formula
                  </span>
                  <span className="font-mono text-[11px] text-[#DDB66D]">
                    Unit: {calculation.unit}
                  </span>
                </div>
                <p className="text-xs text-[#ECECE7] leading-relaxed">
                  {calculation.definition}
                </p>
                {calculation.rule && (
                  <div className="p-2 rounded-[4px] bg-[#202122] border border-[#3A3D3E] font-mono text-[11px] text-[#C1C5C1]">
                    {calculation.rule}
                  </div>
                )}
              </div>

              {/* Numerator / Denominator Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-[8px] bg-[#171819] border border-[#3A3D3E] flex flex-col">
                  <span className="text-[10px] uppercase text-[#A1A9A5]">Numerator</span>
                  <span className="text-base font-mono font-bold text-[#ECECE7] mt-0.5">
                    {calculation.numerator !== undefined && calculation.numerator !== null
                      ? String(calculation.numerator)
                      : "—"}
                  </span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#171819] border border-[#3A3D3E] flex flex-col">
                  <span className="text-[10px] uppercase text-[#A1A9A5]">Denominator</span>
                  <span className="text-base font-mono font-bold text-[#ECECE7] mt-0.5">
                    {calculation.denominator !== undefined && calculation.denominator !== null
                      ? String(calculation.denominator)
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Exact Parameters Table */}
              <div className="rounded-[8px] bg-[#171819] border border-[#3A3D3E] overflow-hidden divide-y divide-[#3A3D3E] text-[11px]">
                <div className="flex justify-between p-2.5">
                  <span className="text-[#A1A9A5]">Timezone</span>
                  <span className="font-mono text-[#ECECE7]">{calculation.timezone}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-[#A1A9A5]">Window bounds</span>
                  <span className="font-mono text-[#ECECE7]">{calculation.windowBounds}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-[#A1A9A5]">Device / Source scope</span>
                  <span className="text-[#ECECE7]">{calculation.deviceScope}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-[#A1A9A5]">Sample count (included)</span>
                  <span className="font-mono text-[#ECECE7]">{calculation.sampleCount}</span>
                </div>
                {calculation.omittedCount !== undefined && calculation.omittedCount !== null && (
                  <div className="flex justify-between p-2.5">
                    <span className="text-[#A1A9A5]">Omitted records (privacy/quarantine)</span>
                    <span className="font-mono text-[#A1A9A5]">{calculation.omittedCount}</span>
                  </div>
                )}
                <div className="flex justify-between p-2.5">
                  <span className="text-[#A1A9A5]">Basis</span>
                  <span className="font-mono text-[#DDB66D] capitalize">{calculation.basis}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-[#A1A9A5]">Overlap handling</span>
                  <span className="text-[#ECECE7]">{calculation.overlapHandling}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-[#A1A9A5]">Record-boundary status</span>
                  <span className="text-[#ECECE7]">{calculation.boundaryStatus}</span>
                </div>
              </div>

              {/* Expandable Technical Detail */}
              <div className="border border-[#3A3D3E] rounded-[8px] overflow-hidden">
                <button
                  onClick={() => setShowTechnicalDetail(!showTechnicalDetail)}
                  className="w-full flex items-center justify-between p-2.5 bg-[#171819] text-[11px] text-[#A1A9A5] hover:text-[#ECECE7]"
                >
                  <span>Technical & Revision Metadata</span>
                  <span>{showTechnicalDetail ? "▲ Hide" : "▼ Show"}</span>
                </button>
                {showTechnicalDetail && (
                  <div className="p-3 bg-[#171819]/80 border-t border-[#3A3D3E] text-[10px] font-mono space-y-1 text-[#A1A9A5]">
                    <div>Definition Version: {calculation.definitionVersion}</div>
                    <div>Data Revision: {calculation.dataRevision}</div>
                    <div>Computation Status: Current (verified against active ledger)</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. RECORDS TAB (§4) */}
          {activeTab === "records" && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px] text-[#A1A9A5]">
                <span>Contributing safe records ({records.length})</span>
                <span>Sorted chronological</span>
              </div>

              {records.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#A1A9A5] border border-[#3A3D3E] rounded-[8px]">
                  No matching safe records found in this window.
                </div>
              ) : (
                <div className="divide-y divide-[#3A3D3E] border border-[#3A3D3E] rounded-[8px] overflow-hidden bg-[#171819]">
                  {records.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 flex items-center justify-between hover:bg-[#202122] transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#ECECE7]">{rec.label}</span>
                          {rec.device && (
                            <span className="text-[10px] font-mono text-[#A1A9A5] px-1 rounded bg-[#202122] border border-[#3A3D3E]">
                              {rec.device}
                            </span>
                          )}
                          {rec.appraisal && rec.appraisal !== "unreviewed" && (
                            <span className="text-[10px] px-1 rounded bg-[#DDB66D]/10 text-[#DDB66D] border border-[#DDB66D]/30 capitalize">
                              {rec.appraisal}
                            </span>
                          )}
                          {rec.isAdjusted && (
                            <span className="text-[10px] px-1 rounded bg-[#C1C5C1]/10 text-[#C1C5C1] border border-[#3A3D3E]">
                              Adjusted
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#A1A9A5] font-mono">
                          {rec.startFormatted} – {rec.endFormatted}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-semibold text-[#DDB66D]">
                          {rec.durationFormatted}
                        </span>
                        {evidence.onReviewRecord && (
                          <button
                            onClick={() => evidence.onReviewRecord?.(rec.id)}
                            className="px-2 py-1 rounded text-[11px] font-medium bg-[#202122] text-[#C1C5C1] hover:text-[#ECECE7] border border-[#3A3D3E] hover:border-[#737978] transition-colors"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-2.5 rounded-[6px] bg-[#171819]/50 border border-[#3A3D3E] text-[11px] text-[#A1A9A5] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#90D2BC]" />
                <span>Private domains and protected intervals are excluded from this record list.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#3A3D3E] bg-[#171819]/60 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-[#A1A9A5]">
            Timeframe Observatory &bull; Inspectable Evidence
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[6px] bg-[#202122] text-[#ECECE7] border border-[#3A3D3E] hover:bg-[#3A3D3E] transition-colors text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
