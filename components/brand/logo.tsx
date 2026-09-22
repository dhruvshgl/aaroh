import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  light = false,
  compact = false,
  href = "/",
}: {
  className?: string;
  light?: boolean;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("grid size-9 place-items-center rounded-xl", light ? "bg-white/10" : "bg-primary")}>
        <svg viewBox="0 0 32 32" className="size-5" aria-hidden="true">
          <path d="M4 24 L16 6 L28 24 Z" fill={light ? "#f6f1e6" : "#f6f1e6"} />
          <path d="M10 24 L16 14 L22 24 Z" fill={light ? "#1b3a2f" : "#c4a574"} />
        </svg>
      </span>
      <span className="leading-tight">
        <span className={cn("block font-serif text-xl tracking-tight", light ? "text-white" : "text-foreground")}>
          Aaroh
        </span>
        {compact ? null : (
          <span className={cn("block text-[11px] tracking-wide", light ? "text-white/70" : "text-muted-foreground")}>
            AI Career Consultant
          </span>
        )}
      </span>
    </Link>
  );
}
