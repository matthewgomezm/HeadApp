import { expect, test } from "vitest";
import type { Episode } from "./episodes";
import { METRIC_SEGMENTS, migraineMetricData } from "./migraine-metrics";

const now = new Date(2026, 10, 18, 10, 0); // Wed Nov 18 2026, local

function ep(startedAt: Date, peakPain: number | null): Episode {
  return {
    id: String(startedAt.getTime()),
    startedAt,
    peakPain,
    locations: [],
    symptoms: [],
    triggers: [],
    notes: "",
    medications: [],
  };
}

test("segments, most severe first", () => {
  expect(METRIC_SEGMENTS).toEqual(["Severe (7–10)", "Moderate (4–6)", "Mild (1–3)", "Not rated"]);
});

test("one point per local day, oldest first, ending today", () => {
  const data = migraineMetricData([], now, 180);
  expect(data).toHaveLength(180);
  expect(data.at(-1)!.date).toBe("2026-11-18");
  expect(data[0].date).toBe("2026-05-23");
  expect(data.every((p) => p.parts.length === 4 && p.parts.every((n) => n === 0))).toBe(true);
});

test("counts each migraine on its local day, in its severity bucket", () => {
  const data = migraineMetricData(
    [
      ep(new Date(2026, 10, 18, 1), 8), // severe, today
      ep(new Date(2026, 10, 18, 23), 3), // mild, today (late evening stays today)
      ep(new Date(2026, 10, 17, 9), 5), // moderate, yesterday
      ep(new Date(2026, 10, 17, 12), null), // not rated, yesterday
      ep(new Date(2026, 10, 17, 15), 10), // severe, yesterday
    ],
    now,
    180,
  );
  expect(data.at(-1)!.parts).toEqual([1, 0, 1, 0]);
  expect(data.at(-2)!.parts).toEqual([1, 1, 0, 1]);
});

test("migraines outside the window are ignored", () => {
  const data = migraineMetricData([ep(new Date(2026, 0, 1), 5), ep(new Date(2026, 11, 1), 5)], now, 180);
  expect(data.reduce((s, p) => s + p.parts.reduce((a, b) => a + b, 0), 0)).toBe(0);
});
