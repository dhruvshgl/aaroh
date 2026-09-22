import { NextResponse } from "next/server";
import { startAnalysis } from "@/lib/ai/run-analysis";
import { jsonError, requireApiUser } from "@/lib/api";
import { RateLimitError } from "@/lib/rate-limit";

export const maxDuration = 300;

export async function POST() {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  try {
    const analysis = await startAnalysis(userId);
    return NextResponse.json({
      analysisId: analysis.id,
      status: analysis.status.toLowerCase(),
    });
  } catch (error) {
    if (error instanceof RateLimitError) return jsonError(error.message, 429);
    const message = error instanceof Error ? error.message : "Analysis could not start.";
    return jsonError(message, 500);
  }
}
