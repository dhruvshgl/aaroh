"use client";

import { useActionState, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  CircleCheck,
  Code2,
  FileText,
  FolderKanban,
  GraduationCap,
  Link2,
  Loader2,
  PlayCircle,
  SlidersHorizontal,
  Target,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { adjustPlan, completePhase } from "@/app/actions/career";
import { Button } from "@/components/ui/button";
import { StatusChip, type ProjectStatus } from "@/components/ui/chips";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { readResources, readStringList } from "@/lib/career/read";
import { useLocalChecklist } from "@/lib/use-local-checklist";
import { cn } from "@/lib/utils";

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

type ProjectRef = { id: string; title: string; status: ProjectStatus; skills: unknown };

function resourceIcon(title: string, detail: string): { icon: LucideIcon; kind: string } {
  const text = `${title} ${detail}`.toLowerCase();
  if (/video|youtube|watch|talk|lecture/.test(text)) return { icon: PlayCircle, kind: "Video" };
  if (/course|class|bootcamp|certificat|specializ/.test(text)) return { icon: GraduationCap, kind: "Course" };
  if (/book|chapter|read /.test(text)) return { icon: BookOpen, kind: "Book" };
  if (/doc|documentation|guide|tutorial|handbook|reference/.test(text)) return { icon: FileText, kind: "Guide" };
  if (/github|repo|build|project|exercise|practice|kata|leetcode/.test(text)) return { icon: Code2, kind: "Practice" };
  return { icon: Link2, kind: "Resource" };
}

export function RoadmapView({
  targetRole,
  phases,
  initialPhaseId,
  hoursPerWeek,
  runsLeft,
  runsLimit,
  projects,
}: {
  targetRole: string;
  phases: Phase[];
  initialPhaseId: string | null;
  hoursPerWeek: number;
  runsLeft: number;
  runsLimit: number;
  projects: ProjectRef[];
}) {
  const [optimisticPhases, toggleOptimistic] = useOptimistic(phases, (current, phaseId: string) =>
    current.map((phase) =>
      phase.id === phaseId ? { ...phase, completedAt: phase.completedAt ? null : new Date().toISOString() } : phase,
    ),
  );
  const [, startTransition] = useTransition();
  const firstOpen = optimisticPhases.find((phase) => !phase.completedAt);
  const [selected, setSelected] = useState(
    () => phases.find((phase) => phase.id === initialPhaseId)?.id ?? phases.find((phase) => !phase.completedAt)?.id ?? phases[0]?.id ?? "",
  );
  const phase = optimisticPhases.find((item) => item.id === selected) ?? optimisticPhases[0];
  const done = optimisticPhases.filter((item) => item.completedAt).length;

  function select(id: string) {
    setSelected(id);
    const url = new URL(window.location.href);
    url.searchParams.set("phase", id);
    window.history.replaceState(window.history.state, "", url);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.getElementById("phase-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function toggle(target: Phase, isUndo = false) {
    const completing = !target.completedAt;
    startTransition(async () => {
      toggleOptimistic(target.id);
      try {
        await completePhase(target.id);
      } catch {
        toast.error("That didn't save. Check your connection and try again.");
        return;
      }
      if (isUndo) return;
      toast.success(completing ? `Phase ${target.sortOrder} complete — nice work.` : `Phase ${target.sortOrder} marked as not complete.`, {
        description: completing ? "One step higher. Your dashboard is updated." : undefined,
        action: {
          label: "Undo",
          onClick: () => toggle({ ...target, completedAt: completing ? new Date().toISOString() : null }, true),
        },
      });
    });
  }

  if (!phase) return null;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Roadmap"
        title="Your career roadmap"
        description={<>A phased plan for moving toward <span className="font-medium text-foreground">{targetRole}</span>.</>}
        actions={<AdjustPlanDialog hoursPerWeek={hoursPerWeek} runsLeft={runsLeft} runsLimit={runsLimit} />}
      />

      <section aria-label="Overall progress" className="surface mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="shrink-0">
          <p className="font-serif text-h2">
            {done} of {optimisticPhases.length} phases complete
          </p>
          <p className="text-small text-muted-foreground">
            {done === optimisticPhases.length ? "You finished the plan. Consider a fresh analysis." : firstOpen ? `Now: Phase ${firstOpen.sortOrder} · ${firstOpen.title}` : null}
          </p>
        </div>
        <ProgressBar value={done} max={optimisticPhases.length} label="Phases complete" className="h-2.5 sm:flex-1" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <nav aria-label="Roadmap phases">
          <ol className="relative">
            {optimisticPhases.map((item, index) => {
              const status = item.completedAt ? "done" : item.id === firstOpen?.id ? "current" : "upcoming";
              const isSelected = item.id === phase.id;
              const last = index === optimisticPhases.length - 1;
              return (
                <li key={item.id} className="relative flex gap-3 pb-3">
                  {!last ? (
                    <span
                      className={cn("absolute top-9 bottom-0 left-[15px] w-0.5", item.completedAt ? "bg-primary" : "bg-border")}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-[1] mt-2 grid size-8 shrink-0 place-items-center rounded-full border-2 text-caption font-semibold",
                      status === "done" && "border-primary bg-primary text-primary-foreground",
                      status === "current" && "border-primary bg-card text-primary",
                      status === "upcoming" && "border-border bg-card text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {status === "done" ? <Check className="size-4" /> : item.sortOrder}
                  </span>
                  <button
                    type="button"
                    onClick={() => select(item.id)}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "min-h-14 flex-1 rounded-xl border px-4 py-2.5 text-left transition-colors",
                      isSelected ? "border-primary/40 bg-card shadow-[var(--shadow-soft)]" : "border-transparent hover:bg-secondary/70",
                    )}
                  >
                    <span className="flex items-center gap-2 text-caption text-muted-foreground">
                      Phase {item.sortOrder} · {item.duration}
                    </span>
                    <span className={cn("mt-0.5 block font-medium", isSelected && "text-primary")}>{item.title}</span>
                    <span
                      className={cn(
                        "mt-1 inline-block text-caption font-medium",
                        status === "done" ? "text-success-foreground" : status === "current" ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {status === "done" ? "Done" : status === "current" ? "Current" : "Upcoming"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <PhaseDetail key={phase.id} phase={phase} projects={projects} onToggle={() => toggle(phase)} />
      </div>
    </div>
  );
}

function PhaseDetail({ phase, projects, onToggle }: { phase: Phase; projects: ProjectRef[]; onToggle: () => void }) {
  const skills = readStringList(phase.skills);
  const topics = readStringList(phase.topics);
  const resources = readResources(phase.resources);
  const { checked, toggle } = useLocalChecklist(`aaroh:roadmap:${phase.id}:topics`);
  const ticked = topics.filter((topic) => checked.has(topic)).length;
  const lowerSkills = skills.map((skill) => skill.toLowerCase());
  const related = projects.filter((project) =>
    readStringList(project.skills).some((skill) => lowerSkills.includes(skill.toLowerCase())),
  );

  return (
    <article id="phase-detail" className="surface animate-fade-up p-5 sm:p-7" aria-labelledby="phase-title">
      <div className="flex flex-wrap items-center gap-2 text-small text-muted-foreground">
        <span>Phase {phase.sortOrder}</span>
        <span aria-hidden="true">·</span>
        <span>{phase.duration}</span>
        {phase.completedAt ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-caption font-medium text-success-foreground">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            Complete
          </span>
        ) : null}
      </div>
      <h2 id="phase-title" className="mt-1 text-h1">
        {phase.title}
      </h2>
      <p className="mt-3 leading-7 text-muted-foreground">{phase.description}</p>

      <div className="mt-6 flex gap-3 rounded-xl bg-secondary/60 p-4">
        <Target className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h3 className="text-small font-medium">Objective</h3>
          <p className="mt-1 text-small leading-6">{phase.objective}</p>
        </div>
      </div>

      {skills.length ? (
        <section className="mt-6">
          <h3 className="font-serif text-h3">Skills you&apos;ll build</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <li key={skill} className="rounded-full bg-secondary px-3 py-1 text-small">
                {skill}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {topics.length ? (
        <section className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="font-serif text-h3">Topics</h3>
            <p className="text-caption text-muted-foreground">
              {ticked} of {topics.length} ticked · saved on this device
            </p>
          </div>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
            {topics.map((topic) => {
              const isChecked = checked.has(topic);
              const id = `topic-${phase.id}-${topic.replace(/[^a-z0-9]+/gi, "-")}`;
              return (
                <li key={topic}>
                  <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-secondary/40">
                    <input
                      id={id}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(topic)}
                      className="size-5 shrink-0 accent-[var(--primary)]"
                    />
                    <span className={cn("text-small", isChecked && "text-muted-foreground line-through")}>{topic}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {resources.length ? (
        <section className="mt-6">
          <h3 className="font-serif text-h3">Resources</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {resources.map((resource) => {
              const { icon: Icon, kind } = resourceIcon(resource.title, resource.detail);
              return (
                <li key={resource.title} className="flex gap-3 rounded-xl border border-border p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-caption text-muted-foreground">{kind}</p>
                    <p className="text-small font-medium">{resource.title}</p>
                    {resource.detail ? <p className="mt-0.5 text-caption leading-5 text-muted-foreground">{resource.detail}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="mt-6 rounded-xl border border-gold/40 bg-sand-soft/40 p-4">
        <h3 className="flex items-center gap-2 text-small font-medium">
          <CircleCheck className="size-4 text-warning-foreground" aria-hidden="true" />
          Evidence of completion
        </h3>
        <p className="mt-1 text-small leading-6">{phase.evidence}</p>
      </section>

      <section className="mt-6">
        <h3 className="font-serif text-h3">Projects for this phase</h3>
        {related.length ? (
          <ul className="mt-2 space-y-2">
            {related.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 hover:border-primary/40"
                >
                  <span className="flex items-center gap-2 text-small font-medium">
                    <FolderKanban className="size-4 text-primary" aria-hidden="true" />
                    {project.title}
                  </span>
                  <StatusChip status={project.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-small text-muted-foreground">
            No project is tied to these skills yet.{" "}
            <Link href="/dashboard/projects" className="font-medium text-primary hover:underline">
              See all projects
            </Link>
          </p>
        )}
      </section>

      <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-muted-foreground">
          {phase.completedAt ? "Marked complete. You can undo this any time." : "Done with the evidence above? Mark it complete."}
        </p>
        <Button type="button" size="pill" variant={phase.completedAt ? "outline" : "default"} onClick={onToggle} className={phase.completedAt ? "bg-card" : ""}>
          {phase.completedAt ? "Mark as not complete" : (
            <>
              <Check aria-hidden="true" />
              Mark as complete
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

function AdjustPlanDialog({ hoursPerWeek, runsLeft, runsLimit }: { hoursPerWeek: number; runsLeft: number; runsLimit: number }) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(Math.min(60, Math.max(1, hoursPerWeek)));
  const [state, action, pending] = useActionState(async (prev: { error?: string; ok?: boolean } | null, data: FormData) => {
    const result = await adjustPlan(prev, data);
    if (result?.ok) {
      toast.success("Your roadmap was rebuilt", { description: `Planned around ${data.get("hoursPerWeek")} hours a week.` });
      setOpen(false);
    }
    return result;
  }, null);

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button variant="outline" size="pill-sm" className="bg-card" />}>
        <SlidersHorizontal aria-hidden="true" />
        Adjust plan
      </DialogTrigger>
      <DialogContent className="rounded-card p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-h2">Adjust your plan</DialogTitle>
          <DialogDescription>Aaroh rebuilds the roadmap around your time and preferences, still aimed at your gaps.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="hours-range" className="text-small font-medium">
                Hours per week
              </label>
              <input
                type="number"
                name="hoursPerWeek"
                min={1}
                max={60}
                value={hours}
                onChange={(event) => setHours(Math.min(60, Math.max(1, Number(event.target.value) || 1)))}
                aria-label="Hours per week"
                className="field h-10 w-20 text-center"
              />
            </div>
            <input
              id="hours-range"
              type="range"
              min={1}
              max={60}
              value={hours}
              onChange={(event) => setHours(Number(event.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
            />
            <div className="flex justify-between text-caption text-muted-foreground">
              <span>1 h</span>
              <span>{hours <= 5 ? "A light, steady pace" : hours <= 15 ? "A solid side-project pace" : hours <= 30 ? "A serious push" : "Close to full time"}</span>
              <span>60 h</span>
            </div>
          </div>
          <Field id="notes" label="What should change?" optional hint="For example: “Only evenings and weekends”, “Skip Kubernetes”, “More project work, less theory”.">
            <textarea id="notes" name="notes" maxLength={1000} className="field" placeholder="I only have evenings, and I'd rather learn by building." />
          </Field>
          <p className="rounded-xl bg-secondary/70 px-3 py-2 text-caption text-muted-foreground">
            Rebuilding uses one of your daily analyses: <span className="font-medium text-foreground">{runsLeft} of {runsLimit} left today</span>.
          </p>
          {state?.error ? (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-small text-danger-foreground">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending || runsLeft === 0} size="pill" className="w-full">
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {pending ? "Rebuilding your roadmap… this can take a minute" : runsLeft === 0 ? "Daily limit reached" : "Rebuild roadmap"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
