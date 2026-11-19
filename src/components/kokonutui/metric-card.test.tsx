import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import MetricCard from "./metric-card";

const src = readFileSync(join(process.cwd(), "src/components/kokonutui/metric-card.tsx"), "utf8");

test("metric card is recolored to Dusk (no zinc/emerald/rose/orange/white leftovers)", () => {
  expect(src).not.toMatch(/(zinc|emerald|rose|orange|red)-\d|bg-white|ring-white|text-white/);
  expect(src).toMatch(/dusk-surface/);
});

function data(prev: number, curr: number) {
  // 14 days: 7 previous, 7 current; one migraine per day for the first N of each
  return Array.from({ length: 14 }, (_, i) => ({
    date: `2026-11-${String(i + 5).padStart(2, "0")}`,
    parts: [i < 7 ? (i < prev ? 1 : 0) : i - 7 < curr ? 1 : 0],
  }));
}

test("with upIsGood=false, an increase is shown in the warning color", () => {
  render(
    <MetricCard
      label="Migraines"
      segments={["All"]}
      data={data(1, 3)}
      events={[]}
      periods={[7]}
      defaultPeriod={7}
      format="number"
      upIsGood={false}
    />,
  );
  expect(screen.getByText(/▲/)).toHaveClass("text-destructive");
});

test("with upIsGood=false, a decrease is shown in the calm accent", () => {
  render(
    <MetricCard
      label="Migraines"
      segments={["All"]}
      data={data(3, 1)}
      events={[]}
      periods={[7]}
      defaultPeriod={7}
      format="number"
      upIsGood={false}
    />,
  );
  expect(screen.getByText(/▼/)).toHaveClass("text-dusk-accent");
});

test("no change is neutral, not a warning", () => {
  render(
    <MetricCard
      label="Migraines"
      segments={["All"]}
      data={data(2, 2)}
      events={[]}
      periods={[7]}
      defaultPeriod={7}
      format="number"
      upIsGood={false}
    />,
  );
  const change = screen.getByText("– 0%");
  expect(change).toHaveClass("text-dusk-muted");
});

test("period buttons are ≥48px tap targets", () => {
  render(<MetricCard periods={[7, 30]} defaultPeriod={7} events={[]} />);
  expect(screen.getByRole("button", { name: "7D" })).toHaveClass("h-12");
});
