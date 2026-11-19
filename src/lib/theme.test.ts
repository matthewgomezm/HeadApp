import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { dusk } from "./theme";

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

test("globals.css defines every dusk token and no pure white/black", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  for (const [k, v] of Object.entries(dusk)) {
    expect(css).toContain(`--color-dusk-${k}: ${v}`);
  }
  expect(css).not.toMatch(/#fff\b|#ffffff|\bwhite\b|#000\b|#000000|\bblack\b/i);
});
