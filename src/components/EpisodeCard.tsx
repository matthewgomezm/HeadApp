import { episodeHeadline, episodeSubline, type Episode } from "@/lib/episodes";

export function EpisodeCard({ episode }: { episode: Episode }) {
  return (
    <div data-testid="episode-card" className="break-words rounded-2xl bg-dusk-surface px-4 py-3">
      <p className="font-semibold">{episodeHeadline(episode)}</p>
      <p className="text-dusk-text/90">{episodeSubline(episode)}</p>
      {episode.triggers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {episode.triggers.map((t) => (
            <li
              key={t}
              className="max-w-full rounded-full bg-dusk-fill px-2.5 py-0.5 text-sm text-dusk-accent"
            >
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
