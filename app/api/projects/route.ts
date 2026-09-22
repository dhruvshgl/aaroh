import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/rate-limit";

const statuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const whyItMatters = typeof body?.whyItMatters === "string" ? body.whyItMatters.trim() : "";
  if (title.length < 3 || description.length < 3) {
    return jsonError("A project needs a title and a short description.");
  }
  const project = await prisma.project.create({
    data: {
      userId,
      title: title.slice(0, 140),
      description: description.slice(0, 2000),
      whyItMatters: (whyItMatters || "A project you chose to build as career evidence.").slice(0, 1000),
      skills: json(Array.isArray(body?.skills) ? body.skills.slice(0, 12) : []),
      requirements: json(Array.isArray(body?.requirements) ? body.requirements.slice(0, 12) : []),
    },
  });
  return NextResponse.json({ project }, { status: 201 });
}

export async function updateProject(userId: string, id: string, body: Record<string, unknown>) {
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) return jsonError("Project not found.", 404);
  const status = statuses.find((item) => item === body.status);
  const updated = await prisma.project.update({
    where: { id },
    data: {
      title: typeof body.title === "string" ? body.title.slice(0, 140) : undefined,
      description: typeof body.description === "string" ? body.description.slice(0, 2000) : undefined,
      status,
      startedAt: status === "IN_PROGRESS" && !project.startedAt ? new Date() : undefined,
      completedAt: status === "COMPLETED" ? new Date() : status ? null : undefined,
    },
  });
  return NextResponse.json({ project: updated });
}

export async function removeProject(userId: string, id: string) {
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) return jsonError("Project not found.", 404);
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
