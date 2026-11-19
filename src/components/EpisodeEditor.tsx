"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
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

function newDraft(now: Date): Episode {
  const five = 5 * 60_000;
  const start = new Date(Math.floor(now.getTime() / five) * five);
  return {
    id: "",
    startedAt: start,
    endedAt: new Date(start.getTime() + 60 * 60_000),
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
  const episode = useMemo(
    () => (initial ? deserializeEpisode(initial) : now ? newDraft(now) : null),
    [initial, now],
  );

  async function onSave(input: EpisodeInput) {
    const result = await saveEpisode(input);
    if (result.ok) router.push("/history");
    return result;
  }

  async function onDelete() {
    if (!episode) return;
    if (!window.confirm("Delete this migraine? This can't be undone.")) return;
    const result = await deleteEpisode(episode.id);
    if (result.ok) router.push("/history");
  }

  if (!now || !episode) return null;

  return (
    <EpisodeForm
      initial={episode}
      usedTriggers={usedTriggers}
      usedMedications={usedMedications}
      onSave={onSave}
      onDelete={episode.id ? onDelete : undefined}
    />
  );
}
