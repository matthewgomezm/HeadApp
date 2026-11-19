"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deserializeEpisode, type SerializedEpisode } from "@/lib/episode-rows";
import { mergeQueued } from "@/lib/episode-merge";
import { formatDuration, formatTime, openEpisode } from "@/lib/episodes";
import { lazyBrowserUpsert } from "@/lib/episode-sync";
import { enqueue, flush, type Upsert } from "@/lib/log-queue";
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

export function LiveHome({ name, initial, upsert: injected, storage }: Props) {
  const router = useRouter();
  const now = useNow();
  const server = useMemo(() => initial.map(deserializeEpisode), [initial]);
  const upsert = injected ?? lazyBrowserUpsert;
  const [version, setVersion] = useState(0); // bump after queue changes
  const [painFor, setPainFor] = useState<string | null>(null);
  // Brief "Logged 10:38 PM" / "Ended · 3h 05m" confirmation after the big button.
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Start time of the tap waiting on the pain screen, for its confirmation.
  const startedAt = useRef<Date | null>(null);
  const logging = useRef(false); // blocks a second tap landing in the same instant
  // Time of the last "It's over" tap, to absorb a double tap.
  const lastToggle = useRef(0);

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
    () => (version >= 0 ? mergeQueued(server, storage) : server),
    [server, storage, version],
  );

  function confirm(message: string) {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmation(message);
    confirmTimer.current = setTimeout(() => setConfirmation(null), 1800);
  }

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );

  function change() {
    setVersion((v) => v + 1);
    void sync();
  }

  function onLog() {
    if (logging.current || Date.now() - lastToggle.current < 1000) return;
    // Read storage directly so the decision uses taps not yet re-rendered.
    const current = openEpisode(mergeQueued(server, storage));
    if (current) {
      // Second press: it's over. The duration is start → now. Guard the next
      // second so a double tap can't land on the fresh "I have a migraine".
      // (After a start, the pain screen already covers the button.)
      lastToggle.current = Date.now();
      const endedAt = new Date();
      enqueue({ id: current.id, patch: { ended_at: endedAt.toISOString() } }, storage);
      confirm(`Ended · ${formatDuration(current.startedAt, endedAt)}`);
      change();
      return;
    }
    logging.current = true;
    const id = crypto.randomUUID();
    startedAt.current = new Date();
    enqueue({ id, patch: { started_at: startedAt.current.toISOString() } }, storage);
    setPainFor(id);
    change();
  }

  function onPick(n: number | null) {
    if (painFor && n !== null) enqueue({ id: painFor, patch: { peak_pain: n } }, storage);
    setPainFor(null);
    logging.current = false;
    // Shown once the pain screen is gone, so she actually sees it.
    if (startedAt.current) confirm(`Logged ${formatTime(startedAt.current)}`);
    startedAt.current = null;
    change();
  }

  if (!now) return <main className="min-h-dvh" />;

  return (
    <>
      <HomeScreen name={name} episodes={episodes} now={now} onLog={onLog} confirmation={confirmation} />
      {painFor && <PainSheet onPick={(n) => onPick(n)} onSkip={() => onPick(null)} />}
    </>
  );
}
