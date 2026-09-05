import React from "react";
import { AppNav } from "@/components/navigation/AppNav";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#171819] text-[#ECECE7]">
      <AppNav />
      <div className="flex-1 lg:pl-[192px] w-full min-h-screen">
        <main className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 xl:px-8 py-4 pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
