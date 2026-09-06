"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
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

  // Search and date filtering
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter blocks by search
  const filteredBlocks = useMemo(() => {
    if (!searchQuery.trim()) return focusBlocks;
    const q = searchQuery.toLowerCase().trim();
    return focusBlocks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [focusBlocks, searchQuery]);

  // Group focus blocks by day
  const blocksByDay = useMemo(() => {
    const map = new Map<string, typeof focusBlocks>();
    for (const b of filteredBlocks) {
      const dateStr = DateTime.fromISO(b.createdAtUtc, { zone: "Asia/Kolkata" }).isValid
        ? DateTime.fromISO(b.createdAtUtc, { zone: "Asia/Kolkata" }).toFormat("cccc, d LLLL yyyy")
        : b.createdAtUtc.slice(0, 10);
      const list = map.get(dateStr) || [];
      list.push(b);
      map.set(dateStr, list);
    }
    return Array.from(map.entries());
  }, [filteredBlocks]);

  return (
    <div className="flex flex-col gap-6 select-text max-w-5xl mx-auto">
      {/* 1. Shared Header (START-HERE.md §7.3) */}
      <div className="tf-header flex flex-wrap items-center justify-between gap-4 border-b border-[#3A3D3E] pb-4">
        <div>
          <h1 className="tf-title text-[28px] font-semibold text-[#ECECE7] leading-tight m-0 mb-1">
            Focus blocks
          </h1>
          <p className="text-[14px] text-[#C1C5C1] m-0">
            Plan, track and review your focused work.
          </p>
        </div>

        {/* Right: + Start focus (Primary off-white action) */}
        <button
          onClick={() => setIsStartOpen(true)}
          className="tf-button tf-button-primary min-h-[44px] px-5 py-2.5 rounded-[6px] bg-[#ECECE7] text-[#171819] hover:bg-white text-[14px] font-medium flex items-center gap-2 transition-colors border-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start focus</span>
        </button>
      </div>

      {/* Optional Search Input (44px high, §7.3) */}
      <div className="w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search focus blocks by title or tag…"
          className="w-full h-[44px] px-4 rounded-[6px] bg-[#141516] border border-[#3A3D3E] text-[14px] text-[#ECECE7] placeholder-[#A1A9A5] focus:outline-none focus:border-[#737978]"
        />
      </div>

      {/* Active Running Block Banner */}
      {activeBlock && (
        <div className="tf-card p-4 rounded-[10px] bg-[#202122] border border-[#737978] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-3 h-3 rounded-full bg-[#DDB66D] shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium uppercase tracking-wider text-[#DDB66D]">
                  {activeBlock.state === "running" ? "Currently Active" : "Paused"}
                </span>
                <span className="text-[13px] text-[#A1A9A5]">
                  &bull; {formatDurationSeconds(calculateBlockElapsedSeconds(activeBlock))} elapsed
                </span>
              </div>
              <h3 className="text-[16px] font-medium text-[#ECECE7] mt-0.5 m-0">
                {activeBlock.title || "Untitled focus block"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              onClick={() => setIsShowingActiveView(true)}
              className="tf-button tf-button-primary min-h-[40px] px-4 rounded-[6px] bg-[#ECECE7] text-[#171819] text-[14px] font-medium hover:bg-white transition-colors"
            >
              Open Active Surface
            </button>
            <button
              onClick={() => {
                const finished = finishCurrentBlock();
                if (finished) setReviewingBlockId(finished.id);
              }}
              className="tf-button min-h-[40px] px-3.5 rounded-[6px] bg-transparent border border-[#737978] text-[14px] font-medium text-[#ECECE7] hover:bg-[#2D3031] transition-colors"
            >
              Finish & Review
            </button>
          </div>
        </div>
      )}

      {/* Date-Grouped Full-Width Focus Block Rows (START-HERE.md §7.3) */}
      <div className="flex flex-col gap-6">
        {blocksByDay.length > 0 ? (
          blocksByDay.map(([dayLabel, dayBlocks]) => (
            <div key={dayLabel} className="flex flex-col gap-2.5">
              <div className="text-[14px] font-semibold text-[#ECECE7] mt-2 mb-1">
                {dayLabel}
              </div>

              {dayBlocks.map((b) => {
                const isReviewed = b.state === "reviewed";
                const elapsedSec = calculateBlockElapsedSeconds(b);
                const formattedDuration = formatDurationSeconds(elapsedSec);

                return (
                  <div
                    key={b.id}
                    onClick={() => setReviewingBlockId(b.id)}
                    className="tf-card min-h-[64px] p-3.5 px-4 rounded-[10px] bg-[#202122] border border-[#3A3D3E] hover:border-[#737978] transition-all flex items-center justify-between gap-4 cursor-pointer"
                  >
                    {/* Title + Tags flexible left */}
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="text-[16px] font-medium text-[#ECECE7] truncate">
                        {b.title || "Focus block"}
                      </div>

                      {b.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {b.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-[4px] bg-[#141516] border border-[#3A3D3E] text-[13px] text-[#C1C5C1]"
                            >
                              {tag}
                            </span>
                          ))}
                          {b.tags.length > 2 && (
                            <span className="text-[12px] text-[#A1A9A5]">
                              +{b.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timeline Thumbnail (90x24 centered, §7.3) */}
                    <div className="w-[90px] h-[24px] rounded-[4px] bg-[#171819] border border-[#3A3D3E] relative overflow-hidden hidden md:block shrink-0">
                      {b.activeIntervals && b.activeIntervals.length > 0 ? (
                        (() => {
                          const firstStart = Date.parse(b.activeIntervals[0].startUtc);
                          const lastInv = b.activeIntervals[b.activeIntervals.length - 1];
                          const lastEnd = lastInv.endUtc
                            ? Date.parse(lastInv.endUtc)
                            : firstStart + (b.plannedSeconds ? b.plannedSeconds * 1000 : 3600000);
                          const totalSpan = Math.max(1, lastEnd - firstStart);

                          return b.activeIntervals.map((inv, idx) => {
                            const start = Date.parse(inv.startUtc);
                            const end = inv.endUtc ? Date.parse(inv.endUtc) : lastEnd;
                            const leftPct = Math.max(0, Math.min(95, ((start - firstStart) / totalSpan) * 100));
                            const widthPct = Math.max(5, Math.min(100 - leftPct, ((end - start) / totalSpan) * 100));

                            return (
                              <div
                                key={idx}
                                className="absolute top-1 bottom-1 bg-[#DDB66D]/70 rounded-[2px]"
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                }}
                              />
                            );
                          });
                        })()
                      ) : (
                        <div className="absolute top-1 bottom-1 left-2 right-2 bg-[#DDB66D]/50 rounded-[2px]" />
                      )}
                    </div>

                    {/* Active Duration: 88px right-aligned mono */}
                    <div className="w-[88px] text-right font-mono text-[14px] text-[#ECECE7] shrink-0">
                      {formattedDuration}
                    </div>

                    {/* Review Status: 112px */}
                    <div className="w-[112px] flex items-center gap-1.5 text-[13px] shrink-0">
                      {isReviewed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#A1A9A5]" />
                          <span className="text-[#A1A9A5]">Reviewed</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full border border-[#DDB66D] bg-transparent" />
                          <span className="text-[#DDB66D]">Needs review</span>
                        </>
                      )}
                    </div>

                    {/* Action: 44px hit target */}
                    <div className="w-[44px] flex justify-end shrink-0">
                      {!isReviewed ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewingBlockId(b.id);
                          }}
                          className="tf-button tf-button-primary min-h-[36px] px-3 rounded-[6px] text-[13px] font-medium bg-[#ECECE7] text-[#171819] hover:bg-white"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewingBlockId(b.id);
                          }}
                          className="w-[44px] h-[44px] flex items-center justify-center text-[#A1A9A5] hover:text-[#ECECE7]"
                          aria-label="View block detail"
                        >
                          &rsaquo;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="tf-card p-12 text-center flex flex-col items-center gap-3 bg-[#202122] border border-[#3A3D3E] rounded-[10px]">
            <h3 className="text-[18px] font-semibold text-[#ECECE7] m-0">
              No focus blocks yet
            </h3>
            <p className="text-[14px] text-[#A1A9A5] max-w-sm m-0">
              Focus blocks help you track and review intentional, uninterrupted work periods across your devices.
            </p>
            <button
              onClick={() => setIsStartOpen(true)}
              className="tf-button tf-button-primary min-h-[44px] px-5 py-2.5 rounded-[6px] bg-[#ECECE7] text-[#171819] hover:bg-white text-[14px] font-medium mt-2"
            >
              Start focus
            </button>
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
        <div className="fixed inset-0 z-50 bg-[#171819] overflow-y-auto">
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
