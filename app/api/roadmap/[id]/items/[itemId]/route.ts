import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id, itemId } = await context.params;
  const phase = await prisma.roadmapPhase.findFirst({
    where: { id: itemId, roadmapId: id, roadmap: { userId } },
  });
  if (!phase) return jsonError("Roadmap phase not found.", 404);
  const body = await request.json().catch(() => ({}));
  const completed = Boolean(body.completed);
  const updated = await prisma.roadmapPhase.update({
    where: { id: phase.id },
    data: { completedAt: completed ? new Date() : null },
  });
  return NextResponse.json({ phase: updated });
}
