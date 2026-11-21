import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { dayPalette, dusk } from "./theme";

// WCAG relative-luminance contrast ratio.
function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

test.each([
  ["muted on tab bar (inactive tabs)", "muted", "tabbar"],
  ["muted on background (dates, labels)", "muted", "bg"],
  ["muted on cards", "muted", "surface"],
  ["accent on fill (badges, buttons)", "accent", "fill"],
  ["accent on cards", "accent", "surface"],
  ["text on background", "text", "bg"],
] as const)("day: %s meets WCAG AA for small text (4.5:1)", (_, fg, bg) => {
  expect(ratio(dayPalette[fg], dayPalette[bg])).toBeGreaterThanOrEqual(4.5);
});

test("day: severity swatches on the totals card are visible (3:1 for graphics)", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  const root = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
  for (const k of ["chart-2", "chart-3", "chart-5"]) {
    const hex = root.match(new RegExp(`--dusk-${k}: (#[0-9a-f]{6});`))![1];
    expect(ratio(hex, dayPalette.surface), k).toBeGreaterThanOrEqual(3);
  }
});

test("night text stays as approved (unchanged by this fix)", () => {
  expect(dusk.muted).toBe("#8f857a");
});
