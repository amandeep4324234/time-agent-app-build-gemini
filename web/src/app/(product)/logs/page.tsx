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

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set(["sl-1"]));
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
  } | null>({
    id: "chg-1",
    time: "19:27",
    date: "Today, Apr 16, 2025 at 19:27",
    title: "Category changed to Work",
    target: "Instagram",
    duration: "22m",
    scope: "This interval only",
    sync: "Synced",
    beforeCategory: "Social",
    afterCategory: "Work",
    interval: "19:05 – 19:27 (22m)",
  });

  const toggleRowSelect = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sampleActivityRows = [
    {
      group: "Today  Wed, Apr 16, 2025",
      items: [
        { id: "sl-1", time: "09:14 – 09:28", app: "Instagram", duration: "14m", device: "Mac", isPhone: false, category: "Social", reviewed: true },
        { id: "sl-2", time: "12:03 – 12:21", app: "Instagram", duration: "18m", device: "Mac", isPhone: false, category: "Social", reviewed: false },
        { id: "sl-3", time: "15:42 – 16:10", app: "Instagram", duration: "28m", device: "Android", isPhone: true, category: "Social", reviewed: false },
        { id: "sl-4", time: "19:05 – 19:27", app: "Instagram", duration: "22m", device: "Android", isPhone: true, category: "Social", reviewed: false },
      ],
    },
    {
      group: "Yesterday  Tue, Apr 15, 2025",
      items: [
        { id: "sl-5", time: "10:11 – 10:36", app: "Instagram", duration: "25m", device: "Mac", isPhone: false, category: "Social", reviewed: false },
        { id: "sl-6", time: "13:20 – 13:48", app: "Instagram", duration: "28m", device: "Android", isPhone: true, category: "Social", reviewed: false },
        { id: "sl-7", time: "21:03 – 21:16", app: "Instagram", duration: "13m", device: "Android", isPhone: true, category: "Social", reviewed: false },
      ],
    },
  ];

  const sampleChangesRows = [
    {
      group: "Today  Wed, Apr 16, 2025",
      items: [
        {
          id: "c-1",
          time: "19:27",
          date: "Today, Apr 16, 2025 at 19:27",
          title: "Category changed to Work",
          target: "Instagram",
          duration: "22m",
          scope: "This interval only",
          sync: "Synced" as const,
          beforeCategory: "Social",
          afterCategory: "Work",
          interval: "19:05 – 19:27 (22m)",
        },
        {
          id: "c-2",
          time: "15:10",
          date: "Today, Apr 16, 2025 at 15:10",
          title: "Marked intentional",
          target: "Instagram",
          duration: "18m",
          scope: "This interval only",
          sync: "Saved locally" as const,
          beforeCategory: "Social",
          afterCategory: "Intentional Social",
          interval: "12:03 – 12:21 (18m)",
        },
        {
          id: "c-3",
          time: "11:42",
          date: "Today, Apr 16, 2025 at 11:42",
          title: "Excluded selected interval",
          target: "Instagram",
          duration: "12m",
          scope: "This interval only",
          sync: "Synced" as const,
          beforeCategory: "Included",
          afterCategory: "Excluded",
          interval: "09:14 – 09:26 (12m)",
        },
      ],
    },
    {
      group: "Yesterday  Tue, Apr 15, 2025",
      items: [
        {
          id: "c-4",
          time: "17:36",
          date: "Yesterday, Apr 15, 2025 at 17:36",
          title: "Category changed to Personal",
          target: "Instagram",
          duration: "21m",
          scope: "This interval only",
          sync: "Synced" as const,
          beforeCategory: "Social",
          afterCategory: "Personal",
          interval: "10:11 – 10:32 (21m)",
        },
        {
          id: "c-5",
          time: "13:48",
          date: "Yesterday, Apr 15, 2025 at 13:48",
          title: "Marked intentional",
          target: "Instagram",
          duration: "28m",
          scope: "This interval only",
          sync: "Synced" as const,
          beforeCategory: "Social",
          afterCategory: "Intentional Social",
          interval: "13:20 – 13:48 (28m)",
        },
        {
          id: "c-6",
          time: "10:59",
          date: "Yesterday, Apr 15, 2025 at 10:59",
          title: "Excluded selected interval",
          target: "Instagram",
          duration: "8m",
          scope: "This interval only",
          sync: "Saved locally" as const,
          beforeCategory: "Included",
          afterCategory: "Excluded",
          interval: "21:03 – 21:11 (8m)",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto select-text">
      <div className="flex items-start justify-between border-b border-[#26282A] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#ECECE7] tracking-tight">
            Logs <span className="text-[#8E9296] font-normal">&rsaquo;</span>{" "}
            {activeTab === "activity"
              ? "Activity"
              : activeTab === "changes"
              ? "Changes"
              : "Focus blocks"}
          </h1>
          <p className="text-xs text-[#8E9296] mt-0.5">
            {activeTab === "activity"
              ? "Search and review your activity. Correct, categorize or exclude time."
              : activeTab === "changes"
              ? "Track and manage revisions to your activity."
              : "Source-of-truth inspection for recorded focus blocks."}
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1E1F21] border border-[#2F3134] text-xs text-[#ECECE7] cursor-pointer hover:border-[#3E4145]">
          <Calendar className="w-3.5 h-3.5 text-[#8E9296]" />
          <span>Last 7 days</span>
          <ChevronDown className="w-3 h-3 text-[#8E9296]" />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#1E1F21] border border-[#2F3134] text-xs text-[#ECECE7]">
          <Search className="w-3.5 h-3.5 text-[#8E9296]" />
          <input
            type="text"
            value={searchQuery || "Instagram"}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-[#ECECE7] w-24 placeholder-[#8E9296]"
          />
          <button
            onClick={() => setSearchQuery("")}
            className="text-[#8E9296] hover:text-[#ECECE7]"
          >
            &times;
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#1E1F21] border border-[#2F3134] text-xs text-[#ECECE7]">
          <span>App: Instagram</span>
          <button className="text-[#8E9296] hover:text-[#ECECE7]">&times;</button>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#1E1F21] border border-[#2F3134] text-xs text-[#ECECE7]">
          <span>Device: All</span>
          <button className="text-[#8E9296] hover:text-[#ECECE7]">&times;</button>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#1E1F21] border border-[#2F3134] text-xs text-[#ECECE7]">
          <span>Included</span>
          <button className="text-[#8E9296] hover:text-[#ECECE7]">&times;</button>
        </div>

        <button className="px-2.5 py-1.5 rounded-[8px] bg-[#1E1F21] border border-[#2F3134] text-xs text-[#8E9296] hover:text-[#ECECE7] transition-colors">
          + Add filter
        </button>
      </div>

      <div className="flex items-center gap-6 border-b border-[#26282A] text-xs font-semibold">
        <button
          onClick={() => setActiveTab("activity")}
          className={`pb-2.5 transition-colors ${
            activeTab === "activity"
              ? "text-[#ECECE7] border-b-2 border-[#DDB66D]"
              : "text-[#8E9296] hover:text-[#ECECE7]"
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab("blocks")}
          className={`pb-2.5 transition-colors ${
            activeTab === "blocks"
              ? "text-[#ECECE7] border-b-2 border-[#DDB66D]"
              : "text-[#8E9296] hover:text-[#ECECE7]"
          }`}
        >
          Focus blocks
        </button>
        <button
          onClick={() => setActiveTab("changes")}
          className={`pb-2.5 transition-colors ${
            activeTab === "changes"
              ? "text-[#ECECE7] border-b-2 border-[#DDB66D]"
              : "text-[#8E9296] hover:text-[#ECECE7]"
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
              {sampleActivityRows.map((grp) => (
                <div key={grp.group} className="flex flex-col">
                  <div className="px-4 py-2 bg-[#1A1B1D]/60 text-xs font-semibold text-[#ECECE7]">
                    {grp.group}
                  </div>

                  {grp.items.map((row) => {
                    const isChecked = selectedRowIds.has(row.id);
                    return (
                      <div
                        key={row.id}
                        onClick={() => toggleRowSelect(row.id)}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs cursor-pointer transition-colors ${
                          isChecked ? "bg-[#1E1F21]" : "hover:bg-[#1C1D1F]"
                        }`}
                      >
                        <div className="col-span-1 flex items-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRowSelect(row.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-[#2F3134] bg-[#141516] text-[#DDB66D] focus:ring-0"
                          />
                        </div>
                        <div className="col-span-2 font-mono text-[#8E9296]">
                          {row.time}
                        </div>
                        <div className="col-span-3 flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-[5px] bg-gradient-to-tr from-[#FF543E] via-[#D12B89] to-[#8031A7] flex items-center justify-center text-[10px] text-white">
                            📷
                          </div>
                          <span className="font-medium text-[#ECECE7]">{row.app}</span>
                        </div>
                        <div className="col-span-2 font-mono text-[#ECECE7]">
                          {row.duration}
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5 text-[#8E9296]">
                          <span>{row.isPhone ? "📱" : "💻"}</span>
                          <span>{row.device}</span>
                        </div>
                        <div className="col-span-1 text-[#8E9296]">{row.category}</div>
                        <div className="col-span-1 flex items-center justify-between">
                          <div className="w-full text-center">
                            {row.reviewed ? (
                              <span className="text-[#90D2BC]">✓</span>
                            ) : (
                              <span className="text-[#8E9296]">&ndash;</span>
                            )}
                          </div>
                          <button className="text-[#8E9296] hover:text-[#ECECE7] px-1">
                            •••
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#1A1B1D] border border-[#26282A]">
            <span className="text-xs text-[#8E9296]">6 activities</span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => alert("Open details for selected activity")}
                className="px-4 py-2 rounded-[8px] bg-[#26282A] hover:bg-[#2F3134] text-xs font-semibold text-[#ECECE7] transition-colors"
              >
                Open detail
              </button>
              <button
                onClick={() => alert("Correct activity")}
                className="px-5 py-2 rounded-[8px] bg-[#DDB66D] hover:bg-[#E5C27C] text-xs font-bold text-[#121314] transition-colors shadow-sm"
              >
                Correct activity
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
              {sampleChangesRows.map((grp) => (
                <div key={grp.group} className="flex flex-col">
                  <div className="px-4 py-2 bg-[#1A1B1D]/60 text-xs font-semibold text-[#ECECE7]">
                    {grp.group}
                  </div>

                  {grp.items.map((row) => {
                    const isSelected = selectedChange?.id === row.id;
                    return (
                      <div
                        key={row.id}
                        onClick={() => setSelectedChange(row)}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs cursor-pointer transition-colors ${
                          isSelected ? "bg-[#1E1F21]" : "hover:bg-[#1C1D1F]"
                        }`}
                      >
                        <div className="col-span-2 font-mono text-[#8E9296]">
                          {row.time}
                        </div>
                        <div className="col-span-4 font-medium text-[#ECECE7]">
                          {row.title}
                        </div>
                        <div className="col-span-3 flex items-center gap-2">
                          <div className="w-4 h-4 rounded-[4px] bg-gradient-to-tr from-[#FF543E] to-[#8031A7] flex items-center justify-center text-[8px] text-white">
                            📷
                          </div>
                          <span className="text-[#ECECE7]">{row.target}</span>
                          <span className="text-[#8E9296] font-mono">{row.duration}</span>
                        </div>
                        <div className="col-span-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                row.sync === "Synced" ? "bg-[#90D2BC]" : "bg-[#DDB66D]"
                              }`}
                            />
                            <span className="text-[#8E9296]">{row.sync}</span>
                          </div>
                          <span className="text-[#8E9296]">•••</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-[#26282A] text-xs text-[#8E9296] bg-[#1A1B1D]">
              6 changes
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
                <span className="text-[11px] font-semibold text-[#8E9296]">Before</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#8E9296]">Category</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#DFA095]" />
                    <span className="text-[#ECECE7]">{selectedChange.beforeCategory}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#8E9296]">After</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#8E9296]">Category</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#DDB66D]" />
                    <span className="text-[#ECECE7]">{selectedChange.afterCategory}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t border-[#26282A] pt-3">
                <span className="text-[11px] font-semibold text-[#8E9296]">Target</span>
                <div className="flex items-center gap-2 text-xs text-[#ECECE7]">
                  <div className="w-4 h-4 rounded-[4px] bg-gradient-to-tr from-[#FF543E] to-[#8031A7] flex items-center justify-center text-[8px] text-white">
                    📷
                  </div>
                  <span>{selectedChange.target}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#8E9296]">Time interval</span>
                <span className="text-xs font-mono text-[#ECECE7]">
                  {selectedChange.interval}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#8E9296]">Scope</span>
                <span className="text-xs text-[#ECECE7]">{selectedChange.scope}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#26282A]">
                <button
                  onClick={() => alert("Open detail")}
                  className="px-3 py-1.5 rounded-[6px] bg-[#26282A] hover:bg-[#2F3134] text-xs font-semibold text-[#ECECE7] transition-colors"
                >
                  View detail
                </button>
                <button
                  onClick={() => {
                    alert("Revision undone successfully");
                    setSelectedChange(null);
                  }}
                  className="px-4 py-1.5 rounded-[6px] border border-[#DDB66D]/50 text-[#DDB66D] hover:bg-[#DDB66D]/10 text-xs font-bold transition-colors"
                >
                  Undo
                </button>
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
