import React from "react";
import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F8FAFC] flex flex-col justify-between selection:bg-[#22D3EE]/20 selection:text-[#22D3EE]">
      {/* Navigation */}
      <header className="h-20 w-full max-w-6xl mx-auto px-6 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-[#F8FAFC]">
          Timeframe
        </span>
        <div className="flex items-center gap-6 text-sm">
          <Link href="#pricing" className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">
            Pricing
          </Link>
          <Link
            href="/app"
            className="px-5 py-2.5 rounded-full bg-[#F8FAFC] text-[#0A0C10] font-medium hover:bg-[#E2E8F0] transition-all"
          >
            Open Ledger
          </Link>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-12">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#222735] bg-[#12151D] text-xs font-mono text-[#94A3B8]">
            <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
            Local-first cross-device attention ledger
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#F8FAFC] max-w-2xl leading-tight">
            States the number. Names its own blind spots.
          </h1>

          <p className="text-base md:text-lg text-[#94A3B8] max-w-xl leading-relaxed">
            A builder’s attention is spent in fragments. Timeframe computes the real interval union across phone and computer. No moralizing scores, no fake zeros, no diagnosis.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/app"
            className="px-8 py-3.5 rounded-full bg-[#F8FAFC] text-[#0A0C10] font-semibold text-sm hover:bg-[#E2E8F0] transition-all shadow-lg min-w-[180px]"
          >
            Open the Ledger
          </Link>
          <Link
            href="/onboarding"
            className="px-8 py-3.5 rounded-full border border-[#333D52] text-[#E2E8F0] font-semibold text-sm hover:bg-[#1E2538] transition-all min-w-[180px]"
          >
            Get Started
          </Link>
        </div>

        {/* 3-Number Demo Strip */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <div className="p-6 rounded-xl border border-[#222735] bg-[#12151D] flex flex-col gap-1 items-center">
            <span className="text-3xl font-mono font-bold text-[#22D3EE]">39.37h</span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
              Cross-device union
            </span>
          </div>
          <div className="p-6 rounded-xl border border-[#222735] bg-[#12151D] flex flex-col gap-1 items-center">
            <span className="text-3xl font-mono font-bold text-[#F8FAFC]">39.61h</span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
              Raw sum
            </span>
          </div>
          <div className="p-6 rounded-xl border border-[#222735] bg-[#12151D] flex flex-col gap-1 items-center">
            <span className="text-3xl font-mono font-bold text-[#F43F5E]">0.24h</span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
              Double-count eliminated
            </span>
          </div>
        </div>

        {/* The Four Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-12 w-full">
          <div className="p-6 rounded-xl border border-[#222735] bg-[#12151D]/60 flex flex-col gap-2">
            <span className="text-xs font-mono text-[#22D3EE]">Pillar 1</span>
            <h3 className="text-base font-semibold text-[#F8FAFC]">The ledger never lies</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Interval union, not naive sum. Wall-clock run length. Blank, not zero, for missing measurement. Same input produces the exact same numbers, every time.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-[#222735] bg-[#12151D]/60 flex flex-col gap-2">
            <span className="text-xs font-mono text-[#22D3EE]">Pillar 2</span>
            <h3 className="text-base font-semibold text-[#F8FAFC]">Confess the instrument</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              When a tracker goes dark, the banner appears and refuses to dismiss until the writer logs again. The unclassified badge states unmeasured domains plainly.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-[#222735] bg-[#12151D]/60 flex flex-col gap-2">
            <span className="text-xs font-mono text-[#22D3EE]">Pillar 3</span>
            <h3 className="text-base font-semibold text-[#F8FAFC]">Reward approach</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Longest-run sits beside the block count so a zero-block day still reads its longest continuous work. You are never the defendant.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-[#222735] bg-[#12151D]/60 flex flex-col gap-2">
            <span className="text-xs font-mono text-[#22D3EE]">Pillar 4</span>
            <h3 className="text-base font-semibold text-[#F8FAFC]">Cargo, not gate</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Charm rides on the truth; it never carries it. The ledger, all seven numbers, the heatmap, and exports are 100% free and local-first forever.
            </p>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="w-full pt-16 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
              Simple, Honest Pricing
            </h2>
            <p className="text-xs font-mono text-[#94A3B8]">
              No metrics or history windows are ever behind a paywall.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl text-left">
            {/* Free */}
            <div className="p-8 rounded-xl border border-[#222735] bg-[#12151D] flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                  Ledger Core
                </span>
                <div className="text-3xl font-mono font-bold text-[#F8FAFC]">Free</div>
                <ul className="text-xs font-mono text-[#94A3B8] flex flex-col gap-2">
                  <li>✓ All 7 dashboard cards</li>
                  <li>✓ True interval union & double-count math</li>
                  <li>✓ 24-hour heatmap & night shift accounting</li>
                  <li>✓ Unclassified & tracker-off confessions</li>
                  <li>✓ Basic creature companion</li>
                  <li>✓ Local-only storage & SAF export</li>
                </ul>
              </div>
              <Link
                href="/app"
                className="w-full py-3 text-center rounded-full border border-[#333D52] text-xs font-mono text-[#F8FAFC] hover:bg-[#1E2538] transition-colors"
              >
                Use Free
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-xl border border-[#22D3EE]/40 bg-[#12151D] flex flex-col justify-between gap-6 relative shadow-lg">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-[#22D3EE] border border-[#22D3EE]/40 px-2 py-0.5 rounded-full">
                Supporter
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#22D3EE]">
                  Timeframe Pro
                </span>
                <div className="text-3xl font-mono font-bold text-[#F8FAFC]">
                  ₹499 <span className="text-xs text-[#94A3B8] font-normal">/ month</span>
                </div>
                <ul className="text-xs font-mono text-[#94A3B8] flex flex-col gap-2">
                  <li>✓ Everything in Free</li>
                  <li>✓ Full creature evolution & stages</li>
                  <li>✓ Named killer on creature death</li>
                  <li>✓ Day streak counter</li>
                  <li>✓ Clean week card export (no watermark)</li>
                  <li>✓ Warmer debrief phrasings</li>
                </ul>
              </div>
              <Link
                href="/checkout"
                className="w-full py-3 text-center rounded-full bg-[#22D3EE] text-[#0A0C10] text-xs font-mono font-bold hover:bg-[#06B6D4] transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#222735] py-8 text-center text-xs font-mono text-[#64748B] flex flex-col gap-3">
        <div className="flex justify-center gap-6">
          <Link href="/terms" className="hover:text-[#F8FAFC] transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-[#F8FAFC] transition-colors">
            Privacy Policy
          </Link>
        </div>
        <div>Timeframe Labs · Bengaluru · GST 29AAAAA0000A1Z5</div>
      </footer>
    </div>
  );
}
