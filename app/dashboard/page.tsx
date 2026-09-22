import Link from "next/link";
import { redirect } from "next/navigation";
import { beginAnalysis } from "@/app/actions/career";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { readGaps, readSnapshot } from "@/lib/career/read";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const notice = (await searchParams).notice;
  const user = await requireUser();
  const [report, roadmap, analysis] = await Promise.all([
    prisma.careerReport.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.roadmap.findFirst({
      where: { userId: user.id, isCurrent: true },
      include: { phases: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.analysis.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!report && analysis && (analysis.status === "QUEUED" || analysis.status === "PROCESSING")) {
    redirect(`/analysis/${analysis.id}`);
  }

  const snapshot = report ? readSnapshot(report.snapshot) : null;
  const gaps = report ? readGaps(report.gaps).gaps : [];
  const nextPhase = roadmap?.phases.find((phase) => !phase.completedAt) ?? roadmap?.phases[0];
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm tracking-[0.16em] text-primary uppercase">Home</p>
      <h1 className="mt-2 text-4xl">Hello, {firstName}.</h1>
      {notice ? <p className="mt-3 rounded-2xl bg-secondary px-4 py-3 text-sm">{notice}</p> : null}
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {snapshot?.primaryProfile || "Your career profile is ready. The next useful step is the one that closes a real gap."}
      </p>

      {!report ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-border bg-card p-6">
          <h2 className="text-2xl">Your report is not ready yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {analysis?.status === "FAILED"
              ? analysis.error || "The last analysis did not finish."
              : "Start an analysis when you are ready."}
          </p>
          <div className="mt-4 flex gap-3">
            {analysis?.status === "FAILED" ? (
              <Link href={`/analysis/${analysis.id}`} className={cn(buttonVariants(), "rounded-full")}>
                View analysis
              </Link>
            ) : (
              <form action={beginAnalysis}>
                <button className={cn(buttonVariants(), "rounded-full")} type="submit">
                  Start analysis
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/report" className="rounded-3xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Career alignment</p>
            <p className="mt-2 font-serif text-5xl">{report.alignmentScore}%</p>
            <p className="mt-2 text-sm">{snapshot?.careerGoal}</p>
          </Link>
          <Link href="/dashboard/roadmap" className="rounded-3xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Next phase</p>
            <h2 className="mt-2 text-2xl">{nextPhase?.title ?? "Roadmap"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{nextPhase?.duration}</p>
          </Link>
          <Link href="/dashboard/report" className="rounded-3xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Top gap</p>
            <h2 className="mt-2 text-2xl">{gaps[0]?.skill ?? "No critical gap yet"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{gaps[0]?.recommendedAction}</p>
          </Link>
        </div>
      )}

      <Link href="/dashboard/chat" className="mt-6 block rounded-[2rem] bg-primary px-6 py-5 text-primary-foreground">
        <p className="text-sm text-[#e7d3a8]">Ongoing support</p>
        <p className="mt-1 font-serif text-3xl text-white">Ask Aaroh what to do next.</p>
      </Link>
    </div>
  );
}
