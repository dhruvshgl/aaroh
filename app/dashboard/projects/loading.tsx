import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl" role="status" aria-live="polite">
      <span className="sr-only">Loading projects…</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-10 w-72 max-w-full" />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((column) => (
          <div key={column} className="space-y-3">
            <Skeleton className="h-5 w-32" />
            {[0, 1].map((card) => (
              <div key={card} className="surface p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-2/3" />
                <Skeleton className="mt-4 h-9 w-full rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
