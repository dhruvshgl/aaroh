"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Copy,
  Download,
  Loader2,
  Map,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { beginAnalysis } from "@/app/actions/career";
import { Button } from "@/components/ui/button";
import { BasisChip, DepthChip, DifficultyMeter, FitChip, SeverityChip, TrustLegend } from "@/components/ui/chips";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineHelp } from "@/components/ui/inline-help";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionCard } from "@/components/ui/section-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALIGNMENT_DISCLAIMER, ALIGNMENT_WEIGHTS } from "@/lib/career/alignment";
import { reportSummary } from "@/lib/report/summary";
import { cn } from "@/lib/utils";

type Strength = { title: string; evidence: string; basis: string };
type Gap = {
  skill: string;
  whyItMatters: string;
  currentEvidence: string;
  requiredCapability: string;
  severity: string;
  recommendedAction: string;
  basis: string;
};
type Skill = { name: string; category: string; depth: string; relevance: string; source: string; evidence: string };
type PathCard = { id: string; roleName: string; fitScore: number; fitLabel: string; whyIdentified: string; difficulty: string };
type Snapshot = { currentRole: string; experience: string; location: string; primaryProfile: string; careerGoal: string };
type Breakdown = { skill: number; experience: number; goal: number; evidence: number; gapPenalty: number };
type PhaseRef = { id: string; title: string; sortOrder: number; keywords: string[] };

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "skills", label: "Skills" },
  { value: "gaps", label: "Gaps & next steps" },
  { value: "paths", label: "Career paths" },
  { value: "resume", label: "Resume insights" },
] as const;

const RELEVANCE_ORDER: Record<string, number> = { core: 0, supporting: 1, unrelated: 2 };
const DEPTH_ORDER: Record<string, number> = { production: 0, practiced: 1, listed: 2 };
const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function normaliseTab(tab: string) {
  if (tab === "opportunities") return "gaps";
  return TABS.some((item) => item.value === tab) ? tab : "overview";
}

function phaseFor(skill: string, phases: PhaseRef[]) {
  const needle = skill.toLowerCase();
  return phases.find((phase) =>
    phase.keywords.some((keyword) => {
      const value = keyword.toLowerCase();
      return value.includes(needle) || (value.length > 3 && needle.includes(value));
    }),
  );
}

export function ReportView({
  name,
  initialTab,
  score,
  breakdown,
  explanation,
  targetRole,
  snapshot,
  strengths,
  gaps,
  alreadyHave,
  needToStrengthen,
  limitedEvidence,
  skills,
  goalSummary,
  paths,
  recommendations,
  insights,
  phases,
  runsLeft,
  runsLimit,
  generatedAt,
}: {
  name: string;
  initialTab: string;
  score: number;
  breakdown: Breakdown | null;
  explanation: string;
  targetRole: string | null;
  snapshot: Snapshot;
  strengths: Strength[];
  gaps: Gap[];
  alreadyHave: string[];
  needToStrengthen: string[];
  limitedEvidence: string[];
  skills: Skill[];
  goalSummary: string | null;
  paths: PathCard[];
  recommendations: { title: string; detail: string }[];
  insights: { title: string; detail: string; basis: string }[];
  phases: PhaseRef[];
  runsLeft: number;
  runsLimit: number;
  generatedAt: string;
}) {
  const [tab, setTab] = useState(() => normaliseTab(initialTab));
  const [downloading, setDownloading] = useState(false);
  const sortedGaps = useMemo(
    () => [...gaps].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 1) - (SEVERITY_ORDER[b.severity] ?? 1)),
    [gaps],
  );
  const role = targetRole || snapshot.careerGoal;

  function changeTab(next: string) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(window.history.state, "", url);
  }

  async function copySummary() {
    const text = reportSummary({ name, score, snapshot, gaps: sortedGaps.map((gap) => ({ skill: gap.skill })) });
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Summary copied", { description: "Paste it into a message or your notes." });
    } catch {
      toast.error("Couldn't copy to the clipboard.");
    }
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const response = await fetch("/api/report/pdf");
      if (!response.ok) throw new Error("failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "aaroh-career-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch {
      toast.error("The PDF couldn't be created. Try again in a moment.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-caption font-medium tracking-[0.16em] text-primary uppercase">Career report</p>
          <h1 className="mt-1.5 text-h1 sm:text-[2.5rem]">Where you stand today</h1>
          <p className="mt-2 text-small text-muted-foreground">
            Generated {generatedAt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="pill-sm" className="bg-card" onClick={() => void copySummary()}>
            <Copy aria-hidden="true" />
            Copy summary
          </Button>
          <Button size="pill-sm" onClick={() => void downloadPdf()} disabled={downloading}>
            {downloading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </Button>
          <ReanalyzeDialog runsLeft={runsLeft} runsLimit={runsLimit} />
        </div>
      </header>

      {/* Hero: alignment estimate */}
      <section aria-labelledby="alignment-title" className="surface mt-6 animate-fade-up overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10">
          <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
            <ProgressRing value={score} size={176} stroke={14} label={`Alignment estimate ${score} percent`}>
              <span>
                <span className="block font-serif text-[2.75rem] leading-none">{score}%</span>
                <span className="mt-1 block text-caption text-muted-foreground">estimate</span>
              </span>
            </ProgressRing>
          </div>
          <div className="min-w-0">
            <div className="flex items-start gap-1">
              <h2 id="alignment-title" className="text-h2">
                Aligned with <span className="text-primary">{role}</span>
              </h2>
              <InlineHelp label="How is this calculated?">
                <p className="font-medium">How this is calculated</p>
                <p className="mt-1 text-muted-foreground">
                  A weighted average of skill depth (40%), experience (25%), evidence strength (20%) and goal clarity (15%), minus a penalty for open gaps.
                </p>
              </InlineHelp>
            </div>
            <p className="mt-2 leading-7 text-muted-foreground">{explanation}</p>
            {breakdown ? <BreakdownBar breakdown={breakdown} /> : null}
            <p className="mt-4 rounded-xl bg-secondary/70 px-3 py-2 text-caption leading-5 text-muted-foreground">{ALIGNMENT_DISCLAIMER}</p>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(value) => changeTab(String(value))} className="mt-6 gap-0">
        <div className="sticky top-16 z-[5] -mx-4 bg-background/90 px-4 py-2 backdrop-blur lg:-mx-8 lg:px-8">
          <TabsList className="scrollbar-none h-auto w-full justify-start overflow-x-auto rounded-full bg-secondary p-1">
            {TABS.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="h-10 flex-none rounded-full px-4 text-small">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <SectionCard title="Career snapshot" as="article">
              <dl className="grid gap-4 sm:grid-cols-2">
                <SnapshotItem label="Current role" value={snapshot.currentRole} />
                <SnapshotItem label="Experience" value={snapshot.experience} />
                {snapshot.location ? <SnapshotItem label="Based in" value={snapshot.location} /> : null}
                <SnapshotItem label="Career goal" value={snapshot.careerGoal} wide />
              </dl>
              {snapshot.primaryProfile ? <p className="mt-4 leading-7 text-muted-foreground">{snapshot.primaryProfile}</p> : null}
            </SectionCard>
            <TrustLegend className="self-start" include={["fact", "inference", "uncertain"]} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard title="Key strengths" as="article">
              <ItemList
                empty="No strengths recorded yet."
                items={strengths.map((item) => ({
                  key: item.title,
                  title: item.title,
                  detail: item.evidence,
                  chip: <BasisChip basis={item.basis} />,
                }))}
              />
            </SectionCard>
            <SectionCard
              title="Key gaps"
              as="article"
              action={
                gaps.length ? (
                  <button type="button" onClick={() => changeTab("gaps")} className="text-small font-medium text-primary hover:underline">
                    See all
                  </button>
                ) : null
              }
            >
              <ItemList
                empty="No critical gap recorded."
                items={sortedGaps.slice(0, 4).map((item) => ({
                  key: item.skill,
                  title: item.skill,
                  detail: item.whyItMatters,
                  chip: <SeverityChip severity={item.severity} />,
                }))}
              />
            </SectionCard>
            <SectionCard
              title="Possible paths"
              as="article"
              action={
                paths.length ? (
                  <button type="button" onClick={() => changeTab("paths")} className="text-small font-medium text-primary hover:underline">
                    See all
                  </button>
                ) : null
              }
            >
              <ItemList
                empty="Alternative paths appear after analysis."
                items={paths.slice(0, 3).map((item) => ({
                  key: item.id,
                  title: item.roleName,
                  detail: item.whyIdentified,
                  chip: <FitChip label={`${item.fitScore}% · ${item.fitLabel}`} score={item.fitScore} />,
                }))}
              />
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="mt-4">
          <SkillsPanel skills={skills} />
        </TabsContent>

        <TabsContent value="gaps" className="mt-4 space-y-4">
          {goalSummary ? <p className="max-w-3xl leading-7 text-muted-foreground">{goalSummary}</p> : null}
          <div className="grid gap-4 md:grid-cols-3">
            <TagGroup title="You already have" items={alreadyHave} tone="success" />
            <TagGroup title="Strengthen" items={needToStrengthen} tone="warning" />
            <TagGroup title="Limited evidence" items={limitedEvidence} tone="neutral" />
          </div>
          {sortedGaps.length === 0 ? (
            <EmptyState icon={Sparkles} title="No gaps recorded" description="Aaroh didn't find a critical gap for this goal. Keep building evidence." />
          ) : (
            <div className="space-y-3">
              <h2 className="text-h2">Gaps, most important first</h2>
              {sortedGaps.map((gap, index) => (
                <GapCard key={gap.skill} gap={gap} phase={phaseFor(gap.skill, phases)} defaultOpen={index === 0} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paths" className="mt-4">
          {paths.length === 0 ? (
            <EmptyState icon={Sparkles} title="No alternative paths yet" description="Possible paths appear after your next analysis." />
          ) : (
            <>
              <p className="mb-4 max-w-2xl text-small text-muted-foreground">
                Adjacent directions your experience could support. They are possibilities to explore, not a recommendation to switch.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {paths.map((path) => (
                  <Link
                    key={path.id}
                    href={`/dashboard/alternatives/${path.id}`}
                    className="surface group flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-raised)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-serif text-h2 leading-tight">{path.roleName}</h3>
                      <span className="font-serif text-h2 text-primary">{path.fitScore}%</span>
                    </div>
                    <ProgressBar value={path.fitScore} label={`${path.roleName} fit`} tone="gold" className="mt-3" />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <FitChip label={path.fitLabel} score={path.fitScore} />
                      <DifficultyMeter difficulty={path.difficulty} />
                    </div>
                    <p className="mt-3 text-small leading-6 text-muted-foreground">{path.whyIdentified}</p>
                    <span className="mt-auto flex items-center gap-1 pt-4 text-small font-medium text-primary">
                      Explore this possibility
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="resume" className="mt-4 space-y-4">
          {insights.length === 0 && recommendations.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No resume insights"
              description="Resume insights appear when a resume was part of the analysis. You can add one in Settings and re-analyse."
            />
          ) : null}
          {insights.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {insights.map((insight) => (
                <SectionCard key={insight.title} as="article" className="p-5">
                  <BasisChip basis={insight.basis} />
                  <h3 className="mt-2 font-serif text-h3">{insight.title}</h3>
                  <p className="mt-1 text-small leading-6 text-muted-foreground">{insight.detail}</p>
                </SectionCard>
              ))}
            </div>
          ) : null}
          {recommendations.length ? (
            <div>
              <h2 className="text-h2">Recommendations</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {recommendations.map((item) => (
                  <article key={item.title} className="rounded-card border border-primary/15 bg-depth-production-soft p-5">
                    <BasisChip basis="recommendation" />
                    <h3 className="mt-2 font-serif text-h3">{item.title}</h3>
                    <p className="mt-1 text-small leading-6">{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BreakdownBar({ breakdown }: { breakdown: Breakdown }) {
  const parts = [
    { key: "skill", label: "Skill depth", weight: ALIGNMENT_WEIGHTS.skill, value: breakdown.skill, color: "var(--primary)" },
    { key: "experience", label: "Experience", weight: ALIGNMENT_WEIGHTS.experience, value: breakdown.experience, color: "oklch(0.55 0.06 158)" },
    { key: "evidence", label: "Evidence", weight: ALIGNMENT_WEIGHTS.evidence, value: breakdown.evidence, color: "var(--gold)" },
    { key: "goal", label: "Goal clarity", weight: ALIGNMENT_WEIGHTS.goal, value: breakdown.goal, color: "var(--sand)" },
  ].map((part) => ({ ...part, points: part.value * part.weight }));
  const penalty = breakdown.gapPenalty * 0.45;

  return (
    <div className="mt-5">
      <p className="text-small font-medium">What makes up the estimate</p>
      <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {parts.map((part) => (
          <div
            key={part.key}
            className="h-full origin-left first:rounded-l-full"
            style={{ width: `${part.points}%`, background: part.color, animation: "bar-fill 700ms cubic-bezier(0.2,0.7,0.2,1) both" }}
          />
        ))}
        {penalty > 0 ? (
          <div
            className="h-full"
            style={{
              width: `${penalty}%`,
              background: "repeating-linear-gradient(135deg, var(--danger) 0 4px, var(--danger-soft) 4px 8px)",
            }}
          />
        ) : null}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-caption sm:grid-cols-3 lg:grid-cols-5">
        {parts.map((part) => (
          <li key={part.key} className="flex items-start gap-2">
            <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: part.color }} aria-hidden="true" />
            <span>
              <span className="block font-medium">{part.label}</span>
              <span className="text-muted-foreground">
                {part.value}/100 × {Math.round(part.weight * 100)}% = +{Math.round(part.points)}
              </span>
            </span>
          </li>
        ))}
        <li className="flex items-start gap-2">
          <span className="mt-1 size-2.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
          <span>
            <span className="block font-medium">Open gaps</span>
            <span className="text-muted-foreground">−{Math.round(penalty)} points</span>
          </span>
        </li>
      </ul>
    </div>
  );
}

function SnapshotItem({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-caption tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function ItemList({ items, empty }: { items: { key: string; title: string; detail: string; chip?: React.ReactNode }[]; empty: string }) {
  if (!items.length) return <p className="text-small text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{item.title}</p>
            {item.chip}
          </div>
          {item.detail ? <p className="mt-1 text-small leading-6 text-muted-foreground">{item.detail}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function TagGroup({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" | "neutral" }) {
  const dot = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-muted-foreground/50";
  return (
    <SectionCard as="article" className="p-5">
      <h3 className="flex items-center gap-2 font-serif text-h3">
        <span className={cn("size-2.5 rounded-full", dot)} aria-hidden="true" />
        {title}
      </h3>
      {items.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li key={item} className="rounded-full bg-secondary px-3 py-1 text-small">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-small text-muted-foreground">Nothing recorded.</p>
      )}
    </SectionCard>
  );
}

function GapCard({ gap, phase, defaultOpen }: { gap: Gap; phase?: PhaseRef; defaultOpen: boolean }) {
  return (
    <details className="surface group overflow-hidden" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-4 hover:bg-secondary/40">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-h3">{gap.skill}</h3>
            <SeverityChip severity={gap.severity} />
            <BasisChip basis={gap.basis} />
          </div>
          <p className="mt-1 line-clamp-1 text-small text-muted-foreground group-open:hidden">{gap.whyItMatters}</p>
        </div>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-4 border-t border-border px-5 py-4">
        <div>
          <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">Why it matters</p>
          <p className="mt-1 text-small leading-6">{gap.whyItMatters}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3">
            <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">Your evidence today</p>
            <p className="mt-1 text-small leading-6">{gap.currentEvidence}</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">Level the role expects</p>
            <p className="mt-1 text-small leading-6">{gap.requiredCapability}</p>
          </div>
        </div>
        <div className="rounded-xl border border-primary/15 bg-depth-production-soft p-4">
          <div className="flex items-center gap-2">
            <BasisChip basis="recommendation" />
            <p className="text-small font-medium text-primary">Next action</p>
          </div>
          <p className="mt-2 text-small leading-6">{gap.recommendedAction}</p>
          {phase ? (
            <Link
              href={`/dashboard/roadmap?phase=${phase.id}`}
              className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-small font-medium text-primary hover:underline"
            >
              <Map className="size-4" aria-hidden="true" />
              Covered in Phase {phase.sortOrder}: {phase.title}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </details>
  );
}

function SkillsPanel({ skills }: { skills: Skill[] }) {
  const [filter, setFilter] = useState<"all" | "core" | "supporting" | "unrelated">("all");
  const [sort, setSort] = useState<"relevance" | "depth" | "name">("relevance");

  const visible = useMemo(() => {
    const list = filter === "all" ? skills : skills.filter((skill) => skill.relevance === filter);
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "depth") return (DEPTH_ORDER[a.depth] ?? 3) - (DEPTH_ORDER[b.depth] ?? 3);
      return (RELEVANCE_ORDER[a.relevance] ?? 3) - (RELEVANCE_ORDER[b.relevance] ?? 3) || (DEPTH_ORDER[a.depth] ?? 3) - (DEPTH_ORDER[b.depth] ?? 3);
    });
  }, [skills, filter, sort]);

  if (!skills.length) {
    return <EmptyState icon={Sparkles} title="No skill evidence yet" description="Skill evidence will appear after your analysis." />;
  }

  const counts = {
    production: skills.filter((skill) => skill.depth === "production").length,
    practiced: skills.filter((skill) => skill.depth === "practiced").length,
    listed: skills.filter((skill) => skill.depth === "listed").length,
  };

  return (
    <div className="space-y-4">
      <div className="surface grid gap-3 p-4 sm:grid-cols-3">
        {(["production", "practiced", "listed"] as const).map((depth) => (
          <div key={depth} className="flex items-center gap-3">
            <DepthChip depth={depth} />
            <span className="text-small text-muted-foreground">
              <span className="font-medium text-foreground">{counts[depth]}</span>{" "}
              {depth === "production" ? "shipped for real" : depth === "practiced" ? "used in practice" : "only listed"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by relevance">
          {(["all", "core", "supporting", "unrelated"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "min-h-9 rounded-full border px-3 text-small capitalize transition-colors",
                filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
              )}
            >
              {value === "all" ? `All (${skills.length})` : value}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-small text-muted-foreground">
          Sort by
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="field h-9 w-auto py-0 text-small">
            <option value="relevance">Relevance</option>
            <option value="depth">Depth</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="surface p-5 text-small text-muted-foreground">No skills match this filter.</p>
      ) : (
        <div className="surface overflow-hidden">
          <table className="hidden w-full text-left text-small md:table">
            <thead className="border-b border-border bg-secondary/50 text-caption tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Skill</th>
                <th scope="col" className="px-4 py-3 font-medium">Depth</th>
                <th scope="col" className="px-4 py-3 font-medium">Relevance</th>
                <th scope="col" className="px-4 py-3 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((skill) => (
                <tr key={skill.name} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-caption text-muted-foreground">from {skill.source.replace("_", " ")}</p>
                  </td>
                  <td className="px-4 py-3">
                    <DepthChip depth={skill.depth} />
                  </td>
                  <td className="px-4 py-3 capitalize">{skill.relevance}</td>
                  <td className="px-4 py-3 leading-6 text-muted-foreground">{skill.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-border md:hidden">
            {visible.map((skill) => (
              <li key={skill.name} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{skill.name}</p>
                  <DepthChip depth={skill.depth} />
                </div>
                <p className="mt-1 text-caption text-muted-foreground capitalize">
                  {skill.relevance} · from {skill.source.replace("_", " ")}
                </p>
                <p className="mt-2 text-small leading-6 text-muted-foreground">{skill.evidence}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReanalyzeDialog({ runsLeft, runsLimit }: { runsLeft: number; runsLimit: number }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="pill-sm" className="bg-card" />}>
        <RotateCcw aria-hidden="true" />
        Re-analyse
      </DialogTrigger>
      <DialogContent className="rounded-card p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-h2">Run a fresh analysis?</DialogTitle>
          <DialogDescription>
            Aaroh will re-read your current profile and resume and write a new report and roadmap.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl bg-secondary/70 px-4 py-3 text-small">
          <p className="font-medium">
            {runsLeft} of {runsLimit} analyses left today
          </p>
          <p className="mt-0.5 text-muted-foreground">The daily limit resets at midnight UTC.</p>
        </div>
        <DialogFooter className="-mx-6 -mb-6 rounded-b-card border-t border-border bg-muted/50 p-4 sm:justify-end">
          <DialogClose render={<Button variant="ghost" size="pill-sm" />}>Cancel</DialogClose>
          <form action={beginAnalysis} onSubmit={() => setSubmitting(true)}>
            <Button type="submit" size="pill-sm" disabled={runsLeft === 0 || submitting} className="w-full sm:w-auto">
              {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
              {runsLeft === 0 ? "Limit reached for today" : submitting ? "Starting…" : "Start analysis"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
