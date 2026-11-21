"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteEpisodes } from "@/app/episodes/actions";
import { deserializeEpisode, type SerializedEpisode } from "@/lib/episode-rows";
import { episodeHeadline, episodeSubline } from "@/lib/episodes";
import { groupByMonth } from "@/lib/group-by-month";
import { useNow } from "@/lib/use-now";
import { EpisodeCard } from "./EpisodeCard";
import HoldButton from "./kokonutui/hold-button";

const smallBtn =
  "min-h-12 rounded-xl px-4 text-dusk-accent focus-visible:outline-2 focus-visible:outline-dusk-accent";

export function HistoryList({ initial }: { initial: SerializedEpisode[] }) {
  const router = useRouter();
  const episodes = useMemo(() => initial.map(deserializeEpisode), [initial]);
  const now = useNow(); // dates/months in the device's timezone → render on device only
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  if (!now) return null;
  if (episodes.length === 0) return <p className="mt-8 text-dusk-muted">No migraines logged yet</p>;

  const allSelected = selected.size === episodes.length;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
    setError(null);
  }

  async function removeSelected() {
    setError(null);
    try {
      const result = await deleteEpisodes([...selected]);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      stopSelecting();
      router.refresh();
    } catch {
      setError("Couldn't delete. Check your connection, or sign in again.");
    }
  }

  return (
    <div>
      <div className="mt-6 flex items-center justify-between">
        {selecting ? (
          <>
            <button
              type="button"
              className={smallBtn}
              onClick={() => setSelected(allSelected ? new Set() : new Set(episodes.map((e) => e.id)))}
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
            <button type="button" className={`${smallBtn} text-dusk-muted`} onClick={stopSelecting}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className={`${smallBtn} ml-auto`} onClick={() => setSelecting(true)}>
            Select
          </button>
        )}
      </div>

      {groupByMonth(episodes).map((g) => (
        <section key={g.label} className="mt-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dusk-muted">{g.label}</h2>
          <ul className="grid gap-3 landscape:grid-cols-2">
            {g.items.map((e) =>
              selecting ? (
                <li key={e.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 ${
                      selected.has(e.id) ? "bg-dusk-fill ring-2 ring-dusk-accent/70" : "bg-dusk-surface"
                    }`}
                  >
                    <input
                      type="checkbox"
                      aria-label={episodeHeadline(e)}
                      checked={selected.has(e.id)}
                      onChange={() => toggle(e.id)}
                      className="size-6 shrink-0 accent-dusk-accent"
                    />
                    <span className="min-w-0 break-words">
                      <span className="block font-semibold">{episodeHeadline(e)}</span>
                      <span className="block text-dusk-text/90">{episodeSubline(e)}</span>
                    </span>
                  </label>
                </li>
              ) : (
                <li key={e.id}>
                  <EpisodeCard episode={e} href={`/episodes/${e.id}`} />
                </li>
              ),
            )}
          </ul>
        </section>
      ))}

      {selecting && (
        // Sits just above the tab bar; holding (not tapping) deletes, so nothing goes by accident.
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] mt-6 bg-dusk-bg py-3">
          {error && (
            <p role="alert" className="mb-2 text-destructive">
              {error}
            </p>
          )}
          <HoldButton
            className="w-full"
            disabled={selected.size === 0}
            holdDuration={1200}
            completeLabel={`Deleted ${selected.size}`}
            onHoldComplete={removeSelected}
          >
            {`Hold to delete ${selected.size}`}
          </HoldButton>
        </div>
      )}
    </div>
  );
}
