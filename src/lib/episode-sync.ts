import type { SupabaseClient } from "@supabase/supabase-js";
import type { Upsert } from "./log-queue";
import type { Database } from "./supabase/database.types";

/**
 * Sends one queued patch. A patch that carries started_at is upserted by id
 * (idempotent create). A patch without it must be an UPDATE: Postgres checks
 * NOT NULL on the proposed insert row before resolving ON CONFLICT, so a
 * partial upsert would fail even though the row exists.
 */
export function makeUpsert(client: SupabaseClient<Database>): Upsert {
  return async ({ id, ...patch }) => {
    if (patch.started_at) {
      const { error } = await client
        .from("episodes")
        .upsert({ id, ...patch, started_at: patch.started_at }, { onConflict: "id" });
      return { error };
    }
    const { error } = await client.from("episodes").update(patch).eq("id", id);
    return { error };
  };
}
