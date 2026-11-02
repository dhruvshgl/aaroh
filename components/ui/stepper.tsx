import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({
  steps,
  current,
  furthest,
  onSelect,
}: {
  steps: { key: string; label: string }[];
  current: number;
  furthest: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, index) => {
        const done = !(index === current) && index < Math.max(current, furthest);
        const active = index === current;
        const clickable = Boolean(onSelect) && index <= furthest && !active;
        const content = (
          <>
            <span className={cn("block h-1.5 rounded-full transition-colors", index <= current ? "bg-primary" : index <= furthest ? "bg-primary/40" : "bg-muted")} />
            <span className={cn("mt-2 flex items-center justify-center gap-1 text-caption", active ? "font-semibold text-primary" : done ? "text-foreground" : "text-muted-foreground")}>
              {done && !active ? <Check className="size-3" aria-hidden="true" /> : null}
              {step.label}
            </span>
          </>
        );
        return (
          <li key={step.key}>
            {clickable ? (
              <button
                type="button"
                onClick={() => onSelect?.(index)}
                className="block min-h-11 w-full rounded-lg pt-1 text-center hover:opacity-80"
                aria-label={`Go back to ${step.label}`}
              >
                {content}
              </button>
            ) : (
              <div className="min-h-11 pt-1 text-center" aria-current={active ? "step" : undefined}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
