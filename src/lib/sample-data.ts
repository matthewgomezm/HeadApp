import type { Episode } from "./episodes";

/** Fixture data for tests (the app reads real episodes from Supabase). */
export const sampleEpisodes: Episode[] = [
  {
    id: "sample-3",
    startedAt: new Date(2026, 10, 14, 9, 0),
    peakPain: 7,
    locations: [],
    symptoms: [],
    triggers: ["poor sleep", "pressure drop"],
    notes: "",
    medications: [{ name: "Sumatriptan", takenAt: null, helped: "yes" }],
  },
  {
    id: "sample-2",
    startedAt: new Date(2026, 10, 3, 17, 30),
    peakPain: 8,
    locations: [],
    symptoms: [],
    triggers: ["stress", "skipped meal"],
    notes: "",
    medications: [{ name: "Sumatriptan", takenAt: null, helped: "somewhat" }],
  },
  {
    id: "sample-1",
    startedAt: new Date(2026, 9, 22, 13, 0),
    peakPain: 5,
    locations: [],
    symptoms: [],
    triggers: ["period/cycle"],
    notes: "",
    medications: [{ name: "Advil", takenAt: null, helped: "yes" }],
  },
];
