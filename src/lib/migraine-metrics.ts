import type { MetricPoint } from "@/components/kokonutui/metric-card";
import type { Episode } from "./episodes";

/** Breakdown buckets for the Home totals card, most severe first. */
export const METRIC_SEGMENTS = ["Severe (7–10)", "Moderate (4–6)", "Mild (1–3)", "Not rated"];

function bucket(pain: number | null): number {
  if (pain === null) return 3;
  if (pain >= 7) return 0;
  if (pain >= 4) return 1;
  return 2;
}

const pad = (n: number) => String(n).padStart(2, "0");
const localKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * One point per local calendar day for the last `days` days (oldest first,
 * ending today), counting migraines per severity bucket. The metric card needs
 * twice its longest period so every period has one to compare with.
 */
export function migraineMetricData(episodes: Episode[], now: Date, days = 180): MetricPoint[] {
  const points: MetricPoint[] = [];
  const index = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    index.set(localKey(d), points.length);
    points.push({ date: localKey(d), parts: [0, 0, 0, 0] });
  }
  for (const e of episodes) {
    const at = index.get(localKey(e.startedAt));
    if (at !== undefined) points[at].parts[bucket(e.peakPain)] += 1;
  }
  return points;
}
