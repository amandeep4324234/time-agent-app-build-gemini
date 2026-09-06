"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  Laptop,
  Smartphone,
  Shield,
  HelpCircle,
  RefreshCw,
  Info,
  CheckCircle2,
} from "lucide-react";

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    aiTone,
    setAiTone,
    aiEnabled,
    setAiEnabled,
  } = useAppStore();

  // Primary Tabs: appearance (Screen 15) | devices (Screen 16) (§7.9)
  const activeTabParam = searchParams.get("tab") || "appearance";
  const [activeTab, setActiveTab] = useState<"appearance" | "devices">(
    activeTabParam === "devices" ? "devices" : "appearance"
  );

  const handleSelectTab = (tab: "appearance" | "devices") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/settings?${params.toString()}`);
  };

  // Appearance & Display States
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [shareStyle, setShareStyle] = useState<"aggregate" | "named">("aggregate");
  const [language, setLanguage] = useState("en-US");
  const [startWeekOn, setStartWeekOn] = useState("monday");

  return (
    <div className="flex flex-col gap-8 max-w-[800px] mx-auto select-text pb-12">
      {/* 1. Header & Secondary Navigation (§7.1, §7.9) */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#ECECE7] leading-tight m-0">
            Settings
          </h1>
          <p className="text-[14px] text-[#A1A9A5] mt-1 m-0">
            {activeTab === "appearance"
              ? "Display preferences, AI tone and data sharing controls."
              : "Connected sources, capture status and privacy safeguards."}
          </p>
        </div>

        {/* Shared Secondary Navigation (§7.1) */}
        <div className="flex items-center gap-6 border-b border-[#3A3D3E]">
          <button
            onClick={() => handleSelectTab("appearance")}
            className={`min-h-[44px] pb-2 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "appearance"
                ? "border-[#DDB66D] text-[#ECECE7]"
                : "border-transparent text-[#A1A9A5] hover:text-[#ECECE7]"
            }`}
          >
            Appearance and AI
          </button>
          <button
            onClick={() => handleSelectTab("devices")}
            className={`min-h-[44px] pb-2 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "devices"
                ? "border-[#DDB66D] text-[#ECECE7]"
                : "border-transparent text-[#A1A9A5] hover:text-[#ECECE7]"
            }`}
          >
            Devices &amp; data
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: APPEARANCE AND AI (Screen 15, START-HERE.md §7.9)  */}
      {/* ========================================================= */}
      {activeTab === "appearance" && (
        <div className="flex flex-col gap-8">
          {/* Display Group */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[18px] font-semibold text-[#ECECE7] m-0">
              Display
            </h2>
            <div className="rounded-[10px] bg-[#202122] border border-[#3A3D3E] divide-y divide-[#3A3D3E]">
              {/* Timeline Density */}
              <div className="min-h-[64px] p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[16px] font-medium text-[#ECECE7] block">
                    Timeline density
                  </span>
                  <p className="text-[14px] text-[#A1A9A5] m-0 mt-0.5">
                    Controls lane heights and spacing across the time canvas.
                  </p>
                </div>
                <select
                  value={density}
                  onChange={(e) => setDensity(e.target.value as any)}
                  className="h-[44px] px-3.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[14px] text-[#ECECE7] focus:outline-none focus:border-[#ECECE7]"
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </div>

              {/* Reduce Motion */}
              <div className="min-h-[64px] p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[16px] font-medium text-[#ECECE7] block">
                    Reduce motion
                  </span>
                  <p className="text-[14px] text-[#A1A9A5] m-0 mt-0.5">
                    Minimize UI transitions and animations beyond system preferences.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    reduceMotion ? "bg-[#DDB66D]" : "bg-[#27292A] border border-[#3A3D3E]"
                  }`}
                  aria-label="Toggle reduce motion"
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-[#171819] absolute top-0.5 transition-transform ${
                      reduceMotion ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Metric-help explanation */}
              <div className="min-h-[64px] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-[#DDB66D] shrink-0" />
                  <div>
                    <span className="text-[16px] font-medium text-[#ECECE7] block">
                      Metric help gestures
                    </span>
                    <p className="text-[14px] text-[#A1A9A5] m-0 mt-0.5">
                      Tap the info button or press and hold any metric headline for 500ms to open calculation details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI observations Group */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[18px] font-semibold text-[#ECECE7] m-0">
              AI observations
            </h2>
            <div className="rounded-[10px] bg-[#202122] border border-[#3A3D3E] divide-y divide-[#3A3D3E]">
              {/* Enabled toggle */}
              <div className="min-h-[64px] p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[16px] font-medium text-[#ECECE7] block">
                    Enable AI observations
                  </span>
                  <p className="text-[14px] text-[#A1A9A5] m-0 mt-0.5">
                    Generate concise deterministic reflections beneath your overview header.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    aiEnabled ? "bg-[#DDB66D]" : "bg-[#27292A] border border-[#3A3D3E]"
                  }`}
                  aria-label="Toggle AI observations"
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-[#171819] absolute top-0.5 transition-transform ${
                      aiEnabled ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Tone selection: Witty / Straight / Gentle */}
              <div className="min-h-[64px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[16px] font-medium text-[#ECECE7] block">
                    Communication style
                  </span>
                  <p className="text-[14px] text-[#A1A9A5] m-0 mt-0.5">
                    Determines phrasing and observation angle.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(
                    [
                      { key: "witty", label: "Witty" },
                      { key: "straight", label: "Straight facts" },
                      { key: "gentle", label: "Gentle" },
                    ] as const
                  ).map((tone) => {
                    const isSelected = aiTone === tone.key;
                    return (
                      <button
                        key={tone.key}
                        onClick={() => setAiTone(tone.key)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-[6px] text-[14px] font-medium border transition-colors ${
                          isSelected
                            ? "bg-[#27292A] text-[#ECECE7] border-[#3A3D3E] border-b-2 border-b-[#DDB66D]"
                            : "bg-[#171819] text-[#A1A9A5] border-[#3A3D3E] hover:text-[#ECECE7]"
                        }`}
                      >
                        {tone.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sharing Group */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[18px] font-semibold text-[#ECECE7] m-0">
              Sharing and privacy
            </h2>
            <div className="rounded-[10px] bg-[#202122] border border-[#3A3D3E] p-4 flex flex-col gap-4">
              <div>
                <span className="text-[16px] font-medium text-[#ECECE7] block">
                  External processing scope
                </span>
                <p className="text-[14px] text-[#A1A9A5] m-0 mt-0.5">
                  Default aggregate-only sharing ensures raw activity labels never leave your device.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <label className="flex items-start gap-3 cursor-pointer text-[#ECECE7]">
                  <input
                    type="radio"
                    name="sharing"
                    checked={shareStyle === "aggregate"}
                    onChange={() => setShareStyle("aggregate")}
                    className="mt-1 accent-[#DDB66D]"
                  />
                  <div>
                    <span className="text-[14px] font-medium block">Aggregate facts only (Recommended)</span>
                    <span className="text-[13px] text-[#A1A9A5]">
                      Only category totals and duration statistics are processed; zero URLs or window titles.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer text-[#ECECE7]">
                  <input
                    type="radio"
                    name="sharing"
                    checked={shareStyle === "named"}
                    onChange={() => setShareStyle("named")}
                    className="mt-1 accent-[#DDB66D]"
                  />
                  <div>
                    <span className="text-[14px] font-medium block">Include selected public app names</span>
                    <span className="text-[13px] text-[#A1A9A5]">
                      Permitted broad app names (e.g. Figma, VS Code) are shared with model context.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Regional & Calendar Preferences */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[18px] font-semibold text-[#ECECE7] m-0">
              Preferences
            </h2>
            <div className="rounded-[10px] bg-[#202122] border border-[#3A3D3E] divide-y divide-[#3A3D3E]">
              <div className="min-h-[64px] p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[16px] font-medium text-[#ECECE7] block">Language</span>
                  <p className="text-[14px] text-[#A1A9A5] m-0 mt-0.5">Interface language and format conventions.</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-[44px] px-3.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[14px] text-[#ECECE7] focus:outline-none focus:border-[#ECECE7]"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                </select>
              </div>

              <div className="min-h-[64px] p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[16px] font-medium text-[#ECECE7] block">Start week on</span>
                  <p className="text-[14px] text-[#A1A9A5] m-0 mt-0.5">Determines 7-day reporting cycles and calendar alignment.</p>
                </div>
                <select
                  value={startWeekOn}
                  onChange={(e) => setStartWeekOn(e.target.value)}
                  className="h-[44px] px-3.5 rounded-[6px] bg-[#171819] border border-[#3A3D3E] text-[14px] text-[#ECECE7] focus:outline-none focus:border-[#ECECE7]"
                >
                  <option value="monday">Monday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DEVICES & DATA (Screen 16, START-HERE.md §7.9)     */}
      {/* ========================================================= */}
      {activeTab === "devices" && (
        <div className="flex flex-col gap-8">
          {/* Connected Devices Group */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[18px] font-semibold text-[#ECECE7] m-0">
              Connected devices
            </h2>
            <div className="rounded-[10px] bg-[#202122] border border-[#3A3D3E] divide-y divide-[#3A3D3E]">
              {/* Device 1: Computer */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Laptop className="w-5 h-5 text-[#ECECE7] shrink-0" />
                    <div>
                      <div className="text-[16px] font-medium text-[#ECECE7]">Computer · Chrome extension</div>
                      <div className="text-[13px] text-[#A1A9A5]">MacBook Pro · macOS 14</div>
                    </div>
                  </div>
                  <span className="text-[13px] px-2.5 py-1 rounded-[6px] bg-[#90D2BC]/15 text-[#90D2BC] font-medium border border-[#90D2BC]/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#90D2BC]" />
                    Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[13px] text-[#A1A9A5] pt-2 border-t border-[#3A3D3E]">
                  <div>Last recorded: <span className="text-[#ECECE7] font-mono">Today, 10:24</span></div>
                  <div>Last synced: <span className="text-[#ECECE7] font-mono">Today, 10:24</span></div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button className="min-h-[44px] px-4 rounded-[6px] bg-[#171819] border border-[#3A3D3E] hover:bg-[#27292A] text-[14px] text-[#ECECE7] font-medium transition-colors">
                    View sync details
                  </button>
                  <button className="min-h-[44px] px-4 rounded-[6px] bg-transparent hover:bg-[#DFA095]/10 text-[14px] text-[#DFA095] transition-colors">
                    Remove device
                  </button>
                </div>
              </div>

              {/* Device 2: Phone */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[#ECECE7] shrink-0" />
                    <div>
                      <div className="text-[16px] font-medium text-[#ECECE7]">Phone · Android</div>
                      <div className="text-[13px] text-[#A1A9A5]">Pixel 7 · Android 14</div>
                    </div>
                  </div>
                  <span className="text-[13px] px-2.5 py-1 rounded-[6px] bg-[#90D2BC]/15 text-[#90D2BC] font-medium border border-[#90D2BC]/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#90D2BC]" />
                    Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[13px] text-[#A1A9A5] pt-2 border-t border-[#3A3D3E]">
                  <div>Last recorded: <span className="text-[#ECECE7] font-mono">Today, 08:17</span></div>
                  <div>Last synced: <span className="text-[#ECECE7] font-mono">Today, 08:16</span></div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button className="min-h-[44px] px-4 rounded-[6px] bg-[#171819] border border-[#3A3D3E] hover:bg-[#27292A] text-[14px] text-[#ECECE7] font-medium transition-colors">
                    View sync details
                  </button>
                  <button className="min-h-[44px] px-4 rounded-[6px] bg-transparent hover:bg-[#DFA095]/10 text-[14px] text-[#DFA095] transition-colors">
                    Remove device
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Data Safeguards */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[18px] font-semibold text-[#ECECE7] m-0">
              Data safeguards
            </h2>
            <div className="rounded-[10px] bg-[#202122] border border-[#3A3D3E] p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[16px] font-medium text-[#ECECE7]">
                <Shield className="w-5 h-5 text-[#DDB66D]" />
                <span>Zero intrusive capture</span>
              </div>

              <div className="flex flex-col gap-3 text-[14px] leading-relaxed text-[#A1A9A5]">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#90D2BC] font-bold text-base leading-none">✓</span>
                  <div>
                    <strong className="text-[#ECECE7] block font-medium">No screen content, keystrokes, or browser history</strong>
                    Timeframe only receives window-level focus timestamps and active application identifiers.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-[#90D2BC] font-bold text-base leading-none">✓</span>
                  <div>
                    <strong className="text-[#ECECE7] block font-medium">Reversible analysis exclusion vs. deletion</strong>
                    Excluding an app removes it immediately from focus metrics and AI observations without destroying raw capture timestamps needed for timeline continuity.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Device Recovery */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[18px] font-semibold text-[#ECECE7] m-0">
              Device recovery
            </h2>
            <div className="rounded-[10px] bg-[#202122] border border-[#3A3D3E] p-5 flex flex-col gap-4">
              <p className="text-[14px] text-[#A1A9A5] leading-relaxed m-0">
                Re-authenticate a collector if you&apos;ve cleared local browser storage or reinstalled the extension.
              </p>
              <button className="min-h-[44px] px-4 rounded-[6px] bg-[#171819] border border-[#3A3D3E] hover:bg-[#27292A] text-[14px] text-[#ECECE7] font-medium transition-colors self-start flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#A1A9A5]" />
                <span>Recover this device</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[14px] text-[#A1A9A5]">Loading settings…</div>}>
      <SettingsContent />
    </Suspense>
  );
}
