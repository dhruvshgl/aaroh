import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const report = await prisma.careerReport.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { paths: { orderBy: { fitScore: "desc" } } },
  });
  return NextResponse.json({ paths: report?.paths ?? [] });
}

export async function POST() {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const report = await prisma.careerReport.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { paths: { orderBy: { fitScore: "desc" } } },
  });
  if (!report) return jsonError("Run a career analysis before exploring alternative paths.", 404);
  return NextResponse.json({ paths: report.paths });
}
