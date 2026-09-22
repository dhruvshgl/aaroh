import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { renderReportPdf } from "@/lib/report/pdf";

async function latestReport(userId: string, id?: string) {
  return prisma.careerReport.findFirst({
    where: { userId, ...(id ? { id } : {}) },
    orderBy: { createdAt: "desc" },
    include: { paths: true },
  });
}

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const report = await latestReport(userId);
  if (!report) return jsonError("No career report yet.", 404);
  return NextResponse.json({ report });
}

export async function reportById(userId: string, id: string) {
  const report = await latestReport(userId, id);
  if (!report) return jsonError("Report not found.", 404);
  return NextResponse.json({ report });
}

export async function reportPdf(userId: string) {
  const report = await latestReport(userId);
  if (!report) return jsonError("No career report yet.", 404);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const snapshot = report.snapshot as {
    currentRole?: string;
    experience?: string;
    location?: string;
    primaryProfile?: string;
    careerGoal?: string;
  };
  const strengths = report.strengths as { title: string; evidence: string }[];
  const gaps = report.gaps as { gaps?: { skill: string; whyItMatters: string; recommendedAction: string }[] };
  const bytes = await renderReportPdf({
    name: user?.name || "Aaroh",
    score: report.alignmentScore,
    explanation: report.alignmentExplanation,
    snapshot,
    strengths: Array.isArray(strengths) ? strengths : [],
    gaps: gaps.gaps ?? [],
    paths: report.paths.map((path) => ({
      roleName: path.roleName,
      fitLabel: path.fitLabel,
      whyIdentified: path.whyIdentified,
    })),
  });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="aaroh-career-report.pdf"',
    },
  });
}
