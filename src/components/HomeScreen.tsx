import {
  daysSinceLabel,
  formatDuration,
  formatTime,
  latestEpisode,
  openEpisode,
  type Episode,
} from "@/lib/episodes";
import { METRIC_SEGMENTS, migraineMetricData } from "@/lib/migraine-metrics";
import { EpisodeCard } from "./EpisodeCard";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import MetricCard from "./kokonutui/metric-card";
import { LogButton } from "./LogButton";

type Props = {
  name: string;
  episodes: Episode[];
  now: Date;
  onLog?: () => void;
};

export function HomeScreen({ name, episodes, now, onLog }: Props) {
  const latest = latestEpisode(episodes);
  const open = openEpisode(episodes);
  // While one is going, the card shows the migraine before it.
  const cardEpisode = latestEpisode(episodes.filter((e) => e.id !== open?.id));
  const today = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <Card className="mt-4 rounded-2xl border border-dusk-fill bg-dusk-surface ring-0">
        <CardHeader className="gap-1.5">
          <CardDescription className="text-sm text-dusk-muted">{today}</CardDescription>
          <CardTitle>
            <h1 className="text-[22px] font-semibold leading-tight text-dusk-text">Hi {name}</h1>
          </CardTitle>
          <CardDescription className="text-base text-dusk-text/80">
            {open
              ? "Migraine in progress"
              : daysSinceLabel(latest ? (latest.endedAt ?? latest.startedAt) : null, now)}
          </CardDescription>
        </CardHeader>
      </Card>

      {open ? (
        <p className="mt-8 text-center text-dusk-accent">
          {`Started ${formatTime(open.startedAt)} · ${formatDuration(open.startedAt, now)} so far`}
        </p>
      ) : null}
      <div className={open ? "mt-4 mb-4" : "mt-10 mb-4"}>
        <LogButton onLog={onLog} ongoing={open !== null} />
      </div>
      <p className="text-center text-sm text-dusk-muted">
        {open ? "The time is saved for you. Details can wait." : "Details can wait until you feel better"}
      </p>

      {cardEpisode && (
        <section aria-label="Most recent migraine" className="mt-8">
          <EpisodeCard episode={cardEpisode} href={`/episodes/${cardEpisode.id}`} />
        </section>
      )}

      <section aria-label="Migraine totals" data-testid="migraine-totals" className="mt-6">
        <MetricCard
          label="Migraines"
          segments={METRIC_SEGMENTS}
          data={migraineMetricData(episodes, now, 180)}
          events={[]}
          periods={[7, 30, 90]}
          defaultPeriod={30}
          format="number"
          upIsGood={false}
        />
      </section>
    </main>
  );
}
