"use client";

import { useMemo, type ReactNode } from "react";
import { ADVICE_TOPICS, orderTopics } from "@/content/reduce-migraines";
import { deserializeEpisode, type SerializedEpisode } from "@/lib/episode-rows";
import { formatDuration } from "@/lib/episodes";
import { INSIGHTS_WINDOW_DAYS, medicationResults, patternSummary, triggerCounts } from "@/lib/insights";
import { useNow } from "@/lib/use-now";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

const cardClass = "rounded-2xl border border-dusk-fill bg-dusk-surface ring-0";

function Section({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  const id = `insights-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={id} className={`mt-4 ${className}`}>
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle>
            <h2 id={id} className="text-lg font-semibold text-dusk-accent">
              {title}
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-base text-dusk-text">{children}</CardContent>
      </Card>
    </section>
  );
}

function helpedText(r: { helped: number; somewhat: number; no: number }) {
  return `helped ${r.helped} · a little ${r.somewhat} · didn't ${r.no}`;
}

export function InsightsView({ initial }: { initial: SerializedEpisode[] }) {
  const episodes = useMemo(() => initial.map(deserializeEpisode), [initial]);
  const now = useNow(); // times of day and weekdays in her timezone → device only
  if (!now) return <main className="page min-h-dvh" />;

  const p = patternSummary(episodes, now);
  const triggers = triggerCounts(episodes, now);
  const meds = medicationResults(episodes, now);
  const topics = orderTopics(
    ADVICE_TOPICS,
    triggers.map((t) => t.name),
  );

  return (
    <main className="page max-w-md landscape:grid landscape:max-w-4xl landscape:grid-cols-2 landscape:items-start landscape:gap-x-8">
      <div>
        <h1 className="mt-4 text-[22px] font-semibold">Insights</h1>

        <Section title="Your patterns">
          {p.enough ? (
            <ul className="space-y-1.5">
              <li>{`${p.count} migraines in the last ${INSIGHTS_WINDOW_DAYS} days`}</li>
              {p.avgDurationMin !== null && (
                <li>{`Average length ${formatDuration(new Date(0), new Date(p.avgDurationMin * 60_000))}`}</li>
              )}
              {p.avgPain !== null && <li>{`Average pain ${p.avgPain}/10`}</li>}
              {p.timeOfDay && <li>{`Most often in the ${p.timeOfDay === "night" ? "night" : p.timeOfDay}${p.weekday ? `, on ${p.weekday}s` : ""}`}</li>}
            </ul>
          ) : (
            <>
              <p className="font-semibold">Not enough data yet</p>
              <p className="mt-1 text-sm text-dusk-muted">
                Patterns show up after 3 migraines in the last {INSIGHTS_WINDOW_DAYS} days ({p.count} so far).
              </p>
            </>
          )}
        </Section>

        <Section title="What you've logged">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-dusk-muted">Possible triggers</h3>
          {triggers.length ? (
            <ul className="mt-2 space-y-3">
              {triggers.map((t) => (
                <li key={t.name}>
                  <div className="flex justify-between gap-3">
                    <span className="break-words">{t.name}</span>
                    <span className="shrink-0 text-sm text-dusk-muted">{`in ${t.count} of ${t.total} migraines`}</span>
                  </div>
                  <Progress value={(t.count / t.total) * 100} aria-label={`${t.name}: ${t.count} of ${t.total}`} className="mt-1.5" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-dusk-muted">No triggers logged yet</p>
          )}
          <p className="mt-2 text-xs text-dusk-muted">How often each was ticked, not proof it causes them.</p>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-dusk-muted">Medications</h3>
          {meds.length ? (
            <ul className="mt-2 space-y-3">
              {meds.map((m) => (
                <li key={m.name}>
                  <div className="flex justify-between gap-3">
                    <span className="break-words">{m.name}</span>
                    <span className="shrink-0 text-sm text-dusk-muted">{helpedText(m)}</span>
                  </div>
                  <Progress value={m.score * 100} aria-label={`${m.name}: helped score ${Math.round(m.score * 100)}%`} className="mt-1.5" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-dusk-muted">No medications logged yet</p>
          )}
        </Section>
      </div>

      <div className="landscape:mt-[3.25rem]">
        <Section title="Ways to reduce migraines">
          <p className="text-sm text-dusk-muted">General information, not medical advice.</p>
          <Accordion type="multiple" className="mt-2" data-print="screen-only">
            {topics.map(({ topic, mine }) => (
              <AccordionItem key={topic.id} value={topic.id} className="border-dusk-fill">
                <AccordionTrigger className="min-h-12 items-center text-base text-dusk-text hover:no-underline">
                  <span className="flex items-center gap-2">
                    {topic.title}
                    {mine && (
                      <Badge className="bg-dusk-fill text-dusk-accent">Your trigger</Badge>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-base text-dusk-text/90">
                  <ul className="list-disc space-y-1.5 pl-5">
                    {topic.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-dusk-muted">
                    Source:{" "}
                    {topic.sources.map((s, i) => (
                      <span key={s.url}>
                        {i > 0 && ", "}
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-dusk-accent">
                          {`${s.name}: ${s.page}`}
                        </a>
                      </span>
                    ))}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {/* Closed accordion items aren't in the page, so printing uses this copy. */}
          <div data-print="only" className="hidden">
            {topics.map(({ topic }) => (
              <div key={topic.id} className="mt-3 break-inside-avoid">
                <h3 className="font-semibold">{topic.title}</h3>
                <ul className="list-disc pl-5">
                  {topic.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
                <p className="text-sm">Source: {topic.sources.map((s) => `${s.name} (${s.url})`).join("; ")}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
