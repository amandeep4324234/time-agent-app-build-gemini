"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SEED_WORK, SEED_KILLERS } from "@/lib/classify";
import { COPY } from "@/lib/copy";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const router = useRouter();
  const { setSeedPins, setOnboarded } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  const handleSavePins = () => {
    setSeedPins({
      work: selectedWork,
      killers: selectedKillers,
    });
    setOnboarded(true);
    router.push("/app");
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-[560px] mx-auto p-4 font-mono text-center">
      {/* Screen 1: The Egg */}
      {step === 1 && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-160">
          <div className="w-20 h-20 rounded-[4px] bg-[#161B22] border border-[#21262D] flex items-center justify-center relative">
            <svg viewBox="0 0 64 64" className="w-12 h-12 text-[#8B949E]">
              <ellipse cx="32" cy="34" rx="16" ry="20" fill="#0D1117" stroke="currentColor" strokeWidth="1" />
              <path d="M38 18 L36 24 L40 30" fill="none" stroke="#D29922" strokeWidth="1" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#E6EDF3]">
              {COPY.egg.headline}
            </h1>
            <p className="text-xs text-[#8B949E] max-w-xs">
              {COPY.egg.sub}
            </p>
          </div>

          <Button variant="primary" onClick={() => setStep(2)} className="min-w-[160px]">
            Continue
          </Button>
        </div>
      )}

      {/* Screen 2: Web Honesty Contract */}
      {step === 2 && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-160 w-full">
          <div className="flex flex-col gap-3 text-left bg-[#161B22] p-6 rounded-[4px] border border-[#21262D] w-full">
            <h1 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#E6EDF3]">
              {COPY.onboardingWeb.headline}
            </h1>
            <p className="text-xs text-[#8B949E] leading-relaxed">
              {COPY.onboardingWeb.body}
            </p>
            <div className="text-[11px] text-[#D29922] border-t border-[#21262D] pt-3 mt-1">
              {COPY.onboardingWeb.disclosure}
            </div>
          </div>

          <Button variant="primary" onClick={() => setStep(3)} className="min-w-[160px]">
            Continue to Pins
          </Button>
        </div>
      )}

      {/* Screen 3: Chip Lists */}
      {step === 3 && (
        <div className="flex flex-col gap-6 text-left w-full animate-in fade-in duration-160">
          <div className="border-b border-[#21262D] pb-3">
            <h1 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#E6EDF3]">
              {COPY.prompts.pinApps}
            </h1>
            <p className="text-[11px] text-[#6E7681] mt-1">
              {COPY.prompts.subLine}
            </p>
          </div>

          {/* Work Seeds */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
              Focus-set time seeds
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SEED_WORK.map((item) => {
                const isSelected = selectedWork.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleWork(item)}
                    className={`px-2.5 py-1 rounded-[2px] text-xs transition-colors border ${
                      isSelected
                        ? "bg-[#D29922]/10 border-[#D29922] text-[#D29922]"
                        : "bg-[#161B22] border-[#21262D] text-[#8B949E] hover:text-[#E6EDF3]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Killer Seeds */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
              Killer-set seeds
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SEED_KILLERS.map((item) => {
                const isSelected = selectedKillers.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleKiller(item)}
                    className={`px-2.5 py-1 rounded-[2px] text-xs transition-colors border ${
                      isSelected
                        ? "bg-[#F85149]/10 border-[#F85149] text-[#F85149]"
                        : "bg-[#161B22] border-[#21262D] text-[#8B949E] hover:text-[#E6EDF3]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chess Note Line */}
          <div className="text-[11px] text-[#6E7681] border-t border-[#21262D] pt-3">
            {COPY.prompts.chessCaption}
          </div>

          <Button variant="primary" onClick={handleSavePins} className="w-full mt-2">
            {COPY.onboardingWeb.primaryButton}
          </Button>
        </div>
      )}
    </div>
  );
}
