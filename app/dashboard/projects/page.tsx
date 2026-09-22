import Link from "next/link";
import { SkillRow } from "@/components/projects/project-controls";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const labels = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export default async function ProjectsPage() {
  const user = await requireUser();
  const current = await prisma.roadmap.findFirst({
    where: { userId: user.id, isCurrent: true },
    orderBy: { createdAt: "desc" },
  });
  const projects = await prisma.project.findMany({
    where: {
      userId: user.id,
      OR: [
        { roadmapId: null },
        { roadmapId: current?.id },
        { status: { in: ["IN_PROGRESS", "COMPLETED"] } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-4xl">Projects</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Turn the roadmap into evidence you can point to.</p>
      {projects.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">Your recommended projects will appear here.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="rounded-3xl border border-border bg-card p-5">
              <p className="text-xs tracking-wide text-primary uppercase">{labels[project.status]}</p>
              <h2 className="mt-2 text-2xl">{project.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.whyItMatters}</p>
              <SkillRow skills={project.skills} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
