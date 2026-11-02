import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { ProjectsBoard } from "@/components/projects/project-controls";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Projects"
        title="Turn the plan into proof"
        description="Each project targets a gap in your report. Finish one and it becomes evidence you can point to."
      />
      <div className="mt-6">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Recommended projects arrive with your roadmap after the analysis."
            action={
              <Link href="/dashboard/roadmap" className={cn(buttonVariants({ size: "pill" }))}>
                View roadmap
              </Link>
            }
          />
        ) : (
          <ProjectsBoard
            projects={projects.map((project) => ({
              id: project.id,
              title: project.title,
              whyItMatters: project.whyItMatters,
              status: project.status,
              skills: project.skills,
            }))}
          />
        )}
      </div>
    </div>
  );
}
