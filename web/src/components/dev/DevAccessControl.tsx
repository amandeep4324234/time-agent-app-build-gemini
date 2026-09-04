"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  createDevProEntitlement,
  createFreeEntitlement,
  isPaid,
} from "@/lib/entitlement";

function DevAccessControlInner() {
  const { entitlement, setEntitlement } = useAppStore();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [justToggled, setJustToggled] = useState(false);

  const isPro = isPaid(entitlement);

  // Support ?dev_pro=1 or ?pro=dev or ?dev=pro query params to auto-grant dev access,
  // and ?dev_pro=0 or ?dev=free or ?pro=free to revert to free tier.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const devProParam = searchParams.get("dev_pro");
    const devParam = searchParams.get("dev");
    const proParam = searchParams.get("pro");

    const wantsPro =
      devProParam === "1" ||
      devProParam === "true" ||
      devParam === "pro" ||
      proParam === "dev";

    const wantsFree =
      devProParam === "0" ||
      devProParam === "false" ||
      devParam === "free" ||
      proParam === "free";

    if (wantsPro && !isPro) {
      startTransition(() => {
        setEntitlement(createDevProEntitlement());
        fetch("/api/dev/entitlement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "grant" }),
        }).catch(() => {});
        setJustToggled(true);
        setTimeout(() => setJustToggled(false), 2000);
      });
    } else if (wantsFree && isPro) {
      startTransition(() => {
        setEntitlement(createFreeEntitlement());
        fetch("/api/dev/entitlement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revoke" }),
        }).catch(() => {});
        setJustToggled(true);
        setTimeout(() => setJustToggled(false), 2000);
      });
    }
  }, [searchParams, isPro, setEntitlement]);

  const handleToggle = () => {
    if (process.env.NODE_ENV === "production") return;

    // Strip dev query parameters from URL if present so they don't fight the user's manual toggle
    const devProParam = searchParams.get("dev_pro");
    const devParam = searchParams.get("dev");
    const proParam = searchParams.get("pro");
    if (devProParam || devParam || proParam) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("dev_pro");
      nextParams.delete("dev");
      nextParams.delete("pro");
      const qs = nextParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }

    if (isPro) {
      setEntitlement(createFreeEntitlement());
      fetch("/api/dev/entitlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      }).catch(() => {});
    } else {
      setEntitlement(createDevProEntitlement());
      fetch("/api/dev/entitlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant" }),
      }).catch(() => {});
    }
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        title={
          isPro
            ? "Dev Pro is active. Click to switch to Free tier."
            : "Free tier is active. Click to grant Dev Pro access."
        }
        className={`px-2 py-1 text-[10px] tracking-wider uppercase font-semibold rounded-[3px] border transition-colors duration-150 flex items-center gap-1.5 ${
          isPro
            ? "border-[#D29922] bg-[#D29922]/15 text-[#D29922] hover:bg-[#D29922]/25"
            : "border-[#21262D] bg-[#161B22] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#8B949E]/40"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        <span>{isPro ? "DEV: PRO" : "DEV: FREE"}</span>
      </button>

      {justToggled && (
        <span className="text-[10px] text-[#D29922] animate-in fade-in duration-100 hidden sm:inline">
          {isPro ? "Dev Pro unlocked" : "Free tier active"}
        </span>
      )}
    </div>
  );
}

export function DevAccessControl() {
  // In production builds, this component is completely deactivated and deprecated.
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <DevAccessControlInner />
    </Suspense>
  );
}
