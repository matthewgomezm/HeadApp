import { Skeleton } from "@/components/ui/skeleton";

/** Home placeholder while data streams in: same shapes as the real screen, nothing moves. */
export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="page max-w-md landscape:grid landscape:max-w-4xl landscape:grid-cols-2 landscape:items-start landscape:gap-x-8"
    >
      <div>
        <div className="mt-4 rounded-2xl border border-dusk-fill bg-dusk-surface p-4">
          <Skeleton className="h-4 w-24 bg-dusk-fill" />
          <Skeleton className="mt-2 h-7 w-32 bg-dusk-fill" />
          <Skeleton className="mt-2 h-5 w-56 bg-dusk-fill" />
        </div>
        <Skeleton className="mx-auto mt-10 size-[170px] rounded-full short:mt-5 short:size-[130px]" />
        <Skeleton className="mx-auto mt-4 h-4 w-60" />
      </div>
      <div>
        <Skeleton className="mt-8 h-24 w-full rounded-2xl landscape:mt-4" />
        <Skeleton className="mt-6 h-72 w-full rounded-3xl" />
      </div>
    </main>
  );
}
