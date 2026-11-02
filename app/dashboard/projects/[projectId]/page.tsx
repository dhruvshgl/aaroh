import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CopyQuote, ProjectStatusControl, RequirementChecklist, SkillRow } from "@/components/projects/project-controls";
import { StatusChip } from "@/components/ui/chips";
import { readStringList } from "@/lib/career/read";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const user = await requireUser();
  const { projectId } = await params;
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();
  const requirements = readStringList(project.requirements);
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/projects" className="inline-flex min-h-10 items-center gap-1.5 text-small font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All projects
      </Link>
      <article className="surface mt-2 animate-fade-up p-5 sm:p-8">
        <StatusChip status={project.status} />
        <h1 className="mt-3 text-h1">{project.title}</h1>
        <p className="mt-4 leading-7">{project.description}</p>

        <div className="mt-6 rounded-xl bg-secondary/60 p-4">
          <p className="mb-3 text-small font-medium">Where are you with this?</p>
          <ProjectStatusControl projectId={project.id} status={project.status} />
        </div>

        <section className="mt-8">
          <h2 className="text-h2">Why build this</h2>
          <p className="mt-2 leading-7 text-muted-foreground">{project.whyItMatters}</p>
        </section>

        {readStringList(project.skills).length ? (
          <section className="mt-8">
            <h2 className="text-h2">Skills it proves</h2>
            <SkillRow skills={project.skills} className="[&>li]:px-3 [&>li]:py-1 [&>li]:text-small" />
          </section>
        ) : null}

        {requirements.length ? (
          <section className="mt-8">
            <h2 className="text-h2">Requirements</h2>
            <div className="mt-3">
              <RequirementChecklist projectId={project.id} items={requirements} />
            </div>
          </section>
        ) : null}

        {project.architecture ? (
          <section className="mt-8">
            <h2 className="text-h2">Suggested shape</h2>
            <p className="mt-2 leading-7 text-muted-foreground">{project.architecture}</p>
          </section>
        ) : null}

        {project.expectedOutcome ? (
          <section className="mt-8">
            <h2 className="text-h2">Expected outcome</h2>
            <p className="mt-2 leading-7 text-muted-foreground">{project.expectedOutcome}</p>
          </section>
        ) : null}

        {project.resumeEvidence ? (
          <section className="mt-8">
            <h2 className="text-h2">Resume evidence</h2>
            <div className="mt-3">
              <CopyQuote text={project.resumeEvidence} />
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}
