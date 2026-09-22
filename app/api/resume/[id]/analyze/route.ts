import { startAnalysis } from "@/lib/ai/run-analysis";
import { jsonError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { RateLimitError } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) return jsonError("Resume not found.", 404);
  try {
    const analysis = await startAnalysis(userId);
    return NextResponse.json({ analysisId: analysis.id, status: analysis.status.toLowerCase() });
  } catch (error) {
    if (error instanceof RateLimitError) return jsonError(error.message, 429);
    throw error;
  }
}
