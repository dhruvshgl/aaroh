import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl" role="status" aria-live="polite">
      <span className="sr-only">Loading settings…</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-10 w-80 max-w-full" />
      {[0, 1, 2].map((item) => (
        <div key={item} className="surface mt-4 grid gap-6 p-7 md:grid-cols-[220px_1fr]">
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-3 w-40" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
