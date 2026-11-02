import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl" role="status" aria-live="polite">
      <span className="sr-only">Loading your roadmap…</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-10 w-72 max-w-full" />
      <Skeleton className="surface mt-6 h-20 w-full" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-16 flex-1" />
            </div>
          ))}
        </div>
        <div className="surface p-7">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-64 max-w-full" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
          <Skeleton className="mt-6 h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
