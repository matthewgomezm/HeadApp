import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("switch button is recolored to Dusk (no zinc/white leftovers in its classes)", () => {
  const src = readFileSync(join(process.cwd(), "src/components/kokonutui/switch-button.tsx"), "utf8");
  expect(src).not.toMatch(/zinc-\d|bg-white|ring-offset-white/);
  expect(src).toMatch(/dusk-/);
});
