"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const router = useRouter();
  const { entitlement, setEntitlement } = useAppStore();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual" | "skin">("annual");
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const planOptions = [
    { label: "Annual", value: "annual" as const, subLabel: "₹2,999/year" },
    { label: "Monthly", value: "monthly" as const, subLabel: "₹499/month" },
    { label: "Skin", value: "skin" as const, subLabel: "₹599 once" },
  ];

  const handleStartPayment = async () => {
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      // Call checkout order / grant
      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (res.ok) {
        // Upgrade to Pro in store
        setEntitlement({
          aid: "web-user-demo",
          tier: "pro",
          plan: selectedPlan,
          src: "web",
          ref: "pay_test_order",
          skin: selectedPlan === "skin" ? "classic" : null,
          valid_until: new Date(Date.now() + 365 * 86400000).toISOString(),
          jti: "jwt_token_test",
        });
        setStatusMessage("Payment complete. Pro features active.");
        setTimeout(() => {
          router.push("/app");
        }, 1500);
      } else {
        setStatusMessage("Payment simulation failed. Please try again.");
      }
    } catch {
      setStatusMessage("Payment needs a connection");
    } finally {
      setIsProcessing(false);
    }
  };

  const isAlreadyPaid = entitlement.tier === "pro";

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-8 pb-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Timeframe Pro
        </h1>
        <p className="text-xs font-mono text-[#94A3B8]">
          The ledger is free forever. Paid gates only creature growth, streak, and the clean card.
        </p>
      </div>

      {isAlreadyPaid ? (
        <div className="p-8 rounded-xl border border-[#22D3EE]/30 bg-[#22D3EE]/5 flex flex-col items-center gap-4 text-center">
          <span className="text-sm font-bold text-[#22D3EE] font-mono">
            Pro Membership Active
          </span>
          <p className="text-xs text-[#94A3B8]">
            Your subscription ({entitlement.plan || "pro"}) is currently active.
          </p>
          <Button variant="secondary" onClick={() => router.push("/app")}>
            Back to the ledger
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 bg-[#12151D] p-8 rounded-xl border border-[#222735]">
          {/* Plan Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">
              Select Plan
            </span>
            <SegmentedControl
              options={planOptions}
              value={selectedPlan}
              onChange={setSelectedPlan}
            />
          </div>

          {/* Payment Method Selector (UPI-First) */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">
              Payment Method
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMethod("upi")}
                className={`p-3 rounded-lg border text-left text-xs font-mono transition-colors ${
                  selectedMethod === "upi"
                    ? "border-[#22D3EE] bg-[#22D3EE]/10 text-[#F8FAFC]"
                    : "border-[#222735] bg-[#0A0C10] text-[#94A3B8]"
                }`}
              >
                <div className="font-semibold text-sm mb-1">UPI</div>
                <div className="text-[10px] text-[#64748B]">Google Pay, PhonePe, Paytm, QR</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("card")}
                className={`p-3 rounded-lg border text-left text-xs font-mono transition-colors ${
                  selectedMethod === "card"
                    ? "border-[#22D3EE] bg-[#22D3EE]/10 text-[#F8FAFC]"
                    : "border-[#222735] bg-[#0A0C10] text-[#94A3B8]"
                }`}
              >
                <div className="font-semibold text-sm mb-1">Card / NetBanking</div>
                <div className="text-[10px] text-[#64748B]">Visa, Mastercard, RuPay</div>
              </button>
            </div>
          </div>

          {/* Action */}
          <Button
            variant="primary"
            onClick={handleStartPayment}
            isLoading={isProcessing}
            loadingLabel="Paying…"
            className="w-full mt-2"
          >
            {selectedMethod === "upi" ? "Pay with UPI" : "Start payment"}
          </Button>

          {statusMessage && (
            <div className="text-xs font-mono text-center text-[#22D3EE]">
              {statusMessage}
            </div>
          )}

          {/* Payment Page Footer with Legal links */}
          <div className="border-t border-[#222735] pt-4 mt-2 flex flex-col items-center gap-2 text-[11px] font-mono text-[#64748B]">
            <div>GST included where applicable</div>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-[#F8FAFC] underline">
                Terms
              </Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-[#F8FAFC] underline">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
