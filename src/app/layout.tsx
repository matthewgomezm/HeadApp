import type { Metadata, Viewport } from "next";
import { dusk } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Migraine Tracker",
  description: "Log migraines and find what triggers them.",
  appleWebApp: {
    capable: true,
    title: "Migraines",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: dusk.bg,
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-dusk-bg font-sans text-dusk-text antialiased">
        {children}
      </body>
    </html>
  );
}
