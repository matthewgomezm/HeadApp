"use client";

import { usePathname } from "next/navigation";
import { MorphicNavbar } from "@/components/kokonutui/morphic-navbar";
import { ThemeSwitch } from "@/components/ThemeSwitch";

const TABS = {
  "/": { name: "Home" },
  "/history": { name: "History" },
  "/insights": { name: "Insights" },
};

/** Bottom bar: Kokonut's split nav, recolored to Dusk, above the iPhone home indicator. */
export function TabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;
  return (
    <div data-print="hide" className="fixed inset-x-0 bottom-0 bg-dusk-tabbar pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      {/* Right padding reserves the switch's spot, so the tabs never run under it. */}
      <div data-slot="tabbar-row" className="relative pr-16">
        <MorphicNavbar
          items={TABS}
          // Episode detail/new pages belong to History.
          defaultPath={pathname.startsWith("/episodes") ? "/history" : undefined}
        />
        {/* Day / night, at the right end of the bar so it's on every screen. */}
        <ThemeSwitch className="absolute top-1/2 right-3 -translate-y-1/2" />
      </div>
    </div>
  );
}

/** Same-size empty bar shown while the real one loads (keeps the layout from jumping). */
export function TabBarPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 bottom-0 h-16 bg-dusk-tabbar pb-[env(safe-area-inset-bottom)] box-content"
    />
  );
}
