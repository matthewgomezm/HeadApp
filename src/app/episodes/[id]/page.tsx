import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodeEditor } from "@/components/EpisodeEditor";
import { getEpisode, getUsedNames } from "@/lib/data";
import { serializeEpisode } from "@/lib/episode-rows";

export default async function EpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [episode, used] = await Promise.all([getEpisode(id), getUsedNames()]);
  if (!episode) notFound();

  return (
    <main className="page max-w-md landscape:max-w-2xl">
      <Link href="/history" className="mt-2 inline-flex min-h-12 items-center text-dusk-muted">
        ‹ History
      </Link>
      <h1 className="text-[22px] font-semibold">Migraine details</h1>
      <EpisodeEditor
        initial={serializeEpisode(episode)}
        usedTriggers={used.triggers}
        usedMedications={used.medications}
      />
    </main>
  );
}
