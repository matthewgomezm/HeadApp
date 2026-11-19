"use client";

import type { Episode } from "@/lib/episodes";
import { useNow } from "@/lib/use-now";
import { HomeScreen } from "./HomeScreen";

/** Renders HomeScreen with the device's clock; blank Dusk screen until hydrated. */
export function ClientHome({ name, episodes }: { name: string; episodes: Episode[] }) {
  const now = useNow();
  if (!now) return <main className="min-h-dvh" />;
  return <HomeScreen name={name} episodes={episodes} now={now} />;
}
