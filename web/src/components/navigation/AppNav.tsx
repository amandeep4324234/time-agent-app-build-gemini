"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Play,
  TrendingUp,
  FileText,
  Settings,
  HardDrive,
  Sparkles,
} from "lucide-react";
import { DevAccessControl } from "@/components/dev/DevAccessControl";
import { useAppStore } from "@/lib/store";
import { isPaid } from "@/lib/entitlement";

export function AppNav() {
  const pathname = usePathname();
  const { entitlement } = useAppStore();
  const isPro = isPaid(entitlement);

  // 4 Primary Destinations (§3)
  const primaryDestinations = [
    { label: "Overview", href: "/app", icon: LayoutDashboard },
    { label: "Focus blocks", href: "/focus", icon: Play },
    { label: "Insights", href: "/patterns", icon: TrendingUp },
    { label: "Logs", href: "/logs", icon: FileText },
  ];

  return (
    <>
      {/* 1. Primary Navigation Rail (192px desktop, 72px tablet, hidden on mobile per START-HERE.md §3) */}
      <aside
        className="tf-sidebar select-none"
        aria-label="Desktop primary rail"
      >
        {/* Top: Wordmark + Primary Destinations */}
        <div className="flex flex-col gap-6">
          <div className="tf-brand">
            <Link
              href="/app"
              className="flex items-center gap-2.5 text-[#ECECE7] hover:text-white transition-colors"
            >
              <svg width="18" height="20" viewBox="0 0 18 20" fill="none" className="shrink-0">
                <rect x="1" y="6" width="3" height="9" rx="1.5" fill="#DDB66D"/>
                <rect x="7" y="1" width="3" height="18" rx="1.5" fill="#DDB66D"/>
                <rect x="13" y="9" width="3" height="6" rx="1.5" fill="#DDB66D"/>
              </svg>
              <span className="tf-brand-text font-medium text-[19px] tracking-tight">timeframe</span>
            </Link>
            {isPro && (
              <span className="tf-nav-text text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-[4px] bg-[#DDB66D]/20 text-[#DDB66D] border border-[#DDB66D]/30 ml-auto">
                Pro
              </span>
            )}
          </div>

          <nav className="tf-nav" aria-label="Primary navigation">
            {primaryDestinations.map((dest) => {
              const isActive =
                pathname === dest.href ||
                (dest.href === "/patterns" && pathname === "/compare");
              const Icon = dest.icon;
              return (
                <Link
                  key={dest.href}
                  href={dest.href}
                  aria-current={isActive ? "page" : undefined}
                  className="tf-nav-link"
                >
                  <Icon />
                  <span className="tf-nav-text">{dest.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Settings & Illustrative Data */}
        <div className="tf-nav-bottom flex flex-col gap-2 pt-4 border-t border-[#3A3D3E]">
          <nav className="tf-nav" aria-label="Secondary navigation">
            <Link
              href="/settings"
              aria-current={pathname.startsWith("/settings") ? "page" : undefined}
              className="tf-nav-link"
            >
              <Settings />
              <span className="tf-nav-text">Settings</span>
            </Link>
          </nav>

          <div className="tf-nav-text flex items-center justify-between px-3 pt-1 text-[13px] text-[#A1A9A5]">
            <span className="text-[12px] text-[#737978]">Illustrative data</span>
            {process.env.NODE_ENV !== "production" && <DevAccessControl />}
          </div>
        </div>
      </aside>

      {/* 2. Mobile Top Header (< 768px, §3) */}
      <header className="flex md:hidden sticky top-0 z-40 h-12 w-full border-b border-[#3A3D3E] bg-[#141516] px-4 items-center justify-between">
        <Link href="/app" className="text-[17px] font-medium lowercase tracking-tight text-[#ECECE7] flex items-center gap-2">
          <svg width="15" height="17" viewBox="0 0 18 20" fill="none" className="shrink-0">
            <rect x="1" y="6" width="3" height="9" rx="1.5" fill="#DDB66D"/>
            <rect x="7" y="1" width="3" height="18" rx="1.5" fill="#DDB66D"/>
            <rect x="13" y="9" width="3" height="6" rx="1.5" fill="#DDB66D"/>
          </svg>
          <span>timeframe</span>
        </Link>
        <div className="flex items-center gap-3">
          {process.env.NODE_ENV !== "production" && <DevAccessControl />}
          <Link
            href="/settings"
            aria-label="Settings"
            className="p-1.5 text-[#A1A9A5] hover:text-[#ECECE7] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* 3. Mobile Bottom Navigation (4 items, < 768px, START-HERE.md §2.2, §3) */}
      <nav
        className="tf-bottom-nav"
        aria-label="Mobile bottom navigation"
      >
        {primaryDestinations.map((dest) => {
          const isActive =
            pathname === dest.href ||
            (dest.href === "/patterns" && pathname === "/compare");
          const Icon = dest.icon;
          return (
            <Link
              key={dest.href}
              href={dest.href}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{dest.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
