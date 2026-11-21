import { expect, test } from "vitest";
import { DEFAULT_TRIGGERS } from "@/lib/episode-form";
import { ADVICE_TOPICS, ALLOWED_SOURCES, orderTopics } from "./reduce-migraines";

test("only the three pages we read are cited", () => {
  expect(ALLOWED_SOURCES).toEqual([
    "https://www.nhs.uk/conditions/migraine/",
    "https://americanmigrainefoundation.org/resource-library/top-10-migraine-triggers/",
    "https://americanmigrainefoundation.org/resource-library/lifestyle-changes-for-migraine/",
  ]);
});

test("every topic has 2–4 tips and at least one allowed source", () => {
  expect(ADVICE_TOPICS.map((t) => t.id)).toEqual([
    "sleep",
    "stress",
    "meals",
    "hydration",
    "caffeine",
    "alcohol",
    "weather",
    "cycle",
    "light",
    "smells",
    "food",
    "exercise",
    "diary",
    "see-a-doctor",
  ]);
  for (const t of ADVICE_TOPICS) {
    expect(t.tips.length, t.id).toBeGreaterThanOrEqual(2);
    expect(t.tips.length, t.id).toBeLessThanOrEqual(t.id === "see-a-doctor" ? 6 : 4);
    expect(t.sources.length, t.id).toBeGreaterThan(0);
    for (const s of t.sources) expect(ALLOWED_SOURCES, t.id).toContain(s.url);
  }
});

test("each trigger she can pick maps to a topic", () => {
  const covered = new Set(ADVICE_TOPICS.flatMap((t) => t.triggers));
  for (const trig of DEFAULT_TRIGGERS) expect(covered, trig).toContain(trig);
});

test("'see a doctor' covers the urgent warning signs", () => {
  const doc = ADVICE_TOPICS.find((t) => t.id === "see-a-doctor")!;
  const text = doc.tips.join(" ").toLowerCase();
  for (const sign of ["sudden", "speaking", "vision", "weakness", "numbness", "arm", "stiff neck", "rash", "seizure", "72 hours"]) {
    expect(text).toContain(sign);
  }
});

test("her triggers come first (most frequent first); 'see a doctor' is always last", () => {
  const ordered = orderTopics(ADVICE_TOPICS, ["stress", "poor sleep"]);
  expect(ordered.slice(0, 2).map((o) => [o.topic.id, o.mine])).toEqual([
    ["stress", true],
    ["sleep", true],
  ]);
  expect(ordered[2].mine).toBe(false);
  expect(ordered.at(-1)!.topic.id).toBe("see-a-doctor");
});

test("no triggers logged → original order", () => {
  expect(orderTopics(ADVICE_TOPICS, []).map((o) => o.topic.id)).toEqual(ADVICE_TOPICS.map((t) => t.id));
});
