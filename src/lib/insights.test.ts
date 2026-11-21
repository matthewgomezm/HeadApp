import { describe, expect, test } from "vitest";
import type { Episode, Helped } from "./episodes";
import { inWindow, medicationResults, patternSummary, triggerCounts } from "./insights";

const now = new Date(2026, 10, 20, 12, 0); // Fri Nov 20 2026, local

let n = 0;
function ep(o: Partial<Episode> & { startedAt: Date }): Episode {
  return {
    id: `e${n++}`,
    endedAt: new Date(o.startedAt.getTime() + 60 * 60_000),
    peakPain: 6,
    locations: [],
    symptoms: [],
    triggers: [],
    notes: "",
    medications: [],
    ...o,
  };
}
const med = (name: string, helped: Helped) => ({ name, takenAt: null, helped });

describe("window", () => {
  test("only migraines from the last 90 days", () => {
    const list = [ep({ startedAt: new Date(2026, 10, 1) }), ep({ startedAt: new Date(2026, 6, 1) })];
    expect(inWindow(list, now)).toHaveLength(1);
  });
});

describe("patternSummary", () => {
  test("fewer than 3 migraines is not enough", () => {
    const s = patternSummary([ep({ startedAt: new Date(2026, 10, 1) }), ep({ startedAt: new Date(2026, 10, 2) })], now);
    expect(s.count).toBe(2);
    expect(s.enough).toBe(false);
  });

  test("averages skip migraines still going and unrated pain", () => {
    const s = patternSummary(
      [
        ep({ startedAt: new Date(2026, 10, 2, 18), endedAt: new Date(2026, 10, 2, 20), peakPain: 6 }),
        ep({ startedAt: new Date(2026, 10, 9, 18), endedAt: new Date(2026, 10, 9, 22), peakPain: null }),
        ep({ startedAt: new Date(2026, 10, 16, 19), endedAt: null, peakPain: 8 }),
      ],
      now,
    );
    expect(s.enough).toBe(true);
    expect(s.avgDurationMin).toBe(180); // (120 + 240) / 2 — the open one ignored
    expect(s.avgPain).toBe(7); // (6 + 8) / 2 — the unrated one ignored
    expect(s.timeOfDay).toBe("evening");
    expect(s.weekday).toBe("Monday"); // Nov 2, 9, 16 2026 are Mondays
  });

  test("just after midnight is night, on the day it started", () => {
    const s = patternSummary(
      [
        ep({ startedAt: new Date(2026, 10, 3, 0, 30) }), // Tue
        ep({ startedAt: new Date(2026, 10, 10, 0, 30) }), // Tue
        ep({ startedAt: new Date(2026, 10, 12, 14) }), // Thu
      ],
      now,
    );
    expect(s.timeOfDay).toBe("night");
    expect(s.weekday).toBe("Tuesday");
  });

  test("no ended or rated migraines → null averages", () => {
    const s = patternSummary(
      [1, 2, 3].map((d) => ep({ startedAt: new Date(2026, 10, d, 9), endedAt: null, peakPain: null })),
      now,
    );
    expect(s.avgDurationMin).toBeNull();
    expect(s.avgPain).toBeNull();
    expect(s.timeOfDay).toBe("morning");
  });
});

describe("triggerCounts", () => {
  test("counts each trigger out of all migraines in the window", () => {
    const list = [
      ep({ startedAt: new Date(2026, 10, 1), triggers: ["stress", "poor sleep"] }),
      ep({ startedAt: new Date(2026, 10, 2), triggers: ["stress"] }),
      ep({ startedAt: new Date(2026, 10, 3), triggers: ["stress", "caffeine"] }),
      ep({ startedAt: new Date(2026, 10, 4), triggers: [] }),
    ];
    expect(triggerCounts(list, now)).toEqual([
      { name: "stress", count: 3, total: 4 },
      { name: "caffeine", count: 1, total: 4 },
      { name: "poor sleep", count: 1, total: 4 },
    ]);
  });
});

describe("medicationResults", () => {
  test("helped / a little / didn't; unknown not rated", () => {
    const list = [
      ep({ startedAt: new Date(2026, 10, 1), medications: [med("Sumatriptan", "yes")] }),
      ep({ startedAt: new Date(2026, 10, 2), medications: [med("Sumatriptan", "somewhat")] }),
      ep({ startedAt: new Date(2026, 10, 3), medications: [med("Sumatriptan", "no")] }),
      ep({ startedAt: new Date(2026, 10, 4), medications: [med("Sumatriptan", "unknown")] }),
    ];
    expect(medicationResults(list, now)).toEqual([
      { name: "Sumatriptan", helped: 1, somewhat: 1, no: 1, rated: 3, score: 0.5 },
    ]);
  });
});
