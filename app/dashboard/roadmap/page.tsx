import Link from "next/link";
import { Map } from "lucide-react";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { analysisRunsLeft } from "@/lib/progress";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function RoadmapPage({ searchParams }: { searchParams: Promise<{ phase?: string }> }) {
  const { phase } = await searchParams;
  const user = await requireUser();
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId: user.id, isCurrent: true },
    include: {
      phases: { orderBy: { sortOrder: "asc" } },
      projects: { select: { id: true, title: true, status: true, skills: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!roadmap || roadmap.phases.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={Map}
          title="Your roadmap isn't ready yet"
          description="After your analysis, Aaroh builds a phased plan aimed at your real gaps, with projects that prove each step."
          action={
            <Link href="/dashboard" className={cn(buttonVariants({ size: "pill" }))}>
              Go to dashboard
            </Link>
          }
        />
      </div>
    );
  }
  const quota = await analysisRunsLeft(user.id);
  return (
    <RoadmapView
      targetRole={roadmap.targetRole}
      initialPhaseId={phase ?? null}
      hoursPerWeek={roadmap.hoursPerWeek ?? 8}
      runsLeft={quota.left}
      runsLimit={quota.limit}
      projects={roadmap.projects}
      phases={roadmap.phases.map((item) => ({
        ...item,
        completedAt: item.completedAt?.toISOString() ?? null,
      }))}
    />
  );
}
