"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { Envelope, Category } from "@/lib/types";
import { isFencedSession } from "@/lib/safe-adapter";
import { formatDuration } from "@/lib/format";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import { CategoryEditDialog } from "@/components/today/CategoryEditDialog";
import {
  HardDrive,
  FolderKanban,
  ShieldCheck,
  Target,
  Search,
  Edit2,
  CheckCircle,
  AlertCircle,
  Clock,
  Smartphone,
  Laptop,
} from "lucide-react";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { settings, seedPins, overrides, setOverride, setGoals } = useAppStore();

  // Tab: devices | categories | privacy | goals
  const activeTabParam = searchParams.get("tab") || "devices";
  const [activeTab, setActiveTab] = useState<"devices" | "categories" | "privacy" | "goals">(
    activeTabParam === "categories" || activeTabParam === "privacy" || activeTabParam === "goals"
      ? activeTabParam
      : "devices"
  );

  const handleSelectTab = (tab: "devices" | "categories" | "privacy" | "goals") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/settings?${params.toString()}`);
  };

  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  // Safe apps list for classification (§11.2)
  const safeAppsList = useMemo(() => {
    const map = new Map<string, { label: string; category: Category; seconds: number }>();
    for (const s of ledger) {
      if (isFencedSession(s)) continue; // Never expose private fenced inventory (§11.2)
      const existing = map.get(s.label) || { label: s.label, category: s.category, seconds: 0 };
      existing.seconds += s.seconds;
      existing.category = s.category;
      map.set(s.label, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.seconds - a.seconds);
  }, [ledger]);

  // App Categories state & filtering (§11.2)
  const [searchQuery, setSearchQuery] = useState("");
  const initialCategoryParam = searchParams.get("filter") || searchParams.get("category");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">(
    initialCategoryParam && ["work", "sink", "games", "other", "unclassified"].includes(initialCategoryParam)
      ? initialCategoryParam
      : "all"
  );
  const [editAppTarget, setEditAppTarget] = useState<{ app: string; category: Category } | null>(null);

  const filteredApps = useMemo(() => {
    return safeAppsList.filter((app) => {
      const matchesSearch = app.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === "all" || app.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [safeAppsList, searchQuery, categoryFilter]);

  // Goals State (§11.4: empty means unset, not zero)
  const [focusGoalInput, setFocusGoalInput] = useState(
    settings.focusGoalHours !== null && settings.focusGoalHours !== undefined ? String(settings.focusGoalHours) : ""
  );
  const [sinkAllowanceInput, setSinkAllowanceInput] = useState(
    settings.sinkAllowanceHours !== null && settings.sinkAllowanceHours !== undefined ? String(settings.sinkAllowanceHours) : ""
  );
  const [goalsSavedNotice, setGoalsSavedNotice] = useState(false);

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFocus = focusGoalInput.trim() === "" ? null : parseFloat(focusGoalInput);
    const parsedSink = sinkAllowanceInput.trim() === "" ? null : parseFloat(sinkAllowanceInput);

    if (parsedFocus !== null && (isNaN(parsedFocus) || parsedFocus <= 0)) {
      return;
    }
    if (parsedSink !== null && (isNaN(parsedSink) || parsedSink < 0)) {
      return;
    }

    setGoals(parsedFocus, parsedSink);
    setGoalsSavedNotice(true);
    setTimeout(() => setGoalsSavedNotice(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl select-text">
      {/* 1. Header */}
      <div className="flex flex-col gap-1 pb-3 border-b border-[#303B49]">
        <h1 className="text-2xl md:text-[28px] font-semibold text-[#EDF1F5] tracking-tight">
          Settings
        </h1>
        <span className="text-xs text-[#94A1B2]">
          Devices, app classification, privacy boundaries, and goals
        </span>
      </div>

      {/* 2. Navigation Tabs (§11) */}
      <div className="flex rounded-[6px] border border-[#303B49] bg-[#141A22] p-1 text-xs self-start flex-wrap gap-1">
        <button
          type="button"
          onClick={() => handleSelectTab("devices")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
            activeTab === "devices"
              ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
              : "text-[#94A1B2] hover:text-[#EDF1F5]"
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Devices &amp; data</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("categories")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
            activeTab === "categories"
              ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
              : "text-[#94A1B2] hover:text-[#EDF1F5]"
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>App categories</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("privacy")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
            activeTab === "privacy"
              ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
              : "text-[#94A1B2] hover:text-[#EDF1F5]"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("goals")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
            activeTab === "goals"
              ? "bg-[#1D2530] text-[#EDF1F5] font-semibold"
              : "text-[#94A1B2] hover:text-[#EDF1F5]"
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Goals</span>
        </button>
      </div>

      {/* Tab 1: Devices & Data (§11.1) */}
      {activeTab === "devices" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-[#EDF1F5]">
              Connected Sources (§11.1)
            </h2>
            <p className="text-xs text-[#94A1B2] leading-relaxed">
              Timeframe aggregates foreground application occupancy across paired devices. Green connection indicators require a verified collector signal.
            </p>

            <div className="flex flex-col gap-3 divide-y divide-[#303B49] border-t border-[#303B49] pt-3">
              {/* Computer Source */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                <div className="flex items-center gap-3">
                  <Laptop className="w-5 h-5 text-[#B0BBC9]" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#EDF1F5]">Computer (Chrome Extension / Ledger)</span>
                    <span className="text-[11px] text-[#94A1B2]">Last recorded event: Sep 2, 2026, 7:59pm</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#E4B45F] bg-[#E4B45F]/10 border border-[#E4B45F]/30 px-2 py-0.5 rounded-[4px]">
                    Active
                  </span>
                </div>
              </div>

              {/* Phone Source */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-[#B0BBC9]" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#EDF1F5]">Phone (Android Usage Collector)</span>
                    <span className="text-[11px] text-[#94A1B2]">Last write: Aug 28, 2026, 2:00pm</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#94A1B2] bg-[#202A36] border border-[#303B49] px-2 py-0.5 rounded-[4px]">
                    No recent activity recorded
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-[6px] bg-[#0D1117] border border-[#303B49] text-xs text-[#94A1B2] leading-relaxed">
            Data is stored locally and synchronized using end-to-end encrypted ledger rows. No cloud account or external analytics is required.
          </div>
        </div>
      )}

      {/* Tab 2: App Categories (§11.2) */}
      {activeTab === "categories" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-[#EDF1F5]">
                  Classification Inventory
                </h2>
                <span className="text-xs text-[#94A1B2]">
                  Manage category assignments. Reclassifying immediately recalculates read-time views.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCategoryFilter("unclassified")}
                className="text-xs font-medium px-3 py-1.5 rounded-[6px] border border-[#303B49] bg-[#0D1117] text-[#E4B45F] hover:bg-[#1D2530] transition-colors self-start sm:self-auto"
              >
                Review unclassified apps
              </button>
            </div>

            {/* Search and Category Filter Toolbar (§11.2) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[#94A1B2] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search apps or domains…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-[6px] border border-[#303B49] bg-[#0D1117] text-xs text-[#EDF1F5] placeholder-[#627086] focus:outline-none focus:border-[#E4B45F]"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-[6px] border border-[#303B49] bg-[#0D1117] text-xs text-[#EDF1F5] focus:outline-none w-full sm:w-auto"
              >
                <option value="all">All categories</option>
                <option value="work">Work (Focus)</option>
                <option value="sink">Sinks</option>
                <option value="games">Games</option>
                <option value="other-known">Other</option>
                <option value="unclassified">Unclassified</option>
              </select>
            </div>

            {/* App List Table */}
            <div className="rounded-[6px] border border-[#303B49] bg-[#0D1117] divide-y divide-[#303B49] max-h-96 overflow-y-auto">
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <div
                    key={app.label}
                    className="flex items-center justify-between px-3 py-2.5 text-xs text-[#B0BBC9] hover:bg-[#1D2530]/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium text-[#EDF1F5] truncate max-w-xs">{app.label}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-[3px] bg-[#202A36] text-[#94A1B2] capitalize">
                        {app.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono-nums text-[#94A1B2]">{formatDuration(app.seconds)}</span>
                      <button
                        type="button"
                        onClick={() => setEditAppTarget({ app: app.label, category: app.category })}
                        className="p-1 rounded-[4px] hover:bg-[#202A36] text-[#94A1B2] hover:text-[#EDF1F5] transition-colors"
                        aria-label={`Edit category for ${app.label}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#94A1B2]">
                  No apps found matching your query.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Privacy (§3.3 & §11.2) */}
      {activeTab === "privacy" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-[#EDF1F5]">
              Strict Privacy Boundary (§3.3)
            </h2>
            <p className="text-xs text-[#B0BBC9] leading-relaxed">
              Timeframe observes which application or domain is in the foreground and for how long. It does not inspect keystrokes, form entries, page contents, cameras, or microphones.
            </p>

            <div className="p-4 rounded-[6px] bg-[#0D1117] border border-[#303B49] flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#EDF1F5]">
                Fenced Domain Policy
              </span>
              <p className="text-xs text-[#94A1B2] leading-relaxed">
                Sensitive domains (such as mental health screeners, sensitive medical portals, and private apps) are strictly excluded from all renderers, accessibility labels, exports, and tooltips.
              </p>
              <div className="text-[11px] text-[#E4B45F] font-medium pt-1">
                Private activity is excluded from this view.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Goals (§11.4) */}
      {activeTab === "goals" && (
        <div className="flex flex-col gap-4">
          <form
            onSubmit={handleSaveGoals}
            className="p-5 rounded-[10px] border border-[#303B49] bg-[#141A22] flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1 border-b border-[#303B49] pb-3">
              <h2 className="text-sm font-semibold text-[#EDF1F5]">
                Goals &amp; Allowances (§11.4)
              </h2>
              <p className="text-xs text-[#94A1B2]">
                Goals are explicit user choices with numeric display only. No guilt copy or creature triggers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Daily Focus Goal */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#EDF1F5]">
                  Daily Focus Goal (Hours)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={focusGoalInput}
                  onChange={(e) => setFocusGoalInput(e.target.value)}
                  className="px-3 py-2 rounded-[6px] border border-[#303B49] bg-[#0D1117] text-xs text-[#EDF1F5] font-mono-nums focus:outline-none focus:border-[#E4B45F]"
                />
                <span className="text-[11px] text-[#94A1B2]">
                  Target focus time per logical day.
                </span>
              </div>

              {/* Weekly Sink Allowance */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#EDF1F5]">
                  Weekly Sink Allowance (Hours)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={sinkAllowanceInput}
                  onChange={(e) => setSinkAllowanceInput(e.target.value)}
                  className="px-3 py-2 rounded-[6px] border border-[#303B49] bg-[#0D1117] text-xs text-[#EDF1F5] font-mono-nums focus:outline-none focus:border-[#E4B45F]"
                />
                <span className="text-[11px] text-[#94A1B2]">
                  Exceeding shows exact overage without celebration or punishment.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#303B49]">
              {goalsSavedNotice ? (
                <span className="text-xs text-[#E4B45F] font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Goals updated successfully</span>
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-[6px] bg-[#EDF1F5] text-xs font-semibold text-[#0D1117] hover:bg-white transition-colors"
              >
                Save Goals
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Dialog */}
      {editAppTarget && (
        <CategoryEditDialog
          appLabel={editAppTarget.app}
          currentCategory={editAppTarget.category}
          isOpen={true}
          onClose={() => setEditAppTarget(null)}
          onSave={(app, cat) => setOverride(app, cat)}
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#94A1B2]">Loading settings…</div>}>
      <SettingsContent />
    </Suspense>
  );
}
