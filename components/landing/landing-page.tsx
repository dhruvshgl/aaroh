import Link from "next/link";
import { ArrowRight, ClipboardList, FileSearch, Mountain } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MountainScene } from "@/components/brand/mountain";
import { SampleReport } from "@/components/landing/sample-report";
import { BASIS, BasisChip, type BasisKey } from "@/components/ui/chips";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  ["How it works", "#how-it-works"],
  ["Features", "#features"],
  ["Honesty", "#trust"],
  ["Pricing", "#pricing"],
];

const steps = [
  {
    icon: ClipboardList,
    title: "Tell us about you",
    copy: "Your background, your goal, and your resume if you have one. About five minutes.",
  },
  {
    icon: FileSearch,
    title: "Get your honest report",
    copy: "What you have shown, what is missing, and what is still uncertain — labelled clearly.",
  },
  {
    icon: Mountain,
    title: "Follow a plan that proves it",
    copy: "Phases and projects aimed at your real gaps, so each step leaves evidence behind.",
  },
];

const features = [
  ["Personalised career analysis", "Aaroh reads your experience, skills, and ambitions together, then says what they add up to."],
  ["Skill gap insights", "Every gap explains why it matters, what evidence exists today, and the next useful action."],
  ["Career roadmaps", "The plan is sequenced around your gaps, with projects that can become resume evidence."],
  ["Ongoing AI support", "Ask why a gap is there, what to do with ten hours a week, or whether another path fits better."],
];

const trustExamples: Record<BasisKey, string> = {
  fact: "“Built a React dashboard used by 3 teams.”",
  inference: "Likely comfortable with component design.",
  recommendation: "Ship one project with a real backend next.",
  uncertain: "No evidence yet of working with large datasets.",
};

export function LandingPage() {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Sections" className="hidden items-center gap-6 text-small text-muted-foreground md:flex">
            {nav.map(([label, href]) => (
              <a key={label} href={href} className="rounded-md hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "pill-sm" }))}>
              Log in
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ size: "pill-sm" }))}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="animate-fade-up">
            <p className="text-caption font-medium tracking-[0.18em] text-primary uppercase">An honest AI career consultant</p>
            <h1 className="mt-4 max-w-xl text-[2.75rem] leading-[1.05] text-balance sm:text-display">
              Know where you stand. Know what to do next.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Aaroh reads your background and goal, tells you honestly how close you are, and builds a plan to close the gap.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={cn(buttonVariants({ size: "pill" }), "h-12 px-6 text-base")}>
                Get started — it&apos;s free
                <ArrowRight aria-hidden="true" />
              </Link>
              <SampleReport className={cn(buttonVariants({ variant: "outline", size: "pill" }), "h-12 bg-card px-6 text-base")}>
                See a sample report
              </SampleReport>
            </div>
            <dl className="mt-10 grid grid-cols-1 gap-4 border-t border-border pt-6 text-small sm:grid-cols-3">
              {[
                ["Evidence first", "Gaps come from what you have shown"],
                ["A real plan", "Phases, projects, and proof"],
                ["Still there", "A consultant that keeps your context"],
              ].map(([title, copy]) => (
                <div key={title}>
                  <dt className="font-medium">{title}</dt>
                  <dd className="mt-1 text-muted-foreground">{copy}</dd>
                </div>
              ))}
            </dl>
          </div>
          <MountainScene className="shadow-[var(--shadow-raised)]" />
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-caption font-medium tracking-[0.16em] text-primary uppercase">How it works</p>
          <h2 className="mt-2 text-h1">Three steps, no guesswork.</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="surface relative p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-caption font-medium tracking-widest text-muted-foreground">STEP {index + 1}</span>
                  </div>
                  <h3 className="mt-4 font-serif text-h2">{step.title}</h3>
                  <p className="mt-2 text-small leading-6 text-muted-foreground">{step.copy}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-caption font-medium tracking-[0.16em] text-primary uppercase">Features</p>
          <h2 className="mt-2 text-h1">Everything points at your next step.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map(([title, copy]) => (
              <article key={title} className="surface p-5">
                <h3 className="font-serif text-h3 leading-snug">{title}</h3>
                <p className="mt-2 text-small leading-6 text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="trust" className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-caption font-medium tracking-[0.16em] text-primary uppercase">Honesty built in</p>
            <h2 className="mt-2 text-h1">Aaroh looks past the resume.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              A listed skill is not the same as a skill you have used to ship something. Every statement in your report carries one of four labels, so you always know how much weight to give it.
            </p>
          </div>
          <ul className="grid gap-3">
            {(Object.keys(BASIS) as BasisKey[]).map((key) => (
              <li key={key} className="surface flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="sm:w-40">
                  <BasisChip basis={key} />
                </div>
                <div className="min-w-0">
                  <p className="text-small">{BASIS[key].description}</p>
                  <p className="mt-0.5 text-caption text-muted-foreground italic">e.g. {trustExamples[key]}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="rounded-panel bg-primary px-6 py-10 text-primary-foreground sm:px-10">
            <p className="text-caption font-medium tracking-[0.16em] text-sand-soft uppercase">Pricing · early access</p>
            <h2 className="mt-3 max-w-2xl text-h1 text-white">Free while Aaroh is in early access.</h2>
            <p className="mt-4 max-w-2xl text-white/85">
              There is no course marketplace and no paid placement behind the advice. Up to five analyses a day.
            </p>
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "pill" }), "mt-8 h-12 bg-white px-6 text-base text-primary hover:bg-white/90")}
            >
              Start your career analysis
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo compact />
          <p className="text-caption tracking-[0.16em] text-muted-foreground uppercase">Insight today. A brighter tomorrow.</p>
          <p className="font-serif text-lg text-primary">Better careers, brighter tomorrows</p>
        </div>
      </footer>
    </div>
  );
}
