"use client";

import SwitchButton from "@/components/kokonutui/switch-button";
import { writeThemePref } from "@/lib/theme-pref";

/** Day/night switch: Kokonut's sun ↔ moon; the new colours spread from it. */
export function ThemeSwitch({ className }: { className?: string }) {
  return (
    <SwitchButton
      size="xl"
      showLabel={false}
      aria-label="Day or night colours"
      className={className}
      onThemeChange={(t) => writeThemePref(t === "dark" ? "night" : "day")}
    />
  );
}
