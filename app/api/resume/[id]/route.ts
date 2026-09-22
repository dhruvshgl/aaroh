import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) return jsonError("Resume not found.", 404);
  await deleteObject(resume.storageKey).catch(() => undefined);
  await prisma.resume.delete({ where: { id: resume.id } });
  return NextResponse.json({ ok: true });
}
