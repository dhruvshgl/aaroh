import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="surface flex h-full min-h-[50dvh] flex-col items-center justify-center p-8" role="status" aria-live="polite">
      <span className="sr-only">Loading conversation…</span>
      <Skeleton className="size-14 rounded-full" />
      <Skeleton className="mt-4 h-7 w-48" />
      <Skeleton className="mt-3 h-3 w-64 max-w-full" />
    </div>
  );
}
