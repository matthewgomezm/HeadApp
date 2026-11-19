import { ClientHome } from "@/components/ClientHome";
import { sampleEpisodes } from "@/lib/sample-data";

export default function Home() {
  return <ClientHome name="Jadyn" episodes={sampleEpisodes} />;
}
