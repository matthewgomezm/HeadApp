"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { deserializeEpisode, type SerializedEpisode } from "@/lib/episode-rows";
import { makeUpsert } from "@/lib/episode-sync";
import { enqueue, flush, localOpenEpisode, pending, type Upsert } from "@/lib/log-queue";
import { createClient } from "@/lib/supabase/client";
import { useNow } from "@/lib/use-now";
import { HomeScreen, type OpenEpisode } from "./HomeScreen";
import { PainSheet } from "./PainSheet";

type Props = {
  name: string;
  initial: SerializedEpisode[];
  /** Injected in tests; defaults to the Supabase browser client. */
  upsert?: Upsert;
  storage?: Storage;
};

function resolveOpen(
  server: { id: string; startedAt: Date; endedAt: Date | null }[],
  storage: Storage | undefined,
): OpenEpisode | null {
  const local = localOpenEpisode(storage);
  if (local) return { id: local.id, startedAt: local.startedAt };
  const endedLocally = new Set(
    pending(storage)
      .filter((o) => o.patch.ended_at)
      .map((o) => o.id),
  );
  const srv = server.find((e) => e.endedAt === null && !endedLocally.has(e.id));
  return srv ? { id: srv.id, startedAt: srv.startedAt } : null;
}

export function LiveHome({ name, initial, upsert: injected, storage }: Props) {
  const router = useRouter();
  const now = useNow();
  const episodes = useMemo(() => initial.map(deserializeEpisode), [initial]);
  const upsert = useMemo(() => injected ?? makeUpsert(createClient()), [injected]);
  const [version, setVersion] = useState(0); // bump after queue changes
  const [painFor, setPainFor] = useState<string | null>(null);

  const sync = useCallback(async () => {
    const { sent } = await flush(upsert, storage);
    if (sent > 0) router.refresh();
  }, [upsert, storage, router]);

  useEffect(() => {
    void sync();
    const onOnline = () => void sync();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [sync]);

  // version is read so the open state recomputes after enqueue
  const open = useMemo(
    () => (version >= 0 ? resolveOpen(episodes, storage) : null),
    [episodes, storage, version],
  );

  function change() {
    setVersion((v) => v + 1);
    void sync();
  }

  function onLog() {
    // Read storage directly so a second tap before re-render is ignored.
    if (resolveOpen(episodes, storage)) return;
    const id = crypto.randomUUID();
    enqueue({ id, patch: { started_at: new Date().toISOString() } }, storage);
    setPainFor(id);
    change();
  }

  function onPick(n: number | null) {
    if (painFor && n !== null) enqueue({ id: painFor, patch: { peak_pain: n } }, storage);
    setPainFor(null);
    change();
  }

  function onEnd() {
    if (!open) return;
    enqueue({ id: open.id, patch: { ended_at: new Date().toISOString() } }, storage);
    change();
  }

  if (!now) return <main className="min-h-dvh" />;

  return (
    <>
      <HomeScreen
        name={name}
        episodes={episodes}
        now={now}
        openEpisode={open}
        onLog={onLog}
        onEnd={onEnd}
      />
      {painFor && <PainSheet onPick={(n) => onPick(n)} onSkip={() => onPick(null)} />}
    </>
  );
}
