"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { updateProjectStatus } from "@/app/actions/career";
import { PROJECT_STATUS, type ProjectStatus } from "@/components/ui/chips";
import { readStringList } from "@/lib/career/read";
import { useLocalChecklist } from "@/lib/use-local-checklist";
import { cn } from "@/lib/utils";

const ORDER: ProjectStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

const TOAST: Record<ProjectStatus, string> = {
  NOT_STARTED: "Moved back to Not started",
  IN_PROGRESS: "Project started — good luck!",
  COMPLETED: "Project completed. That's real evidence.",
};

/** Segmented status control with optimistic update and toast. */
export function ProjectStatusControl({
  projectId,
  status,
  onChange,
  size = "md",
  label = "Project status",
}: {
  projectId: string;
  status: ProjectStatus;
  onChange?: (next: ProjectStatus) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  const [current, setCurrent] = useState(status);
  const [pending, startTransition] = useTransition();

  function set(next: ProjectStatus) {
    if (next === current) return;
    const previous = current;
    setCurrent(next);
    onChange?.(next);
    startTransition(async () => {
      const result = await updateProjectStatus(projectId, next).catch(() => ({ error: "failed" }));
      if (result && "error" in result && result.error) {
        setCurrent(previous);
        onChange?.(previous);
        toast.error("The status didn't save. Try again.");
        return;
      }
      toast.success(TOAST[next]);
    });
  }

  return (
    <div role="radiogroup" aria-label={label} aria-busy={pending} className="inline-flex w-full rounded-full bg-secondary p-1 sm:w-auto">
      {ORDER.map((key) => {
        const Icon = PROJECT_STATUS[key].icon;
        const active = current === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => set(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 whitespace-nowrap transition-colors sm:flex-none",
              size === "sm" ? "min-h-9 text-caption" : "min-h-11 text-small",
              active ? "bg-card font-medium text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden="true" />
            {PROJECT_STATUS[key].label}
          </button>
        );
      })}
    </div>
  );
}

export function SkillRow({ skills, className }: { skills: unknown; className?: string }) {
  const items = readStringList(skills);
  if (!items.length) return null;
  return (
    <ul className={cn("mt-3 flex flex-wrap gap-1.5", className)} aria-label="Skills">
      {items.map((skill) => (
        <li key={skill} className="rounded-full bg-secondary px-2.5 py-0.5 text-caption">
          {skill}
        </li>
      ))}
    </ul>
  );
}

type BoardProject = { id: string; title: string; whyItMatters: string; status: ProjectStatus; skills: unknown };

export function ProjectsBoard({ projects: initial }: { projects: BoardProject[] }) {
  const [projects, setProjects] = useState(initial);

  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:gap-4">
      {ORDER.map((status) => {
        const column = projects.filter((project) => project.status === status);
        const Icon = PROJECT_STATUS[status].icon;
        return (
          <section key={status} aria-labelledby={`col-${status}`} className="lg:rounded-card lg:bg-secondary/40 lg:p-3">
            <h2 id={`col-${status}`} className="flex items-center gap-2 px-1 text-small font-medium">
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              {PROJECT_STATUS[status].label}
              <span className="rounded-full bg-card px-2 py-0.5 text-caption text-muted-foreground ring-1 ring-border">{column.length}</span>
            </h2>
            <ul className="mt-3 space-y-3">
              {column.length === 0 ? (
                <li className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-caption text-muted-foreground">
                  {status === "NOT_STARTED" ? "Nothing waiting." : status === "IN_PROGRESS" ? "Start a project to see it here." : "Finished projects land here."}
                </li>
              ) : null}
              {column.map((project) => (
                <li key={project.id} className="surface animate-fade-in p-4">
                  <Link href={`/dashboard/projects/${project.id}`} className="font-serif text-h3 leading-snug hover:text-primary hover:underline">
                    {project.title}
                  </Link>
                  <p className="mt-1.5 line-clamp-3 text-small leading-6 text-muted-foreground">{project.whyItMatters}</p>
                  <SkillRow skills={project.skills} />
                  <div className="mt-4">
                    <ProjectStatusControl
                      projectId={project.id}
                      status={project.status}
                      size="sm"
                      label={`Status of ${project.title}`}
                      onChange={(next) =>
                        setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, status: next } : item)))
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function RequirementChecklist({ projectId, items }: { projectId: string; items: string[] }) {
  const { checked, toggle } = useLocalChecklist(`aaroh:project:${projectId}:requirements`);
  if (!items.length) return null;
  const done = items.filter((item) => checked.has(item)).length;
  return (
    <div>
      <p className="text-caption text-muted-foreground">
        {done} of {items.length} done · saved on this device
      </p>
      <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
        {items.map((item, index) => {
          const id = `req-${projectId}-${index}`;
          const isChecked = checked.has(item);
          return (
            <li key={item}>
              <label htmlFor={id} className="flex min-h-12 cursor-pointer items-start gap-3 px-3 py-3 hover:bg-secondary/40">
                <input id={id} type="checkbox" checked={isChecked} onChange={() => toggle(item)} className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" />
                <span className={cn("text-small leading-6", isChecked && "text-muted-foreground line-through")}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CopyQuote({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <figure className="relative rounded-card border border-gold/40 bg-sand-soft/40 p-5">
      <blockquote className="pr-12 font-serif text-h3 leading-relaxed">“{text}”</blockquote>
      <figcaption className="mt-2 text-caption text-muted-foreground">A resume line this project could earn, once it&apos;s real.</figcaption>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("Resume line copied");
            setTimeout(() => setCopied(false), 2000);
          } catch {
            toast.error("Couldn't copy to the clipboard.");
          }
        }}
        aria-label="Copy resume line"
        className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
      >
        {copied ? <Check className="size-4 text-success" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      </button>
    </figure>
  );
}
