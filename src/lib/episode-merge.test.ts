import { expect, test } from "vitest";
import { MemStorage } from "@/test/mem-storage";
import { mergeQueued } from "./episode-merge";
import type { Episode } from "./episodes";
import { enqueue } from "./log-queue";

const base: Episode = {
  id: "srv",
  startedAt: new Date("2026-11-18T14:00:00Z"),
  endedAt: null,
  peakPain: 4,
  locations: [],
  symptoms: [],
  triggers: ["stress"],
  notes: "",
  medications: [],
};

test("a queued end (not synced yet) is shown on the server episode", () => {
  const s = new MemStorage();
  enqueue({ id: "srv", patch: { ended_at: "2026-11-18T16:00:00.000Z", peak_pain: 6 } }, s);
  const [e] = mergeQueued([base], s);
  expect(e.endedAt).toEqual(new Date("2026-11-18T16:00:00.000Z"));
  expect(e.peakPain).toBe(6);
  expect(e.triggers).toEqual(["stress"]);
});

test("a queued new migraine is added before server ones", () => {
  const s = new MemStorage();
  enqueue({ id: "new", patch: { started_at: "2026-11-18T17:00:00.000Z" } }, s);
  const list = mergeQueued([base], s);
  expect(list.map((e) => e.id)).toEqual(["new", "srv"]);
  expect(list[0].endedAt).toBeNull();
});

test("no queue → server list unchanged", () => {
  expect(mergeQueued([base], new MemStorage())).toEqual([base]);
});
