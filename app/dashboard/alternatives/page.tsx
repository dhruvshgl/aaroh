import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function AlternativesPage() {
  const user = await requireUser();
  const report = await prisma.careerReport.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { paths: { orderBy: { fitScore: "desc" } } },
  });
  const paths = report?.paths ?? [];
  return (
    <div>
      <h1 className="text-4xl">Other paths worth exploring</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Based on your experience, interests, and transferable skills, these are adjacent directions. They are possibilities, not a verdict.
      </p>
      {paths.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">Alternative paths appear after your career analysis.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {paths.map((path) => (
            <Link key={path.id} href={`/dashboard/alternatives/${path.id}`} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl">{path.roleName}</h2>
                  <p className="mt-1 text-sm text-primary">{path.fitLabel}</p>
                </div>
                <p className="font-serif text-4xl">{path.fitScore}%</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{path.summary}</p>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-8 font-serif text-xl italic text-primary">Sometimes a small shift opens a much bigger future.</p>
    </div>
  );
}
