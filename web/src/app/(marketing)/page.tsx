import React from "react";
import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] font-mono flex flex-col justify-between selection:bg-[#D29922]/20 selection:text-[#D29922]">
      {/* Navigation */}
      <header className="h-14 w-full max-w-4xl mx-auto px-4 flex items-center justify-between border-b border-[#21262D]">
        <span className="text-sm font-semibold tracking-tight text-[#E6EDF3]">
          TIMEFRAME
        </span>
        <div className="flex items-center gap-4 text-xs">
          <Link href="#pricing" className="text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
            Pricing
          </Link>
          <Link
            href="/app"
            className="px-3 py-1 rounded-[2px] bg-[#E6EDF3] text-[#0D1117] font-medium hover:bg-white transition-colors"
          >
            Open Panel
          </Link>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center text-center gap-10">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[2px] border border-[#21262D] bg-[#161B22] text-[11px] text-[#8B949E]">
            <span className="w-1.5 h-1.5 rounded-[1px] bg-[#D29922]" />
            Screen-time instrument panel
          </div>

          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-[#E6EDF3] max-w-xl leading-snug">
            The instrument panel for people who are serious about their time.
          </h1>

          <p className="text-xs md:text-sm text-[#8B949E] max-w-lg leading-relaxed">
            Measures which app is on screen and for how long, never what is on it. Read-time focus runs, union hours, and an honest day timeline.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="px-5 py-2 rounded-[4px] bg-[#E6EDF3] text-[#0D1117] font-medium text-xs hover:bg-white transition-colors"
          >
            Open Instrument Panel
          </Link>
          <Link
            href="/onboarding"
            className="px-5 py-2 rounded-[4px] border border-[#21262D] bg-[#161B22] text-[#E6EDF3] font-medium text-xs hover:bg-[#1C2128] transition-colors"
          >
            Configure Pins
          </Link>
        </div>

        {/* 3-Number Demo Strip */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          <div className="p-4 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col gap-1 items-center">
            <span className="text-2xl font-bold text-[#D29922] tnum">4h 30m</span>
            <span className="text-[10px] uppercase tracking-wider text-[#8B949E]">
              Focus union hours
            </span>
          </div>
          <div className="p-4 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col gap-1 items-center">
            <span className="text-2xl font-bold text-[#F85149] tnum">1h 12m</span>
            <span className="text-[10px] uppercase tracking-wider text-[#8B949E]">
              Sink time
            </span>
          </div>
          <div className="p-4 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col gap-1 items-center">
            <span className="text-2xl font-bold text-[#E6EDF3] tnum">3 deep</span>
            <span className="text-[10px] uppercase tracking-wider text-[#8B949E]">
              Runs &gt;= 15 min
            </span>
          </div>
        </div>

        {/* The Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-6 w-full">
          <div className="p-4 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col gap-1.5">
            <span className="text-[10px] uppercase text-[#D29922]">Principle 1</span>
            <h2 className="text-xs font-semibold text-[#E6EDF3]">Interval union, not naive sum</h2>
            <p className="text-[11px] text-[#8B949E] leading-relaxed">
              When phone and computer overlap, time is counted once in all focus unions. Raw sum vs union double-count is reported plainly.
            </p>
          </div>

          <div className="p-4 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col gap-1.5">
            <span className="text-[10px] uppercase text-[#D29922]">Principle 2</span>
            <h2 className="text-xs font-semibold text-[#E6EDF3]">The sacred private fence</h2>
            <p className="text-[11px] text-[#8B949E] leading-relaxed">
              Health, dating, finance, and explicit apps appear as the literal word &quot;private&quot; on every surface, before any share or insight is produced.
            </p>
          </div>

          <div className="p-4 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col gap-1.5">
            <span className="text-[10px] uppercase text-[#D29922]">Principle 3</span>
            <h2 className="text-xs font-semibold text-[#E6EDF3]">Read-time math, zero stored metrics</h2>
            <p className="text-[11px] text-[#8B949E] leading-relaxed">
              All metrics compute at query time from 8 session-row fields. Sync is dumb append-only row replication.
            </p>
          </div>

          <div className="p-4 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col gap-1.5">
            <span className="text-[10px] uppercase text-[#D29922]">Principle 4</span>
            <h2 className="text-xs font-semibold text-[#E6EDF3]">The 5-second test</h2>
            <p className="text-[11px] text-[#8B949E] leading-relaxed">
              Every screen answers &quot;Was today a good day, and what ruined it?&quot; in 5 seconds. One hero, one signature day timeline, no gamified guilt.
            </p>
          </div>
        </div>

        {/* Pricing Section (BUSINESS.md §1 & §2) */}
        <div id="pricing" className="w-full pt-10 border-t border-[#21262D] flex flex-col items-center gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#E6EDF3]">
              PRICING
            </h2>
            <p className="text-[11px] text-[#8B949E]">
              Free is a complete product forever. Pro adds depth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
            {/* Free Tier */}
            <div className="p-5 rounded-[4px] border border-[#21262D] bg-[#161B22] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-[#E6EDF3]">FREE</span>
                  <span className="text-lg font-bold text-[#E6EDF3]">$0</span>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  Free forever. Never ads, never nags.
                </p>
                <div className="flex flex-col gap-1 pt-2 text-[11px] text-[#8B949E]">
                  <div>✓ Today view &amp; hero strip</div>
                  <div>✓ Signature day timeline with scrub</div>
                  <div>✓ Mix ring &amp; 12-week heatmap</div>
                  <div>✓ 7-day rolling history</div>
                  <div>✓ Free weekly shareable week card</div>
                  <div>✓ Permanent trust features &amp; private fence</div>
                </div>
              </div>

              <Link
                href="/app"
                className="w-full py-2 text-center rounded-[2px] border border-[#21262D] text-xs font-medium text-[#E6EDF3] hover:bg-[#1C2128] transition-colors"
              >
                Use Free
              </Link>
            </div>

            {/* Pro Tier ($15/yr, $1.25/mo) */}
            <div className="p-5 rounded-[4px] border border-[#D29922]/50 bg-[#161B22] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-[#D29922]">PRO (EARLY BIRD)</span>
                  <span className="text-lg font-bold text-[#E6EDF3] tnum">
                    $1.25<span className="text-xs font-normal text-[#8B949E]">/mo</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  $15/yr billed annually. Locked early bird rate.
                </p>
                <div className="flex flex-col gap-1 pt-2 text-[11px] text-[#E6EDF3]">
                  <div>✓ Full cross-device history</div>
                  <div>✓ Compare / ghost overlay mode</div>
                  <div>✓ Read-time insight engine</div>
                  <div>✓ Goals, sink allowance &amp; streaks</div>
                  <div>✓ Weekly graded report cards (A–F)</div>
                  <div>✓ Creature companion live block</div>
                  <div>✓ Unlimited shareable image exports</div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full py-2 text-center rounded-[2px] bg-[#E6EDF3] text-xs font-medium text-[#0D1117] hover:bg-white transition-colors"
              >
                Get Pro ($15/yr)
              </Link>
            </div>
          </div>
        </div>

        {/* Verbatim Permission Disclosure (QA.md P9) */}
        <div className="w-full p-4 rounded-[4px] bg-[#161B22] border border-[#21262D] text-[11px] text-[#8B949E] text-left leading-relaxed">
          <span className="text-[#E6EDF3] font-medium">Privacy disclosure: </span>
          Timeframe measures which app is on the screen and for how long. It never sees screen content, keystrokes, or anything you type.
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 w-full max-w-4xl mx-auto px-4 flex items-center justify-between border-t border-[#21262D] text-[11px] text-[#6E7681]">
        <span>Timeframe — Screen time, honestly instrumented</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-[#E6EDF3]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#E6EDF3]">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
