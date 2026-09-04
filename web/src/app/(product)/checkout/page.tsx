"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  createDevProEntitlement,
  createFreeEntitlement,
  isPaid,
} from "@/lib/entitlement";

export default function CheckoutPage() {
  const router = useRouter();
  const { entitlement, setEntitlement } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isAlreadyPaid = isPaid(entitlement);

  const handleActivatePro = async () => {
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "annual" }),
      });

      if (res.ok) {
        setEntitlement({
          aid: "web-user-demo",
          tier: "pro",
          plan: "annual",
          src: "web",
          ref: "pay_early_bird",
          skin: null,
          valid_until: new Date(Date.now() + 365 * 86400000).toISOString(),
          jti: "jwt_token_early_bird",
        });
        setStatusMessage("Pro active. Early-bird tier unlocked.");
        setTimeout(() => {
          router.push("/app");
        }, 1200);
      } else {
        setStatusMessage("Simulation error. Try again.");
      }
    } catch {
      setStatusMessage("Payment needs a connection");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivate = () => {
    setEntitlement(createFreeEntitlement());
    if (process.env.NODE_ENV !== "production") {
      fetch("/api/dev/entitlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      }).catch(() => {});
    }
    setStatusMessage("Reverted to free tier.");
  };

  const handleDevGrant = () => {
    if (process.env.NODE_ENV !== "production") {
      setEntitlement(createDevProEntitlement());
      fetch("/api/dev/entitlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant" }),
      }).catch(() => {});
      setStatusMessage("Dev Pro activated. Paid features ready for local testing.");
    }
  };

  return (
    <div className="max-w-[560px] w-full mx-auto p-4 flex flex-col gap-6 font-mono text-xs pb-16">
      {/* Header */}
      <div className="flex flex-col gap-1 pb-3 border-b border-[#21262D]">
        <h1 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#E6EDF3]">
          TIMEFRAME PRO
        </h1>
        <p className="text-[11px] text-[#6E7681]">
          The instrument panel is free forever. Pro unlocks full history, compare, and insights.
        </p>
      </div>

      {/* Developer Pro Access Panel (Strictly deprecated and hidden in production) */}
      {process.env.NODE_ENV !== "production" && (
        <div className="p-4 rounded-[4px] border border-[#D29922]/40 bg-[#161B22] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D29922]">
              🛠️ Developer Pro Access (Dev Only)
            </span>
            <span className="text-[10px] text-[#8B949E]">
              {isAlreadyPaid ? "Pro active" : "Free tier"}
            </span>
          </div>
          <p className="text-[11px] text-[#8B949E] leading-relaxed">
            Toggle Pro features instantly to test locked vs unlocked UI states without payment.
            This logic is deprecated and strictly deactivated when built for production.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant={isAlreadyPaid ? "secondary" : "primary"}
              onClick={handleDevGrant}
            >
              {isAlreadyPaid ? "Re-grant Dev Pro" : "Unlock Paid Features (Dev)"}
            </Button>
            {isAlreadyPaid && (
              <Button variant="secondary" onClick={handleDeactivate}>
                Switch to Free
              </Button>
            )}
          </div>
        </div>
      )}

      {isAlreadyPaid ? (
        <div className="p-6 rounded-[4px] border border-[#D29922]/40 bg-[#161B22] flex flex-col items-center gap-4 text-center">
          <span className="text-sm font-semibold text-[#D29922]">
            Pro Membership Active
          </span>
          <p className="text-[11px] text-[#8B949E] max-w-sm">
            You have full history, compare/ghost mode, the creature companion, and weekly report cards.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={() => router.push("/app")}>
              Open Instrument Panel
            </Button>
            <Button variant="secondary" onClick={handleDeactivate}>
              Switch to Free
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-6 rounded-[4px] border border-[#21262D] bg-[#161B22]">
          {/* Price Frame: Locked BUSINESS.md §1 & QA.md B8 */}
          <div className="flex flex-col gap-1 border-b border-[#21262D] pb-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-[#8B949E]">
                Early Bird License
              </span>
              <span className="text-2xl font-bold text-[#E6EDF3] tnum">
                $1.25<span className="text-xs text-[#8B949E] font-normal">/mo</span>
              </span>
            </div>
            <div className="text-[11px] text-[#8B949E]">
              $15/yr billed yearly. Permanent early bird price. One SKU, one decision.
            </div>
          </div>

          {/* Feature Matrix */}
          <div className="flex flex-col gap-2 text-[11px]">
            <div className="text-[10px] uppercase tracking-wider text-[#6E7681]">
              Included in Pro
            </div>
            <div className="flex items-center gap-2 text-[#E6EDF3]">
              <span className="text-[#D29922]">✓</span>
              <span>Full history across all devices (Free has 7 days)</span>
            </div>
            <div className="flex items-center gap-2 text-[#E6EDF3]">
              <span className="text-[#D29922]">✓</span>
              <span>Compare / ghost overlay (week-over-week timeline)</span>
            </div>
            <div className="flex items-center gap-2 text-[#E6EDF3]">
              <span className="text-[#D29922]">✓</span>
              <span>Read-time insight engine &amp; danger-zone detection</span>
            </div>
            <div className="flex items-center gap-2 text-[#E6EDF3]">
              <span className="text-[#D29922]">✓</span>
              <span>Goals layer, sink allowance, and run streaks</span>
            </div>
            <div className="flex items-center gap-2 text-[#E6EDF3]">
              <span className="text-[#D29922]">✓</span>
              <span>Weekly graded report card (A–F rubric)</span>
            </div>
            <div className="flex items-center gap-2 text-[#E6EDF3]">
              <span className="text-[#D29922]">✓</span>
              <span>Creature live block companion growth</span>
            </div>
            <div className="flex items-center gap-2 text-[#E6EDF3]">
              <span className="text-[#D29922]">✓</span>
              <span>Unlimited shareable image exports</span>
            </div>
          </div>

          {/* Privacy Guarantee */}
          <div className="p-3 rounded-[2px] bg-[#0D1117] border border-[#21262D] text-[10px] text-[#6E7681] leading-relaxed">
            Timeframe measures which app is on screen and for how long. It never sees screen content, keystrokes, or anything you type. Private apps (health/finance/dating) stay off all shared cards.
          </div>

          {statusMessage && (
            <div className="text-center text-[11px] text-[#D29922]">
              {statusMessage}
            </div>
          )}

          {/* Action Button */}
          <Button
            variant="primary"
            onClick={handleActivatePro}
            isLoading={isProcessing}
            loadingLabel="Activating…"
            className="w-full"
          >
            Activate Pro — $15/yr ($1.25/mo)
          </Button>
        </div>
      )}
    </div>
  );
}
