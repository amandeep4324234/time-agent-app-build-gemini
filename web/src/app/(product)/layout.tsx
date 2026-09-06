import React from "react";
import { AppNav } from "@/components/navigation/AppNav";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tf-app">
      <AppNav />
      <main className="tf-main">
        {children}
      </main>
    </div>
  );
}
