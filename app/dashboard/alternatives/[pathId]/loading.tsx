import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-24" />
      <div className="surface mt-4 p-8">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="mt-4 h-9 w-80 max-w-full" />
        <Skeleton className="mt-5 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-5/6" />
        <Skeleton className="mt-2 h-3 w-4/6" />
        <Skeleton className="mt-8 h-24 w-full" />
      </div>
    </div>
  );
}
