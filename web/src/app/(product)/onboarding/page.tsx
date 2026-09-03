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
    <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-lg mx-auto p-6 text-center">
      {/* Screen 1: The Egg */}
      {step === 1 && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
          <div className="w-24 h-24 rounded-full bg-[#12151D] border-2 border-[#222735] flex items-center justify-center relative">
            <svg viewBox="0 0 64 64" className="w-16 h-16 text-[#94A3B8]">
              <ellipse cx="32" cy="34" rx="20" ry="24" fill="#1E2538" stroke="currentColor" strokeWidth="2" />
              {/* 6px crack line */}
              <path d="M38 18 L36 24 L40 30" fill="none" stroke="#F8FAFC" strokeWidth="2" strokeOpacity="0.6" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
              {COPY.egg.headline}
            </h1>
            <p className="text-sm text-[#94A3B8] max-w-xs">
              {COPY.egg.sub}
            </p>
          </div>

          <Button variant="primary" onClick={() => setStep(2)} className="mt-4 min-w-[160px]">
            Continue
          </Button>
        </div>
      )}

      {/* Screen 2: Web Honesty Contract */}
      {step === 2 && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
          <div className="flex flex-col gap-3 text-left bg-[#12151D] p-6 rounded-xl border border-[#222735]">
            <h1 className="text-lg font-bold tracking-tight text-[#F8FAFC]">
              {COPY.onboardingWeb.headline}
            </h1>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              {COPY.onboardingWeb.body}
            </p>
            <div className="text-xs font-mono text-[#22D3EE] border-t border-[#222735] pt-3 mt-1">
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
        <div className="flex flex-col gap-6 text-left w-full animate-in fade-in duration-300">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#F8FAFC]">
              {COPY.prompts.pinApps}
            </h1>
            <p className="text-xs font-mono text-[#94A3B8] mt-1">
              {COPY.prompts.subLine}
            </p>
          </div>

          {/* Work Seeds */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">
              Focus-set time seeds
            </span>
            <div className="flex flex-wrap gap-2">
              {SEED_WORK.map((item) => {
                const isSelected = selectedWork.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleWork(item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors border ${
                      isSelected
                        ? "bg-[#22D3EE]/10 border-[#22D3EE] text-[#22D3EE]"
                        : "bg-[#12151D] border-[#222735] text-[#94A3B8]"
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
            <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">
              Killer-set seeds
            </span>
            <div className="flex flex-wrap gap-2">
              {SEED_KILLERS.map((item) => {
                const isSelected = selectedKillers.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleKiller(item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors border ${
                      isSelected
                        ? "bg-[#F43F5E]/10 border-[#F43F5E] text-[#F43F5E]"
                        : "bg-[#12151D] border-[#222735] text-[#94A3B8]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chess Note Line */}
          <div className="text-xs font-mono text-[#64748B] border-t border-[#222735] pt-3">
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
