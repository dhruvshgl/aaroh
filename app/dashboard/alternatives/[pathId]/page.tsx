import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FlaskConical, Footprints } from "lucide-react";
import { DifficultyMeter, FitChip } from "@/components/ui/chips";
import { ProgressBar } from "@/components/ui/progress-bar";
import { readStringList } from "@/lib/career/read";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function PathPage({ params }: { params: Promise<{ pathId: string }> }) {
  const user = await requireUser();
  const { pathId } = await params;
  const path = await prisma.careerPath.findFirst({ where: { id: pathId, userId: user.id } });
  if (!path) notFound();
  const transferable = readStringList(path.transferableSkills);
  const missing = readStringList(path.missingSkills);
  const steps = readStringList(path.transitionPath);
  const experiments = readStringList(path.experiments);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/alternatives" className="inline-flex min-h-10 items-center gap-1.5 text-small font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All paths
      </Link>
      <article className="mt-2 animate-fade-up">
        <p className="text-caption font-medium tracking-[0.16em] text-primary uppercase">A possibility to explore</p>
        <h1 className="mt-1.5 text-h1 sm:text-[2.5rem]">{path.roleName}</h1>
        <div className="surface mt-5 p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-small text-muted-foreground">Fit estimate</p>
              <p className="font-serif text-[2.5rem] leading-none text-primary">{path.fitScore}%</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <FitChip label={path.fitLabel} score={path.fitScore} />
              <DifficultyMeter difficulty={path.difficulty} />
            </div>
          </div>
          <ProgressBar value={path.fitScore} label="Fit estimate" tone="gold" className="mt-4" />
          <p className="mt-4 leading-7">{path.summary}</p>
        </div>

        <section className="mt-8">
          <h2 className="text-h2">Why Aaroh suggested it</h2>
          <p className="mt-2 leading-7 text-muted-foreground">{path.whyIdentified}</p>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <section className="surface p-5">
            <h2 className="font-serif text-h3">Strengths you&apos;d bring</h2>
            {transferable.length ? (
              <ul className="mt-3 space-y-2">
                {transferable.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-small">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-small text-muted-foreground">None recorded.</p>
            )}
          </section>
          <section className="surface p-5">
            <h2 className="font-serif text-h3">Skills you&apos;d need</h2>
            {missing.length ? (
              <ul className="mt-3 space-y-2">
                {missing.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-small">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-small text-muted-foreground">None recorded.</p>
            )}
          </section>
        </div>

        {experiments.length ? (
          <section className="mt-8 rounded-card border border-gold/40 bg-sand-soft/40 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-h2">
              <FlaskConical className="size-5 text-warning-foreground" aria-hidden="true" />
              Try this small experiment
            </h2>
            <p className="mt-1 text-small text-muted-foreground">A low-cost way to find out if this possibility suits you, before changing anything big.</p>
            <ul className="mt-4 space-y-3">
              {experiments.map((item) => (
                <li key={item} className="rounded-xl bg-card p-3 text-small leading-6 ring-1 ring-border">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {steps.length ? (
          <section className="mt-8">
            <h2 className="text-h2">If you decide to pursue it</h2>
            <ol className="mt-3 space-y-3">
              {steps.map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-caption font-semibold text-primary">{index + 1}</span>
                  <span className="pt-0.5 text-small leading-6">{item}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="mt-8 flex gap-3 rounded-card bg-primary p-5 text-primary-foreground">
          <Footprints className="mt-0.5 size-5 shrink-0 text-sand-soft" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-h3 text-white">Next step</h2>
            <p className="mt-1 text-small leading-6 text-white/90">{path.nextStep}</p>
          </div>
        </section>
      </article>
    </div>
  );
}
