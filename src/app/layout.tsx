import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CampusSphere | One Campus. Everything Connected.",
    template: "%s | CampusSphere",
  },
  description:
    "A unified campus platform for lost and found, academic resources, events, marketplace listings, and issue reporting.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-ink antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
