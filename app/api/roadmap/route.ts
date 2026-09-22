import { NextResponse } from "next/server";
import { regenerateRoadmap } from "@/lib/ai/run-analysis";
import { jsonError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { RateLimitError } from "@/lib/rate-limit";
import { adjustPlanSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId, isCurrent: true },
    include: { phases: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ roadmap });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const body = await request.json().catch(() => ({}));
  const parsed = adjustPlanSchema.safeParse({
    hoursPerWeek: body.hoursPerWeek ?? 8,
    notes: body.notes,
  });
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid plan.");
  try {
    await regenerateRoadmap(userId, parsed.data.hoursPerWeek, parsed.data.notes);
  } catch (error) {
    if (error instanceof RateLimitError) return jsonError(error.message, 429);
    const message = error instanceof Error ? error.message : "Roadmap could not be generated.";
    return jsonError(message, 500);
  }
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId, isCurrent: true },
    include: { phases: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ roadmap });
}
