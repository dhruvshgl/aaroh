import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
  tone = "primary",
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
  tone?: "primary" | "gold" | "success";
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full origin-left rounded-full",
          tone === "gold" ? "bg-gold" : tone === "success" ? "bg-success" : "bg-primary",
        )}
        style={{ width: `${pct}%`, animation: "bar-fill 700ms cubic-bezier(0.2,0.7,0.2,1) both" }}
      />
    </div>
  );
}
