import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

test("print: light paper, advice opened, navigation hidden", () => {
  const print = css.slice(css.indexOf("@media print"));
  expect(print).toContain("@media print");
  expect(print).toMatch(/\[data-print="only"\][^}]*display:\s*block/);
  expect(print).toMatch(/\[data-print="hide"\][^}]*display:\s*none/);
  expect(print).toMatch(/--dusk-bg:\s*#fbf6ef|background:\s*#fbf6ef/);
});
