import { Skeleton } from "@/components/ui/skeleton";

/** History placeholder: title, button and a few migraine cards. */
export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28"
    >
      <Skeleton className="mt-4 h-7 w-28" />
      <Skeleton className="mt-4 h-12 w-full rounded-xl" />
      <Skeleton className="mt-8 h-3 w-28" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="mt-3 h-20 w-full rounded-2xl" />
      ))}
    </main>
  );
}
