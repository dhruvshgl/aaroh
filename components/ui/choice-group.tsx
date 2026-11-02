"use client";

import { cn } from "@/lib/utils";

/**
 * A segmented / chip-style radio group that submits with a native form.
 * Uses real radio inputs, so keyboard arrows and form data work without JS glue.
 */
export function ChoiceGroup({
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
  error,
  hint,
  required,
  columns,
  size = "md",
}: {
  name: string;
  label: string;
  options: readonly string[];
  value?: string;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  columns?: string;
  size?: "sm" | "md";
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  return (
    <fieldset aria-describedby={[error ? errorId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined}>
      <legend className="text-small font-medium">
        {label}
        {required ? null : <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </legend>
      {hint ? (
        <p id={hintId} className="mt-0.5 text-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <div className={cn("mt-2 flex flex-wrap gap-2", columns)}>
        {options.map((option) => {
          const id = `${name}-${option.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
          return (
            <label key={option} htmlFor={id} className="relative cursor-pointer">
              <input
                id={id}
                type="radio"
                name={name}
                value={option}
                className="peer sr-only"
                {...(value !== undefined ? { checked: value === option } : { defaultChecked: defaultValue === option })}
                onChange={(event) => onChange?.(event.target.value)}
                aria-invalid={error ? true : undefined}
              />
              <span
                className={cn(
                  "flex items-center justify-center rounded-full border border-border bg-card text-center transition-colors select-none",
                  "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
                  "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40 hover:border-primary/50",
                  size === "sm" ? "min-h-9 px-3 text-caption" : "min-h-11 px-4 text-small",
                  error ? "border-danger/60" : "",
                )}
              >
                {option}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-small text-danger-foreground">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
