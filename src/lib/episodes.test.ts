import { describe, expect, test } from "vitest";
import {
  daysSinceLabel,
  episodeHeadline,
  episodeSubline,
  formatDuration,
  latestEpisode,
  type Episode,
} from "./episodes";

const start = new Date(2026, 10, 14, 9, 0); // Sat Nov 14 2026, local
const plus = (d: Date, mins: number) => new Date(d.getTime() + mins * 60_000);

function ep(overrides: Partial<Episode> = {}): Episode {
  return {
    id: "e1",
    startedAt: start,
    endedAt: plus(start, 380),
    peakPain: 7,
    triggers: [],
    medications: [{ name: "Sumatriptan", helped: "yes" }],
    ...overrides,
  };
}

describe("daysSinceLabel", () => {
  test("no episodes", () => {
    expect(daysSinceLabel(null, new Date(2026, 10, 18))).toBe("No migraines logged yet");
  });
  test("same calendar day", () => {
    expect(daysSinceLabel(new Date(2026, 10, 18, 1), new Date(2026, 10, 18, 22))).toBe(
      "Your last migraine was today",
    );
  });
  test("across midnight counts as 1 day (singular)", () => {
    expect(daysSinceLabel(new Date(2026, 10, 17, 23), new Date(2026, 10, 18, 1))).toBe(
      "1 day since your last migraine",
    );
  });
  test("several days, by calendar day not 24h blocks", () => {
    expect(daysSinceLabel(new Date(2026, 10, 14, 9), new Date(2026, 10, 18, 8))).toBe(
      "4 days since your last migraine",
    );
  });
});

describe("formatDuration", () => {
  test("hours and minutes", () => expect(formatDuration(start, plus(start, 380))).toBe("6h 20m"));
  test("minutes only", () => expect(formatDuration(start, plus(start, 45))).toBe("45m"));
  test("whole hours", () => expect(formatDuration(start, plus(start, 120))).toBe("2h"));
  test("in progress", () => expect(formatDuration(start, null)).toBe("In progress"));
});

describe("episodeHeadline", () => {
  test("with pain", () => expect(episodeHeadline(ep())).toBe("Sat, Nov 14 · 7/10"));
  test("without pain", () => expect(episodeHeadline(ep({ peakPain: null }))).toBe("Sat, Nov 14"));
});

describe("episodeSubline", () => {
  test("medication helped", () => expect(episodeSubline(ep())).toBe("6h 20m · Sumatriptan helped"));
  test("no medications", () => expect(episodeSubline(ep({ medications: [] }))).toBe("6h 20m"));
  test("medication didn't help", () =>
    expect(episodeSubline(ep({ medications: [{ name: "Sumatriptan", helped: "no" }] }))).toBe(
      "6h 20m · Sumatriptan didn't help",
    ));
  test("helped a little", () =>
    expect(episodeSubline(ep({ medications: [{ name: "Advil", helped: "somewhat" }] }))).toBe(
      "6h 20m · Advil helped a little",
    ));
  test("unknown → name only", () =>
    expect(episodeSubline(ep({ medications: [{ name: "Advil", helped: "unknown" }] }))).toBe(
      "6h 20m · Advil",
    ));
  test("in progress", () =>
    expect(episodeSubline(ep({ endedAt: null, medications: [] }))).toBe("In progress"));
});

describe("latestEpisode", () => {
  test("empty list", () => expect(latestEpisode([])).toBeNull());
  test("picks max startedAt regardless of order", () => {
    const a = ep({ id: "a", startedAt: new Date(2026, 9, 1) });
    const b = ep({ id: "b", startedAt: new Date(2026, 10, 14) });
    const c = ep({ id: "c", startedAt: new Date(2026, 10, 2) });
    expect(latestEpisode([a, b, c])?.id).toBe("b");
  });
});
