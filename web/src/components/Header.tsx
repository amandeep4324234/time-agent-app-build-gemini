"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/app" },
    { label: "Week", href: "/week" },
    { label: "Block", href: "/block" },
    { label: "Debrief", href: "/debrief" },
  ];

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-[#222735] bg-[#12151D]/90 backdrop-blur px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/app" className="text-lg font-semibold tracking-tight text-[#F8FAFC]">
          Timeframe
        </Link>
        <nav className="flex items-center gap-6" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors py-5 border-b-2 -mb-px ${
                  isActive
                    ? "text-[#F8FAFC] font-medium border-[#22D3EE]"
                    : "text-[#94A3B8] border-transparent hover:text-[#F8FAFC]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          Back to site
        </Link>
      </div>
    </header>
  );
}
