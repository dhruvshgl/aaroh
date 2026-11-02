import { prisma } from "@/lib/prisma";

/** Small read used by the app shell's sidebar progress hint. */
export async function roadmapProgress(userId: string) {
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId, isCurrent: true },
    orderBy: { createdAt: "desc" },
    select: { phases: { select: { completedAt: true } } },
  });
  if (!roadmap || roadmap.phases.length === 0) return null;
  return {
    done: roadmap.phases.filter((phase) => phase.completedAt).length,
    total: roadmap.phases.length,
  };
}

/** Mirrors lib/rate-limit's daily analysis window without consuming it. */
export async function analysisRunsLeft(userId: string) {
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const parsed = Number(process.env.ANALYSIS_DAILY_LIMIT);
  const limit = Number.isFinite(parsed) && parsed >= 1 ? parsed : 5;
  const row = await prisma.rateLimit.findUnique({
    where: { userId_action_windowStart: { userId, action: "analysis", windowStart } },
    select: { count: true },
  });
  return { limit, left: Math.max(0, limit - (row?.count ?? 0)) };
}
