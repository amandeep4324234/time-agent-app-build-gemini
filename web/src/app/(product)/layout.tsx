import React from "react";
import { Header } from "@/components/Header";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0D1117] text-[#E6EDF3] font-mono">
      <Header />
      <main className="flex-1 w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
