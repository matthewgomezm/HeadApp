import { InsightsView } from "@/components/InsightsView";
import { getEpisodes } from "@/lib/data";
import { serializeEpisode } from "@/lib/episode-rows";

export default async function InsightsPage() {
  const episodes = await getEpisodes();
  return <InsightsView initial={episodes.map(serializeEpisode)} />;
}
