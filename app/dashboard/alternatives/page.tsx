import Link from "next/link";
import { Compass } from "lucide-react";
import { PathsExplorer } from "@/components/paths/paths-explorer";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { readStringList } from "@/lib/career/read";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function AlternativesPage() {
  const user = await requireUser();
  const report = await prisma.careerReport.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { paths: { orderBy: { fitScore: "desc" } } },
  });
  const paths = report?.paths ?? [];
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Paths"
        title="Other paths worth exploring"
        description="Adjacent directions your experience, interests and transferable skills could support. Each one is a possibility to test, not a verdict or a recommendation to switch."
      />
      <div className="mt-6">
        {paths.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No paths to explore yet"
            description="Alternative paths appear after your career analysis."
            action={
              <Link href="/dashboard" className={cn(buttonVariants({ size: "pill" }))}>
                Go to dashboard
              </Link>
            }
          />
        ) : (
          <PathsExplorer
            paths={paths.map((path) => ({
              id: path.id,
              roleName: path.roleName,
              summary: path.summary,
              whyIdentified: path.whyIdentified,
              fitScore: path.fitScore,
              fitLabel: path.fitLabel,
              difficulty: path.difficulty,
              nextStep: path.nextStep,
              transferableSkills: readStringList(path.transferableSkills),
              missingSkills: readStringList(path.missingSkills),
            }))}
          />
        )}
      </div>
      <p className="mt-10 font-serif text-h3 text-primary">Sometimes a small shift opens a much bigger future.</p>
    </div>
  );
}
