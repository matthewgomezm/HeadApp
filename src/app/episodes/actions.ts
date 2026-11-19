"use server";

import { revalidatePath } from "next/cache";
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

  const { data: saved, error } = v.id
    ? await supabase.from("episodes").upsert({ id: v.id, ...row }, { onConflict: "id" }).select("id").single()
    : await supabase.from("episodes").insert(row).select("id").single();
  if (error || !saved) return { ok: false, error: "Couldn't save. Check your connection and try again." };

  // Replace this episode's medications.
  const del = await supabase.from("medication_doses").delete().eq("episode_id", saved.id);
  if (del.error) return { ok: false, error: "Couldn't save medications. Try again." };
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

  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true, id: saved.id };
}

export async function deleteEpisode(id: string): Promise<SaveResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("episodes").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete. Try again." };
  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true, id };
}
