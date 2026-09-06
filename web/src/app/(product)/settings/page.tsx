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
  Trash2,
  Lock,
  Moon,
  Sparkles,
  Sliders,
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

  // Primary Tabs: appearance (Image 2 Panel 3) | devices (Image 2 Panel 4)
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

  // Appearance States
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [shareStyle, setShareStyle] = useState<"aggregate" | "named">("aggregate");
  const [language, setLanguage] = useState("en-US");
  const [startWeekOn, setStartWeekOn] = useState("monday");

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto select-text">
      {/* 1. Top Section Header & Tab Switcher (Image 2 Panels 3 & 4) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#26282A] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#ECECE7] tracking-tight">
            Settings &rsaquo; {activeTab === "appearance" ? "Appearance and AI" : "Devices & data"}
          </h1>
          <p className="text-xs text-[#8E9296] mt-0.5">
            {activeTab === "appearance"
              ? "Customize how timeframe looks and works for you."
              : "Manage your connected devices and data."}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#1E1F21] p-1 rounded-[8px] border border-[#2F3134] text-xs">
          <button
            onClick={() => handleSelectTab("appearance")}
            className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors ${
              activeTab === "appearance"
                ? "bg-[#DDB66D] text-[#121314] font-semibold"
                : "text-[#8E9296] hover:text-[#ECECE7]"
            }`}
          >
            Appearance &amp; AI
          </button>
          <button
            onClick={() => handleSelectTab("devices")}
            className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors ${
              activeTab === "devices"
                ? "bg-[#DDB66D] text-[#121314] font-semibold"
                : "text-[#8E9296] hover:text-[#ECECE7]"
            }`}
          >
            Devices &amp; data
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: APPEARANCE AND AI (Image 2 Panel 3) */}
      {/* ========================================================= */}
      {activeTab === "appearance" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7/12): Display, AI observations, Sharing, Gestures */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Display Group */}
            <div className="p-4 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ECECE7]">
                Display
              </h3>

              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs text-[#ECECE7] font-medium">Timeline density</span>
                  <p className="text-[11px] text-[#8E9296]">Control how much detail to show in timelines and logs.</p>
                </div>
                <select
                  value={density}
                  onChange={(e) => setDensity(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#26282A] border border-[#3A3D3E] text-xs text-[#ECECE7] focus:outline-none"
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-1 border-t border-[#26282A] pt-3">
                <div>
                  <span className="text-xs text-[#ECECE7] font-medium">Reduce motion</span>
                  <p className="text-[11px] text-[#8E9296]">Minimize animations across the app.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    reduceMotion ? "bg-[#DDB66D]" : "bg-[#2A2C2E]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-[#121314] absolute top-0.5 transition-transform ${
                      reduceMotion ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* AI observations Group */}
            <div className="p-4 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ECECE7]">
                AI observations
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#ECECE7] font-medium">Enable AI observations</span>
                  <p className="text-[11px] text-[#8E9296]">Get helpful insights about your time, automatically.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    aiEnabled ? "bg-[#DDB66D]" : "bg-[#2A2C2E]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-[#121314] absolute top-0.5 transition-transform ${
                      aiEnabled ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Communication Style Selector */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#26282A]">
                <div>
                  <span className="text-xs text-[#ECECE7] font-medium">Communication style</span>
                  <p className="text-[11px] text-[#8E9296]">Choose how AI explains things.</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
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
                        className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-[#1E1F21] text-[#DDB66D] border border-[#DDB66D]/70 shadow-sm"
                            : "bg-[#26282A] text-[#8E9296] hover:text-[#ECECE7] border border-[#3A3D3E]"
                        }`}
                      >
                        {tone.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sharing Group */}
            <div className="p-4 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ECECE7]">
                Sharing
              </h3>

              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#ECECE7] font-medium">What to share</span>
                <p className="text-[11px] text-[#8E9296]">Control what&apos;s included when you share your data.</p>

                <div className="flex flex-col gap-2 pt-1 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer text-[#ECECE7]">
                    <input
                      type="radio"
                      name="sharing"
                      checked={shareStyle === "aggregate"}
                      onChange={() => setShareStyle("aggregate")}
                      className="accent-[#DDB66D]"
                    />
                    <span>Aggregate facts only</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-[#ECECE7]">
                    <input
                      type="radio"
                      name="sharing"
                      checked={shareStyle === "named"}
                      onChange={() => setShareStyle("named")}
                      className="accent-[#DDB66D]"
                    />
                    <span>Include selected app names</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Metric Gestures Info Card */}
            <div className="p-3 rounded-[8px] bg-[#18191B] border border-[#26282A] flex items-center gap-3 text-xs text-[#8E9296]">
              <HelpCircle className="w-4 h-4 text-[#DDB66D] shrink-0" />
              <span>Hold a metric or tap its info button to see a quick explanation.</span>
            </div>
          </div>

          {/* Right Column (5/12): Theme Preview & App Preferences */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Theme Preview Card (Image 2 Panel 3) */}
            <div className="p-4 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ECECE7]">
                Theme preview
              </h3>

              {/* Mini Window Preview */}
              <div className="rounded-[8px] bg-[#141516] border border-[#26282A] p-3 flex flex-col gap-3 shadow-inner">
                {/* 3 Window Dots */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E5534B]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#57AB5A]" />
                </div>

                {/* Window Inner Content */}
                <div className="flex gap-3 items-center">
                  <div className="flex flex-col gap-1 text-[10px] text-[#8E9296] w-20 border-r border-[#26282A] pr-2">
                    <span className="text-[#ECECE7] font-semibold">timeframe</span>
                    <span className="text-[#DDB66D]">Overview</span>
                    <span>Focus blocks</span>
                    <span>Insights</span>
                  </div>

                  {/* Mini Bars */}
                  <div className="flex items-end gap-1 h-12 flex-1 justify-center pb-1">
                    <div className="w-2 bg-[#DDB66D] h-6 rounded-t-[1px]" />
                    <div className="w-2 bg-[#DDB66D] h-9 rounded-t-[1px]" />
                    <div className="w-2 bg-[#DDB66D] h-4 rounded-t-[1px]" />
                    <div className="w-2 bg-[#DDB66D] h-10 rounded-t-[1px]" />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#ECECE7]">Graphite theme</div>
                <div className="text-[11px] text-[#8E9296] mt-0.5">Clean, focused and easy on the eyes.</div>
              </div>
            </div>

            {/* App Preferences */}
            <div className="p-4 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ECECE7]">
                App preferences
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#ECECE7] font-medium">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#26282A] border border-[#3A3D3E] text-xs text-[#ECECE7] focus:outline-none"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-[#26282A] pt-3">
                <span className="text-xs text-[#ECECE7] font-medium">Start week on</span>
                <select
                  value={startWeekOn}
                  onChange={(e) => setStartWeekOn(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#26282A] border border-[#3A3D3E] text-xs text-[#ECECE7] focus:outline-none"
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
      {/* TAB 2: DEVICES & DATA (Image 2 Panel 4) */}
      {/* ========================================================= */}
      {activeTab === "devices" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7/12): Connected devices & Data management */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Connected devices Card */}
            <div className="p-4 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ECECE7]">
                Connected devices
              </h3>

              {/* Device 1: Computer */}
              <div className="p-3.5 rounded-[8px] bg-[#202122] border border-[#2E3033] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Laptop className="w-5 h-5 text-[#ECECE7]" />
                    <div>
                      <div className="text-xs font-bold text-[#ECECE7]">Computer · Chrome extension</div>
                      <div className="text-[11px] text-[#8E9296]">MacBook Pro · macOS 14</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#57AB5A]/15 text-[#57AB5A] font-semibold border border-[#57AB5A]/30">
                    ● Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8E9296] pt-2 border-t border-[#2A2C2E]">
                  <div>Last recorded: <span className="text-[#ECECE7]">Today, 10:24</span></div>
                  <div>Last synced: <span className="text-[#ECECE7]">Today, 10:24</span></div>
                  <div className="col-span-2">Pending items: <span className="text-[#DDB66D]">1 saved locally</span></div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button className="px-3 py-1.5 rounded-[6px] bg-[#2A2C2E] hover:bg-[#34373A] text-xs text-[#ECECE7] font-medium transition-colors">
                    View sync details
                  </button>
                  <button className="px-3 py-1.5 rounded-[6px] bg-transparent hover:bg-[#E5534B]/10 text-xs text-[#E5534B] transition-colors">
                    Remove device
                  </button>
                </div>
              </div>

              {/* Device 2: Phone */}
              <div className="p-3.5 rounded-[8px] bg-[#202122] border border-[#2E3033] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-5 h-5 text-[#ECECE7]" />
                    <div>
                      <div className="text-xs font-bold text-[#ECECE7]">Phone · Android</div>
                      <div className="text-[11px] text-[#8E9296]">Pixel 7 · Android 14</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#57AB5A]/15 text-[#57AB5A] font-semibold border border-[#57AB5A]/30">
                    ● Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8E9296] pt-2 border-t border-[#2A2C2E]">
                  <div>Last recorded: <span className="text-[#ECECE7]">Today, 08:17</span></div>
                  <div>Last synced: <span className="text-[#ECECE7]">Today, 08:16</span></div>
                  <div className="col-span-2">Pending items: <span className="text-[#ECECE7]">0</span></div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button className="px-3 py-1.5 rounded-[6px] bg-[#2A2C2E] hover:bg-[#34373A] text-xs text-[#ECECE7] font-medium transition-colors">
                    View sync details
                  </button>
                  <button className="px-3 py-1.5 rounded-[6px] bg-transparent hover:bg-[#E5534B]/10 text-xs text-[#E5534B] transition-colors">
                    Remove device
                  </button>
                </div>
              </div>
            </div>

            {/* Data Management Card */}
            <div className="p-4 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ECECE7]">
                Data management
              </h3>

              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs text-[#ECECE7] font-medium">Exclude apps or websites</span>
                  <p className="text-[11px] text-[#8E9296]">Prevent selected apps from appearing in your data.</p>
                </div>
                <button className="px-3 py-1.5 rounded-[6px] bg-[#26282A] border border-[#3A3D3E] hover:bg-[#303336] text-xs text-[#ECECE7] font-medium transition-colors">
                  Manage exclusions
                </button>
              </div>

              <div className="flex items-center justify-between py-1 border-t border-[#26282A] pt-3">
                <div>
                  <span className="text-xs text-[#ECECE7] font-medium">Delete activity data</span>
                  <p className="text-[11px] text-[#8E9296]">Permanently remove activity from your account.</p>
                </div>
                <button className="px-3 py-1.5 rounded-[6px] bg-[#E5534B]/15 border border-[#E5534B]/30 hover:bg-[#E5534B]/25 text-xs text-[#E5534B] font-semibold transition-colors">
                  Delete data
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (5/12): Privacy & Device Recovery */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Privacy Card (Image 2 Panel 4) */}
            <div className="p-4 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] flex flex-col gap-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#ECECE7]">
                <Shield className="w-4 h-4 text-[#DDB66D]" />
                <span>Privacy</span>
              </div>

              <div className="flex flex-col gap-3 text-xs leading-relaxed text-[#8E9296]">
                <div className="flex items-start gap-2">
                  <span className="text-[#57AB5A] font-bold text-sm leading-none">✓</span>
                  <div>
                    <strong className="text-[#ECECE7] block">No screen content or keystrokes</strong>
                    We only collect app and window activity, never what you type or view.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[#57AB5A] font-bold text-sm leading-none">✓</span>
                  <div>
                    <strong className="text-[#ECECE7] block">Private activity is excluded from views</strong>
                    Content marked private will not appear in your logs, insights or exports.
                  </div>
                </div>
              </div>
            </div>

            {/* Device Recovery Card */}
            <div className="p-4 rounded-[10px] bg-[#1C1D1F] border border-[#2A2C2E] flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#ECECE7]">
                <RefreshCw className="w-4 h-4 text-[#8E9296]" />
                <span>Device recovery</span>
              </div>

              <p className="text-xs text-[#8E9296] leading-relaxed">
                Re-authenticate a device if you&apos;ve reinstalled the app or changed your browser.
              </p>

              <button className="py-2 px-3 rounded-[6px] bg-[#26282A] border border-[#3A3D3E] hover:bg-[#303336] text-xs text-[#ECECE7] font-medium transition-colors self-start">
                Recover this device
              </button>
            </div>

            {/* Footnote */}
            <div className="text-right text-[10px] text-[#6E737A] pt-2">
              Illustrative data &bull; v1.0.0
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#8E9296]">Loading settings…</div>}>
      <SettingsContent />
    </Suspense>
  );
}
