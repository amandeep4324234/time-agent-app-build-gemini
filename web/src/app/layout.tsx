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
      <body className="min-h-screen bg-[#0A0C10] text-[#F8FAFC] antialiased selection:bg-[#22D3EE]/20 selection:text-[#22D3EE]">
        {children}
      </body>
    </html>
  );
}
