import type { Episode } from "./episodes";

/** Static placeholder data for Phase 1. Replaced by Supabase in Phase 2. */
export const sampleEpisodes: Episode[] = [
  {
    id: "sample-3",
    startedAt: new Date(2026, 10, 14, 9, 0),
    endedAt: new Date(2026, 10, 14, 15, 20),
    peakPain: 7,
    triggers: ["poor sleep", "pressure drop"],
    medications: [{ name: "Sumatriptan", helped: "yes" }],
  },
  {
    id: "sample-2",
    startedAt: new Date(2026, 10, 3, 17, 30),
    endedAt: new Date(2026, 10, 4, 1, 0),
    peakPain: 8,
    triggers: ["stress", "skipped meal"],
    medications: [{ name: "Sumatriptan", helped: "somewhat" }],
  },
  {
    id: "sample-1",
    startedAt: new Date(2026, 9, 22, 13, 0),
    endedAt: new Date(2026, 9, 22, 16, 45),
    peakPain: 5,
    triggers: ["period/cycle"],
    medications: [{ name: "Advil", helped: "yes" }],
  },
];
