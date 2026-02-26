import type { Metadata } from "next";
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
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
