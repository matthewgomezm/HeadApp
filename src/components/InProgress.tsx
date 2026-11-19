import Link from "next/link";

type Props = { id: string; startedAt: Date; onEnd?: () => void };

export function InProgress({ id, startedAt, onEnd }: Props) {
  const time = startedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-lg text-dusk-accent">Migraine in progress since {time}</p>
      <button
        type="button"
        onClick={onEnd}
        className="mt-6 flex size-[150px] items-center justify-center rounded-full bg-dusk-fill text-[19px] font-semibold text-dusk-accent ring-[10px] ring-dusk-surface focus-visible:outline-2 focus-visible:outline-offset-[14px] focus-visible:outline-dusk-accent active:bg-dusk-surface"
      >
        It&apos;s over
      </button>
      <Link
        href={`/episodes/${id}`}
        className="mt-6 flex min-h-12 items-center px-4 text-dusk-muted underline underline-offset-4"
      >
        Add details
      </Link>
    </div>
  );
}
