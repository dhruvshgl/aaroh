import { ReportView } from "@/components/report/report-view";
import { readGaps, readGoal, readInsights, readRecommendations, readSkills, readSnapshot, readStrengths } from "@/lib/career/read";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ReportPage() {
  const user = await requireUser();
  const report = await prisma.careerReport.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { paths: { orderBy: { fitScore: "desc" } } },
  });
  if (!report) {
    return <p className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">Your career report will appear here after analysis.</p>;
  }
  const gaps = readGaps(report.gaps);
  const goal = readGoal(report.targetCareer);
  return (
    <ReportView
      name={user.name || "Your"}
      score={report.alignmentScore}
      explanation={report.alignmentExplanation}
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
    />
  );
}
