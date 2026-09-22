import Link from "next/link";
import { notFound } from "next/navigation";
import { readStringList } from "@/lib/career/read";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function PathPage({ params }: { params: Promise<{ pathId: string }> }) {
  const user = await requireUser();
  const { pathId } = await params;
  const path = await prisma.careerPath.findFirst({ where: { id: pathId, userId: user.id } });
  if (!path) notFound();
  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/dashboard/alternatives" className="text-sm text-primary">All paths</Link>
      <p className="mt-4 text-sm text-primary">{path.fitScore}% · {path.fitLabel}</p>
      <h1 className="mt-1 text-4xl">{path.roleName}</h1>
      <p className="mt-4 leading-7">{path.summary}</p>
      <section className="mt-6">
        <h2 className="text-2xl">Why Aaroh identified it</h2>
        <p className="mt-2 text-muted-foreground">{path.whyIdentified}</p>
      </section>
      <section className="mt-6">
        <h2 className="text-2xl">Existing strengths</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">{readStringList(path.transferableSkills).map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="mt-6">
        <h2 className="text-2xl">Missing skills</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">{readStringList(path.missingSkills).map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="mt-6">
        <h2 className="text-2xl">Transition path</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{readStringList(path.transitionPath).map((item) => <li key={item}>{item}</li>)}</ol>
      </section>
      <section className="mt-6">
        <h2 className="text-2xl">Suggested experiments</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">{readStringList(path.experiments).map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <p className="mt-6 text-sm"><span className="font-medium">Next step. </span>{path.nextStep}</p>
    </article>
  );
}
