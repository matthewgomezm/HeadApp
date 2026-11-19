import { expect, test } from "vitest";
import { deserializeEpisode, rowToEpisode, serializeEpisode } from "./episode-rows";

const row = {
  id: "e1",
  user_id: "u1",
  started_at: "2026-11-14T17:00:00+00:00",
  ended_at: "2026-11-14T23:20:00+00:00",
  peak_pain: 7,
  locations: ["left side"],
  symptoms: ["nausea"],
  triggers: ["poor sleep"],
  notes: "rough day",
  created_at: "2026-11-14T17:00:00+00:00",
  updated_at: "2026-11-14T17:00:00+00:00",
  medication_doses: [
    { id: "d1", episode_id: "e1", user_id: "u1", name: "Sumatriptan", taken_at: "2026-11-14T17:30:00+00:00", helped: "yes" },
    { id: "d2", episode_id: "e1", user_id: "u1", name: "Advil", taken_at: null, helped: "bogus" },
  ],
};

test("rowToEpisode maps fields and dates", () => {
  const e = rowToEpisode(row);
  expect(e.id).toBe("e1");
  expect(e.startedAt).toEqual(new Date("2026-11-14T17:00:00Z"));
  expect(e).not.toHaveProperty("endedAt"); // end time is no longer tracked
  expect(e.peakPain).toBe(7);
  expect(e.locations).toEqual(["left side"]);
  expect(e.symptoms).toEqual(["nausea"]);
  expect(e.triggers).toEqual(["poor sleep"]);
  expect(e.notes).toBe("rough day");
  expect(e.medications).toEqual([
    { id: "d1", name: "Sumatriptan", takenAt: new Date("2026-11-14T17:30:00Z"), helped: "yes" },
    { id: "d2", name: "Advil", takenAt: null, helped: "unknown" },
  ]);
});

test("serialize → deserialize round-trips", () => {
  const e = rowToEpisode(row);
  expect(deserializeEpisode(JSON.parse(JSON.stringify(serializeEpisode(e))))).toEqual(e);
});
