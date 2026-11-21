import Link from "next/link";
import { HistoryList } from "@/components/HistoryList";
import { getEpisodes } from "@/lib/data";
import { serializeEpisode } from "@/lib/episode-rows";

export default async function HistoryPage() {
  const episodes = await getEpisodes();
  return (
    <main className="page max-w-md landscape:max-w-4xl">
      <h1 className="mt-4 text-[22px] font-semibold">History</h1>
      <Link
        href="/episodes/new"
        className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-dusk-fill font-semibold text-dusk-accent focus-visible:outline-2 focus-visible:outline-dusk-accent"
      >
        Log a past migraine
      </Link>
      <HistoryList initial={episodes.map(serializeEpisode)} />
    </main>
  );
}
