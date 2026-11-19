import { describe, expect, test } from "vitest";
import {
  daysSinceLabel,
  episodeHeadline,
  episodeSubline,
  latestEpisode,
  type Episode,
} from "./episodes";

const start = new Date(2026, 10, 14, 9, 0); // Sat Nov 14 2026, local

function ep(overrides: Partial<Episode> = {}): Episode {
  return {
    id: "e1",
    startedAt: start,
    peakPain: 7,
    locations: [],
    symptoms: [],
    triggers: [],
    notes: "",
    medications: [{ name: "Sumatriptan", takenAt: null, helped: "yes" }],
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

describe("episodeHeadline", () => {
  test("with pain", () => expect(episodeHeadline(ep())).toBe("Sat, Nov 14 · 7/10"));
  test("without pain", () => expect(episodeHeadline(ep({ peakPain: null }))).toBe("Sat, Nov 14"));
});

describe("episodeSubline", () => {
  test("start time and medication helped", () =>
    expect(episodeSubline(ep())).toBe("9:00 AM · Sumatriptan helped"));
  test("no medications → start time only", () =>
    expect(episodeSubline(ep({ medications: [] }))).toBe("9:00 AM"));
  test("medication didn't help", () =>
    expect(episodeSubline(ep({ medications: [{ name: "Sumatriptan", takenAt: null, helped: "no" }] }))).toBe(
      "9:00 AM · Sumatriptan didn't help",
    ));
  test("helped a little", () =>
    expect(episodeSubline(ep({ medications: [{ name: "Advil", takenAt: null, helped: "somewhat" }] }))).toBe(
      "9:00 AM · Advil helped a little",
    ));
  test("unknown → name only", () =>
    expect(episodeSubline(ep({ medications: [{ name: "Advil", takenAt: null, helped: "unknown" }] }))).toBe(
      "9:00 AM · Advil",
    ));
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
