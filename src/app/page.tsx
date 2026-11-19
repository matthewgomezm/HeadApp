import { LiveHome } from "@/components/LiveHome";
import { getEpisodes } from "@/lib/data";
import { serializeEpisode } from "@/lib/episode-rows";

export default async function Home() {
  const episodes = await getEpisodes(20);
  return <LiveHome name="Jadyn" initial={episodes.map(serializeEpisode)} />;
}
