"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { episodeInputSchema, type SaveResult } from "@/lib/episode-form";
import { createClient } from "@/lib/supabase/server";

export async function saveEpisode(raw: unknown): Promise<SaveResult> {
  const parsed = episodeInputSchema().safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { ok: false, error: "You've been signed out. Sign in again." };

  const row = {
    started_at: v.startedAt,
    ended_at: v.endedAt,
    peak_pain: v.peakPain,
    locations: v.locations,
    symptoms: v.symptoms,
    triggers: v.triggers,
    notes: v.notes,
  };

  // Upsert by the id the device assigned, so a retried save never duplicates.
  const { data: saved, error } = await supabase
    .from("episodes")
    .upsert({ id: v.id, ...row }, { onConflict: "id" })
    .select("id")
    .single();
  if (error || !saved) return { ok: false, error: "Couldn't save. Check your connection and try again." };

  // Replace medications without a window where they're lost: remember the old
  // rows, insert the new list, and only then delete the old rows. If the insert
  // fails, the old list is untouched; if the delete fails, the next save cleans up.
  const old = await supabase.from("medication_doses").select("id").eq("episode_id", saved.id);
  if (old.error) return { ok: false, error: "Couldn't save medications. Try again." };
  if (v.medications.length > 0) {
    const ins = await supabase.from("medication_doses").insert(
      v.medications.map((m) => ({
        episode_id: saved.id,
        name: m.name,
        taken_at: m.takenAt,
        helped: m.helped,
      })),
    );
    if (ins.error) return { ok: false, error: "Couldn't save medications. Try again." };
  }
  const oldIds = old.data.map((d) => d.id);
  if (oldIds.length > 0) {
    const del = await supabase.from("medication_doses").delete().in("id", oldIds);
    if (del.error) return { ok: false, error: "Saved, but couldn't tidy old medications. Save again." };
  }

  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true, id: saved.id };
}

export async function deleteEpisode(id: string): Promise<SaveResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Couldn't delete. Try again." };
  const supabase = await createClient();
  const { error } = await supabase.from("episodes").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete. Try again." };
  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true, id };
}

/** Delete several migraines at once (History → Select). RLS limits it to her own rows. */
export async function deleteEpisodes(
  ids: string[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const parsed = z.array(z.uuid()).max(1000).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "Couldn't delete. Try again." };
  if (parsed.data.length === 0) return { ok: true, count: 0 };
  const supabase = await createClient();
  const { error } = await supabase.from("episodes").delete().in("id", parsed.data);
  if (error) return { ok: false, error: "Couldn't delete. Try again." };
  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true, count: parsed.data.length };
}
