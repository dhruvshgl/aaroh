import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl" role="status" aria-live="polite">
      <span className="sr-only">Loading paths…</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-10 w-80 max-w-full" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="surface p-5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-4 h-7 w-48" />
            <Skeleton className="mt-3 h-2 w-full rounded-full" />
            <Skeleton className="mt-4 h-3 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
