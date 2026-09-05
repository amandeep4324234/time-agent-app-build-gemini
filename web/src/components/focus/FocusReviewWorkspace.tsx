"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Shield,
  HelpCircle,
  Clock,
  Sparkles,
  Save,
  Trash2,
  Filter,
  Heart,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { FocusBlock, calculateBlockElapsedSeconds } from "@/lib/focus-blocks";
import { EnrichedSession, Category } from "@/lib/types";
import {
  CorrectionEvent,
  ClassificationRule,
  sliceSessionWithCorrections,
  EffectiveSessionSlice,
  UserAppraisal,
} from "@/lib/corrections";
import { formatDurationSeconds } from "@/lib/format";
import { getFriendlyAppName, getAppInitials } from "@/lib/app-lens";

interface FocusReviewWorkspaceProps {
  block: FocusBlock;
  sessions: EnrichedSession[];
  existingCorrections: CorrectionEvent[];
  existingRules: ClassificationRule[];
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (operations: CorrectionEvent[], updatedBlock: FocusBlock) => void;
  onAddRule?: (rule: ClassificationRule) => void;
}

const CATEGORIES: Array<{ id: Category; label: string; color: string }> = [
  { id: "work", label: "Work", color: "#DDB66D" },
  { id: "sink", label: "Sink", color: "#DFA095" },
  { id: "games", label: "Games", color: "#B3BBC7" },
  { id: "other-known", label: "Other", color: "#8795A8" },
];

export function FocusReviewWorkspace({
  block,
  sessions,
  existingCorrections,
  existingRules,
  isOpen,
  onClose,
  onSaveBatch,
  onAddRule,
}: FocusReviewWorkspaceProps) {
  // Local draft block metadata
  const [draftTitle, setDraftTitle] = useState(block.title);
  const [draftTags, setDraftTags] = useState<string[]>(block.tags);
  const [newTagInput, setNewTagInput] = useState("");

  // Appraisal State (§7: Was this how you wanted to spend the time?)
  const [draftAppraisal, setDraftAppraisal] = useState<UserAppraisal>("unreviewed");
  const [draftAppraisalReason, setDraftAppraisalReason] = useState<string>("");

  // Staged local correction events (not yet saved)
  const [stagedCorrections, setStagedCorrections] = useState<CorrectionEvent[]>([]);
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  // Determine active intervals of this block
  const blockStartMs = Math.min(
    ...block.activeIntervals.map((inv) => Date.parse(inv.startUtc))
  );
  const blockEndMs = Math.max(
    ...block.activeIntervals.map((inv) => (inv.endUtc ? Date.parse(inv.endUtc) : Date.now()))
  );

  // Filter raw sessions that intersect the block's overall time range
  const intersectingRaw = sessions.filter(
    (s) => s.started_at_ms < blockEndMs && s.ended_at_ms > blockStartMs
  );

  // Compute draft effective slices with existing + staged corrections
  const allCorrections = [...existingCorrections, ...stagedCorrections];
  const draftSlices = useMemo(() => {
    const res: EffectiveSessionSlice[] = [];
    for (const s of intersectingRaw) {
      const sls = sliceSessionWithCorrections(s, allCorrections, existingRules, [block]);
      res.push(...sls);
    }
    return res;
  }, [intersectingRaw, allCorrections, existingRules, block]);

  // Slices specifically associated with this block
  const blockSlices = draftSlices.filter((s) => s.associatedBlockId === block.id);

  // Group by app label
  const appGroups = useMemo(() => {
    const map = new Map<string, EffectiveSessionSlice[]>();
    for (const sl of blockSlices) {
      const key = sl.label.toLowerCase();
      const list = map.get(key) || [];
      list.push(sl);
      map.set(key, list);
    }

    return Array.from(map.entries()).map(([key, groupSlices]) => {
      const totalSec = groupSlices.reduce((a, s) => a + s.sliceSeconds, 0);
      const workSec = groupSlices
        .filter((s) => s.effectiveCategory === "work" && !s.isExcluded)
        .reduce((a, s) => a + s.sliceSeconds, 0);
      const sinkSec = groupSlices
        .filter((s) => s.effectiveCategory === "sink" && !s.isExcluded)
        .reduce((a, s) => a + s.sliceSeconds, 0);
      const excludedSec = groupSlices
        .filter((s) => s.isExcluded)
        .reduce((a, s) => a + s.sliceSeconds, 0);
      const unwantedSec = groupSlices
        .filter((s) => !s.isExcluded && s.appraisal === "unwanted")
        .reduce((a, s) => a + s.sliceSeconds, 0);

      const friendly = getFriendlyAppName(groupSlices[0].label);

      return {
        key,
        rawLabel: groupSlices[0].label,
        friendly,
        slices: groupSlices,
        totalSeconds: totalSec,
        workSeconds: workSec,
        sinkSeconds: sinkSec,
        excludedSeconds: excludedSec,
        unwantedSeconds: unwantedSec,
        dominantCategory: groupSlices[0].effectiveCategory,
        dominantAppraisal: groupSlices[0].appraisal,
      };
    }).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [blockSlices]);

  // Live before/after totals
  const totalWorkSec = blockSlices
    .filter((s) => s.effectiveCategory === "work" && !s.isExcluded)
    .reduce((a, s) => a + s.sliceSeconds, 0);

  const totalSinkSec = blockSlices
    .filter((s) => s.effectiveCategory === "sink" && !s.isExcluded)
    .reduce((a, s) => a + s.sliceSeconds, 0);

  const totalExcludedSec = blockSlices
    .filter((s) => s.isExcluded)
    .reduce((a, s) => a + s.sliceSeconds, 0);

  const totalUnwantedSec = blockSlices
    .filter((s) => !s.isExcluded && s.appraisal === "unwanted")
    .reduce((a, s) => a + s.sliceSeconds, 0);

  // State to track apps that have had a rule applied going forward
  const [appliedRuleApps, setAppliedRuleApps] = useState<Set<string>>(new Set());

  // Apply appraisal to the entire block (§7)
  const handleSetBlockAppraisal = (choice: UserAppraisal) => {
    setDraftAppraisal(choice);
    if (choice === "unreviewed") return;

    const newEvents: CorrectionEvent[] = blockSlices.map((sl) => ({
      id: `draft-appr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetSessionId: sl.originalSessionId,
      intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
      intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
      operation: "appraisal",
      appraisal: choice,
      appraisalReason: draftAppraisalReason.trim().slice(0, 160),
      scopeBlockId: block.id,
      baseRevisionId: block.revisionId,
      batchId: `draft-batch-${Date.now()}`,
      createdAtUtc: new Date().toISOString(),
    }));

    setStagedCorrections((prev) => [...prev, ...newEvents]);
  };

  // Stage an appraisal on an app group within this block (§7)
  const handleStageGroupAppraisal = (groupKey: string, choice: UserAppraisal) => {
    const targetGroup = appGroups.find((g) => g.key === groupKey);
    if (!targetGroup) return;

    const newEvents: CorrectionEvent[] = targetGroup.slices.map((sl) => ({
      id: `draft-appr-grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetSessionId: sl.originalSessionId,
      intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
      intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
      operation: "appraisal",
      appraisal: choice,
      appraisalReason: draftAppraisalReason.trim().slice(0, 160),
      scopeBlockId: block.id,
      baseRevisionId: block.revisionId,
      batchId: `draft-batch-${Date.now()}`,
      createdAtUtc: new Date().toISOString(),
    }));

    setStagedCorrections((prev) => [...prev, ...newEvents]);
  };

  // Stage a category override on an entire app group within this block (§8.2)
  const handleStageGroupCategory = (groupKey: string, newCategory: Category) => {
    const targetGroup = appGroups.find((g) => g.key === groupKey);
    if (!targetGroup) return;

    const newEvents: CorrectionEvent[] = targetGroup.slices.map((sl) => ({
      id: `draft-corr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetSessionId: sl.originalSessionId,
      intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
      intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
      operation: "category",
      category: newCategory,
      scopeBlockId: block.id,
      baseRevisionId: block.revisionId,
      batchId: `draft-batch-${Date.now()}`,
      createdAtUtc: new Date().toISOString(),
    }));

    setStagedCorrections((prev) => [...prev, ...newEvents]);
  };

  // Stage exclusion on an app group within this block (§8.2)
  const handleStageGroupExclude = (groupKey: string) => {
    const targetGroup = appGroups.find((g) => g.key === groupKey);
    if (!targetGroup) return;

    const newEvents: CorrectionEvent[] = targetGroup.slices.map((sl) => ({
      id: `draft-corr-ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetSessionId: sl.originalSessionId,
      intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
      intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
      operation: "exclude",
      scopeBlockId: block.id,
      baseRevisionId: block.revisionId,
      batchId: `draft-batch-${Date.now()}`,
      createdAtUtc: new Date().toISOString(),
    }));

    setStagedCorrections((prev) => [...prev, ...newEvents]);
  };

  // Stage restore on an app group
  const handleStageGroupRestore = (groupKey: string) => {
    const targetGroup = appGroups.find((g) => g.key === groupKey);
    if (!targetGroup) return;

    const newEvents: CorrectionEvent[] = targetGroup.slices.map((sl) => ({
      id: `draft-corr-res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetSessionId: sl.originalSessionId,
      intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
      intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
      operation: "restore",
      scopeBlockId: block.id,
      baseRevisionId: block.revisionId,
      batchId: `draft-batch-${Date.now()}`,
      createdAtUtc: new Date().toISOString(),
    }));

    setStagedCorrections((prev) => [...prev, ...newEvents]);
  };

  // Stage individual session slice appraisal (§7)
  const handleStageSliceAppraisal = (sl: EffectiveSessionSlice, choice: UserAppraisal) => {
    const newEvent: CorrectionEvent = {
      id: `draft-appr-sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetSessionId: sl.originalSessionId,
      intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
      intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
      operation: "appraisal",
      appraisal: choice,
      appraisalReason: draftAppraisalReason.trim().slice(0, 160),
      scopeBlockId: block.id,
      baseRevisionId: block.revisionId,
      batchId: `draft-batch-${Date.now()}`,
      createdAtUtc: new Date().toISOString(),
    };
    setStagedCorrections((prev) => [...prev, newEvent]);
  };

  // Stage individual session slice category override (§8.1, §8.2)
  const handleStageSliceCategory = (sl: EffectiveSessionSlice, newCategory: Category) => {
    const newEvent: CorrectionEvent = {
      id: `draft-corr-sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetSessionId: sl.originalSessionId,
      intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
      intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
      operation: "category",
      category: newCategory,
      scopeBlockId: block.id,
      baseRevisionId: block.revisionId,
      batchId: `draft-batch-${Date.now()}`,
      createdAtUtc: new Date().toISOString(),
    };
    setStagedCorrections((prev) => [...prev, newEvent]);
  };

  // Stage individual session slice exclusion (§8.1, §8.2)
  const handleStageSliceExclude = (sl: EffectiveSessionSlice) => {
    const newEvent: CorrectionEvent = {
      id: `draft-corr-ex-sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetSessionId: sl.originalSessionId,
      intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
      intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
      operation: "exclude",
      scopeBlockId: block.id,
      baseRevisionId: block.revisionId,
      batchId: `draft-batch-${Date.now()}`,
      createdAtUtc: new Date().toISOString(),
    };
    setStagedCorrections((prev) => [...prev, newEvent]);
  };

  // Stage individual session slice restore (§8.1, §8.2)
  const handleStageSliceRestore = (sl: EffectiveSessionSlice) => {
    const newEvent: CorrectionEvent = {
      id: `draft-corr-res-sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetSessionId: sl.originalSessionId,
      intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
      intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
      operation: "restore",
      scopeBlockId: block.id,
      baseRevisionId: block.revisionId,
      batchId: `draft-batch-${Date.now()}`,
      createdAtUtc: new Date().toISOString(),
    };
    setStagedCorrections((prev) => [...prev, newEvent]);
  };

  // Apply category to app going forward rule (§8.2)
  const handleApplyGoingForward = (rawLabel: string, category: Category, groupKey: string) => {
    if (!onAddRule) return;
    const rule: ClassificationRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      appLabel: rawLabel,
      category,
      effectiveFromUtc: new Date().toISOString(),
      scope: "future",
      createdAtUtc: new Date().toISOString(),
    };
    onAddRule(rule);
    setAppliedRuleApps((prev) => new Set([...prev, groupKey]));
  };

  // Save changes atomically (§8.4, update.md §7)
  const handleCommitSave = () => {
    const updatedBlock: FocusBlock = {
      ...block,
      title: draftTitle.trim().slice(0, 80),
      tags: draftTags,
      state: "reviewed",
      updatedAtUtc: new Date().toISOString(),
    };

    const trimmedReason = draftAppraisalReason.trim().slice(0, 160);

    // If block appraisal was selected but no events staged yet, generate them now
    let ops = [...stagedCorrections];
    const hasBlockAppraisalOps = ops.some(
      (op) => op.operation === "appraisal" && op.scopeBlockId === block.id
    );

    if (!hasBlockAppraisalOps && draftAppraisal !== "unreviewed") {
      const generated: CorrectionEvent[] = blockSlices.map((sl) => ({
        id: `draft-appr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        targetSessionId: sl.originalSessionId,
        intervalStartUtc: new Date(sl.sliceStartMs).toISOString(),
        intervalEndUtc: new Date(sl.sliceEndMs).toISOString(),
        operation: "appraisal",
        appraisal: draftAppraisal,
        appraisalReason: trimmedReason,
        scopeBlockId: block.id,
        baseRevisionId: block.revisionId,
        batchId: `draft-batch-${Date.now()}`,
        createdAtUtc: new Date().toISOString(),
      }));
      ops.push(...generated);
    } else {
      // Synchronize latest typed reason into existing block appraisal operations
      ops = ops.map((op) => {
        if (op.operation === "appraisal" && op.scopeBlockId === block.id) {
          return {
            ...op,
            appraisalReason: trimmedReason || op.appraisalReason,
          };
        }
        return op;
      });
    }

    onSaveBatch(ops, updatedBlock);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-text"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-[#202122] border border-[#737978] shadow-2xl rounded-[10px] overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#3A3D3E] bg-[#171819] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#DDB66D]" />
              <h2 className="text-base font-bold text-[#ECECE7]">Review Focus Block</h2>
              <span className="text-xs text-[#A1A9A5] font-mono">
                {formatDurationSeconds(calculateBlockElapsedSeconds(block))} active
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#A1A9A5] hover:text-[#ECECE7] hover:bg-[#3A3D3E] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Block Title & Tags inputs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Block Title"
              className="flex-1 bg-[#202122] border border-[#3A3D3E] rounded-[6px] px-3 py-1.5 text-xs text-[#ECECE7] focus:outline-none focus:border-[#DDB66D]"
            />

            {/* Tags Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {draftTags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-[4px] bg-[#171819] border border-[#3A3D3E] text-[11px] text-[#C1C5C1] flex items-center gap-1"
                >
                  <span>{t}</span>
                  <button
                    onClick={() => setDraftTags(draftTags.filter((tag) => tag !== t))}
                    className="hover:text-[#DFA095]"
                  >
                    &times;
                  </button>
                </span>
              ))}

              <input
                type="text"
                placeholder="+ tag"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTagInput.trim()) {
                    e.preventDefault();
                    if (!draftTags.includes(newTagInput.trim())) {
                      setDraftTags([...draftTags, newTagInput.trim()]);
                    }
                    setNewTagInput("");
                  }
                }}
                className="w-16 bg-[#171819] border border-[#3A3D3E] rounded-[4px] px-2 py-0.5 text-[11px] text-[#ECECE7] focus:outline-none focus:border-[#DDB66D]"
              />
            </div>
          </div>
        </div>

        {/* User Appraisal Section (§7: Was this how you wanted to spend the time?) */}
        <div className="p-4 bg-[#171819]/80 border-b border-[#3A3D3E] flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-[#ECECE7] block">
                Was this how you wanted to spend the time?
              </span>
              <span className="text-[11px] text-[#A1A9A5]">
                Author your intention. Categories and appraisals measure different things; marking intentional does not erase time.
              </span>
            </div>

            {/* Appraisal Pills */}
            <div className="flex items-center gap-1.5 bg-[#202122] p-1 rounded-[6px] border border-[#3A3D3E]">
              {(
                [
                  { id: "intentional", label: "Intentional" },
                  { id: "unwanted", label: "Unwanted" },
                  { id: "unsure", label: "Unsure" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSetBlockAppraisal(opt.id)}
                  className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                    draftAppraisal === opt.id
                      ? opt.id === "unwanted"
                        ? "bg-[#DFA095] text-[#171819] font-bold"
                        : "bg-[#DDB66D] text-[#171819] font-bold"
                      : "text-[#C1C5C1] hover:text-[#ECECE7]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional reason max 160 chars */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={160}
              placeholder="Optional private reason (e.g. planned break, necessary research, distracted)"
              value={draftAppraisalReason}
              onChange={(e) => setDraftAppraisalReason(e.target.value)}
              className="flex-1 bg-[#202122] border border-[#3A3D3E] rounded-[6px] px-3 py-1 text-[11px] text-[#ECECE7] placeholder-[#A1A9A5] focus:outline-none focus:border-[#DDB66D]"
            />
            <span className="text-[10px] text-[#A1A9A5] shrink-0 font-mono">
              {draftAppraisalReason.length}/160
            </span>
          </div>
        </div>

        {/* Live Calculation Summary Bar (§7, §8.3) */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-[#171819] border-b border-[#3A3D3E] text-xs">
          <div className="p-2 rounded bg-[#202122] border border-[#3A3D3E]">
            <span className="text-[10px] uppercase text-[#A1A9A5]">Work Overlap</span>
            <div className="font-mono text-sm font-bold text-[#DDB66D] mt-0.5">
              {formatDurationSeconds(totalWorkSec)}
            </div>
          </div>
          <div className="p-2 rounded bg-[#202122] border border-[#3A3D3E]">
            <span className="text-[10px] uppercase text-[#A1A9A5]">Sink Overlap</span>
            <div className="font-mono text-sm font-bold text-[#DFA095] mt-0.5">
              {formatDurationSeconds(totalSinkSec)}
            </div>
          </div>
          <div className="p-2 rounded bg-[#202122] border border-[#3A3D3E]">
            <span className="text-[10px] uppercase text-[#A1A9A5]">Marked Unwanted</span>
            <div className="font-mono text-sm font-bold text-[#DFA095] mt-0.5">
              {formatDurationSeconds(totalUnwantedSec)}
            </div>
          </div>
          <div className="p-2 rounded bg-[#202122] border border-[#3A3D3E]">
            <span className="text-[10px] uppercase text-[#A1A9A5]">Excluded</span>
            <div className="font-mono text-sm font-bold text-[#A1A9A5] mt-0.5">
              {formatDurationSeconds(totalExcludedSec)}
            </div>
          </div>
        </div>

        {/* App Groups List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {appGroups.map((group) => {
            const isExpanded = !!expandedApps[group.key];
            return (
              <div
                key={group.key}
                className="rounded-[8px] bg-[#171819] border border-[#3A3D3E] p-3 flex flex-col gap-2.5"
              >
                {/* Group Summary Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          CATEGORIES.find((c) => c.id === group.dominantCategory)?.color || "#8795A8",
                      }}
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#ECECE7]">{group.friendly}</span>
                      <span className="text-[10px] font-mono text-[#A1A9A5] ml-2">
                        {group.rawLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-[#ECECE7] font-semibold">
                      {formatDurationSeconds(group.totalSeconds)}
                    </span>
                    {group.unwantedSeconds > 0 && (
                      <span className="text-[10px] text-[#DFA095]">
                        ({formatDurationSeconds(group.unwantedSeconds)} unwanted)
                      </span>
                    )}
                    <button
                      onClick={() =>
                        setExpandedApps((prev) => ({ ...prev, [group.key]: !isExpanded }))
                      }
                      className="p-1 text-[#A1A9A5] hover:text-[#ECECE7]"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#3A3D3E] text-xs">
                  {/* Category Selection */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#A1A9A5]">Category:</span>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleStageGroupCategory(group.key, cat.id)}
                        className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-medium transition-colors ${
                          group.dominantCategory === cat.id
                            ? "bg-[#202122] border-[#DDB66D] text-[#DDB66D]"
                            : "bg-[#202122] border-[#3A3D3E] text-[#C1C5C1] hover:text-[#ECECE7]"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Appraisal Selection (§7) */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#A1A9A5]">Appraisal:</span>
                    {(["intentional", "unwanted", "unsure"] as const).map((appr) => (
                      <button
                        key={appr}
                        type="button"
                        onClick={() => handleStageGroupAppraisal(group.key, appr)}
                        className={`px-1.5 py-0.5 rounded-[4px] border text-[10px] font-medium capitalize transition-colors ${
                          group.dominantAppraisal === appr
                            ? "bg-[#202122] border-[#DDB66D] text-[#DDB66D]"
                            : "bg-[#202122] border-[#3A3D3E] text-[#C1C5C1] hover:text-[#ECECE7]"
                        }`}
                      >
                        {appr}
                      </button>
                    ))}

                    {/* Exclude / Restore */}
                    {group.excludedSeconds > 0 ? (
                      <button
                        onClick={() => handleStageGroupRestore(group.key)}
                        className="text-[10px] text-[#90D2BC] hover:underline ml-2"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStageGroupExclude(group.key)}
                        className="text-[10px] text-[#DFA095] hover:underline ml-2"
                      >
                        Exclude
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Slices */}
                {isExpanded && (
                  <div className="divide-y divide-[#3A3D3E] border border-[#3A3D3E] rounded-[6px] overflow-hidden mt-1 text-[11px]">
                    {group.slices.map((sl) => (
                      <div
                        key={sl.id}
                        className="p-2 bg-[#202122] flex items-center justify-between hover:bg-[#202122]/70"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#C1C5C1]">
                            {new Date(sl.sliceStartMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" – "}
                            {new Date(sl.sliceEndMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="font-mono text-[#ECECE7]">
                            {formatDurationSeconds(sl.sliceSeconds)}
                          </span>
                          {sl.appraisal && sl.appraisal !== "unreviewed" && (
                            <span className="text-[9px] px-1 rounded bg-[#DDB66D]/10 text-[#DDB66D] border border-[#DDB66D]/30 capitalize">
                              {sl.appraisal}
                            </span>
                          )}
                          {sl.isExcluded && (
                            <span className="text-[9px] px-1 rounded bg-[#DFA095]/10 text-[#DFA095]">
                              Excluded
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[9px]">
                          {(["intentional", "unwanted"] as const).map((a) => (
                            <button
                              key={a}
                              onClick={() => handleStageSliceAppraisal(sl, a)}
                              className={`px-1.5 py-0.5 rounded border capitalize ${
                                sl.appraisal === a
                                  ? "bg-[#171819] border-[#DDB66D] text-[#DDB66D]"
                                  : "border-[#3A3D3E] text-[#A1A9A5] hover:text-[#ECECE7]"
                              }`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#3A3D3E] bg-[#171819] flex items-center justify-between">
          <span className="text-xs text-[#A1A9A5]">
            {stagedCorrections.length} correction/appraisal edits staged
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-[6px] bg-[#202122] text-[#C1C5C1] hover:text-[#ECECE7] border border-[#3A3D3E] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCommitSave}
              className="px-4 py-1.5 rounded-[6px] bg-[#ECECE7] text-[#171819] hover:bg-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save review & recompute</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
