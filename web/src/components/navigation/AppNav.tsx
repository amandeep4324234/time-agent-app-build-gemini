"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, GitCompare, Settings, HardDrive, Sparkles } from "lucide-react";
import { DevAccessControl } from "@/components/dev/DevAccessControl";
import { useAppStore } from "@/lib/store";
import { isPaid } from "@/lib/entitlement";

export function AppNav() {
  const pathname = usePathname();
  const { entitlement } = useAppStore();
  const isPro = isPaid(entitlement);

  const primaryDestinations = [
    { label: "Today", href: "/app", icon: LayoutDashboard },
    { label: "Patterns", href: "/patterns", icon: TrendingUp },
    { label: "Compare", href: "/compare", icon: GitCompare },
  ];

  const secondaryDestinations = [
    { label: "Devices & data", href: "/settings?tab=devices", icon: HardDrive },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* 1. Desktop & Tablet Navigation Rail (>= 1024px, §5.1) */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[184px] xl:w-[208px] bg-[#141A22] border-r border-[#303B49] flex-col justify-between p-4 z-30 select-none"
        aria-label="Desktop primary rail"
      >
        {/* Top: Wordmark + Primary Destinations */}
        <div className="flex flex-col gap-6">
          <div className="px-2 pt-1 flex items-center justify-between">
            <Link
              href="/app"
              className="text-sm font-semibold tracking-wider text-[#EDF1F5] hover:text-white transition-colors"
            >
              TIMEFRAME
            </Link>
            {isPro && (
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-[3px] bg-[#E4B45F]/20 text-[#E4B45F]">
                Pro
              </span>
            )}
          </div>

          <nav className="flex flex-col gap-1" aria-label="Primary navigation">
            {primaryDestinations.map((dest) => {
              const isActive = pathname === dest.href;
              const Icon = dest.icon;
              return (
                <Link
                  key={dest.href}
                  href={dest.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm transition-colors duration-fast ${
                    isActive
                      ? "bg-[#1D2530] text-[#EDF1F5] font-semibold border-l-2 border-[#EDF1F5] pl-2.5"
                      : "text-[#B0BBC9] hover:bg-[#1D2530]/50 hover:text-[#EDF1F5] font-medium"
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#94A1B2]" />
                  <span>{dest.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Secondary Settings + Pro Details */}
        <div className="flex flex-col gap-2 pt-4 border-t border-[#303B49]">
          <nav className="flex flex-col gap-0.5" aria-label="Secondary settings navigation">
            {secondaryDestinations.map((dest) => {
              const isActive = pathname.startsWith(dest.href.split("?")[0]);
              const Icon = dest.icon;
              return (
                <Link
                  key={dest.href}
                  href={dest.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-xs transition-colors duration-fast ${
                    isActive
                      ? "bg-[#1D2530] text-[#EDF1F5] font-medium"
                      : "text-[#94A1B2] hover:text-[#EDF1F5] hover:bg-[#1D2530]/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{dest.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-between px-3 pt-2 text-[11px] text-[#94A1B2]">
            <Link
              href="/checkout"
              className="hover:text-[#EDF1F5] transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-[#E4B45F]" />
              <span>{isPro ? "Entitlement" : "Pro Details"}</span>
            </Link>
            {process.env.NODE_ENV !== "production" && <DevAccessControl />}
          </div>
        </div>
      </aside>

      {/* 2. Tablet Top Bar (768px - 1023px, §5.2) */}
      <header className="hidden md:flex lg:hidden sticky top-0 z-40 h-14 w-full border-b border-[#303B49] bg-[#141A22] px-6 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/app" className="text-sm font-semibold tracking-wider text-[#EDF1F5]">
            TIMEFRAME
          </Link>
          <nav className="flex items-center gap-2" aria-label="Tablet primary navigation">
            {primaryDestinations.map((dest) => {
              const isActive = pathname === dest.href;
              return (
                <Link
                  key={dest.href}
                  href={dest.href}
                  className={`px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#1D2530] text-[#EDF1F5]"
                      : "text-[#B0BBC9] hover:text-[#EDF1F5]"
                  }`}
                >
                  {dest.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="text-xs text-[#B0BBC9] hover:text-[#EDF1F5] transition-colors"
          >
            Settings
          </Link>
          <Link
            href="/checkout"
            className="text-xs text-[#E4B45F] hover:underline"
          >
            Pro
          </Link>
          {process.env.NODE_ENV !== "production" && <DevAccessControl />}
        </div>
      </header>

      {/* 3. Mobile Header (< 768px, §5.1) */}
      <header className="flex md:hidden sticky top-0 z-40 h-12 w-full border-b border-[#303B49] bg-[#141A22] px-4 items-center justify-between">
        <Link href="/app" className="text-sm font-semibold tracking-wider text-[#EDF1F5]">
          TIMEFRAME
        </Link>
        <div className="flex items-center gap-3">
          {process.env.NODE_ENV !== "production" && <DevAccessControl />}
          <Link
            href="/settings"
            aria-label="Settings"
            className="p-2 text-[#B0BBC9] hover:text-[#EDF1F5] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* 4. Mobile Bottom Navigation (< 768px, §5.1) */}
      <nav
        className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#141A22] border-t border-[#303B49] items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),4px)]"
        aria-label="Mobile bottom navigation"
      >
        {primaryDestinations.map((dest) => {
          const isActive = pathname === dest.href;
          const Icon = dest.icon;
          return (
            <Link
              key={dest.href}
              href={dest.href}
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-colors ${
                isActive ? "text-[#EDF1F5]" : "text-[#94A1B2] hover:text-[#EDF1F5]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#E4B45F]" : "text-[#94A1B2]"}`} />
              <span className={`text-[11px] mt-1 ${isActive ? "font-semibold" : "font-normal"}`}>
                {dest.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
