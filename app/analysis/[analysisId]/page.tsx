import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { AnalysisScreen } from "@/components/analysis/analysis-screen";
import { groupStageStatus } from "@/lib/ai/run-analysis";
import { ANALYSIS_GROUPS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const user = await requireUser();
  const { analysisId } = await params;
  const analysis = await prisma.analysis.findFirst({
    where: { id: analysisId, userId: user.id },
    include: { stages: { orderBy: { sortOrder: "asc" } } },
  });
  if (!analysis) notFound();
  const groups = groupStageStatus(analysis.stages).map((group) => ({
    ...group,
    label: ANALYSIS_GROUPS.find((item) => item.key === group.group)?.label ?? group.group,
  }));

  return (
    <AnalysisScreen
      analysisId={analysis.id}
      initial={{
        status: analysis.status.toLowerCase(),
        error: analysis.error,
        groups,
      }}
    />
  );
}
