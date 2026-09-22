import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { MountainScene } from "@/components/brand/mountain";
import { WatchDemo } from "@/components/landing/watch-demo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  ["How it works", "#how-it-works"],
  ["Features", "#features"],
  ["Pricing", "#pricing"],
  ["Resources", "#resources"],
];

const features = [
  ["Personalized career analysis", "Aaroh reads your experience, skills, and ambitions together, then says what they add up to."],
  ["Skill gap insights", "Every gap explains why it matters, what evidence exists today, and the next useful action."],
  ["Career roadmaps", "The plan is sequenced around your gaps, with projects that can become resume evidence."],
  ["Ongoing AI support", "Ask why a gap is there, what to do with ten hours a week, or whether another path fits better."],
];

const journey = ["Understand", "Plan", "Learn", "Build", "Grow"];

export function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {nav.map(([label, href]) => (
              <a key={label} href={href} className="hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden px-3 text-sm sm:inline">
              Log in
            </Link>
            <Link href="/signup" className={cn(buttonVariants(), "h-10 rounded-full px-4")}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <p className="text-sm tracking-[0.18em] text-primary uppercase">Your journey. A higher version of you.</p>
            <h1 className="mt-4 max-w-xl text-5xl leading-[1.05] text-balance sm:text-6xl">
              Your career with clarity.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Aaroh helps you understand your strengths, explore opportunities, and build a personalized path to your goals.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={cn(buttonVariants(), "h-12 rounded-full px-6 text-base")}>
                Get Started
              </Link>
              <WatchDemo className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-card px-6 text-base">
                Watch Demo
              </WatchDemo>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-border pt-6 text-sm">
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
          <MountainScene />
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map(([title, copy]) => (
              <article key={title} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-2xl leading-tight">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-sm tracking-[0.16em] text-gold uppercase">How Aaroh works</p>
          <h2 className="mt-3 text-4xl">Understand, then move.</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-5">
            {journey.map((step, index) => (
              <li key={step} className="rounded-3xl bg-primary px-4 py-6 text-primary-foreground">
                <span className="text-xs tracking-widest text-gold">0{index + 1}</span>
                <p className="mt-3 font-serif text-2xl">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="resources" className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl">Aaroh looks past the resume.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              A listed skill is not the same as a skill you have used to ship something. Aaroh keeps four labels in view: what you stated, what can be inferred, what it recommends, and what it cannot know yet.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              ["Fact", "What your resume or your own words actually say."],
              ["Inference", "A reasonable reading, marked as a reading."],
              ["Recommendation", "The next step, and why it is next."],
              ["Uncertainty", "The places where the evidence is too thin to pretend."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10">
            <p className="text-sm tracking-[0.16em] text-gold uppercase">Early access</p>
            <h2 className="mt-3 max-w-2xl text-4xl text-white">Your next career move starts with understanding where you are.</h2>
            <p className="mt-4 max-w-2xl text-white/75">
              Aaroh is free while the first version is in early access. There is no course marketplace and no paid placement behind the advice.
            </p>
            <Link href="/signup" className={cn(buttonVariants(), "mt-8 h-12 rounded-full bg-white px-6 text-primary hover:bg-white/90")}>
              Start your career analysis
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo compact />
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Insight today. A brighter tomorrow.</p>
          <p className="font-serif text-lg italic text-primary">Better careers, brighter tomorrows</p>
        </div>
      </footer>
    </div>
  );
}
