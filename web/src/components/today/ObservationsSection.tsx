"use client";

import React from "react";
import { EvaluatedInsight } from "@/lib/observations";
import { ChevronRight, Sparkles } from "lucide-react";

interface ObservationsSectionProps {
  observations: EvaluatedInsight[];
  summaryInsightKey?: string;
  onOpenEvidence: (evidence: EvaluatedInsight["evidence"]) => void;
}

export function ObservationsSection({
  observations,
  summaryInsightKey,
  onOpenEvidence,
}: ObservationsSectionProps) {
  // Deduplicate against summary insight (§6.3)
  const filtered = observations.filter((obs) => obs.insight.key !== summaryInsightKey);
  const displayed = filtered.slice(0, 3);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 rounded-[10px] border border-[#303B49] bg-[#141A22] h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#303B49]">
        <h3 className="text-base font-semibold text-[#EDF1F5] tracking-tight">
          What stands out
        </h3>
        <span className="text-xs text-[#94A1B2]">All devices</span>
      </div>

      {displayed.length > 0 ? (
        <div className="flex flex-col gap-3">
          {displayed.map((item) => (
            <div
              key={item.insight.key}
              className="p-3.5 rounded-[6px] border border-[#303B49] bg-[#0D1117] flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-[#EDF1F5] leading-relaxed">
                  {item.insight.sentence}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenEvidence(item.evidence)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B0BBC9] hover:text-[#EDF1F5] shrink-0 mt-0.5 transition-colors"
                >
                  <span>View evidence</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="text-[11px] text-[#94A1B2]">
                Evaluated over {item.insight.windowLabel} · {item.insight.sampleCount} recorded {item.insight.sampleCount === 1 ? "sample" : "samples"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Quiet empty state (§6.3) */
        <div className="p-6 text-center text-xs text-[#94A1B2] flex flex-col items-center justify-center gap-2">
          <span>No standout behavioral deviations recorded for this day.</span>
        </div>
      )}
    </div>
  );
}
