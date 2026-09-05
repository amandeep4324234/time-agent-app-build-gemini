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
} from "lucide-react";
import { FocusBlock } from "@/lib/focus-blocks";
import { EnrichedSession, Category } from "@/lib/types";
import {
  CorrectionEvent,
  ClassificationRule,
  sliceSessionWithCorrections,
  EffectiveSessionSlice,
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
  { id: "work", label: "Work", color: "var(--focus)" },
  { id: "sink", label: "Sink", color: "var(--sink)" },
  { id: "games", label: "Games", color: "var(--games)" },
  { id: "other-known", label: "Other", color: "var(--other)" },
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
        dominantCategory: groupSlices[0].effectiveCategory,
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

  const totalOtherSec = blockSlices
    .filter((s) => s.effectiveCategory !== "work" && s.effectiveCategory !== "sink" && !s.isExcluded)
    .reduce((a, s) => a + s.sliceSeconds, 0);

  const totalExcludedSec = blockSlices
    .filter((s) => s.isExcluded)
    .reduce((a, s) => a + s.sliceSeconds, 0);

  // State to track apps that have had a rule applied going forward
  const [appliedRuleApps, setAppliedRuleApps] = useState<Set<string>>(new Set());

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

  // Save changes atomically (§8.4)
  const handleCommitSave = () => {
    const updatedBlock: FocusBlock = {
      ...block,
      title: draftTitle.trim().slice(0, 80),
      tags: draftTags,
      state: "reviewed",
      updatedAtUtc: new Date().toISOString(),
    };

    onSaveBatch(stagedCorrections, updatedBlock);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-text"
      onClick={onClose}
    >
      <div
        className="card-midnight w-full max-w-5xl bg-[#141A25] border border-[#53637D] shadow-2xl rounded-[18px] overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar (§8.1) */}
        <div className="p-5 sm:p-6 border-b border-[#2B374B] bg-[#0E121B] flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#AAA9FF]">
                  End-of-Block Review & Corrections
                </span>
                <span className="text-xs text-[#96A5BD]">
                  &bull; Revision {block.revisionId}
                </span>
              </div>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value.slice(0, 80))}
                className="text-xl sm:text-2xl font-bold text-[#F2F5FB] bg-transparent border-b border-transparent hover:border-[#2B374B] focus:border-[#AAA9FF] focus:outline-none w-full"
                placeholder="Block title"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-[#96A5BD] hover:text-[#F2F5FB] hover:bg-[#1F2939]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#96A5BD]">Tags:</span>
            {draftTags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#1A2230] border border-[#2B374B] text-xs text-[#F2F5FB]"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => setDraftTags(draftTags.filter((x) => x !== t))}
                  className="text-[#96A5BD] hover:text-[#EE9DAA]"
                >
                  &times;
                </button>
              </span>
            ))}
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTagInput.trim()) {
                  e.preventDefault();
                  setDraftTags([...draftTags, newTagInput.trim()]);
                  setNewTagInput("");
                }
              }}
              placeholder="+ Add tag..."
              className="bg-transparent text-xs text-[#F2F5FB] placeholder-[#96A5BD] focus:outline-none px-2 py-0.5"
            />
          </div>
        </div>

        {/* Workspace Body: Activity List (65%) left, Live Summary (35%) right (§8.1) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#2B374B]">
          {/* Left Column: Grouped Activity Sessions (65% / 8 cols) */}
          <div className="lg:col-span-8 p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#F2F5FB]">Recorded Activity in Block</h3>
                <p className="text-xs text-[#96A5BD]">
                  App occupancy intersecting active block intervals. Partial sessions are sliced accurately.
                </p>
              </div>
              <span className="text-xs font-mono text-[#AAA9FF]">
                {appGroups.length} apps recorded
              </span>
            </div>

            {/* App Groups List */}
            <div className="flex flex-col gap-3">
              {appGroups.map((group) => {
                const isExpanded = expandedApps[group.key] || false;
                const initials = getAppInitials(group.friendly);

                return (
                  <div
                    key={group.key}
                    className="rounded-[12px] bg-[#1A2230] border border-[#2B374B] p-3.5 flex flex-col gap-3 transition-colors"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[8px] bg-[#0B0E14] border border-[#2B374B] flex items-center justify-center text-xs font-bold text-[#F2F5FB] shrink-0">
                          {initials}
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-semibold text-[#F2F5FB] truncate">
                            {group.friendly}
                          </h4>
                          <span className="text-[11px] font-mono text-[#96A5BD] truncate block">
                            {group.rawLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <div className="text-sm font-medium text-[#F2F5FB]">
                            {formatDurationSeconds(group.totalSeconds)}
                          </div>
                          {group.excludedSeconds > 0 && (
                            <div className="text-[10px] text-[#EE9DAA]">
                              ({formatDurationSeconds(group.excludedSeconds)} excluded)
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            setExpandedApps((prev) => ({ ...prev, [group.key]: !isExpanded }))
                          }
                          className="p-1 rounded text-[#96A5BD] hover:text-[#F2F5FB]"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Quick Correction Actions for Group (§8.2) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#2B374B]/60 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#96A5BD]">Mark as:</span>
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleStageGroupCategory(group.key, cat.id)}
                            className={`px-2 py-0.5 rounded-[4px] border text-[11px] font-medium transition-colors ${
                              group.dominantCategory === cat.id
                                ? "bg-[#AAA9FF]/20 border-[#AAA9FF] text-[#D0CEFF]"
                                : "bg-[#141A25] border-[#2B374B] text-[#B8C4D8] hover:text-[#F2F5FB]"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        {onAddRule && (
                          <button
                            type="button"
                            onClick={() => handleApplyGoingForward(group.rawLabel, group.dominantCategory, group.key)}
                            disabled={appliedRuleApps.has(group.key)}
                            className="text-[11px] text-[#7CDCE5] hover:underline disabled:opacity-60"
                          >
                            {appliedRuleApps.has(group.key) ? "✓ Rule active going forward" : "Apply to app going forward"}
                          </button>
                        )}

                        {group.excludedSeconds > 0 ? (
                          <button
                            onClick={() => handleStageGroupRestore(group.key)}
                            className="text-[11px] text-[#90D2BC] hover:underline"
                          >
                            Restore included
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStageGroupExclude(group.key)}
                            className="text-[11px] text-[#EE9DAA] hover:underline"
                          >
                            Exclude from analysis
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Individual Session Slices (§8.1) */}
                    {isExpanded && (
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2B374B]/40 text-xs">
                        <span className="text-[11px] text-[#96A5BD] font-semibold">
                          Chronological Slices within Block (individual override & exclude):
                        </span>
                        {group.slices.map((sl) => (
                          <div
                            key={sl.id}
                            className="p-2 rounded-[6px] bg-[#141A25] border border-[#2B374B] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-[#B8C4D8]">
                                {new Date(sl.sliceStartMs).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}{" "}
                                &ndash;{" "}
                                {new Date(sl.sliceEndMs).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </span>
                              <span className="capitalize text-[10px] px-1 rounded bg-[#1A2230] text-[#AAA9FF]">
                                {sl.effectiveCategory}
                              </span>
                              {sl.isExcluded && (
                                <span className="text-[10px] text-[#EE9DAA] bg-[#EE9DAA]/10 px-1 rounded">
                                  Excluded
                                </span>
                              )}
                              <span className="font-mono text-[#F2F5FB]">
                                {formatDurationSeconds(sl.sliceSeconds)}
                              </span>
                            </div>

                            {/* Individual Slice Controls (§8.1) */}
                            <div className="flex items-center gap-1 text-[10px]">
                              {CATEGORIES.map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => handleStageSliceCategory(sl, cat.id)}
                                  className={`px-1.5 py-0.5 rounded-[3px] border transition-colors ${
                                    sl.effectiveCategory === cat.id && !sl.isExcluded
                                      ? "bg-[#AAA9FF]/20 border-[#AAA9FF] text-[#D0CEFF]"
                                      : "bg-[#0B0E14] border-[#2B374B] text-[#B8C4D8] hover:text-[#F2F5FB]"
                                  }`}
                                  title={`Reclassify slice as ${cat.label}`}
                                >
                                  {cat.label[0]}
                                </button>
                              ))}
                              {sl.isExcluded ? (
                                <button
                                  type="button"
                                  onClick={() => handleStageSliceRestore(sl)}
                                  className="text-[10px] text-[#90D2BC] hover:underline pl-1"
                                >
                                  Restore
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStageSliceExclude(sl)}
                                  className="text-[10px] text-[#EE9DAA] hover:underline pl-1"
                                >
                                  Exclude
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Before / After Summary (35% / 4 cols) (§8.1) */}
          <div className="lg:col-span-4 p-5 sm:p-6 bg-[#0E121B] flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-semibold text-[#F2F5FB]">Live Block Impact</h3>
                <p className="text-xs text-[#96A5BD]">
                  Effective metrics recomputed in real time with staged adjustments.
                </p>
              </div>

              {/* Stat breakdown cards */}
              <div className="flex flex-col gap-2.5">
                <div className="p-3.5 rounded-[10px] bg-[#141A25] border border-[#2B374B] flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#B8C4D8]">Recorded Work</span>
                  <span className="text-lg font-mono font-bold text-[#AAA9FF]">
                    {formatDurationSeconds(totalWorkSec)}
                  </span>
                </div>

                <div className="p-3.5 rounded-[10px] bg-[#141A25] border border-[#2B374B] flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#B8C4D8]">Recorded Sinks</span>
                  <span className="text-lg font-mono font-bold text-[#EE9DAA]">
                    {formatDurationSeconds(totalSinkSec)}
                  </span>
                </div>

                <div className="p-3.5 rounded-[10px] bg-[#141A25] border border-[#2B374B] flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#B8C4D8]">Other Activity</span>
                  <span className="text-lg font-mono font-bold text-[#92A6C1]">
                    {formatDurationSeconds(totalOtherSec)}
                  </span>
                </div>

                <div className="p-3.5 rounded-[10px] bg-[#141A25] border border-[#2B374B] flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#96A5BD]">Excluded Time</span>
                  <span className="text-lg font-mono font-bold text-[#96A5BD]">
                    {formatDurationSeconds(totalExcludedSec)}
                  </span>
                </div>
              </div>

              {/* Explanatory disclosure (§8.2) */}
              <div className="p-3.5 rounded-[10px] bg-[#1A2230] border border-[#2B374B] text-[11px] text-[#B8C4D8] leading-relaxed">
                <span className="font-semibold text-[#F2F5FB] block mb-1">
                  How time is counted:
                </span>
                Exclusion removes intervals from effective analysis while retaining raw rows in storage. Corrections apply to the exact intersection of active block intervals and do not manufacture artificial deep blocks.
              </div>
            </div>

            {/* Sticky Save / Discard Footer (§8.4) */}
            <div className="flex flex-col gap-2 pt-4 border-t border-[#2B374B]">
              <div className="flex justify-between text-xs text-[#B8C4D8]">
                <span>Staged corrections:</span>
                <span className="font-mono text-[#AAA9FF]">
                  {stagedCorrections.length} operations
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStagedCorrections([])}
                  disabled={stagedCorrections.length === 0}
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#96A5BD] hover:text-[#F2F5FB] disabled:opacity-30 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleCommitSave}
                  className="flex-1 py-2.5 px-4 rounded-[8px] bg-[#AAA9FF] text-[#0B0E14] hover:bg-[#D0CEFF] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
