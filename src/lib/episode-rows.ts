import { HELPED_VALUES, type Episode, type Helped } from "./episodes";
import type { Tables } from "./supabase/database.types";

export type EpisodeRow = Tables<"episodes">;
export type DoseRow = Tables<"medication_doses">;

function toHelped(v: string): Helped {
  return (HELPED_VALUES as readonly string[]).includes(v) ? (v as Helped) : "unknown";
}

export function rowToEpisode(row: EpisodeRow & { medication_doses: DoseRow[] }): Episode {
  return {
    id: row.id,
    startedAt: new Date(row.started_at),
    endedAt: row.ended_at ? new Date(row.ended_at) : null,
    peakPain: row.peak_pain,
    locations: row.locations,
    symptoms: row.symptoms,
    triggers: row.triggers,
    notes: row.notes,
    medications: row.medication_doses.map((d) => ({
      id: d.id,
      name: d.name,
      takenAt: d.taken_at ? new Date(d.taken_at) : null,
      helped: toHelped(d.helped),
    })),
  };
}

/** Plain-JSON form for passing episodes from Server to Client Components. */
export type SerializedEpisode = Omit<Episode, "startedAt" | "endedAt" | "medications"> & {
  startedAt: string;
  endedAt: string | null;
  medications: { id?: string; name: string; takenAt: string | null; helped: Helped }[];
};

export function serializeEpisode(e: Episode): SerializedEpisode {
  return {
    ...e,
    startedAt: e.startedAt.toISOString(),
    endedAt: e.endedAt?.toISOString() ?? null,
    medications: e.medications.map((m) => ({ ...m, takenAt: m.takenAt?.toISOString() ?? null })),
  };
}

export function deserializeEpisode(s: SerializedEpisode): Episode {
  return {
    ...s,
    startedAt: new Date(s.startedAt),
    endedAt: s.endedAt ? new Date(s.endedAt) : null,
    medications: s.medications.map((m) => ({ ...m, takenAt: m.takenAt ? new Date(m.takenAt) : null })),
  };
}
