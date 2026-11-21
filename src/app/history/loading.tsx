import { Skeleton } from "@/components/ui/skeleton";

/** History placeholder: title, button and a few migraine cards. */
export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="page max-w-md landscape:max-w-4xl"
    >
      <Skeleton className="mt-4 h-7 w-28" />
      <Skeleton className="mt-4 h-12 w-full rounded-xl" />
      <Skeleton className="mt-8 h-3 w-28" />
      <div className="mt-3 grid gap-3 landscape:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
