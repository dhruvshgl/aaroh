import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  href,
  help,
  children,
  footer,
  className,
}: {
  label: string;
  href?: string;
  help?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface relative flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-raised)]", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-small font-medium text-muted-foreground">{label}</p>
        <div className="flex items-center gap-1">
          {help}
          {href ? (
            <Link
              href={href}
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={`Open ${label}`}
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex-1">{children}</div>
      {footer ? <div className="mt-4 border-t border-border pt-3 text-small text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
