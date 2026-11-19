export type Helped = "yes" | "somewhat" | "no" | "unknown";

export type Episode = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  peakPain: number | null;
  triggers: string[];
  medications: { name: string; helped: Helped }[];
};

const DAY_MS = 86_400_000;

function localMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Calendar days between two dates in local time (DST-safe via rounding). */
function calendarDaysBetween(a: Date, b: Date): number {
  return Math.round((localMidnight(b).getTime() - localMidnight(a).getTime()) / DAY_MS);
}

export function daysSinceLabel(last: Date | null, now: Date): string {
  if (!last) return "No migraines logged yet";
  const days = calendarDaysBetween(last, now);
  if (days <= 0) return "Your last migraine was today";
  return `${days} ${days === 1 ? "day" : "days"} since your last migraine`;
}

export function formatDuration(startedAt: Date, endedAt: Date | null): string {
  if (!endedAt) return "In progress";
  const totalMin = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function episodeHeadline(e: Episode): string {
  const date = e.startedAt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return e.peakPain == null ? date : `${date} · ${e.peakPain}/10`;
}

const HELPED_TEXT: Record<Helped, string> = {
  yes: " helped",
  somewhat: " helped a little",
  no: " didn't help",
  unknown: "",
};

export function episodeSubline(e: Episode): string {
  const parts = [formatDuration(e.startedAt, e.endedAt)];
  const med = e.medications[0];
  if (med) parts.push(`${med.name}${HELPED_TEXT[med.helped]}`);
  return parts.join(" · ");
}

export function latestEpisode(list: Episode[]): Episode | null {
  return list.reduce<Episode | null>(
    (best, e) => (!best || e.startedAt > best.startedAt ? e : best),
    null,
  );
}
