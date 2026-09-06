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
      <body className="min-h-screen bg-[#171819] text-[#ECECE7] font-sans antialiased selection:bg-[#DDB66D]/20 selection:text-[#DDB66D] tf-app">
        {children}
      </body>
    </html>
  );
}
