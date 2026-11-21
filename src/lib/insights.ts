import type { Episode } from "./episodes";

export const INSIGHTS_WINDOW_DAYS = 90;
export const MIN_EPISODES = 3;

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** Ties go to the earliest day of a Monday-first week. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const TIME_ORDER: TimeOfDay[] = ["morning", "afternoon", "evening", "night"];

/** Local time of day: morning 5–12, afternoon 12–17, evening 17–21, night 21–5. */
export function timeOfDay(d: Date): TimeOfDay {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

/** Migraines that started within the last 90 local calendar days. */
export function inWindow(episodes: Episode[], now: Date): Episode[] {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (INSIGHTS_WINDOW_DAYS - 1));
  return episodes.filter((e) => e.startedAt >= from && e.startedAt <= now);
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function mode<T>(values: T[], order: T[]): T | null {
  if (!values.length) return null;
  let best: T | null = null;
  let bestCount = 0;
  for (const v of order) {
    const c = values.filter((x) => x === v).length;
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

export function patternSummary(episodes: Episode[], now: Date) {
  const list = inWindow(episodes, now);
  const durations = list
    .filter((e) => e.endedAt)
    .map((e) => (e.endedAt!.getTime() - e.startedAt.getTime()) / 60_000);
  const pains = list.filter((e) => e.peakPain !== null).map((e) => e.peakPain!);
  const avgDuration = mean(durations);
  const avgPain = mean(pains);
  const weekday = mode(
    list.map((e) => e.startedAt.getDay()),
    WEEK_ORDER,
  );
  return {
    count: list.length,
    enough: list.length >= MIN_EPISODES,
    avgDurationMin: avgDuration === null ? null : Math.round(avgDuration),
    avgPain: avgPain === null ? null : Math.round(avgPain * 10) / 10,
    timeOfDay: mode(list.map((e) => timeOfDay(e.startedAt)), TIME_ORDER),
    weekday: weekday === null ? null : WEEKDAYS[weekday],
  };
}

export function triggerCounts(episodes: Episode[], now: Date, limit = 6) {
  const list = inWindow(episodes, now);
  const counts = new Map<string, number>();
  for (const e of list) for (const t of new Set(e.triggers)) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .map(([name, count]) => ({ name, count, total: list.length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function medicationResults(episodes: Episode[], now: Date, limit = 6) {
  const by = new Map<string, { helped: number; somewhat: number; no: number }>();
  for (const e of inWindow(episodes, now)) {
    for (const m of e.medications) {
      const r = by.get(m.name) ?? { helped: 0, somewhat: 0, no: 0 };
      if (m.helped === "yes") r.helped++;
      else if (m.helped === "somewhat") r.somewhat++;
      else if (m.helped === "no") r.no++;
      by.set(m.name, r);
    }
  }
  return [...by]
    .map(([name, r]) => {
      const rated = r.helped + r.somewhat + r.no;
      return { name, ...r, rated, score: rated ? (r.helped + r.somewhat * 0.5) / rated : 0 };
    })
    .sort((a, b) => b.rated - a.rated || a.name.localeCompare(b.name))
    .slice(0, limit);
}
