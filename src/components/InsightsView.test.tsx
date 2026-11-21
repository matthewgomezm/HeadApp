import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { serializeEpisode } from "@/lib/episode-rows";
import type { Episode, Helped } from "@/lib/episodes";
import { InsightsView } from "./InsightsView";

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 20, 12));
});
afterEach(() => vi.useRealTimers());

let n = 0;
function ep(day: number, o: Partial<Episode> = {}): Episode {
  const startedAt = new Date(2026, 10, day, 18);
  return {
    id: `6f1c1c1e-0000-4000-8000-${String(++n).padStart(12, "0")}`,
    startedAt,
    endedAt: new Date(startedAt.getTime() + 120 * 60_000),
    peakPain: 6,
    locations: [],
    symptoms: [],
    triggers: [],
    notes: "",
    medications: [],
    ...o,
  };
}
const med = (helped: Helped) => [{ name: "Sumatriptan", takenAt: null, helped }];
const view = (eps: Episode[]) => render(<InsightsView initial={eps.map(serializeEpisode)} />);

test("with fewer than 3 migraines, patterns say not enough data", () => {
  view([ep(2), ep(9)]);
  expect(screen.getByText("Not enough data yet")).toBeInTheDocument();
});

test("patterns: count, average length, pain, time and weekday", () => {
  view([ep(2), ep(9), ep(16)]); // Mondays, 6 pm, 2h each, pain 6
  const card = screen.getByRole("region", { name: "Your patterns" });
  expect(card).toHaveTextContent("3 migraines in the last 90 days");
  expect(card).toHaveTextContent("Average length 2h");
  expect(card).toHaveTextContent("Average pain 6/10");
  expect(card).toHaveTextContent("Most often in the evening");
  expect(card).toHaveTextContent("on Mondays");
});

test("what you've logged: triggers as frequency with a bar, medication results", () => {
  view([
    ep(2, { triggers: ["stress"], medications: med("yes") }),
    ep(9, { triggers: ["stress"], medications: med("yes") }),
    ep(12, { triggers: ["stress"], medications: med("somewhat") }),
    ep(16, { medications: med("no") }),
  ]);
  const logged = screen.getByRole("region", { name: "What you've logged" });
  const stress = within(logged).getByText("stress").closest("li")!;
  expect(stress).toHaveTextContent("in 3 of 4 migraines");
  expect(within(stress).getByRole("progressbar")).toBeInTheDocument();
  const suma = within(logged).getByText("Sumatriptan").closest("li")!;
  expect(suma).toHaveTextContent("helped 2 · a little 1 · didn't 1");
});

test("nothing logged yet → friendly empty lines", () => {
  view([]);
  const logged = screen.getByRole("region", { name: "What you've logged" });
  expect(logged).toHaveTextContent("No triggers logged yet");
  expect(logged).toHaveTextContent("No medications logged yet");
});

test("advice: her trigger first with a badge, opens to tips and a source link", async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  view([ep(2, { triggers: ["stress"] }), ep(9), ep(16)]);
  const advice = screen.getByRole("region", { name: "Ways to reduce migraines" });
  expect(advice).toHaveTextContent("General information, not medical advice.");
  const buttons = within(advice).getAllByRole("button");
  expect(buttons[0]).toHaveTextContent("Stress");
  expect(buttons[0]).toHaveTextContent("Your trigger");
  expect(buttons.at(-1)).toHaveTextContent("When to see a doctor");
  await user.click(buttons[0]);
  const onScreen = advice.querySelector('[data-print="screen-only"]') as HTMLElement;
  expect(within(onScreen).getByText(/Relaxation techniques/)).toBeInTheDocument();
  expect(within(onScreen).getAllByRole("link", { name: /NHS/ })[0]).toHaveAttribute(
    "href",
    "https://www.nhs.uk/conditions/migraine/",
  );
});

test("two columns in landscape", () => {
  view([]);
  expect(screen.getByRole("main")).toHaveClass("landscape:grid-cols-2");
});

test("a print-only copy lists every topic's tips (closed accordions don't print)", () => {
  view([]);
  const printed = document.querySelector('[data-print="only"]') as HTMLElement;
  expect(printed).not.toBeNull();
  expect(printed).toHaveClass("hidden");
  expect(printed).toHaveTextContent(/Relaxation techniques/);
  expect(printed).toHaveTextContent(/Call emergency services/);
});
