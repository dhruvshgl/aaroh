"use client";

import { useState } from "react";
import Link from "next/link";
import { beginAnalysis } from "@/app/actions/career";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALIGNMENT_DISCLAIMER } from "@/lib/career/alignment";
import { reportSummary } from "@/lib/report/summary";

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

export function ReportView({
  name,
  score,
  explanation,
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
}: {
  name: string;
  score: number;
  explanation: string;
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
}) {
  const [copied, setCopied] = useState(false);
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  async function share() {
    const text = reportSummary({
      name,
      score,
      snapshot,
      gaps: gaps.map((gap) => ({ skill: gap.skill })),
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl">Your Career Report</h1>
          <p className="mt-2 text-muted-foreground">A personalized analysis of your current profile and career direction.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => void share()}>
            {copied ? "Copied" : "Share"}
          </Button>
          <a href="/api/report/pdf" className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-sm text-primary-foreground">
            Download PDF
          </a>
          <form action={beginAnalysis}>
            <Button variant="outline" className="rounded-full" type="submit">
              Re-analyze
            </Button>
          </form>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="h-auto w-full flex-wrap justify-start rounded-full bg-secondary p-1">
          {["overview", "skills", "paths", "opportunities", "resume"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="rounded-full capitalize">
              {tab === "paths" ? "Career Paths" : tab === "resume" ? "Resume Insights" : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-border bg-card p-5">
              <h2 className="text-2xl">Career snapshot</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">Current role</dt>
                  <dd className="mt-1 font-medium">{snapshot.currentRole}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">Experience</dt>
                  <dd className="mt-1 font-medium">{snapshot.experience}</dd>
                </div>
                {snapshot.location ? (
                  <div>
                    <dt className="text-xs tracking-wide text-muted-foreground uppercase">Based in</dt>
                    <dd className="mt-1 font-medium">{snapshot.location}</dd>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">Career goal</dt>
                  <dd className="mt-1 font-medium">{snapshot.careerGoal}</dd>
                </div>
              </dl>
              {snapshot.primaryProfile ? <p className="mt-4 leading-7 text-muted-foreground">{snapshot.primaryProfile}</p> : null}
            </article>
            <article className="rounded-3xl border border-border bg-card p-5">
              <h2 className="text-2xl">Career readiness</h2>
              <div className="mt-4 flex items-center gap-4">
                <svg viewBox="0 0 120 120" className="size-32">
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--muted)" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="66" textAnchor="middle" fontSize="22" fill="var(--foreground)">
                    {score}%
                  </text>
                </svg>
                <div>
                  <p className="font-medium">Aligned with {snapshot.careerGoal}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{explanation}</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">{ALIGNMENT_DISCLAIMER}</p>
            </article>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <CardList title="Key strengths" items={strengths.map((item) => ({ title: item.title, detail: item.evidence, meta: item.basis }))} />
            <CardList title="Key gaps" items={gaps.map((item) => ({ title: item.skill, detail: item.whyItMatters, meta: item.severity }))} />
            <CardList title="Opportunities" items={paths.map((item) => ({ title: item.roleName, detail: item.whyIdentified, meta: `${item.fitScore}% · ${item.fitLabel}` }))} />
          </div>
        </TabsContent>

        <TabsContent value="skills" className="mt-5 grid gap-3">
          {skills.length === 0 ? <Empty label="Skill evidence will appear after analysis." /> : null}
          {skills.map((skill) => (
            <article key={skill.name} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl">{skill.name}</h2>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">{skill.depth} · {skill.relevance} · {skill.source.replace("_", " ")}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{skill.evidence}</p>
            </article>
          ))}
        </TabsContent>

        <TabsContent value="paths" className="mt-5 grid gap-3 md:grid-cols-2">
          {paths.map((path) => (
            <Link key={path.id} href={`/dashboard/alternatives/${path.id}`} className="rounded-3xl border border-border bg-card p-5 hover:border-primary/40">
              <p className="text-sm text-primary">{path.fitScore}% · {path.fitLabel}</p>
              <h2 className="mt-1 text-2xl">{path.roleName}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{path.whyIdentified}</p>
            </Link>
          ))}
        </TabsContent>

        <TabsContent value="opportunities" className="mt-5 space-y-4">
          {goalSummary ? <p className="leading-7 text-muted-foreground">{goalSummary}</p> : null}
          <div className="grid gap-4 md:grid-cols-3">
            <CardList title="You already have" items={alreadyHave.map((item) => ({ title: item, detail: "", meta: "" }))} />
            <CardList title="Strengthen" items={needToStrengthen.map((item) => ({ title: item, detail: "", meta: "" }))} />
            <CardList title="Limited evidence" items={limitedEvidence.map((item) => ({ title: item, detail: "", meta: "" }))} />
          </div>
          {gaps.map((gap) => (
            <article key={gap.skill} className="rounded-3xl border border-border bg-card p-5">
              <h2 className="text-2xl">{gap.skill}</h2>
              <p className="mt-2 text-sm"><span className="font-medium">Why it matters. </span>{gap.whyItMatters}</p>
              <p className="mt-2 text-sm"><span className="font-medium">Current evidence. </span>{gap.currentEvidence}</p>
              <p className="mt-2 text-sm"><span className="font-medium">Needed level. </span>{gap.requiredCapability}</p>
              <p className="mt-2 text-sm"><span className="font-medium">Next action. </span>{gap.recommendedAction}</p>
            </article>
          ))}
        </TabsContent>

        <TabsContent value="resume" className="mt-5 space-y-3">
          {insights.length === 0 ? <Empty label="Resume insights appear when a resume was part of the analysis." /> : null}
          {insights.map((insight) => (
            <article key={insight.title} className="rounded-3xl border border-border bg-card p-5">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{insight.basis}</p>
              <h2 className="mt-1 text-2xl">{insight.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.detail}</p>
            </article>
          ))}
          {recommendations.map((item) => (
            <article key={item.title} className="rounded-3xl bg-secondary p-5">
              <h2 className="text-xl">{item.title}</h2>
              <p className="mt-2 text-sm leading-6">{item.detail}</p>
            </article>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CardList({ title, items }: { title: string; items: { title: string; detail: string; meta: string }[] }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5">
      <h2 className="text-2xl">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.length === 0 ? <li className="text-sm text-muted-foreground">Nothing recorded yet.</li> : null}
        {items.map((item) => (
          <li key={item.title}>
            <p className="font-medium">{item.title}</p>
            {item.meta ? <p className="text-xs text-primary">{item.meta}</p> : null}
            {item.detail ? <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p> : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">{label}</p>;
}
