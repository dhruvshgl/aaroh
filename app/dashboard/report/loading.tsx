import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl" role="status" aria-live="polite">
      <span className="sr-only">Loading your report…</span>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-10 w-80 max-w-full" />
      <div className="surface mt-6 grid gap-6 p-7 lg:grid-cols-[auto_1fr]">
        <Skeleton className="mx-auto size-44 rounded-full" />
        <div>
          <Skeleton className="h-6 w-64 max-w-full" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
          <Skeleton className="mt-6 h-3 w-full rounded-full" />
        </div>
      </div>
      <Skeleton className="mt-6 h-12 w-full rounded-full" />
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="surface p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
