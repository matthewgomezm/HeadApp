import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { dusk, shadcnTokens } from "./theme";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

test("dusk palette matches approved values", () => {
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

test("globals.css defines every dusk token", () => {
  for (const [k, v] of Object.entries(dusk)) {
    expect(css).toContain(`--color-dusk-${k}: ${v}`);
  }
});

test("no pure white/black or generic shadcn colors anywhere", () => {
  expect(css).not.toMatch(/#fff\b|#ffffff|\bwhite\b|#000\b|#000000|\bblack\b/i);
  // shadcn's defaults are oklch greys/whites/blue — every color must be a Dusk hex
  expect(css).not.toMatch(/oklch\(/i);
});

test("shadcn / Kokonut color variables are mapped to Dusk", () => {
  for (const [name, value] of Object.entries(shadcnTokens)) {
    expect(css).toContain(`--${name}: ${value};`);
  }
  // shadcn's primary is used for solid buttons: keep it the calm fill, not bright amber
  expect(shadcnTokens.primary).toBe(dusk.fill);
  expect(shadcnTokens.background).toBe(dusk.bg);
  expect(shadcnTokens.foreground).toBe(dusk.text);
});

test("system font, not a downloaded webfont", () => {
  const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
  expect(layout).not.toMatch(/next\/font/);
});

test("<html> carries the dark class so Kokonut/shadcn `dark:` styles apply (never their white versions)", () => {
  const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
  expect(layout).toMatch(/<html[^>]*className="[^"]*\bdark\b/);
});
