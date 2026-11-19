"use client";

import { useMemo } from "react";
import { deserializeEpisode, type SerializedEpisode } from "@/lib/episode-rows";
import { groupByMonth } from "@/lib/group-by-month";
import { useNow } from "@/lib/use-now";
import { EpisodeCard } from "./EpisodeCard";

export function HistoryList({ initial }: { initial: SerializedEpisode[] }) {
  const episodes = useMemo(() => initial.map(deserializeEpisode), [initial]);
  const now = useNow(); // dates/months in the device's timezone → render on device only
  if (!now) return null;
  if (episodes.length === 0) return <p className="mt-8 text-dusk-muted">No migraines logged yet</p>;

  return (
    <div>
      {groupByMonth(episodes).map((g) => (
        <section key={g.label} className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dusk-muted">{g.label}</h2>
          <ul className="space-y-3">
            {g.items.map((e) => (
              <li key={e.id}>
                <EpisodeCard episode={e} href={`/episodes/${e.id}`} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
