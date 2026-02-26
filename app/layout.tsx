import type { Metadata } from "next";
import { ToastProvider, TooltipProvider } from "@cloudflare/kumo";
import "./globals.css";

export const metadata: Metadata = {
  title: "Value Tracker",
  description: "Track the daily cost of items you own",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-kumo-base text-kumo-default min-h-screen">
        <TooltipProvider>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
