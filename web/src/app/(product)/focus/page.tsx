"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  CheckCircle2,
  Clock,
  Tag,
  ArrowRight,
  Plus,
  RefreshCw,
  HelpCircle,
  Filter,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { Envelope } from "@/lib/types";
import { FocusBlock, calculateBlockElapsedSeconds } from "@/lib/focus-blocks";
import { formatDurationSeconds } from "@/lib/format";
import { FocusStartSheet } from "@/components/focus/FocusStartSheet";
import { FocusActiveView } from "@/components/focus/FocusActiveView";
import { FocusReviewWorkspace } from "@/components/focus/FocusReviewWorkspace";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;

export default function FocusBlocksPage() {
  const {
    focusBlocks,
    activeBlockId,
    startFocusBlock,
    pauseCurrentBlock,
    resumeCurrentBlock,
    finishCurrentBlock,
    commitReviewBatch,
    updateFocusBlock,
    correctionBatches,
    classificationRules,
    addClassificationRule,
    seedPins,
    overrides,
  } = useAppStore();

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [reviewingBlockId, setReviewingBlockId] = useState<string | null>(null);

  // Raw ledger sessions for review slicing
  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  const activeBlock = useMemo(() => {
    return focusBlocks.find((b) => b.id === activeBlockId && (b.state === "running" || b.state === "paused")) || null;
  }, [focusBlocks, activeBlockId]);

  const reviewingBlock = useMemo(() => {
    return focusBlocks.find((b) => b.id === reviewingBlockId) || null;
  }, [focusBlocks, reviewingBlockId]);

  // If a block is active and the user is on /focus, show active view
  const [isShowingActiveView, setIsShowingActiveView] = useState(false);

  // Flatten applied correction events
  const appliedCorrections = useMemo(() => {
    return correctionBatches.flatMap((b) => b.operations);
  }, [correctionBatches]);

  return (
    <div className="flex flex-col gap-6 select-text max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2B374B] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F2F5FB] tracking-tight">
            Focus Blocks
          </h1>
          <p className="text-sm text-[#96A5BD] mt-1">
            Intentional containers with goals, timer tracking, and post-session review.
          </p>
        </div>

        <button
          onClick={() => setIsStartOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#AAA9FF] text-[#0B0E14] hover:bg-[#D0CEFF] transition-colors text-sm font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Start new block</span>
        </button>
      </div>

      {/* Active Running Block Banner */}
      {activeBlock && (
        <div className="card-midnight p-5 bg-[#141A25] border border-[#AAA9FF]/60 shadow-[0_0_16px_rgba(170,169,255,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-3 h-3 rounded-full bg-[#7CDCE5] animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#AAA9FF]">
                  {activeBlock.state === "running" ? "Currently Active" : "Paused"}
                </span>
                <span className="text-xs text-[#96A5BD]">
                  &bull; {formatDurationSeconds(calculateBlockElapsedSeconds(activeBlock))} elapsed
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#F2F5FB] mt-0.5">
                {activeBlock.title || "Untitled focus block"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              onClick={() => setIsShowingActiveView(true)}
              className="px-4 py-2 rounded-[8px] bg-[#AAA9FF] text-[#0B0E14] text-xs font-bold hover:bg-[#D0CEFF] transition-colors"
            >
              Open Active Surface
            </button>
            <button
              onClick={() => {
                const finished = finishCurrentBlock();
                if (finished) setReviewingBlockId(finished.id);
              }}
              className="px-3.5 py-2 rounded-[8px] bg-[#1A2230] border border-[#2B374B] text-xs font-semibold text-[#EE9DAA] hover:bg-[#EE9DAA]/10 transition-colors"
            >
              Finish & Review
            </button>
          </div>
        </div>
      )}

      {/* Completed & Recorded Focus Blocks List */}
      <div className="card-midnight p-5 sm:p-6 bg-[#141A25] border border-[#2B374B] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#2B374B] pb-3">
          <h2 className="text-base font-semibold text-[#F2F5FB]">Block History</h2>
          <span className="text-xs text-[#96A5BD]">
            {focusBlocks.length} recorded blocks
          </span>
        </div>

        {focusBlocks.length === 0 ? (
          <div className="text-center py-12 text-[#96A5BD] flex flex-col items-center gap-2">
            <Clock className="w-8 h-8 text-[#96A5BD]/40" />
            <p className="text-sm">No focus blocks recorded yet.</p>
            <button
              onClick={() => setIsStartOpen(true)}
              className="text-xs text-[#AAA9FF] hover:underline font-semibold mt-1"
            >
              Start your first block
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {focusBlocks.map((block) => {
              const elapsedSec = calculateBlockElapsedSeconds(block);
              const isReviewed = block.state === "reviewed";

              return (
                <div
                  key={block.id}
                  className="p-4 rounded-[12px] bg-[#1A2230] border border-[#2B374B] hover:border-[#53637D] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="pt-0.5 shrink-0">
                      {isReviewed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#90D2BC]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-[#AAA9FF]" />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#F2F5FB] truncate">
                          {block.title || "Untitled block"}
                        </h3>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            isReviewed
                              ? "bg-[#90D2BC]/10 text-[#90D2BC]"
                              : "bg-[#AAA9FF]/10 text-[#AAA9FF]"
                          }`}
                        >
                          {isReviewed ? "Reviewed" : "Awaiting Review"}
                        </span>
                      </div>

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#96A5BD]">
                        <span>{new Date(block.createdAtUtc).toLocaleDateString()}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[#F2F5FB]">
                          {formatDurationSeconds(elapsedSec)}
                        </span>
                        {block.plannedSeconds && (
                          <span className="text-[#96A5BD]">
                            (planned {Math.round(block.plannedSeconds / 60)}m)
                          </span>
                        )}
                        <span>&bull;</span>
                        <span className="text-[11px] text-[#7CDCE5]">{block.syncStatus || "saved_locally"}</span>
                      </div>

                      {block.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {block.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-[4px] bg-[#0B0E14] text-[10px] text-[#B8C4D8] border border-[#2B374B]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setReviewingBlockId(block.id)}
                      className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${
                        isReviewed
                          ? "bg-[#141A25] border border-[#2B374B] text-[#B8C4D8] hover:text-[#F2F5FB]"
                          : "bg-[#AAA9FF] text-[#0B0E14] hover:bg-[#D0CEFF]"
                      }`}
                    >
                      {isReviewed ? "Edit Review" : "Review Activity"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Start Focus Modal */}
      <FocusStartSheet
        isOpen={isStartOpen}
        onClose={() => setIsStartOpen(false)}
        onStart={({ title, plannedMinutes, tags, autoReview }) => {
          const newBlock = startFocusBlock(title, plannedMinutes, tags, autoReview);
          setIsShowingActiveView(true);
        }}
      />

      {/* Fullscreen Active Surface */}
      {isShowingActiveView && activeBlock && (
        <div className="fixed inset-0 z-50 bg-[#0B0E14] overflow-y-auto">
          <FocusActiveView
            block={activeBlock}
            onPause={pauseCurrentBlock}
            onResume={resumeCurrentBlock}
            onFinish={() => {
              const finished = finishCurrentBlock();
              setIsShowingActiveView(false);
              if (finished) setReviewingBlockId(finished.id);
            }}
            onReturnToOverview={() => setIsShowingActiveView(false)}
            onSaveForLater={() => setIsShowingActiveView(false)}
            onStartAnother={() => {
              setIsShowingActiveView(false);
              setIsStartOpen(true);
            }}
          />
        </div>
      )}

      {/* End-of-Block Review Workspace (§8) */}
      {reviewingBlock && (
        <FocusReviewWorkspace
          block={reviewingBlock}
          sessions={ledger}
          existingCorrections={appliedCorrections}
          existingRules={classificationRules}
          isOpen={true}
          onClose={() => setReviewingBlockId(null)}
          onSaveBatch={(ops, updated) => {
            commitReviewBatch(updated.id, ops);
            updateFocusBlock(updated.id, updated);
            setReviewingBlockId(null);
          }}
          onAddRule={addClassificationRule}
        />
      )}
    </div>
  );
}
