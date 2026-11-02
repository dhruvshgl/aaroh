import Link from "next/link";
import { Sparkles } from "lucide-react";
import { beginAnalysis } from "@/app/actions/career";
import { ReportView } from "@/components/report/report-view";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { readGaps, readGoal, readInsights, readRecommendations, readSkills, readSnapshot, readStrengths, readStringList } from "@/lib/career/read";
import { analysisRunsLeft } from "@/lib/progress";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

function readBreakdown(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const keys = ["skill", "experience", "goal", "evidence", "gapPenalty"] as const;
  if (!keys.every((key) => typeof record[key] === "number")) return null;
  return {
    skill: record.skill as number,
    experience: record.experience as number,
    goal: record.goal as number,
    evidence: record.evidence as number,
    gapPenalty: record.gapPenalty as number,
  };
}

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const user = await requireUser();
  const [report, roadmap, quota, analysis] = await Promise.all([
    prisma.careerReport.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { paths: { orderBy: { fitScore: "desc" } } },
    }),
    prisma.roadmap.findFirst({
      where: { userId: user.id, isCurrent: true },
      orderBy: { createdAt: "desc" },
      include: { phases: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, sortOrder: true, skills: true, topics: true } } },
    }),
    analysisRunsLeft(user.id),
    prisma.analysis.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, status: true } }),
  ]);

  if (!report) {
    const running = analysis && (analysis.status === "QUEUED" || analysis.status === "PROCESSING");
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          headingLevel="h1"
          icon={Sparkles}
          title={running ? "Your report is being written" : "No report yet"}
          description={
            running
              ? "Aaroh is still analysing your profile. This usually takes about 1–2 minutes."
              : "Run an analysis and your honest career report will appear here: strengths, gaps, skills and possible paths."
          }
          action={
            running ? (
              <Link href={`/analysis/${analysis.id}`} className={cn(buttonVariants({ size: "pill" }))}>
                Watch progress
              </Link>
            ) : (
              <form action={beginAnalysis}>
                <button type="submit" className={cn(buttonVariants({ size: "pill" }))}>
                  <Sparkles aria-hidden="true" />
                  Start analysis
                </button>
              </form>
            )
          }
        />
      </div>
    );
  }

  const gaps = readGaps(report.gaps);
  const goal = readGoal(report.targetCareer);
  return (
    <ReportView
      name={user.name || "Your"}
      initialTab={tab ?? "overview"}
      score={report.alignmentScore}
      breakdown={readBreakdown(report.alignmentBreakdown)}
      explanation={report.alignmentExplanation}
      targetRole={goal?.targetRole ?? null}
      snapshot={readSnapshot(report.snapshot)}
      strengths={readStrengths(report.strengths)}
      gaps={gaps.gaps}
      alreadyHave={gaps.alreadyHave}
      needToStrengthen={gaps.needToStrengthen}
      limitedEvidence={gaps.limitedEvidence}
      skills={readSkills(report.skills)}
      goalSummary={goal?.summary ?? null}
      paths={report.paths}
      recommendations={readRecommendations(report.recommendations)}
      insights={readInsights(report.resumeInsights)}
      phases={(roadmap?.phases ?? []).map((phase) => ({
        id: phase.id,
        title: phase.title,
        sortOrder: phase.sortOrder,
        keywords: [phase.title, ...readStringList(phase.skills), ...readStringList(phase.topics)],
      }))}
      runsLeft={quota.left}
      runsLimit={quota.limit}
      generatedAt={report.createdAt.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })}
    />
  );
}
