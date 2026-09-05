"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy block route guarded per TIMEFRAME-UI-REDESIGN.md §2.1:
 * "Guard legacy direct routes and deep links: return to Today with no creature rendering."
 */
export default function LegacyBlockPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app");
  }, [router]);

  return (
    <div className="max-w-[720px] mx-auto p-8 text-center text-sm text-[#94A1B2]">
      Redirecting to Today…
    </div>
  );
}
