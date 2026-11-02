"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Chip input: type and press Enter or comma to add, click × to remove.
 * Submits as a comma-separated hidden field so server actions stay unchanged.
 */
export function TagInput({
  name,
  label,
  value,
  onChange,
  suggestions = [],
  placeholder,
  error,
  hint,
  required,
  max = 24,
}: {
  name: string;
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: readonly string[];
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  max?: number;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const lower = value.map((item) => item.toLowerCase());

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const part of parts) {
      if (next.length >= max) break;
      if (!next.some((item) => item.toLowerCase() === part.toLowerCase())) next.push(part.slice(0, 60));
    }
    onChange(next);
    setDraft("");
  }

  function remove(item: string) {
    onChange(value.filter((entry) => entry !== item));
  }

  const open = suggestions.filter((item) => !lower.includes(item.toLowerCase()));

  return (
    <div>
      <label htmlFor={id} className="text-small font-medium">
        {label}
        {required ? null : <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </label>
      {hint ? <p className="mt-0.5 text-caption text-muted-foreground">{hint}</p> : null}
      <input type="hidden" name={name} value={value.join(", ")} />
      <div
        className={cn(
          "mt-1.5 flex min-h-11 flex-wrap items-center gap-1.5 rounded-[0.9rem] border bg-card px-2 py-1.5 transition-shadow focus-within:border-primary focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_18%,transparent)]",
          error ? "border-danger" : "border-border",
        )}
      >
        {value.map((item) => (
          <span key={item} className="inline-flex h-8 items-center gap-1 rounded-full bg-secondary pr-1 pl-3 text-small">
            {item}
            <button
              type="button"
              onClick={() => remove(item)}
              className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
              aria-label={`Remove ${item}`}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            if (next.includes(",")) add(next);
            else setDraft(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => add(draft)}
          placeholder={value.length ? "Add another…" : placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-8 min-w-32 flex-1 bg-transparent px-1.5 text-[0.95rem] outline-none placeholder:text-muted-foreground/80"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-small text-danger-foreground">
          {error}
        </p>
      ) : (
        <p className="mt-1 text-caption text-muted-foreground">Press Enter or comma to add.</p>
      )}
      {open.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggestions">
          {open.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => add(item)}
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-border px-3 text-caption text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              <Plus className="size-3" aria-hidden="true" />
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
