import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  const roadmap = await prisma.roadmap.findFirst({ where: { id, userId } });
  if (!roadmap) return jsonError("Roadmap not found.", 404);
  const body = await request.json().catch(() => ({}));
  const updated = await prisma.roadmap.update({
    where: { id },
    data: {
      notes: typeof body.notes === "string" ? body.notes.slice(0, 1000) : undefined,
      hoursPerWeek:
        typeof body.hoursPerWeek === "number" ? Math.min(60, Math.max(1, body.hoursPerWeek)) : undefined,
    },
    include: { phases: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json({ roadmap: updated });
}
