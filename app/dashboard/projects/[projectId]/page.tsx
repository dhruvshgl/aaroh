import { notFound } from "next/navigation";
import { ProjectStatusControl, SkillRow } from "@/components/projects/project-controls";
import { readStringList } from "@/lib/career/read";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const user = await requireUser();
  const { projectId } = await params;
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();
  return (
    <article className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-card p-6">
      <h1 className="text-4xl">{project.title}</h1>
      <p className="mt-4 leading-7">{project.description}</p>
      <h2 className="mt-6 text-2xl">Why build this</h2>
      <p className="mt-2 text-muted-foreground">{project.whyItMatters}</p>
      <h2 className="mt-6 text-2xl">Skills</h2>
      <SkillRow skills={project.skills} />
      <h2 className="mt-6 text-2xl">Requirements</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {readStringList(project.requirements).map((item) => <li key={item}>{item}</li>)}
      </ul>
      {project.architecture ? (
        <>
          <h2 className="mt-6 text-2xl">Suggested shape</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.architecture}</p>
        </>
      ) : null}
      {project.expectedOutcome ? (
        <>
          <h2 className="mt-6 text-2xl">Expected outcome</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.expectedOutcome}</p>
        </>
      ) : null}
      {project.resumeEvidence ? (
        <>
          <h2 className="mt-6 text-2xl">Resume evidence</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.resumeEvidence}</p>
        </>
      ) : null}
      <div className="mt-8">
        <ProjectStatusControl projectId={project.id} status={project.status} />
      </div>
    </article>
  );
}
