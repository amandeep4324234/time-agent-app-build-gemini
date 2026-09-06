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

  // Group focus blocks by day
  const blocksByDay = useMemo(() => {
    const map = new Map<string, typeof focusBlocks>();
    for (const b of focusBlocks) {
      const dateStr = new Date(b.createdAtUtc).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const list = map.get(dateStr) || [];
      list.push(b);
      map.set(dateStr, list);
    }
    return Array.from(map.entries());
  }, [focusBlocks]);

  return (
    <div className="flex flex-col gap-6 select-text max-w-5xl mx-auto">
      {/* 1. Header (Image 3 Panel 1) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#26282A] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#ECECE7] tracking-tight">
            Focus blocks
          </h1>
          <p className="text-xs text-[#8E9296] mt-0.5">
            Plan, track and review your focused work.
          </p>
        </div>

        {/* Center: Date picker pill */}
        <div className="flex items-center bg-[#1E1F21] rounded-[8px] border border-[#2F3134] px-2 py-1 gap-2 text-xs">
          <button className="text-[#8E9296] hover:text-[#ECECE7]">‹</button>
          <span className="text-[#ECECE7] font-medium">May 14, 2025</span>
          <button className="text-[#8E9296] hover:text-[#ECECE7]">›</button>
        </div>

        {/* Right: + Start focus */}
        <button
          onClick={() => setIsStartOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#DDB66D] text-[#121314] hover:bg-[#E5C27C] transition-colors text-xs sm:text-sm font-semibold shadow-sm"
        >
          <span className="text-base font-bold leading-none">+</span>
          <span>Start focus</span>
        </button>
      </div>

      {/* Active Running Block Banner */}
      {activeBlock && (
        <div className="p-4 rounded-[10px] bg-[#1E1F21] border border-[#DDB66D]/60 shadow-[0_0_16px_rgba(221,182,109,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-3 h-3 rounded-full bg-[#DDB66D] animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#DDB66D]">
                  {activeBlock.state === "running" ? "Currently Active" : "Paused"}
                </span>
                <span className="text-xs text-[#8E9296]">
                  &bull; {formatDurationSeconds(calculateBlockElapsedSeconds(activeBlock))} elapsed
                </span>
              </div>
              <h3 className="text-base font-bold text-[#ECECE7] mt-0.5">
                {activeBlock.title || "Untitled focus block"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              onClick={() => setIsShowingActiveView(true)}
              className="px-4 py-2 rounded-[8px] bg-[#DDB66D] text-[#121314] text-xs font-bold hover:bg-[#E5C27C] transition-colors"
            >
              Open Active Surface
            </button>
            <button
              onClick={() => {
                const finished = finishCurrentBlock();
                if (finished) setReviewingBlockId(finished.id);
              }}
              className="px-3.5 py-2 rounded-[8px] bg-[#2A2C2E] border border-[#3A3D3E] text-xs font-semibold text-[#DFA095] hover:bg-[#DFA095]/10 transition-colors"
            >
              Finish & Review
            </button>
          </div>
        </div>
      )}

      {/* Grouped Block History (Image 3 Panel 1) */}
      <div className="flex flex-col gap-6">
        {/* Today Group */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-[#ECECE7]">
            Today <span className="text-[#8E9296] font-normal">Wed, May 14, 2025</span>
          </div>

          {[
            {
              id: "b-1",
              title: "Design system",
              time: "10:14 – 10:59",
              duration: "45m",
              tag: "Design",
              reviewed: true,
              icon: "✏️",
            },
            {
              id: "b-2",
              title: "Reading",
              time: "13:02 – 13:58",
              duration: "56m",
              tag: "Study",
              reviewed: true,
              icon: "📖",
            },
            {
              id: "b-3",
              title: "Build session",
              time: "15:21 – 16:06",
              duration: "45m",
              tag: "Code",
              reviewed: false,
              icon: "💻",
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => {
                const existing = focusBlocks.find((b) => b.id === item.id);
                if (existing) setReviewingBlockId(existing.id);
                else if (focusBlocks.length > 0) setReviewingBlockId(focusBlocks[0].id);
              }}
              className="p-3.5 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] hover:border-[#3E4145] transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#26282A] flex items-center justify-center text-sm shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#ECECE7]">{item.title}</div>
                  <div className="text-[10px] text-[#8E9296] mt-0.5">{item.time}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-medium text-[#ECECE7]">{item.duration}</span>

                {/* Mini Sparkline Bar Chart */}
                <div className="flex items-end gap-0.5 h-4 w-12">
                  <div className="w-2 bg-[#DDB66D] h-3 rounded-t-[1px]" />
                  <div className="w-2 bg-[#DDB66D] h-4 rounded-t-[1px]" />
                  <div className="w-2 bg-[#DDB66D] h-2 rounded-t-[1px]" />
                  <div className="w-2 bg-[#DDB66D] h-3.5 rounded-t-[1px]" />
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#26282A] text-[#C1C5C1] border border-[#3A3D3E]">
                  {item.tag}
                </span>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-[4px] font-medium ${
                    item.reviewed
                      ? "text-[#8E9296] bg-[#26282A]"
                      : "text-[#DDB66D] bg-[#DDB66D]/15 border border-[#DDB66D]/30"
                  }`}
                >
                  {item.reviewed ? "Reviewed" : "Needs review"}
                </span>

                <button className="text-[#8E9296] hover:text-[#ECECE7] px-1 text-sm leading-none">
                  •••
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Yesterday Group */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-[#ECECE7]">
            Yesterday <span className="text-[#8E9296] font-normal">Tue, May 13, 2025</span>
          </div>

          {[
            {
              id: "b-4",
              title: "Project planning",
              time: "09:12 – 09:54",
              duration: "42m",
              tag: "Work",
              reviewed: true,
              icon: "✏️",
            },
            {
              id: "b-5",
              title: "Reading",
              time: "11:03 – 11:37",
              duration: "34m",
              tag: "Study",
              reviewed: true,
              icon: "📖",
            },
            {
              id: "b-6",
              title: "Design system",
              time: "14:20 – 15:05",
              duration: "45m",
              tag: "Design",
              reviewed: true,
              icon: "✏️",
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (focusBlocks.length > 0) setReviewingBlockId(focusBlocks[0].id);
              }}
              className="p-3.5 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] hover:border-[#3E4145] transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#26282A] flex items-center justify-center text-sm shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#ECECE7]">{item.title}</div>
                  <div className="text-[10px] text-[#8E9296] mt-0.5">{item.time}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-medium text-[#ECECE7]">{item.duration}</span>

                <div className="flex items-end gap-0.5 h-4 w-12">
                  <div className="w-2 bg-[#DDB66D] h-2 rounded-t-[1px]" />
                  <div className="w-2 bg-[#DDB66D] h-3.5 rounded-t-[1px]" />
                  <div className="w-2 bg-[#DDB66D] h-1.5 rounded-t-[1px]" />
                  <div className="w-2 bg-[#DDB66D] h-4 rounded-t-[1px]" />
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#26282A] text-[#C1C5C1] border border-[#3A3D3E]">
                  {item.tag}
                </span>

                <span className="text-[10px] px-2 py-0.5 rounded-[4px] font-medium text-[#8E9296] bg-[#26282A]">
                  Reviewed
                </span>

                <button className="text-[#8E9296] hover:text-[#ECECE7] px-1 text-sm leading-none">
                  •••
                </button>
              </div>
            </div>
          ))}
        </div>
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
