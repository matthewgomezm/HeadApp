import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import EpisodeLoading from "./episodes/[id]/loading";
import HistoryLoading from "./history/loading";
import HomeLoading from "./loading";

test.each([
  ["Home", HomeLoading],
  ["History", HistoryLoading],
  ["Episode details", EpisodeLoading],
])("%s loading screen shows skeleton placeholders and is marked busy", (_, Loading) => {
  const { container } = render(<Loading />);
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(2);
});

test("skeletons are still: no pulsing (nothing that moves on a migraine day)", () => {
  const src = readFileSync(join(process.cwd(), "src/components/ui/skeleton.tsx"), "utf8");
  expect(src).not.toMatch(/animate-/);
});
