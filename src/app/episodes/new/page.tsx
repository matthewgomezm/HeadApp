import Link from "next/link";
import { EpisodeEditor } from "@/components/EpisodeEditor";
import { getUsedNames } from "@/lib/data";

export default async function NewEpisodePage() {
  const used = await getUsedNames();

  return (
    <main className="page max-w-md landscape:max-w-2xl">
      <Link href="/history" className="mt-2 inline-flex min-h-12 items-center text-dusk-muted">
        ‹ History
      </Link>
      <h1 className="text-[22px] font-semibold">Log a past migraine</h1>
      <EpisodeEditor initial={null} usedTriggers={used.triggers} usedMedications={used.medications} />
    </main>
  );
}
