import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  FolderKanban,
  Map,
  MessageCircle,
  Sparkles,
  SquareChartGantt,
} from "lucide-react";
import { beginAnalysis } from "@/app/actions/career";
import { buttonVariants } from "@/components/ui/button";
import { PROJECT_STATUS, SeverityChip, type ProjectStatus } from "@/components/ui/chips";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineHelp } from "@/components/ui/inline-help";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatCard } from "@/components/ui/stat-card";
import { ALIGNMENT_DISCLAIMER } from "@/lib/career/alignment";
import { readGaps, readSnapshot, readStringList } from "@/lib/career/read";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

function relative(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return date.toLocaleDateString("en", { day: "numeric", month: "short" });
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const notice = (await searchParams).notice;
  const user = await requireUser();
  const [report, roadmap, analysis, projects, conversation] = await Promise.all([
    prisma.careerReport.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.roadmap.findFirst({
      where: { userId: user.id, isCurrent: true },
      include: { phases: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.analysis.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, status: true, updatedAt: true, roadmapId: true },
    }),
    prisma.conversation.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
  ]);

  if (!report && analysis && (analysis.status === "QUEUED" || analysis.status === "PROCESSING")) {
    redirect(`/analysis/${analysis.id}`);
  }

  const snapshot = report ? readSnapshot(report.snapshot) : null;
  const gaps = report ? readGaps(report.gaps).gaps : [];
  const topGap = [...gaps].sort((a, b) => a.priority - b.priority)[0] ?? gaps[0];
  const phases = roadmap?.phases ?? [];
  const donePhases = phases.filter((phase) => phase.completedAt).length;
  const nextPhase = phases.find((phase) => !phase.completedAt);
  const firstName = user.name?.split(" ")[0] || "there";
  const counts = {
    NOT_STARTED: projects.filter((project) => project.status === "NOT_STARTED").length,
    IN_PROGRESS: projects.filter((project) => project.status === "IN_PROGRESS").length,
    COMPLETED: projects.filter((project) => project.status === "COMPLETED").length,
  };
  const inProgress = projects.find((project) => project.status === "IN_PROGRESS");
  const lastProject = projects[0];

  // Choose one next step from real data.
  let next: { eyebrow: string; title: string; detail: string; href: string; cta: string } | null = null;
  if (report && nextPhase) {
    const topics = readStringList(nextPhase.topics).length;
    next = {
      eyebrow: `Roadmap · Phase ${nextPhase.sortOrder} of ${phases.length}`,
      title: `Work on ${nextPhase.title}`,
      detail: topics
        ? `${topics} topics to cover · ${nextPhase.duration}. ${nextPhase.objective}`
        : `${nextPhase.duration}. ${nextPhase.objective}`,
      href: `/dashboard/roadmap?phase=${nextPhase.id}`,
      cta: "Continue this phase",
    };
  } else if (report && inProgress) {
    next = {
      eyebrow: "Project in progress",
      title: inProgress.title,
      detail: "Finish it and it becomes evidence you can point to on your resume.",
      href: `/dashboard/projects/${inProgress.id}`,
      cta: "Open project",
    };
  } else if (report && phases.length && donePhases === phases.length) {
    next = {
      eyebrow: "Roadmap complete",
      title: "You finished every phase.",
      detail: "Run a fresh analysis so Aaroh can see your new evidence and update your report.",
      href: "/dashboard/report",
      cta: "Review your report",
    };
  } else if (report) {
    next = {
      eyebrow: "Your report",
      title: topGap ? `Close your top gap: ${topGap.skill}` : "Read your career report",
      detail: topGap?.recommendedAction ?? "See your strengths, gaps and possible paths.",
      href: "/dashboard/report?tab=gaps",
      cta: "See what to do",
    };
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="animate-fade-up">
        <p className="text-caption font-medium tracking-[0.16em] text-primary uppercase">Home</p>
        <h1 className="mt-1.5 text-h1 sm:text-[2.5rem]">
          {greeting()}, {firstName}.
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {snapshot?.primaryProfile || "The next useful step is the one that closes a real gap."}
        </p>
      </header>

      {notice ? (
        <p role="status" className="mt-5 flex items-start gap-2 rounded-xl bg-warning-soft px-4 py-3 text-small text-warning-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      ) : null}

      {!report ? (
        <EmptyState
          className="mt-8"
          icon={analysis?.status === "FAILED" ? AlertCircle : Sparkles}
          title={analysis?.status === "FAILED" ? "Your last analysis didn't finish" : "Let's build your career report"}
          description={
            analysis?.status === "FAILED"
              ? "Nothing you entered is lost. Open the analysis to see what happened and retry."
              : "Aaroh will read your profile and write an honest report, alternative paths and a roadmap. It takes about 1–2 minutes."
          }
          action={
            analysis?.status === "FAILED" ? (
              <Link href={`/analysis/${analysis.id}`} className={cn(buttonVariants({ size: "pill" }))}>
                View analysis
                <ArrowRight aria-hidden="true" />
              </Link>
            ) : (
              <form action={beginAnalysis}>
                <button className={cn(buttonVariants({ size: "pill" }))} type="submit">
                  <Sparkles aria-hidden="true" />
                  Start analysis
                </button>
              </form>
            )
          }
        />
      ) : (
        <>
          {next ? (
            <section
              aria-labelledby="next-step"
              className="mt-8 animate-fade-up overflow-hidden rounded-panel bg-primary text-primary-foreground shadow-[var(--shadow-raised)]"
            >
              <div className="relative p-6 sm:p-8">
                <svg viewBox="0 0 400 120" className="pointer-events-none absolute right-0 bottom-0 h-28 w-80 opacity-15" aria-hidden="true">
                  <path d="M0 120 L120 30 L190 80 L280 10 L400 120 Z" fill="var(--sand)" />
                </svg>
                <p className="text-caption font-medium tracking-[0.16em] text-sand-soft uppercase">Your next step · {next.eyebrow}</p>
                <h2 id="next-step" className="mt-2 max-w-2xl text-h1 text-white">
                  {next.title}
                </h2>
                <p className="mt-2 max-w-2xl text-small leading-6 text-white/85">{next.detail}</p>
                <Link
                  href={next.href}
                  className={cn(buttonVariants({ size: "pill" }), "relative mt-6 bg-sand-soft text-forest hover:bg-sand")}
                >
                  {next.cta}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </section>
          ) : null}

          <section aria-label="Your progress" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Career alignment"
              href="/dashboard/report"
              help={
                <InlineHelp label="How is alignment calculated?">
                  <p className="font-medium">An internal estimate</p>
                  <p className="mt-1 text-muted-foreground">{ALIGNMENT_DISCLAIMER}</p>
                </InlineHelp>
              }
            >
              <div className="flex items-center gap-4">
                <ProgressRing value={report.alignmentScore} size={84} stroke={8} label={`Alignment estimate ${report.alignmentScore} percent`} />
                <p className="min-w-0 text-small leading-5">
                  with <span className="font-medium">{snapshot?.careerGoal}</span>
                </p>
              </div>
              <p className="mt-3 text-caption text-muted-foreground">Estimate, not a hiring prediction.</p>
            </StatCard>

            <StatCard label="Roadmap" href="/dashboard/roadmap">
              {phases.length ? (
                <>
                  <p className="font-serif text-[2rem] leading-none">
                    {donePhases}
                    <span className="text-h3 text-muted-foreground"> of {phases.length}</span>
                  </p>
                  <p className="mt-1 text-small text-muted-foreground">phases complete</p>
                  <ProgressBar value={donePhases} max={phases.length} label="Roadmap phases complete" className="mt-4" />
                </>
              ) : (
                <p className="text-small text-muted-foreground">Your roadmap appears after analysis.</p>
              )}
            </StatCard>

            <StatCard label="Top gap" href="/dashboard/report?tab=gaps">
              {topGap ? (
                <>
                  <p className="font-serif text-h2 leading-tight">{topGap.skill}</p>
                  <SeverityChip severity={topGap.severity} className="mt-2" />
                  <p className="mt-3 line-clamp-3 text-small text-muted-foreground">{topGap.recommendedAction}</p>
                </>
              ) : (
                <p className="text-small text-muted-foreground">No critical gap recorded.</p>
              )}
            </StatCard>

            <StatCard label="Projects" href="/dashboard/projects">
              {projects.length ? (
                <ul className="space-y-2">
                  {(Object.keys(counts) as ProjectStatus[]).map((status) => {
                    const Icon = PROJECT_STATUS[status].icon;
                    return (
                      <li key={status} className="flex items-center justify-between gap-2 text-small">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="size-4" aria-hidden="true" />
                          {PROJECT_STATUS[status].label}
                        </span>
                        <span className="font-serif text-h3">{counts[status]}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-small text-muted-foreground">Recommended projects appear with your roadmap.</p>
              )}
            </StatCard>
          </section>
        </>
      )}

      <section aria-labelledby="recent" className="mt-8">
        <h2 id="recent" className="text-h2">
          Continue where you left off
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {conversation ? (
            <RecentItem
              href={`/dashboard/chat/${conversation.id}`}
              icon={MessageCircle}
              label="Last conversation"
              title={conversation.title}
              meta={relative(conversation.updatedAt)}
            />
          ) : null}
          {lastProject ? (
            <RecentItem
              href={`/dashboard/projects/${lastProject.id}`}
              icon={FolderKanban}
              label={`Project · ${PROJECT_STATUS[lastProject.status].label}`}
              title={lastProject.title}
              meta={`Updated ${relative(lastProject.updatedAt)}`}
            />
          ) : null}
          {report ? (
            <RecentItem
              href="/dashboard/report"
              icon={SquareChartGantt}
              label="Career report"
              title={snapshot?.careerGoal ?? "Your report"}
              meta={`Generated ${relative(report.createdAt)}`}
            />
          ) : null}
          {nextPhase && !conversation ? (
            <RecentItem
              href={`/dashboard/roadmap?phase=${nextPhase.id}`}
              icon={Map}
              label={`Roadmap · Phase ${nextPhase.sortOrder}`}
              title={nextPhase.title}
              meta={nextPhase.duration}
            />
          ) : null}
        </ul>
        <Link
          href="/dashboard/chat"
          className="mt-4 flex items-center justify-between gap-4 rounded-card border border-border bg-secondary/60 px-5 py-4 transition-colors hover:border-primary/30"
        >
          <span className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <MessageCircle className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-serif text-h3">Ask Aaroh what to do next</span>
              <span className="block text-small text-muted-foreground">It already knows your report, roadmap and projects.</span>
            </span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

function RecentItem({
  href,
  icon: Icon,
  label,
  title,
  meta,
}: {
  href: string;
  icon: typeof Map;
  label: string;
  title: string;
  meta: string;
}) {
  return (
    <li>
      <Link href={href} className="surface flex h-full items-start gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-raised)]">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-caption text-muted-foreground">{label}</span>
          <span className="mt-0.5 block truncate font-medium">{title}</span>
          <span className="mt-0.5 block text-caption text-muted-foreground">{meta}</span>
        </span>
      </Link>
    </li>
  );
}
