import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  const path = await prisma.careerPath.findFirst({ where: { id, userId } });
  if (!path) return jsonError("Career path not found.", 404);
  return NextResponse.json({ path });
}
