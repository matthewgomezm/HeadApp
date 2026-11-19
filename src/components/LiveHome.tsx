"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deserializeEpisode, type SerializedEpisode } from "@/lib/episode-rows";
import type { Episode } from "@/lib/episodes";
import { lazyBrowserUpsert } from "@/lib/episode-sync";
import { enqueue, flush, localEpisodes, type Upsert } from "@/lib/log-queue";
import { useNow } from "@/lib/use-now";
import { HomeScreen } from "./HomeScreen";
import { PainSheet } from "./PainSheet";

type Props = {
  name: string;
  initial: SerializedEpisode[];
  /** Injected in tests; defaults to the Supabase browser client. */
  upsert?: Upsert;
  storage?: Storage;
};

/** Server episodes plus taps still waiting on this device (so a fresh tap shows immediately). */
function mergeLocal(server: Episode[], storage: Storage | undefined): Episode[] {
  const known = new Set(server.map((e) => e.id));
  const local = localEpisodes(storage)
    .filter((l) => !known.has(l.id))
    .map<Episode>((l) => ({
      id: l.id,
      startedAt: l.startedAt,
      peakPain: l.peakPain,
      locations: [],
      symptoms: [],
      triggers: [],
      notes: "",
      medications: [],
    }));
  return [...local, ...server];
}

export function LiveHome({ name, initial, upsert: injected, storage }: Props) {
  const router = useRouter();
  const now = useNow();
  const server = useMemo(() => initial.map(deserializeEpisode), [initial]);
  const upsert = injected ?? lazyBrowserUpsert;
  const [version, setVersion] = useState(0); // bump after queue changes
  const [painFor, setPainFor] = useState<string | null>(null);
  const logging = useRef(false); // blocks a second tap landing in the same instant

  const sync = useCallback(async () => {
    const { sent } = await flush(upsert, storage);
    if (sent > 0) router.refresh();
  }, [upsert, storage, router]);

  useEffect(() => {
    void sync();
    const onOnline = () => void sync();
    // iOS resumes a home-screen app from the background instead of reloading it.
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sync]);

  // version is read so the list recomputes after enqueue
  const episodes = useMemo(
    () => (version >= 0 ? mergeLocal(server, storage) : server),
    [server, storage, version],
  );

  function change() {
    setVersion((v) => v + 1);
    void sync();
  }

  function onLog() {
    if (logging.current) return;
    logging.current = true;
    const id = crypto.randomUUID();
    enqueue({ id, patch: { started_at: new Date().toISOString() } }, storage);
    setPainFor(id);
    change();
  }

  function onPick(n: number | null) {
    if (painFor && n !== null) enqueue({ id: painFor, patch: { peak_pain: n } }, storage);
    setPainFor(null);
    logging.current = false;
    change();
  }

  if (!now) return <main className="min-h-dvh" />;

  return (
    <>
      <HomeScreen name={name} episodes={episodes} now={now} onLog={onLog} />
      {painFor && <PainSheet onPick={(n) => onPick(n)} onSkip={() => onPick(null)} />}
    </>
  );
}
