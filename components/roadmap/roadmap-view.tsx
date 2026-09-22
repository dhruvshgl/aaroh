"use client";

import { useActionState, useState } from "react";
import { adjustPlan, completePhase } from "@/app/actions/career";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { readResources, readStringList } from "@/lib/career/read";

export type Phase = {
  id: string;
  sortOrder: number;
  title: string;
  description: string;
  duration: string;
  objective: string;
  skills: unknown;
  topics: unknown;
  resources: unknown;
  evidence: string;
  completedAt: string | null;
};

export function RoadmapView({
  targetRole,
  phases,
}: {
  targetRole: string;
  phases: Phase[];
}) {
  const [selected, setSelected] = useState(phases[0]?.id ?? "");
  const [state, action, pending] = useActionState(adjustPlan, null);
  const phase = phases.find((item) => item.id === selected) ?? phases[0];

  if (!phase) {
    return <p className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">Your roadmap will appear here after analysis.</p>;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl">Your Career Roadmap</h1>
          <p className="mt-2 text-muted-foreground">A personalized plan for moving toward {targetRole}.</p>
        </div>
        <Dialog>
          <DialogTrigger className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm">
            Adjust plan
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Adjust this plan</DialogTitle>
            </DialogHeader>
            <form action={action} className="space-y-3">
              <label className="block text-sm">
                Hours per week
                <input name="hoursPerWeek" type="number" min={1} max={60} defaultValue={8} className="field mt-1" />
              </label>
              <label className="block text-sm">
                What should change?
                <textarea name="notes" className="field mt-1" placeholder="I only have evenings, and I don't want to learn Kubernetes." />
              </label>
              {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
              {state?.ok ? <p className="text-sm text-primary">A new version of the roadmap is ready.</p> : null}
              <Button type="submit" disabled={pending} className="h-11 w-full rounded-full">
                {pending ? "Rebuilding…" : "Rebuild roadmap"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ol className="space-y-2">
          {phases.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelected(item.id)}
                className={`w-full rounded-3xl border px-4 py-3 text-left ${item.id === phase.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
              >
                <span className="text-xs tracking-widest uppercase">0{item.sortOrder}</span>
                <span className="mt-1 block font-medium">{item.title}</span>
                <span className={`mt-1 block text-sm ${item.id === phase.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {item.duration}
                  {item.completedAt ? " · Complete" : ""}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <article className="rounded-[2rem] border border-border bg-card p-5 sm:p-7">
          <p className="text-sm text-primary">{phase.duration}</p>
          <h2 className="mt-1 text-3xl">{phase.title}</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{phase.description}</p>
          <h3 className="mt-6 font-medium">Objective</h3>
          <p className="mt-1 text-sm leading-6">{phase.objective}</p>
          <List title="Skills" items={readStringList(phase.skills)} />
          <List title="Topics" items={readStringList(phase.topics)} />
          <h3 className="mt-6 font-medium">Resources</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {readResources(phase.resources).map((resource) => (
              <li key={resource.title}>
                <span className="font-medium">{resource.title}. </span>
                <span className="text-muted-foreground">{resource.detail}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 font-medium">Evidence of completion</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{phase.evidence}</p>
          <form action={completePhase.bind(null, phase.id)} className="mt-6">
            <Button type="submit" className="h-11 rounded-full">{phase.completedAt ? "Mark incomplete" : "Mark as complete"}</Button>
          </form>
        </article>
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <>
      <h3 className="mt-6 font-medium">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-full bg-secondary px-3 py-1 text-sm">
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}
