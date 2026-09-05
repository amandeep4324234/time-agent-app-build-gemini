import React from "react";
import { AppNav } from "@/components/navigation/AppNav";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0D1117] text-[#EDF1F5]">
      <AppNav />
      <div className="flex-1 lg:pl-[184px] xl:pl-[208px] w-full min-h-screen">
        <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
