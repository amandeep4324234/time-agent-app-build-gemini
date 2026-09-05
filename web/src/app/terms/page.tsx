import React from "react";
import Link from "next/link";
import legalData from "../../../data/legal.json";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F8FAFC] p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[#222735] pb-4">
        <Link href="/" className="text-sm font-mono text-[#94A3B8] hover:text-[#F8FAFC]">
          ← Back to Timeframe
        </Link>
        <span className="text-xs font-mono text-[#64748B]">Legal Terms</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>

      <div className="text-xs font-mono text-[#94A3B8] flex flex-col gap-4 leading-relaxed">
        <p>
          These Terms of Service apply to Timeframe, operated by {legalData.legal_name}, located in {legalData.city} (GSTIN: {legalData.gstin}).
        </p>

        <h2 className="text-sm font-semibold text-[#F8FAFC] mt-4">1. Local-First Ledger</h2>
        <p>
          Timeframe is a local-first attention ledger. All core computations, metrics, and exports happen locally on your devices. We do not transmit your raw usage logs to any remote server without explicit export actions.
        </p>

        <h2 className="text-sm font-semibold text-[#F8FAFC] mt-4">2. Paid Subscriptions</h2>
        <p>
          Purchases of Timeframe Pro grant access to historical pattern analysis, period compare, and clean export cards. Core ledger features are free forever. Subscriptions may be canceled at any time.
        </p>

        <h2 className="text-sm font-semibold text-[#F8FAFC] mt-4">3. Contact</h2>
        <p>
          For billing support or queries, contact us at {legalData.support_email}.
        </p>
      </div>
    </div>
  );
}
