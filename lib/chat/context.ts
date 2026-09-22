import { prisma } from "@/lib/prisma";

export async function buildCareerContext(userId: string) {
  const [profile, report, roadmap, projects] = await Promise.all([
    prisma.careerProfile.findUnique({
      where: { userId },
      include: { skills: true, education: true },
    }),
    prisma.careerReport.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.roadmap.findFirst({
      where: { userId, isCurrent: true },
      include: { phases: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  const gaps = Array.isArray((report?.gaps as { gaps?: unknown[] } | null)?.gaps)
    ? ((report?.gaps as { gaps: { skill: string; severity: string; recommendedAction: string }[] }).gaps).slice(0, 5)
    : [];

  return {
    profile: profile
      ? {
          role: profile.currentRole,
          experience: profile.yearsOfExperience,
          region: profile.region,
          goal: profile.goalText,
          timeframe: profile.timeframe,
          environment: profile.targetEnvironment,
          skills: profile.skills.map((skill) => skill.name),
          interests: profile.interests,
          concern: profile.careerConcern,
          enjoys: profile.enjoys,
          dislikes: profile.dislikes,
        }
      : null,
    snapshot: report?.snapshot ?? null,
    alignmentScore: report?.alignmentScore ?? null,
    target: report
      ? {
          role: (report.targetCareer as { targetRole?: string }).targetRole ?? null,
        }
      : null,
    topGaps: gaps,
    roadmap: roadmap
      ? {
          targetRole: roadmap.targetRole,
          hoursPerWeek: roadmap.hoursPerWeek,
          phases: roadmap.phases.map((phase) => ({
            title: phase.title,
            duration: phase.duration,
            completed: Boolean(phase.completedAt),
          })),
        }
      : null,
    projects: projects.map((project) => ({
      title: project.title,
      status: project.status,
    })),
  };
}
