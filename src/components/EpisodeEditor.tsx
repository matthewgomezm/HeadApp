"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteEpisode, saveEpisode } from "@/app/episodes/actions";
import { deserializeEpisode, type SerializedEpisode } from "@/lib/episode-rows";
import type { EpisodeInput } from "@/lib/episode-form";
import type { Episode } from "@/lib/episodes";
import { useNow } from "@/lib/use-now";
import { EpisodeForm } from "./EpisodeForm";

type Props = {
  /** null → a new, past migraine (draft built on the device). */
  initial: SerializedEpisode | null;
  usedTriggers: string[];
  usedMedications: string[];
};

function newDraft(id: string, now: Date): Episode {
  const five = 5 * 60_000;
  const start = new Date(Math.floor(now.getTime() / five) * five);
  return {
    id,
    startedAt: start,
    peakPain: null,
    locations: [],
    symptoms: [],
    triggers: [],
    notes: "",
    medications: [],
  };
}

/** Wires EpisodeForm to the server actions and navigation. */
export function EpisodeEditor({ initial, usedTriggers, usedMedications }: Props) {
  const router = useRouter();
  // Times are shown in the device's timezone, so render only on the device.
  const now = useNow();
  // Assigned once, so retried saves of a new migraine update the same row.
  const [draftId] = useState(() => crypto.randomUUID());
  const episode = useMemo(
    () => (initial ? deserializeEpisode(initial) : now ? newDraft(draftId, now) : null),
    [initial, now, draftId],
  );

  async function onSave(input: EpisodeInput) {
    const result = await saveEpisode(input);
    if (result.ok) router.push("/history");
    return result;
  }

  async function onDelete(): Promise<string | null> {
    if (!episode) return null;
    if (!window.confirm("Delete this migraine? This can't be undone.")) return null;
    const result = await deleteEpisode(episode.id);
    if (!result.ok) return result.error;
    router.push("/history");
    return null;
  }

  if (!now || !episode) return null;

  return (
    <EpisodeForm
      initial={episode}
      usedTriggers={usedTriggers}
      usedMedications={usedMedications}
      onSave={onSave}
      onDelete={initial ? onDelete : undefined}
    />
  );
}
