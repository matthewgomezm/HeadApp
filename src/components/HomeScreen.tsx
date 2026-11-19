import { daysSinceLabel, latestEpisode, type Episode } from "@/lib/episodes";
import { EpisodeCard } from "./EpisodeCard";
import { LogButton } from "./LogButton";

type Props = { name: string; episodes: Episode[]; now: Date };

export function HomeScreen({ name, episodes, now }: Props) {
  const latest = latestEpisode(episodes);
  const today = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <p className="mt-4 text-sm text-dusk-muted">{today}</p>
      <h1 className="mt-1 text-[22px] font-semibold">Hi {name}</h1>
      <p className="text-dusk-text/80">{daysSinceLabel(latest?.startedAt ?? null, now)}</p>

      <div className="mt-10 mb-4">
        <LogButton />
      </div>
      <p className="text-center text-sm text-dusk-muted">Details can wait until you feel better</p>

      {latest && (
        <section aria-label="Most recent migraine" className="mt-8">
          <EpisodeCard episode={latest} />
        </section>
      )}
    </main>
  );
}
