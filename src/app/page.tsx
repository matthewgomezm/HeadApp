import { LiveHome } from "@/components/LiveHome";
import { getEpisodes } from "@/lib/data";
import { serializeEpisode } from "@/lib/episode-rows";

export default async function Home() {
  const episodes = await getEpisodes(); // full history: the totals card compares up to 90+90 days
  return <LiveHome name="Jadyn" initial={episodes.map(serializeEpisode)} />;
}
