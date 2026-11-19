import { expect, test } from "vitest";
import { groupByMonth } from "./group-by-month";

test("groups newest-first by local month", () => {
  const eps = [
    { id: "a", startedAt: new Date(2026, 9, 22) },
    { id: "b", startedAt: new Date(2026, 10, 14) },
    { id: "c", startedAt: new Date(2026, 10, 3) },
  ];
  expect(groupByMonth(eps).map((g) => [g.label, g.items.map((e) => e.id)])).toEqual([
    ["November 2026", ["b", "c"]],
    ["October 2026", ["a"]],
  ]);
});

test("empty", () => expect(groupByMonth([])).toEqual([]));
