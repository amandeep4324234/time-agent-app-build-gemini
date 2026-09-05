"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SEED_WORK, SEED_KILLERS } from "@/lib/classify";
import { Button } from "@/components/ui/button";

/**
 * First-run onboarding per TIMEFRAME-UI-REDESIGN.md §11.3:
 * "See where your time goes."
 * "Timeframe measures which app is on the screen and for how long. It never sees screen content, keystrokes, or anything you type."
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { setSeedPins, setOnboarded } = useAppStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedWork, setSelectedWork] = useState<string[]>([...SEED_WORK]);
  const [selectedKillers, setSelectedKillers] = useState<string[]>([...SEED_KILLERS]);

  const toggleWork = (item: string) => {
    setSelectedWork((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleKiller = (item: string) => {
    setSelectedKillers((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleFinish = () => {
    setSeedPins({
      work: selectedWork,
      killers: selectedKillers,
    });
    setOnboarded(true);
    router.push("/app");
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-[560px] w-full mx-auto p-4 text-center">
      {/* Screen 1: Real setup panel (§11.3) */}
      {step === 1 && (
        <div className="flex flex-col items-center gap-6 w-full p-6 md:p-8 rounded-[10px] border border-[#303B49] bg-[#141A22] text-left">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold text-[#EDF1F5]">
              See where your time goes
            </h1>
            <p className="text-sm text-[#B0BBC9] leading-relaxed">
              Timeframe measures which app is on the screen and for how long. It never sees screen content, keystrokes, or anything you type.
            </p>
          </div>

          <div className="text-xs text-[#94A1B2] border-t border-[#303B49] pt-4 w-full">
            Private activity is excluded from all views. All metrics are computed locally on your device.
          </div>

          <div className="flex items-center gap-3 w-full pt-2">
            <Button variant="primary" onClick={() => setStep(2)} className="flex-1">
              Configure app categories
            </Button>
            <Button variant="secondary" onClick={handleFinish} className="flex-1">
              Not now
            </Button>
          </div>
        </div>
      )}

      {/* Screen 2: Initial category seeds */}
      {step === 2 && (
        <div className="flex flex-col gap-6 text-left w-full p-6 md:p-8 rounded-[10px] border border-[#303B49] bg-[#141A22]">
          <div className="border-b border-[#303B49] pb-3">
            <h2 className="text-lg font-semibold text-[#EDF1F5]">
              Confirm initial app categories
            </h2>
            <p className="text-xs text-[#94A1B2] mt-1">
              Select which apps should count toward focus time or sinks. You can change these anytime in Settings.
            </p>
          </div>

          {/* Work Seeds */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[#B0BBC9]">
              Work apps (count as focus time)
            </span>
            <div className="flex flex-wrap gap-2">
              {SEED_WORK.map((item) => {
                const isSelected = selectedWork.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleWork(item)}
                    className={`px-3 py-1.5 rounded-[6px] text-xs transition-colors border ${
                      isSelected
                        ? "bg-[#E4B45F]/15 border-[#E4B45F] text-[#E4B45F] font-medium"
                        : "bg-[#1D2530] border-[#303B49] text-[#94A1B2] hover:text-[#EDF1F5]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sink Seeds */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[#B0BBC9]">
              Sink apps (categorized as sinks)
            </span>
            <div className="flex flex-wrap gap-2">
              {SEED_KILLERS.map((item) => {
                const isSelected = selectedKillers.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleKiller(item)}
                    className={`px-3 py-1.5 rounded-[6px] text-xs transition-colors border ${
                      isSelected
                        ? "bg-[#F28D87]/15 border-[#F28D87] text-[#F28D87] font-medium"
                        : "bg-[#1D2530] border-[#303B49] text-[#94A1B2] hover:text-[#EDF1F5]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#303B49] flex justify-end">
            <Button variant="primary" onClick={handleFinish} className="w-full">
              Finish setup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
