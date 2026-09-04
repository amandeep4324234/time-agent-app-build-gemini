import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Timeframe — Cross-Device Attention Ledger",
  description: "A cross-device attention ledger that states the number and names its own blind spots.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0D1117] text-[#E6EDF3] font-mono antialiased selection:bg-[#D29922]/20 selection:text-[#D29922]">
        {children}
      </body>
    </html>
  );
}
