// Offline-safe queue for the one-tap log. Each tap is stored on the device
// first, then upserted by its client-generated id, so retries never duplicate.

export type EpisodePatch = {
  started_at?: string;
  ended_at?: string | null;
  peak_pain?: number | null;
};

export type QueuedOp = { id: string; patch: EpisodePatch };

export type Upsert = (row: { id: string } & EpisodePatch) => Promise<{ error: unknown }>;

const KEY = "mt.logQueue.v1";

function defaultStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

// When storage is unavailable (private mode), keep ops in memory for this session.
const memoryFallback: QueuedOp[] = [];

function read(storage: Storage | undefined): QueuedOp[] {
  if (!storage) return [...memoryFallback];
  try {
    const raw = storage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedOp[]) : [];
  } catch {
    return [...memoryFallback];
  }
}

function write(storage: Storage | undefined, ops: QueuedOp[]) {
  memoryFallback.splice(0, memoryFallback.length, ...ops);
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(ops));
  } catch {
    // ignore: memoryFallback holds it
  }
}

export function pending(storage: Storage | undefined = defaultStorage()): QueuedOp[] {
  return read(storage);
}

export function enqueue(op: QueuedOp, storage: Storage | undefined = defaultStorage()): void {
  const ops = read(storage);
  const existing = ops.find((o) => o.id === op.id);
  if (existing) existing.patch = { ...existing.patch, ...op.patch };
  else ops.push({ id: op.id, patch: { ...op.patch } });
  write(storage, ops);
}

/** Remove the fields we just sent, unless they changed while the request was in flight. */
function acknowledge(storage: Storage | undefined, sent: QueuedOp) {
  const ops = read(storage);
  const idx = ops.findIndex((o) => o.id === sent.id);
  if (idx === -1) return;
  const patch = { ...ops[idx].patch } as Record<string, unknown>;
  for (const [k, v] of Object.entries(sent.patch)) {
    if (patch[k] === v) delete patch[k];
  }
  if (Object.keys(patch).length === 0) ops.splice(idx, 1);
  else ops[idx] = { id: sent.id, patch: patch as EpisodePatch };
  write(storage, ops);
}

const inflight = new WeakMap<object, Promise<{ sent: number; failed: number }>>();
const NO_STORAGE = {};

export function flush(
  upsert: Upsert,
  storage: Storage | undefined = defaultStorage(),
): Promise<{ sent: number; failed: number }> {
  const key = storage ?? NO_STORAGE;
  const running = inflight.get(key);
  if (running) return running;

  const run = (async () => {
    let sent = 0;
    for (const op of read(storage)) {
      let ok = false;
      try {
        const { error } = await upsert({ id: op.id, ...op.patch });
        ok = !error;
      } catch {
        ok = false;
      }
      if (!ok) return { sent, failed: 1 };
      acknowledge(storage, op);
      sent++;
    }
    return { sent, failed: 0 };
  })().finally(() => inflight.delete(key));

  inflight.set(key, run);
  return run;
}

export function localOpenEpisode(
  storage: Storage | undefined = defaultStorage(),
): { id: string; startedAt: Date; peakPain: number | null } | null {
  const ops = read(storage);
  for (let i = ops.length - 1; i >= 0; i--) {
    const { id, patch } = ops[i];
    if (patch.started_at && !patch.ended_at) {
      return { id, startedAt: new Date(patch.started_at), peakPain: patch.peak_pain ?? null };
    }
  }
  return null;
}
