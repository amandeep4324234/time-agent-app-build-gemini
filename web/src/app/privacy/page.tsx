import React from "react";
import Link from "next/link";
import legalData from "../../../data/legal.json";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F8FAFC] p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[#222735] pb-4">
        <Link href="/" className="text-sm font-mono text-[#94A3B8] hover:text-[#F8FAFC]">
          ← Back to Timeframe
        </Link>
        <span className="text-xs font-mono text-[#64748B]">Privacy Policy</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>

      <div className="text-xs font-mono text-[#94A3B8] flex flex-col gap-4 leading-relaxed">
        <p>
          Timeframe is developed by {legalData.legal_name}, {legalData.city}. We respect your data and privacy by design.
        </p>

        <h2 className="text-sm font-semibold text-[#F8FAFC] mt-4">1. Zero Cloud Tracking of Attention Data</h2>
        <p>
          Timeframe runs client-side. Your usage sessions and ledger entries stay on your device in local storage and Room databases. We do not store, analyze, or monetize your activity logs.
        </p>

        <h2 className="text-sm font-semibold text-[#F8FAFC] mt-4">2. Private Apps and Domains</h2>
        <p>
          Sensitive domains (such as health screening resources) and user-marked private apps are structurally quarantined. They never appear on public share cards or exported previews.
        </p>

        <h2 className="text-sm font-semibold text-[#F8FAFC] mt-4">3. Inquiries</h2>
        <p>
          Reach our privacy team at {legalData.support_email}.
        </p>
      </div>
    </div>
  );
}
