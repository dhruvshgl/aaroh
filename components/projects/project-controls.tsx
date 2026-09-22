"use client";

import { useState } from "react";
import { updateProjectStatus } from "@/app/actions/career";
import { Button } from "@/components/ui/button";
import { readStringList } from "@/lib/career/read";

const labels = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
} as const;

export function ProjectStatusControl({
  projectId,
  status,
}: {
  projectId: string;
  status: keyof typeof labels;
}) {
  const [current, setCurrent] = useState(status);
  const [pending, setPending] = useState(false);

  async function setStatus(next: keyof typeof labels) {
    setPending(true);
    await updateProjectStatus(projectId, next);
    setCurrent(next);
    setPending(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
        <Button
          key={key}
          type="button"
          disabled={pending}
          variant={current === key ? "default" : "outline"}
          className="rounded-full"
          onClick={() => void setStatus(key)}
        >
          {labels[key]}
        </Button>
      ))}
    </div>
  );
}

export function SkillRow({ skills }: { skills: unknown }) {
  const items = readStringList(skills);
  if (!items.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((skill) => (
        <li key={skill} className="rounded-full bg-secondary px-3 py-1 text-xs">
          {skill}
        </li>
      ))}
    </ul>
  );
}
