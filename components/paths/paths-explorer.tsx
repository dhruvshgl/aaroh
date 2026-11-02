"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Columns3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DifficultyMeter, FitChip } from "@/components/ui/chips";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

export type PathItem = {
  id: string;
  roleName: string;
  summary: string;
  whyIdentified: string;
  fitScore: number;
  fitLabel: string;
  difficulty: string;
  nextStep: string;
  transferableSkills: string[];
  missingSkills: string[];
};

const MAX_COMPARE = 3;

export function PathsExplorer({ paths }: { paths: PathItem[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const chosen = paths.filter((path) => selected.includes(path.id));

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length >= MAX_COMPARE ? current : [...current, id],
    );
  }

  return (
    <>
      <p className="text-small text-muted-foreground">
        Tick up to {MAX_COMPARE} paths to compare them side by side.
      </p>
      <ul className="mt-3 grid gap-4 md:grid-cols-2">
        {paths.map((path) => {
          const isSelected = selected.includes(path.id);
          const disabled = !isSelected && selected.length >= MAX_COMPARE;
          return (
            <li key={path.id} className={cn("surface flex flex-col p-5 transition-shadow", isSelected && "ring-2 ring-primary/40")}>
              <p className="text-small leading-6 text-foreground">
                <span className="font-medium text-primary">Why it was suggested: </span>
                {path.whyIdentified}
              </p>
              <div className="mt-4 flex items-start justify-between gap-3">
                <h2 className="font-serif text-h2 leading-tight">{path.roleName}</h2>
                <span className="font-serif text-h2 text-primary">{path.fitScore}%</span>
              </div>
              <ProgressBar value={path.fitScore} label={`${path.roleName} fit score`} tone="gold" className="mt-3" />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <FitChip label={path.fitLabel} score={path.fitScore} />
                <DifficultyMeter difficulty={path.difficulty} />
              </div>
              <p className="mt-3 line-clamp-3 text-small leading-6 text-muted-foreground">{path.summary}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
                <label className={cn("flex min-h-10 cursor-pointer items-center gap-2 text-small", disabled && "cursor-not-allowed opacity-50")}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={disabled}
                    onChange={() => toggle(path.id)}
                    className="size-5 accent-[var(--primary)]"
                  />
                  Compare
                </label>
                <Link href={`/dashboard/alternatives/${path.id}`} className="inline-flex min-h-10 items-center gap-1 text-small font-medium text-primary hover:underline">
                  Explore this possibility
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {selected.length > 0 ? (
        <div className="fixed inset-x-4 bottom-20 z-20 mx-auto flex max-w-xl animate-fade-up items-center justify-between gap-3 rounded-full bg-primary py-2 pr-2 pl-5 text-primary-foreground shadow-[var(--shadow-raised)] lg:bottom-6 lg:left-60">
          <span className="text-small">
            {selected.length} selected{selected.length < 2 ? " · pick one more" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="pill-sm"
              className="bg-sand-soft text-forest hover:bg-sand"
              disabled={selected.length < 2}
              onClick={() => setOpen(true)}
            >
              <Columns3 aria-hidden="true" />
              Compare
            </Button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="grid size-10 place-items-center rounded-full hover:bg-white/10"
              aria-label="Clear selection"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-card p-5 sm:max-w-4xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-h2">Compare possibilities</DialogTitle>
            <DialogDescription>Side by side, so you can see which direction is worth a small experiment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 220px), 1fr))` }}>
            {chosen.map((path) => (
              <section key={path.id} className="rounded-xl border border-border p-4">
                <h3 className="font-serif text-h3">{path.roleName}</h3>
                <p className="mt-1 font-serif text-h2 text-primary">{path.fitScore}%</p>
                <FitChip label={path.fitLabel} score={path.fitScore} className="mt-1" />
                <DifficultyMeter difficulty={path.difficulty} className="mt-3 flex" />
                <CompareList title="Transferable skills" items={path.transferableSkills} positive />
                <CompareList title="Missing skills" items={path.missingSkills} />
                <div className="mt-4">
                  <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">Next step</p>
                  <p className="mt-1 text-small leading-6">{path.nextStep}</p>
                </div>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CompareList({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  return (
    <div className="mt-4">
      <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      {items.length ? (
        <ul className="mt-1 space-y-1">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-1.5 text-small">
              {positive ? (
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
              )}
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-small text-muted-foreground">None recorded.</p>
      )}
    </div>
  );
}
