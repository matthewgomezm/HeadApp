import { daysSinceLabel, latestEpisode, type Episode } from "@/lib/episodes";
import { EpisodeCard } from "./EpisodeCard";
import { InProgress } from "./InProgress";
import { LogButton } from "./LogButton";

export type OpenEpisode = { id: string; startedAt: Date };

type Props = {
  name: string;
  episodes: Episode[];
  now: Date;
  openEpisode?: OpenEpisode | null;
  onLog?: () => void;
  onEnd?: () => void;
};

export function HomeScreen({ name, episodes, now, openEpisode, onLog, onEnd }: Props) {
  const latest = latestEpisode(episodes);
  // The card shows the most recent migraine other than the one in progress.
  const cardEpisode = latestEpisode(episodes.filter((e) => e.id !== openEpisode?.id));
  const today = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <p className="mt-4 text-sm text-dusk-muted">{today}</p>
      <h1 className="mt-1 text-[22px] font-semibold">Hi {name}</h1>
      {!openEpisode && (
        <p className="text-dusk-text/80">
          {daysSinceLabel(latest ? (latest.endedAt ?? now) : null, now)}
        </p>
      )}

      {openEpisode ? (
        <div className="mt-10">
          <InProgress id={openEpisode.id} startedAt={openEpisode.startedAt} onEnd={onEnd} />
        </div>
      ) : (
        <>
          <div className="mt-10 mb-4">
            <LogButton onLog={onLog} />
          </div>
          <p className="text-center text-sm text-dusk-muted">
            Details can wait until you feel better
          </p>
        </>
      )}

      {cardEpisode && (
        <section aria-label="Most recent migraine" className="mt-8">
          <EpisodeCard episode={cardEpisode} />
        </section>
      )}
    </main>
  );
}
