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
  const [activeTab, setActiveTab] = useState<"activity" | "blocks" | "changes">("activity");
  const [searchQuery, setSearchQuery] = useState(initialApp);
  const [debouncedQuery, setDebouncedQuery] = useState(initialApp);

  // Date range and Sort State (§12.1, §12.2)
  const [dateRange, setDateRange] = useState<"7d" | "14d" | "30d" | "all">("7d");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Tab Filter States (§12.2, update.md §3.6)
  const initialThreshold = searchParams.get("threshold") ? parseInt(searchParams.get("threshold")!, 10) : null;
  const initialAppraisal = searchParams.get("appraisal") || "all";

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
  }, [availableDays, latestDay, dateRange]);

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

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto select-text">
      {/* 1. Header & Pinned Search Bar (§12.1) */}
      <div className="flex flex-col gap-4 border-b border-[#3A3D3E] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#ECECE7] tracking-tight">
              Searchable Logs
            </h1>
            <p className="text-xs text-[#A1A9A5] mt-1">
              Source-of-truth inspection for recorded events, focus blocks, and corrections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#DDB66D]">
              {activeTab === "activity" && `${filteredActivity.length} events`}
              {activeTab === "blocks" && `${filteredBlocks.length} blocks`}
              {activeTab === "changes" && `${filteredBatches.length} revision batches`}
            </span>
          </div>
        </div>

        {/* Date Range Selector & Search Bar Row (§12.1) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search input with immediate Enter commit */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#A1A9A5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setDebouncedQuery(searchQuery.trim().toLowerCase());
                } else if (e.key === "Escape") {
                  setSearchQuery("");
                  setDebouncedQuery("");
                }
              }}
              placeholder="Search apps, blocks or tags..."
              className="w-full pl-10 pr-14 py-2.5 rounded-[10px] bg-[#202122] border border-[#3A3D3E] text-sm text-[#ECECE7] placeholder-[#A1A9A5] focus:outline-none focus:border-[#DDB66D] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedQuery("");
                }}
                className="absolute right-3 top-2.5 text-xs text-[#A1A9A5] hover:text-[#ECECE7] p-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Date range presets & display (§12.1) */}
          <div className="flex items-center gap-2 bg-[#202122] p-1 rounded-[10px] border border-[#3A3D3E] shrink-0">
            <span className="text-[11px] font-mono text-[#DDB66D] px-2 hidden md:inline">
              {dateRangeLabel}
            </span>
            <div className="flex items-center bg-[#171819] p-0.5 rounded-[6px] border border-[#3A3D3E]/60 text-xs">
              {(["7d", "14d", "30d", "all"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors ${
                    dateRange === r
                      ? "bg-[#DDB66D] text-[#171819] font-semibold"
                      : "text-[#C1C5C1] hover:text-[#ECECE7]"
                  }`}
                >
                  {r === "7d" ? "7d" : r === "14d" ? "14d" : r === "30d" ? "30d" : "All"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Activity / Focus Blocks / Changes) & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-[#202122] p-1 rounded-[8px] border border-[#3A3D3E] text-xs">
            {(["activity", "blocks", "changes"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-[6px] font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-[#DDB66D] text-[#171819]"
                    : "text-[#C1C5C1] hover:text-[#ECECE7]"
                }`}
              >
                {tab === "blocks" ? "Focus blocks" : tab}
              </button>
            ))}
          </div>

          {/* Filter Dropdowns (meaningful to current tab) & Sort (§12.2) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {activeTab === "activity" && (
              <>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[#ECECE7] focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="work">Work</option>
                  <option value="sink">Sink</option>
                  <option value="games">Games</option>
                  <option value="other-known">Other</option>
                  <option value="unclassified">Unclassified</option>
                </select>

                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[#ECECE7] focus:outline-none"
                >
                  <option value="all">All Devices</option>
                  <option value="computer">Computer</option>
                  <option value="phone">Phone</option>
                </select>

                <select
                  value={selectedInclusion}
                  onChange={(e) => setSelectedInclusion(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[#ECECE7] focus:outline-none"
                >
                  <option value="all">All Records</option>
                  <option value="included">Included only</option>
                  <option value="excluded">Excluded only</option>
                </select>

                {/* Appraisal Filter (§3.6) */}
                <select
                  value={selectedAppraisal}
                  onChange={(e) => setSelectedAppraisal(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[#ECECE7] focus:outline-none"
                >
                  <option value="all">All Appraisals</option>
                  <option value="intentional">Intentional</option>
                  <option value="unwanted">Unwanted</option>
                  <option value="unsure">Unsure</option>
                  <option value="unreviewed">Unreviewed</option>
                </select>

                {/* Threshold Duration Filter (§3.3, §3.6) */}
                <select
                  value={selectedThreshold !== null ? String(selectedThreshold) : "all"}
                  onChange={(e) =>
                    setSelectedThreshold(e.target.value === "all" ? null : parseInt(e.target.value, 10))
                  }
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[#ECECE7] focus:outline-none"
                >
                  <option value="all">All Durations</option>
                  <option value="30">Over 30s</option>
                  <option value="60">Over 1m</option>
                  <option value="300">Over 5m</option>
                  <option value="600">Over 10m</option>
                </select>
              </>
            )}

            {activeTab === "blocks" && (
              <>
                <select
                  value={selectedBlockStatus}
                  onChange={(e) => setSelectedBlockStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[#ECECE7] focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="awaiting">Awaiting review</option>
                </select>

                {allUniqueTags.length > 0 && (
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="px-2.5 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[#ECECE7] focus:outline-none"
                  >
                    <option value="all">All Tags</option>
                    {allUniqueTags.map((tag) => (
                      <option key={tag} value={tag}>
                        #{tag}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}

            {activeTab === "changes" && (
              <select
                value={selectedBatchStatus}
                onChange={(e) => setSelectedBatchStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[#ECECE7] focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="committed">Committed</option>
                <option value="undone">Undone</option>
              </select>
            )}

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className="px-2.5 py-1.5 rounded-[6px] bg-[#202122] border border-[#3A3D3E] text-[#C1C5C1] hover:text-[#ECECE7] flex items-center gap-1 font-medium transition-colors"
              title="Toggle sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === "newest" ? "Newest first" : "Oldest first"}</span>
            </button>
          </div>
        </div>

        {/* Applied Filter Chips & Clear All (§12.2, update.md §3.6) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[#A1A9A5] text-[11px] mr-1">Active filters:</span>
            {debouncedQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#DDB66D]/15 text-[#DDB66D] border border-[#DDB66D]/30">
                <span>Query: &ldquo;{debouncedQuery}&rdquo;</span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedQuery("");
                  }}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#282A2C] text-[#ECECE7] border border-[#3A3D3E]">
                <span className="capitalize">Category: {selectedCategory}</span>
                <button onClick={() => setSelectedCategory("all")} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedDevice !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#282A2C] text-[#ECECE7] border border-[#3A3D3E]">
                <span className="capitalize">Device: {selectedDevice}</span>
                <button onClick={() => setSelectedDevice("all")} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedInclusion !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#282A2C] text-[#ECECE7] border border-[#3A3D3E]">
                <span>{selectedInclusion === "included" ? "Included only" : "Excluded only"}</span>
                <button onClick={() => setSelectedInclusion("all")} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedAppraisal !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#DDB66D]/15 text-[#DDB66D] border border-[#DDB66D]/30">
                <span className="capitalize">Appraisal: {selectedAppraisal}</span>
                <button onClick={() => setSelectedAppraisal("all")} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedThreshold !== null && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#DDB66D]/15 text-[#DDB66D] border border-[#DDB66D]/30">
                <span>Duration: &gt; {formatDurationSeconds(selectedThreshold)}</span>
                <button onClick={() => setSelectedThreshold(null)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBlockStatus !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#282A2C] text-[#ECECE7] border border-[#3A3D3E]">
                <span>Status: {selectedBlockStatus}</span>
                <button onClick={() => setSelectedBlockStatus("all")} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTag !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#282A2C] text-[#ECECE7] border border-[#3A3D3E]">
                <span>Tag: #{selectedTag}</span>
                <button onClick={() => setSelectedTag("all")} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBatchStatus !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#282A2C] text-[#ECECE7] border border-[#3A3D3E]">
                <span>Batch: {selectedBatchStatus}</span>
                <button onClick={() => setSelectedBatchStatus("all")} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="ml-auto text-[11px] text-[#DDB66D] hover:text-[#E8C888] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* 2. TAB 1: ACTIVITY LOGS */}
      {activeTab === "activity" && (
        <div className="flex flex-col gap-6">
          {activityByDate.map(([dateStr, daySlices]) => (
            <div key={dateStr} className="flex flex-col gap-2">
              {/* Sticky Date Group Heading (§12.2) */}
              <div className="sticky top-14 z-10 py-1 px-3 rounded-[6px] bg-[#282A2C] border border-[#3A3D3E] flex items-center justify-between text-xs font-semibold text-[#ECECE7]">
                <span>{dateStr} (04:00&ndash;04:00)</span>
                <span className="font-mono text-[#A1A9A5]">{daySlices.length} slices</span>
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-1.5">
                {daySlices.slice(0, 50).map((sl) => {
                  const friendly = getFriendlyAppName(sl.label);
                  const initials = getAppInitials(friendly);
                  const isExpanded = expandedRowId === sl.id;

                  return (
                    <div
                      key={sl.id}
                      className={`p-3 rounded-[10px] bg-[#202122] border border-[#3A3D3E] hover:border-[#737978] transition-colors flex flex-col text-xs cursor-pointer ${
                        sl.isExcluded ? "opacity-40" : ""
                      }`}
                      onClick={() => setExpandedRowId(isExpanded ? null : sl.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className="text-[#A1A9A5] hover:text-[#ECECE7] p-0.5"
                            aria-label={isExpanded ? "Collapse row details" : "Expand row details"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#DDB66D]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <div className="w-8 h-8 rounded-[8px] bg-[#171819] border border-[#3A3D3E] flex items-center justify-center font-bold text-[#ECECE7] text-[11px] shrink-0">
                            {initials}
                          </div>

                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#ECECE7] truncate">
                                {friendly}
                              </span>
                              <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-[#282A2C] text-[#DDB66D]">
                                {sl.effectiveCategory}
                              </span>
                              <span className="text-[10px] uppercase font-mono text-[#A1A9A5]">
                                {sl.device}
                              </span>
                              {sl.isAdjusted && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#DDB66D]/10 text-[#DDB66D]">
                                  Adjusted
                                </span>
                              )}
                              {sl.appraisal && sl.appraisal !== "unreviewed" && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded capitalize ${
                                    sl.appraisal === "unwanted"
                                      ? "bg-[#DFA095]/15 text-[#DFA095] border border-[#DFA095]/30"
                                      : sl.appraisal === "intentional"
                                      ? "bg-[#DDB66D]/15 text-[#DDB66D] border border-[#DDB66D]/30"
                                      : "bg-[#282A2C] text-[#C1C5C1] border border-[#3A3D3E]"
                                  }`}
                                >
                                  {sl.appraisal}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] font-mono text-[#A1A9A5] mt-0.5 truncate">
                              {new Date(sl.sliceStartMs).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              &ndash;{" "}
                              {new Date(sl.sliceEndMs).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              &bull; {sl.label}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0 pl-3">
                          <span className="text-sm font-semibold text-[#ECECE7]">
                            {formatDurationSeconds(sl.sliceSeconds)}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Row Detail Groups (§3.6) */}
                      {isExpanded && (
                        <div
                          className="mt-3 pt-3 border-t border-[#3A3D3E] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] bg-[#171819] p-3 rounded-[8px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 1. Captured Interval */}
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-[#DDB66D] uppercase tracking-wider text-[10px]">
                              1. Captured Interval
                            </span>
                            <div className="text-[#A1A9A5] font-mono text-[10px]">
                              UTC: {new Date(sl.sliceStartMs).toISOString()}
                            </div>
                            <div className="text-[#C1C5C1]">
                              Raw Duration:{" "}
                              <span className="font-mono text-[#ECECE7]">
                                {sl.sliceSeconds}s ({formatDurationSeconds(sl.sliceSeconds)})
                              </span>
                            </div>
                            <div className="text-[#C1C5C1]">
                              Device: <span className="text-[#ECECE7] capitalize">{sl.device}</span>
                            </div>
                            <div className="text-[#A1A9A5] truncate" title={sl.originalSessionId}>
                              ID: <span className="font-mono text-[10px]">{sl.originalSessionId.slice(0, 14)}…</span>
                            </div>
                          </div>

                          {/* 2. Effective Corrections */}
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-[#DDB66D] uppercase tracking-wider text-[10px]">
                              2. Effective Corrections
                            </span>
                            <div className="text-[#C1C5C1]">
                              Category:{" "}
                              <span className="text-[#ECECE7] capitalize">
                                {sl.originalCategory} &rarr;{" "}
                                <strong className="text-[#DDB66D]">{sl.effectiveCategory}</strong>
                              </span>
                            </div>
                            <div className="text-[#C1C5C1]">
                              Analysis:{" "}
                              <span className={sl.isExcluded ? "text-[#DFA095] font-medium" : "text-[#90D2BC]"}>
                                {sl.isExcluded ? "Excluded from analysis" : "Included in analysis"}
                              </span>
                            </div>
                            <div className="text-[#C1C5C1]">
                              Adjusted:{" "}
                              <span className="text-[#ECECE7]">
                                {sl.isAdjusted ? "Yes (Correction applied)" : "No"}
                              </span>
                            </div>
                          </div>

                          {/* 3. User Appraisal */}
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-[#DDB66D] uppercase tracking-wider text-[10px]">
                              3. User Appraisal
                            </span>
                            <div className="text-[#C1C5C1]">
                              Appraisal:{" "}
                              <span className="font-semibold capitalize text-[#ECECE7]">
                                {sl.appraisal && sl.appraisal !== "unreviewed" ? sl.appraisal : "Unreviewed"}
                              </span>
                            </div>
                            {sl.appraisalReason ? (
                              <div className="text-[#C1C5C1] italic bg-[#202122] p-1.5 rounded border border-[#3A3D3E]">
                                &ldquo;{sl.appraisalReason}&rdquo;
                              </div>
                            ) : (
                              <div className="text-[#A1A9A5] italic">No reason provided</div>
                            )}
                          </div>

                          {/* 4. Revision History */}
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-[#DDB66D] uppercase tracking-wider text-[10px]">
                              4. Revision History
                            </span>
                            <div className="text-[#C1C5C1]">
                              Status:{" "}
                              <span className="text-[#ECECE7]">
                                {sl.isReviewed ? "Reviewed" : "Awaiting review"}
                              </span>
                            </div>
                            <div className="text-[#C1C5C1]">
                              Corrections:{" "}
                              <span className="font-mono text-[10px] text-[#ECECE7]">
                                {sl.appliedCorrectionIds.length > 0 ? sl.appliedCorrectionIds.join(", ") : "None"}
                              </span>
                            </div>
                            {sl.associatedBlockId && (
                              <div className="text-[#A1A9A5] truncate">
                                Block:{" "}
                                <span className="font-mono text-[10px]">
                                  {sl.associatedBlockId.slice(0, 12)}…
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {activityByDate.length === 0 && (
            <div className="p-8 text-center text-sm text-[#A1A9A5] rounded-[12px] bg-[#202122] border border-[#3A3D3E]">
              No activity matching search criteria.
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 2: FOCUS BLOCKS */}
      {activeTab === "blocks" && (
        <div className="flex flex-col gap-2.5">
          {filteredBlocks.map((b) => {
            const elapsed = calculateBlockElapsedSeconds(b);
            const isReviewed = b.state === "reviewed";

            return (
              <div
                key={b.id}
                className="p-4 rounded-[12px] bg-[#202122] border border-[#3A3D3E] flex items-center justify-between text-xs"
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
                  <div className="flex items-center gap-2 text-[11px] text-[#A1A9A5] mt-1">
                    <span>{new Date(b.createdAtUtc).toLocaleDateString()}</span>
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
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#282A2C] hover:bg-[#2F3133] text-[#ECECE7] border border-[#3A3D3E] font-semibold"
                >
                  {isReviewed ? "Edit Review" : "Open Review"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. TAB 3: CHANGES / REVISIONS */}
      {activeTab === "changes" && (
        <div className="flex flex-col gap-3">
          {filteredBatches.length > 0 ? (
            filteredBatches.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-[12px] bg-[#202122] border border-[#3A3D3E] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#ECECE7]">{b.id}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#DDB66D]/10 text-[#DDB66D]">
                      {b.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#C1C5C1] mt-1">
                    {b.summary || `${b.operations.length} operations committed`}
                  </div>
                  <div className="text-[10px] text-[#A1A9A5] mt-0.5">
                    {new Date(b.appliedAtUtc).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => undoRevisionBatch(b.id)}
                  className="px-3 py-1.5 rounded-[6px] bg-[#282A2C] hover:bg-[#DFA095]/10 text-[#DFA095] border border-[#3A3D3E] font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[#A1A9A5] rounded-[12px] bg-[#202122] border border-[#3A3D3E]">
              No revision batches recorded yet. Reviewing a block creates atomic revision history here.
            </div>
          )}
        </div>
      )}

      {/* Review Workspace Modal */}
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
    <Suspense fallback={<div className="p-8 text-sm text-[#A1A9A5]">Loading searchable logs…</div>}>
      <LogsContent />
    </Suspense>
  );
}
