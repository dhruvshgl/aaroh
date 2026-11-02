import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-xl bg-muted", className)} />;
}

export function PageSkeleton({ cards = 3, label = "Loading" }: { cards?: number; label?: string }) {
  return (
    <div className="mx-auto max-w-5xl" role="status" aria-live="polite">
      <span className="sr-only">{label}…</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-10 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="surface p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-8 w-28" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
      <div className="surface mt-4 p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-5/6" />
        <Skeleton className="mt-2 h-3 w-3/4" />
      </div>
    </div>
  );
}
