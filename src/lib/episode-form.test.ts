import { describe, expect, test } from "vitest";
import { episodeInputSchema, fromLocalInputValue, toLocalInputValue } from "./episode-form";

const NOW = new Date("2026-11-18T18:00:00Z");

function input(overrides: Record<string, unknown> = {}) {
  return {
    startedAt: "2026-11-14T17:00:00.000Z",
    peakPain: 7,
    locations: ["left side"],
    symptoms: ["nausea"],
    triggers: ["poor sleep"],
    notes: "",
    medications: [{ name: "Sumatriptan", takenAt: null, helped: "yes" }],
    ...overrides,
  };
}

const parse = (v: unknown) => episodeInputSchema(NOW).safeParse(v);
const firstError = (v: unknown) => {
  const r = parse(v);
  return r.success ? null : r.error.issues[0].message;
};

describe("episodeInputSchema", () => {
  test("valid input passes", () => expect(parse(input()).success).toBe(true));

  test("pain out of range", () => expect(parse(input({ peakPain: 11 })).success).toBe(false));

  test("an endedAt field is not accepted into the output", () => {
    const r = parse(input({ endedAt: "2026-11-14T23:20:00.000Z" }));
    expect(r.success && "endedAt" in r.data).toBe(false);
  });

  test("start in the future", () =>
    expect(firstError(input({ startedAt: "2026-11-18T19:00:00.000Z" }))).toBe(
      "Start time can't be in the future",
    ));

  test("triggers are trimmed, deduped, blanks dropped", () => {
    const r = parse(input({ triggers: [" stress ", "stress", ""] }));
    expect(r.success && r.data.triggers).toEqual(["stress"]);
  });

  test("medication needs a name", () =>
    expect(parse(input({ medications: [{ name: "  ", takenAt: null, helped: "yes" }] })).success).toBe(false));

  test("rejects a bad id", () => expect(parse(input({ id: "not-a-uuid" })).success).toBe(false));
});

describe("datetime-local helpers", () => {
  test("toLocalInputValue formats local time", () =>
    expect(toLocalInputValue(new Date(2026, 10, 14, 9, 5))).toBe("2026-11-14T09:05"));

  test("round-trips", () => {
    const d = new Date(2026, 10, 14, 9, 5);
    expect(fromLocalInputValue(toLocalInputValue(d))).toEqual(d);
  });
});
