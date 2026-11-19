"use client";

import { usePathname } from "next/navigation";
import { MorphicNavbar } from "@/components/kokonutui/morphic-navbar";

const TABS = {
  "/": { name: "Home" },
  "/history": { name: "History" },
  "/insights": { name: "Insights" },
  "/doctor": { name: "Doctor" },
};

/** Bottom bar: Kokonut's split nav, recolored to Dusk, above the iPhone home indicator. */
export function TabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 bg-dusk-tabbar pb-[env(safe-area-inset-bottom)]">
      <MorphicNavbar
        items={TABS}
        // Episode detail/new pages belong to History.
        defaultPath={pathname.startsWith("/episodes") ? "/history" : undefined}
      />
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
