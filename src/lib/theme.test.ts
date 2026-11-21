import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { dayPalette, dusk, shadcnTokens } from "./theme";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const block = (selector: string) => {
  const i = css.indexOf(`${selector} {`);
  expect(i, selector).toBeGreaterThanOrEqual(0);
  return css.slice(i, css.indexOf("}", i));
};

test("night (Dusk) palette matches approved values", () => {
  expect(dusk).toEqual({
    bg: "#1d1a17",
    surface: "#26221e",
    fill: "#3a2f25",
    accent: "#e3c49f",
    text: "#d9d0c3",
    muted: "#8f857a",
    tabbar: "#191714",
  });
});

test("day palette is the warm light one Matthew picked", () => {
  expect(dayPalette).toEqual({
    bg: "#f4ede3",
    surface: "#fbf6ef",
    fill: "#e9dccb",
    accent: "#7c4f24",
    text: "#3b322a",
    muted: "#6c6054",
    tabbar: "#ece2d4",
  });
});

test("Tailwind dusk colours follow the theme variables", () => {
  for (const k of Object.keys(dusk)) {
    expect(css).toContain(`--color-dusk-${k}: var(--dusk-${k})`);
  }
});

test(":root is day, .dark is night", () => {
  const day = block(":root");
  const night = block(".dark");
  for (const [k, v] of Object.entries(dayPalette)) expect(day).toContain(`--dusk-${k}: ${v};`);
  for (const [k, v] of Object.entries(dusk)) expect(night).toContain(`--dusk-${k}: ${v};`);
  expect(day).toContain("--dusk-destructive: #a4553a;");
  expect(night).toContain("--dusk-destructive: #c98a6b;");
});

test("no pure white/black or generic shadcn colors anywhere", () => {
  expect(css).not.toMatch(/#fff\b|#ffffff|\bwhite\b|#000\b|#000000|\bblack\b/i);
  expect(css).not.toMatch(/oklch\(/i);
});

test("shadcn / Kokonut color variables follow the theme", () => {
  for (const [name, value] of Object.entries(shadcnTokens)) {
    expect(css).toContain(`--${name}: ${value};`);
  }
  expect(shadcnTokens.primary).toBe("var(--dusk-fill)");
  expect(shadcnTokens.background).toBe("var(--dusk-bg)");
  expect(shadcnTokens.foreground).toBe("var(--dusk-text)");
  expect(shadcnTokens.destructive).toBe("var(--dusk-destructive)");
});

test("system font, not a downloaded webfont", () => {
  const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
  expect(layout).not.toMatch(/next\/font/);
});

test("<html> starts dark (night) and the boot script can switch it before paint", () => {
  const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
  expect(layout).toMatch(/<html[^>]*className="[^"]*\bdark\b/);
  expect(layout).toMatch(/<html[^>]*suppressHydrationWarning/);
  expect(layout).toContain("THEME_BOOT_SCRIPT");
});

test("colours change gradually, except with Reduce Motion", () => {
  const body = css.slice(css.indexOf("html,\nbody {"), css.indexOf("}", css.indexOf("html,\nbody {")));
  expect(body).toMatch(/transition:[^;]*background-color/);
});
