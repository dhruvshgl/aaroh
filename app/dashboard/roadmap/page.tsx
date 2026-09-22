import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function RoadmapPage() {
  const user = await requireUser();
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId: user.id, isCurrent: true },
    include: { phases: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  if (!roadmap) {
    return <p className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">Your roadmap will appear here after analysis.</p>;
  }
  return (
    <RoadmapView
      targetRole={roadmap.targetRole}
      phases={roadmap.phases.map((phase) => ({
        ...phase,
        completedAt: phase.completedAt?.toISOString() ?? null,
      }))}
    />
  );
}
