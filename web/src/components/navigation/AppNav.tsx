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

  const secondaryDestinations = [
    { label: "Devices & data", href: "/settings?tab=devices", icon: HardDrive },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* 1. Desktop 192px Navigation Rail (>= 1024px, §3) */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[192px] bg-[#0E121B] border-r border-[#2B374B] flex-col justify-between p-4 z-30 select-none"
        aria-label="Desktop primary rail"
      >
        {/* Top: Wordmark + Primary Destinations */}
        <div className="flex flex-col gap-6">
          <div className="px-2 pt-1 flex items-center justify-between">
            <Link
              href="/app"
              className="text-sm font-semibold tracking-wider text-[#F2F5FB] hover:text-white transition-colors"
            >
              TIMEFRAME
            </Link>
            {isPro && (
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-[4px] bg-[#AAA9FF]/20 text-[#AAA9FF] border border-[#AAA9FF]/30">
                Pro
              </span>
            )}
          </div>

          <nav className="flex flex-col gap-1" aria-label="Primary navigation">
            {primaryDestinations.map((dest) => {
              const isActive =
                pathname === dest.href ||
                (dest.href === "/patterns" && pathname === "/compare");
              const Icon = dest.icon;
              return (
                <Link
                  key={dest.href}
                  href={dest.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-xs font-semibold transition-colors duration-fast ${
                    isActive
                      ? "bg-[#141A25] text-[#F2F5FB] border border-[#2B374B] shadow-sm text-[#AAA9FF]"
                      : "text-[#B8C4D8] hover:bg-[#141A25]/60 hover:text-[#F2F5FB]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#AAA9FF]" : "text-[#96A5BD]"}`} />
                  <span>{dest.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Secondary Settings & Pro Status */}
        <div className="flex flex-col gap-2 pt-4 border-t border-[#2B374B]">
          <nav className="flex flex-col gap-0.5" aria-label="Secondary navigation">
            {secondaryDestinations.map((dest) => {
              const isActive = pathname.startsWith(dest.href.split("?")[0]);
              const Icon = dest.icon;
              return (
                <Link
                  key={dest.href}
                  href={dest.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-xs transition-colors duration-fast ${
                    isActive
                      ? "bg-[#141A25] text-[#F2F5FB] font-medium"
                      : "text-[#96A5BD] hover:text-[#F2F5FB] hover:bg-[#141A25]/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{dest.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-between px-3 pt-2 text-[11px] text-[#96A5BD]">
            <Link
              href="/checkout"
              className="hover:text-[#F2F5FB] transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-[#AAA9FF]" />
              <span>{isPro ? "Entitlement" : "Pro Details"}</span>
            </Link>
            {process.env.NODE_ENV !== "production" && <DevAccessControl />}
          </div>
        </div>
      </aside>

      {/* 2. Tablet Top Bar (768px - 1023px, §3) */}
      <header className="hidden md:flex lg:hidden sticky top-0 z-40 h-14 w-full border-b border-[#2B374B] bg-[#0E121B] px-6 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/app" className="text-sm font-semibold tracking-wider text-[#F2F5FB]">
            TIMEFRAME
          </Link>
          <nav className="flex items-center gap-2" aria-label="Tablet primary navigation">
            {primaryDestinations.map((dest) => {
              const isActive = pathname === dest.href;
              return (
                <Link
                  key={dest.href}
                  href={dest.href}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-[#141A25] text-[#AAA9FF] border border-[#2B374B]"
                      : "text-[#B8C4D8] hover:text-[#F2F5FB]"
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
            className="text-xs text-[#B8C4D8] hover:text-[#F2F5FB] transition-colors"
          >
            Settings
          </Link>
          <Link
            href="/checkout"
            className="text-xs text-[#AAA9FF] hover:underline"
          >
            Pro
          </Link>
          {process.env.NODE_ENV !== "production" && <DevAccessControl />}
        </div>
      </header>

      {/* 3. Mobile Header (< 768px, §3) */}
      <header className="flex md:hidden sticky top-0 z-40 h-12 w-full border-b border-[#2B374B] bg-[#0E121B] px-4 items-center justify-between">
        <Link href="/app" className="text-sm font-semibold tracking-wider text-[#F2F5FB]">
          TIMEFRAME
        </Link>
        <div className="flex items-center gap-3">
          {process.env.NODE_ENV !== "production" && <DevAccessControl />}
          <Link
            href="/settings"
            aria-label="Settings"
            className="p-2 text-[#B8C4D8] hover:text-[#F2F5FB] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* 4. Mobile Bottom Navigation (4 items, < 768px, §3) */}
      <nav
        className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0E121B] border-t border-[#2B374B] items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),4px)]"
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
                isActive ? "text-[#AAA9FF]" : "text-[#96A5BD] hover:text-[#F2F5FB]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-[11px] mt-1 ${isActive ? "font-bold" : "font-normal"}`}>
                {dest.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
