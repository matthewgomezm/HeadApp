import { Skeleton } from "@/components/ui/skeleton";

/** Home placeholder while data streams in: same shapes as the real screen, nothing moves. */
export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28"
    >
      <Skeleton className="mt-4 h-4 w-24" />
      <Skeleton className="mt-2 h-7 w-32" />
      <Skeleton className="mt-2 h-5 w-56" />
      <Skeleton className="mx-auto mt-10 size-[170px] rounded-full" />
      <Skeleton className="mx-auto mt-4 h-4 w-60" />
      <Skeleton className="mt-8 h-24 w-full rounded-2xl" />
      <Skeleton className="mt-6 h-72 w-full rounded-3xl" />
    </main>
  );
}
