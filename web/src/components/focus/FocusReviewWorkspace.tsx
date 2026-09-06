"use client";

import React, { useState, useMemo } from "react";
import { DateTime } from "luxon";
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
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Dynamic formatted block time range (§7.6)
  const blockTimeRangeStr = useMemo(() => {
    const firstInv = block.activeIntervals[0];
    const lastInv = block.activeIntervals[block.activeIntervals.length - 1];
    if (firstInv?.startUtc) {
      const startDt = DateTime.fromISO(firstInv.startUtc);
      const endDt = lastInv?.endUtc
        ? DateTime.fromISO(lastInv.endUtc)
        : DateTime.fromISO(block.updatedAtUtc || firstInv.startUtc);
      return `${startDt.toFormat("ccc, LLL d, yyyy · HH:mm")} – ${endDt.toFormat("HH:mm")}`;
    }
    if (block.createdAtUtc) {
      const dt = DateTime.fromISO(block.createdAtUtc);
      return dt.toFormat("ccc, LLL d, yyyy · HH:mm");
    }
    return "Focus block";
  }, [block]);

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

  // Active selected app in the list (defaults to first app)
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>(
    appGroups.length > 0 ? appGroups[0].key : ""
  );

  const selectedGroup = useMemo(() => {
    return appGroups.find((g) => g.key === selectedGroupKey) || appGroups[0] || null;
  }, [appGroups, selectedGroupKey]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#141516]/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto select-text"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-[#18191B] border border-[#2A2C2E] shadow-2xl rounded-[12px] overflow-hidden flex flex-col my-auto max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Bar (Image 2 Panel 4) */}
        <div className="p-5 border-b border-[#26282A] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#ECECE7] tracking-tight">Review block</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-[#8E9296]">
              <span className="w-2 h-2 rounded-full bg-[#90D2BC]" />
              <span>Previously synced &middot; edits sync after saving</span>
            </div>
            <button
              onClick={onClose}
              className="text-[#8E9296] hover:text-[#ECECE7] p-1 rounded transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Block Info Card */}
        <div className="p-5 border-b border-[#26282A] bg-[#1A1B1D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[8px] bg-[#26282A] flex items-center justify-center text-lg shrink-0">
              ✏️
            </div>
            <div>
              <div className="text-base font-bold text-[#ECECE7]">{draftTitle}</div>
              <div className="text-[13px] text-[#A1A9A5] mt-0.5">
                {blockTimeRangeStr} &middot;{" "}
                {formatDurationSeconds(calculateBlockElapsedSeconds(block))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {draftTags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-[6px] bg-[#222426] border border-[#2F3134] text-xs text-[#ECECE7] flex items-center gap-1.5"
              >
                <span>{t}</span>
                <button
                  onClick={() => setDraftTags(draftTags.filter((tag) => tag !== t))}
                  className="text-[#8E9296] hover:text-[#ECECE7]"
                >
                  &times;
                </button>
              </span>
            ))}
            {isAddingTag ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={32}
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const tag = newTagInput.trim();
                      if (tag && !draftTags.includes(tag)) {
                        setDraftTags([...draftTags, tag]);
                      }
                      setNewTagInput("");
                      setIsAddingTag(false);
                    } else if (e.key === "Escape") {
                      setIsAddingTag(false);
                    }
                  }}
                  placeholder="Tag name"
                  className="h-[30px] px-2 rounded-[6px] bg-[#171819] border border-[#737978] text-xs text-[#ECECE7] w-24 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    const tag = newTagInput.trim();
                    if (tag && !draftTags.includes(tag)) {
                      setDraftTags([...draftTags, tag]);
                    }
                    setNewTagInput("");
                    setIsAddingTag(false);
                  }}
                  className="h-[30px] px-2 rounded-[6px] bg-[#27292A] text-[#ECECE7] text-xs font-medium hover:bg-[#2D3031]"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddingTag(false)}
                  className="h-[30px] px-1 text-[#A1A9A5] hover:text-[#ECECE7] text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTag(true)}
                className="px-2.5 py-1 rounded-[6px] bg-[#222426] border border-[#2F3134] text-xs text-[#8E9296] hover:text-[#ECECE7] transition-colors"
              >
                + Add tag
              </button>
            )}
            <span className="text-[#8E9296] text-sm px-1 cursor-pointer">•••</span>
          </div>
        </div>

        {/* 3. Two Columns Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#26282A]">
          {/* Left Column: Activity during this block (7 cols) */}
          <div className="md:col-span-7 p-5 flex flex-col gap-3">
            <div className="text-xs font-semibold text-[#8E9296]">
              Activity during this block
            </div>

            <div className="flex flex-col gap-2">
              {appGroups.map((group) => {
                const isSelected = selectedGroup?.key === group.key;
                return (
                  <div
                    key={group.key}
                    onClick={() => setSelectedGroupKey(group.key)}
                    className={`p-3 rounded-[8px] bg-[#1E1F21] border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-[#DDB66D] shadow-[0_0_12px_rgba(221,182,109,0.15)]"
                        : "border-[#2A2C2E] hover:border-[#3E4145]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-[6px] bg-[#26282A] flex items-center justify-center text-xs font-bold text-[#ECECE7]">
                        {getAppInitials(group.friendly)}
                      </div>
                      <span className="text-xs font-medium text-[#ECECE7]">
                        {group.friendly}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#ECECE7]">
                        {formatDurationSeconds(group.totalSeconds)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded capitalize ${
                          group.dominantCategory === "sink"
                            ? "bg-[#DFA095]/15 text-[#DFA095] border border-[#DFA095]/30"
                            : "bg-[#26282A] text-[#C1C5C1] border border-[#3A3D3E]"
                        }`}
                      >
                        {group.dominantCategory}
                      </span>
                      {isSelected && (
                        <ChevronRight className="w-3.5 h-3.5 text-[#DDB66D]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                const note = prompt("Add a note to this block:");
                if (note) setDraftAppraisalReason(note);
              }}
              className="text-xs text-[#8E9296] hover:text-[#ECECE7] flex items-center gap-1 mt-2 self-start transition-colors"
            >
              + Add note
            </button>
          </div>

          {/* Right Column: Block impact & Selected App detail (5 cols) */}
          <div className="md:col-span-5 p-5 flex flex-col gap-5 bg-[#1A1B1D]">
            {/* Block impact card */}
            <div className="p-4 rounded-[10px] bg-[#1E1F21] border border-[#2A2C2E] flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-[#8E9296]">
                Block impact (including all activity)
              </span>
              <div className="flex justify-between text-[10px] text-[#8E9296] border-b border-[#2A2C2E] pb-1 font-mono">
                <span>Metric</span>
                <span>Before &rarr; After</span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#ECECE7]">Work time</span>
                  <span className="text-[#8E9296]">
                    {formatDurationSeconds(totalWorkSec)} &rarr;{" "}
                    <strong className="text-[#ECECE7]">
                      {formatDurationSeconds(totalWorkSec)}
                    </strong>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#ECECE7]">Distracting time</span>
                  <span className="text-[#8E9296]">
                    {formatDurationSeconds(totalSinkSec)} &rarr;{" "}
                    <strong className="text-[#90D2BC]">0m</strong>
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#2A2C2E]">
                  <span className="text-[#ECECE7]">Total</span>
                  <span className="text-[#8E9296]">
                    {formatDurationSeconds(calculateBlockElapsedSeconds(block))} &rarr;{" "}
                    <strong className="text-[#ECECE7]">
                      {formatDurationSeconds(totalWorkSec)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Selected App Configuration Card */}
            {selectedGroup && (
              <div className="p-4 rounded-[10px] bg-[#1E1F21] border border-[#2A2C2E] flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-[4px] bg-[#26282A] flex items-center justify-center text-[10px] font-bold text-[#ECECE7]">
                    {getAppInitials(selectedGroup.friendly)}
                  </div>
                  <span className="text-xs font-bold text-[#ECECE7]">
                    {selectedGroup.friendly} &middot; {formatDurationSeconds(selectedGroup.totalSeconds)}
                  </span>
                </div>

                {/* Category Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[#8E9296]">Category</span>
                  <select
                    value={selectedGroup.dominantCategory}
                    onChange={(e) => handleStageGroupCategory(selectedGroup.key, e.target.value as Category)}
                    className="w-full bg-[#18191B] border border-[#2F3134] rounded-[6px] px-3 py-1.5 text-xs text-[#ECECE7] focus:outline-none focus:border-[#DDB66D]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exclude Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGroup.excludedSeconds > 0}
                    onChange={(e) => {
                      if (e.target.checked) handleStageGroupExclude(selectedGroup.key);
                      else handleStageGroupRestore(selectedGroup.key);
                    }}
                    className="mt-0.5 rounded border-[#2F3134] bg-[#18191B] text-[#DDB66D] focus:ring-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-[#ECECE7] font-medium">
                      Exclude from analysis
                    </span>
                    <span className="text-[11px] text-[#8E9296]">
                      This activity won't be counted in your insights.
                    </span>
                  </div>
                </label>

                {/* Appraisal Pills */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[#8E9296]">Appraisal</span>
                  <div className="flex items-center gap-2">
                    {(
                      [
                        { id: "intentional", label: "Intentional" },
                        { id: "unwanted", label: "Unwanted" },
                        { id: "unsure", label: "Unsure" },
                      ] as const
                    ).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleStageGroupAppraisal(selectedGroup.key, a.id)}
                        className={`flex-1 py-1.5 rounded-[6px] text-xs font-medium border transition-colors ${
                          selectedGroup.dominantAppraisal === a.id
                            ? a.id === "unwanted"
                              ? "border-[#DFA095] text-[#DFA095] bg-[#DFA095]/10"
                              : "border-[#DDB66D] text-[#DDB66D] bg-[#DDB66D]/10"
                            : "border-[#2F3134] text-[#8E9296] hover:text-[#ECECE7]"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8E9296]">Scope</span>
                    <span className="text-[10px] text-[#8E9296]">ⓘ</span>
                  </div>
                  <select
                    className="w-full bg-[#18191B] border border-[#2F3134] rounded-[6px] px-3 py-1.5 text-xs text-[#ECECE7] focus:outline-none"
                    defaultValue="block"
                  >
                    <option value="block">Selected activity in this block</option>
                    <option value="future">Apply to this app going forward</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Bottom Sticky Actions Bar (Image 2 Panel 4) */}
        <div className="p-4 border-t border-[#26282A] bg-[#1A1B1D] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#DDB66D] font-bold">
              {stagedCorrections.length > 0 ? `${stagedCorrections.length} changes` : "0 changes"}
            </span>
            <span className="text-[#8E9296]">
              {stagedCorrections.length > 0
                ? "You've made changes to this block."
                : "No unsaved changes."}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setStagedCorrections([]);
                onClose();
              }}
              className="tf-button px-4 py-2 rounded-[6px] bg-transparent border border-[#737978] text-[13px] font-medium text-[#ECECE7] hover:bg-[#27292A] transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleCommitSave}
              className="tf-button tf-button-primary px-5 py-2 rounded-[6px] bg-[#ECECE7] text-[#171819] hover:bg-white text-[13px] font-medium transition-colors"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
