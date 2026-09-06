"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DateTime } from "luxon";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  X,
  ArrowUpDown,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { getLogicalDay } from "@/lib/day";
import { Envelope, Category } from "@/lib/types";
import { computeEffectiveSessions, EffectiveSessionSlice } from "@/lib/corrections";
import { calculateBlockElapsedSeconds, FocusBlock } from "@/lib/focus-blocks";
import { formatDurationSeconds } from "@/lib/format";
import { getFriendlyAppName, getAppInitials } from "@/lib/app-lens";
import { isFencedSession } from "@/lib/safe-adapter";
import { FocusReviewWorkspace } from "@/components/focus/FocusReviewWorkspace";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;
const TIMEZONE = "Asia/Kolkata";

function LogsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    focusBlocks,
    correctionBatches,
    classificationRules,
    addClassificationRule,
    seedPins,
    overrides,
    commitReviewBatch,
    updateFocusBlock,
    undoRevisionBatch,
  } = useAppStore();

  // Search and Tab State
  const initialApp = searchParams.get("app") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialDay = searchParams.get("day");
  const [activeTab, setActiveTab] = useState<"activity" | "blocks" | "changes">("activity");
  const [searchQuery, setSearchQuery] = useState(initialApp);
  const [debouncedQuery, setDebouncedQuery] = useState(initialApp);

  // Date range and Sort State (§12.1, §12.2)
  const [dateRange, setDateRange] = useState<"day" | "7d" | "14d" | "30d" | "all">(
    initialDay ? "day" : "7d"
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(initialDay);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Tab Filter States (§12.2, update.md §3.6)
  const initialThreshold = searchParams.get("threshold") ? parseInt(searchParams.get("threshold")!, 10) : null;
  const initialAppraisal = searchParams.get("appraisal") || "all";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [selectedInclusion, setSelectedInclusion] = useState<string>("all");
  const [selectedAppraisal, setSelectedAppraisal] = useState<string>(initialAppraisal);
  const [selectedThreshold, setSelectedThreshold] = useState<number | null>(initialThreshold);
  const [selectedBlockStatus, setSelectedBlockStatus] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedBatchStatus, setSelectedBatchStatus] = useState<string>("all");

  // Row expansion state (§3.6)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Review modal state
  const [reviewingBlockId, setReviewingBlockId] = useState<string | null>(null);

  // Debounce search input by 200ms (§12.1)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Raw ledger
  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  const appliedCorrections = useMemo(() => {
    return correctionBatches.flatMap((b) => b.operations);
  }, [correctionBatches]);

  // Effective session slices
  const effectiveSlices = useMemo(() => {
    return computeEffectiveSessions(
      ledger,
      appliedCorrections,
      classificationRules,
      focusBlocks
    ).filter((s) => !isFencedSession(s));
  }, [ledger, appliedCorrections, classificationRules, focusBlocks]);

  // Available logical days and range boundaries (§12.1)
  const availableDays = useMemo(() => {
    const days = new Set<string>();
    for (const s of ledger) {
      days.add(getLogicalDay(s.started_at_ms, TIMEZONE));
    }
    return Array.from(days).sort();
  }, [ledger]);

  const latestDay = availableDays.length > 0 ? availableDays[availableDays.length - 1] : "2026-09-02";

  const { rangeStartMs, rangeEndMs, dateRangeLabel } = useMemo(() => {
    if (availableDays.length === 0) {
      return { rangeStartMs: 0, rangeEndMs: Infinity, dateRangeLabel: "All data" };
    }
    if (dateRange === "day" && selectedDay) {
      const startMs = DateTime.fromISO(`${selectedDay}T04:00:00`, { zone: TIMEZONE }).toMillis();
      const endMs = DateTime.fromISO(`${selectedDay}T04:00:00`, { zone: TIMEZONE }).plus({ days: 1 }).toMillis();
      return {
        rangeStartMs: startMs,
        rangeEndMs: endMs,
        dateRangeLabel: selectedDay,
      };
    }
    const endMs = DateTime.fromISO(`${latestDay}T04:00:00`, { zone: TIMEZONE }).plus({ days: 1 }).toMillis();
    if (dateRange === "all") {
      const startDay = availableDays[0];
      return {
        rangeStartMs: 0,
        rangeEndMs: Infinity,
        dateRangeLabel: `All days (${startDay} – ${latestDay})`,
      };
    }
    const daysBack = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : 30;
    const startIso = DateTime.fromISO(`${latestDay}T04:00:00`, { zone: TIMEZONE }).minus({ days: daysBack - 1 });
    const startDay = startIso.toISODate() || latestDay;
    const startMs = startIso.toMillis();
    return {
      rangeStartMs: startMs,
      rangeEndMs: endMs,
      dateRangeLabel: `${startDay} – ${latestDay}`,
    };
  }, [availableDays, latestDay, dateRange, selectedDay]);

  // Extract unique tags from focus blocks
  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    for (const b of focusBlocks) {
      for (const t of b.tags) tags.add(t);
    }
    return Array.from(tags).sort();
  }, [focusBlocks]);

  // 1. FILTERED ACTIVITY ROWS
  const filteredActivity = useMemo(() => {
    return effectiveSlices
      .filter((sl) => {
        // Date range filter
        if (sl.sliceEndMs < rangeStartMs || sl.sliceStartMs > rangeEndMs) {
          return false;
        }
        // Category filter
        if (selectedCategory !== "all" && sl.effectiveCategory !== selectedCategory) {
          return false;
        }
        // Device filter
        if (selectedDevice !== "all" && sl.device !== selectedDevice) {
          return false;
        }
        // Inclusion filter
        if (selectedInclusion === "included" && sl.isExcluded) {
          return false;
        }
        if (selectedInclusion === "excluded" && !sl.isExcluded) {
          return false;
        }
        // Appraisal filter (§3.6)
        if (selectedAppraisal !== "all") {
          const appVal = sl.appraisal || "unreviewed";
          if (appVal !== selectedAppraisal) return false;
        }
        // Threshold duration filter (§3.3, §3.6)
        if (selectedThreshold !== null && selectedThreshold > 0) {
          if (sl.sliceSeconds <= selectedThreshold) return false;
        }
        // Search query filter (friendly name, domain, tags)
        if (debouncedQuery) {
          const friendly = getFriendlyAppName(sl.label).toLowerCase();
          const raw = sl.label.toLowerCase();
          const matchesName = friendly.includes(debouncedQuery) || raw.includes(debouncedQuery);
          if (!matchesName) return false;
        }
        return true;
      })
      .sort((a, b) => (sortOrder === "newest" ? b.sliceStartMs - a.sliceStartMs : a.sliceStartMs - b.sliceStartMs));
  }, [
    effectiveSlices,
    rangeStartMs,
    rangeEndMs,
    selectedCategory,
    selectedDevice,
    selectedInclusion,
    selectedAppraisal,
    selectedThreshold,
    debouncedQuery,
    sortOrder,
  ]);

  // Group activity by logical date (§12.2)
  const activityByDate = useMemo(() => {
    const map = new Map<string, EffectiveSessionSlice[]>();
    for (const sl of filteredActivity) {
      const day = getLogicalDay(sl.sliceStartMs, TIMEZONE);
      const list = map.get(day) || [];
      list.push(sl);
      map.set(day, list);
    }
    return Array.from(map.entries()).sort((a, b) =>
      sortOrder === "newest" ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0])
    );
  }, [filteredActivity, sortOrder]);

  // 2. FILTERED FOCUS BLOCKS
  const filteredBlocks = useMemo(() => {
    return focusBlocks
      .filter((b) => {
        const createdMs = new Date(b.createdAtUtc).getTime();
        if (createdMs < rangeStartMs || createdMs > rangeEndMs) {
          return false;
        }
        if (selectedBlockStatus === "reviewed" && b.state !== "reviewed") {
          return false;
        }
        if (selectedBlockStatus === "awaiting" && b.state === "reviewed") {
          return false;
        }
        if (selectedTag !== "all" && !b.tags.includes(selectedTag)) {
          return false;
        }
        if (debouncedQuery) {
          const titleMatch = b.title.toLowerCase().includes(debouncedQuery);
          const tagMatch = b.tags.some((t) => t.toLowerCase().includes(debouncedQuery));
          if (!titleMatch && !tagMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAtUtc).getTime();
        const timeB = new Date(b.createdAtUtc).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [focusBlocks, rangeStartMs, rangeEndMs, selectedBlockStatus, selectedTag, debouncedQuery, sortOrder]);

  // 3. CHANGES / REVISION BATCHES
  const filteredBatches = useMemo(() => {
    return correctionBatches
      .filter((b) => {
        const appliedMs = new Date(b.appliedAtUtc).getTime();
        if (appliedMs < rangeStartMs || appliedMs > rangeEndMs) {
          return false;
        }
        if (selectedBatchStatus !== "all" && b.status !== selectedBatchStatus) {
          return false;
        }
        if (debouncedQuery) {
          const idMatch = b.id.toLowerCase().includes(debouncedQuery);
          const sumMatch = b.summary && b.summary.toLowerCase().includes(debouncedQuery);
          if (!idMatch && !sumMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.appliedAtUtc).getTime();
        const timeB = new Date(b.appliedAtUtc).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [correctionBatches, rangeStartMs, rangeEndMs, selectedBatchStatus, debouncedQuery, sortOrder]);

  const reviewingBlock = useMemo(() => {
    return focusBlocks.find((b) => b.id === reviewingBlockId) || null;
  }, [focusBlocks, reviewingBlockId]);

  // Active filter count and clear logic (§12.2, update.md §3.6)
  const hasActiveFilters = useMemo(() => {
    return (
      debouncedQuery !== "" ||
      selectedCategory !== "all" ||
      selectedDevice !== "all" ||
      selectedInclusion !== "all" ||
      selectedAppraisal !== "all" ||
      selectedThreshold !== null ||
      selectedBlockStatus !== "all" ||
      selectedTag !== "all" ||
      selectedBatchStatus !== "all"
    );
  }, [
    debouncedQuery,
    selectedCategory,
    selectedDevice,
    selectedInclusion,
    selectedAppraisal,
    selectedThreshold,
    selectedBlockStatus,
    selectedTag,
    selectedBatchStatus,
  ]);

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedCategory("all");
    setSelectedDevice("all");
    setSelectedInclusion("all");
    setSelectedAppraisal("all");
    setSelectedThreshold(null);
    setSelectedBlockStatus("all");
    setSelectedTag("all");
    setSelectedBatchStatus("all");
  };

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [selectedChange, setSelectedChange] = useState<{
    id: string;
    time: string;
    date: string;
    title: string;
    target: string;
    duration: string;
    scope: string;
    sync: "Synced" | "Saved locally";
    beforeCategory: string;
    afterCategory: string;
    interval: string;
  } | null>(null);

  const toggleRowSelect = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto select-text">
      <div className="flex items-start justify-between border-b border-[#3A3D3E] pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#ECECE7] tracking-tight leading-tight m-0">
            Logs <span className="text-[#A1A9A5] font-normal">&rsaquo;</span>{" "}
            {activeTab === "activity"
              ? "Activity"
              : activeTab === "changes"
              ? "Changes"
              : "Focus blocks"}
          </h1>
          <p className="text-[14px] text-[#A1A9A5] mt-1 m-0">
            {activeTab === "activity"
              ? "Search and review your activity. Correct, categorize or exclude time."
              : activeTab === "changes"
              ? "Track and manage revisions to your activity."
              : "Source-of-truth inspection for recorded focus blocks."}
          </p>
        </div>

        <div className="flex items-center gap-2 min-h-[44px] px-3.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[14px] text-[#ECECE7]">
          <Calendar className="w-4 h-4 text-[#A1A9A5]" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-transparent text-[14px] text-[#ECECE7] border-none outline-none cursor-pointer"
          >
            {selectedDay && <option value="day" className="bg-[#171819]">Day: {selectedDay}</option>}
            <option value="7d" className="bg-[#171819]">Last 7 days</option>
            <option value="14d" className="bg-[#171819]">Last 14 days</option>
            <option value="30d" className="bg-[#171819]">Last 30 days</option>
            <option value="all" className="bg-[#171819]">All data</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-h-[44px] px-3.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[14px] text-[#ECECE7]">
          <Search className="w-4 h-4 text-[#A1A9A5]" />
          <input
            type="text"
            placeholder="Search app or tag…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[14px] text-[#ECECE7] w-40 placeholder-[#737978]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#A1A9A5] hover:text-[#ECECE7]"
            >
              &times;
            </button>
          )}
        </div>

        {selectedCategory !== "all" && (
          <div className="flex items-center gap-1.5 min-h-[44px] px-3 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[13px] text-[#ECECE7]">
            <span>Category: {selectedCategory}</span>
            <button onClick={() => setSelectedCategory("all")} className="text-[#A1A9A5] hover:text-[#ECECE7] text-base leading-none">&times;</button>
          </div>
        )}

        {selectedDevice !== "all" && (
          <div className="flex items-center gap-1.5 min-h-[44px] px-3 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[13px] text-[#ECECE7]">
            <span>Device: {selectedDevice}</span>
            <button onClick={() => setSelectedDevice("all")} className="text-[#A1A9A5] hover:text-[#ECECE7] text-base leading-none">&times;</button>
          </div>
        )}

        {selectedThreshold !== null && (
          <div className="flex items-center gap-1.5 min-h-[44px] px-3 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[13px] text-[#ECECE7]">
            <span>&gt; {selectedThreshold}s</span>
            <button onClick={() => setSelectedThreshold(null)} className="text-[#A1A9A5] hover:text-[#ECECE7] text-base leading-none">&times;</button>
          </div>
        )}

        {dateRange === "day" && selectedDay && (
          <div className="flex items-center gap-1.5 min-h-[44px] px-3 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[13px] text-[#ECECE7]">
            <span>Day: {selectedDay}</span>
            <button onClick={() => setDateRange("7d")} className="text-[#A1A9A5] hover:text-[#ECECE7] text-base leading-none">&times;</button>
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="min-h-[44px] px-3.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[13px] text-[#DFA095] hover:text-[#ECECE7] transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center gap-6 border-b border-[#3A3D3E] text-[14px]">
        <button
          onClick={() => setActiveTab("activity")}
          className={`min-h-[44px] pb-2 transition-colors font-medium border-b-2 ${
            activeTab === "activity"
              ? "text-[#ECECE7] border-[#DDB66D]"
              : "text-[#A1A9A5] border-transparent hover:text-[#ECECE7]"
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab("blocks")}
          className={`min-h-[44px] pb-2 transition-colors font-medium border-b-2 ${
            activeTab === "blocks"
              ? "text-[#ECECE7] border-[#DDB66D]"
              : "text-[#A1A9A5] border-transparent hover:text-[#ECECE7]"
          }`}
        >
          Focus blocks
        </button>
        <button
          onClick={() => setActiveTab("changes")}
          className={`min-h-[44px] pb-2 transition-colors font-medium border-b-2 ${
            activeTab === "changes"
              ? "text-[#ECECE7] border-[#DDB66D]"
              : "text-[#A1A9A5] border-transparent hover:text-[#ECECE7]"
          }`}
        >
          Changes
        </button>
      </div>

      {activeTab === "activity" && (
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-[10px] border border-[#26282A] bg-[#18191B]">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#26282A] text-[11px] font-semibold text-[#8E9296] bg-[#1A1B1D]">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRowIds.size > 0 && selectedRowIds.size === filteredActivity.length}
                  onChange={() => {
                    if (selectedRowIds.size === filteredActivity.length) {
                      setSelectedRowIds(new Set());
                    } else {
                      setSelectedRowIds(new Set(filteredActivity.map(s => `${s.originalSessionId}-${s.sliceStartMs}`)));
                    }
                  }}
                  className="rounded border-[#2F3134] bg-[#141516] text-[#DDB66D] focus:ring-0"
                />
              </div>
              <div className="col-span-2">Time range</div>
              <div className="col-span-3">App</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-2">Device</div>
              <div className="col-span-1">Category</div>
              <div className="col-span-1 text-center">Reviewed</div>
            </div>

            <div className="flex flex-col divide-y divide-[#26282A]">
              {activityByDate.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8E9296]">
                  No activities recorded for the selected period and filters.
                </div>
              ) : (
                activityByDate.map(([day, slices]) => (
                  <div key={day} className="flex flex-col">
                    <div className="px-4 py-2 bg-[#1A1B1D]/60 text-xs font-semibold text-[#ECECE7]">
                      {DateTime.fromISO(`${day}T04:00:00`, { zone: TIMEZONE }).toFormat("cccc · LLL d, yyyy")}
                    </div>

                    {slices.map((sl) => {
                      const rowId = `${sl.originalSessionId}-${sl.sliceStartMs}`;
                      const isChecked = selectedRowIds.has(rowId);
                      const startTime = DateTime.fromMillis(sl.sliceStartMs, { zone: TIMEZONE }).toFormat("HH:mm");
                      const endTime = DateTime.fromMillis(sl.sliceEndMs, { zone: TIMEZONE }).toFormat("HH:mm");
                      const friendlyName = getFriendlyAppName(sl.label);
                      const initials = getAppInitials(friendlyName);
                      const isPhone = sl.device === "phone";
                      const isReviewed = sl.appraisal && sl.appraisal !== "unreviewed";

                      return (
                        <div
                          key={rowId}
                          onClick={() => toggleRowSelect(rowId)}
                          className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs cursor-pointer transition-colors ${
                            isChecked ? "bg-[#1E1F21]" : "hover:bg-[#1C1D1F]"
                          }`}
                        >
                          <div className="col-span-1 flex items-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleRowSelect(rowId)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-[#2F3134] bg-[#141516] text-[#DDB66D] focus:ring-0"
                            />
                          </div>
                          <div className="col-span-2 font-mono text-[#8E9296]">
                            {startTime} – {endTime}
                          </div>
                          <div className="col-span-3 flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-[5px] bg-[#27292A] border border-[#3A3D3E] flex items-center justify-center text-[10px] font-bold text-[#ECECE7]">
                              {initials}
                            </div>
                            <span className="font-medium text-[#ECECE7] truncate">{friendlyName}</span>
                          </div>
                          <div className="col-span-2 font-mono text-[#ECECE7]">
                            {formatDurationSeconds(sl.sliceSeconds)}
                          </div>
                          <div className="col-span-2 flex items-center gap-1.5 text-[#8E9296]">
                            <span>{isPhone ? "📱" : "💻"}</span>
                            <span>{isPhone ? "Phone" : "Computer"}</span>
                          </div>
                          <div className="col-span-1 text-[#8E9296] truncate">{sl.effectiveCategory}</div>
                          <div className="col-span-1 flex items-center justify-between">
                            <div className="w-full text-center">
                              {isReviewed ? (
                                <span className="text-[#90D2BC]">✓</span>
                              ) : (
                                <span className="text-[#8E9296]">&ndash;</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#1A1B1D] border border-[#26282A]">
            <span className="text-xs text-[#8E9296]">{filteredActivity.length} activities</span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => alert(`Selected ${selectedRowIds.size} activities`)}
                className="tf-button tf-button-primary px-4 py-2 text-xs font-semibold"
              >
                Inspect selection
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "changes" && (
        <div className="flex gap-4 items-start">
          <div className="flex-1 overflow-hidden rounded-[10px] border border-[#26282A] bg-[#18191B]">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#26282A] text-[11px] font-semibold text-[#8E9296] bg-[#1A1B1D]">
              <div className="col-span-2">Time</div>
              <div className="col-span-4">Change</div>
              <div className="col-span-3">Target</div>
              <div className="col-span-3">Sync</div>
            </div>

            <div className="flex flex-col divide-y divide-[#26282A]">
              {filteredBatches.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8E9296]">
                  No revision batches recorded yet for the selected period.
                </div>
              ) : (
                filteredBatches.map((b) => {
                  const isSelected = selectedChange?.id === b.id;
                  const appliedTime = DateTime.fromISO(b.appliedAtUtc, { zone: TIMEZONE }).toFormat("HH:mm");
                  const appliedDate = DateTime.fromISO(b.appliedAtUtc, { zone: TIMEZONE }).toFormat("LLL d, yyyy");
                  const title = b.summary || (b.operations.length > 0 ? `${b.operations[0].operation} operation` : "Batch edit");
                  const target = b.operations.length > 0 ? (b.operations[0].targetSessionId ? `Session ${b.operations[0].targetSessionId.slice(0, 8)}` : "All records") : "Batch";
                  const syncStatus = b.status === "synced" ? "Synced" : "Saved locally";

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedChange({
                        id: b.id,
                        time: appliedTime,
                        date: appliedDate,
                        title,
                        target,
                        duration: `${b.operations.length} ops`,
                        scope: "This batch",
                        sync: syncStatus as "Synced" | "Saved locally",
                        beforeCategory: "Original",
                        afterCategory: "Updated",
                        interval: b.operations.length > 0 && b.operations[0].intervalStartUtc ? DateTime.fromISO(b.operations[0].intervalStartUtc, { zone: TIMEZONE }).toFormat("HH:mm") : "All day",
                      })}
                      className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs cursor-pointer transition-colors ${
                        isSelected ? "bg-[#1E1F21]" : "hover:bg-[#1C1D1F]"
                      }`}
                    >
                      <div className="col-span-2 font-mono text-[#8E9296]">
                        {appliedTime}
                      </div>
                      <div className="col-span-4 font-medium text-[#ECECE7] truncate">
                        {title}
                      </div>
                      <div className="col-span-3 text-[#C1C5C1] truncate">
                        {target}
                      </div>
                      <div className="col-span-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              syncStatus === "Synced" ? "bg-[#90D2BC]" : "bg-[#DDB66D]"
                            }`}
                          />
                          <span className="text-[#8E9296]">{syncStatus}</span>
                        </div>
                        {b.status !== "conflict" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              undoRevisionBatch(b.id);
                            }}
                            className="text-[11px] text-[#DDB66D] hover:underline"
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-[#26282A] text-xs text-[#8E9296] bg-[#1A1B1D]">
              {filteredBatches.length} changes
            </div>
          </div>

          {selectedChange && (
            <div className="w-80 rounded-[10px] border border-[#2A2C2E] bg-[#18191B] p-4 flex flex-col gap-4 shadow-xl shrink-0">
              <div className="flex items-start justify-between border-b border-[#26282A] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-[#ECECE7] leading-snug">
                    {selectedChange.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8E9296] mt-1">
                    <span>{selectedChange.date}</span>
                    <span>&middot;</span>
                    <span className="text-[#90D2BC] font-medium">● {selectedChange.sync}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChange(null)}
                  className="text-[#8E9296] hover:text-[#ECECE7] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#8E9296]">Target</span>
                <div className="text-xs text-[#ECECE7]">{selectedChange.target}</div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#8E9296]">Scope</span>
                <span className="text-xs text-[#ECECE7]">{selectedChange.scope}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "blocks" && (
        <div className="flex flex-col gap-2.5">
          {filteredBlocks.map((b) => {
            const elapsed = calculateBlockElapsedSeconds(b);
            const isReviewed = b.state === "reviewed";

            return (
              <div
                key={b.id}
                className="p-4 rounded-[10px] bg-[#18191B] border border-[#26282A] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#ECECE7] text-sm">{b.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isReviewed
                          ? "bg-[#90D2BC]/10 text-[#90D2BC]"
                          : "bg-[#DDB66D]/10 text-[#DDB66D]"
                      }`}
                    >
                      {isReviewed ? "Reviewed" : "Awaiting review"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#8E9296] mt-1">
                    <span>{DateTime.fromISO(b.createdAtUtc, { zone: TIMEZONE }).toFormat("LLL d, yyyy")}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-[#DDB66D]">
                      {formatDurationSeconds(elapsed)} elapsed
                    </span>
                    <span>&bull;</span>
                    <span>{b.syncStatus || "saved_locally"}</span>
                  </div>
                </div>

                <button
                  onClick={() => setReviewingBlockId(b.id)}
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#26282A] hover:bg-[#2F3134] text-[#ECECE7] border border-[#3A3D3E] font-semibold"
                >
                  {isReviewed ? "Edit Review" : "Open Review"}
                </button>
              </div>
            );
          })}
        </div>
      )}

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

export default function LogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#8E9296]">Loading searchable logs…</div>}>
      <LogsContent />
    </Suspense>
  );
}
