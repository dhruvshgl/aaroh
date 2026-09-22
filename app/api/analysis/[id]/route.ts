import { NextResponse } from "next/server";
import { groupStageStatus, retryAnalysis } from "@/lib/ai/run-analysis";
import { jsonError, requireApiUser } from "@/lib/api";
import { ANALYSIS_GROUPS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const STALE_MS = 15 * 60 * 1000;

async function loadOwned(userId: string, id: string) {
  return prisma.analysis.findFirst({
    where: { id, userId },
    include: { stages: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  const analysis = await loadOwned(userId, id);
  if (!analysis) return jsonError("Analysis not found.", 404);
  return NextResponse.json({ analysis });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  const analysis = await retryAnalysis(userId, id);
  if (!analysis) return jsonError("Analysis not found.", 404);
  return NextResponse.json({ analysisId: analysis.id, status: analysis.status.toLowerCase() });
}

export async function statusResponse(userId: string, id: string) {
  let analysis = await loadOwned(userId, id);
  if (!analysis) return jsonError("Analysis not found.", 404);
  const stale =
    analysis.status === "PROCESSING" &&
    analysis.updatedAt.getTime() < Date.now() - STALE_MS;
  if (stale) {
    await prisma.analysis.update({
      where: { id },
      data: { status: "FAILED", error: "The analysis stopped before it finished. You can retry." },
    });
    analysis = await loadOwned(userId, id);
  }
  if (!analysis) return jsonError("Analysis not found.", 404);
  const groups = groupStageStatus(analysis.stages).map((group) => ({
    ...group,
    label: ANALYSIS_GROUPS.find((item) => item.key === group.group)?.label ?? group.group,
  }));
  return NextResponse.json({
    analysisId: analysis.id,
    status: analysis.status.toLowerCase(),
    error: analysis.error,
    stages: analysis.stages.map((stage) => ({
      key: stage.key,
      label: stage.label,
      status: stage.status.toLowerCase(),
    })),
    groups,
  });
}
