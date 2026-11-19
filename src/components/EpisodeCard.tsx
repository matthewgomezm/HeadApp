import Link from "next/link";
import { episodeHeadline, episodeSubline, type Episode } from "@/lib/episodes";

export function EpisodeCard({ episode, href }: { episode: Episode; href?: string }) {
  const body = (
    <>
      <p className="font-semibold">{episodeHeadline(episode)}</p>
      <p className="text-dusk-text/90">{episodeSubline(episode)}</p>
      {episode.triggers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {episode.triggers.map((t, i) => (
            <li
              key={`${i}-${t}`}
              className="max-w-full rounded-full bg-dusk-fill px-2.5 py-0.5 text-sm text-dusk-accent"
            >
              {t}
            </li>
          ))}
        </ul>
      )}
    </>
  );
  const cls = "block break-words rounded-2xl bg-dusk-surface px-4 py-3";
  return href ? (
    <Link
      href={href}
      data-testid="episode-card"
      className={`${cls} focus-visible:outline-2 focus-visible:outline-dusk-accent active:bg-dusk-fill`}
    >
      {body}
    </Link>
  ) : (
    <div data-testid="episode-card" className={cls}>
      {body}
    </div>
  );
}
