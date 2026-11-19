import { z } from "zod";

export const DEFAULT_TRIGGERS = [
  "poor sleep",
  "stress",
  "skipped meal",
  "dehydration",
  "caffeine",
  "alcohol",
  "weather change",
  "period/cycle",
  "screen time",
  "strong smell",
  "bright light",
  "specific food",
  "exercise",
] as const;

export const LOCATIONS = [
  "left side",
  "right side",
  "both sides",
  "behind eyes",
  "back of head",
  "forehead",
] as const;

export const SYMPTOMS = [
  "aura",
  "nausea",
  "vomiting",
  "light sensitivity",
  "sound sensitivity",
  "smell sensitivity",
  "dizziness",
] as const;

const FUTURE_SLACK_MS = 5 * 60_000;

const label = z.string().trim().max(60);

/** Trim, drop blanks, dedupe (first occurrence wins). */
const labelList = z
  .array(label)
  .max(50)
  .transform((xs) => [...new Set(xs.filter((x) => x.length > 0))]);

const isoDate = z.iso.datetime({ offset: true });

export function episodeInputSchema(now: Date = new Date()) {
  return z
    .object({
      id: z.uuid().optional(),
      startedAt: isoDate,
      endedAt: isoDate.nullable(),
      peakPain: z.int().min(1).max(10).nullable(),
      locations: labelList,
      symptoms: labelList,
      triggers: labelList,
      notes: z.string().max(2000),
      medications: z
        .array(
          z.object({
            name: z.string().trim().min(1, "Medication needs a name").max(60),
            takenAt: isoDate.nullable(),
            helped: z.enum(["yes", "somewhat", "no", "unknown"]),
          }),
        )
        .max(10),
    })
    .refine((v) => new Date(v.startedAt).getTime() <= now.getTime() + FUTURE_SLACK_MS, {
      message: "Start time can't be in the future",
      path: ["startedAt"],
    })
    .refine((v) => v.endedAt === null || new Date(v.endedAt) >= new Date(v.startedAt), {
      message: "End time must be after the start",
      path: ["endedAt"],
    });
}

export type EpisodeInput = z.input<ReturnType<typeof episodeInputSchema>>;
export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

const pad = (n: number) => String(n).padStart(2, "0");

/** Date → value for <input type="datetime-local"> in the device's timezone. */
export function toLocalInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value → Date, interpreted in the device's timezone. */
export function fromLocalInputValue(s: string): Date {
  const [date, time] = s.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}
