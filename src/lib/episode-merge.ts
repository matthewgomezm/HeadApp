import type { Episode } from "./episodes";
import { pending } from "./log-queue";

/**
 * Server episodes with this device's not-yet-synced taps applied on top:
 * new migraines (a start) are added, and a queued end time or pain level on
 * an already-saved migraine shows straight away.
 */
export function mergeQueued(server: Episode[], storage?: Storage): Episode[] {
  const ops = pending(storage);
  if (ops.length === 0) return server;
  const byId = new Map(ops.map((o) => [o.id, o.patch]));
  const known = new Set(server.map((e) => e.id));

  const overlaid = server.map((e) => {
    const p = byId.get(e.id);
    if (!p) return e;
    return {
      ...e,
      ...(p.started_at ? { startedAt: new Date(p.started_at) } : {}),
      ...(p.ended_at !== undefined ? { endedAt: p.ended_at ? new Date(p.ended_at) : null } : {}),
      ...(p.peak_pain !== undefined ? { peakPain: p.peak_pain } : {}),
    };
  });

  const added: Episode[] = ops
    .filter((o) => o.patch.started_at && !known.has(o.id))
    .map((o) => ({
      id: o.id,
      startedAt: new Date(o.patch.started_at!),
      endedAt: o.patch.ended_at ? new Date(o.patch.ended_at) : null,
      peakPain: o.patch.peak_pain ?? null,
      locations: [],
      symptoms: [],
      triggers: [],
      notes: "",
      medications: [],
    }))
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

  return [...added, ...overlaid];
}
