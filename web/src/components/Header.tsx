"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: "Today", href: "/app" },
    { label: "Week", href: "/week" },
    { label: "Block", href: "/block" },
    { label: "Debrief", href: "/debrief" },
    { label: "Pro", href: "/checkout" },
  ];

  return (
    <header className="sticky top-0 z-40 h-12 w-full border-b border-[#21262D] bg-[#0D1117] px-4 md:px-6 flex items-center justify-between font-mono">
      <div className="flex items-center gap-6 md:gap-8">
        <Link href="/app" className="text-sm font-semibold tracking-tight text-[#E6EDF3] hover:text-white transition-colors">
          TIMEFRAME
        </Link>
        <nav className="flex items-center gap-4 md:gap-6" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs uppercase tracking-wider transition-colors py-3.5 border-b-2 -mb-px ${
                  isActive
                    ? "text-[#E6EDF3] font-medium border-[#D29922]"
                    : "text-[#8B949E] border-transparent hover:text-[#E6EDF3]"
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
          className="text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
        >
          site
        </Link>
      </div>
    </header>
  );
}
