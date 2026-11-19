import { Skeleton } from "@/components/ui/skeleton";

/** Migraine details placeholder: back link, title and the first form sections. */
export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28"
    >
      <Skeleton className="mt-4 h-5 w-20" />
      <Skeleton className="mt-3 h-7 w-44" />
      <Skeleton className="mt-8 h-5 w-16" />
      <Skeleton className="mt-3 h-12 w-full rounded-xl" />
      <Skeleton className="mt-8 h-5 w-20" />
      <div className="mt-3 grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-8 h-5 w-16" />
      <Skeleton className="mt-3 h-24 w-full rounded-xl" />
    </main>
  );
}
