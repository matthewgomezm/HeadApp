import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("hold button is recolored to Dusk with 48px height (no red/blue/white leftovers)", () => {
  const src = readFileSync(join(process.cwd(), "src/components/kokonutui/hold-button.tsx"), "utf8");
  expect(src).not.toMatch(/(red|emerald|blue|orange|zinc)-\d|text-white|offset-white|bg-white/);
  expect(src).toMatch(/\bh-12\b/);
  expect(src).toMatch(/destructive/);
});
