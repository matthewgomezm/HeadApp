import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { TabBar, TabBarPlaceholder } from "@/components/TabBar";
import { dusk } from "@/lib/theme";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-pref";
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
    // Night (dark) by default; the boot script switches to day before paint if
    // she chose it, so the class can differ from the server render.
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-dusk-bg font-sans text-dusk-text antialiased">
        {/* Behind the iOS status bar, whose text stays white in a home-screen app. */}
        <div
          aria-hidden="true"
          data-print="hide"
          className="fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] bg-[#191714]"
        />
        {children}
        <Suspense fallback={<TabBarPlaceholder />}>
          <TabBar />
        </Suspense>
      </body>
    </html>
  );
}
