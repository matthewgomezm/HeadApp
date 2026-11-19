import "server-only";
import { rowToEpisode } from "./episode-rows";
import type { Episode } from "./episodes";
import { createClient } from "./supabase/server";

const SELECT = "*, medication_doses(*)";

export async function getEpisodes(limit = 500): Promise<Episode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("episodes")
    .select(SELECT)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(rowToEpisode);
}

export async function getEpisode(id: string): Promise<Episode | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("episodes").select(SELECT).eq("id", id).maybeSingle();
  if (error) {
    // invalid uuid etc. → treat as not found
    if (error.code === "22P02") return null;
    throw error;
  }
  return data ? rowToEpisode(data) : null;
}

export async function getUsedNames(): Promise<{ triggers: string[]; medications: string[] }> {
  const supabase = await createClient();
  const [eps, doses] = await Promise.all([
    supabase.from("episodes").select("triggers"),
    supabase.from("medication_doses").select("name"),
  ]);
  if (eps.error) throw eps.error;
  if (doses.error) throw doses.error;
  const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))].sort();
  return {
    triggers: uniq(eps.data.flatMap((r) => r.triggers)),
    medications: uniq(doses.data.map((r) => r.name)),
  };
}
