import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface flex animate-fade-up flex-col items-center px-6 py-12 text-center", className)}>
      <span className="relative grid size-16 place-items-center">
        <svg viewBox="0 0 64 64" className="absolute inset-0 size-16" aria-hidden="true">
          <circle cx="32" cy="32" r="32" fill="var(--secondary)" />
          <path d="M10 46 L26 26 L34 36 L42 24 L56 46 Z" fill="var(--sand-soft)" />
        </svg>
        <Icon className="relative size-6 text-primary" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-h2">{title}</h2>
      <p className="mt-2 max-w-sm text-small text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
