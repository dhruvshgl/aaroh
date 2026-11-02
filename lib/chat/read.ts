import { prisma } from "@/lib/prisma";

/** What the consultant can see, for the context chip above the chat input. */
export async function chatContextSummary(userId: string) {
  const [report, roadmap, projectCount] = await Promise.all([
    prisma.careerReport.findFirst({ where: { userId }, select: { id: true } }),
    prisma.roadmap.findFirst({ where: { userId, isCurrent: true }, select: { id: true } }),
    prisma.project.count({ where: { userId } }),
  ]);
  return { hasReport: Boolean(report), hasRoadmap: Boolean(roadmap), projectCount: Math.min(projectCount, 6) };
}

export function relativeDay(date: Date) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 24 * 60 * 60 * 1000;
  const time = date.getTime();
  if (time >= startOfToday) {
    return `Today, ${date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}`;
  }
  if (time >= startOfToday - day) return "Yesterday";
  const days = Math.ceil((startOfToday - time) / day);
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en", { day: "numeric", month: "short", year: date.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}
